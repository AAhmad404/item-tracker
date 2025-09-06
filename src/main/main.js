const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const path = require('node:path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const sqlite3 = require('sqlite3').verbose();

const mainMenu = Menu.buildFromTemplate([]);
Menu.setApplicationMenu(mainMenu);

const userDataPath = app.getPath('userData');
const resourcesPath = path.join(userDataPath, 'images', 'item-images');

// Check to see if userData directories exist
if (!fs.existsSync(userDataPath)) {
  fs.mkdirSync(userDataPath, { recursive: true });
}
if (!fs.existsSync(resourcesPath)) {
  fs.mkdirSync(resourcesPath, { recursive: true });
}

// Copy packaged DB to userData on first run so the app can write to it
const packagedDbPath = path.join(app.getAppPath(), 'src', 'main', 'database', 'database.db');
const userDbPath = path.join(userDataPath, 'database.db');
if (!fs.existsSync(userDbPath)) {
  try {
    if (fs.existsSync(packagedDbPath)) {
      fs.copyFileSync(packagedDbPath, userDbPath);
    } else {
      // If packaged DB is missing, create an empty DB file
      fs.writeFileSync(userDbPath, '');
    }
  } catch (err) {
    dialog.showErrorBox('Error preparing database', err.message);
  }
}

const db = new sqlite3.Database(userDbPath, (err) => {
  if (err) {
    dialog.showErrorBox('Error connecting to database: ', err.message);
  }
});

function saveImage(imageData, filename) {
  return new Promise((resolve, reject) => {
    let base64Data = '';

    if (imageData.startsWith('data:image/png')) {
      base64Data = imageData.replace(/^data:image\/png;base64,/, '');
    } else if (imageData.startsWith('data:image/jpeg') || imageData.startsWith('data:image/jpg')) {
      base64Data = imageData.replace(/^data:image\/jpeg;base64,/, '');
    } else {
      reject(new Error('Unsupported image format'));
      return;
    }

    const filePath = path.join(resourcesPath, filename);

    // Ensure the directory exists
    if (!fs.existsSync(resourcesPath)) {
      fs.mkdirSync(resourcesPath, { recursive: true });
    }

    fs.writeFile(filePath, base64Data, 'base64', (err) => {
      if (err) {
        reject(err);
      } else {
        // Return a file:// URL for use in the renderer
        resolve(pathToFileURL(filePath).href);
      }
    });
  });
}

// Function to update item in the database with image path
const updateItemInformation = (item, filename) => {
  return new Promise((resolve, reject) => {
    const currentDate = new Date().toISOString();

    const imagePath = filename || item.image_path;

    const query = `UPDATE items
                       SET name         = ?,
                           location     = ?,
                           count        = ?,
                           image_path   = ?,
                           date_updated = ?
                       WHERE id = ?`;
    const params = [item.name, item.location, item.count, imagePath, currentDate, item.id];

    db.run(query, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({
          id: item.id,
          name: item.name,
          location: item.location,
          count: item.count,
          image_path: imagePath,
          date_updated: currentDate,
        });
      }
    });
  });
};

// Function to add a new item to the database with optional image path
const addItemInformation = (item, filename) => {
  return new Promise((resolve, reject) => {
    const currentDate = new Date().toISOString();

    const query = `INSERT INTO items (name, location, count, image_path, date_added, date_updated)
                       VALUES (?, ?, ?, ?, ?, ?)`;
    const params = [item.name, item.location, item.count, filename || '', currentDate, currentDate];

    db.run(query, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({
          id: this.lastID,
          name: item.name,
          location: item.location,
          count: item.count,
          image_path: filename || '',
          date_created: currentDate,
          date_updated: currentDate,
        });
      }
    });
  });
};

const deleteItemFromDatabase = (itemId) => {
  return new Promise((resolve, reject) => {
    const query = 'DELETE FROM items WHERE id = ?';

    db.run(query, [itemId], function (err) {
      if (err) {
        reject({ success: false, error: err.message });
      } else {
        resolve({ success: true });
      }
    });
  });
};

ipcMain.on('show-error-dialog', (_, { message }) => {
  dialog.showErrorBox('Error', message);
});

