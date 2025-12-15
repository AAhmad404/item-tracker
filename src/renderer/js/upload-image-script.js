$(document).ready(() => {
  const itemInfoFileUploader = $('#item-info-file-uploader');
  const addItemFileUploader = $('#add-item-file-uploader');

  function createUploadImageHandler(section) {
    return function (event) {
      const fileUploadInput = event.target;

      if (!fileUploadInput.value) {
        return;
      }

      const image = fileUploadInput.files[0];

      if (!image.type.includes('image')) {
        return alert('Only images are allowed!');
      }

      // Make sure the image is not larger than 5 MB.
      const MAX_SIZE = 5 * 1024 * 1024;
      if (image.size > MAX_SIZE) {
        return alert('Maximum upload size is 5 MB!');
      }

      const filename = image.name;

      const fileReader = new FileReader();
      fileReader.readAsDataURL(image);

      fileReader.onload = (fileReaderEvent) => {
        const imageUrl = fileReaderEvent.target.result;

        // Create an image element to resize it if it's too large
        const img = new Image();
        img.onload = function () {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Set maximum dimensions
          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1080;

          let { width, height } = img;

          // Calculate new dimensions while maintaining aspect ratio
          if (width > height) {
            if (width > MAX_WIDTH) {
              height = height * (MAX_WIDTH / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = width * (MAX_HEIGHT / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress the image
          ctx.drawImage(img, 0, 0, width, height);

          // Convert and save the image using a binary transfer to the main
          // process to avoid base64 overhead. We use canvas.toBlob, then send
          // the ArrayBuffer via the preload's invoke wrapper.
          const saveAsFilename = `item_image_${Date.now()}.jpg`;

          canvas.toBlob(async (blob) => {
            try {
              const arrayBuffer = await blob.arrayBuffer();
              // Save in main process; preload exposes electron.invoke
              const savedFileUrl = await window.electron.invoke('save-image-binary', arrayBuffer, saveAsFilename);

              if (section === 'item-information') {
                const itemImage = $(`#item-information-image`);
                itemImage.css('background-image', `url(${savedFileUrl})`);
                $('#item-info-popup-image').attr('src', savedFileUrl);

                itemImage.data('saved-file-url', savedFileUrl);
                itemImage.data('filename', saveAsFilename);
              } else {
                const itemImage = $(`#add-item-image`);
                itemImage.css('background-image', `url(${savedFileUrl})`);
                $('#add-item-popup-image').attr('src', savedFileUrl);

                itemImage.data('saved-file-url', savedFileUrl);
                itemImage.data('filename', saveAsFilename);
              }
            } catch (e) {
              alert('Failed to save image: ' + (e && e.message ? e.message : e));
            }
          }, 'image/jpeg', 0.85);
        };
        img.src = imageUrl;
      };
    };
  }

  window.triggerFileUpload = function (section) {
    if (section === 'item-information') {
      itemInfoFileUploader.off('change').on('change', createUploadImageHandler(section));
      itemInfoFileUploader.click();
    } else {
      addItemFileUploader.off('change').on('change', createUploadImageHandler(section));

      addItemFileUploader.click();
    }
  };
});
