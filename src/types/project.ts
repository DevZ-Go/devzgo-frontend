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
  visibility?: string;
  /** Numeric tech stack ids from API (for edit form) */
  tech_stack_ids?: number[];
  /** Backend may use cover_image_url */
  image_url?: string;
  cover_image_url?: string | null;
  demo_video_url?: string | null;
  /** Backend may return plural `tech_stacks` as string[] */
  tech_stack?: Array<string | { name?: string }>;
  tech_stacks?: string[];
  likes?: number;
  views?: number;
  comments?: number;
  owner?: ApiProjectOwner;
  owner_username?: string;
}

/** Normalized project for UI components */
export interface Project {
  id: string;
  title: string;
  shortDescription: string;
  imageUrl: string;
  techStack: string[];
  likes: number;
  views: number;
  comments: number;
  featured: boolean;
  author: {
    name: string;
    username: string;
    avatar: string;
  };
}
