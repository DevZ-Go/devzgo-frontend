import type { ApiProject } from "../types/project";
import type { Project } from "../types/project";

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=450&fit=crop";

function getAvatarUrl(username: string): string {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`;
}

export function transformApiProject(api: ApiProject, index: number): Project {
  const id = String(api.id ?? index);
  const username = api.owner?.username ?? "anonymous";
  const techStack = api.tech_stack?.length
    ? api.tech_stack
    : api.category
      ? [api.category]
      : [];

  return {
    id,
    title: api.title ?? "Untitled Project",
    shortDescription: api.short_description ?? "",
    imageUrl: api.image_url ?? PLACEHOLDER_IMAGE,
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
