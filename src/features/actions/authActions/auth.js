import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
// 👉 Environment Variable for Backend URL
const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL; // make sure your .env has VITE_BACKEND_URL

// 👉 Thunk for Login
export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/auth/login`,
        credentials,
        {
          withCredentials: true, // to handle cookies
        }
      );
      return response.data; // Assuming your backend sends { user: { ...userData } }
    } catch (error) {
      return rejectWithValue(error.response.data.message || "Login failed");
    }
  }
);

// 👉 Thunk for Logout
export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await axios.get(
        `${BACKEND_URL}/auth/logout`,
        {},
        {
          withCredentials: true, // to clear the cookie
        }
      );
      return true;
    } catch (error) {
      return rejectWithValue(error.response.data.message || "Logout failed");
    }
  }
);
