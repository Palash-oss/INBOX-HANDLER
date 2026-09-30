"use client";

import React, { useEffect, useRef } from "react";
import { Search, X, Loader2, Terminal } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  isLoading?: boolean;
}

const QUICK_TEST_QUERIES = [
  { label: "Attendee: Dana", query: "dana" },
  { label: "Title: Invoice sync", query: "invoice" },
  { label: "Project: Harborline", query: "harborline" },
  { label: "Defect: run-999", query: "run-999" },
  { label: "Manifest", query: "manifest" },
];

export function SearchBar({ value, onChange, isLoading }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Press '/' to focus search box, 'Escape' to clear
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === "Escape" && document.activeElement === inputRef.current) {
        if (value) {
          onChange("");
        } else {
          inputRef.current?.blur();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [value, onChange]);

  return (
    <div className="w-full space-y-3">
      {/* Main Search Input */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-emerald-600 transition-colors">
          {isLoading ? (
            <Loader2 className="h-4.5 w-4.5 sm:h-5 sm:w-5 animate-spin text-emerald-600" />
          ) : (
            <Search className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-zinc-500 group-focus-within:text-emerald-600 transition-colors" strokeWidth={2.2} />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          suppressHydrationWarning
          placeholder="Search by title, attendee, project, or notes..."
          className="w-full pl-10 sm:pl-11 pr-10 sm:pr-24 py-3 sm:py-3.5 bg-white hover:bg-zinc-50/50 border-2 border-zinc-200 focus:border-emerald-600 rounded-xl text-zinc-950 placeholder-zinc-400 text-sm sm:text-base font-medium shadow-xs transition-all outline-none focus:ring-4 focus:ring-emerald-500/10"
        />

        <div className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center space-x-2">
          {value ? (
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => onChange("")}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors cursor-pointer"
              title="Clear search (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-xs font-mono font-bold text-zinc-500 bg-zinc-100 border border-zinc-300 rounded shadow-2xs">
              /
            </kbd>
          )}
        </div>
      </div>

      {/* Target Fields indicator & Quick Chips */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
        <div className="flex items-center space-x-1.5 sm:space-x-2 text-zinc-500 font-mono overflow-x-auto no-scrollbar py-0.5">
          <Terminal className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span className="text-zinc-500 uppercase tracking-wider text-[11px] font-bold shrink-0">Scope:</span>
          <span className="px-1.5 sm:px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200 font-semibold shrink-0">
            Titles
          </span>
          <span className="px-1.5 sm:px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200 font-semibold shrink-0">
            Attendees
          </span>
          <span className="px-1.5 sm:px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200 font-semibold shrink-0">
            Projects
          </span>
          <span className="px-1.5 sm:px-2 py-0.5 rounded bg-zinc-100 text-zinc-800 border border-zinc-200 font-semibold shrink-0">
            Summaries
          </span>
        </div>

        {/* Quick Test Chips for Evaluator */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-zinc-400 font-mono text-[11px] font-bold hidden md:inline shrink-0">TRY:</span>
          {QUICK_TEST_QUERIES.map((item) => (
            <button
              key={item.query}
              type="button"
              suppressHydrationWarning
              onClick={() => onChange(item.query)}
              className="px-2.5 py-1 rounded bg-zinc-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-zinc-200 text-zinc-700 transition-all font-mono text-xs font-semibold cursor-pointer shrink-0 whitespace-nowrap active:scale-95"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
