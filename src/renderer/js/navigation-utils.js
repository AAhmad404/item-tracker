// Shared utility functions for navigation and UI updates
$(document).ready(() => {
  window.refreshRecentItems = function () {
    const recentItemsDiv = $('#recent-items-div');
    recentItemsDiv.empty();
    window.electron.send('get-recent-items');
  };

  window.navigateToHome = function () {
    // Clear forms
    $('#add-item-name-input').val('');
    $('#add-item-location-input').val('');
    $('#add-item-count-input').val('');
    $('#add-item-image').css('background-image', 'none');

    // Clear item information section
    $('.item-image').css('background-image', 'none');
    $('#item-info-popup-image').attr('src', '');

    // Show home section and hide others
    $('#add-item-section').hide();
    $('#item-information-section').hide();
    $('#home-section').show();
  };
});
