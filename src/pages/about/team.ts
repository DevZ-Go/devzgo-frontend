export interface TeamDeveloper {
  id: string;
  name: string;
  role: string;
  tagline: string;
  /** Short name for the part of DevZ-Go this person tends. */
  craft: string;
  /** Comma-separated skills shown under the portrait. */
  focus: string;
  profileId: string;
  githubUrl?: string;
}

/**
 * Default team list. Drawings are tied to these ids.
 * In the shared drawing, dev-4 stands on the left and dev-1 on the right.
 */
export const DEFAULT_DEVELOPERS: TeamDeveloper[] = [
  {
    id: "dev-1",
    name: "Janasi Rajput",
    role: "Full-Stack & UI Architecture",
    tagline: "Crafting warm editorial interfaces, interactive experiences, and community flows.",
    craft: "Interfaces",
    focus: "Editorial UI, Explore, Community",
    profileId: "jana",
  },
  {
    id: "dev-2",
    name: "Chan Singh",
    role: "Backend & Cloud Infrastructure",
    tagline: "Building FastAPI services, database migrations, and real-time systems.",
    craft: "Services",
    focus: "FastAPI, Data, Realtime",
    profileId: "cgjsingh",
  },
  {
    id: "dev-3",
    name: "Khushbu Goswami",
    role: "Full-Stack Developer",
    tagline: "Designing workspace tools, project analysis, and developer portfolios.",
    craft: "Workspace",
    focus: "Portfolios, Analysis, Projects",
    profileId: "khushbu0",
  },
  {
    id: "dev-4",
    name: "Manasi Sharma",
    role: "Full-Stack Developer",
    tagline: "Connecting talent intelligence, assessments, and collaborative features.",
    craft: "Talent",
    focus: "Assessments, Matching, Collaboration",
    profileId: "manasirajput",
  },
];

export const STORAGE_KEY = "devzgo_team_profiles_v2";

export type Portrait = { src: string; place: "left" | "center-left" | "center-right" | "right" };

const PORTRAITS_BY_ID: Record<string, Portrait> = {
  "dev-2": { src: "/team/chan.jpg", place: "left" },
  "dev-4": { src: "/team/janasi-manasi.jpeg", place: "center-left" },
  "dev-1": { src: "/team/janasi-manasi.jpeg", place: "center-right" },
  "dev-3": { src: "/team/khushbu.jpeg", place: "right" },
};

export const CENTER_SRC = "/team/janasi-manasi.jpeg";

/**
 * Visible region of each illustration, as fractions of the file.
 * Measured from pixels that are not the paper background, then padded
 * so hair, hands, and shoes stay inside the window.
 * The window height is the body, so feet sit on the bottom edge.
 */
export type FigureFrame = {
  src: string;
  width: number;
  height: number;
  top: number;
  bottom: number;
  left: number;
  right: number;
  paper: string;
};

export const FIGURE_FRAMES: { left: FigureFrame; center: FigureFrame; right: FigureFrame } = {
  left: {
    src: "/team/chan.jpg",
    width: 1208,
    height: 1302,
    top: 0,
    bottom: 0.994,
    left: 0.292,
    right: 0.672,
    paper: "#fae1c3",
  },
  center: {
    src: "/team/janasi-manasi.jpeg",
    width: 1254,
    height: 1254,
    top: 0.045,
    bottom: 0.988,
    left: 0.14,
    right: 0.83,
    paper: "#fbddc1",
  },
  right: {
    src: "/team/khushbu.jpeg",
    width: 1213,
    height: 1296,
    top: 0,
    bottom: 0.994,
    left: 0.26,
    right: 0.75,
    paper: "#f0dec6",
  },
};

/** Every person uses the same body height. */
export const TWIN_PROMINENCE = 1;

export type PortraitSlot = "left" | "center" | "right";

export const PORTRAIT_KEY = "devzgo_team_portraits_v1";

/**
 * Public usernames for the four builders (matched to their DevZ-Go accounts).
 * Admins can replace these in the editor.
 */
const TEAM_ACCOUNTS: Record<string, string> = {
  "dev-1": "jana",
  "dev-2": "cgjsingh",
  "dev-3": "khushbu0",
  "dev-4": "manasirajput",
};

/** Stable account ids for Connect. Kept in code so Connect does not guess among similar usernames. */
export const TEAM_ACCOUNT_UUIDS: Record<string, string> = {
  "dev-1": "c8a0c021-06be-4fcb-a2a5-b46f77023fe9",
  "dev-2": "121fdafd-8e5d-498e-a2aa-c13c164a7f0d",
  "dev-3": "f1a72600-fbda-427b-a543-60300058461d",
  "dev-4": "d26d21a9-2270-48b8-b5f4-dfe1d61cf333",
};

const STALE_PROFILE_IDS = new Set([
  "usr-janasi",
  "usr-chan",
  "usr-khushbu",
  "usr-manasi",
  "janasi",
  "chan",
  "khushbu",
  "manasi",
]);

