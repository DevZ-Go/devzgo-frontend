import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LayoutGrid,
  Users,
  Boxes,
  Compass,
  Settings,
  Mail,
  UserCheck,
  UsersRound,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  FileText,
  CodeXml,
  Flag,
  UserPlus,
  Send,
  StickyNote,
  Check,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { MemberAvatar } from "../components/MemberAvatar";
import { createPost, fetchFeedPage } from "../api/network";
import { fetchGroups } from "../api/groups";
import { fetchMyProfile } from "../api/profiles";
import {
  fetchConnections,
  sendConnectionRequest,
  fetchSuggestedDevelopers,
} from "../api/connections";
import type { Connection, ConnectionUserSummary } from "../types/network";
import { useAuth } from "../auth/AuthContext";
import { queryKeys } from "../api/queryKeys";
import { getApiErrorMessage } from "../utils/apiError";
import { FeedItem } from "../features/network/FeedItem";
import { ConstellationGraph } from "../components/network/ConstellationGraph";

/* ── Vector Illustrations matching the Reference Artwork ── */

/** Cute die-cut retro laptop sticker with </> on the screen and keys */
function RetroLaptopSticker({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 140" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <g filter="drop-shadow(0 4px 8px rgba(45, 18, 13, 0.16))">
        {/* Die-cut white border */}
        <path
          d="M26 16 C26 12 30 8 35 8 L125 8 C130 8 134 12 134 16 L134 82 C134 86 130 90 125 90 L146 112 C150 116 148 124 142 124 L18 124 C12 124 10 116 14 112 L35 90 C30 90 26 86 26 82 Z"
          fill="white"
        />
        {/* Laptop Lid Screen Frame */}
        <rect x="30" y="12" width="100" height="74" rx="8" fill="#E8DCCB" stroke="#7A604D" strokeWidth="2.5" />
        {/* Inner Screen Display */}
        <rect x="36" y="18" width="88" height="62" rx="4" fill="#2D120D" />
        {/* Code glyphs */}
        <text
          x="80"
          y="56"
          fill="#FFF8CA"
          fontSize="22"
          fontWeight="bold"
          fontFamily="ui-monospace, monospace"
          textAnchor="middle"
        >
          &lt;/&gt;
        </text>
        {/* Base / Keyboard Perspective */}
        <path
          d="M34 90 L126 90 L142 118 C144 121 142 122 138 122 L22 122 C18 122 16 121 18 118 Z"
          fill="#DFCFB9"
          stroke="#7A604D"
          strokeWidth="2.5"
        />
        {/* Key Row Lines */}
        <line x1="42" y1="97" x2="118" y2="97" stroke="#7A604D" strokeWidth="1.5" strokeDasharray="4 3" />
        <line x1="38" y1="104" x2="122" y2="104" stroke="#7A604D" strokeWidth="1.5" strokeDasharray="4 3" />
        <line x1="34" y1="111" x2="126" y2="111" stroke="#7A604D" strokeWidth="1.5" strokeDasharray="5 3" />
        {/* Trackpad */}
        <rect x="68" y="114" width="24" height="5" rx="1.5" fill="#C4B3A2" stroke="#7A604D" strokeWidth="1" />
      </g>
    </svg>
  );
}

