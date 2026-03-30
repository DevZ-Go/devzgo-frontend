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
  category?: string;
  image_url?: string;
  tech_stack?: string[];
  likes?: number;
  views?: number;
  comments?: number;
  owner?: ApiProjectOwner;
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
