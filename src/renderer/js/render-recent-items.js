$(document).ready(() => {
  window.electron.send('get-recent-items');

  const recentItemsDiv = $('#recent-items-div');

  window.electron.on('recent-items', (data) => {
    recentItemsDiv.empty();

    if (data.error) {
      showErrorDialog('Error retrieving items:', data.error);
    }

    if (data.data.length === 0) {
      const message = $('<h1>').text('Nothing added yet.').addClass('message');
      recentItemsDiv.append(message);
    } else {
      const message = $('<h1>').text('Recently added').addClass('message');
      const recentItemsTable = $('<table>')
        .addClass('recent-items-table')
        .attr('id', 'recent-items-table');

      // Iterate over each item in the received data and generate the table
      data.data.forEach((item) => {
        const button = $('<button>')
          .addClass('recent-items-button')
          .html(`${item.name}`)
          .data('item', item);

        const row = $('<tr>').append($('<td>').append(button));
        recentItemsTable.append(row);
      });

      recentItemsDiv.append(message, recentItemsTable);
    }
  });

  recentItemsDiv.on('click', 'button.recent-items-button', function () {
    const item = $(this).data('item');

    window.displayItemInformation(item);
  });

  function showErrorDialog(message) {
    window.electron.send('show-error-dialog', { message });
  }
});
