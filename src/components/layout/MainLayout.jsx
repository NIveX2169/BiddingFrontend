import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom"; // Outlet is key
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useSelector } from "react-redux";
import { useEffect } from "react";

const MainLayout = () => {
  const showSidebar = true;

  const navbarHeight = "4rem";
  const navigate = useNavigate();
  const { userData } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!userData) {
      navigate("/login");
    }
  }, [userData]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {" "}
      {/* Overall page background */}
      <Navbar />
      <div
        className="flex flex-1"
        style={{ paddingTop: navbarHeight }} // Ensure content is below fixed navbar
      >
        {showSidebar && <Sidebar />}
        <main
          className={`flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 ${
            showSidebar ? "lg:ml-64" : "ml-0" // Adjust margin based on sidebar presence
          }`}
        >
          {/* Child route components will be rendered here */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
