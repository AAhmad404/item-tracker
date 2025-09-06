$(document).ready(() => {
  $('#save-button').on('click', () => {
    const updatedItem = validateForm();
    if (!updatedItem) return;

    const imageData = $('#item-information-image')
      .css('background-image')
      .replace(/url\(['"]?(.*?)['"]?\)/, '$1');

    // Check if the imageData is a data URL (base64 format)
    const isDataUrl =
      imageData.startsWith('data:image/png') || imageData.startsWith('data:image/jpeg');

    // Generate unique filename if the image is new (using .jpg since we compress to JPEG)
    const filename = isDataUrl ? `item_image_${Date.now()}.jpg` : '';

    window.electron.send('update-item-information', {
      updatedItem,
      imageData: isDataUrl ? imageData : '',
      filename,
    });
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
});
