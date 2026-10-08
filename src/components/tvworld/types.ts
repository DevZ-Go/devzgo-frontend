/** A project reduced to the fields the TV world needs (built from the real API data). */
export interface TvProject {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  /** Cover image URL, or null when the project has no cover (screen shows NO SIGNAL). */
  coverUrl: string | null;
  /** Uploaded demo video URL, or null. Played on the TV when it is focused. */
  videoUrl: string | null;
  techStack: string[];
  category: string | null;
  author: string;
  authorAvatar: string | null;
  createdAt: string | null;
  /** True when the logged-in viewer owns the project (from the API). */
  isOwner: boolean;
  likes: number;
}

/** A project placed in world space. Coordinates are the TV's centre. */
export interface PlacedTv {
  project: TvProject;
  /** 1-based position in the archive (oldest first). */
  number: number;
  x: number;
  y: number;
  /** Body size before `scale` is applied. */
  w: number;
  h: number;
  scale: number;
  /** Rotation in degrees (very small). */
  rot: number;
  /** CSS animation timing so TVs never flicker in sync. */
  flickerDuration: number;
  flickerDelay: number;
  glitchDuration: number;
  glitchDelay: number;
}

export interface WorldBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}
