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

  // Construct constellation nodes from real and demo data
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
        size: 54,
        tags: ["FastAPI", "WebSockets", "Redis"],
        connections: ["usr-chan", "usr-khushbu", "proj-hub", "usr-manasi"],
        coordsLabel: "λ: 1042 · φ: 821",
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
        size: 46,
        tags: ["OAuth2", "React", "TypeScript"],
        connections: ["usr-janasi", "proj-vault"],
        coordsLabel: "λ: 610 · φ: 340",
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
        size: 46,
        tags: ["Design", "GraphQL", "Tailwind"],
        connections: ["usr-janasi", "usr-manasi", "proj-talent"],
        coordsLabel: "λ: 1480 · φ: 390",
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
        size: 46,
        tags: ["Python", "Metrics", "ChartJS"],
        connections: ["usr-janasi", "usr-khushbu", "proj-metrics"],
        coordsLabel: "λ: 1390 · φ: 1120",
      },
      {
        id: "proj-hub",
        type: "project",
        name: "WebSocket Dispatch Hub",
        role: "Active Collaboration Infrastructure",
        x: 34,
        y: 65,
        size: 38,
        tags: ["Open Source", "Sub-10ms"],
        connections: ["usr-janasi", "usr-chan"],
        coordsLabel: "x: 720 · y: 980",
      },
      {
        id: "proj-vault",
        type: "project",
        name: "Token Vault & Auth",
        role: "Security AST Engine",
        x: 15,
        y: 52,
        size: 36,
        tags: ["JWT", "Security"],
        connections: ["usr-chan"],
        coordsLabel: "x: 310 · y: 740",
      },
      {
        id: "proj-talent",
        type: "project",
        name: "DevZ Talent Heuristic",
        role: "Skill Verification Graph",
        x: 85,
        y: 56,
        size: 36,
        tags: ["Graph", "Talent Tech"],
        connections: ["usr-khushbu"],
        coordsLabel: "x: 1820 · y: 810",
      },
      {
        id: "proj-metrics",
        type: "project",
        name: "Monthly Wrap Visualizer",
        role: "Parallax Pixel Engine",
        x: 52,
        y: 84,
        size: 36,
        tags: ["Canvas", "Pixel Art"],
        connections: ["usr-manasi", "usr-janasi"],
        coordsLabel: "x: 1090 · y: 1410",
      },
    ];

    // Incorporate any extra suggested developers dynamically if available
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
          size: 42,
          tags: ["New Star", "Peer"],
          connections: ["usr-janasi"],
          coordsLabel: `λ: ${500 + idx * 300} · φ: ${700 + idx * 150}`,
        });
      }
    });

    return list;
  }, [creators]);

  // Filter nodes according to selected cluster
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
    <div className="relative w-full rounded-3xl bg-cream-50/90 border border-amber-200/80 shadow-soft overflow-hidden p-6 mb-8 transition">
      {/* Top Bar: Whimsical Title & Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-amber-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-hand text-2xl font-bold text-gray-900 flex items-center gap-1.5">
              <Compass className="w-5 h-5 text-purple-600 animate-spin" style={{ animationDuration: "16s" }} />
              Interactive Constellation Graph
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
              live nodes
            </span>
          </div>
          <p className="font-hand text-base text-gray-500 italic mt-0.5">
            Luminous filaments connecting developers, collaborative commits, and active sparks ✨
          </p>
        </div>

        {/* Clean cluster filter buttons */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-amber-200/80 shadow-2xs">
          {[
            { id: "all", label: "All Constellation" },
            { id: "users", label: "Creators" },
            { id: "projects", label: "Sparks & Projects" },
          ].map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setFilterCluster(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                filterCluster === c.id
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900 hover:bg-cream-100"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="relative w-full h-[520px] sm:h-[580px] rounded-2xl bg-gradient-to-b from-[#FFFDF7] via-[#FFF9ED] to-[#FFF3DB] border border-amber-100 overflow-hidden cursor-crosshair select-none">
        {/* Subtle grid and constellation starlight background */}
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(#d97706 0.8px, transparent 0.8px), radial-gradient(#8b5cf6 0.8px, transparent 0.8px)",
            backgroundSize: "32px 32px",
            backgroundPosition: "0 0, 16px 16px",
          }}
        />

        {/* Constellation SVG Connecting Filaments (Bezier curves) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="threadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="threadActive" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.95" />
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

              // Curved bezier arc connecting nodes
              const midX = (node.x + target.x) / 2 + (node.y - target.y) * 0.15;
              const midY = (node.y + target.y) / 2 + (target.x - node.x) * 0.15;

              return (
                <g key={`${node.id}-${target.id}`}>
                  <path
                    d={`M ${node.x}% ${node.y}% Q ${midX}% ${midY}%, ${target.x}% ${target.y}%`}
                    fill="none"
                    stroke={isHighlighted ? "url(#threadActive)" : "url(#threadGrad)"}
                    strokeWidth={isHighlighted ? 2.5 : 1.2}
                    strokeDasharray={isHighlighted ? "none" : "3, 3"}
                    className="transition-all duration-300"
                  />
                  {/* Subtle pulsing energy dot on the filament */}
                  {isHighlighted && (
                    <circle r="3" fill="#8b5cf6" className="animate-ping">
                      <animateMotion
                        path={`M ${node.x}% ${node.y}% Q ${midX}% ${midY}%, ${target.x}% ${target.y}%`}
                        dur="3s"
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
              {/* Node Avatar or Project Badge */}
              <div
                className={`relative rounded-2xl p-1 bg-white border-2 shadow-soft transition ${
                  isSelected
                    ? "border-purple-600 ring-4 ring-purple-300/40"
                    : isHovered
                    ? "border-amber-400 ring-2 ring-amber-200"
                    : node.type === "project"
                    ? "border-amber-300"
                    : "border-purple-200"
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
                        ? "bg-gradient-to-tr from-amber-400 to-orange-400 text-white"
                        : "bg-gradient-to-tr from-purple-500 to-indigo-500 text-white"
                    }`}
                  >
                    {node.type === "project" ? (
                      <Layers className="w-4 h-4" />
                    ) : (
                      node.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                )}

                {/* Orbiting star sticker on central node */}
                {node.id === "usr-janasi" && (
                  <div className="absolute -top-2 -right-2 p-0.5 rounded-full bg-amber-400 text-white shadow-xs">
                    <Sparkles className="w-3 h-3" />
                  </div>
                )}
              </div>

              {/* Coordinates Pill (Directly inspired by Reference Images 3 & 4) */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 whitespace-nowrap pointer-events-none">
                <span className="font-mono text-[10px] text-gray-500 bg-white/90 border border-gray-200/80 px-1.5 py-0.5 rounded-md shadow-2xs font-semibold">
                  {node.coordsLabel}
                </span>
                <p className="font-hand text-xs font-bold text-gray-800 text-center drop-shadow-xs">
                  {node.name.split(" ")[0]}
                </p>
              </div>
            </div>
          );
        })}

        {/* Selected Node Floating Polaroid Card Inspector */}
        {selectedNode && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 bg-white rounded-3xl p-5 border-2 border-purple-200 shadow-soft-xl z-30 animate-in fade-in slide-in-from-bottom-3">
            {/* Washi tape topper */}
            <div className="washi-tape-lavender absolute -top-2.5 left-1/2 -translate-x-1/2 w-20 h-4 rounded-xs rotate-[-1deg]" />

            <div className="flex items-start justify-between gap-3 pt-1 mb-3">
              <div className="flex items-center gap-3">
                {selectedNode.avatarUrl ? (
                  <img
                    src={selectedNode.avatarUrl}
                    alt={selectedNode.name}
                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-purple-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-purple-500 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                    {selectedNode.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-gray-900 text-sm leading-tight">
                    {selectedNode.name}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">{selectedNode.role}</p>
                  <span className="font-mono text-[10px] text-purple-600 font-medium">
                    {selectedNode.coordsLabel}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedNodeId(null)}
                className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold"
              >
                ×
              </button>
            </div>

            {/* Tags / Stack */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {selectedNode.tags.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-cream-100 text-amber-800 border border-amber-200"
                >
                  {t}
                </span>
              ))}
            </div>

            {/* Sensible & Cutesy Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              {selectedNode.type === "user" ? (
                <>
                  <Link
                    to={`/profile/${selectedNode.username || selectedNode.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View Profile
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      if (onConnect) onConnect(selectedNode.id);
                    }}
                    disabled={Boolean(requestedUsers[selectedNode.id])}
                    className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-purple-200 text-purple-700 hover:bg-purple-50 text-xs font-semibold transition disabled:opacity-60"
                  >
                    {requestedUsers[selectedNode.id] ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Sent
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        Connect
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate(`/projects`)}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
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
