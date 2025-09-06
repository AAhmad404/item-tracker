$(document).ready(() => {
  window.showPopup = function (section) {
    if (section === 'item-information') {
      const itemImage = $('#item-information-image');
      const backgroundImage = itemImage.css('background-image');

      if (backgroundImage !== 'none') {
        const popup = $('#item-info-image-popup');
        popup.show();
      }
    } else {
      const itemImage = $('#add-item-image');
      const backgroundImage = itemImage.css('background-image');

      if (backgroundImage !== 'none') {
        const popup = $('#add-item-image-popup');
        popup.show();
      }
    }
  };

  window.closePopup = function (section) {
    if (section === 'item-information') {
      const popup = $('#item-info-image-popup');
      popup.hide();
    } else {
      const popup = $('#add-item-image-popup');
      popup.hide();
    }
  };

  $('#item-info-image-popup').hide();
  $('#add-item-image-popup').hide();
});
