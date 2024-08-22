import { configureStore } from '@reduxjs/toolkit';
import { thunk } from 'redux-thunk';
import reducer from './reducer';

// ==============================|| REDUX - MAIN STORE ||============================== //

const store = configureStore({
  reducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(thunk),
});

const persister = 'Free';

export { store, persister };
