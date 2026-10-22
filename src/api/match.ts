import { api } from "./client";
import { assetUrlOrNull } from "./config";

export type SuggestedRequirement = { name: string; category: string; reason: string; excerpt: string };
export type AmbiguousTerm = { term: string; name: string; category: string; excerpt: string };
export type Extracted = { required: SuggestedRequirement[]; preferred: SuggestedRequirement[]; ambiguous: AmbiguousTerm[] };

export type RequirementStatus = "evidenced" | "declared_project" | "declared_profile" | "missing";

export type MatchRequirement = {
  name: string;
  importance: "required" | "preferred";
  status: RequirementStatus;
  weight: number;
  contribution_linked: boolean;
  project_count: number;
  projects: { project_id: string; title: string; relation: "owner" | "member"; role: string; detected: boolean; commits: number }[];
};

export type MatchResult = {
  id: string;
  username: string;
  full_name: string | null;
  headline: string | null;
  avatar_url: string | null;
  location: string | null;
  open_to_work: boolean;
  work_types: string[];
  work_arrangements: string[];
  percent: number;
  points: number;
  max_points: number;
  required_met: number;
  required_total: number;
  preferred_met: number;
  preferred_total: number;
  relevant_projects: number;
  contribution_linked: number;
  requirements: MatchRequirement[];
};

export type MatchFilters = {
  open_to_work: boolean;
  work_type: string;
  arrangement: string;
  location: string;
  min_relevant_projects: number;
  require_all_required: boolean;
};

export type MatchResponse = {
  required: string[];
  preferred: string[];
  formula: string;
  considered: number;
  restricted: number;
  results: MatchResult[];
};

export async function extractRequirements(text: string): Promise<Extracted> {
  return (await api.post<Extracted>("/recruiting/match/extract", { text })).data;
}

export async function matchDevelopers(body: { required: string[]; preferred: string[] } & MatchFilters): Promise<MatchResponse> {
  const { data } = await api.post<MatchResponse>("/recruiting/match", body);
  return { ...data, results: data.results.map((r) => ({ ...r, avatar_url: assetUrlOrNull(r.avatar_url) })) };
}
