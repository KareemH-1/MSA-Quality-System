import React, { useMemo } from "react";
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import "./PagificationContainer.css";

const buildVisiblePages = (currentPage, totalPages, siblingCount) => {
  const pages = [];
  const safeSiblingCount = Math.max(0, siblingCount);
  const startPage = Math.max(2, currentPage - safeSiblingCount);
  const endPage = Math.min(totalPages - 1, currentPage + safeSiblingCount);

  pages.push(1);

  if (startPage > 2) {
    pages.push("left-ellipsis");
  }

  for (let page = startPage; page <= endPage; page += 1) {
    pages.push(page);
  }

  if (endPage < totalPages - 1) {
    pages.push("right-ellipsis");
  }

  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
};

const PagificationContainer = ({
  children,
  data = [],
  rowsPerPage = 10,
  currentPage = 1,
  setCurrentPage,
  itemName = "items",
  siblingCount = 1,
  jumpStep = 5
}) => {
  const totalItems = Array.isArray(data) ? data.length : 0;
  const safeRowsPerPage = Math.max(1, rowsPerPage);
  const totalPages = Math.max(1, Math.ceil(totalItems / safeRowsPerPage));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const canChangePage = typeof setCurrentPage === "function";

  const visiblePages = useMemo(() => {
    return buildVisiblePages(safeCurrentPage, totalPages, siblingCount);
  }, [safeCurrentPage, siblingCount, totalPages]);

  const goToPage = (page) => {
    if (!canChangePage) {
      return;
    }

    const nextPage = Math.min(Math.max(1, page), totalPages);
    if (nextPage !== safeCurrentPage) {
      setCurrentPage(nextPage);
    }
  };

  return (
    <div className="pagificationContainer">
      {children}

      <div className="pagification">
        <div className="pageInfo">
          <span>
            Page {safeCurrentPage} of {totalPages} | {totalItems} {itemName}
          </span>
        </div>

        <div className="pageControls">
          <button
            type="button"
            className="pageBtn"
            disabled={safeCurrentPage === 1 || !canChangePage}
            onClick={() => goToPage(1)}
            aria-label="Go to first page"
            title="First page"
          >
            <ChevronsLeft size={16} />
          </button>

          <button
            type="button"
            className="pageBtn"
            disabled={safeCurrentPage === 1 || !canChangePage}
            onClick={() => goToPage(safeCurrentPage - 1)}
            aria-label="Go to previous page"
            title="Previous page"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            type="button"
            className="pageBtn jumpBtn"
            disabled={safeCurrentPage === 1 || !canChangePage}
            onClick={() => goToPage(safeCurrentPage - jumpStep)}
            aria-label={`Skip back ${jumpStep} pages`}
            title={`Skip back ${jumpStep} pages`}
          >
            -{jumpStep}
          </button>

          {visiblePages.map((page) => {
            if (typeof page !== "number") {
              return (
                <span key={page} className="ellipsis" aria-hidden="true">
                  ...
                </span>
              );
            }

            return (
              <button
                key={page}
                type="button"
                className={`pageBtn numberBtn ${page === safeCurrentPage ? "active" : ""}`}
                onClick={() => goToPage(page)}
                disabled={!canChangePage}
                aria-current={page === safeCurrentPage ? "page" : undefined}
                aria-label={`Go to page ${page}`}
              >
                {page}
              </button>
            );
          })}

          <button
            type="button"
            className="pageBtn jumpBtn"
            disabled={safeCurrentPage === totalPages || !canChangePage}
            onClick={() => goToPage(safeCurrentPage + jumpStep)}
            aria-label={`Skip forward ${jumpStep} pages`}
            title={`Skip forward ${jumpStep} pages`}
          >
            +{jumpStep}
          </button>

          <button
            type="button"
            className="pageBtn"
            disabled={safeCurrentPage === totalPages || !canChangePage}
            onClick={() => goToPage(safeCurrentPage + 1)}
            aria-label="Go to next page"
            title="Next page"
          >
            <ChevronRight size={16} />
          </button>

          <button
            type="button"
            className="pageBtn"
            disabled={safeCurrentPage === totalPages || !canChangePage}
            onClick={() => goToPage(totalPages)}
            aria-label="Go to last page"
            title="Last page"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PagificationContainer;
