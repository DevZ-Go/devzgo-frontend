/**
 * Allowed values for project category (must match backend / Pydantic enums if applicable).
 * Edit this list to match your API.
 */
export const PROJECT_CATEGORIES = [
  "AI/ML",
  "Web Development",
  "Mobile Development",
  "Desktop",
  "DevOps / Cloud",
  "Data Science",
  "Game Development",
  "Cybersecurity",
  "Other",
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

/**
 * Allowed visibility values (must match backend).
 */
export const PROJECT_VISIBILITY_OPTIONS = [
  { value: "Public", label: "Public — anyone can view" },
  { value: "Private", label: "Private — only you" },
] as const;
