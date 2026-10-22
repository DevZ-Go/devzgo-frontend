/** API response shape from GET /projects */
export interface ApiProjectOwner {
  username?: string;
  name?: string;
  avatar?: string;
}

export interface ApiProject {
  id: string | number;
  /** Creator — compare with current user id for edit/delete */
  owner_id?: string;
  /** From API when Bearer token is sent — preferred for Edit/Delete visibility */
  is_owner?: boolean;
  title: string;
  short_description: string;
  full_description?: string;
  category?: string;
  /** When category is Other — short custom label from API */
  category_other?: string | null;
  visibility?: string;
  /** Numeric tech stack ids from API (for edit form) — confirmed stacks */
  tech_stack_ids?: number[];
  /** Backend may use cover_image_url */
  image_url?: string;
  cover_image_url?: string | null;
  demo_video_url?: string | null;
  github_url?: string | null;
  live_url?: string | null;
  impact_note?: string | null;
  source_analyzed_at?: string | null;
  /** Backend may return plural `tech_stacks` as string[] */
  tech_stack?: Array<string | { name?: string }>;
  tech_stacks?: string[];
  /** Auto language breakdown from workspace analysis */
  languages?: Array<{ name: string; percentage: number }>;
  detected_tech_stacks?: string[];
  detected_tech_stack_ids?: number[];
  likes?: number;
  likes_count?: number;
  is_liked?: boolean;
  comments_count?: number;
  comments_enabled?: boolean;
  /** What this viewer may do (single project responses only) */
  access?: {
    owner: boolean; member: boolean; view: boolean; edit: boolean; files: boolean; secrets: boolean;
    comment?: boolean; manage_team?: boolean;
  } | null;
  /** Where the files come from and whether the stored copy is current (single project responses only) */
  source?: ProjectSource | null;
  owner?: ApiProjectOwner;
  owner_username?: string;
  /** ISO timestamp from the backend (used to keep TV world positions stable) */
  created_at?: string;
}

export interface ProjectSource {
  kind: "zip" | "github";
  /** owner/name on GitHub */
  repository?: string | null;
  default_branch?: string | null;
  /** The stored copy: a ZIP upload, or one GitHub branch at one commit */
  snapshot?: {
    origin: "zip" | "github";
    ref?: string | null;
    commit_sha?: string | null;
    synced_at?: string | null;
  } | null;
  sync_state?: "pending" | "ok" | "failed" | null;
  /** Shown to the owner and team members only */
  sync_error?: string | null;
  sync_updated_at?: string | null;
}

/** Normalized project for UI components */
export interface Project {
  id: string;
  title: string;
  shortDescription: string;
  imageUrl: string;
  techStack: string[];
  likes: number;
  isLiked?: boolean;
  commentsCount: number;
  featured: boolean;
  author: {
    name: string;
    username: string;
    avatar: string;
  };
  /** From API for dashboards */
  visibility?: string;
}
