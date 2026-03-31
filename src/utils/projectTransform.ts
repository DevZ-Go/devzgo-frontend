import type { ApiProject } from "../types/project";
import type { Project } from "../types/project";

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=450&fit=crop";

function getAvatarUrl(username: string): string {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`;
}

function normalizeTechStack(
  raw: ApiProject["tech_stack"],
  techStacksPlural?: string[]
): string[] {
  if (techStacksPlural?.length) return [...techStacksPlural];
  if (!raw?.length) return [];
  return raw.map((item) =>
    typeof item === "string"
      ? item
      : item && typeof item === "object" && "name" in item && item.name
        ? String(item.name)
        : ""
  ).filter(Boolean);
}

export function transformApiProject(api: ApiProject, index: number): Project {
  const id = String(api.id ?? index);
  const username =
    api.owner_username ?? api.owner?.username ?? "anonymous";
  const fromApi = normalizeTechStack(api.tech_stack, api.tech_stacks);
  const techStack = fromApi.length
    ? fromApi
    : api.category
      ? [api.category]
      : [];

  const cover =
    api.cover_image_url ?? api.image_url;

  return {
    id,
    title: api.title ?? "Untitled Project",
    shortDescription: api.short_description ?? "",
    imageUrl:
      (typeof cover === "string" && cover) || PLACEHOLDER_IMAGE,
    techStack,
    likes: api.likes ?? 0,
    views: api.views ?? 0,
    comments: api.comments ?? 0,
    featured: index < 4,
    author: {
      name: api.owner?.name ?? username,
      username,
      avatar: api.owner?.avatar ?? getAvatarUrl(username),
    },
  };
}
