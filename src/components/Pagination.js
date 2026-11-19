import React from 'react';
import '../styles/pagination.css';

function Pagination({ currentPage, totalPages, onPageChange, disabled }) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <nav className="pagination-container" aria-label="Pagination Navigation">
      <button
        className="pagination-btn pagination-nav-btn"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={disabled || currentPage === 1}
        aria-label="Previous Page"
      >
        &larr; Prev
      </button>

      <div className="pagination-pages">
        {pages.map((page, index) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                &hellip;
              </span>
            );
          }

          return (
            <button
              key={page}
              className={`pagination-btn pagination-page-btn ${
                currentPage === page ? 'active' : ''
              }`}
              onClick={() => onPageChange(page)}
              disabled={disabled}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </button>
          );
        })}
      </div>

      <button
        className="pagination-btn pagination-nav-btn"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={disabled || currentPage === totalPages}
        aria-label="Next Page"
      >
        Next &rarr;
      </button>
    </nav>
  );
}

export default Pagination;

