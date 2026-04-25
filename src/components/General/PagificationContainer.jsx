import React, { useEffect, useMemo, useState } from "react";
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
  rowsPerPage,
  currentPage,
  setCurrentPage,
  itemName = "items",
  siblingCount = 1,
  jumpStep = 5,
  rowsPerPageOptions = [10, 20, 50, 100],
  onRowsPerPageChange = null,
  initialRowsPerPage = 10,
  enableRowsPerPageControl = true
}) => {
  const [internalCurrentPage, setInternalCurrentPage] = useState(1);
  const [internalRowsPerPage, setInternalRowsPerPage] = useState(initialRowsPerPage);

  const isPageControlled = typeof currentPage === "number" && typeof setCurrentPage === "function";
  const isRowsPerPageControlled = typeof rowsPerPage === "number" && typeof onRowsPerPageChange === "function";

  const resolvedRowsPerPage = isRowsPerPageControlled ? rowsPerPage : internalRowsPerPage;
  const resolvedCurrentPage = isPageControlled ? currentPage : internalCurrentPage;

  const setResolvedCurrentPage = isPageControlled ? setCurrentPage : setInternalCurrentPage;
  const setResolvedRowsPerPage = isRowsPerPageControlled ? onRowsPerPageChange : setInternalRowsPerPage;

  const totalItems = Array.isArray(data) ? data.length : 0;
  const safeRowsPerPage = Math.max(1, resolvedRowsPerPage);
  const totalPages = Math.max(1, Math.ceil(totalItems / safeRowsPerPage));
  const safeCurrentPage = Math.min(Math.max(1, resolvedCurrentPage), totalPages);
  const canChangePage = typeof setResolvedCurrentPage === "function";
  const hasRowsControl =
    enableRowsPerPageControl && Array.isArray(rowsPerPageOptions) && rowsPerPageOptions.length > 0;

  const paginatedData = useMemo(() => {
    const start = (safeCurrentPage - 1) * safeRowsPerPage;
    return (Array.isArray(data) ? data : []).slice(start, start + safeRowsPerPage);
  }, [data, safeCurrentPage, safeRowsPerPage]);

  useEffect(() => {
    if (safeCurrentPage !== resolvedCurrentPage) {
      setResolvedCurrentPage(safeCurrentPage);
    }
  }, [resolvedCurrentPage, safeCurrentPage, setResolvedCurrentPage]);

  const visiblePages = useMemo(() => {
    return buildVisiblePages(safeCurrentPage, totalPages, siblingCount);
  }, [safeCurrentPage, siblingCount, totalPages]);

  const goToPage = (page) => {
    if (!canChangePage) {
      return;
    }

    const nextPage = Math.min(Math.max(1, page), totalPages);
    if (nextPage !== safeCurrentPage) {
      setResolvedCurrentPage(nextPage);
    }
  };

  const handleRowsPerPageChange = (nextRowsPerPage) => {
    setResolvedRowsPerPage(nextRowsPerPage);
    setResolvedCurrentPage(1);
  };

  const content =
    typeof children === "function"
      ? children(paginatedData, {
          currentPage: safeCurrentPage,
          rowsPerPage: safeRowsPerPage,
          totalPages,
          totalItems
        })
      : children;

  return (
    <div className="pagificationContainer">
      {content}

      <div className="pagification">
        <div className="pageInfoSection">
          <div className="pageInfo">
            <span>
              Page {safeCurrentPage} of {totalPages} | {totalItems} {itemName}
            </span>
          </div>
          {hasRowsControl && (
            <div className="rowsPerPageControl">
              <label htmlFor="rows-per-page-select">Rows per page:</label>
              <select
                id="rows-per-page-select"
                value={safeRowsPerPage}
                onChange={(event) => handleRowsPerPageChange(Number(event.target.value))}
              >
                {rowsPerPageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )}
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
