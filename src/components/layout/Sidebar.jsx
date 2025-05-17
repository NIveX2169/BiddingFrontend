import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../features/actions/authActions/auth";
import { useEffect } from "react";
// import { selectUserRole } from "../../app/features/auth/authSlice";
// import { HomeIcon, UserGroupIcon, CogIcon, DocumentAddIcon, ViewListIcon, ShieldCheckIcon } from '@heroicons/react/outline'; // Example icons

const commonLinkClasses =
  "flex items-center space-x-3 py-2.5 px-4 rounded-lg transition duration-200 hover:bg-gray-700 hover:text-white";
const activeLinkClasses = "bg-indigo-600 text-white shadow-lg";

const Sidebar = () => {
  const { userData } = useSelector((state) => state.auth);
  const userRole = userData?.user?.role;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  function handleLogout() {
    dispatch(logout());
  }

  useEffect(() => {
    if (!userData) {
      navigate("/login");
    }
  }, [userData]);
  return (
    <aside
      className="w-64 bg-gray-800 text-gray-300 min-h-screen p-4 space-y-2 fixed left-0 overflow-y-auto shadow-lg"
      style={{ top: "4rem" }} // Position below the navbar (adjust if navbar height changes)
    >
      <nav className="flex flex-col space-y-1">
        <>
          <div className="pt-2">
            <h3 className="px-4 mb-2 text-xs font-semibold uppercase text-gray-500">
              {userRole == "ADMIN" ? "Admin Panel" : "User Panel"}
            </h3>
            {/* <NavLink
              to="/admin/dashboard" // Example Admin Dashboard
              className={({ isActive }) =>
                `${commonLinkClasses} ${isActive ? activeLinkClasses : ""}`
              }
            > */}
            {/* <ShieldCheckIcon className="h-5 w-5" /> */}
            {/* <span>Dashboard</span>
            </NavLink> */}
            {userRole == "ADMIN" && (
              <NavLink
                to="/dashboard/admin/users"
                className={({ isActive }) =>
                  `${commonLinkClasses} ${isActive ? activeLinkClasses : ""}`
                }
              >
                {/* <UserGroupIcon className="h-5 w-5" /> */}
                <span>User Management</span>
              </NavLink>
            )}
            <NavLink
              to="/dashboard/auctions"
              className={({ isActive }) =>
                `${commonLinkClasses} ${isActive ? activeLinkClasses : ""}`
              }
            >
              {/* <ViewListIcon className="h-5 w-5" /> */}
              <span>All Auctions</span>
            </NavLink>
            <NavLink
              to="/dashboard/user-auction"
              className={({ isActive }) =>
                `${commonLinkClasses} ${isActive ? activeLinkClasses : ""}`
              }
            >
              {/* <ViewListIcon className="h-5 w-5" /> */}
              <span>My Auctions</span>
            </NavLink>
            <button className="px-4" onClick={() => handleLogout()}>
              Logout
            </button>
          </div>
        </>

        {/* You can add a profile link here for all authenticated users */}
      </nav>
    </aside>
  );
};

export default Sidebar;
