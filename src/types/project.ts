/** API response shape from GET /projects */
export interface ApiProjectOwner {
  username?: string;
  name?: string;
  avatar?: string;
}

export interface ApiProject {
  id: string | number;
  title: string;
  short_description: string;
  full_description?: string;
  category?: string;
  visibility?: string;
  /** Backend may use cover_image_url */
  image_url?: string;
  cover_image_url?: string | null;
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
