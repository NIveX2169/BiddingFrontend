import React, { useState, useEffect, useCallback } from "react";
import {
  FiEye,
  FiEdit,
  FiSearch,
  FiUserCheck,
  FiUserX,
  FiUserPlus,
} from "react-icons/fi"; // Removed FiTrash2
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import axios from "axios"; // For API calls
import { useSelector } from "react-redux"; // To get the token
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL;

// --- Modals (Placeholders, ViewUserModal and EditRoleModal updated) ---
const ViewUserModal = ({ user, onClose }) => {
  if (!user) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
        <h3 className="text-xl font-semibold mb-4">
          User Details: {user.username}
        </h3>
        <p>
          <strong>ID:</strong> {user._id}
        </p>
        <p>
          <strong>Email:</strong> {user.email}
        </p>
        <p>
          <strong>Role:</strong>{" "}
          <span className="font-medium">{user.role?.toUpperCase()}</span>
        </p>
        {/* <p>
          <strong>Status:</strong>{" "}
          <span
            className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
              user.status === "active"
                ? "bg-green-100 text-green-800" // Assuming you might have a status field
                : user.status === "inactive"
                ? "bg-gray-100 text-gray-800"
                : "bg-blue-100 text-blue-800" // Default or other statuses
            }`}
          >
            {user.status
              ? user.status.charAt(0).toUpperCase() + user.status.slice(1)
              : "N/A"}
          </span>
        </p> */}
        <p>
          <strong>Joined:</strong>{" "}
          {new Date(user.createdAt).toLocaleDateString()}
        </p>
        {/* <p>
          <strong>Last Login:</strong>{" "}
          {user.lastLogin ? new Date(user.updatedAt).toLocaleString() : "N/A"}
        </p> */}
        <button
          onClick={onClose}
          className="mt-6 w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
        >
          Close
        </button>
      </div>
    </div>
  );
};

