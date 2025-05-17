import {
  createBrowserRouter,
  Navigate,
  // Outlet // Keep if your PrivateRoute/AdminRoute still use it, which they should
} from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import { Login } from "../pages/LoginPage";
import { Register } from "../pages/Register";
import PrivateRoute from "../components/privateRoute/PrivateRoute";
import MyAuction from "../pages/Auction/MyAuction";
import AuctionDetailPage from "../pages/Auction/AuctionDetailPage";
import CreateAuction from "../pages/Auction/CreateAuction";
import UserAuctions from "../pages/Auction/UserAuctions";
import UpdateAuction from "../pages/Auction/UpdateAuction";
import UserManagement from "../pages/UserManagement/UserManagement";

export const routes = createBrowserRouter([
  {
    path: "/",
    element: <PrivateRoute />,
  },
  {
    path: "/dashboard",
    element: <MainLayout />,
    children: [
      {
        path: "auctions",
        element: <MyAuction />,
      },
      {
        path: "auctions/:auctionId",
        element: <AuctionDetailPage />,
      },
      {
        path: "create-auction",
        element: <CreateAuction />,
      },
      {
        path: "user-auction",
        element: <UserAuctions />,
      },
      {
        path: "edit-auction/:auctionId",
        element: <UpdateAuction />,
      },
      {
        path: "admin/users",
        element: <UserManagement />,
      },
    ], // Parent route for the main layout
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
]);