export function loadPortraitOverrides(): Partial<Record<PortraitSlot, string>> {
  try {
    const raw = localStorage.getItem(PORTRAIT_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<Record<PortraitSlot, string>>;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed;
  } catch {
    return {};
  }
}

export function savePortraitOverrides(next: Partial<Record<PortraitSlot, string>>) {
  const clean = Object.fromEntries(
    Object.entries(next).filter(([, value]) => typeof value === "string" && value.startsWith("data:image/")),
  );
  localStorage.setItem(PORTRAIT_KEY, JSON.stringify(clean));
}

/** Shrinks an uploaded portrait so it can live in the browser without blowing the storage limit. */
export async function compressPortrait(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const maxEdge = 1200;
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Could not read that picture.");
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  let quality = 0.82;
  let url = canvas.toDataURL("image/jpeg", quality);
  while (url.length > 700_000 && quality > 0.5) {
    quality -= 0.08;
    url = canvas.toDataURL("image/jpeg", quality);
  }
  if (url.length > 900_000) throw new Error("That picture is too large to keep in this browser.");
  return url;
}

export type CharacterMotif = "moon" | "twins" | "essence";

export type CharacterIdentity = {
  label: string;
  line: string;
  motif: CharacterMotif;
};

const IDENTITIES: Record<string, CharacterIdentity> = {
  "dev-2": {
    label: "The Moon",
    line: "The quiet force behind the systems.",
    motif: "moon",
  },
  "dev-4": {
    label: "The Twins",
    line: "Two minds. One creative connection.",
    motif: "twins",
  },
  "dev-1": {
    label: "The Twins",
    line: "Two minds. One creative connection.",
    motif: "twins",
  },
  "dev-3": {
    label: "The Essence",
    line: "The thoughtful details that bring everything together.",
    motif: "essence",
  },
};

export function identityOf(dev: TeamDeveloper): CharacterIdentity | null {
  return IDENTITIES[dev.id] ?? null;
}

export function portraitOf(dev: TeamDeveloper): Portrait | null {
  return PORTRAITS_BY_ID[dev.id] ?? null;
}

export function initials(name: string): string {
  const letters = name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return letters || "DV";
}

export function focusChips(focus: string): string[] {
  return focus
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/** A real account id can use the connection control. Placeholder profile ids open the profile instead. */
export function canConnect(profileId: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profileId.trim());
}

const FEATURE_LINKS: { to: string; label: string; test: RegExp }[] = [
  { to: "/explore", label: "Explore projects", test: /explore|interface|editorial|discover/i },
  { to: "/profile", label: "Profiles", test: /portfolio|profile/i },
  { to: "/add-project", label: "Add a project", test: /project|workspace/i },
  { to: "/network", label: "Network", test: /community|network|collaborat/i },
  { to: "/messages", label: "Messages", test: /message/i },
  { to: "/import/github", label: "GitHub import", test: /github/i },
  { to: "/assessments", label: "Assessments", test: /assessment/i },
];

/** Routes that match words already saved on this person. Not a claim that they own the feature. */
export function linksFor(dev: TeamDeveloper): { to: string; label: string }[] {
  const text = `${dev.craft} ${dev.focus} ${dev.tagline}`;
  const found: { to: string; label: string }[] = [];
  for (const item of FEATURE_LINKS) {
    if (!item.test.test(text)) continue;
    if (found.some((link) => link.to === item.to)) continue;
    found.push({ to: item.to, label: item.label });
  }
  return found.slice(0, 4);
}

function knownName(id: string, name: string): string {
  if (id === "dev-2" && (name === "Chan S." || name === "Chan S")) return "Chan Singh";
  if (id === "dev-3" && (name === "Khushbu Patel" || name === "Khushbu")) return "Khushbu Goswami";
  return name;
}

function accountFor(id: string, profileId: string): string {
  const value = profileId.trim();
  const correct = TEAM_ACCOUNTS[id];
  if (!correct) return value;
  if (!value || value.startsWith("usr-") || STALE_PROFILE_IDS.has(value)) return correct;
  return value;
}

/** UUID used by Connect for a builder, or a stored UUID profile id. */
export function connectUserId(dev: TeamDeveloper): string {
  if (TEAM_ACCOUNT_UUIDS[dev.id]) return TEAM_ACCOUNT_UUIDS[dev.id];
  const value = dev.profileId.trim();
  return canConnect(value) ? value : "";
}

export function loadDevelopers(): TeamDeveloper[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DEVELOPERS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((d: Record<string, unknown>, idx: number) => {
        const fallback = DEFAULT_DEVELOPERS[idx];
        const id = (d.id as string) || `dev-${idx + 1}`;
        return {
          id,
          name: knownName(id, (d.name as string) || `Developer 0${idx + 1}`),
          role: (d.role as string) || "Full-Stack Developer",
          tagline: (d.tagline as string) || "Building on DevZ-Go.",
          craft: (d.craft as string) || fallback?.craft || "Builder",
          focus: (d.focus as string) || fallback?.focus || "",
          profileId: accountFor(id, (d.profileId as string) || (d.username as string) || fallback?.profileId || ""),
          githubUrl: (d.githubUrl as string) || undefined,
        };
      });
    }
    return DEFAULT_DEVELOPERS;
  } catch {
    return DEFAULT_DEVELOPERS;
  }
}