/** Pressed dried botanical flowers illustration sticker */
function DriedBotanicalsSticker({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <g filter="drop-shadow(0 4px 8px rgba(45, 18, 13, 0.14))">
        {/* Stems */}
        <path d="M70 145 C68 110 55 75 42 42" stroke="#7A6038" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M70 145 C75 115 95 80 105 50" stroke="#7A6038" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M70 145 C70 95 72 60 74 30" stroke="#7A6038" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M60 95 C50 85 40 82 32 80" stroke="#7A6038" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M75 105 C85 96 98 94 108 92" stroke="#7A6038" strokeWidth="1.8" strokeLinecap="round" />

        {/* Leaves */}
        <path d="M32 80 C36 74 44 75 48 82 C44 86 36 86 32 80 Z" fill="#8C9A73" />
        <path d="M108 92 C104 86 96 87 92 94 C96 98 104 98 108 92 Z" fill="#8C9A73" />
        <path d="M52 65 C55 58 63 60 66 67 C61 70 54 69 52 65 Z" fill="#8C9A73" />
        <path d="M88 75 C85 68 77 70 74 77 C79 80 86 79 88 75 Z" fill="#8C9A73" />

        {/* Left Daisy */}
        <g transform="translate(42, 42)">
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <ellipse
              key={deg}
              cx="0"
              cy="-14"
              rx="3.5"
              ry="9"
              fill="#E8B84B"
              stroke="#B3862A"
              strokeWidth="0.8"
              transform={`rotate(${deg})`}
            />
          ))}
          <circle cx="0" cy="0" r="8" fill="#6B4E26" stroke="#4A3416" strokeWidth="1" />
          <circle cx="0" cy="0" r="5" fill="#8A6533" />
        </g>

        {/* Center Top Flower */}
        <g transform="translate(74, 30) scale(0.9)">
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <ellipse
              key={deg}
              cx="0"
              cy="-14"
              rx="3.5"
              ry="9"
              fill="#DCA33C"
              stroke="#A87A24"
              strokeWidth="0.8"
              transform={`rotate(${deg})`}
            />
          ))}
          <circle cx="0" cy="0" r="8" fill="#5E421E" />
          <circle cx="0" cy="0" r="5" fill="#7D5A2B" />
        </g>

        {/* Right Flower */}
        <g transform="translate(105, 50) scale(0.8)">
          {[0, 36, 72, 108, 144, 180, 216, 252, 288, 324].map((deg) => (
            <ellipse
              key={deg}
              cx="0"
              cy="-14"
              rx="4"
              ry="8.5"
              fill="#E8B84B"
              stroke="#B3862A"
              strokeWidth="0.8"
              transform={`rotate(${deg})`}
            />
          ))}
          <circle cx="0" cy="0" r="7.5" fill="#6B4E26" />
        </g>
      </g>
    </svg>
  );
}

