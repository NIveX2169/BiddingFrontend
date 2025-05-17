import React from 'react';
import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';

const Pagination = ({
    currentPage,     // From API response
    totalPages,      // From API response
    onPageChange,    // Client function to request new page
    hasNextPage,     // From API response
    hasPrevPage,     // From API response
    itemsPerPage,
    totalItems,
    maxPageNumbersToShow = 5,
}) => {
    // If totalPages is 1 or less, or if there are no items, don't render.
    if (totalPages <= 1 || totalItems === 0) {
        return null;
    }

    const handlePageClick = (pageNumber) => {
        // Basic validation, though API's hasNext/Prev should guide this
        if (pageNumber >= 1 && pageNumber <= totalPages && pageNumber !== currentPage) {
            onPageChange(pageNumber);
        }
    };

    const getPageNumbers = () => {
        // ... (getPageNumbers logic can remain the same as it's for displaying numbered links)
        const pageNumbers = [];
        const halfMax = Math.floor(maxPageNumbersToShow / 2);
        let startPage = Math.max(1, currentPage - halfMax);
        let endPage = Math.min(totalPages, currentPage + halfMax);
        if (currentPage - halfMax < 1) endPage = Math.min(totalPages, maxPageNumbersToShow);
        if (currentPage + halfMax > totalPages) startPage = Math.max(1, totalPages - maxPageNumbersToShow + 1);
        if (maxPageNumbersToShow % 2 === 0 && startPage > 1 && endPage < totalPages) {
            startPage = Math.max(1, currentPage - halfMax + 1);
        }
        for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);
        return pageNumbers;
    };

    const pageNumbersToDisplay = getPageNumbers();
    const showFirstEllipsis = pageNumbersToDisplay[0] > 2;
    const showLastEllipsis = pageNumbersToDisplay[pageNumbersToDisplay.length - 1] < totalPages - 1;

    const firstItemIndex = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
    const lastItemIndex = totalItems > 0 ? Math.min(currentPage * itemsPerPage, totalItems) : 0;

    return (
        <nav
            aria-label="Pagination"
            className="flex flex-col sm:flex-row items-center justify-between py-3 mt-8 border-t border-gray-200"
        >
            {itemsPerPage && totalItems > 0 && (
                <div className="text-sm text-gray-700 mb-2 sm:mb-0">
                    Showing <span className="font-medium">{firstItemIndex}</span>
                     to <span className="font-medium">{lastItemIndex}</span>
                     of <span className="font-medium">{totalItems}</span> results
                </div>
            )}
             {itemsPerPage && totalItems === 0 && ( <div className="text-sm text-gray-700 mb-2 sm:mb-0"> No results </div> )}

            <div className={`flex-1 flex justify-center sm:justify-end ${!(itemsPerPage && totalItems > 0) && 'w-full'}`}>
                <button
                    onClick={() => handlePageClick(1)}
                    disabled={!hasPrevPage && currentPage === 1} // Disable if no prev or already on first
                    className="..." // Add your styles
                    aria-label="First Page"
                > <FiChevronsLeft className="h-5 w-5" /> </button>
                <button
                    onClick={() => handlePageClick(currentPage - 1)}
                    disabled={!hasPrevPage} // Directly use API's hasPrevPage
                    className="..." // Add your styles
                    aria-label="Previous Page"
                > <FiChevronLeft className="h-5 w-5" /> </button>

                {/* Page number display logic can remain similar, as it's about visual representation */}
                {pageNumbersToDisplay[0] > 1 && ( <button onClick={() => handlePageClick(1)} className="...">1</button> )}
                {showFirstEllipsis && ( <span className="...">...</span> )}
                {pageNumbersToDisplay.map((number) => ( /* ... */ ))}
                {showLastEllipsis && ( <span className="...">...</span> )}
                {pageNumbersToDisplay[pageNumbersToDisplay.length - 1] < totalPages && ( <button onClick={() => handlePageClick(totalPages)} className="..."> {totalPages} </button> )}

                <button
                    onClick={() => handlePageClick(currentPage + 1)}
                    disabled={!hasNextPage} // Directly use API's hasNextPage
                    className="..." // Add your styles
                    aria-label="Next Page"
                > <FiChevronRight className="h-5 w-5" /> </button>
                <button
                    onClick={() => handlePageClick(totalPages)}
                    disabled={!hasNextPage && currentPage === totalPages} // Disable if no next or already on last
                    className="..." // Add your styles
                    aria-label="Last Page"
                > <FiChevronsRight className="h-5 w-5" /> </button>
            </div>
        </nav>
    );
};
export default Pagination;