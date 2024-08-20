import { combineReducers } from 'redux';

// reducer import
import customizationReducer from './customizationReducer';
import accountReducer from './accountReducer';
import siteInfoReducer from './siteInfoReducer';
import viewUpdate from './viewUpdate/reducer';
import explorer from './explorer/reducer';
import navigator from './navigator/reducer';

// ==============================|| COMBINE REDUCER ||============================== //

const reducer = combineReducers({
  customization: customizationReducer,
  account: accountReducer,
  siteInfo: siteInfoReducer,
  viewUpdate: viewUpdate,
  explorer:explorer,
  navigator,

});

export default reducer;