ipcMain.on('show-success-dialog', (_, { message }) => {
  dialog.showMessageBox({
    type: 'info',
    buttons: ['OK'],
    defaultId: 0,
    title: 'Info',
    message: 'Success',
    detail: message,
  });
});

ipcMain.on('confirm-delete-item', async (event, { itemId }) => {
  const response = await dialog.showMessageBox({
    type: 'warning',
    buttons: ['Cancel', 'Delete'],
    defaultId: 1,
    title: 'Confirm Deletion',
    message: 'Are you sure you want to delete this item?',
    detail: 'This action cannot be undone.',
  });

  if (response.response === 1) {
    try {
      const deleteResult = await deleteItemFromDatabase(itemId);
      if (deleteResult.success) {
        event.sender.send('item-deleted', { success: true, itemId });
      } else {
        event.sender.send('item-deleted', { success: false, error: deleteResult.error });
      }
    } catch (error) {
      event.sender.send('item-deleted', { success: false, error: error.message });
    }
  }
});

ipcMain.on('get-search-suggestions', (event, searchText) => {
  /* SQLite query to select all columns from the 'items' table where the 'name' or 'location' contains the search text,
       ordering the results by the relevance of the search text (many letters match in the item name/location)
       in 'name' and 'location', and limiting the output to the top 5 most relevant items.
     */
  const query = `SELECT *
                   FROM items
                   WHERE name LIKE '%${searchText}%'
                      OR location LIKE '%${searchText}%'
                   ORDER BY CASE
                                WHEN name LIKE '%${searchText}%' THEN LENGTH(name) -
                                                                      LENGTH(REPLACE(LOWER(name), LOWER('${searchText}'), ''))
                                ELSE 0
                                END +
                            CASE
                                WHEN location LIKE '%${searchText}%' THEN LENGTH(location) -
                                                                          LENGTH(REPLACE(LOWER(location), LOWER('${searchText}'), ''))
                                ELSE 0
                                END DESC LIMIT 5`;

  db.all(query, (err, rows) => {
    if (err) {
      event.reply('search-suggestions', { error: err.message });
    } else {
      event.reply('search-suggestions', { data: rows });
    }
  });
});

ipcMain.on('get-recent-items', (event) => {
  const query = `SELECT *
                   FROM items
                   ORDER BY date_updated DESC LIMIT 5`;
  db.all(query, (err, rows) => {
    if (err) {
      event.reply('recent-items', { error: err.message });
    } else {
      event.reply('recent-items', { data: rows });
    }
  });
});

ipcMain.on('update-item-information', (event, { updatedItem, imageData, filename }) => {
  if (imageData) {
    saveImage(imageData, filename)
      .then((filename) => {
        updateItemInformation(updatedItem, filename)
          .then((item) => {
            event.sender.send('item-updated', { success: true, item });
          })
          .catch((error) => {
            event.sender.send('item-updated', { success: false, error });
          });
      })
      .catch((error) => {
        event.sender.send('item-updated', { success: false, error: error.message });
      });
  } else {
    updateItemInformation(updatedItem)
      .then((item) => {
        event.sender.send('item-updated', { success: true, item });
      })
      .catch((error) => {
        event.sender.send('item-updated', { success: false, error });
      });
  }
});

ipcMain.on('add-item-information', (event, { newItem, imageData, filename }) => {
  if (imageData) {
    saveImage(imageData, filename)
      .then((filename) => {
        addItemInformation(newItem, filename)
          .then((item) => {
            event.sender.send('item-added', { success: true, item });
          })
          .catch((error) => {
            event.sender.send('item-added', { success: false, error });
          });
      })
      .catch((error) => {
        event.sender.send('item-added', { success: false, error: error.message });
      });
  } else {
    addItemInformation(newItem)
      .then((item) => {
        event.sender.send('item-added', { success: true, item });
      })
      .catch((error) => {
        event.sender.send('item-added', { success: false, error });
      });
  }
});

if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 750,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const indexPath = path.join(__dirname, '../renderer/html/index.html');
  mainWindow.loadFile(indexPath);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
