import { createSlice } from "@reduxjs/toolkit";
import { io } from "socket.io-client";

const initialState = {
  socket: null,
};

const socketSlice = createSlice({
  name: "socket",
  initialState,
  reducers: {
    initializeSocket: (state) => {
      if (!state.socket) {
        console.log("Connecting to WebSocket at:", "http://localhost:8080");
        state.socket = io(import.meta.env.VITE_REACT_SOCKET, {
          transports: ["websocket"],
          autoConnect: true,
          withCredentials: true,
        });
        state.socket.connect();
        state.isConnected = true;
      }
    },
    disconnectSocket: (state) => {
      if (state.socket) {
        state.socket.disconnect();
        state.socket = null;
      }
    },
  },
});

export const { initializeSocket, disconnectSocket } = socketSlice.actions;
export const SocketReducers = socketSlice.reducer;
