import panel from './panel';
import pages from './pages';

// ==============================|| MENU ITEMS ||============================== //

const menuItems = {
  items: [panel, pages],
  urlMap: {}
};

// Initialize urlMap
menuItems.urlMap = menuItems.items.reduce((map, item) => {
  item.children.forEach((child) => {
    map[child.url] = child;
  });
  return map;
}, {});

export default menuItems;
