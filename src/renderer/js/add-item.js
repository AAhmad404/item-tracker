export function initAddItem() {
  $('#add-button').on('click', () => {
    const newItem = validateForm();
    if (!newItem) return;

    // Prefer saved file URL from the upload flow (binary save). Fallback to
    // reading the background-image (could be a data URL) for legacy cases.
    const itemImageEl = $('#add-item-image');
    const savedFileUrl = itemImageEl.data('saved-file-url') || '';

    let imageData = '';
    let filename = '';

    if (savedFileUrl) {
      // Already saved by the renderer via binary transfer; send filename as the
      // saved file URL so the main add handler can store it directly.
      filename = savedFileUrl;
    } else {
      imageData = itemImageEl.css('background-image');
      if (imageData && imageData !== 'none') {
        imageData = imageData.replace(/url\(['"]?(.*?)['"]?\)/, '$1');
      } else {
        imageData = '';
      }

      const isDataUrl = imageData && (imageData.startsWith('data:image/png') || imageData.startsWith('data:image/jpeg'));
      filename = isDataUrl ? `item_image_${Date.now()}.jpg` : '';
    }

    window.electron.send('add-item-information', {
      newItem,
      imageData: imageData || '',
      filename,
    });
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
