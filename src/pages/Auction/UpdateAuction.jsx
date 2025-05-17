import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { useSelector } from "react-redux";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL;

// Move categories outside or useMemo
const CATEGORIES_LIST = [
  "Electronics",
  "Fashion",
  "Home & Garden",
  "Collectibles",
  "Art & Crafts",
  "Books",
  "Music & Instruments",
  "Sports & Outdoors",
  "Toys & Games",
  "Vehicles & Parts",
  "Jewelry & Watches",
  "Health & Beauty",
  "Other",
];

const UpdateAuction = () => {
  const { auctionId } = useParams();
  const navigate = useNavigate();
  const {
    user: currentUser,
    token,
  } = // Make sure token is extracted and used for authenticated requests
    useSelector((state) => state.auth.userData || { user: null, token: null });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting, isDirty },
    reset,
    watch,
    // setValue, // Keep if you need to programmatically set values outside of reset
  } = useForm({
    mode: "onTouched",
  });

  const [isLoading, setIsLoading] = useState(false); // For form submission
  const [isFetching, setIsFetching] = useState(true); // For fetching initial data
  const [apiError, setApiError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [originalAuctionData, setOriginalAuctionData] = useState(null);

  // const categories = CATEGORIES_LIST; // Use the constant

  const watchedStartTime = watch("startTime");

  const getMinDateTimeLocal = (offsetMinutes = 0) => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + offsetMinutes);
    const tzoffset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - tzoffset)
      .toISOString()
      .slice(0, 16);
    return localISOTime;
  };

  // Fetch existing auction data
  const fetchAuctionDetails = useCallback(async () => {
    if (!auctionId) {
      setApiError("No Auction ID provided.");
      setIsFetching(false);
      return;
    }
    setIsFetching(true);
    setApiError(null);
    try {
      // For fetching details of an auction that might be edited by its owner,
      // it's often good practice to use an authenticated endpoint,
      // or at least ensure the backend verifies ownership before allowing an update.
      // The current GET request to /auction/:auctionId might be public.
      // If it's a specific "get my auction for edit" endpoint, it would need the token.
      const response = await axios.get(`${API_BASE_URL}/auction/${auctionId}`, {
        // If this endpoint requires auth to fetch *any* auction, or if it's a specific
        // "get my auction" endpoint, you'd add headers here.
        // headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        // withCredentials: true, // Use if you rely on cookies for session management
      });
      const result = response.data;

      if (result.status && result.data) {
        const auctionData = result.data;

        // --- Authorization Check: Client-side check (Backend MUST also do this) ---
        if (!currentUser || auctionData.createdBy?._id !== currentUser.id) {
          setApiError("You are not authorized to edit this auction.");
          setOriginalAuctionData(null); // Clear any potentially loaded data
          setIsFetching(false);
          navigate("/dashboard/my-auctions"); // Or a generic forbidden page
          return;
        }
        // --- End Authorization Check ---

        // --- Status Check: Prevent editing non-pending auctions ---
        if (auctionData.status !== "pending") {
          setApiError(
            `This auction is currently '${auctionData.status}' and cannot be edited. Only 'pending' auctions can be modified.`
          );
          setOriginalAuctionData(auctionData); // Still set for display purposes if needed before redirect
          setIsFetching(false);
          // navigate(`/auctions/${auctionId}`); // Optionally navigate away
          return; // Stop further processing, the UI will show the error message
        }
        // --- End Status Check ---

        setOriginalAuctionData(auctionData);

        const formatDateTimeLocal = (isoString) => {
          if (!isoString) return "";
          try {
            const date = new Date(isoString);
            const localDate = new Date(
              date.getTime() - date.getTimezoneOffset() * 60000
            );
            return localDate.toISOString().slice(0, 16);
          } catch (e) {
            console.error("Error formatting date:", isoString, e);
            return "";
          }
        };

        reset({
          title: auctionData.title || "",
          description: auctionData.description || "",
          startingPrice: auctionData.startingPrice || 0, // Ensure a default numeric value
          category: auctionData.category || CATEGORIES_LIST[0],
          startTime: formatDateTimeLocal(auctionData.startTime),
          endTime: formatDateTimeLocal(auctionData.endTime),
          // Add other fields like condition, minimumIncrement if they are part of the form
          // condition: auctionData.condition || "",
          // minimumIncrement: auctionData.minimumIncrement || 1,
        });
      } else {
        throw new Error(result.message || "Failed to fetch auction details.");
      }
    } catch (err) {
      console.error("Error fetching auction details:", err);
      let detailedError = err.message || "Could not load auction data.";
      if (err.response && err.response.data && err.response.data.message) {
        detailedError = err.response.data.message;
      }
      if (err.response?.status === 404) {
        detailedError = "Auction not found.";
      } else if (err.response?.status === 403 || err.response?.status === 401) {
        detailedError = "You are not authorized to view or edit this auction.";
      }
      setApiError(detailedError);
      // Consider navigating away if the error is critical (e.g., not found, not authorized)
      // navigate("/dashboard/my-auctions");
    } finally {
      setIsFetching(false);
    }
    // `reset` is from useForm, its identity is stable.
    // `navigate` is from react-router-dom, also stable.
    // `currentUser` object might change if user logs out/in, so include if it directly affects fetch logic before calling API.
  }, [auctionId, reset, navigate, currentUser]); // Removed categories, API_BASE_URL. Added currentUser for auth check.

  useEffect(() => {
    if (!currentUser) {
      // If user logs out while on this page
      navigate("/login");
      return;
    }
    fetchAuctionDetails();
  }, [fetchAuctionDetails, currentUser, navigate]); // Added currentUser and navigate

  const onSubmit = async (data) => {
    if (!originalAuctionData || originalAuctionData.status !== "pending") {
      setApiError(
        "This auction cannot be updated as it's not in a 'pending' state."
      );
      return;
    }
    if (!isDirty) {
      // Prevent submission if no changes
      setApiError("No changes detected to submit.");
      return;
    }

    setApiError(null);
    setSuccessMessage("");
    setIsLoading(true);

    const auctionDataToSubmit = {
      title: data.title.trim(),
      description: data.description.trim(),
      startingPrice: parseFloat(data.startingPrice),
      startTime: new Date(data.startTime).toISOString(),
      endTime: new Date(data.endTime).toISOString(),
      category: data.category,
    };

    try {
      const response = await axios.patch(
        `${API_BASE_URL}/auction/${auctionId}`,
        auctionDataToSubmit,
        {
          withCredentials: true,
        }
      );

      const result = response.data;

      if (result.status && result.data) {
        setSuccessMessage("Auction updated successfully! Redirecting...");
        setOriginalAuctionData(result.data); // Update original data with response
        reset(result.data); // Reset form to show new data and clear dirty state
        setTimeout(() => {
          navigate(`/dashboard/auctions`); // Navigate to user's auction detail view
        }, 2000);
      } else {
        throw new Error(result.message || "Failed to update auction.");
      }
    } catch (err) {
      console.error("Error updating auction:", err);
      let errMsg = "An unexpected error occurred during update.";
      if (err.response && err.response.data && err.response.data.message) {
        errMsg = err.response.data.message;
      } else if (err.message) {
        errMsg = err.message;
      }
      setApiError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Render Logic ---

  if (isFetching) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)] text-indigo-600">
        <AiOutlineLoading3Quarters className="animate-spin text-4xl md:text-5xl" />
        <span className="ml-3 mt-3 text-lg">Loading Auction Details...</span>
      </div>
    );
  }

  // If there was an API error during fetch that wasn't a specific auth/status issue handled inside fetchAuctionDetails
  if (apiError && !originalAuctionData) {
    // Check if originalAuctionData is null because of the error
    return (
      <div className="container mx-auto p-4 md:p-8 text-center">
        <h2 className="text-2xl font-semibold text-red-600">
          Error Loading Auction
        </h2>
        <p className="text-red-500 mt-2">{apiError}</p>
        <Link
          to="/dashboard/my-auctions"
          className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Back to My Auctions
        </Link>
      </div>
    );
  }

  if (
    currentUser &&
    originalAuctionData &&
    currentUser.id !== originalAuctionData.createdBy?._id
  ) {
    return;
  }

  if (originalAuctionData && originalAuctionData.status !== "pending") {
    return (
      <div className="container mx-auto p-4 md:p-8 text-center">
        <h2 className="text-2xl font-semibold text-orange-600">
          Cannot Edit Auction
        </h2>
        <p className="text-gray-700 mt-2">
          {apiError ||
            `This auction is currently '${originalAuctionData.status}' and cannot be edited. Only 'pending' auctions can be modified.`}
        </p>
        <Link
          to={`/dashboard/auctions`} // Link to user's view of the auction
          className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          View Auction
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
        Update Auction
      </h1>
      <p className="text-sm text-gray-500 text-center mb-8">
        Editing: {originalAuctionData?.title || "Auction"}
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-6 md:p-8 rounded-lg shadow-xl space-y-6"
      >
        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Auction Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            {...register("title", {
              required: "Title is required.",
              minLength: {
                value: 5,
                message: "Title must be at least 5 characters.",
              },
            })}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm ${
              errors.title
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            }`}
          />
          {errors.title && (
            <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            rows="4"
            {...register("description", {
              required: "Description is required.",
              minLength: {
                value: 10,
                message: "Description must be at least 10 characters.",
              },
            })}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm ${
              errors.description
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            }`}
          />
          {errors.description && (
            <p className="text-red-500 text-xs mt-1">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Starting Price */}
        <div>
          <label
            htmlFor="startingPrice"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Starting Price ($) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="startingPrice"
            {...register("startingPrice", {
              required: "Starting price is required.",
              valueAsNumber: true,
              min: {
                value: 0.01,
                message: "Starting price must be greater than 0.",
              }, // Typically > 0
            })}
            step="0.01"
            // disabled={originalAuctionData?.status !== "pending"} // Already handled by overall page block
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm ${
              errors.startingPrice
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            }`}
          />
          {errors.startingPrice && (
            <p className="text-red-500 text-xs mt-1">
              {errors.startingPrice.message}
            </p>
          )}
        </div>

        {/* Category */}
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Category <span className="text-red-500">*</span>
          </label>
          <Controller
            name="category"
            control={control}
            defaultValue={CATEGORIES_LIST[0]}
            rules={{ required: "Category is required." }}
            render={({ field }) => (
              <select
                {...field}
                id="category"
                className={`w-full px-3 py-2 border bg-white rounded-md shadow-sm focus:outline-none sm:text-sm ${
                  errors.category
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                }`}
              >
                {CATEGORIES_LIST.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.category && (
            <p className="text-red-500 text-xs mt-1">
              {errors.category.message}
            </p>
          )}
        </div>

        {/* Start Time */}
        <div>
          <label
            htmlFor="startTime"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Start Time <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            id="startTime"
            {...register("startTime", {
              required: "Start time is required.",
              validate: {
                notInPast: (value) =>
                  new Date(value).getTime() >=
                    new Date(getMinDateTimeLocal()).getTime() - 60000 || // Allow a tiny buffer for submission lag
                  "Start time cannot be in the past.",
              },
            })}
            min={getMinDateTimeLocal()}
            // disabled={originalAuctionData?.status !== "pending"} // Already handled
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm ${
              errors.startTime
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            }`}
          />
          {errors.startTime && (
            <p className="text-red-500 text-xs mt-1">
              {errors.startTime.message}
            </p>
          )}
        </div>

        {/* End Time */}
        <div>
          <label
            htmlFor="endTime"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            End Time <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            id="endTime"
            {...register("endTime", {
              required: "End time is required.",
              validate: {
                afterStartTime: (value) =>
                  !watchedStartTime ||
                  new Date(value).getTime() >
                    new Date(watchedStartTime).getTime() ||
                  "End time must be after start time.",
                minDuration: (value) =>
                  !watchedStartTime ||
                  new Date(value).getTime() -
                    new Date(watchedStartTime).getTime() >=
                    30 * 60 * 1000 || // Min 30 mins duration
                  "Auction duration must be at least 30 minutes.",
              },
            })}
            min={
              watchedStartTime
                ? new Date(new Date(watchedStartTime).getTime() + 30 * 60000) // Min 30 mins after start
                    .toISOString()
                    .slice(0, 16)
                : getMinDateTimeLocal(30) // Min 30 mins from now if startTime not set
            }
            // disabled={originalAuctionData?.status !== "pending"} // Already handled
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm ${
              errors.endTime
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            }`}
          />
          {errors.endTime && (
            <p className="text-red-500 text-xs mt-1">
              {errors.endTime.message}
            </p>
          )}
        </div>

        {/* Optional: Minimum Increment & Condition fields would go here if you add them */}

        {apiError && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
            {apiError}
          </div>
        )}
        {successMessage && (
          <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-md text-sm">
            {successMessage}
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={isLoading || isSubmitting || !isDirty}
            className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed"
          >
            {isLoading || isSubmitting ? (
              <>
                <AiOutlineLoading3Quarters className="animate-spin mr-2 h-5 w-5" />
                Updating...
              </>
            ) : (
              "Update Auction"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdateAuction;
