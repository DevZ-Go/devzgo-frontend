import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { SlidersHorizontal, ChevronDown, RotateCcw, Search, X } from "lucide-react";
import type { ProjectSort, TechStackItem } from "../api/projects";
import { PROJECT_CATEGORIES } from "../data/projectFormOptions";
import type { ExploreFilterState } from "../hooks/useExploreProjects";
import { Select } from "./ui/Select";

const SORT_OPTIONS: Array<{ value: ProjectSort; label: string }> = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "updated", label: "Recently updated" },
  { value: "title_asc", label: "Title A-Z" },
  { value: "title_desc", label: "Title Z-A" },
];

export interface ExploreFiltersClasses {
  root?: string;
  input: string;
  select?: string;
  button?: string;
  menu?: string;
}

interface ExploreFiltersProps {
  filters: ExploreFilterState;
  onChange: Dispatch<SetStateAction<ExploreFilterState>>;
  techStacks: TechStackItem[];
  hasFilters: boolean;
  onClear: () => void;
  classes: ExploreFiltersClasses;
}

/**
 * Compact search + vertical Filters popover so the upper bar stays ultra-clean
 * instead of spreading 3 wide horizontal dropdown tabs across the top bar.
 */
export function ExploreFilters({
  filters,
  onChange,
  techStacks,
  hasFilters,
  onClear,
  classes,
}: ExploreFiltersProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  function update<K extends keyof ExploreFilterState>(key: K, value: ExploreFilterState[K]) {
    onChange((prev) => ({ ...prev, [key]: value }));
  }

  const activeCount =
    (filters.category ? 1 : 0) +
    (filters.techStackId ? 1 : 0) +
    (filters.sortBy && filters.sortBy !== "newest" ? 1 : 0);

  useEffect(() => {
    if (!menuOpen) return;
    function handleOutside(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      // Don't close if clicking inside the portaled Select listbox
      if (target.closest(".devz-select-list")) return;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [menuOpen]);

  return (
    <div className={classes.root} data-ui ref={menuRef}>
      {/* Compact search input — icon inset so it never overlaps the placeholder */}
      <div className="relative inline-flex min-w-0 items-center">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 z-[1] h-3.5 w-3.5 shrink-0 -translate-y-1/2 opacity-55 text-current"
          aria-hidden
        />
        <input
          type="text"
          className={classes.input}
          style={{ paddingLeft: "2.35rem", paddingRight: filters.search ? "2rem" : "0.9rem" }}
          placeholder="Search projects..."
          value={filters.search}
          onChange={(e) => update("search", e.target.value)}
          aria-label="Search projects by title or description"
        />
        {filters.search && (
          <button
            type="button"
            onClick={() => update("search", "")}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 z-[1] -translate-y-1/2 p-0.5 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Single compact trigger that opens the vertical filter stack */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-label="Open project filters"
          className={
            classes.button ||
            "inline-flex items-center gap-2 rounded-full border-2 border-[#236329] bg-[#FAF6EC] hover:bg-[#E2F0CB] px-4 py-1.5 text-xs sm:text-sm font-bold text-[#2D120D] shadow-sm transition-all cursor-pointer"
          }
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filters</span>
          {activeCount > 0 && (
            <span className="inline-flex h-4 min-w-[18px] items-center justify-center rounded-full bg-[#780D18] px-1 text-[10px] font-bold text-[#FAF6EC]">
              {activeCount}
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${menuOpen ? "rotate-180" : ""}`}
          />
        </button>

        {/* Vertically stacked filter tabs */}
        {menuOpen && (
          <div
            className={
              classes.menu ||
              "absolute right-0 top-[calc(100%+8px)] z-50 w-64 rounded-3xl border-2 border-[#236329] bg-[#FAF6EC] p-4 shadow-2xl space-y-3.5 text-left"
            }
          >
            <div className="flex items-center justify-between border-b border-current/15 pb-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] opacity-80">
                Filter &amp; Sort
              </span>
              {hasFilters && (
                <button
                  type="button"
                  onClick={onClear}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#780D18] hover:underline"
                >
                  <RotateCcw className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>

            <div className="space-y-1">
              <label className="block font-mono text-[10px] font-bold uppercase tracking-wider opacity-75 pl-1">
                Category
              </label>
              <Select
                className={
                  classes.select ||
                  "w-full rounded-xl border-2 border-[#236329]/30 bg-white px-3 py-2 text-xs font-semibold text-[#2D120D]"
                }
                value={filters.category}
                onChange={(value) => update("category", value)}
                aria-label="Filter by category"
                options={[["", "All categories"], ...PROJECT_CATEGORIES.map((c) => [c, c] as const)]}
              />
            </div>

            <div className="space-y-1">
              <label className="block font-mono text-[10px] font-bold uppercase tracking-wider opacity-75 pl-1">
                Tech Stack
              </label>
              <Select
                className={
                  classes.select ||
                  "w-full rounded-xl border-2 border-[#236329]/30 bg-white px-3 py-2 text-xs font-semibold text-[#2D120D]"
                }
                value={filters.techStackId}
                onChange={(value) => update("techStackId", value)}
                aria-label="Filter by technology"
                options={[["", "All tech"], ...techStacks.map((t) => [String(t.id), t.name] as const)]}
              />
            </div>

            <div className="space-y-1">
              <label className="block font-mono text-[10px] font-bold uppercase tracking-wider opacity-75 pl-1">
                Sort By
              </label>
              <Select
                className={
                  classes.select ||
                  "w-full rounded-xl border-2 border-[#236329]/30 bg-white px-3 py-2 text-xs font-semibold text-[#2D120D]"
                }
                value={filters.sortBy}
                onChange={(value) => update("sortBy", value as ProjectSort)}
                aria-label="Sort projects"
                options={SORT_OPTIONS}
              />
            </div>
          </div>
        )}
      </div>

      {hasFilters && !menuOpen && (
        <button type="button" className={classes.button} onClick={onClear}>
          Clear
        </button>
      )}
    </div>
  );
}
