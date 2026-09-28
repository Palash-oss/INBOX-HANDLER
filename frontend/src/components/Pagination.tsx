"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  limit,
  hasPrev,
  hasNext,
  onPageChange,
  onLimitChange,
}: PaginationProps) {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalItems);

  const pages: (number | string)[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 border-t border-zinc-200 text-xs font-mono text-zinc-500">
      {/* Range and count */}
      <div className="flex items-center space-x-2">
        <span>
          Showing <strong className="text-zinc-950">{startItem}</strong> -{" "}
          <strong className="text-zinc-950">{endItem}</strong> of{" "}
          <strong className="text-emerald-700 font-bold">{totalItems}</strong> records
        </span>

        <span className="text-zinc-300">|</span>

        <div className="flex items-center space-x-1.5">
          <span className="uppercase text-[10px] font-bold">Per page:</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="bg-white border border-zinc-300 rounded px-2 py-0.5 text-zinc-900 font-bold focus:outline-none"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Page navigation buttons */}
      <div className="flex items-center space-x-1.5">
        <button
          suppressHydrationWarning
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrev}
          className="p-2 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-800 transition-colors cursor-pointer"
          title="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((p, idx) =>
          typeof p === "number" ? (
            <button
              key={p}
              suppressHydrationWarning
              onClick={() => onPageChange(p)}
              className={`min-w-[34px] h-8 px-2 rounded-lg font-mono font-bold transition-all text-xs cursor-pointer ${
                currentPage === p
                  ? "bg-zinc-950 text-white shadow-xs"
                  : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
              }`}
            >
              {p}
            </button>
          ) : (
            <span key={`ellipsis-${idx}`} className="px-1 text-zinc-400 font-bold">
              ...
            </span>
          )
        )}

        <button
          suppressHydrationWarning
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNext}
          className="p-2 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-800 transition-colors cursor-pointer"
          title="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
