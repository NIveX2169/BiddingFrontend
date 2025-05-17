// src/app/store.js
import { configureStore } from "@reduxjs/toolkit";
import storage from "redux-persist/lib/storage";
import { persistReducer, persistStore } from "redux-persist";
import { combineReducers } from "redux";
import { authReducers } from "./slices/auth";
import { SocketReducers } from "./slices/socketSlice";

const rootReducer = combineReducers({
  auth: authReducers,
  socket: SocketReducers,
});

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth"], // Only persist the "auth" slice
};

// 👉 Persisted Reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  devTools: import.meta.env.FRONTEND_ENV != "production",
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// 👉 Persistor for PersistGate
export const persistor = persistStore(store);
