import { RouterProvider } from "react-router-dom";
import "./App.css";

import { routes } from "./routes/routes";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { initializeSocket } from "./features/slices/socketSlice";

function App() {
  const { socket } = useSelector((state) => state.socket);
  const dispatch = useDispatch();
  useEffect(() => {
    if (!socket || socket?.connected == false) {
      dispatch(initializeSocket());
    }
  }, []);
  return <RouterProvider router={routes} />;
}

export default App;
