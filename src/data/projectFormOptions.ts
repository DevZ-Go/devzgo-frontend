/**
 * Allowed project categories — must match `ProjectCategory` in
 * devzgo-backend `app/models/enums.py` (values sent to the API).
 */
export const PROJECT_CATEGORIES = [
  "AI/ML",
  "Web Development",
  "Mobile",
  "Gaming",
  "Education",
  "Productivity",
  "Other",
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

/**
 * Allowed visibility values (must match backend `ProjectVisibility`).
 */
export const PROJECT_VISIBILITY_OPTIONS = [
  { value: "Public", label: "Public — anyone can view" },
  { value: "Private", label: "Private — only you" },
] as const;
