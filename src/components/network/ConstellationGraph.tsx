import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
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
  connections: string[];
  coordsLabel: string;
  accent: "green" | "red";
}

const isSample = (node: ConstellationNode) => node.id.startsWith("usr-");

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

  // Zoomed-out, balanced celestial layout centered around (50, 50)
  // Perfectly in place with ample margin so nothing is crowded or cut off!
  const nodes = useMemo<ConstellationNode[]>(() => {
    const list: ConstellationNode[] = [
      // Central Core Node (Current user or central hub)
      {
        id: "usr-janasi",
        type: "user",
        name: "Janasi Rajput",
        username: "janasi",
        role: "Backend & Systems",
        avatarUrl:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces",
        x: 50,
        y: 48,
        size: 46,
        tags: ["FastAPI", "WebSockets"],
        connections: ["usr-chan", "usr-khushbu", "proj-hub", "usr-manasi", "proj-metrics"],
        coordsLabel: "λ: 1042 · φ: 821",
        accent: "green",
      },
      // Inner / Mid Ring (Zoomed-out coordinates with ample padding)
      {
        id: "usr-chan",
        type: "user",
        name: "Chan S.",
        username: "chan",
        role: "Auth Architect",
        avatarUrl:
          "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=256&h=256&fit=crop&crop=faces",
        x: 32,
        y: 30,
        size: 38,
        tags: ["OAuth2", "React"],
        connections: ["usr-janasi", "proj-vault"],
        coordsLabel: "λ: 610 · φ: 340",
        accent: "red",
      },
      {
        id: "usr-khushbu",
        type: "user",
        name: "Khushbu Patel",
        username: "khushbu",
        role: "Talent & UI",
        avatarUrl:
          "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=256&h=256&fit=crop&crop=faces",
        x: 68,
        y: 30,
        size: 38,
        tags: ["GraphQL", "Tailwind"],
        connections: ["usr-janasi", "proj-talent"],
        coordsLabel: "λ: 1480 · φ: 390",
        accent: "green",
      },
      {
        id: "usr-manasi",
        type: "user",
        name: "Manasi Sharma",
        username: "manasi",
        role: "Analytics Engineer",
        avatarUrl:
          "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=256&h=256&fit=crop&crop=faces",
        x: 66,
        y: 68,
        size: 38,
        tags: ["Metrics", "ChartJS"],
        connections: ["usr-janasi", "proj-metrics"],
        coordsLabel: "λ: 1390 · φ: 1120",
        accent: "red",
      },
      {
        id: "proj-hub",
        type: "project",
        name: "WebSocket Hub",
        role: "Collab Infrastructure",
        x: 34,
        y: 66,
        size: 34,
        tags: ["Realtime", "Sub-10ms"],
        connections: ["usr-janasi", "usr-chan"],
        coordsLabel: "x: 720 · y: 980",
        accent: "green",
      },
      // Outer Satellites (Zoomed out gracefully)
      {
        id: "proj-vault",
        type: "project",
        name: "Token Vault",
        role: "Security AST",
        x: 18,
        y: 45,
        size: 32,
        tags: ["Security"],
        connections: ["usr-chan"],
        coordsLabel: "x: 310 · y: 740",
        accent: "red",
      },
      {
        id: "proj-talent",
        type: "project",
        name: "Talent Heuristic",
        role: "Skill Graph",
        x: 82,
        y: 46,
        size: 32,
        tags: ["Graph"],
        connections: ["usr-khushbu"],
        coordsLabel: "x: 1820 · y: 810",
        accent: "green",
      },
      {
        id: "proj-metrics",
        type: "project",
        name: "Wrap Visualizer",
        role: "Pixel Engine",
        x: 50,
        y: 78,
        size: 32,
        tags: ["Canvas"],
        connections: ["usr-manasi", "usr-janasi"],
        coordsLabel: "x: 1090 · y: 1410",
        accent: "red",
      },
    ];

    // Additional creators added outward
    creators.slice(0, 2).forEach((creator, idx) => {
      if (!list.find((n) => n.id === creator.id)) {
        list.push({
          id: creator.id,
          type: "user",
          name: creator.fullName || creator.username,
          username: creator.username,
          role: creator.headline || "Student Builder",
          avatarUrl: creator.avatarUrl || undefined,
          x: idx === 0 ? 20 : 80,
          y: idx === 0 ? 22 : 22,
          size: 36,
          tags: ["Peer"],
          connections: ["usr-janasi"],
          coordsLabel: `λ: ${500 + idx * 300} · φ: 400`,
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
    <div className="relative w-full rounded-2xl bg-[#FAF7EE] border-2 border-[#166534]/30 shadow-sm overflow-hidden p-5 sm:p-6 mb-8 transition">
      {/* Top Bar with Cursive Heading & Clean Straight Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#166534]/20">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-cursive text-2xl sm:text-3xl font-bold text-[#14532D] flex items-center gap-1.5">
              <Compass className="w-5 h-5 text-crimson-600 animate-spin" style={{ animationDuration: "16s" }} />
              celestial network graph
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold font-sans bg-[#DCFCE7] text-[#14532D] border border-[#16A34A]">
              zoomed view
            </span>
          </div>
          <p className="font-sans text-xs text-stone-600 mt-0.5">
            Luminous filaments connecting developers and active project nodes
          </p>
        </div>

        {/* Clean, straight-font cluster filter buttons */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-stone-200 shadow-xs">
          {[
            { id: "all", label: "All Constellation" },
            { id: "users", label: "Creators" },
            { id: "projects", label: "Projects" },
          ].map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setFilterCluster(c.id)}
              className={`px-3 py-1 rounded-lg font-sans text-xs font-semibold transition ${
                filterCluster === c.id
                  ? "bg-[#15803D] text-white shadow-xs"
                  : "text-stone-600 hover:text-black hover:bg-stone-50"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Stage - Balanced, Zoomed-out, Neat */}
      <div className="relative w-full h-[440px] sm:h-[480px] rounded-xl bg-gradient-to-b from-[#FDFBF7] via-[#F8F5EB] to-[#EDE8D8] border border-stone-200 overflow-hidden cursor-crosshair select-none">
        {/* Subtle coordinate grid lines */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "radial-gradient(#15803d 1px, transparent 1px), radial-gradient(#dc2626 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            backgroundPosition: "0 0, 14px 14px",
          }}
        />

        {/* Concentric subtle celestial rings showing the zoomed-out layout */}
        <div className="absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-forest-600/15 pointer-events-none" />
        <div className="absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2 w-88 h-88 rounded-full border border-forest-600/10 pointer-events-none" />

        {/* Constellation SVG Connecting Filaments (Radiating from central nodes) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient id="threadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#16a34a" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#dc2626" stopOpacity="0.65" />
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

              const midX = (node.x + target.x) / 2 + (node.y - target.y) * 0.12;
              const midY = (node.y + target.y) / 2 + (target.x - node.x) * 0.12;

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
                  {isHighlighted && (
                    <circle r="3.5" fill="#dc2626" className="animate-ping">
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

        {/* Node Elements (Compact, Zoomed-Out, Perfectly positioned) */}
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
              className={`absolute cursor-pointer transition-transform duration-200 ${
                isHovered || isSelected ? "scale-115 z-20" : "z-10 hover:scale-105"
              }`}
            >
              <div
                className={`relative rounded-xl p-0.5 bg-white border-2 shadow-xs transition ${
                  isSelected
                    ? isGreen
                      ? "border-[#15803D] ring-3 ring-green-300"
                      : "border-[#DC2626] ring-3 ring-red-300"
                    : isGreen
                    ? "border-[#16A34A]"
                    : "border-[#DC2626]"
                }`}
                style={{ width: `${node.size}px`, height: `${node.size}px` }}
              >
                {node.avatarUrl ? (
                  <img
                    src={node.avatarUrl}
                    alt={node.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div
                    className={`w-full h-full rounded-lg flex items-center justify-center font-sans font-bold text-xs ${
                      node.type === "project"
                        ? "bg-[#FEF3C7] text-[#78350F]"
                        : "bg-[#DCFCE7] text-[#14532D]"
                    }`}
                  >
                    {node.type === "project" ? (
                      <Layers className="w-3.5 h-3.5" />
                    ) : (
                      node.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                )}

              </div>

              {/* Coordinates Pill & Label (Clean Straight Font, Compact) */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap pointer-events-none">
                <span className="font-mono text-[9px] text-stone-700 bg-white/95 border border-stone-200 px-1 py-0.5 rounded shadow-2xs font-semibold">
                  {node.coordsLabel}
                </span>
                <p className="font-sans text-[11px] font-bold text-[#14532D] text-center mt-0.5 drop-shadow-xs">
                  {node.name.split(" ")[0]}
                </p>
              </div>
            </div>
          );
        })}

        {/* Selected Node Floating Card Inspector */}
        {selectedNode && (
          <div className="absolute bottom-4 right-4 sm:w-80 bg-white rounded-2xl p-4 border-2 border-[#166534] shadow-md z-30 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-start justify-between gap-2.5 mb-2.5">
              <div className="flex items-center gap-2.5">
                {selectedNode.avatarUrl ? (
                  <img
                    src={selectedNode.avatarUrl}
                    alt={selectedNode.name}
                    className="w-11 h-11 rounded-xl object-cover ring-2 ring-forest-600"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-[#DCFCE7] text-[#14532D] font-sans font-bold flex items-center justify-center text-sm shadow-xs border border-forest-600">
                    {selectedNode.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="font-cursive text-xl font-bold text-stone-900 leading-tight">
                    {selectedNode.name}
                  </h4>
                  <p className="text-xs text-stone-600 font-sans">{selectedNode.role}</p>
                  <span className="font-mono text-[10px] text-[#15803D] font-bold">
                    {selectedNode.coordsLabel}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedNodeId(null)}
                className="w-6 h-6 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center text-xs font-bold"
              >
                ×
              </button>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {selectedNode.tags.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded-md text-[10px] font-semibold font-sans bg-[#DCFCE7] text-[#14532D] border border-[#16A34A]"
                >
                  {t}
                </span>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
              {selectedNode.type === "user" ? (
                <>
                  <Link
                    to={isSample(selectedNode) ? "/explore/developers" : `/profile/${selectedNode.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#DCFCE7] hover:bg-[#BBF7D0] text-[#14532D] border border-[#15803D] font-sans text-xs font-semibold shadow-xs transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View Profile
                  </Link>

                  {!isSample(selectedNode) && <button
                    type="button"
                    onClick={() => {
                      if (onConnect) onConnect(selectedNode.id);
                    }}
                    disabled={Boolean(requestedUsers[selectedNode.id])}
                    className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#FEE2E2] hover:bg-[#FECACA] text-[#991B1B] border border-[#DC2626] font-sans text-xs font-semibold transition disabled:opacity-60"
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
                  </button>}
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate("/explore")}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#78350F] border border-[#D97706] font-sans text-xs font-semibold shadow-xs transition"
                >
                  <Compass className="w-3.5 h-3.5" />
                  Explore projects
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
