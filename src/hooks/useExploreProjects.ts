import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchProjects, fetchTechStacks } from "../api";
import type { ProjectFilters, ProjectSort, TechStackItem } from "../api/projects";
import type { ApiProject } from "../types/project";
import { getApiErrorMessage } from "../utils/apiError";

export interface ExploreFilterState {
  search: string;
  category: string;
  techStackId: string;
  sortBy: ProjectSort;
}

export const DEFAULT_EXPLORE_FILTERS: ExploreFilterState = {
  search: "",
  category: "",
  techStackId: "",
  sortBy: "newest",
};

const SEARCH_DEBOUNCE_MS = 300;

function toQuery(filters: ExploreFilterState): ProjectFilters {
  const query: ProjectFilters = { sort_by: filters.sortBy };
  const search = filters.search.trim();
  if (search) query.search = search;
  if (filters.category) query.category = filters.category;
  if (filters.techStackId) query.tech_stack_ids = filters.techStackId;
  return query;
}

/**
 * Public projects for the Explore themes, filtered and sorted by GET /projects.
 *
 * `projects` is null only before the first response. Later requests keep the previous
 * list on screen until the new one arrives. `appliedKey` changes when a response for a
 * different filter set lands, so callers can react to new results.
 */
export function useExploreProjects() {
  const [filters, setFilters] = useState<ExploreFilterState>(DEFAULT_EXPLORE_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  const [projects, setProjects] = useState<ApiProject[] | null>(null);
  const [appliedKey, setAppliedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [techStacks, setTechStacks] = useState<TechStackItem[]>([]);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(filters.search), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [filters.search]);

  const { category, techStackId, sortBy } = filters;
  const query = useMemo(
    () => toQuery({ search: debouncedSearch, category, techStackId, sortBy }),
    [debouncedSearch, category, techStackId, sortBy]
  );
  const queryKey = JSON.stringify(query);

  useEffect(() => {
    let cancelled = false;
    fetchProjects(query)
      .then((list) => {
        if (cancelled) return;
        setProjects(list);
        setAppliedKey(queryKey);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(getApiErrorMessage(err));
        setProjects((prev) => prev ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [queryKey, reloadCount]);

  useEffect(() => {
    let cancelled = false;
    fetchTechStacks()
      .then((stacks) => {
        if (!cancelled) setTechStacks(stacks);
      })
      .catch(() => {
        /* filters still work without the technology list */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const reload = useCallback(() => setReloadCount((n) => n + 1), []);
  const clearFilters = useCallback(() => setFilters(DEFAULT_EXPLORE_FILTERS), []);

  /** True when search, category, or technology can hide projects. Sort alone does not. */
  const isNarrowed =
    filters.search.trim() !== "" || filters.category !== "" || filters.techStackId !== "";
  const hasFilters = isNarrowed || filters.sortBy !== DEFAULT_EXPLORE_FILTERS.sortBy;

  return {
    filters,
    setFilters,
    clearFilters,
    hasFilters,
    isNarrowed,
    projects,
    appliedKey,
    error,
    reload,
    techStacks,
  };
}
