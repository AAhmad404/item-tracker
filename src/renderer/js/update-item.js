export function initUpdateItem() {
  $('#save-button').on('click', async () => {
    const updatedItem = validateForm();
    if (!updatedItem) return;

    const itemImageEl = $('#item-information-image');
    const savedFileUrl = itemImageEl.data('saved-file-url') || '';

    if (savedFileUrl) {
      window.electron.send('update-item-information', { updatedItem, imageData: '', filename: savedFileUrl });
      return;
    }

    const bg = itemImageEl.css('background-image');
    if (bg && bg !== 'none') {
      const imageUrl = bg.replace(/url\(['\"]?(.*?)['\"]?\)/, '$1');
      if (imageUrl.startsWith('data:image/')) {
        try {
          const filename = `item_image_${Date.now()}.jpg`;
          const resp = await fetch(imageUrl);
          const arrayBuffer = await resp.arrayBuffer();
          const savedFileUrl2 = await window.electron.invoke('save-image-binary', arrayBuffer, filename);
          window.electron.send('update-item-information', { updatedItem, imageData: '', filename: savedFileUrl2 });
          return;
        } catch (e) {
          showErrorDialog('Failed to save image; please try uploading again.');
          return;
        }
      }
    }

    window.electron.send('update-item-information', { updatedItem, imageData: '', filename: '' });
  });

  function validateForm() {
    const itemInformationNameInput = $('#item-info-name-input');
    const itemInformationLocationInput = $('#item-info-location-input');
    const itemInformationCountInput = $('#item-info-count-input');

    const name =
      itemInformationNameInput.val().trim() || itemInformationNameInput.attr('placeholder');
    const location =
      itemInformationLocationInput.val().trim() || itemInformationLocationInput.attr('placeholder');
    const count =
      itemInformationCountInput.val().trim() || itemInformationCountInput.attr('placeholder');

    if (!name || !location || !count) {
      showErrorDialog('Please fill in all the fields.');
      return false;
    }

    if (isNaN(count) || parseInt(count) <= 0) {
      showErrorDialog('Please enter a valid number for the count.');
      return;
    }

    return {
      id: window.currentItem.id,
      name: name,
      location: location,
      count: parseInt(count),
      image_path: window.currentItem.image_path,
    };
  }

  window.electron.on('item-updated', (response) => {
    if (response.success) {
      showSuccessDialog('Item information updated successfully.');
      setTimeout(() => {
        window.navigateToHome();
        window.refreshRecentItems();
      }, 100);
    } else {
      showErrorDialog('Failed to update item information. Please try again.');
    }
  });

  function showErrorDialog(message) {
    window.electron.send('show-error-dialog', { message });
  }

  function showSuccessDialog(message) {
    window.electron.send('show-success-dialog', { message });
  }
}

export default initUpdateItem;
