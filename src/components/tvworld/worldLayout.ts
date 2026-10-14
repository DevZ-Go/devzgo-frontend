import { resolveApiAssetUrl } from "../../api/config";
import type { ApiProject } from "../../types/project";
import { transformApiProject } from "../../utils/projectTransform";
import type { PlacedTv, TvProject, WorldBounds } from "./types";

/** Distance between spiral cells in world pixels. TVs are ~360px wide, so gaps stay generous. */
const CELL_W = 760;
const CELL_H = 600;
/** How far (as a fraction of a cell) a TV may drift from its cell centre. */
const JITTER = 0.2;

/** Body sizes (w × h) a TV may take. Picked deterministically per project. */
const SIZES: Array<[number, number]> = [
  [380, 310],
  [340, 330],
  [420, 300],
];

/** FNV-1a 32-bit hash: the same string always gives the same number. */
export function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Hash → float in [0, 1). */
function unit(input: string): number {
  return hashString(input) / 4294967296;
}

/** Hash → float in [-1, 1). */
function signed(input: string): number {
  return unit(input) * 2 - 1;
}

/**
 * Square spiral: index 0 is the origin, then it winds outward
 * (0,0) → (1,0) → (1,1) → (0,1) → (-1,1) → ...
 */
export function spiralCell(index: number): [number, number] {
  if (index === 0) return [0, 0];
  let x = 0;
  let y = 0;
  let dx = 1;
  let dy = 0;
  let segment = 1;
  let passed = 0;
  let turns = 0;
  for (let i = 0; i < index; i++) {
    x += dx;
    y += dy;
    passed++;
    if (passed === segment) {
      passed = 0;
      const t = dx;
      dx = -dy;
      dy = t;
      turns++;
      if (turns % 2 === 0) segment++;
    }
  }
  return [x, y];
}

/** Map a backend project onto the fields the TV world uses. */
export function toTvProject(api: ApiProject, index: number): TvProject {
  const ui = transformApiProject(api, index);
  const coverRaw = api.cover_image_url ?? api.image_url;
  const videoRaw = api.demo_video_url;
  const category =
    api.category === "Other" && api.category_other
      ? api.category_other
      : (api.category ?? null);
  return {
    id: ui.id,
    title: ui.title,
    shortDescription: ui.shortDescription,
    fullDescription: api.full_description ?? "",
    coverUrl:
      typeof coverRaw === "string" && coverRaw ? resolveApiAssetUrl(coverRaw) : null,
    videoUrl:
      typeof videoRaw === "string" && videoRaw ? resolveApiAssetUrl(videoRaw) : null,
    techStack: ui.techStack,
    category,
    author: ui.author.username,
    authorAvatar: api.owner?.avatar ? resolveApiAssetUrl(api.owner.avatar) : null,
    createdAt: api.created_at ?? null,
    isOwner: api.is_owner === true,
    likes: ui.likes,
  };
}

/**
 * Deterministic world layout.
 *
 * - Projects are ordered oldest-first, so a newly uploaded project always takes the
 *   next free spiral slot and never moves the existing TVs.
 * - Each project's id is hashed for jitter, size, tilt and animation timing, so
 *   everything looks hand-placed but is identical on every page load.
 */
export function layoutProjects(projects: TvProject[]): {
  placed: PlacedTv[];
  bounds: WorldBounds | null;
} {
  const ordered = [...projects].sort((a, b) => {
    const ta = a.createdAt ?? "";
    const tb = b.createdAt ?? "";
    if (ta !== tb) return ta < tb ? -1 : 1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  const placed: PlacedTv[] = ordered.map((project, i) => {
    const [cx, cy] = spiralCell(i);
    // Odd rows are shifted half a cell so the spiral never reads as a grid.
    const stagger = Math.abs(cy) % 2 === 1 ? CELL_W / 2 : 0;
    const x = cx * CELL_W + stagger + signed(project.id + ":x") * CELL_W * JITTER;
    const y = cy * CELL_H + signed(project.id + ":y") * CELL_H * JITTER;
    const [w, h] = SIZES[hashString(project.id + ":size") % SIZES.length];
    return {
      project,
      number: i + 1,
      x,
      y,
      w,
      h,
      scale: 0.9 + unit(project.id + ":scale") * 0.22,
      rot: signed(project.id + ":rot") * 1.1,
      flickerDuration: 7 + unit(project.id + ":fd") * 7,
      flickerDelay: -unit(project.id + ":fdl") * 14,
      glitchDuration: 9 + unit(project.id + ":gd") * 9,
      glitchDelay: -unit(project.id + ":gdl") * 18,
    };
  });

  if (placed.length === 0) return { placed, bounds: null };

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const t of placed) {
    const hw = (t.w * t.scale) / 2;
    const hh = (t.h * t.scale) / 2;
    minX = Math.min(minX, t.x - hw);
    maxX = Math.max(maxX, t.x + hw);
    minY = Math.min(minY, t.y - hh);
    maxY = Math.max(maxY, t.y + hh + 40);
  }
  return { placed, bounds: { minX, minY, maxX, maxY } };
}
