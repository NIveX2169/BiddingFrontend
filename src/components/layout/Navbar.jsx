import { useEffect } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
// You can import an icon library if you wish, e.g., Heroicons
// import { BellIcon, UserCircleIcon } from '@heroicons/react/outline';

const Navbar = () => {
  const { userData } = useSelector((state) => state?.auth);
  const isAuthenticated = userData ? true : false; // Replace with your actual auth check (e.g., from Redux)
  const username = userData?.user?.username; // Replace with actual username
  const navigate = useNavigate();
  useEffect(() => {
    if (!userData) navigate("/login");
  }, [userData]);

  return (
    <nav className="bg-white shadow-sm fixed w-full top-0 left-0 z-50 h-16">
      {" "}
      {/* Fixed Navbar */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo / Brand Name */}
          <div className="flex-shrink-0">
            <Link
              to="/"
              className="text-2xl font-bold text-indigo-600 hover:text-indigo-700"
            >
              AuctionPlatform
            </Link>
          </div>

          {/* Centered Search Bar (Optional) */}
          {/* <div className="hidden md:flex flex-grow justify-center px-4">
            <div className="relative w-full max-w-md">
              <input
                type="search"
                name="search"
                id="search"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Search auctions..."
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div> */}

          {/* Right Side: Links or User Info */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Optional: Notification Icon */}
                {/* <button
                  type="button"
                  className="p-1 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <span className="sr-only">View notifications</span>
                  <BellIcon className="h-6 w-6" aria-hidden="true" />
                </button> */}

                {/* User Greeting & Profile Link */}
                <div className="relative">
                  <button
                    type="button"
                    className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    id="user-menu-button"
                    aria-expanded="false"
                    aria-haspopup="true"
                    // onClick={toggleUserMenu} // You'll add this
                  >
                    <span className="sr-only">Open user menu</span>
                    {/* Placeholder for user avatar or icon */}
                    <span className="inline-block h-8 w-8 rounded-full overflow-hidden bg-gray-100">
                      <svg
                        className="h-full w-full text-gray-300"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </span>
                    <span className="hidden md:block ml-2 text-gray-700 hover:text-gray-900 text-sm font-medium">
                      Hi, {username}
                    </span>
                  </button>
                  {/* Dropdown menu (you'll add logic to show/hide this) */}
                  {/* <div
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none hidden" // Initially hidden
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu-button"
                  >
                    <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">Your Profile</Link>
                    <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">Sign out</button>
                  </div> */}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-md shadow"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
