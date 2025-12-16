export function initRender() {
  const homeSection = $('#home-section');
  const addItemSection = $('#add-item-section');
  const itemInformationSection = $('#item-information-section');

  const addItemNameInput = $('#add-item-name-input');
  const addItemLocationInput = $('#add-item-location-input');
  const addItemCountInput = $('#add-item-count-input');

  const itemInformationNameInput = $('#item-info-name-input');
  const itemInformationLocationInput = $('#item-info-location-input');
  const itemInformationCountInput = $('#item-info-count-input');

  addItemSection.hide();
  itemInformationSection.hide();

  window.displayItemInformation = function (item) {
    // Clear the item information inputs in case their remains text from previous searches
    itemInformationNameInput.val('');
    itemInformationLocationInput.val('');
    itemInformationCountInput.val('');

    itemInformationNameInput.attr('placeholder', item.name);
    itemInformationLocationInput.attr('placeholder', item.location);
    itemInformationCountInput.attr('placeholder', item.count);

    $('#item-info-title').text(item.name);

    const itemImage = $('.item-image');
    const popupImage = $('#item-info-popup-image');

    if (item.image_path) {
      // DB may contain a file:// URL (userData) or just a filename (legacy).
      let fullImagePath = item.image_path;

      // If image_path is not an absolute URL, build the relative path to bundled resources
      if (!fullImagePath.startsWith('file://') && !/^https?:\/\//.test(fullImagePath)) {
        fullImagePath = `../../resources/images/item-images/${fullImagePath}`;
      }

      const img = new Image();
      img.src = fullImagePath;
      img.onload = function () {
        itemImage.css('background-image', `url(${fullImagePath})`);
        popupImage.attr('src', fullImagePath);
      };
      img.onerror = function () {
        const defaultImagePath = '../../resources/images/default-image.png';
        itemImage.css('background-image', `url(${defaultImagePath})`);
        popupImage.attr('src', defaultImagePath);
      };
    } else {
      const defaultImagePath = '../../resources/images/default-image.png';
      itemImage.css('background-image', `url(${defaultImagePath})`);
      popupImage.attr('src', defaultImagePath);
    }

    // Set the current item to the item being displayed
    window.currentItem = item;

    homeSection.hide();
    addItemSection.hide();
    itemInformationSection.show();
  };

  $('#add-item-button').on('click', () => {
    addItemNameInput.val('');
    addItemLocationInput.val('');
    addItemCountInput.val('');

    homeSection.hide();
    addItemSection.show();
  });

  $('#return-button').on('click', () => {
    $('.item-image').css('background-image', 'none');
    $('#item-info-popup-image').attr('src', '');

    addItemSection.hide();
    itemInformationSection.hide();
    homeSection.show();
  });

  $('#close-button').on('click', () => {
    $('.item-image').css('background-image', 'none');
    $('#item-info-popup-image').attr('src', '');

    addItemSection.hide();
    itemInformationSection.hide();
    homeSection.show();
  });
}

export default initRender;
