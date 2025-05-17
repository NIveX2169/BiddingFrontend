import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { useSelector } from "react-redux";

const CreateAuction = () => {
  const {
    register,
    handleSubmit,
    control, // For controlled components like select
    formState: { errors, isSubmitting },
    watch, // To watch form values, e.g., startTime for endTime min
    reset, // To reset the form after successful submission
  } = useForm({
    mode: "onTouched", // Validate on blur
    defaultValues: {
      // Set default values for the form
      title: "",
      description: "",
      startingPrice: "",
      category: "Electronics", // Default category
      startTime: "",
      endTime: "",
    },
  });

  const [apiError, setApiError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  const { userData } = useSelector((state) => state.auth);
  const categories = [
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

  // Watch the startTime to update the min attribute of endTime dynamically
  const watchedStartTime = watch("startTime");

  // Helper to get current local datetime string for min attribute
  const getMinDateTimeLocal = (offsetMinutes = 0) => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + offsetMinutes); // Add offset if needed
    const tzoffset = now.getTimezoneOffset() * 60000; //offset in milliseconds
    const localISOTime = new Date(now.getTime() - tzoffset)
      .toISOString()
      .slice(0, 16);
    return localISOTime;
  };

  const onSubmit = async (data) => {
    setApiError(null);
    setSuccessMessage("");

    // Dates from datetime-local are local. Convert to UTC ISO string.
    const auctionDataToSubmit = {
      title: data.title.trim(),
      description: data.description.trim(),
      startingPrice: parseFloat(data.startingPrice),
      startTime: new Date(data.startTime).toISOString(),
      endTime: new Date(data.endTime).toISOString(),
      category: data.category,
      createdBy: userData.user.id || userData.user._id,
    };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_REACT_APP_BACKEND_URL}/auction`,
        {
          // EXAMPLE: Replace with your endpoint
          method: "POST",
          headers: {
            "Content-Type": "application/json" /*, Authorization header */,
          },
          body: JSON.stringify(auctionDataToSubmit),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        // Handle specific validation errors from backend if provided
        if (
          response.status === 400 &&
          result.errors &&
          Array.isArray(result.errors)
        ) {
          let backendErrorMessages = "Validation failed: ";
          result.errors.forEach((err) => {
            // You could try to map err.path to form fields if needed
            backendErrorMessages += `${err.path}: ${err.msg}. `;
          });
          throw new Error(result.message || backendErrorMessages.trim());
        }
        throw new Error(
          result.message || "Failed to create auction. Please try again."
        );
      }

      if (result.status && result.data) {
        setSuccessMessage("Auction created successfully! Redirecting...");
        reset(); // Reset the form fields
        setTimeout(() => {
          navigate(`/dashboard/auctions`);
        }, 200);
      } else {
        throw new Error(
          result.message || "Auction created, but response format unexpected."
        );
      }
    } catch (err) {
      console.error("Error creating auction:", err);
      setApiError(err.message || "An unexpected error occurred.");
    }
  };

  return (
    <div className="container mx-auto max-w-2xl p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
        Create New Auction
      </h1>

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
            placeholder="e.g., Vintage Leather Jacket"
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
            placeholder="Detailed description of the item, its condition, etc."
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
              valueAsNumber: true, // Converts value to number
              min: {
                value: 0,
                message: "Starting price must be non-negative.",
              },
            })}
            step="0.01"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm ${
              errors.startingPrice
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            }`}
            placeholder="e.g., 75.00"
          />
          {errors.startingPrice && (
            <p className="text-red-500 text-xs mt-1">
              {errors.startingPrice.message}
            </p>
          )}
        </div>

        {/* Category - Using Controller for <select> for more robust control */}
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
                {categories.map((cat) => (
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
                    new Date(getMinDateTimeLocal()).getTime() - 60000 ||
                  "Start time cannot be in the past.",
              },
            })}
            min={getMinDateTimeLocal()}
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
                afterStartTime: (value) => {
                  if (!watchedStartTime) return true; // If startTime is not set, validation passes (startTime will be caught by its own validation)
                  return (
                    new Date(value).getTime() >
                      new Date(watchedStartTime).getTime() ||
                    "End time must be after start time."
                  );
                },
                minDuration: (value) => {
                  if (!watchedStartTime) return true;
                  return (
                    new Date(value).getTime() -
                      new Date(watchedStartTime).getTime() >=
                      60 * 60 * 1000 ||
                    "Auction duration must be at least 1 hour."
                  );
                },
              },
            })}
            min={
              watchedStartTime
                ? new Date(new Date(watchedStartTime).getTime() + 60000)
                    .toISOString()
                    .slice(0, 16)
                : getMinDateTimeLocal(1)
            } // Min 1 min after start time
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

        {/* General API Error/Success Messages */}
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

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <AiOutlineLoading3Quarters className="animate-spin mr-2 h-5 w-5" />
                Creating...
              </>
            ) : (
              "Create Auction"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateAuction;
