import React, { useState, useEffect, useMemo, useCallback } from "react"; // Added useCallback
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import {
  FiTag,
  FiUsers,
  FiDollarSign,
  FiCheckCircle,
  FiXCircle,
  FiInfo,
  FiArrowLeft,
  FiClock,
  FiGrid,
  FiAlertCircle,
  FiMapPin, // Make sure FiMapPin is imported if used
} from "react-icons/fi";
import { useSelector } from "react-redux";

// --- COUNTDOWN TIMER (No changes needed here) ---
const CountdownTimer = ({ endTime, onAuctionEnd, status, startTime }) => {
  // Added startTime
  const calculateTimeLeft = () => {
    const targetTime =
      status === "pending" ? +new Date(startTime) : +new Date(endTime);
    const difference = targetTime - +new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  // Determine if the auction has truly ended based on status or if the relevant time has passed
  const [auctionPhaseOver, setAuctionPhaseOver] = useState(() => {
    if (status === "ended" || status === "sold" || status === "cancelled")
      return true;
    if (status === "active" && +new Date(endTime) <= +new Date()) return true;
    // For pending, it hasn't "ended" but the pending phase might be over if startTime is passed
    // This is handled by the main auction status update via socket or cron.
    return false;
  });

  useEffect(() => {
    if (status === "ended" || status === "sold" || status === "cancelled") {
      setAuctionPhaseOver(true);
      setTimeLeft({});
      return;
    }

    // If active and end time passed
    if (status === "active" && +new Date(endTime) <= +new Date()) {
      setAuctionPhaseOver(true);
      setTimeLeft({});
      if (onAuctionEnd) onAuctionEnd(); // Call onAuctionEnd if it's truly ended
      return;
    }
    // If pending and start time passed, the main auction status should change.
    // The countdown here will just count down to startTime.

    const timer = setTimeout(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      if (Object.keys(newTimeLeft).length === 0 && !auctionPhaseOver) {
        // This condition means the countdown reached zero.
        // For 'active' auctions, it means it ended.
        // For 'pending' auctions, it means it's time to start.
        // The actual status change ('pending' to 'active', or 'active' to 'ended'/'sold')
        // should ideally be driven by server-side logic (cron + socket emission).
        // The onAuctionEnd callback is more for when an 'active' auction's timer hits zero.
        if (status === "active") {
          setAuctionPhaseOver(true);
          if (onAuctionEnd) onAuctionEnd();
        }
        // If status was 'pending', the server will update it to 'active' and send 'auction-updated'.
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, endTime, startTime, onAuctionEnd, status, auctionPhaseOver]);
  const components = [];

  const timerComponents = useMemo(() => {
    Object.keys(timeLeft).forEach((interval) => {
      if (timeLeft[interval] === undefined) return;
      let Suffix = interval.charAt(0).toUpperCase() + interval.slice(1);
      if (timeLeft[interval] === 1) Suffix = Suffix.slice(0, -1);
      components.push(
        <div key={interval} className="flex flex-col items-center mx-1.5">
          <span className="text-2xl md:text-3xl font-bold text-indigo-600 tabular-nums">
            {String(timeLeft[interval]).padStart(2, "0")}
          </span>
          <span className="text-xs text-gray-500 uppercase tracking-wider">
            {Suffix}
          </span>
        </div>
      );
    });
    return components;
  }, [timeLeft]);

  if (status === "ended" || status === "sold" || status === "cancelled") {
    return (
      <div className="text-center py-3 px-4 bg-red-100 border border-red-300 rounded-lg">
        <p className="text-xl font-semibold text-red-700">
          Auction {status.charAt(0).toUpperCase() + status.slice(1)}
        </p>
      </div>
    );
  }

  if (status === "pending") {
    const startsInLabel = components?.length
      ? "Starts In:"
      : "Calculating start time...";
    return (
      <div className="py-3 px-4 bg-yellow-100 border border-yellow-300 rounded-lg">
        <p className="text-center text-sm font-semibold text-yellow-800 mb-1">
          {startsInLabel}
        </p>
        <div className="flex justify-center items-center">
          {components?.length ? (
            timerComponents
          ) : (
            <AiOutlineLoading3Quarters className="animate-spin text-yellow-700" />
          )}
        </div>
      </div>
    );
  }

  // Active auction countdown
  if (auctionPhaseOver && status === "active") {
    // Timer hit zero for an active auction
    return (
      <div className="text-center py-3 px-4 bg-red-100 border border-red-300 rounded-lg">
        <p className="text-xl font-semibold text-red-700">Auction Ended</p>
      </div>
    );
  }

  return (
    <div className="py-3 px-4 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
      <p className="text-center text-sm font-semibold text-gray-700 mb-1">
        Time Left:
      </p>
      <div className="flex justify-center items-center">
        {timerComponents.length ? (
          timerComponents
        ) : (
          <p className="text-lg font-medium text-gray-700">
            Calculating time...
          </p>
        )}
      </div>
    </div>
  );
};

const AuctionDetailPage = () => {
  const { auctionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser, token } = useSelector(
    (state) => state.auth.userData || {}
  ); // Adjusted to get user and token
  const socket = useSelector((state) => state.socket.socket); // Get the socket instance

  const [auction, setAuction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [bidError, setBidError] = useState("");
  const [bidSuccess, setBidSuccess] = useState("");
  const [isBidding, setIsBidding] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL;

  // --- Fetch initial auction data ---
  const fetchAuction = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auction/${auctionId}`, {});
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }
      const result = await response.json();
      if (result.status && result.data) {
        setAuction(result.data);
      } else {
        throw new Error(result.message || "Invalid data structure from API");
      }
    } catch (err) {
      console.error("Failed to fetch auction:", err);
      setError(err.message);
      setAuction(null);
    } finally {
      setIsLoading(false);
    }
  }, [auctionId, API_BASE_URL, token]); // Added token if used in fetch

  useEffect(() => {
    if (auctionId) {
      fetchAuction();
    }
  }, [auctionId, fetchAuction]);

  // --- Socket.IO Event Handling ---
  useEffect(() => {
    if (!socket || !auctionId) {
      // console.log("Socket or auctionId not available for event listeners.");
      return;
    }

    console.log(
      `AuctionDetailPage: Socket available (ID: ${socket.id}), attempting to join room for auction: ${auctionId}`
    );
    socket.emit("joinAuctionRoom", auctionId);

    const handleAuctionUpdated = (updatedAuctionData) => {
      console.log("Socket event: auction-updated received", updatedAuctionData);
      if (updatedAuctionData && updatedAuctionData._id === auctionId) {
        setAuction(updatedAuctionData);
        if (
          currentUser &&
          updatedAuctionData.highestBidder?._id !== currentUser.id
        ) {
          setBidSuccess(""); // Clear previous success if outbid
        }
        if (bidError) setBidError(""); // Clear local bid error if auction updates
        setIsBidding(false); // Ensure bidding spinner stops if it was active
      }
    };

    const handleBidPlacedSuccessfully = (data) => {
      console.log("Socket event: bid-placed-successfully received", data);
      if (data.auctionId === auctionId) {
        setBidSuccess(data.message || "Your bid was placed successfully!");
        setBidError("");
        setBidAmount("");
        setIsBidding(false);
        // The 'auction-updated' event will handle the full state update
      }
    };

    const handleBidError = (data) => {
      console.log("Socket event: bid-error received", data);
      if (data.auctionId === auctionId) {
        setBidError(data.message || "Bidding failed. Please try again.");
        setBidSuccess("");
        setIsBidding(false);
      }
    };
    const handleAuctionStarted = (data) => {
      console.log("Socket event: auctionStarted received", data);
      if (data.auctionId === auctionId) {
        // Re-fetch or update status, ideally server sends updated auction in `data`
        // For simplicity here, let's assume `data` contains the updated auction object or key fields
        setAuction((prev) => ({ ...prev, status: "active", ...data })); // Merge with new data
      }
    };

    const handleAuctionEnded = (data) => {
      console.log("Socket event: auctionEnded received", data);
      if (data.auctionId === auctionId) {
        setAuction((prev) => ({
          ...prev,
          status: data.status || "ended",
          ...data,
        }));
      }
    };

    socket.on("auction-updated", handleAuctionUpdated);
    socket.on("bid-placed-successfully", handleBidPlacedSuccessfully);
    socket.on("bid-error", handleBidError);
    socket.on("auctionStarted", handleAuctionStarted); // Listen for auction start
    socket.on("auctionEnded", handleAuctionEnded); // Listen for auction end

    // Cleanup: remove listeners and leave room
    return () => {
      console.log(
        `AuctionDetailPage: Cleaning up socket listeners and leaving room for auction: ${auctionId}`
      );
      socket.emit("leaveAuctionRoom", auctionId);
      socket.off("auction-updated", handleAuctionUpdated);
      socket.off("bid-placed-successfully", handleBidPlacedSuccessfully);
      socket.off("bid-error", handleBidError);
      socket.off("auctionStarted", handleAuctionStarted);
      socket.off("auctionEnded", handleAuctionEnded);
    };
  }, [socket, auctionId, currentUser, bidError]); // Add dependencies

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    if (!socket) {
      setBidError("Connection issue. Please refresh.");
      setIsBidding(false); // Ensure spinner stops
      return;
    }

    if (auction?.highestBidder && auction.highestBidder._id == currentUser.id) {
      alert("You Already Have Highest Bid !!");
      return;
    }
    setBidError("");
    setBidSuccess("");
    // Client-side validation
    if (!currentUser) {
      setBidError("Please log in to place a bid.");
      return;
    }
    if (!auction || auction.status !== "active") {
      setBidError("Bidding is not active for this auction.");
      return;
    }
    // Compare with `currentUser.id` from Redux
    if (currentUser.id === auction.createdBy?._id) {
      setBidError("You cannot bid on your own auction.");
      return;
    }
    const numericBidAmount = parseFloat(bidAmount);
    if (isNaN(numericBidAmount) || numericBidAmount <= 0) {
      setBidError("Please enter a valid bid amount.");
      return;
    }
    const minIncrement = auction.minimumIncrement || 1;
    const minNextBid = auction.currentPrice + minIncrement;
    if (numericBidAmount < minNextBid) {
      setBidError(`Your bid must be at least $${minNextBid.toFixed(2)}.`);
      return;
    }

    setIsBidding(true);
    socket.emit("place-bid", {
      bidderId: currentUser.id, // Use ID from Redux
      bidderUsername: currentUser.username, // Send username if backend uses it for initial display
      auctionId: auctionId,
      amount: numericBidAmount,
    });
    // setIsBidding will be set to false by socket event handlers ('bid-placed-successfully' or 'bid-error')
  };

  const handleAuctionEndCallback = useCallback(() => {
    // Renamed to avoid conflict
    if (auction && auction.status === "active") {
      // This client-side update is a fallback.
      // The server should ideally emit an 'auctionEnded' event.
      console.log(
        "Countdown ended for active auction, client marking as ended/sold."
      );
      setAuction((prev) => ({
        ...prev,
        status: prev.bids && prev.bids.length > 0 ? "sold" : "ended",
      }));
    }
  }, [auction]);

  const isAuctionActive = useMemo(
    () =>
      auction?.status === "active" && new Date(auction?.endTime) > new Date(),
    [auction]
  );

  const minBidAmount = useMemo(
    () =>
      auction
        ? (auction.currentPrice + (auction.minimumIncrement || 1)).toFixed(2)
        : "0.00",
    [auction]
  );

  if (isLoading && !auction) {
    // Show loader only if auction is not yet fetched
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)] text-indigo-600">
        <AiOutlineLoading3Quarters className="animate-spin text-4xl md:text-5xl" />
        <span className="ml-3 mt-3 text-lg">Loading Auction Details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8 text-center">
        <FiXCircle className="text-6xl text-red-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-700 mb-2">Error</h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <Link
          to="/"
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-150"
        >
          Back to Auctions
        </Link>
      </div>
    );
  }

  if (!auction) {
    // If !isLoading but auction is still null (e.g. fetch completed but no data)
    return (
      <div className="container mx-auto p-8 text-center">
        <FiXCircle className="text-6xl text-red-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-700 mb-4">
          Auction Not Found
        </h1>
        <p className="text-gray-600 mb-6">
          The auction you are looking for might not exist or an error occurred.
        </p>
        <Link
          to="/"
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-150"
        >
          Back to Auctions
        </Link>
      </div>
    );
  }

  // Ensure currentUser is available before trying to access its properties
  const isSeller = currentUser && currentUser.id === auction.createdBy?._id;

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <FiArrowLeft className="mr-2 h-4 w-4" />
        Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-xl">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              {auction.title}
            </h1>
            <h2 className="text-2xl font-semibold text-gray-700 mb-3 mt-6">
              Description
            </h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
              {auction.description}
            </p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 p-3 rounded-md flex items-center">
                <FiGrid className="mr-2 text-indigo-500" />
                <div>
                  <strong className="text-gray-700 block">Category:</strong>
                  {auction.category || "N/A"}
                </div>
              </div>
              {auction.condition && (
                <div className="bg-gray-50 p-3 rounded-md flex items-center">
                  <FiAlertCircle className="mr-2 text-blue-500" />
                  <div>
                    <strong className="text-gray-700 block">Condition:</strong>
                    {auction.condition}
                  </div>
                </div>
              )}
              {auction.location && (
                <div className="bg-gray-50 p-3 rounded-md flex items-center">
                  <FiMapPin className="mr-2 text-green-500" />
                  <div>
                    <strong className="text-gray-700 block">Location:</strong>
                    {auction.location}
                  </div>
                </div>
              )}
              <div className="bg-gray-50 p-3 rounded-md flex items-center">
                <FiUsers className="mr-2 text-purple-500" />
                <div>
                  <strong className="text-gray-700 block">Seller:</strong>
                  {auction.createdBy?.username ||
                    auction.createdBy?.name ||
                    auction.createdBy?._id ||
                    "Unknown"}
                </div>
              </div>
            </div>
          </div>

          {/* Bid History Section */}
          <div className="bg-white p-6 rounded-xl shadow-xl">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              Bid History ({auction.bids?.length || 0})
            </h2>
            {auction.bids && auction.bids.length > 0 ? (
              <ul className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                {auction.bids
                  .sort(
                    (a, b) =>
                      new Date(b.timestamp || b.createdAt) -
                      new Date(a.timestamp || a.createdAt)
                  ) // Ensure sorted by time desc
                  .map(
                    (
                      bid // Removed index as key
                    ) => (
                      <li
                        key={bid._id} // Use bid._id from database as key
                        className={`p-3 rounded-md border ${
                          bid.bidder?._id === currentUser?.id
                            ? "bg-indigo-50 border-indigo-200"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span
                            className={`font-semibold ${
                              bid.bidder?._id === currentUser?.id
                                ? "text-indigo-700"
                                : "text-gray-800"
                            }`}
                          >
                            {bid.bidder?._id === currentUser?.id
                              ? "Your Bid"
                              : bid.bidder?.username || "Anonymous"}
                          </span>
                          <span className="text-lg font-bold text-green-600">
                            ${bid.amount?.toFixed(2) || "0.00"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {bid.timestamp || bid.createdAt
                            ? new Date(
                                bid.timestamp || bid.createdAt
                              ).toLocaleString()
                            : "N/A"}
                        </p>
                      </li>
                    )
                  )}
              </ul>
            ) : (
              <p className="text-gray-500 italic">
                No bids placed yet.
                {currentUser &&
                  !isSeller &&
                  auction.status === "active" &&
                  " Be the first!"}
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Bidding Box */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-xl sticky top-20">
            <h2 className="text-2xl font-semibold text-gray-700 mb-1">
              Auction Status
            </h2>
            <CountdownTimer
              endTime={auction.endTime}
              startTime={auction.startTime} // Pass startTime to countdown
              onAuctionEnd={handleAuctionEndCallback}
              status={auction.status}
            />
            <div className="my-6 space-y-2">
              <div className="flex justify-between items-center text-lg">
                <span className="text-gray-600 flex items-center">
                  <FiTag className="mr-2" />
                  Current Price:
                </span>
                <span className="font-bold text-2xl text-indigo-700">
                  ${auction.currentPrice?.toFixed(2) || "0.00"}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 flex items-center">
                  <FiDollarSign className="mr-2" />
                  Starting Price:
                </span>
                <span className="text-gray-700">
                  ${auction.startingPrice?.toFixed(2) || "0.00"}
                </span>
              </div>
              {auction.highestBidder && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 flex items-center">
                    <FiUsers className="mr-2" />
                    Highest Bidder:
                  </span>
                  <span className="text-gray-700 font-medium">
                    {auction.highestBidder === currentUser?.id
                      ? "You"
                      : auction.highestBidder?.username || "Unknown"}
                  </span>
                </div>
              )}
            </div>

            {!currentUser && isAuctionActive && (
              <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FiInfo
                      className="h-5 w-5 text-yellow-400"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm">
                      You need to be logged in to place a bid.
                      <Link
                        to="/login"
                        state={{ from: location }}
                        className="font-medium underline hover:text-yellow-600 ml-1"
                      >
                        Login here
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {currentUser && isSeller && isAuctionActive && (
              <div className="mt-4 p-3 bg-blue-50 text-sm text-blue-700 rounded-md text-center">
                You cannot bid on your own auction.
              </div>
            )}

            {currentUser && !isSeller && isAuctionActive && (
              <form onSubmit={handleBidSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="bidAmount"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Your Bid (Min. ${minBidAmount})
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      name="bidAmount"
                      id="bidAmount"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      step={auction.minimumIncrement || "0.01"}
                      min={minBidAmount}
                      required
                      disabled={isBidding}
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md py-2.5"
                      placeholder={minBidAmount}
                    />
                  </div>
                </div>
                {bidError && (
                  <p className="text-xs text-red-600 flex items-center">
                    <FiXCircle className="mr-1" /> {bidError}
                  </p>
                )}
                {bidSuccess && (
                  <p className="text-xs text-green-600 flex items-center">
                    <FiCheckCircle className="mr-1" /> {bidSuccess}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={
                    isBidding || !auction || auction.status !== "active"
                  }
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-md font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
                >
                  {isBidding ? (
                    <AiOutlineLoading3Quarters className="animate-spin h-5 w-5" />
                  ) : (
                    "Place Bid"
                  )}
                </button>
              </form>
            )}
            {auction.status === "pending" && (
              <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FiClock
                      className="h-5 w-5 text-yellow-400"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium">Auction Pending</h3>
                    <div className="mt-1 text-sm">
                      <p>
                        This auction has not started yet. Bidding will open on{" "}
                        {new Date(auction.startTime).toLocaleString()}.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {auction.status === "sold" && (
              <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-500">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FiCheckCircle
                      className="h-5 w-5 text-green-400"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Auction Sold!
                    </h3>
                    {auction.highestBidder && (
                      <div className="mt-1 text-sm text-green-700">
                        <p>
                          Winner:{" "}
                          {auction.highestBidder?._id === currentUser?.id
                            ? "You"
                            : auction.highestBidder?.username || "Unknown"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            {(auction.status === "ended" || auction.status === "cancelled") &&
              !(auction.status === "sold") && (
                <div className="mt-6 p-4 bg-gray-100 text-gray-700 rounded-md text-center">
                  <p className="font-semibold">
                    This auction has {auction.status}.
                  </p>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionDetailPage;