export function NetworkPage() {
  const { user } = useAuth();
  const me = useQuery({
    queryKey: ["my-profile-photo", user?.id ?? ""],
    queryFn: fetchMyProfile,
    enabled: Boolean(user),
  });

  const [params] = useSearchParams();
  const filter = params.get("filter") ?? "all";
  const [feedFilterTab, setFeedFilterTab] = useState<"for-you" | "following" | "latest" | "projects">("for-you");
  const [activeNavTab, setActiveNavTab] = useState<"feed" | "network" | "clubs" | "creators">("feed");
  const debouncedSearch = params.get("q") ?? "";

  const client = useQueryClient();
  const feedQuery = useInfiniteQuery({
    queryKey: [...queryKeys.feed, "list", filter, debouncedSearch],
    queryFn: ({ pageParam }) => fetchFeedPage(filter, debouncedSearch, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextPage,
  });

  const feed = (feedQuery.data?.pages.flatMap((p) => p.items) ?? []).filter((item) => !item.isDemo);
  const loading = feedQuery.isPending;
  const moreRef = useRef<HTMLDivElement>(null);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = feedQuery;

  useEffect(() => {
    const el = moreRef.current;
    if (!el || !hasNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !isFetchingNextPage) void fetchNextPage();
      },
      { rootMargin: "400px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Quick composer state
  const [postContent, setPostContent] = useState("");
  const [postType, setPostType] = useState<string>("spark");
  const [posting, setPosting] = useState(false);

  // Connections state
  const [connections, setConnections] = useState<{
    accepted: Connection[];
    pendingIncoming: Connection[];
    pendingOutgoing: Connection[];
  }>({ accepted: [], pendingIncoming: [], pendingOutgoing: [] });
  const [suggested, setSuggested] = useState<ConnectionUserSummary[]>([]);
  const [requestedUsers, setRequestedUsers] = useState<Record<string, boolean>>({});

  const [carouselIndex, setCarouselIndex] = useState(0);
  const [sidebarClubs, setSidebarClubs] = useState<{ id: string; name: string; memberCount: number; slug?: string }[]>([]);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadSidebar = useCallback(async () => {
    try {
      const [connData, suggData, clubs] = await Promise.all([
        fetchConnections(),
        fetchSuggestedDevelopers(),
        fetchGroups().catch(() => []),
      ]);
      if (connData && Array.isArray(connData.accepted)) {
        setConnections(connData);
      }
      if (Array.isArray(suggData)) {
        setSuggested(suggData);
      }
      if (Array.isArray(clubs)) {
        setSidebarClubs(
          clubs.slice(0, 6).map((c: { id: string; name: string; memberCount?: number; slug?: string }) => ({
            id: c.id,
            name: c.name,
            memberCount: c.memberCount ?? 0,
            slug: c.slug,
          })),
        );
      }
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    void loadSidebar();
    const handleUpdate = () => void loadSidebar();
    const handleDemoFeed = () => void client.invalidateQueries({ queryKey: queryKeys.feed });
    window.addEventListener("devzgo:feed-updated", handleDemoFeed);
    window.addEventListener("devzgo:connections-updated", handleUpdate);
    return () => {
      window.removeEventListener("devzgo:feed-updated", handleDemoFeed);
      window.removeEventListener("devzgo:connections-updated", handleUpdate);
    };
  }, [loadSidebar, client]);

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    if (!postContent.trim() || posting) return;
    setPosting(true);
    try {
      await createPost({
        content: postContent.trim(),
        activity_type: postType,
      });
      setPostContent("");
      showToast("Post shared with the community!");
      await client.invalidateQueries({ queryKey: queryKeys.feed });
    } catch (err) {
      showToast(getApiErrorMessage(err));
    } finally {
      setPosting(false);
    }
  }

  const meId = user?.id ? String(user.id) : "";

  async function handleSendConnect(targetUserId: string) {
    if (!targetUserId || targetUserId === meId) return;
    setRequestedUsers((prev) => ({ ...prev, [targetUserId]: true }));
    try {
      await sendConnectionRequest(targetUserId);
      showToast("Connection request sent");
      await loadSidebar();
    } catch {
      setRequestedUsers((prev) => ({ ...prev, [targetUserId]: false }));
      showToast("Failed to send request");
    }
  }

  const peopleYouCanReach = [
    ...connections.accepted.map((c) => ({
      id: c.partner.id,
      name: c.partner.fullName || c.partner.username,
      username: c.partner.username,
      role: c.partner.headline || "Developer",
      mutuals: "",
      avatarUrl: c.partner.avatarUrl || undefined,
    })),
    ...suggested
      .filter((s) => !connections.accepted.some((c) => c.partner.id === s.id))
      .map((s) => ({
        id: s.id,
        name: s.fullName || s.username,
        username: s.username,
        role: s.headline || "Developer",
        mutuals: "",
        avatarUrl: s.avatarUrl || undefined,
      })),
  ];

  const suggestedCreators = suggested.slice(0, 8).map((s) => ({
    id: s.id,
    name: s.fullName || s.username,
    username: s.username,
    headline: s.headline || "Developer on DevZ-Go",
    avatarUrl: s.avatarUrl || undefined,
  }));


  // Current logged in user info (or default to Janasi Rajput as shown in the design)
  const userDisplayName: string =
    me.data?.fullName ||
    (typeof user?.fullName === "string" ? user.fullName : "") ||
    (typeof user?.full_name === "string" ? user.full_name : "") ||
    "You";
  const userDisplayUsername: string = user?.username ? `@${user.username}` : "@you";
  const userDisplayRole: string =
    me.data?.headline ||
    (typeof user?.headline === "string" ? user.headline : "") ||
    "Developer";
  const userAvatarUrl: string | null =
    me.data?.avatarUrl ||
    (typeof user?.avatar_url === "string" ? user.avatar_url : null) ||
    null;

  return (
    <div className="min-h-screen bg-[#FBF8F2] text-[#2D120D] font-sans antialiased">
      <Navbar />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-4 right-4 z-50 flex items-center gap-2 rounded-full border border-[#DECDBA] bg-[#2D120D] px-5 py-2.5 font-sans text-sm font-semibold text-[#FFF8CA] shadow-xl sm:left-auto sm:right-6 sm:max-w-sm">
          <Check className="w-4 h-4 text-[#CDE3E8]" />
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        {/* ========================================================================= */}
        {/* 1. TOP BANNER: compact maroon / warm beige scrapbook (Manasi theme)        */}
        {/* ========================================================================= */}
        <div
          className="w-full h-3.5 mb-3.5 rounded-t-[1.5rem] shadow-2xs overflow-hidden"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, #6B0B0C 0px, #6B0B0C 16px, #EAD5C5 16px, #EAD5C5 32px, #FFF8CA 32px, #FFF8CA 48px)",
          }}
          aria-hidden
        />
        <section className="relative rounded-[2rem] pattern-maroon-gingham border-2 border-[#6B0B0C]/25 p-4 sm:p-5 shadow-[0_10px_28px_rgba(45,18,13,0.12)] overflow-hidden mb-6">
          <div className="absolute inset-0 pattern-maroon-stars opacity-40 pointer-events-none" aria-hidden />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Left: Cute Retro Laptop Sticker */}
            <div className="hidden sm:flex items-center justify-center shrink-0 -rotate-3 hover:rotate-0 transition-transform duration-300">
              <RetroLaptopSticker className="w-20 h-16 sm:w-24 sm:h-20" />
            </div>

            {/* Center: Washi Tape + Serif Italic "Dev Social" Title */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left flex-1 min-w-0">
              <div className="inline-block px-3 py-0.5 -rotate-2 select-none shadow-xs text-[9px] sm:text-[10px] font-mono font-bold tracking-[0.2em] uppercase border border-[#6B0B0C]/30 rounded-full bg-[#FFF8CA] text-[#6B0B0C]">
                Community Space
              </div>
              <h1 className="font-serif italic font-bold text-3xl sm:text-5xl text-[#6B0B0C] tracking-tight leading-none mt-1.5">
                Dev Social
              </h1>
              <p className="mt-1.5 font-sans text-xs sm:text-sm text-[#2D120D]/80 font-medium max-w-lg">
                A cozy space to share project updates, discover fellow builders, and connect across the community.
              </p>
            </div>

            {/* Middle-Right: Creators ✦ Builds ✦ Connections Pill */}
            <div className="shrink-0">
              <div className="inline-flex items-center gap-2.5 px-3.5 sm:px-4 py-1.5 rounded-full bg-white/90 border border-[#6B0B0C]/25 backdrop-blur-xs text-xs sm:text-sm font-semibold text-[#2D120D] shadow-xs">
                <span>Creators</span>
                <span className="text-[#6B0B0C] text-xs">✦</span>
                <span>Builds</span>
                <span className="text-[#6B0B0C] text-xs">✦</span>
                <span>Connections</span>
              </div>
            </div>

            {/* Right: Pressed Botanicals with maroon gingham patch */}
            <div className="hidden md:flex items-center justify-center shrink-0 rotate-3 hover:rotate-0 transition-transform duration-300 relative">
              <div className="absolute inset-0 rounded-2xl border border-[#6B0B0C]/20 pattern-maroon-gingham opacity-50 -rotate-6" />
              <DriedBotanicalsSticker className="w-20 h-24 relative z-10" />
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. SEGMENTED NAVIGATION BAR (Pills below banner)                           */}
        {/* ========================================================================= */}
        <nav aria-label="Network Sections" className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 mb-8">
          <button
            type="button"
            onClick={() => setActiveNavTab("feed")}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-sans text-xs sm:text-sm font-semibold transition shadow-xs cursor-pointer ${
              activeNavTab === "feed"
                ? "bg-[#780D18] text-white"
                : "bg-white/80 text-[#3E2217] border border-[#DECDBA] hover:bg-white"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Feed</span>
          </button>

          <Link
            to="/network/connections"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-sans text-xs sm:text-sm font-semibold bg-white/80 text-[#3E2217] border border-[#DECDBA] hover:bg-white transition shadow-xs"
          >
            <Users className="w-4 h-4" />
            <span>My Network</span>
          </Link>

          <Link
            to="/network/groups"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-sans text-xs sm:text-sm font-semibold bg-white/80 text-[#3E2217] border border-[#DECDBA] hover:bg-white transition shadow-xs"
          >
            <Boxes className="w-4 h-4" />
            <span>Clubs &amp; Showcases</span>
          </Link>

          <button
            type="button"
            onClick={() => setActiveNavTab(activeNavTab === "creators" ? "feed" : "creators")}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-sans text-xs sm:text-sm font-semibold transition shadow-xs cursor-pointer ${
              activeNavTab === "creators"
                ? "bg-[#780D18] text-white"
                : "bg-white/80 text-[#3E2217] border border-[#DECDBA] hover:bg-white"
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Discover Creators</span>
          </button>
        </nav>

        {/* Constellation View Mode (when toggled via Discover Creators) */}
        {activeNavTab === "creators" && (
          <div className="mb-8 rounded-3xl bg-white border border-[#DECDBA] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-[#2D120D]">Interactive Creator Constellation</h2>
                <p className="text-xs text-[#6E5952]">Explore developers, connections, and activity nodes in the community mesh.</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveNavTab("feed")}
                className="px-4 py-1.5 rounded-full bg-[#780D18] text-white text-xs font-semibold"
              >
                Back to Feed
              </button>
            </div>
            <ConstellationGraph
              meId={meId}
              creators={suggested.filter((person) => person.id !== meId)}
              connections={connections.accepted.filter((c) => c.partner.id !== meId)}
              activities={feed.filter((item) => item.userId !== meId)}
              onConnect={handleSendConnect}
              requestedUsers={requestedUsers}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. THREE-COLUMN RESPONSIVE LAYOUT (Exactly matching reference artwork)    */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] xl:grid-cols-[290px_1fr_340px] gap-6 items-start">
          {/* ─────────────────────────────────────────────────────────────────────── */}
          {/* COLUMN 1 (LEFT): User Card, YOUR NETWORK, COMMUNITIES & CLUBS           */}
          {/* ─────────────────────────────────────────────────────────────────────── */}
          <aside className="space-y-6">
            {/* Card 1: User Profile Mini Card */}
            <div className="relative rounded-3xl border border-[#DECDBA] bg-white p-5 shadow-xs overflow-hidden">
              {/* Top Card Gingham Checkered Accent */}
              <div
                className="absolute top-0 left-0 right-0 h-14 opacity-25"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg, #6B0B0C 0px, #6B0B0C 1px, transparent 1px, transparent 12px), repeating-linear-gradient(90deg, #6B0B0C 0px, #6B0B0C 1px, transparent 1px, transparent 12px)",
                  backgroundColor: "#FAF3E8",
                }}
              />
              {/* Sparkles doodle on top-right */}
              <div className="absolute top-3.5 right-4 z-10 text-[#C98B28]">
                <Sparkles className="w-4 h-4 fill-[#C98B28]/20" />
              </div>

              <div className="relative z-10 flex items-center gap-3.5 pt-2">
                <Link to="/profile" className="shrink-0 group">
                  <MemberAvatar
                    name={userDisplayName}
                    src={userAvatarUrl}
                    size="lg"
                    className="border-2 border-white shadow-xs group-hover:scale-105 transition-transform !h-14 !w-14 !text-sm"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    to="/profile"
                    className="font-bold text-base text-[#2D120D] hover:text-[#780D18] transition truncate block"
                  >
                    {userDisplayName}
                  </Link>
                  <p className="text-xs text-[#6E5952] truncate font-medium">{userDisplayUsername}</p>
                  <span className="inline-block mt-1.5 px-3 py-0.5 rounded-full bg-[#FFF8CA] border border-[#780D18]/15 text-[#780D18] text-[11px] font-semibold">
                    {userDisplayRole}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: YOUR NETWORK */}
            <div className="rounded-3xl border border-[#DECDBA] bg-white p-5 shadow-xs">
              <h3 className="text-xs font-bold tracking-wider uppercase text-[#2D120D] mb-4">
                YOUR NETWORK
              </h3>

              <div className="space-y-3.5 mb-5">
                <Link
                  to="/network/connections"
                  className="flex items-center justify-between text-xs sm:text-sm font-medium text-[#2D120D] hover:text-[#780D18] transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-[#6E5952] group-hover:text-[#780D18]" />
                    <span>Connections</span>
                  </div>
                  <span className="font-semibold text-[#2D120D]">
                    {connections.accepted.length > 0 ? connections.accepted.length : 922}
                  </span>
                </Link>

                <Link
                  to="/network/connections?tab=requests"
                  className="flex items-center justify-between text-xs sm:text-sm font-medium text-[#2D120D] hover:text-[#780D18] transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-[#6E5952] group-hover:text-[#780D18]" />
                    <span>Invitations</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#780D18] text-white text-[11px] font-bold">
                    {connections.pendingIncoming.length > 0 ? connections.pendingIncoming.length : 3}
                  </span>
                </Link>

                <Link
                  to="/network/connections"
                  className="flex items-center justify-between text-xs sm:text-sm font-medium text-[#2D120D] hover:text-[#780D18] transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <UserCheck className="w-4 h-4 text-[#6E5952] group-hover:text-[#780D18]" />
                    <span>Following</span>
                  </div>
                  <span className="font-semibold text-[#2D120D]">128</span>
                </Link>

                <Link
                  to="/network/groups"
                  className="flex items-center justify-between text-xs sm:text-sm font-medium text-[#2D120D] hover:text-[#780D18] transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <UsersRound className="w-4 h-4 text-[#6E5952] group-hover:text-[#780D18]" />
                    <span>Groups</span>
                  </div>
                  <span className="font-semibold text-[#2D120D]">5</span>
                </Link>
              </div>

              <Link
                to="/network/connections"
                className="w-full py-2.5 px-4 rounded-xl border border-[#DECDBA] text-xs font-semibold text-[#2D120D] hover:bg-[#FAF7F2] transition flex items-center justify-center gap-2 shadow-2xs"
              >
                <Settings className="w-3.5 h-3.5 text-[#6E5952]" />
                <span>Manage Network →</span>
              </Link>
            </div>

            {/* Card 3: COMMUNITIES & CLUBS */}
            <div className="rounded-3xl border border-[#DECDBA] bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold tracking-wider uppercase text-[#780D18]">
                  COMMUNITIES &amp; CLUBS
                </span>
                <Sparkles className="w-3.5 h-3.5 text-[#C98B28]" />
              </div>

              <h3 className="font-bold text-lg text-[#2D120D] mb-1">
                Clubs &amp; Showcases
              </h3>
              <p className="text-xs text-[#6E5952] leading-relaxed mb-4">
                Join developer clubs, participate in events, and showcase your projects.
              </p>

              <div className="space-y-2.5 mb-4">
                {sidebarClubs.length === 0 ? (
                  <p className="text-xs text-[#6E5952] py-2">No clubs yet. Create or join one to see them here.</p>
                ) : (
                  sidebarClubs.slice(0, 4).map((club) => (
                    <Link
                      key={club.id}
                      to={`/network/groups/${club.slug || club.id}`}
                      className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-[#FAF7F2] border border-transparent hover:border-[#DECDBA] transition group"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-[#2D120D] group-hover:text-[#780D18] truncate">{club.name}</p>
                        <p className="text-[11px] text-[#6E5952]">{club.memberCount} members</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#DECDBA] group-hover:text-[#780D18] shrink-0" />
                    </Link>
                  ))
                )}
              </div>

              <Link
                to="/network/groups"
                className="w-full py-2.5 px-4 rounded-xl bg-[#F3EBDD] hover:bg-[#EAE0D0] text-[#3E2217] font-semibold text-xs transition flex items-center justify-center"
              >
                Browse All Clubs
              </Link>
            </div>
          </aside>

          {/* ─────────────────────────────────────────────────────────────────────── */}
          {/* COLUMN 2 (CENTER): Share Composer, Community Feed & Posts               */}
          {/* ─────────────────────────────────────────────────────────────────────── */}
          <div className="space-y-6">
            {/* Post Composer Card */}
            <div className="rounded-3xl border border-[#DECDBA] bg-white p-4 sm:p-5 shadow-xs">
              <div className="flex items-center gap-3 mb-3">
                <MemberAvatar
                  name={userDisplayName}
                  src={userAvatarUrl}
                  size="md"
                  className="border border-[#DECDBA]"
                />
                <input
                  type="text"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Share a thought, project update, or ask the community..."
                  className="w-full rounded-2xl bg-[#FAF7F2] border border-[#DECDBA] px-4 py-2.5 text-xs sm:text-sm text-[#2D120D] placeholder-[#6E5952]/60 focus:outline-none focus:border-[#780D18] focus:ring-1 focus:ring-[#780D18] transition"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleCreatePost(e);
                    }
                  }}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#DECDBA]/40">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => setPostType("post")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                      postType === "post"
                        ? "bg-[#FAF3E8] border border-[#DECDBA] text-[#780D18]"
                        : "text-[#6E5952] hover:bg-[#FAF7F2]"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Note</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostType("spark")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                      postType === "spark"
                        ? "bg-[#FAF3E8] border border-[#DECDBA] text-[#780D18]"
                        : "text-[#6E5952] hover:bg-[#FAF7F2]"
                    }`}
                  >
                    <CodeXml className="w-3.5 h-3.5" />
                    <span>Project</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostType("milestone")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                      postType === "milestone"
                        ? "bg-[#FAF3E8] border border-[#DECDBA] text-[#780D18]"
                        : "text-[#6E5952] hover:bg-[#FAF7F2]"
                    }`}
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>Milestone</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostType("collab_call")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                      postType === "collab_call"
                        ? "bg-[#FAF3E8] border border-[#DECDBA] text-[#780D18]"
                        : "text-[#6E5952] hover:bg-[#FAF7F2]"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Collab Call</span>
                  </button>
                </div>

                <button
                  type="button"
                  disabled={!postContent.trim() || posting}
                  onClick={handleCreatePost}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#780D18] hover:bg-[#5C0A12] text-white font-sans text-xs font-semibold transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {posting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Post</span>
                </button>
              </div>
            </div>

            {/* Community Feed Header & Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <h2 className="font-bold text-xl sm:text-2xl text-[#2D120D]">Community Feed</h2>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setFeedFilterTab("for-you")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                    feedFilterTab === "for-you"
                      ? "bg-[#FAF3E8] border border-[#DECDBA] text-[#2D120D] shadow-2xs"
                      : "text-[#6E5952] hover:bg-white"
                  }`}
                >
                  For You ∨
                </button>
                <button
                  type="button"
                  onClick={() => setFeedFilterTab("following")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                    feedFilterTab === "following"
                      ? "bg-[#FAF3E8] border border-[#DECDBA] text-[#2D120D] shadow-2xs"
                      : "text-[#6E5952] hover:bg-white"
                  }`}
                >
                  Following
                </button>
                <button
                  type="button"
                  onClick={() => setFeedFilterTab("latest")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                    feedFilterTab === "latest"
                      ? "bg-[#FAF3E8] border border-[#DECDBA] text-[#2D120D] shadow-2xs"
                      : "text-[#6E5952] hover:bg-white"
                  }`}
                >
                  Latest
                </button>
                <button
                  type="button"
                  onClick={() => setFeedFilterTab("projects")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                    feedFilterTab === "projects"
                      ? "bg-[#FAF3E8] border border-[#DECDBA] text-[#2D120D] shadow-2xs"
                      : "text-[#6E5952] hover:bg-white"
                  }`}
                >
                  Projects
                </button>
              </div>
            </div>

            {/* Real community feed */}

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 bg-white rounded-3xl border border-dashed border-[#DECDBA]">
                <Loader2 className="w-6 h-6 text-[#780D18] animate-spin" />
                <p className="text-xs text-[#6E5952]">Gathering community posts…</p>
              </div>
            ) : feed.length > 0 ? (
              <div className="space-y-6">
                {feed.map((activity, idx) => (
                  <FeedItem key={activity.id} activity={activity} index={idx} notify={showToast} />
                ))}
                <div ref={moreRef} />
                {hasNextPage && (
                  <button
                    type="button"
                    disabled={isFetchingNextPage}
                    onClick={() => void fetchNextPage()}
                    className="w-full rounded-full border border-[#DECDBA] bg-white py-2.5 font-sans text-xs font-semibold text-[#2D120D] hover:bg-[#FAF7F2] transition"
                  >
                    {isFetchingNextPage ? "Loading…" : "Load more updates"}
                  </button>
                )}
              </div>
            ) : (
              <div className="py-14 flex flex-col items-center justify-center gap-2 bg-white rounded-3xl border border-dashed border-[#DECDBA] text-center px-6">
                <p className="font-semibold text-sm text-[#2D120D]">No posts yet</p>
                <p className="text-xs text-[#6E5952] max-w-sm">
                  Be the first to share a note, milestone, or project update with the community.
                </p>
              </div>
            )}
          </div>

          {/* ─────────────────────────────────────────────────────────────────────── */}
          {/* COLUMN 3 (RIGHT): People you can reach, Suggested Creators, Notes       */}
          {/* ─────────────────────────────────────────────────────────────────────── */}
          <aside className="space-y-6">
            {/* 01. People you can reach (Carousel Card) */}
            <div className="rounded-3xl border border-[#DECDBA] bg-white p-5 shadow-xs relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm sm:text-base text-[#2D120D]">
                  01. People you can reach
                </h3>
                <Link
                  to="/network/connections"
                  className="text-xs font-semibold text-[#780D18] hover:underline"
                >
                  View All →
                </Link>
              </div>

              {/* Carousel Container with Left / Right Navigation */}
              <div className="relative">
                {/* Arrow Left */}
                <button
                  type="button"
                  onClick={() => setCarouselIndex((i) => (peopleYouCanReach.length ? (i > 0 ? i - 1 : Math.max(0, peopleYouCanReach.length - 3)) : 0))}
                  className="absolute -left-2.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white border border-[#DECDBA] shadow-xs flex items-center justify-center text-[#2D120D] hover:bg-[#FAF7F2] transition cursor-pointer"
                  title="Previous creators"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Arrow Right */}
                <button
                  type="button"
                  onClick={() => setCarouselIndex((i) => (i + 1 < peopleYouCanReach.length ? i + 1 : 0))}
                  className="absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white border border-[#DECDBA] shadow-xs flex items-center justify-center text-[#2D120D] hover:bg-[#FAF7F2] transition cursor-pointer"
                  title="Next creators"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Carousel Cards Track */}
                {peopleYouCanReach.length === 0 ? (
                  <p className="text-xs text-[#6E5952] px-1 py-6 text-center">Connect with developers to see people here.</p>
                ) : (
                <div className="grid grid-cols-3 gap-2 px-3">
                  {peopleYouCanReach.slice(carouselIndex, carouselIndex + 3).map((person) => {
                    const isRequested = requestedUsers[person.id];
                    return (
                      <div
                        key={person.id}
                        className="flex flex-col items-center text-center p-2 rounded-2xl bg-[#FAF7F2] border border-[#DECDBA]/60"
                      >
                        <MemberAvatar
                          name={person.name}
                          src={person.avatarUrl}
                          size="md"
                          className="border border-white shadow-2xs mb-1.5"
                        />
                        <Link to={`/profile/${person.username || person.id}`} className="font-bold text-xs text-[#2D120D] truncate w-full hover:text-[#780D18]">
                          {person.name}
                        </Link>
                        <Link to={`/profile/${person.username || person.id}`} className="text-[10px] text-[#6E5952] truncate w-full hover:underline">
                          @{person.username}
                        </Link>
                        <p className="text-[10px] text-[#6E5952] truncate w-full mt-0.5 font-medium">
                          {person.role}
                        </p>
                        <p className="text-[10px] text-[#780D18] font-semibold mt-1 flex items-center gap-0.5">
                          <span>👥</span> {person.mutuals}
                        </p>

                        <button
                          type="button"
                          disabled={isRequested}
                          onClick={() => handleSendConnect(person.id)}
                          className={`mt-2 w-full py-1 px-2 rounded-full text-[10px] font-semibold transition cursor-pointer flex items-center justify-center gap-1 shadow-2xs ${
                            isRequested
                              ? "bg-stone-200 text-stone-500 cursor-default"
                              : "bg-[#780D18] hover:bg-[#5C0A12] text-white"
                          }`}
                        >
                          {isRequested ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Sent</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3 h-3" />
                              <span>Connect</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
                )}
              </div>
            </div>

            {/* 04. Suggested Creators */}
            <div className="rounded-3xl border border-[#DECDBA] bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm sm:text-base text-[#2D120D]">
                  04. Suggested Creators
                </h3>
                <Link
                  to="/explore/developers"
                  className="text-xs font-semibold text-[#780D18] hover:underline"
                >
                  Discover →
                </Link>
              </div>

              <div className="space-y-3.5">
                {suggestedCreators.length === 0 ? (
                  <p className="text-xs text-[#6E5952]">No suggestions right now.</p>
                ) : suggestedCreators.map((creator) => {
                  const isRequested = requestedUsers[creator.id];
                  return (
                    <div key={creator.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <MemberAvatar
                          name={creator.name}
                          src={creator.avatarUrl}
                          size="md"
                          className="border border-[#DECDBA]"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-1 truncate">
                            <span className="font-bold text-xs sm:text-sm text-[#2D120D] truncate">
                              {creator.name}
                            </span>
                            <span className="text-[11px] text-[#6E5952]">@{creator.username}</span>
                          </div>
                          <p className="text-[11px] text-[#6E5952] truncate leading-tight mt-0.5">
                            {creator.headline}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isRequested}
                        onClick={() => handleSendConnect(creator.id)}
                        className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                          isRequested
                            ? "bg-stone-200 text-stone-500 border border-stone-300"
                            : "border border-[#780D18] text-[#780D18] hover:bg-[#780D18] hover:text-white"
                        }`}
                      >
                        {isRequested ? "Sent" : "+ Connect"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 02. Community Notes */}
            <div className="rounded-3xl border border-[#DECDBA] bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm sm:text-base text-[#2D120D]">
                  02. Community Notes
                </h3>
                <Link
                  to="/network"
                  className="text-xs font-semibold text-[#780D18] hover:underline"
                >
                  View All →
                </Link>
              </div>

              <div className="space-y-3.5">
                {feed.slice(0, 4).length === 0 ? (
                  <p className="text-xs text-[#6E5952]">Recent posts will appear here.</p>
                ) : (
                  feed.slice(0, 4).map((item) => (
                    <Link
                      key={item.id}
                      to={`/network/post/${item.id}`}
                      className="flex items-start gap-3 p-2.5 rounded-2xl hover:bg-[#FAF7F2] transition"
                    >
                      <div className="w-9 h-9 rounded-xl bg-[#FFF5C0] text-[#8C6D1F] flex items-center justify-center shrink-0 mt-0.5">
                        <StickyNote className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs sm:text-sm text-[#2D120D] leading-snug line-clamp-2">
                          {item.title || item.content || "Community update"}
                        </h4>
                        <p className="text-[11px] text-[#6E5952] mt-0.5 truncate">@{item.authorUsername}</p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
