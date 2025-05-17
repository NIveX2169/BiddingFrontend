import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import AuctionCard from "../../components/auctionCard/auctionCard";
import axios from "axios";
import { useSelector } from "react-redux";
// Removed: import Pagination from "../../components/pagination/Pagination";

const API_BASE_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL;

// --- Custom Pagination Component ---
const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
}) => {
  // Calculate start and end item numbers for display
  const startItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (pageNumber) => {
    if (pageNumber !== currentPage) {
      onPageChange(pageNumber);
    }
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const delta = 1; // Number of pages to show around the current page
    const range = {
      start: Math.round(currentPage - delta),
      end: Math.round(currentPage + delta),
    };

    if (range.start <= 0) {
      range.end += Math.abs(range.start) + 1;
      range.start = 1;
    }
    if (range.end > totalPages) {
      range.start -= range.end - totalPages;
      range.end = totalPages;
    }
    if (range.start <= 0) range.start = 1; // Ensure start is at least 1

    // Always show first page
    if (range.start > 1) {
      pageNumbers.push(1);
      if (range.start > 2) {
        pageNumbers.push("...");
      }
    }

    // Pages in range
    for (let i = range.start; i <= range.end; i++) {
      pageNumbers.push(i);
    }

    // Always show last page
    if (range.end < totalPages) {
      if (range.end < totalPages - 1) {
        pageNumbers.push("...");
      }
      pageNumbers.push(totalPages);
    }

    // Handle cases with few pages where ellipsis logic might overcomplicate
    if (totalPages <= delta * 2 + 3) {
      // e.g. delta=1, show up to 5 pages fully
      const simplePages = [];
      for (let i = 1; i <= totalPages; i++) {
        simplePages.push(i);
      }
      return simplePages;
    }

    return pageNumbers;
  };

  // Don't render pagination if not needed (e.g., only one page)
  // This check is also present in MyAuction, but good for component reusability
  if (totalPages <= 1) {
    return null;
  }

  const pageNumbersToDisplay = getPageNumbers();

  return (
    <div className="mt-8 py-4 flex flex-col md:flex-row justify-between items-center text-sm text-gray-700 border-t border-gray-200">
      <div className="mb-4 md:mb-0">
        Showing <span className="font-semibold text-gray-900">{startItem}</span>{" "}
        to <span className="font-semibold text-gray-900">{endItem}</span> of{" "}
        <span className="font-semibold text-gray-900">{totalItems}</span>{" "}
        results
      </div>

      <nav aria-label="Pagination">
        <ul className="inline-flex items-center -space-x-px">
          <li>
            <button
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className={`px-3 h-9 leading-tight text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150 ease-in-out`}
              aria-label="Previous page"
            >
              Previous
            </button>
          </li>

          {pageNumbersToDisplay.map((page, index) => (
            <li key={`page-${page === "..." ? `dots-${index}` : page}`}>
              {typeof page === "number" ? (
                <button
                  onClick={() => handlePageClick(page)}
                  aria-current={currentPage === page ? "page" : undefined}
                  className={`px-3 h-9 leading-tight border border-gray-300 transition-colors duration-150 ease-in-out ${
                    currentPage === page
                      ? "text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700 z-10"
                      : "text-gray-500 bg-white hover:bg-gray-100 hover:text-gray-700"
                  }`}
                >
                  {page}
                </button>
              ) : (
                <span className="px-3 h-9 leading-tight text-gray-500 bg-white border border-gray-300">
                  {page} {/* Ellipsis */}
                </span>
              )}
            </li>
          ))}

          <li>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className={`px-3 h-9 leading-tight text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150 ease-in-out`}
              aria-label="Next page"
            >
              Next
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};
// --- End of Pagination Component ---

const MyAuction = () => {
  const [auctionsData, setAuctionsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPagesFromAPI, setTotalPagesFromAPI] = useState(1);
  const [totalAuctionsFromAPI, setTotalAuctionsFromAPI] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortBy, setSortBy] = useState("endTime");
  const [sortOrder, setSortOrder] = useState("asc");

  const { user: currentUser } = useSelector(
    (state) => state.auth.userData || {}
  );
  const socket = useSelector((state) => state.socket.socket);

  const availableItemsPerPage = [5, 10, 15, 20, 50];
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchAuctions = useCallback(async () => {
    if (!currentUser && window.location.pathname.includes("/my-auctions")) {
      setIsLoading(false);
      setAuctionsData([]);
      setTotalAuctionsFromAPI(0);
      setTotalPagesFromAPI(1);
      return;
    }
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams({
      page: currentPage,
      limit: itemsPerPage,
      sortBy: sortBy,
      sortOrder: sortOrder,
    });
    if (debouncedSearchTerm) params.append("search", debouncedSearchTerm);
    if (statusFilter) params.append("status", statusFilter);
    if (categoryFilter) params.append("category", categoryFilter);

    const isMyAuctionsRoute = window.location.pathname.includes("/my-auctions");
    let endpoint = `${API_BASE_URL}/auction`;
    if (isMyAuctionsRoute) {
      endpoint = `${API_BASE_URL}/auction/my-auctions`;
    }

    try {
      const response = await axios.get(`${endpoint}?${params.toString()}`, {
        withCredentials: true,
      });
      const result = response.data;
      if (result.status && result.data && Array.isArray(result.data)) {
        setAuctionsData(result.data);
        setTotalPagesFromAPI(result.totalPages || 1);
        setTotalAuctionsFromAPI(result.totalAuctions || 0);
        setCurrentPage(result.currentPage || 1);
      } else {
        throw new Error(
          result.message || "Invalid data structure or no auctions found"
        );
      }
    } catch (err) {
      console.error("Error fetching auctions:", err);
      let errorMessage = "An unexpected error occurred.";
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      setAuctionsData([]);
      setTotalAuctionsFromAPI(0);
      setTotalPagesFromAPI(1);
    } finally {
      setIsLoading(false);
    }
  }, [
    currentUser,
    currentPage,
    itemsPerPage,
    debouncedSearchTerm,
    statusFilter,
    categoryFilter,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  useEffect(() => {
    // Reset to page 1 when filters or itemsPerPage change
    // to avoid being on a page that no longer exists with new filter results.
    if (currentPage !== 1) {
      // Only reset if not already on page 1 to avoid unnecessary fetches
      setCurrentPage(1);
    }
  }, [
    debouncedSearchTerm,
    statusFilter,
    categoryFilter,
    sortBy,
    sortOrder,
    itemsPerPage,
  ]);

  useEffect(() => {
    if (!socket || !auctionsData.length) return;

    auctionsData.forEach((auction) => {
      if (auction._id) socket.emit("joinAuctionRoom", auction._id);
    });

    const handleAuctionEvent = (updatedAuctionData) => {
      console.log("Socket: auction event received", updatedAuctionData);
      setAuctionsData((prevAuctions) =>
        prevAuctions.map((auction) =>
          auction._id === updatedAuctionData._id
            ? { ...auction, ...updatedAuctionData }
            : auction
        )
      );
    };

    const handleStatusSpecificEvent = (eventData) => {
      if (eventData.auctionId && eventData.data) {
        setAuctionsData((prevAuctions) =>
          prevAuctions.map((auc) =>
            auc._id === eventData.auctionId
              ? { ...auc, ...eventData.data, status: eventData.status }
              : auc
          )
        );
      }
    };

    socket.on("auction-updated", handleAuctionEvent);
    socket.on("auctionStarted", handleStatusSpecificEvent);
    socket.on("auctionEnded", handleStatusSpecificEvent);

    return () => {
      auctionsData.forEach((auction) => {
        if (auction._id) socket.emit("leaveAuctionRoom", auction._id);
      });
      socket.off("auction-updated", handleAuctionEvent);
      socket.off("auctionStarted", handleStatusSpecificEvent);
      socket.off("auctionEnded", handleStatusSpecificEvent);
    };
  }, [socket, auctionsData, fetchAuctions]); // fetchAuctions might be re-added if specific socket events should trigger a full reload.

  const uniqueCategories = useMemo(
    () => [
      "Electronics",
      "Fashion",
      "Home & Garden",
      "Collectibles",
      "Art & Crafts",
      "Books",
      "Other",
    ],
    []
  );
  const uniqueStatuses = useMemo(
    () => ["pending", "active", "sold", "ended", "cancelled"],
    []
  );

  if (isLoading && auctionsData.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)] text-indigo-600">
        <AiOutlineLoading3Quarters className="animate-spin text-4xl md:text-5xl" />
        <span className="ml-3 mt-3 text-lg">Loading Auctions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8 text-center">
        <h2 className="text-2xl font-semibold text-red-600">Error</h2>
        <p className="text-red-500 mt-2">{error}</p>
        <button
          onClick={fetchAuctions}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const isMyAuctionsRouteCheck =
    window.location.pathname.includes("/my-auctions");
  if (!currentUser && isMyAuctionsRouteCheck && !isLoading) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h2 className="text-2xl font-semibold text-gray-700">Access Denied</h2>
        <p className="text-gray-600 mt-2">
          Please log in to view your auctions.
        </p>
        <Link
          to="/login"
          className="mt-4 inline-block px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Login
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="mb-8 flex flex-wrap justify-between items-center text-center md:text-left">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
            {isMyAuctionsRouteCheck ? "My Auctions" : "All Auctions"}
          </h1>
          <p className="text-gray-600 mt-1">
            {isMyAuctionsRouteCheck
              ? "Manage and view auctions you have created."
              : "Browse available auctions."}
          </p>
        </div>
        {currentUser && (
          <div className="mt-4 md:mt-0">
            <Link
              to="/dashboard/create-auction"
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-sm font-medium"
            >
              Create New Auction
            </Link>
          </div>
        )}
      </div>

      <div className="mb-6 p-4 bg-white shadow rounded-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 items-end">
          <div className="lg:col-span-2 xl:col-span-2">
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Search
            </label>
            <input
              type="text"
              id="search"
              placeholder="Search by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="statusFilter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Status
            </label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">All</option>
              {uniqueStatuses.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="categoryFilter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Category
            </label>
            <select
              id="categoryFilter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">All</option>
              {uniqueCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="sortBy"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Sort By
            </label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="endTime">End Time</option>
              <option value="startTime">Start Time</option>
              <option value="createdAt">Date Created</option>
              <option value="currentPrice">Price</option>
              <option value="title">Title</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="sortOrder"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Order
            </label>
            <select
              id="sortOrder"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mb-4 flex justify-end items-center">
        <label
          htmlFor="itemsPerPage"
          className="text-sm font-medium text-gray-700 mr-2"
        >
          Items per page:
        </label>
        <select
          id="itemsPerPage"
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
          className="px-3 py-1.5 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          {availableItemsPerPage.map((num) => (
            <option key={num} value={num}>
              {num}
            </option>
          ))}
        </select>
      </div>

      {isLoading && auctionsData.length > 0 && (
        <div className="text-center my-4 text-indigo-500">
          <AiOutlineLoading3Quarters className="animate-spin text-2xl inline-block mr-2" />
          <span>Loading...</span>
        </div>
      )}

      {!isLoading && auctionsData.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {auctionsData.map((auction) => {
            const edit = currentUser?.id == auction.createdBy?._id;
            return (
              <AuctionCard
                key={auction._id}
                auction={auction}
                isMyAuctionsPage={edit}
              />
            );
          })}
        </div>
      ) : (
        !isLoading && (
          <div className="text-center py-10">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              {totalAuctionsFromAPI === 0 &&
              isMyAuctionsRouteCheck &&
              currentUser
                ? "You haven't created any auctions yet."
                : totalAuctionsFromAPI === 0
                ? "No auctions found."
                : "No Auctions Found Matching Filters"}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {totalAuctionsFromAPI === 0 &&
              isMyAuctionsRouteCheck &&
              currentUser
                ? "Create your first auction to see it here."
                : totalAuctionsFromAPI === 0
                ? "Check back later or try creating one!"
                : "Try adjusting your search or filter criteria."}
            </p>
            {totalAuctionsFromAPI === 0 &&
              isMyAuctionsRouteCheck &&
              currentUser && (
                <div className="mt-6">
                  <Link
                    to="/dashboard/create-auction"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Create Auction
                  </Link>
                </div>
              )}
          </div>
        )
      )}

      {/* Use the custom Pagination component */}
      {!isLoading && totalAuctionsFromAPI > 0 && totalPagesFromAPI > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPagesFromAPI}
          onPageChange={setCurrentPage} // This will trigger fetchAuctions via useEffect
          itemsPerPage={itemsPerPage}
          totalItems={totalAuctionsFromAPI}
        />
      )}
    </div>
  );
};

export default MyAuction;
