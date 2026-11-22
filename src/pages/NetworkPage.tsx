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
  Heart,
  MessageSquare,
  Repeat,
  Bookmark,
  MoreHorizontal,
  ExternalLink,
  Megaphone,
  StickyNote,
  Check,
  Loader2,
  Cpu,
  Globe,
  CheckCircle2,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { createPost, fetchFeedPage } from "../api/network";
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

/* ── Vintage Editorial Ornaments for the Network Banner ── */

/** Hand-drawn vintage corner vine swirl & stars (inspired by heritage invitation prints) */
function VintageCornerSwirl({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 110 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <path
        d="M8 70 C10 42, 26 22, 54 14 C72 9, 88 12, 96 22 C102 29, 96 38, 88 36 C81 34, 80 25, 86 22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M28 38 C22 28, 28 16, 38 18 C46 20, 44 30, 37 30"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M52 16 C56 7, 68 6, 72 14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M16 52 C8 50, 6 40, 14 36"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Hand-drawn tiny stars */}
      <path
        d="M18 14 L20.5 19.5 L26 20 L21.5 23.5 L23 29 L18 25.8 L13 29 L14.5 23.5 L10 20 L15.5 19.5 Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="72" cy="30" r="1.8" fill="currentColor" />
      <circle cx="24" cy="60" r="1.5" fill="currentColor" />
    </svg>
  );
}

/** Delicate hand-drawn 8-pointed vintage starburst + spiral sparkle cluster */
function VintageSparkleCluster({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 72 88" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      {/* 4-pointed drawn star */}
      <path
        d="M36 12 Q37 26 48 28 Q37 30 36 44 Q35 30 24 28 Q35 26 36 12 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Tiny spiral doodle */}
      <path
        d="M19 60 C19 56, 25 55, 26 60 C27 65, 19 68, 15 63 C12 58, 17 51, 24 52"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      {/* Small 8-point starburst */}
      <path
        d="M52 58 L52 74 M44 66 L60 66 M46.5 60.5 L57.5 71.5 M57.5 60.5 L46.5 71.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      {/* Tiny crosses & open dots */}
      <path d="M54 16 L58 20 M58 16 L54 20" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="16" cy="34" r="2" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="48" cy="44" r="1.6" fill="currentColor" />
    </svg>
  );
}

