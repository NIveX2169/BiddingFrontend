import React from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect } from "react";

const PrivateRoute = () => {
  const { userData } = useSelector((state) => state?.auth);
  const navigate = useNavigate();
  useEffect(() => {
    if (!userData) {
      navigate("/login");
    } else {
      navigate("/dashboard");
    }
  }, [userData]);
  // ------------------------------------------------------------------------------------------------------

  return userData ? (
    <div>
      <Outlet />
    </div>
  ) : (
    <Navigate to="/login" />
  );
};

export default PrivateRoute;
