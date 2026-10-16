import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles,
  ExternalLink,
  UserPlus,
  Compass,
  Check,
  Layers,
} from "lucide-react";
import type { ConnectionUserSummary, FeedActivity } from "../../types/network";

interface ConstellationNode {
  id: string;
  type: "user" | "project";
  name: string;
  username?: string;
  role: string;
  avatarUrl?: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  size: number;
  tags: string[];
  connections: string[]; // array of target node ids
  coordsLabel: string;
  accent: "green" | "red";
}

interface ConstellationGraphProps {
  creators: ConnectionUserSummary[];
  activities?: FeedActivity[];
  onConnect?: (userId: string) => void;
  requestedUsers?: Record<string, boolean>;
}

export function ConstellationGraph({
  creators,
  onConnect,
  requestedUsers = {},
}: ConstellationGraphProps) {
  const navigate = useNavigate();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [filterCluster, setFilterCluster] = useState<string>("all");

  const nodes = useMemo<ConstellationNode[]>(() => {
    const list: ConstellationNode[] = [
      {
        id: "usr-janasi",
        type: "user",
        name: "Janasi Rajput",
        username: "janasi",
        role: "Backend & Network Lead",
        avatarUrl:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces",
        x: 48,
        y: 44,
        size: 58,
        tags: ["FastAPI", "WebSockets", "Redis"],
        connections: ["usr-chan", "usr-khushbu", "proj-hub", "usr-manasi"],
        coordsLabel: "λ: 1042 · φ: 821",
        accent: "green",
      },
      {
        id: "usr-chan",
        type: "user",
        name: "Chan S.",
        username: "chan",
        role: "Security & Auth Architect",
        avatarUrl:
          "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=256&h=256&fit=crop&crop=faces",
        x: 24,
        y: 28,
        size: 50,
        tags: ["OAuth2", "React", "TypeScript"],
        connections: ["usr-janasi", "proj-vault"],
        coordsLabel: "λ: 610 · φ: 340",
        accent: "red",
      },
      {
        id: "usr-khushbu",
        type: "user",
        name: "Khushbu Patel",
        username: "khushbu",
        role: "Talent & UI Specialist",
        avatarUrl:
          "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=256&h=256&fit=crop&crop=faces",
        x: 74,
        y: 30,
        size: 50,
        tags: ["Design", "GraphQL", "Tailwind"],
        connections: ["usr-janasi", "usr-manasi", "proj-talent"],
        coordsLabel: "λ: 1480 · φ: 390",
        accent: "green",
      },
      {
        id: "usr-manasi",
        type: "user",
        name: "Manasi Sharma",
        username: "manasi",
        role: "Analytics & ML Engineer",
        avatarUrl:
          "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=256&h=256&fit=crop&crop=faces",
        x: 68,
        y: 72,
        size: 50,
        tags: ["Python", "Metrics", "ChartJS"],
        connections: ["usr-janasi", "usr-khushbu", "proj-metrics"],
        coordsLabel: "λ: 1390 · φ: 1120",
        accent: "red",
      },
      {
        id: "proj-hub",
        type: "project",
        name: "WebSocket Dispatch Hub",
        role: "Active Collaboration Infrastructure",
        x: 34,
        y: 65,
        size: 42,
        tags: ["Open Source", "Sub-10ms"],
        connections: ["usr-janasi", "usr-chan"],
        coordsLabel: "x: 720 · y: 980",
        accent: "green",
      },
      {
        id: "proj-vault",
        type: "project",
        name: "Token Vault & Auth",
        role: "Security AST Engine",
        x: 15,
        y: 52,
        size: 40,
        tags: ["JWT", "Security"],
        connections: ["usr-chan"],
        coordsLabel: "x: 310 · y: 740",
        accent: "red",
      },
      {
        id: "proj-talent",
        type: "project",
        name: "DevZ Talent Heuristic",
        role: "Skill Verification Graph",
        x: 85,
        y: 56,
        size: 40,
        tags: ["Graph", "Talent Tech"],
        connections: ["usr-khushbu"],
        coordsLabel: "x: 1820 · y: 810",
        accent: "green",
      },
      {
        id: "proj-metrics",
        type: "project",
        name: "Monthly Wrap Visualizer",
        role: "Parallax Pixel Engine",
        x: 52,
        y: 84,
        size: 40,
        tags: ["Canvas", "Pixel Art"],
        connections: ["usr-manasi", "usr-janasi"],
        coordsLabel: "x: 1090 · y: 1410",
        accent: "red",
      },
    ];

    creators.slice(0, 3).forEach((creator, idx) => {
      if (!list.find((n) => n.id === creator.id)) {
        list.push({
          id: creator.id,
          type: "user",
          name: creator.fullName || creator.username,
          username: creator.username,
          role: creator.headline || "Student Builder",
          avatarUrl: creator.avatarUrl || undefined,
          x: 20 + idx * 30,
          y: 85 - idx * 10,
          size: 46,
          tags: ["New Star", "Peer"],
          connections: ["usr-janasi"],
          coordsLabel: `λ: ${500 + idx * 300} · φ: ${700 + idx * 150}`,
          accent: idx % 2 === 0 ? "green" : "red",
        });
      }
    });

    return list;
  }, [creators]);

  const filteredNodes = useMemo(() => {
    if (filterCluster === "users") return nodes.filter((n) => n.type === "user");
    if (filterCluster === "projects") return nodes.filter((n) => n.type === "project");
    return nodes;
  }, [nodes, filterCluster]);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  return (
    <div className="relative w-full rounded-3xl bg-[#FAF7EE] border-3 border-[#166534]/30 shadow-soft overflow-hidden p-6 sm:p-7 mb-10 transition">
      {/* Top Bar with BIG Doodle title & rich filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b-2 border-[#166534]/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-doodle text-3xl font-extrabold text-[#14532D] flex items-center gap-2">
              <Compass className="w-6 h-6 text-crimson-600 animate-spin" style={{ animationDuration: "14s" }} />
              celestial graph ✦ live nodes
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold font-doodle bg-crimson-600 text-white shadow-xs">
              rich orbit
            </span>
          </div>
          <p className="font-hand text-xl text-crimson-800 font-bold mt-1">
            “luminous filaments connecting red & green sparks across the tree branches”
          </p>
        </div>

        {/* Rich red and green cluster filter buttons */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border-2 border-[#166534]/40 shadow-2xs">
          {[
            { id: "all", label: "🌿 All Constellation" },
            { id: "users", label: "👩‍💻 Creators" },
            { id: "projects", label: "🍎 Sparks & Projects" },
          ].map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setFilterCluster(c.id)}
              className={`px-3.5 py-1.5 rounded-xl font-doodle text-sm font-bold transition ${
                filterCluster === c.id
                  ? "bg-[#15803D] text-white shadow-xs"
                  : "text-gray-700 hover:text-black hover:bg-cream-100"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="relative w-full h-[520px] sm:h-[580px] rounded-2xl bg-gradient-to-b from-[#FDFBF7] via-[#F8F5EB] to-[#ECE7D6] border-2 border-[#166534]/30 overflow-hidden cursor-crosshair select-none">
        {/* Subtle starlight background */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(#15803d 1px, transparent 1px), radial-gradient(#dc2626 1px, transparent 1px)",
            backgroundSize: "36px 36px",
            backgroundPosition: "0 0, 18px 18px",
          }}
        />

        {/* Constellation SVG Connecting Filaments in Rich Red and Green */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="threadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#16a34a" stopOpacity="0.65" />
              <stop offset="50%" stopColor="#ea580c" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#dc2626" stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id="threadActive" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#15803d" stopOpacity="1" />
              <stop offset="100%" stopColor="#b91c1c" stopOpacity="1" />
            </linearGradient>
          </defs>

          {nodes.map((node) => {
            return (node.connections || []).map((targetId) => {
              const target = nodes.find((n) => n.id === targetId);
              if (!target) return null;

              const isHighlighted =
                hoveredNodeId === node.id ||
                hoveredNodeId === target.id ||
                selectedNodeId === node.id ||
                selectedNodeId === target.id;

              const midX = (node.x + target.x) / 2 + (node.y - target.y) * 0.14;
              const midY = (node.y + target.y) / 2 + (target.x - node.x) * 0.14;

              return (
                <g key={`${node.id}-${target.id}`}>
                  <path
                    d={`M ${node.x}% ${node.y}% Q ${midX}% ${midY}%, ${target.x}% ${target.y}%`}
                    fill="none"
                    stroke={isHighlighted ? "url(#threadActive)" : "url(#threadGrad)"}
                    strokeWidth={isHighlighted ? 3 : 1.6}
                    strokeDasharray={isHighlighted ? "none" : "4, 4"}
                    className="transition-all duration-300"
                  />
                  {isHighlighted && (
                    <circle r="4" fill="#dc2626" className="animate-ping">
                      <animateMotion
                        path={`M ${node.x}% ${node.y}% Q ${midX}% ${midY}%, ${target.x}% ${target.y}%`}
                        dur="2.5s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                </g>
              );
            });
          })}
        </svg>

        {/* Node Elements (Clickable) */}
        {filteredNodes.map((node) => {
          const isSelected = selectedNodeId === node.id;
          const isHovered = hoveredNodeId === node.id;
          const isGreen = node.accent === "green";

          return (
            <div
              key={node.id}
              onClick={() => setSelectedNodeId(node.id === selectedNodeId ? null : node.id)}
              onMouseEnter={() => setHoveredNodeId(node.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                transform: "translate(-50%, -50%)",
              }}
              className={`absolute cursor-pointer transition-transform duration-300 ${
                isHovered || isSelected ? "scale-115 z-20" : "z-10 hover:scale-105"
              }`}
            >
              {/* Hand-Drawn Wobbly Frame on Node */}
              <div
                className={`relative rounded-2xl p-1 bg-white border-3 shadow-soft-lg transition ${
                  isSelected
                    ? isGreen
                      ? "border-forest-600 ring-4 ring-forest-300"
                      : "border-crimson-600 ring-4 ring-crimson-300"
                    : isGreen
                    ? "border-forest-600"
                    : "border-crimson-600"
                }`}
                style={{ width: `${node.size}px`, height: `${node.size}px` }}
              >
                {node.avatarUrl ? (
                  <img
                    src={node.avatarUrl}
                    alt={node.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div
                    className={`w-full h-full rounded-xl flex items-center justify-center font-bold text-xs ${
                      node.type === "project"
                        ? "bg-gradient-to-tr from-amber-500 to-crimson-600 text-white"
                        : "bg-gradient-to-tr from-forest-600 to-emerald-700 text-white"
                    }`}
                  >
                    {node.type === "project" ? (
                      <Layers className="w-4 h-4" />
                    ) : (
                      node.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                )}

                {/* Central Star Badge */}
                {node.id === "usr-janasi" && (
                  <div className="absolute -top-2 -right-2 p-1 rounded-full bg-crimson-600 text-white shadow-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              {/* Coordinates Pill */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 whitespace-nowrap pointer-events-none">
                <span className="font-mono text-[10px] text-gray-700 bg-white/95 border-2 border-forest-600/40 px-1.5 py-0.5 rounded-md shadow-2xs font-bold">
                  {node.coordsLabel}
                </span>
                <p className="font-doodle text-sm font-bold text-[#14532D] text-center drop-shadow-xs">
                  {node.name.split(" ")[0]}
                </p>
              </div>
            </div>
          );
        })}

        {/* Selected Node Floating Polaroid Card Inspector */}
        {selectedNode && (
          <div className="absolute bottom-5 left-4 right-4 sm:left-auto sm:right-6 sm:w-88 bg-white rounded-3xl p-5 border-3 border-[#166534] shadow-soft-xl z-30 animate-in fade-in slide-in-from-bottom-3">
            {/* Rich Red Washi Tape Topper */}
            <div className="washi-tape-red absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-4.5 rounded-xs rotate-[-1deg] flex items-center justify-center text-[10px] text-white font-bold tracking-widest">
              SNAPSHOT
            </div>

            <div className="flex items-start justify-between gap-3 pt-2 mb-3">
              <div className="flex items-center gap-3">
                {selectedNode.avatarUrl ? (
                  <img
                    src={selectedNode.avatarUrl}
                    alt={selectedNode.name}
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-forest-600"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-forest-600 to-crimson-600 text-white font-bold flex items-center justify-center text-base shadow-xs">
                    {selectedNode.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="font-doodle text-xl font-bold text-gray-900 leading-tight">
                    {selectedNode.name}
                  </h4>
                  <p className="text-xs text-gray-600 mt-0.5">{selectedNode.role}</p>
                  <span className="font-mono text-[10px] text-forest-700 font-bold">
                    {selectedNode.coordsLabel}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedNodeId(null)}
                className="w-7 h-7 rounded-full bg-cream-100 hover:bg-cream-200 text-gray-700 flex items-center justify-center text-sm font-bold border border-gray-300"
              >
                ×
              </button>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {selectedNode.tags.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-0.5 rounded-full text-xs font-bold font-doodle bg-forest-100 text-forest-900 border border-forest-400"
                >
                  {t}
                </span>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t-2 border-gray-100">
              {selectedNode.type === "user" ? (
                <>
                  <Link
                    to={`/profile/${selectedNode.username || selectedNode.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-doodle text-sm font-bold shadow-xs transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Profile
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      if (onConnect) onConnect(selectedNode.id);
                    }}
                    disabled={Boolean(requestedUsers[selectedNode.id])}
                    className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl border-2 border-crimson-600 text-crimson-700 hover:bg-crimson-50 font-doodle text-sm font-bold transition disabled:opacity-60"
                  >
                    {requestedUsers[selectedNode.id] ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        Sent 💌
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Connect
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate(`/projects`)}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-crimson-600 hover:bg-crimson-700 text-white font-doodle text-sm font-bold shadow-xs transition"
                >
                  <Sparkles className="w-4 h-4" />
                  Explore Project
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
