export function initAddItem() {
  $('#add-button').on('click', async () => {
    const newItem = validateForm();
    if (!newItem) return;

    const itemImageEl = $('#add-item-image');
    const savedFileUrl = itemImageEl.data('saved-file-url') || '';

    // If the upload flow already saved the file, send that file URL.
    if (savedFileUrl) {
      window.electron.send('add-item-information', { newItem, imageData: '', filename: savedFileUrl });
      return;
    }

    // Otherwise, check the background-image; if it's a data URL, save it
    // here by converting to a Blob and invoking the binary save handler.
    const bg = itemImageEl.css('background-image');
    if (bg && bg !== 'none') {
      const imageUrl = bg.replace(/url\(['\"]?(.*?)['\"]?\)/, '$1');
      if (imageUrl.startsWith('data:image/')) {
        try {
          const filename = `item_image_${Date.now()}.jpg`;
          const resp = await fetch(imageUrl);
          const arrayBuffer = await resp.arrayBuffer();
          const savedFileUrl2 = await window.electron.invoke('save-image-binary', arrayBuffer, filename);
          window.electron.send('add-item-information', { newItem, imageData: '', filename: savedFileUrl2 });
          return;
        } catch (e) {
          showErrorDialog('Failed to save image; please try uploading again.');
          return;
        }
      }
    }

    // No image provided; proceed without image.
    window.electron.send('add-item-information', { newItem, imageData: '', filename: '' });
  });

  window.electron.on('item-added', (response) => {
    if (response.success) {
      showSuccessDialog('Item added successfully.');
      setTimeout(() => {
        window.navigateToHome();
        window.refreshRecentItems();
      }, 100);
    } else {
      showErrorDialog('Failed to add item. Please try again.');
    }
  });

  function validateForm() {
    const addItemNameInput = $('#add-item-name-input');
    const addItemLocationInput = $('#add-item-location-input');
    const addItemCountInput = $('#add-item-count-input');

    const name = addItemNameInput.val().trim() || addItemNameInput.attr('placeholder');
    const location = addItemLocationInput.val().trim() || addItemLocationInput.attr('placeholder');
    const count = addItemCountInput.val().trim() || addItemCountInput.attr('placeholder');

    if (!name || !location || !count) {
      showErrorDialog('Please fill in all the fields.');
      return null;
    }

    if (isNaN(count) || parseInt(count) <= 0) {
      showErrorDialog('Please enter a valid number for the count.');
      return null;
    }

    return {
      name: name,
      location: location,
      count: parseInt(count),
    };
  }

  function showErrorDialog(message) {
    window.electron.send('show-error-dialog', { message });
  }

  function showSuccessDialog(message) {
    window.electron.send('show-success-dialog', { message });
  }
}

export default initAddItem;
