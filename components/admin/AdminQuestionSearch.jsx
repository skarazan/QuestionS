"use client";

import { useRouter, usePathname } from "next/navigation";
import { useRef } from "react";
import { Search, X } from "lucide-react";

const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"];

const difficultyStyles = {
  EASY: "bg-emerald-900/60 text-emerald-300 border-emerald-700 hover:bg-emerald-900",
  MEDIUM: "bg-amber-900/60 text-amber-300 border-amber-700 hover:bg-amber-900",
  HARD: "bg-red-900/60 text-red-300 border-red-700 hover:bg-red-900",
};
const difficultyActiveStyles = {
  EASY: "bg-emerald-800 text-emerald-100 border-emerald-500",
  MEDIUM: "bg-amber-800 text-amber-100 border-amber-500",
  HARD: "bg-red-800 text-red-100 border-red-500",
};

export default function AdminQuestionSearch({
  courseId,
  topicId,
  defaultQ,
  defaultDifficulty,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef(null);

  function buildUrl({ q, difficulty }) {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (difficulty) p.set("difficulty", difficulty);
    // reset to page 1 on new search
    return `${pathname}${p.toString() ? `?${p.toString()}` : ""}`;
  }

  function handleSearch(e) {
    e.preventDefault();
    const q = inputRef.current?.value.trim() || "";
    router.push(buildUrl({ q, difficulty: defaultDifficulty }));
  }

  function clearSearch() {
    if (inputRef.current) inputRef.current.value = "";
    router.push(buildUrl({ q: "", difficulty: defaultDifficulty }));
  }

  function toggleDifficulty(d) {
    const next = defaultDifficulty === d ? "" : d;
    router.push(buildUrl({ q: defaultQ, difficulty: next }));
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="relative flex-1 min-w-48 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
        <input
          ref={inputRef}
          type="text"
          defaultValue={defaultQ}
          placeholder="Search questions…"
          className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg pl-8 pr-8 py-2 focus:outline-none focus:border-blue-500 placeholder:text-slate-600"
        />
        {defaultQ && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </form>

      {/* Difficulty filters */}
      <div className="flex gap-1.5">
        {DIFFICULTIES.map((d) => {
          const active = defaultDifficulty === d;
          return (
            <button
              key={d}
              onClick={() => toggleDifficulty(d)}
              className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors ${
                active ? difficultyActiveStyles[d] : difficultyStyles[d]
              }`}
            >
              {d}
            </button>
          );
        })}
        {(defaultQ || defaultDifficulty) && (
          <button
            onClick={() => router.push(pathname)}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white border border-slate-700 rounded transition-colors"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
