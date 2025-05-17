import React, { useState, useEffect } from "react"; // Removed useMemo as it's not used here
import { Link } from "react-router-dom";
import {
  FiClock,
  FiTag,
  FiUsers,
  FiMapPin, // Assuming you might have this from auction data
  FiCheckCircle,
  // FiPlayCircle, // Not used in current logic
  // FiPauseCircle, // Not used
} from "react-icons/fi";

const AuctionCard = ({ auction, isMyAuctionsPage }) => {
  if (!auction) return null;

  const {
    _id,
    title,
    currentPrice,
    startTime,
    endTime,
    status,
    bids,
    category,
    condition, // Assuming you might have this
    location, // Assuming you might have this
    // highestBidder, // Not typically shown on a list card, but could be
  } = auction;

  const [dynamicTimeDisplay, setDynamicTimeDisplay] = useState("");

  useEffect(() => {
    const updateDisplayTime = () => {
      const now = new Date().getTime();
      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();
      let displayContent = "";

      if (status === "cancelled") {
        displayContent = (
          <span className="font-semibold text-gray-500">Cancelled</span>
        );
      } else if (status === "pending" && start > now) {
        const diffToStart = start - now;
        const days = Math.floor(diffToStart / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (diffToStart % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor(
          (diffToStart % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((diffToStart % (1000 * 60)) / 1000); // Added seconds

        let timeStr = "";
        if (days > 0) timeStr += `${days}d `;
        if (hours > 0 || days > 0) timeStr += `${hours}h `; // Show hours if days or hours > 0
        if (minutes > 0 || hours > 0 || days > 0) timeStr += `${minutes}m `; // Show minutes if days/hours/minutes > 0
        timeStr += `${seconds}s`; // Always show seconds for pending/active

        displayContent = (
          <span className="text-blue-600 font-semibold">
            Starts in: {timeStr.trim()}
          </span>
        );
      } else if (
        (status === "active" || (status === "pending" && start <= now)) &&
        end > now
      ) {
        // If pending but start time has passed, it should soon become 'active' via server update.
        // For now, treat it as active for countdown purposes if start <= now.
        const diffToEnd = end - now;
        const days = Math.floor(diffToEnd / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (diffToEnd % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor(
          (diffToEnd % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((diffToEnd % (1000 * 60)) / 1000); // Added seconds

        let timeStr = "";
        if (days > 0) timeStr += `${days}d `;
        if (hours > 0 || days > 0) timeStr += `${hours}h `;
        if (minutes > 0 || hours > 0 || days > 0) timeStr += `${minutes}m `;
        timeStr += `${seconds}s`;

        displayContent = (
          <span className="text-orange-600 font-semibold">
            Ends in: {timeStr.trim()}
          </span>
        );
      } else if (status === "sold") {
        displayContent = (
          <span className="text-green-600 font-semibold">
            Sold: {new Date(endTime).toLocaleDateString()}
          </span>
        );
      } else {
        // 'ended' or past endTime and not sold
        displayContent = (
          <span className="text-red-600 font-semibold">
            Ended: {new Date(endTime).toLocaleDateString()}
          </span>
        );
      }
      setDynamicTimeDisplay(displayContent);
    };

    updateDisplayTime(); // Initial call

    let intervalId;
    // Only set interval for active or pending (before start) auctions to update time remaining
    if (
      (status === "active" && new Date(endTime).getTime() > Date.now()) ||
      (status === "pending" && new Date(startTime).getTime() > Date.now())
    ) {
      intervalId = setInterval(updateDisplayTime, 1000); // Update every second for more dynamic feel
    }

    return () => clearInterval(intervalId);
  }, [startTime, endTime, status]); // Key dependencies for the timer

  const getStatusChipStyles = () => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700 border-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "ended":
        return "bg-red-100 text-red-700 border-red-300";
      case "sold":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "cancelled":
        return "bg-gray-100 text-gray-600 border-gray-300";
      default:
        return "bg-gray-50 text-gray-500 border-gray-200";
    }
  };

  const getConditionChipStyles = () => {
    // Placeholder, implement if needed
    switch (condition) {
      case "New":
        return "bg-sky-100 text-sky-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  return (
    // The entire card is a link
    <Link
      to={`/dashboard/auctions/${_id}`}
      className="block bg-white rounded-xl shadow-lg overflow-hidden flex flex-col h-full transition-all duration-300 ease-in-out hover:shadow-xl transform hover:-translate-y-1 no-underline"
    >
      <div className="relative p-4 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <h3
            className="text-md sm:text-lg font-semibold text-gray-800 mb-1 pr-20 truncate"
            title={title}
          >
            {" "}
            {/* Added pr-20 for status chip space */}
            {title || "Untitled Auction"}
          </h3>
          <div
            className={`absolute top-3 right-3 px-2 py-0.5 text-xs font-semibold rounded-full border whitespace-nowrap ${getStatusChipStyles()}`}
          >
            {status?.charAt(0).toUpperCase() + status?.slice(1) || "N/A"}
          </div>
        </div>
        {category && (
          <span className="text-xs font-medium text-indigo-500 uppercase tracking-wider block">
            {category}
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <div className="space-y-1.5 text-sm text-gray-600">
          <div className="flex items-center justify-between">
            <span className="flex items-center">
              <FiTag className="mr-1.5 text-indigo-500 text-xs" /> Current
              Price:
            </span>
            <strong className="text-indigo-700 font-bold text-base">
              ${currentPrice?.toFixed(2)}
            </strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center">
              <FiClock
                className={`mr-1.5 text-xs ${
                  status === "active"
                    ? "text-orange-500"
                    : status === "pending"
                    ? "text-blue-500"
                    : status === "sold" ||
                      status === "ended" ||
                      status === "cancelled"
                    ? "text-red-500"
                    : "text-gray-500"
                }`}
              />
              Time:
            </span>
            <div className="text-xs font-medium">{dynamicTimeDisplay}</div>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center">
              <FiUsers className="mr-1.5 text-teal-500 text-xs" /> Bids:
            </span>
            <span>{bids?.length || 0}</span>
          </div>
          {location && (
            <div className="flex items-center justify-between">
              <span className="flex items-center">
                <FiMapPin className="mr-1.5 text-gray-500 text-xs" /> Location:
              </span>
              <span className="truncate" title={location}>
                {location}
              </span>
            </div>
          )}
        </div>

        <div className="mt-auto pt-3">
          <span // This is not a Link, the whole card is. Just a styled button appearance.
            className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-3 rounded-lg shadow-sm transition duration-150 ease-in-out text-sm"
          >
            View Details
          </span>
          {/* Optionally, add an "Edit" button if isMyAuctionsPage and status allows */}
          {isMyAuctionsPage &&
            (status == "pending" || status == "active") && ( // Example: Allow edit for pending/active
              <Link
                to={`/dashboard/edit-auction/${_id}`} // Adjust your edit route
                onClick={(e) => e.stopPropagation()} // Important: Prevent card's Link navigation
                className="mt-2 block w-full text-center bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-1.5 px-3 rounded-md text-xs"
              >
                Edit
              </Link>
            )}
        </div>
      </div>
    </Link>
  );
};

export default AuctionCard;