/** TaskFlow v2 Mini Dashboard UI Mockup */
function TaskFlowMockup() {
  return (
    <div className="w-full sm:w-44 h-28 rounded-xl bg-gradient-to-br from-[#FFFDF9] to-[#F5ECE1] border border-[#DECDBA] p-2 flex flex-col justify-between shrink-0 shadow-inner overflow-hidden">
      <div className="flex items-center justify-between pb-1.5 border-b border-[#DECDBA]/60">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E27A7A]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#E8C56A]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#82C785]" />
        </div>
        <span className="text-[8px] font-mono font-semibold text-[#8C7B70]">taskflow.app</span>
      </div>
      <div className="flex gap-2 flex-1 pt-1.5">
        <div className="flex-1 bg-white/90 rounded-lg p-1.5 border border-[#DECDBA]/50 flex flex-col gap-1">
          <div className="h-1.5 w-8 bg-[#8C7B70]/40 rounded-full" />
          <div className="h-4 bg-[#FFF8CA] rounded border border-[#E5D7C6] p-0.5">
            <div className="h-1 w-10 bg-[#780D18]/50 rounded-full" />
          </div>
          <div className="h-4 bg-white rounded border border-[#DECDBA] p-0.5">
            <div className="h-1 w-7 bg-[#8C7B70]/30 rounded-full" />
          </div>
        </div>
        <div className="flex-1 bg-white/90 rounded-lg p-1.5 border border-[#DECDBA]/50 flex flex-col gap-1">
          <div className="h-1.5 w-10 bg-[#284E45]/40 rounded-full" />
          <div className="h-5 bg-[#E2F0CB] rounded border border-[#CDE3E8] p-0.5">
            <div className="h-1 w-8 bg-[#284E45]/60 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Stack of Isometric Books Mockup */
function RagBooksMockup() {
  return (
    <div className="w-full sm:w-44 h-28 rounded-xl bg-gradient-to-br from-[#FFFDF9] to-[#F5ECE1] border border-[#DECDBA] flex items-center justify-center shrink-0 shadow-inner overflow-hidden p-2">
      <svg viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-28 h-20 drop-shadow-sm">
        {/* Bottom Book (Coffee/Burgundy) */}
        <g>
          <path d="M22 68 L78 78 L104 62 L48 52 Z" fill="#FBF5E8" stroke="#D4C3B3" strokeWidth="0.8" />
          <path d="M20 62 L76 72 L76 77 L20 67 Z" fill="#5C1820" />
          <path d="M20 62 L46 48 L102 58 L76 72 Z" fill="#780D18" />
        </g>
        {/* Middle Book (Sage/Olive Green) */}
        <g>
          <path d="M26 50 L80 60 L102 46 L48 36 Z" fill="#FAF5E6" stroke="#D4C3B3" strokeWidth="0.8" />
          <path d="M24 45 L78 55 L78 59 L24 49 Z" fill="#1C3831" />
          <path d="M24 45 L46 32 L100 42 L78 55 Z" fill="#284E45" />
        </g>
        {/* Top Book (Ochre/Gold) */}
        <g>
          <path d="M30 34 L82 43 L98 31 L46 22 Z" fill="#FFFDF5" stroke="#DECDBA" strokeWidth="0.8" />
          <path d="M28 29 L80 38 L80 42 L28 33 Z" fill="#8C5C1B" />
          <path d="M28 29 L44 18 L96 27 L80 38 Z" fill="#C98B28" />
        </g>
        <path d="M80 38 Q86 48 88 56 L91 52 L94 56 Q88 44 82 39" fill="#780D18" />
      </svg>
    </div>
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

  // Interactive like / bookmark states for demo showcase posts
  const [arjunLiked, setArjunLiked] = useState(false);
  const [arjunLikesCount, setArjunLikesCount] = useState(128);
  const [arjunBookmarked, setArjunBookmarked] = useState(false);

  const [miraLiked, setMiraLiked] = useState(false);
  const [miraLikesCount, setMiraLikesCount] = useState(86);
  const [miraBookmarked, setMiraBookmarked] = useState(false);

  // Carousel scroll index for "01. People you can reach"
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadSidebar = useCallback(async () => {
    try {
      const [connData, suggData] = await Promise.all([
        fetchConnections(),
        fetchSuggestedDevelopers(),
      ]);
      if (connData && Array.isArray(connData.accepted)) {
        setConnections(connData);
      }
      if (Array.isArray(suggData)) {
        setSuggested(suggData);
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

  // People you can reach items
  const peopleYouCanReach = [
    {
      id: "demo-p1",
      name: "Manasi Sharma",
      username: "manasi",
      role: "Analytics Engineer",
      mutuals: "4 mutual",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&crop=faces",
    },
    {
      id: "demo-p2",
      name: "Bhupesh Verma",
      username: "bhupesh",
      role: "Backend Developer",
      mutuals: "2 mutual",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&h=256&fit=crop&crop=faces",
    },
    {
      id: "demo-p3",
      name: "Riya Anand",
      username: "riya",
      role: "DevOps Engineer",
      mutuals: "5 mutual",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces",
    },
    {
      id: "demo-p4",
      name: "Chan S.",
      username: "chan",
      role: "Security Architect",
      mutuals: "3 mutual",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&h=256&fit=crop&crop=faces",
    },
  ];

  // Suggested Creators items
  const suggestedCreators = [
    {
      id: "demo-c1",
      name: "Karan Malhotra",
      username: "karan",
      headline: "AI/ML Engineer · Building with LLMs",
      avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=256&h=256&fit=crop&crop=faces",
    },
    {
      id: "demo-c2",
      name: "Aditi Desai",
      username: "aditi",
      headline: "Product Engineer · React · Design Systems",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=256&h=256&fit=crop&crop=faces",
    },
    {
      id: "demo-c3",
      name: "Neel Iyer",
      username: "neel",
      headline: "SRE · Cloud · Observability",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=256&h=256&fit=crop&crop=faces",
    },
  ];

  // Current logged in user info (or default to Janasi Rajput as shown in the design)
  const userDisplayName: string =
    me.data?.fullName ||
    (typeof user?.fullName === "string" ? user.fullName : "") ||
    (typeof user?.full_name === "string" ? user.full_name : "") ||
    "Janasi Rajput";
  const userDisplayUsername: string = user?.username ? `@${user.username}` : "@janasi";
  const userDisplayRole: string =
    me.data?.headline ||
    (typeof user?.headline === "string" ? user.headline : "") ||
    "Frontend Developer";
  const userAvatarUrl: string =
    me.data?.avatarUrl ||
    (typeof user?.avatar_url === "string" ? user.avatar_url : "") ||
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces";

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
        {/* 1. TOP BANNER: Vintage Heritage Striped Medallion                         */}
        {/* ========================================================================= */}
        <section
          className="relative rounded-[2rem] border border-[#2D120D]/30 shadow-[0_12px_30px_rgba(45,18,13,0.16)] overflow-hidden mb-6 py-5 sm:py-6 px-4 sm:px-8"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, #6B0B0C 0px, #6B0B0C 16px, #520809 16px, #520809 32px)",
          }}
        >
          {/* Soft dark-espresso edge vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 45%, rgba(45, 18, 13, 0.32) 100%)",
            }}
            aria-hidden
          />

          {/* Vintage corner vine swirls & stars on striped backdrop */}
          <VintageCornerSwirl className="hidden sm:block absolute top-2.5 left-3 w-24 h-18 text-[#FFF8CA]/80 pointer-events-none" />
          <VintageCornerSwirl className="hidden sm:block absolute top-2.5 right-3 w-24 h-18 text-[#FFF8CA]/80 -scale-x-100 pointer-events-none" />
          <VintageCornerSwirl className="hidden md:block absolute bottom-2.5 left-3 w-20 h-14 text-[#FFF8CA]/55 -scale-y-100 pointer-events-none" />
          <VintageCornerSwirl className="hidden md:block absolute bottom-2.5 right-3 w-20 h-14 text-[#FFF8CA]/55 -scale-x-100 -scale-y-100 pointer-events-none" />

          {/* Centered Warm Cream Vintage Medallion */}
          <div className="relative z-10 max-w-2xl mx-auto rounded-[2.75rem] bg-[#FAF3E3] border border-[#6B0B0C]/30 shadow-[0_6px_22px_rgba(45,18,13,0.22)] px-6 py-4 sm:px-12 sm:py-5 text-center overflow-hidden">
            {/* Inner delicate vintage frame */}
            <div
              className="absolute inset-2 rounded-[2.25rem] border border-[#6B0B0C]/20 pointer-events-none"
              aria-hidden
            />

            {/* Hand-drawn sparkle & spiral doodles inside medallion */}
            <VintageSparkleCluster className="hidden sm:block absolute left-3 top-1/2 -translate-y-1/2 w-14 h-18 text-[#6B0B0C]/75 pointer-events-none" />
            <VintageSparkleCluster className="hidden sm:block absolute right-3 top-1/2 -translate-y-1/2 w-14 h-18 text-[#6B0B0C]/75 -scale-x-100 pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
              <span className="font-editorial italic text-sm sm:text-base text-[#6B0B0C]/80 tracking-wide">
                ( 01 &middot; community )
              </span>

              <h1 className="m-0 mt-0.5 font-editorial font-normal text-3xl sm:text-[2.65rem] text-[#2D120D] tracking-[-0.015em] leading-[0.95]">
                <span className="font-flourish text-4xl sm:text-[3.3rem] text-[#6B0B0C] leading-none -mr-1 align-baseline">
                  C
                </span>
                ommunity{" "}
                <span className="uppercase tracking-[0.06em] text-[#6B0B0C]">NETWORK</span>
              </h1>

              <p className="mt-1.5 font-sans text-xs sm:text-sm text-[#2D120D]/80 max-w-md">
                Share project updates, discover fellow builders, and grow together.
              </p>

              <div className="mt-2.5 inline-flex items-center gap-2.5 sm:gap-3 font-editorial italic text-xs sm:text-sm text-[#6B0B0C]/85">
                <span>( creators )</span>
                <span className="not-italic text-[10px] text-[#6B0B0C]/60" aria-hidden>✦</span>
                <span>( builds )</span>
                <span className="not-italic text-[10px] text-[#6B0B0C]/60" aria-hidden>✦</span>
                <span>( connections )</span>
              </div>
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
          <aside className="space-y-6 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto scrollbar-none">
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
                  <img
                    src={userAvatarUrl}
                    alt={userDisplayName}
                    className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-xs group-hover:scale-105 transition-transform"
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
                <Link
                  to="/network/groups/robotics-club"
                  className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-[#FAF7F2] border border-transparent hover:border-[#DECDBA] transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#F7DDD4] text-[#9E3922] flex items-center justify-center shrink-0">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-[#2D120D] group-hover:text-[#780D18]">
                        Robotics Club
                      </p>
                      <p className="text-[11px] text-[#6E5952]">432 members</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#DECDBA] group-hover:text-[#780D18]" />
                </Link>

                <Link
                  to="/network/groups"
                  className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-[#FAF7F2] border border-transparent hover:border-[#DECDBA] transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#FFF5C0] text-[#8C6D1F] flex items-center justify-center shrink-0">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-[#2D120D] group-hover:text-[#780D18]">
                        Web Dev Collective
                      </p>
                      <p className="text-[11px] text-[#6E5952]">1.2k members</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#DECDBA] group-hover:text-[#780D18]" />
                </Link>
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
                <img
                  src={userAvatarUrl}
                  alt={userDisplayName}
                  className="w-10 h-10 rounded-full object-cover border border-[#DECDBA] shrink-0"
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

            {/* Post 1: Arjun Mehra (TaskFlow v2) */}
            <article className="rounded-3xl border border-[#DECDBA] bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&h=256&fit=crop&crop=faces"
                    alt="Arjun Mehra"
                    className="w-10 h-10 rounded-full object-cover border border-[#DECDBA]"
                  />
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-bold text-sm text-[#2D120D]">Arjun Mehra</span>
                      <span className="text-xs text-[#6E5952]">@arjun</span>
                    </div>
                    <p className="text-xs text-[#6E5952]">Full Stack Developer · 4h ago</p>
                  </div>
                </div>
                <button type="button" className="text-[#6E5952] hover:text-[#2D120D] p-1">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs sm:text-sm text-[#2D120D] leading-relaxed mb-3.5">
                Just shipped v2 of my task manager! 🎉 Added team workspaces and real-time sync. Would love your feedback on the new flow.
              </p>

              {/* Embedded Project Card */}
              <div className="rounded-2xl border border-[#DECDBA] bg-[#FAF7F2] p-3 sm:p-3.5 flex flex-col sm:flex-row gap-4 items-center mb-4">
                <TaskFlowMockup />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-bold text-sm text-[#2D120D]">TaskFlow v2</h4>
                    <ExternalLink className="w-3.5 h-3.5 text-[#6E5952]" />
                  </div>
                  <p className="text-xs text-[#6E5952] leading-relaxed mb-2.5">
                    A simple, collaborative task manager for small teams.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-md bg-[#E2F0CB] text-[#284E45] text-[11px] font-semibold">
                      React
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-[#E2F0CB] text-[#284E45] text-[11px] font-semibold">
                      Node.js
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-[#E2F0CB] text-[#284E45] text-[11px] font-semibold">
                      Socket.IO
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-2 border-t border-[#DECDBA]/40 text-xs text-[#6E5952]">
                <div className="flex items-center gap-6">
                  <button
                    type="button"
                    onClick={() => {
                      setArjunLiked(!arjunLiked);
                      setArjunLikesCount((c) => (arjunLiked ? c - 1 : c + 1));
                    }}
                    className={`inline-flex items-center gap-1.5 transition ${
                      arjunLiked ? "text-[#780D18] font-semibold" : "hover:text-[#780D18]"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${arjunLiked ? "fill-[#780D18]" : ""}`} />
                    <span>{arjunLikesCount}</span>
                  </button>
                  <button type="button" className="inline-flex items-center gap-1.5 hover:text-[#2D120D] transition">
                    <MessageSquare className="w-4 h-4" />
                    <span>24</span>
                  </button>
                  <button type="button" className="inline-flex items-center gap-1.5 hover:text-[#2D120D] transition">
                    <Repeat className="w-4 h-4" />
                    <span>12</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setArjunBookmarked(!arjunBookmarked)}
                  className={`p-1 transition ${arjunBookmarked ? "text-[#780D18]" : "hover:text-[#2D120D]"}`}
                >
                  <Bookmark className={`w-4 h-4 ${arjunBookmarked ? "fill-[#780D18]" : ""}`} />
                </button>
              </div>
            </article>

            {/* Post 2: Mira Joshi (Building a Local RAG Pipeline) */}
            <article className="rounded-3xl border border-[#DECDBA] bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=256&h=256&fit=crop&crop=faces"
                    alt="Mira Joshi"
                    className="w-10 h-10 rounded-full object-cover border border-[#DECDBA]"
                  />
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-bold text-sm text-[#2D120D]">Mira Joshi</span>
                      <span className="text-xs text-[#6E5952]">@mira</span>
                    </div>
                    <p className="text-xs text-[#6E5952]">ML Engineer · 1d ago</p>
                  </div>
                </div>
                <button type="button" className="text-[#6E5952] hover:text-[#2D120D] p-1">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs sm:text-sm text-[#2D120D] leading-relaxed mb-3.5">
                Wrote a beginner-friendly guide on setting up a local RAG pipeline. Hope it helps anyone exploring LLMs! 📚
              </p>

              {/* Embedded Resource Card */}
              <div className="rounded-2xl border border-[#DECDBA] bg-[#FAF7F2] p-3 sm:p-3.5 flex flex-col sm:flex-row gap-4 items-center mb-4">
                <RagBooksMockup />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-bold text-sm text-[#2D120D]">Building a Local RAG Pipeline</h4>
                    <ExternalLink className="w-3.5 h-3.5 text-[#6E5952]" />
                  </div>
                  <p className="text-xs text-[#6E5952] leading-relaxed mb-2.5">
                    A step-by-step guide with code and resources.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-md bg-[#E2F0CB] text-[#284E45] text-[11px] font-semibold">
                      Python
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-[#E2F0CB] text-[#284E45] text-[11px] font-semibold">
                      LLM
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-[#E2F0CB] text-[#284E45] text-[11px] font-semibold">
                      RAG
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between pt-2 border-t border-[#DECDBA]/40 text-xs text-[#6E5952]">
                <div className="flex items-center gap-6">
                  <button
                    type="button"
                    onClick={() => {
                      setMiraLiked(!miraLiked);
                      setMiraLikesCount((c) => (miraLiked ? c - 1 : c + 1));
                    }}
                    className={`inline-flex items-center gap-1.5 transition ${
                      miraLiked ? "text-[#780D18] font-semibold" : "hover:text-[#780D18]"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${miraLiked ? "fill-[#780D18]" : ""}`} />
                    <span>{miraLikesCount}</span>
                  </button>
                  <button type="button" className="inline-flex items-center gap-1.5 hover:text-[#2D120D] transition">
                    <MessageSquare className="w-4 h-4" />
                    <span>18</span>
                  </button>
                  <button type="button" className="inline-flex items-center gap-1.5 hover:text-[#2D120D] transition">
                    <Repeat className="w-4 h-4" />
                    <span>9</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setMiraBookmarked(!miraBookmarked)}
                  className={`p-1 transition ${miraBookmarked ? "text-[#780D18]" : "hover:text-[#2D120D]"}`}
                >
                  <Bookmark className={`w-4 h-4 ${miraBookmarked ? "fill-[#780D18]" : ""}`} />
                </button>
              </div>
            </article>

            {/* Dynamic Community Feed from API */}
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
            ) : null}
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
                  onClick={() => setCarouselIndex((i) => (i > 0 ? i - 1 : peopleYouCanReach.length - 3))}
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
                <div className="grid grid-cols-3 gap-2 px-3">
                  {peopleYouCanReach.slice(carouselIndex, carouselIndex + 3).map((person) => {
                    const isRequested = requestedUsers[person.id];
                    return (
                      <div
                        key={person.id}
                        className="flex flex-col items-center text-center p-2 rounded-2xl bg-[#FAF7F2] border border-[#DECDBA]/60"
                      >
                        <img
                          src={person.avatarUrl}
                          alt={person.name}
                          className="w-11 h-11 rounded-full object-cover border border-white shadow-2xs mb-1.5"
                        />
                        <p className="font-bold text-xs text-[#2D120D] truncate w-full">
                          {person.name}
                        </p>
                        <p className="text-[10px] text-[#6E5952] truncate w-full">
                          @{person.username}
                        </p>
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
                {suggestedCreators.map((creator) => {
                  const isRequested = requestedUsers[creator.id];
                  return (
                    <div key={creator.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={creator.avatarUrl}
                          alt={creator.name}
                          className="w-10 h-10 rounded-full object-cover border border-[#DECDBA] shrink-0"
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
                <div className="flex items-start gap-3 p-2.5 rounded-2xl hover:bg-[#FAF7F2] transition">
                  <div className="w-9 h-9 rounded-xl bg-[#F7DDD4] text-[#9E3922] flex items-center justify-center shrink-0 mt-0.5">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-[#2D120D] leading-snug">
                      New: Spring Boot Showcase this weekend!
                    </h4>
                    <p className="text-[11px] text-[#6E5952] mt-0.5">DevZGo Events · 2d ago</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-2xl hover:bg-[#FAF7F2] transition">
                  <div className="w-9 h-9 rounded-xl bg-[#FFF5C0] text-[#8C6D1F] flex items-center justify-center shrink-0 mt-0.5">
                    <StickyNote className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-[#2D120D] leading-snug">
                      Looking for collaborators on an open-source tool
                    </h4>
                    <p className="text-[11px] text-[#6E5952] mt-0.5">Community · 3d ago</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
