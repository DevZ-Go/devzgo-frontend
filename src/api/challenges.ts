import { api } from "./client";
import { assetUrlOrNull } from "./config";
import type { Person } from "./recruiting";

export type ChallengeType =
  | "frontend" | "backend" | "full_stack" | "bug_fix" | "code_review" | "api_design" | "database_design" | "architecture";
export type Difficulty = "introductory" | "intermediate" | "advanced";
export type Rating = "needs_improvement" | "meets_expectations" | "strong";
export type Criterion = { key: string; label: string; description: string };

export type ChallengeSummary = {
  id: string;
  title: string;
  challenge_type: ChallengeType;
  technologies: string[];
  difficulty: Difficulty;
  estimated_minutes: number | null;
  deadline_at: string | null;
  visibility: "invitation" | "public";
  status: "draft" | "open" | "closed";
  accepting: boolean;
  recruiter: Person;
  company: string | null;
  published_at: string | null;
  created_at: string;
};

export type ChallengeDetail = ChallengeSummary & { description: string; instructions: string; criteria: Criterion[] };

export type RecruiterChallenge = ChallengeDetail & {
  counts: { invited: number; accepted: number; submitted: number; in_review: number; reviewed: number };
  has_reviews: boolean;
};

export type ChallengeInput = {
  title: string;
  challenge_type: ChallengeType;
  technologies: string[];
  difficulty: Difficulty;
  estimated_minutes: number | null;
  description: string;
  instructions: string;
  criteria: Criterion[] | null;
  deadline_at: string | null;
  visibility: "invitation" | "public";
};

export type Review = { status: "draft" | "released"; ratings: Record<string, Rating>; feedback: string | null; released_at: string | null; updated_at: string | null };

export type Submission = {
  id: string;
  challenge_id: string;
  developer: Person;
  repo_url: string | null;
  project: { id: string; title: string } | null;
  explanation: string;
  status: "submitted" | "withdrawn" | "in_review" | "reviewed";
  revision: number;
  submitted_at: string;
  updated_at: string | null;
  withdrawn_at: string | null;
  share_ratings: boolean;
  share_feedback: boolean;
  review: Review | null;
};

export type Invitation = {
  id: string;
  challenge_id: string;
  developer: Person;
  message: string | null;
  status: "pending" | "accepted" | "declined" | "withdrawn";
  created_at: string;
  responded_at: string | null;
};

export type DeveloperInvitation = { id: string; status: Invitation["status"]; message: string | null; created_at: string; challenge: ChallengeSummary };
export type DeveloperSubmission = Submission & { challenge: ChallengeDetail };
export type ChallengeChoice = "off" | "open_to_work" | "always";
export type Assessments = {
  invitations: DeveloperInvitation[];
  open_challenges: ChallengeSummary[];
  submissions: DeveloperSubmission[];
  receiving: boolean;
  challenge_choice: ChallengeChoice;
};

export type SharedAssessment = {
  submission_id: string;
  title: string;
  challenge_type: ChallengeType;
  difficulty: Difficulty;
  technologies: string[];
  company: string | null;
  reviewer: Person;
  reviewed_at: string | null;
  ratings: { label: string; rating: Rating }[];
  feedback: string | null;
};

const person = (p: Person): Person => ({ ...p, avatar_url: assetUrlOrNull(p.avatar_url) });
const summary = <T extends ChallengeSummary>(c: T): T => ({ ...c, recruiter: person(c.recruiter) });
const submission = <T extends Submission>(s: T): T => ({ ...s, developer: person(s.developer) });

export async function fetchMyChallenges(): Promise<RecruiterChallenge[]> {
  return (await api.get<RecruiterChallenge[]>("/challenges/mine")).data.map(summary);
}

export async function fetchChallenge(id: string): Promise<ChallengeDetail> {
  return summary((await api.get<ChallengeDetail>(`/challenges/${id}`)).data);
}

export async function createChallenge(body: ChallengeInput): Promise<RecruiterChallenge> {
  return summary((await api.post<RecruiterChallenge>("/challenges", body)).data);
}

export async function updateChallenge(id: string, body: ChallengeInput): Promise<RecruiterChallenge> {
  return summary((await api.put<RecruiterChallenge>(`/challenges/${id}`, body)).data);
}

export async function setChallengeState(id: string, action: "publish" | "close"): Promise<RecruiterChallenge> {
  return summary((await api.post<RecruiterChallenge>(`/challenges/${id}/${action}`)).data);
}

export async function deleteChallenge(id: string): Promise<void> {
  await api.delete(`/challenges/${id}`);
}

export async function inviteDevelopers(id: string, developerIds: string[], message?: string) {
  return (await api.post<{ invited: string[]; skipped: Record<string, string> }>(`/challenges/${id}/invitations`,
    { developer_ids: developerIds, message: message || undefined })).data;
}

export async function fetchInvitations(id: string): Promise<Invitation[]> {
  return (await api.get<Invitation[]>(`/challenges/${id}/invitations`)).data.map((i) => ({ ...i, developer: person(i.developer) }));
}

export async function withdrawInvitation(id: string, invitationId: string): Promise<void> {
  await api.delete(`/challenges/${id}/invitations/${invitationId}`);
}

export async function fetchSubmissions(id: string): Promise<Submission[]> {
  return (await api.get<Submission[]>(`/challenges/${id}/submissions`)).data.map(submission);
}

export async function fetchSubmission(id: string, submissionId: string): Promise<Submission> {
  return submission((await api.get<Submission>(`/challenges/${id}/submissions/${submissionId}`)).data);
}

export async function saveReview(id: string, submissionId: string, body: { ratings: Record<string, Rating>; feedback: string; release: boolean }) {
  return submission((await api.put<Submission>(`/challenges/${id}/submissions/${submissionId}/review`, body)).data);
}

export async function fetchAssessments(): Promise<Assessments> {
  const { data } = await api.get<Assessments>("/assessments");
  return {
    invitations: data.invitations.map((i) => ({ ...i, challenge: summary(i.challenge) })),
    open_challenges: data.open_challenges.map(summary),
    submissions: data.submissions.map((s) => submission({ ...s, challenge: summary(s.challenge) })),
    receiving: data.receiving !== false,
    challenge_choice: data.challenge_choice === "off" || data.challenge_choice === "open_to_work" ? data.challenge_choice : "always",
  };
}

export async function answerInvitation(invitationId: string, answer: "accept" | "decline") {
  return (await api.post<DeveloperInvitation>(`/assessments/invitations/${invitationId}/${answer}`)).data;
}

export async function submitWork(id: string, body: { repo_url: string | null; project_id: string | null; explanation: string }) {
  return (await api.put<DeveloperSubmission>(`/challenges/${id}/submission`, body)).data;
}

export async function withdrawSubmission(id: string): Promise<void> {
  await api.delete(`/challenges/${id}/submission`);
}

export async function setSharing(submissionId: string, share_ratings: boolean, share_feedback: boolean) {
  return (await api.put<DeveloperSubmission>(`/assessments/submissions/${submissionId}/sharing`, { share_ratings, share_feedback })).data;
}

export async function fetchSharedAssessments(userId: string): Promise<SharedAssessment[]> {
  return (await api.get<SharedAssessment[]>(`/profiles/${userId}/assessments`)).data.map((a) => ({ ...a, reviewer: person(a.reviewer) }));
}
