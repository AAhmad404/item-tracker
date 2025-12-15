export function initSearchSuggestions() {
  $('#search-bar').on('input', () => {
    const searchText = $('#search-bar').val().trim();

    if (searchText.length > 0) {
      window.electron.send('get-search-suggestions', searchText);
    } else {
      $('#search-suggestions').empty();
    }
  });

  window.electron.on('search-suggestions', (data) => {
    const searchResults = $('#search-suggestions');
    const searchText = $('#search-bar').val().trim();

    if (data.error) {
      showErrorDialog('Error retrieving items:', data.error);
    } else {
      searchResults.empty();

      // Generate the search results list
      data.data.forEach((item) => {
        const highlightedName = item.name.replace(
          new RegExp(`(${searchText})`, 'gi'),
          '<strong>$1</strong>'
        );
        const highlightedLocation = item.location.replace(
          new RegExp(`(${searchText})`, 'gi'),
          '<strong>$1</strong>'
        );

        const button = $('<button>')
          .addClass('suggestion-button')
          .html(`${highlightedName} <em class="align-right">${highlightedLocation}</em>`) 
          .data('item', item);

        const listItem = $('<li>').append(button);
        searchResults.append(listItem);
      });
    }
  });

  $('#search-suggestions').on('click', 'button.suggestion-button', function () {
    const item = $(this).data('item');

    window.displayItemInformation(item);

    $('#search-bar').val('');
    $('#search-suggestions').empty();
  });

  function showErrorDialog(message) {
    window.electron.send('show-error-dialog', { message });
  }
}

export default initSearchSuggestions;