const EditRoleModal = ({
  user,
  currentRole,
  onClose,
  onSaveRole,
  isSavingRole,
}) => {
  const [newRole, setNewRole] = useState(currentRole?.toUpperCase()); // Work with uppercase internally for consistency
  const availableRoles = ["USER", "ADMIN"]; // Roles as expected by backend or for display

  const handleSave = async (id) => {
    const response = await axios.patch(
      `${API_BASE_URL}/auth/assign-role/${id}`,
      {
        role: newRole,
      },
      {
        withCredentials: true,
      }
    );
    if (response.data.status) {
      onSaveRole(user._id, newRole);
    } else {
      alert("Something Went Wrong !!");
    }
  };
  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
        <h3 className="text-xl font-semibold mb-4">
          Edit Role for {user.username}
        </h3>
        <div className="mb-4">
          <label
            htmlFor="roleSelect"
            className="block text-sm font-medium text-gray-700"
          >
            Select new role:
          </label>
          <select
            id="roleSelect"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            {availableRoles.map((role) => (
              <option key={role} value={role}>
                {role} {/* Display as uppercase */}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            disabled={isSavingRole}
            className="bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSave(user._id)}
            disabled={isSavingRole}
            className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSavingRole ? (
              <AiOutlineLoading3Quarters className="animate-spin mr-2" />
            ) : null}
            Save Role
          </button>
        </div>
      </div>
    </div>
  );
};
// --- End of Modals ---

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null); // For general fetch errors
  const [actionError, setActionError] = useState(null); // For errors during role update
  const [actionSuccess, setActionSuccess] = useState(""); // For success messages

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  // Assuming status is not part of your user model from the API response, or add it if it is
  // const [statusFilter, setStatusFilter] = useState('');

  // Modal states
  const [viewUser, setViewUser] = useState(null);
  const [editUserRole, setEditUserRole] = useState(null);
  const [isSavingRole, setIsSavingRole] = useState(false);
  const navigate = useNavigate();
  const { userData } = useSelector((state) => state.auth || {});

  useEffect(() => {
    if (!userData) {
      navigate("/login");
    }
  }, [userData]);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    setActionError(null);
    setActionSuccess("");
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/getAllUser`, {
        withCredentials: true,
      });
      if (response.data && response.data.status) {
        setUsers(response.data.data || []);
      } else {
        throw new Error(response.data.message || "Failed to fetch users.");
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setApiError(
        err.response?.data?.message || err.message || "Could not load users."
      );
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE_URL]); // Add token if used in header

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleViewUser = (user) => setViewUser(user);
  const handleEditUserRole = (user) => setEditUserRole(user);

  const handleSaveRole = async (userId, newRole) => {
    setIsSavingRole(true);
    setActionError(null);
    setActionSuccess("");
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/auth/assign-role/${userId}`,
        { role: newRole }, // Send role as uppercase
        {
          withCredentials: true,
        }
      );

      if (response.data && response.data.status) {
        setUsers((prevUsers) =>
          prevUsers.map(
            (user) => (user?._id === userId ? { ...user, role: newRole } : user) // Update role locally
          )
        );
        setActionSuccess(
          `Role updated successfully for user ${userId} to ${newRole}.`
        );
        setEditUserRole(null); // Close modal on success
      } else {
        throw new Error(response.data.message || "Failed to update role.");
      }
    } catch (err) {
      console.error("Error updating role:", err);
      setActionError(
        err.response?.data?.message || err.message || "Could not update role."
      );
    } finally {
      setIsSavingRole(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const userRoleUpper = user.role?.toUpperCase(); // For consistent filtering
    const roleFilterUpper = roleFilter?.toUpperCase();

    const matchesSearch =
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter ? userRoleUpper === roleFilterUpper : true;
    // const matchesStatus = statusFilter ? user.status === statusFilter : true; // If you have status
    return matchesSearch && matchesRole; // && matchesStatus;
  });

  const uniqueRolesForFilter = ["USER", "ADMIN"]; // Defined roles for filter dropdown

  if (isLoading) {
    /* ... Loading UI ... */
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)] text-indigo-600">
        <AiOutlineLoading3Quarters className="animate-spin text-4xl" />
        <span className="ml-3 text-lg">Loading Users...</span>
      </div>
    );
  }
  if (apiError) {
    /* ... Error UI ... */
    return (
      <div className="container mx-auto p-6 text-center">
        <h2 className="text-xl font-semibold text-red-600">
          Error Loading Users
        </h2>
        <p className="text-red-500 mt-1">{apiError}</p>
        <button
          onClick={fetchUsers}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
        User Management
      </h1>

      {actionError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
          {actionError}
        </div>
      )}
      {actionSuccess && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md text-sm">
          {actionSuccess}
        </div>
      )}

      {/* Filters and Search */}
      <div className="mb-6 p-4 bg-white shadow rounded-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-1">
            <label
              htmlFor="searchUsers"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Search Users
            </label>
            <input
              type="text"
              id="searchUsers"
              placeholder="Username or Email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label
              htmlFor="roleFilter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Filter by Role
            </label>
            <select
              id="roleFilter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Roles</option>
              {uniqueRolesForFilter.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          {/* Add status filter if applicable */}
          <div className="md:col-start-3">
            <button
              disabled
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 opacity-50 cursor-not-allowed"
              title="Add User functionality not implemented"
            >
              <FiUserPlus className="mr-2 h-5 w-5" /> Add New User
            </button>
          </div>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Username
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Email
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Role
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Joined
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.role?.toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleViewUser(user)}
                        title="View User"
                        className="text-indigo-600 hover:text-indigo-900 p-1 hover:bg-indigo-100 rounded"
                      >
                        {" "}
                        <FiEye size={18} />{" "}
                      </button>
                      <button
                        onClick={() => handleEditUserRole(user)}
                        title="Edit Role"
                        className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-100 rounded"
                      >
                        {" "}
                        <FiEdit size={18} />{" "}
                      </button>
                      {/* Delete button removed */}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-10 text-center text-sm text-gray-500"
                  >
                    No users found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {viewUser && (
        <ViewUserModal user={viewUser} onClose={() => setViewUser(null)} />
      )}
      {editUserRole && (
        <EditRoleModal
          user={editUserRole}
          currentRole={editUserRole.role}
          onClose={() => setEditUserRole(null)}
          onSaveRole={handleSaveRole}
          isSavingRole={isSavingRole}
        />
      )}
      {/* Delete modal removed */}
    </div>
  );
};

export default UserManagement;
