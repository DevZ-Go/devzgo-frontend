import type { Dispatch, SetStateAction } from "react";
import type { ProjectSort, TechStackItem } from "../api/projects";
import { PROJECT_CATEGORIES } from "../data/projectFormOptions";
import type { ExploreFilterState } from "../hooks/useExploreProjects";

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
  select: string;
  button: string;
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
 * Search, category, technology, and sort for the Explore themes.
 * Each theme passes its own classes so the controls match its look.
 */
export function ExploreFilters({
  filters,
  onChange,
  techStacks,
  hasFilters,
  onClear,
  classes,
}: ExploreFiltersProps) {
  function update<K extends keyof ExploreFilterState>(key: K, value: ExploreFilterState[K]) {
    onChange((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className={classes.root} data-ui>
      <input
        type="search"
        className={classes.input}
        placeholder="Search projects"
        value={filters.search}
        onChange={(e) => update("search", e.target.value)}
        aria-label="Search projects by title or description"
      />
      <select
        className={classes.select}
        value={filters.category}
        onChange={(e) => update("category", e.target.value)}
        aria-label="Filter by category"
      >
        <option value="">All categories</option>
        {PROJECT_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <select
        className={classes.select}
        value={filters.techStackId}
        onChange={(e) => update("techStackId", e.target.value)}
        aria-label="Filter by technology"
      >
        <option value="">All tech</option>
        {techStacks.map((t) => (
          <option key={t.id} value={String(t.id)}>
            {t.name}
          </option>
        ))}
      </select>
      <select
        className={classes.select}
        value={filters.sortBy}
        onChange={(e) => update("sortBy", e.target.value as ProjectSort)}
        aria-label="Sort projects"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hasFilters && (
        <button type="button" className={classes.button} onClick={onClear}>
          Clear
        </button>
      )}
    </div>
  );
}
