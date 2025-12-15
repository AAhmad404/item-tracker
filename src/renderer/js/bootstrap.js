import initNavigationUtils from './navigation-utils.js';
import initRender from './render.js';
import initRecentItems from './render-recent-items.js';
import initUploadImageScript from './upload-image-script.js';
import initAddItem from './add-item.js';
import initDeleteItem from './delete-item.js';
import initUpdateItem from './update-item.js';
import initPopups from './popup.js';
import initSearchSuggestions from './render-search-suggestions.js';

function initAll() {
  // basic utilities and UI
  initNavigationUtils();
  initRender();
  initPopups();

  // input / upload handlers
  initUploadImageScript();

  // page specific
  initRecentItems();
  initSearchSuggestions();

  // forms and actions
  initAddItem();
  initUpdateItem();
  initDeleteItem();
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initAll);
} else {
  initAll();
}

export default initAll;
