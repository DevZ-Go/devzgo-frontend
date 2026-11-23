import { useRef, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Compass,
  Search,
  LayoutGrid,
  CodeXml,
  Database,
  Sparkles,
  Smartphone,
  Infinity as InfinityIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Folder,
  Flame,
  BarChart2,
  ArrowRight,
  Check,
  Film,
  Tv,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { useExploreProjects } from "../hooks/useExploreProjects";

/* ─────────────────────────────────────────────────────────────────────────────
 * MOCKUP GRAPHIC RENDERING HELPERS
 * Crisp, stylized SVG representations for each project card preview.
 * ─────────────────────────────────────────────────────────────────────────── */

function ProjectMockupGraphic({ type }: { type: string }) {
  switch (type) {
    // ── CSS Mockups ──
    case "portfolio":
      return (
        <svg viewBox="0 0 160 100" fill="none" className="w-full h-full object-cover">
          <rect width="160" height="100" fill="#1C1427" />
          <rect x="14" y="16" width="132" height="68" rx="8" fill="#241935" stroke="#483267" strokeWidth="1" />
          <circle cx="36" cy="38" r="10" fill="#A78BFA" />
          <rect x="54" y="32" width="56" height="5" rx="2.5" fill="#E9D5FF" />
          <rect x="54" y="41" width="38" height="4" rx="2" fill="#7C3AED" opacity="0.8" />
          <rect x="26" y="58" width="108" height="16" rx="4" fill="#2E1065" stroke="#6D28D9" strokeWidth="0.8" />
          <rect x="34" y="64" width="40" height="4" rx="2" fill="#C4B5FD" />
        </svg>
      );
    case "landing":
      return (
        <svg viewBox="0 0 160 100" fill="none" className="w-full h-full object-cover">
          <defs>
            <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F97316" />
              <stop offset="0.5" stopColor="#A855F7" />
              <stop offset="1" stopColor="#312E81" />
            </linearGradient>
          </defs>
          <rect width="160" height="100" fill="url(#skyGrad)" />
          <circle cx="80" cy="50" r="14" fill="#FDE047" opacity="0.85" />
          <path d="M10 90 L50 48 L90 90 Z" fill="#1E1B4B" opacity="0.9" />
          <path d="M60 90 L110 40 L160 90 Z" fill="#0F172A" />
          <rect x="45" y="16" width="70" height="4" rx="2" fill="#FFFFFF" opacity="0.9" />
          <rect x="60" y="24" width="40" height="3" rx="1.5" fill="#FFFFFF" opacity="0.6" />
        </svg>
      );
    case "cards":
      return (
        <svg viewBox="0 0 160 100" fill="none" className="w-full h-full object-cover">
          <rect width="160" height="100" fill="#0D1B2A" />
          <rect x="20" y="32" width="55" height="52" rx="6" fill="#1B263B" stroke="#415A77" strokeWidth="1" />
          <rect x="50" y="22" width="60" height="56" rx="6" fill="#1E3A8A" stroke="#3B82F6" strokeWidth="1" />
          <rect x="85" y="14" width="55" height="52" rx="6" fill="#1E293B" stroke="#60A5FA" strokeWidth="1" />
          <rect x="60" y="32" width="38" height="5" rx="2.5" fill="#BFDBFE" />
          <rect x="60" y="42" width="24" height="4" rx="2" fill="#93C5FD" opacity="0.7" />
        </svg>
      );
    case "pricing":
      return (
        <svg viewBox="0 0 160 100" fill="none" className="w-full h-full object-cover">
          <rect width="160" height="100" fill="#181326" />
          <rect x="18" y="22" width="34" height="60" rx="4" fill="#241935" stroke="#3E2B5A" strokeWidth="1" />
          <rect x="60" y="15" width="40" height="70" rx="5" fill="#3B1C54" stroke="#A855F7" strokeWidth="1.5" />
          <rect x="108" y="22" width="34" height="60" rx="4" fill="#241935" stroke="#3E2B5A" strokeWidth="1" />
          <circle cx="80" cy="30" r="5" fill="#F472B6" />
          <rect x="68" y="42" width="24" height="4" rx="2" fill="#FFFFFF" />
          <rect x="66" y="52" width="28" height="3" rx="1.5" fill="#FBCFE8" opacity="0.6" />
          <rect x="67" y="68" width="26" height="8" rx="4" fill="#A855F7" />
        </svg>
      );
    case "buttons":
      return (
        <svg viewBox="0 0 160 100" fill="none" className="w-full h-full object-cover">
          <rect width="160" height="100" fill="#090A0F" />
          <rect x="32" y="34" width="96" height="32" rx="16" fill="#1E1B4B" stroke="#818CF8" strokeWidth="2" />
          <rect x="44" y="46" width="72" height="8" rx="4" fill="url(#btnGrad)" />
          <defs>
            <linearGradient id="btnGrad" x1="0" y1="0" x2="1" y2="0">
              <stop stopColor="#EC4899" />
              <stop offset="0.5" stopColor="#8B5CF6" />
              <stop offset="1" stopColor="#06B6D4" />
            </linearGradient>
          </defs>
          <circle cx="80" cy="50" r="28" fill="#8B5CF6" opacity="0.15" />
        </svg>
      );
    case "grid":
      return (
        <svg viewBox="0 0 160 100" fill="none" className="w-full h-full object-cover">
          <rect width="160" height="100" fill="#0B132B" />
          <rect x="22" y="18" width="54" height="32" rx="4" fill="#1C2541" stroke="#3A506B" strokeWidth="1" />
          <rect x="84" y="18" width="54" height="20" rx="4" fill="#2A3859" stroke="#48E5C2" strokeWidth="1" />
          <rect x="84" y="44" width="54" height="38" rx="4" fill="#1F2A44" stroke="#5BC0BE" strokeWidth="1" />
          <rect x="22" y="56" width="54" height="26" rx="4" fill="#3A506B" stroke="#6FFFE9" strokeWidth="1" />
        </svg>
      );
    case "glass":
      return (
        <svg viewBox="0 0 160 100" fill="none" className="w-full h-full object-cover">
          <rect width="160" height="100" fill="#1A1024" />
          <circle cx="50" cy="40" r="24" fill="#EC4899" opacity="0.75" />
          <circle cx="110" cy="60" r="28" fill="#3B82F6" opacity="0.7" />
          <rect x="35" y="24" width="90" height="52" rx="10" fill="#FFFFFF" fillOpacity="0.12" stroke="#FFFFFF" strokeOpacity="0.4" strokeWidth="1.5" />
          <rect x="48" y="38" width="46" height="5" rx="2.5" fill="#FFFFFF" opacity="0.8" />
          <rect x="48" y="48" width="64" height="4" rx="2" fill="#FFFFFF" opacity="0.5" />
        </svg>
      );
    case "dashboard":
      return (
        <svg viewBox="0 0 160 100" fill="none" className="w-full h-full object-cover">
          <rect width="160" height="100" fill="#111827" />
          <rect x="18" y="16" width="28" height="68" rx="4" fill="#1F2937" />
          <rect x="52" y="16" width="90" height="24" rx="4" fill="#1F2937" />
          <rect x="52" y="46" width="42" height="38" rx="4" fill="#1E293B" stroke="#3B82F6" strokeWidth="1" />
          <rect x="100" y="46" width="42" height="38" rx="4" fill="#1E293B" stroke="#10B981" strokeWidth="1" />
          <line x1="58" y1="74" x2="58" y2="60" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
          <line x1="68" y1="74" x2="68" y2="54" stroke="#60A5FA" strokeWidth="3" strokeLinecap="round" />
          <line x1="78" y1="74" x2="78" y2="66" stroke="#93C5FD" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case "product":
      return (
        <svg viewBox="0 0 160 100" fill="none" className="w-full h-full object-cover">
          <rect width="160" height="100" fill="#2E231C" />
          <rect x="28" y="14" width="104" height="72" rx="8" fill="#E8DEC8" />
          <circle cx="80" cy="44" r="16" fill="#1C1917" />
          <ellipse cx="80" cy="44" rx="9" ry="9" fill="#44403C" />
          <rect x="52" y="68" width="56" height="5" rx="2.5" fill="#78350F" />
        </svg>
      );
    case "login":
      return (
        <svg viewBox="0 0 160 100" fill="none" className="w-full h-full object-cover">
          <rect width="160" height="100" fill="#0F172A" />
          <rect x="36" y="18" width="88" height="64" rx="8" fill="#1E293B" stroke="#38BDF8" strokeWidth="1" />
          <rect x="48" y="30" width="64" height="8" rx="4" fill="#334155" />
          <rect x="48" y="43" width="64" height="8" rx="4" fill="#334155" />
          <rect x="48" y="58" width="64" height="10" rx="5" fill="#0284C7" />
        </svg>
      );

    // ── Python Mockups ──
    case "chatbot":
      return (
        <svg viewBox="0 0 160 100" fill="none" className="w-full h-full object-cover">
          <rect width="160" height="100" fill="#0F172A" />
          <rect x="36" y="24" width="88" height="52" rx="12" fill="#1E3A8A" stroke="#60A5FA" strokeWidth="1.5" />
          <circle cx="62" cy="50" r="4.5" fill="#93C5FD" />
          <circle cx="80" cy="50" r="4.5" fill="#60A5FA" />
          <circle cx="98" cy="50" r="4.5" fill="#3B82F6" />
          <path d="M50 76 L42 86 L62 76 Z" fill="#1E3A8A" stroke="#60A5FA" strokeWidth="1" />
        </svg>
      );
    case "dataviz":
      return (
        <svg viewBox="0 0 160 100" fill="none" className="w-full h-full object-cover">
          <rect width="160" height="100" fill="#13111C" />
          <line x1="30" y1="78" x2="132" y2="78" stroke="#3730A3" strokeWidth="1.5" />
          <rect x="40" y="52" width="10" height="26" rx="2" fill="#6366F1" />
          <rect x="58" y="38" width="10" height="40" rx="2" fill="#818CF8" />
          <rect x="76" y="46" width="10" height="32" rx="2" fill="#A855F7" />
          <rect x="94" y="24" width="10" height="54" rx="2" fill="#C084FC" />
          <rect x="112" y="34" width="10" height="44" rx="2" fill="#E879F9" />
        </svg>
      );
    case "scraper":
      return (
        <svg viewBox="0 0 160 100" fill="none" className="w-full h-full object-cover">
          <rect width="160" height="100" fill="#0B1528" />
          <rect x="22" y="16" width="116" height="68" rx="6" fill="#111E38" stroke="#1E3A8A" strokeWidth="1" />
          <rect x="22" y="16" width="116" height="14" rx="4" fill="#1E293B" />
          <circle cx="32" cy="23" r="2.5" fill="#EF4444" />
          <circle cx="40" cy="23" r="2.5" fill="#F59E0B" />
          <circle cx="48" cy="23" r="2.5" fill="#10B981" />
          <rect x="32" y="38" width="48" height="5" rx="2.5" fill="#10B981" />
          <rect x="32" y="48" width="96" height="4" rx="2" fill="#3B82F6" opacity="0.6" />
          <rect x="32" y="56" width="76" height="4" rx="2" fill="#3B82F6" opacity="0.6" />
          <rect x="32" y="64" width="88" height="4" rx="2" fill="#3B82F6" opacity="0.6" />
        </svg>
      );
    case "expense":
      return (
        <svg viewBox="0 0 160 100" fill="none" className="w-full h-full object-cover">
          <rect width="160" height="100" fill="#062016" />
          <rect x="26" y="20" width="108" height="60" rx="8" fill="#0B3324" stroke="#10B981" strokeWidth="1" />
          <text x="44" y="58" fill="#34D399" fontSize="28" fontWeight="bold" fontFamily="sans-serif">$</text>
          <line x1="72" y1="38" x2="118" y2="38" stroke="#6EE7B7" strokeWidth="3" strokeLinecap="round" />
          <line x1="72" y1="50" x2="108" y2="50" stroke="#34D399" strokeWidth="3" strokeLinecap="round" />
          <line x1="72" y1="62" x2="114" y2="62" stroke="#059669" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case "qr":
      return (
        <svg viewBox="0 0 160 100" fill="none" className="w-full h-full object-cover">
          <rect width="160" height="100" fill="#1F2937" />
          <rect x="46" y="16" width="68" height="68" rx="8" fill="#FFFFFF" />
          {/* QR Corner 1 */}
          <rect x="54" y="24" width="16" height="16" fill="#111827" />
          <rect x="58" y="28" width="8" height="8" fill="#FFFFFF" />
          <rect x="60" y="30" width="4" height="4" fill="#111827" />
          {/* QR Corner 2 */}
          <rect x="90" y="24" width="16" height="16" fill="#111827" />
          <rect x="94" y="28" width="8" height="8" fill="#FFFFFF" />
          <rect x="96" y="30" width="4" height="4" fill="#111827" />
          {/* QR Corner 3 */}
          <rect x="54" y="60" width="16" height="16" fill="#111827" />
          <rect x="58" y="64" width="8" height="8" fill="#FFFFFF" />
          <rect x="60" y="66" width="4" height="4" fill="#111827" />
          {/* Dots */}
          <rect x="76" y="30" width="5" height="5" fill="#111827" />
          <rect x="84" y="44" width="6" height="6" fill="#111827" />
          <rect x="76" y="56" width="6" height="6" fill="#111827" />
          <rect x="90" y="60" width="6" height="6" fill="#111827" />
        </svg>
      );
    case "organizer":
      return (
        <svg viewBox="0 0 160 100" fill="none" className="w-full h-full object-cover">
          <rect width="160" height="100" fill="#18181B" />
          <path d="M42 36 L66 36 L74 44 L118 44 C122 44, 126 48, 126 52 L126 76 C126 80, 122 84, 118 84 L42 84 C38 84, 34 80, 34 76 L34 44 C34 40, 38 36, 42 36 Z" fill="#EAB308" />
          <rect x="50" y="26" width="48" height="30" rx="3" fill="#FAF5FF" opacity="0.9" />
          <path d="M34 50 L126 50 L122 76 C122 80, 118 84, 114 84 L46 84 C42 84, 38 80, 38 76 Z" fill="#FACC15" />
        </svg>
      );
    case "weather":
      return (
        <svg viewBox="0 0 160 100" fill="none" className="w-full h-full object-cover">
          <rect width="160" height="100" fill="#082F49" />
          <circle cx="106" cy="38" r="16" fill="#FBBF24" opacity="0.9" />
          <g fill="#38BDF8">
            <circle cx="64" cy="52" r="16" />
            <circle cx="86" cy="46" r="20" />
            <circle cx="106" cy="54" r="14" />
            <rect x="64" y="50" width="44" height="18" />
          </g>
          <line x1="68" y1="76" x2="62" y2="86" stroke="#BAE6FD" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="84" y1="76" x2="78" y2="86" stroke="#BAE6FD" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="100" y1="76" x2="94" y2="86" stroke="#BAE6FD" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case "todo":
      return (
        <svg viewBox="0 0 160 100" fill="none" className="w-full h-full object-cover">
          <rect width="160" height="100" fill="#261219" />
          <rect x="30" y="16" width="100" height="68" rx="8" fill="#3D1A27" stroke="#9D174D" strokeWidth="1" />
          <rect x="42" y="28" width="12" height="12" rx="3" fill="#F43F5E" />
          <line x1="62" y1="34" x2="114" y2="34" stroke="#FECDD3" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="42" y="46" width="12" height="12" rx="3" fill="#FB7185" />
          <line x1="62" y1="52" x2="104" y2="52" stroke="#FECDD3" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="42" y="64" width="12" height="12" rx="3" fill="#FDA4AF" />
          <line x1="62" y1="70" x2="94" y2="70" stroke="#FECDD3" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case "pdf":
      return (
        <svg viewBox="0 0 160 100" fill="none" className="w-full h-full object-cover">
          <rect width="160" height="100" fill="#1C1917" />
          <rect x="40" y="20" width="46" height="60" rx="4" fill="#B91C1C" stroke="#EF4444" strokeWidth="1" />
          <rect x="74" y="28" width="46" height="60" rx="4" fill="#DC2626" stroke="#F87171" strokeWidth="1" />
          <rect x="84" y="40" width="26" height="4" rx="2" fill="#FFFFFF" />
          <rect x="84" y="48" width="20" height="4" rx="2" fill="#FEE2E2" />
          <rect x="84" y="56" width="24" height="4" rx="2" fill="#FEE2E2" />
        </svg>
      );
    case "quiz":
      return (
        <svg viewBox="0 0 160 100" fill="none" className="w-full h-full object-cover">
          <rect width="160" height="100" fill="#111827" />
          <rect x="28" y="16" width="104" height="28" rx="6" fill="#1F2937" stroke="#3B82F6" strokeWidth="1" />
          <rect x="38" y="28" width="60" height="5" rx="2.5" fill="#93C5FD" />
          <rect x="28" y="52" width="48" height="16" rx="4" fill="#1E3A8A" />
          <rect x="84" y="52" width="48" height="16" rx="4" fill="#065F46" />
          <rect x="28" y="72" width="48" height="16" rx="4" fill="#1E3A8A" />
          <rect x="84" y="72" width="48" height="16" rx="4" fill="#1E3A8A" />
        </svg>
      );

    // ── JavaScript Mockups ──
    case "playground":
      return (
        <svg viewBox="0 0 160 100" fill="none" className="w-full h-full object-cover">
          <rect width="160" height="100" fill="#1E1E1E" />
          <rect x="18" y="16" width="124" height="68" rx="6" fill="#252526" stroke="#3E3E42" strokeWidth="1" />
          <circle cx="28" cy="24" r="2.5" fill="#FF5F56" />
          <circle cx="36" cy="24" r="2.5" fill="#FFBD2E" />
          <circle cx="44" cy="24" r="2.5" fill="#27C93F" />
          <rect x="28" y="38" width="28" height="4" rx="2" fill="#569CD6" />
          <rect x="60" y="38" width="34" height="4" rx="2" fill="#4EC9B0" />
          <rect x="36" y="48" width="56" height="4" rx="2" fill="#CE9178" />
          <rect x="36" y="58" width="42" height="4" rx="2" fill="#DCDCAA" />
          <rect x="28" y="68" width="14" height="4" rx="2" fill="#D4D4D4" />
        </svg>
      );
    case "canvas3d":
      return (
        <svg viewBox="0 0 160 100" fill="none" className="w-full h-full object-cover">
          <rect width="160" height="100" fill="#0A0915" />
          {/* Isometric wireframe cube */}
          <path d="M80 20 L118 42 L80 64 L42 42 Z" fill="#4338CA" stroke="#818CF8" strokeWidth="1.5" />
          <path d="M42 42 L80 64 L80 88 L42 66 Z" fill="#312E81" stroke="#6366F1" strokeWidth="1.5" />
          <path d="M118 42 L80 64 L80 88 L118 66 Z" fill="#1E1B4B" stroke="#A5B4FC" strokeWidth="1.5" />
        </svg>
      );
    case "music":
      return (
        <svg viewBox="0 0 160 100" fill="none" className="w-full h-full object-cover">
          <rect width="160" height="100" fill="#170F1C" />
          {/* Equalizer Wave */}
          <path
            d="M20 54 Q40 18 60 54 T100 54 T140 54"
            fill="none"
            stroke="#EC4899"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M20 54 Q40 80 60 54 T100 54 T140 54"
            fill="none"
            stroke="#8B5CF6"
            strokeWidth="2"
            opacity="0.6"
            strokeLinecap="round"
          />
          {/* Piano keys bottom */}
          <rect x="30" y="74" width="100" height="14" rx="2" fill="#FFFFFF" />
          <rect x="42" y="74" width="7" height="9" fill="#18181B" />
          <rect x="56" y="74" width="7" height="9" fill="#18181B" />
          <rect x="78" y="74" width="7" height="9" fill="#18181B" />
          <rect x="92" y="74" width="7" height="9" fill="#18181B" />
          <rect x="106" y="74" width="7" height="9" fill="#18181B" />
        </svg>
      );
    case "markdown":
      return (
        <svg viewBox="0 0 160 100" fill="none" className="w-full h-full object-cover">
          <rect width="160" height="100" fill="#0F172A" />
          <rect x="20" y="16" width="56" height="68" rx="4" fill="#1E293B" stroke="#334155" strokeWidth="1" />
          <rect x="84" y="16" width="56" height="68" rx="4" fill="#1E293B" stroke="#38BDF8" strokeWidth="1" />
          <text x="26" y="32" fill="#38BDF8" fontSize="10" fontFamily="monospace"># Hello</text>
          <text x="26" y="48" fill="#94A3B8" fontSize="8" fontFamily="monospace">- List item</text>
          <rect x="92" y="24" width="38" height="6" rx="3" fill="#38BDF8" />
          <circle cx="94" cy="42" r="2" fill="#94A3B8" />
          <rect x="100" y="40" width="30" height="4" rx="2" fill="#94A3B8" />
        </svg>
      );
    case "crypto":
      return (
        <svg viewBox="0 0 160 100" fill="none" className="w-full h-full object-cover">
          <rect width="160" height="100" fill="#0C141F" />
          {/* Candlesticks */}
          <line x1="38" y1="40" x2="38" y2="70" stroke="#10B981" strokeWidth="1.5" />
          <rect x="34" y="48" width="8" height="16" rx="1.5" fill="#10B981" />
          <line x1="58" y1="34" x2="58" y2="76" stroke="#EF4444" strokeWidth="1.5" />
          <rect x="54" y="42" width="8" height="24" rx="1.5" fill="#EF4444" />
          <line x1="78" y1="30" x2="78" y2="66" stroke="#10B981" strokeWidth="1.5" />
          <rect x="74" y="38" width="8" height="20" rx="1.5" fill="#10B981" />
          <line x1="98" y1="20" x2="98" y2="58" stroke="#10B981" strokeWidth="1.5" />
          <rect x="94" y="26" width="8" height="24" rx="1.5" fill="#10B981" />
          <line x1="118" y1="16" x2="118" y2="50" stroke="#10B981" strokeWidth="1.5" />
          <rect x="114" y="20" width="8" height="22" rx="1.5" fill="#10B981" />
          <path d="M38 56 Q78 50 118 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeDasharray="3 3" />
        </svg>
      );
    case "whiteboard":
      return (
        <svg viewBox="0 0 160 100" fill="none" className="w-full h-full object-cover">
          <rect width="160" height="100" fill="#F8FAFC" />
          <path d="M30 60 Q50 20 80 50 T130 35" fill="none" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
          <path d="M40 75 Q70 65 95 80 T135 65" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="110" cy="30" r="12" fill="none" stroke="#10B981" strokeWidth="2.5" />
          <rect x="40" y="86" width="10" height="5" rx="2" fill="#3B82F6" />
          <rect x="56" y="86" width="10" height="5" rx="2" fill="#EF4444" />
          <rect x="72" y="86" width="10" height="5" rx="2" fill="#10B981" />
        </svg>
      );
    case "particles":
      return (
        <svg viewBox="0 0 160 100" fill="none" className="w-full h-full object-cover">
          <rect width="160" height="100" fill="#0A0612" />
          <circle cx="80" cy="50" r="6" fill="#F43F5E" />
          <circle cx="50" cy="35" r="3" fill="#FB7185" />
          <circle cx="110" cy="30" r="4" fill="#FDA4AF" />
          <circle cx="120" cy="65" r="3" fill="#E11D48" />
          <circle cx="45" cy="70" r="4.5" fill="#BE123C" />
          <circle cx="70" cy="20" r="2" fill="#F43F5E" />
          <line x1="80" y1="50" x2="50" y2="35" stroke="#FB7185" strokeWidth="0.8" opacity="0.6" />
          <line x1="80" y1="50" x2="110" y2="30" stroke="#FDA4AF" strokeWidth="0.8" opacity="0.6" />
          <line x1="80" y1="50" x2="120" y2="65" stroke="#E11D48" strokeWidth="0.8" opacity="0.6" />
          <line x1="80" y1="50" x2="45" y2="70" stroke="#BE123C" strokeWidth="0.8" opacity="0.6" />
        </svg>
      );
    case "keyboard":
      return (
        <svg viewBox="0 0 160 100" fill="none" className="w-full h-full object-cover">
          <rect width="160" height="100" fill="#18181B" />
          <rect x="22" y="24" width="116" height="52" rx="6" fill="#27272A" stroke="#3F3F46" strokeWidth="1" />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <rect key={i} x={30 + i * 15} y="32" width="11" height="10" rx="2" fill="#71717A" />
          ))}
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <rect key={i} x={32 + i * 15} y="46" width="11" height="10" rx="2" fill={i === 2 ? "#A855F7" : "#52525B"} />
          ))}
          <rect x="46" y="60" width="60" height="9" rx="2" fill="#3F3F46" />
        </svg>
      );
    case "algorithm":
      return (
        <svg viewBox="0 0 160 100" fill="none" className="w-full h-full object-cover">
          <rect width="160" height="100" fill="#0B132B" />
          <rect x="28" y="60" width="8" height="24" rx="2" fill="#48E5C2" />
          <rect x="42" y="44" width="8" height="40" rx="2" fill="#48E5C2" />
          <rect x="56" y="24" width="8" height="60" rx="2" fill="#FF5964" />
          <rect x="70" y="52" width="8" height="32" rx="2" fill="#48E5C2" />
          <rect x="84" y="32" width="8" height="52" rx="2" fill="#FEE180" />
          <rect x="98" y="68" width="8" height="16" rx="2" fill="#48E5C2" />
          <rect x="112" y="40" width="8" height="44" rx="2" fill="#48E5C2" />
        </svg>
      );
    case "voice":
      return (
        <svg viewBox="0 0 160 100" fill="none" className="w-full h-full object-cover">
          <rect width="160" height="100" fill="#0F0C20" />
          <circle cx="80" cy="50" r="32" fill="#8B5CF6" opacity="0.15" />
          <circle cx="80" cy="50" r="22" fill="#A855F7" opacity="0.3" />
          <circle cx="80" cy="50" r="12" fill="#C084FC" />
          <path d="M48 50 Q64 30 80 50 T112 50" fill="none" stroke="#E9D5FF" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 160 100" fill="none" className="w-full h-full object-cover">
          <rect width="160" height="100" fill="#1E1924" />
          <rect x="20" y="20" width="120" height="60" rx="8" fill="#2D2438" stroke="#483267" strokeWidth="1" />
          <rect x="32" y="36" width="50" height="6" rx="3" fill="#D8B4FE" />
          <rect x="32" y="48" width="80" height="4" rx="2" fill="#9333EA" opacity="0.6" />
        </svg>
      );
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
 * CURATED SHOWCASE ROW DATA
 * ─────────────────────────────────────────────────────────────────────────── */

interface ShowcaseCardItem {
  id: string;
  num: number;
  title: string;
  author: string;
  mockup: string;
  category: "web" | "python" | "js" | "data" | "ai" | "mobile" | "devops";
  tags?: string[];
  projectId?: string;
}

const CSS_PROJECTS: ShowcaseCardItem[] = [
  { id: "css-1", num: 1, title: "Portfolio UI", author: "@arjun", mockup: "portfolio", category: "web" },
  { id: "css-2", num: 2, title: "Landing Page", author: "@riya", mockup: "landing", category: "web" },
  { id: "css-3", num: 3, title: "Card Gallery", author: "@manasi", mockup: "cards", category: "web" },
  { id: "css-4", num: 4, title: "Pricing Section", author: "@bhupesh", mockup: "pricing", category: "web" },
  { id: "css-5", num: 5, title: "Animated Buttons", author: "@karan", mockup: "buttons", category: "web" },
  { id: "css-6", num: 6, title: "CSS Grid Layout", author: "@ananya", mockup: "grid", category: "web" },
  { id: "css-7", num: 7, title: "Glassmorphism UI", author: "@devika", mockup: "glass", category: "web" },
  { id: "css-8", num: 8, title: "Dashboard UI", author: "@rishab", mockup: "dashboard", category: "web" },
  { id: "css-9", num: 9, title: "Product Card", author: "@mehul", mockup: "product", category: "web" },
  { id: "css-10", num: 10, title: "Login Page", author: "@tanvi", mockup: "login", category: "web" },
];

const PYTHON_PROJECTS: ShowcaseCardItem[] = [
  { id: "py-1", num: 1, title: "AI Chatbot", author: "@arjun", mockup: "chatbot", category: "ai" },
  { id: "py-2", num: 2, title: "Data Visualizer", author: "@riya", mockup: "dataviz", category: "data" },
  { id: "py-3", num: 3, title: "Web Scraper", author: "@manasi", mockup: "scraper", category: "data" },
  { id: "py-4", num: 4, title: "Expense Tracker", author: "@bhupesh", mockup: "expense", category: "data" },
  { id: "py-5", num: 5, title: "QR Generator", author: "@karan", mockup: "qr", category: "python" },
  { id: "py-6", num: 6, title: "File Organizer", author: "@ananya", mockup: "organizer", category: "python" },
  { id: "py-7", num: 7, title: "Weather App", author: "@devika", mockup: "weather", category: "python" },
  { id: "py-8", num: 8, title: "To-Do App", author: "@rishab", mockup: "todo", category: "python" },
  { id: "py-9", num: 9, title: "PDF Merger", author: "@mehul", mockup: "pdf", category: "python" },
  { id: "py-10", num: 10, title: "Quiz App", author: "@tanvi", mockup: "quiz", category: "python" },
];

const JAVASCRIPT_PROJECTS: ShowcaseCardItem[] = [
  { id: "js-1", num: 1, title: "Code Playground", author: "@arjun", mockup: "playground", category: "web" },
  { id: "js-2", num: 2, title: "3D Canvas Engine", author: "@riya", mockup: "canvas3d", category: "web" },
  { id: "js-3", num: 3, title: "Music Synthesizer", author: "@manasi", mockup: "music", category: "web" },
  { id: "js-4", num: 4, title: "Markdown Previewer", author: "@bhupesh", mockup: "markdown", category: "web" },
  { id: "js-5", num: 5, title: "Crypto Live Ticker", author: "@karan", mockup: "crypto", category: "data" },
  { id: "js-6", num: 6, title: "Interactive Whiteboard", author: "@ananya", mockup: "whiteboard", category: "web" },
  { id: "js-7", num: 7, title: "Particle Simulator", author: "@devika", mockup: "particles", category: "web" },
  { id: "js-8", num: 8, title: "Virtual Keyboard", author: "@rishab", mockup: "keyboard", category: "web" },
  { id: "js-9", num: 9, title: "Algorithm Visualizer", author: "@mehul", mockup: "algorithm", category: "web" },
  { id: "js-10", num: 10, title: "Voice Command UI", author: "@tanvi", mockup: "voice", category: "ai" },
];

/* ─────────────────────────────────────────────────────────────────────────────
 * TECH LOGOS (CSS3 Shield, Python Snakes, JavaScript Badge)
 * ─────────────────────────────────────────────────────────────────────────── */

function CssLogoBadge() {
  return (
    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#264DE4] to-[#2965F1] p-1.5 flex items-center justify-center shadow-xs shrink-0">
      <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
        <path d="M5 2 L27 2 L25 24 L16 27 L7 24 Z" fill="#264DE4" />
        <path d="M16 4 L25 4 L23.5 22.5 L16 25 Z" fill="#2965F1" />
        <path d="M9.5 7 L22.5 7 L22 10 L12 10 L12.5 14 L21.5 14 L20.5 20 L16 21.5 L11.5 20 L11 16 L8.5 16 L9.5 22 L16 24 L22.5 22 L23.5 11 L9.5 11 Z" fill="#FFFFFF" />
      </svg>
    </div>
  );
}

function PythonLogoBadge() {
  return (
    <div className="w-10 h-10 rounded-2xl bg-[#FFFDF9] border border-[#DECDBA] p-1.5 flex items-center justify-center shadow-xs shrink-0">
      <svg viewBox="0 0 32 32" fill="none" className="w-6 h-6">
        {/* Python Blue Top Snake */}
        <path
          d="M15.8 4 C11 4 11.4 6 11.4 6 L11.4 8.2 L16.2 8.2 L16.2 9 L9 9 C7.2 9 5.8 10.4 5.8 12.6 C5.8 15.6 7 15.6 7 15.6 L8.4 15.6 L8.4 13.8 C8.4 11.8 10 11.8 10 11.8 L14.6 11.8 C16.4 11.8 17.6 10.6 17.6 8.8 C17.6 6.2 17.6 4 15.8 4 Z"
          fill="#3776AB"
        />
        <circle cx="13.2" cy="6.2" r="0.8" fill="#FFFFFF" />
        {/* Python Yellow Bottom Snake */}
        <path
          d="M16.2 28 C21 28 20.6 26 20.6 26 L20.6 23.8 L15.8 23.8 L15.8 23 L23 23 C24.8 23 26.2 21.6 26.2 19.4 C26.2 16.4 25 16.4 25 16.4 L23.6 16.4 L23.6 18.2 C23.6 20.2 22 20.2 22 20.2 L17.4 20.2 C15.6 20.2 14.4 21.4 14.4 23.2 C14.4 25.8 14.4 28 16.2 28 Z"
          fill="#FFD43B"
        />
        <circle cx="18.8" cy="25.8" r="0.8" fill="#1C1917" />
      </svg>
    </div>
  );
}

function JavaScriptLogoBadge() {
  return (
    <div className="w-10 h-10 rounded-2xl bg-[#F7DF1E] p-1.5 flex items-center justify-center shadow-xs shrink-0 font-extrabold text-[#000000] text-sm tracking-tighter">
      JS
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * HORIZONTAL CAROUSEL ROW COMPONENT
 * ─────────────────────────────────────────────────────────────────────────── */

function ShowcaseRow({
  title,
  subtitle,
  icon,
  items,
  bookmarkedMap,
  onToggleBookmark,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  items: ShowcaseCardItem[];
  bookmarkedMap: Record<string, boolean>;
  onToggleBookmark: (id: string, title: string) => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!rowRef.current) return;
    const distance = 420;
    rowRef.current.scrollBy({
      left: direction === "left" ? -distance : distance,
      behavior: "smooth",
    });
  };

  return (
    <section className="space-y-3.5">
      {/* Row Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#2D120D] leading-tight">
              {title}
            </h2>
            <p className="font-sans text-xs sm:text-sm text-[#6E5952] mt-0.5">
              {subtitle}
            </p>
          </div>
        </div>

        <Link
          to="/explore"
          className="font-sans text-xs sm:text-sm font-semibold text-[#780D18] hover:text-[#5C0A12] flex items-center gap-1 transition-colors group shrink-0"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Row Carousel */}
      <div className="relative group/carousel">
        {/* Left Arrow Button */}
        <button
          type="button"
          onClick={() => scroll("left")}
          className="absolute -left-3 sm:-left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-[#DECDBA] text-[#2D120D] shadow-md flex items-center justify-center hover:bg-[#FAF7F2] hover:scale-105 active:scale-95 transition cursor-pointer"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4 text-[#2D120D]" />
        </button>

        {/* Horizontal Track of 10 Cards */}
        <div
          ref={rowRef}
          className="flex gap-3.5 sm:gap-4 overflow-x-auto scrollbar-none scroll-smooth pb-2 pt-1 px-1"
        >
          {items.map((item) => {
            const isBookmarked = Boolean(bookmarkedMap[item.id]);
            return (
              <div
                key={item.id}
                className="w-36 sm:w-40 md:w-44 lg:w-48 shrink-0 rounded-2xl overflow-hidden border border-[#DECDBA]/70 bg-[#161219] text-white shadow-xs hover:border-[#780D18]/50 hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer flex flex-col group/card"
              >
                {/* Visual Preview Container */}
                <div className="h-28 sm:h-32 w-full relative flex items-center justify-center overflow-hidden bg-[#1E1924]">
                  {/* Number Badge Top Left */}
                  <span className="absolute top-2 left-2.5 z-10 font-serif font-bold text-lg sm:text-xl text-white/90 drop-shadow-md select-none">
                    {item.num}
                  </span>

                  {/* Mockup SVG Graphic */}
                  <div className="w-full h-full group-hover/card:scale-105 transition-transform duration-300">
                    <ProjectMockupGraphic type={item.mockup} />
                  </div>
                </div>

                {/* Bottom Info Bar */}
                <div className="p-3 bg-[#161219] border-t border-white/10 flex items-center justify-between gap-1.5">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-sans font-bold text-xs sm:text-sm text-white group-hover/card:text-[#FFF8CA] truncate transition-colors leading-tight">
                      {item.title}
                    </h3>
                    <p className="font-sans text-[11px] text-white/60 truncate mt-0.5">
                      by {item.author}
                    </p>
                  </div>

                  {/* Bookmark Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleBookmark(item.id, item.title);
                    }}
                    className={`p-1.5 rounded-lg transition shrink-0 cursor-pointer ${
                      isBookmarked
                        ? "text-[#FF4A65] bg-white/10"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                    title={isBookmarked ? "Remove bookmark" : "Save project"}
                    aria-label="Bookmark project"
                  >
                    <Bookmark
                      className={`w-3.5 h-3.5 ${
                        isBookmarked ? "fill-[#FF4A65] text-[#FF4A65]" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Arrow Button */}
        <button
          type="button"
          onClick={() => scroll("right")}
          className="absolute -right-3 sm:-right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-[#DECDBA] text-[#2D120D] shadow-md flex items-center justify-center hover:bg-[#FAF7F2] hover:scale-105 active:scale-95 transition cursor-pointer"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4 text-[#2D120D]" />
        </button>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * MAIN EXPLORE SHOWCASE PAGE COMPONENT
 * ─────────────────────────────────────────────────────────────────────────── */

export function ExploreShowcasePage() {
  const { projects: _apiProjects } = useExploreProjects();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [bookmarkedMap, setBookmarkedMap] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleBookmark = (id: string, title: string) => {
    setBookmarkedMap((prev) => {
      const isMarked = !prev[id];
      showToast(isMarked ? `Saved "${title}" to your bookmarks` : `Removed "${title}" from bookmarks`);
      return { ...prev, [id]: isMarked };
    });
  };

  const scrollToCategories = () => {
    categoriesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Filter items if searching
  const query = searchQuery.trim().toLowerCase();

  const filteredCss = useMemo(() => {
    if (!query) return CSS_PROJECTS;
    return CSS_PROJECTS.filter(
      (p) => p.title.toLowerCase().includes(query) || p.author.toLowerCase().includes(query)
    );
  }, [query]);

  const filteredPython = useMemo(() => {
    if (!query) return PYTHON_PROJECTS;
    return PYTHON_PROJECTS.filter(
      (p) => p.title.toLowerCase().includes(query) || p.author.toLowerCase().includes(query)
    );
  }, [query]);

  const filteredJs = useMemo(() => {
    if (!query) return JAVASCRIPT_PROJECTS;
    return JAVASCRIPT_PROJECTS.filter(
      (p) => p.title.toLowerCase().includes(query) || p.author.toLowerCase().includes(query)
    );
  }, [query]);

  // Determine visibility based on active category
  const showCss = activeCategory === "all" || activeCategory === "web";
  const showPython = activeCategory === "all" || activeCategory === "data" || activeCategory === "ai" || activeCategory === "python";
  const showJs = activeCategory === "all" || activeCategory === "web" || activeCategory === "data";

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2D120D] font-sans antialiased">
      <Navbar />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-4 right-4 z-50 flex items-center gap-2 rounded-full border border-[#DECDBA] bg-[#2D120D] px-5 py-2.5 font-sans text-sm font-semibold text-[#FFF8CA] shadow-xl sm:left-auto sm:right-6 sm:max-w-sm">
          <Check className="w-4 h-4 text-[#CDE3E8]" />
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-20 space-y-8">
        {/* ===================================================================== */}
        {/* HERO BANNER: Discover Projects & Tech Highlights                      */}
        {/* ===================================================================== */}
        <section className="relative overflow-hidden rounded-[28px] border border-[#5A1520]/40 bg-gradient-to-r from-[#22060A] via-[#430D16] to-[#1E0508] p-6 sm:p-8 lg:p-12 shadow-md">
          {/* Ambient Background Glows */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-[#780D18]/30 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 -bottom-20 h-96 w-96 rounded-full bg-[#E27A7A]/15 blur-3xl" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-4">
              <span className="inline-block text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-[#FFF8CA]/80">
                Explore &mdash;
              </span>

              <h1 className="font-serif font-bold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-[1.12]">
                Discover Projects <br />
                <span className="text-[#FFF8CA]">&amp; Tech Highlights</span>
              </h1>

              <p className="font-sans text-sm sm:text-base text-white/80 max-w-xl leading-relaxed">
                Explore curated projects, top tech lists, and trending builds across different categories.
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={scrollToCategories}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-[#FAF7F2] text-[#2D120D] font-sans text-xs sm:text-sm font-semibold transition shadow-sm hover:shadow-md cursor-pointer group"
                >
                  <Compass className="w-4 h-4 text-[#780D18] group-hover:rotate-45 transition-transform" />
                  <span>Browse Categories</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#2D120D] group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>

            {/* Right Graphic: Floating Code Window, Top 10, Projects, Trending Badges */}
            <div className="relative flex items-center justify-center min-h-[220px] sm:min-h-[260px]">
              {/* Floating Badge Top Right: Top 10 */}
              <div className="absolute top-2 right-4 sm:right-8 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-sans text-xs font-bold shadow-md animate-pulse">
                <BarChart2 className="w-3.5 h-3.5 text-[#FFF8CA]" />
                <span>Top 10</span>
              </div>

              {/* Floating Badge Left: Projects */}
              <div className="absolute top-12 left-0 sm:left-4 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-sans text-xs font-semibold shadow-md">
                <Folder className="w-3.5 h-3.5 text-[#FFF8CA]" />
                <span>Projects</span>
              </div>

              {/* Center Glassmorphic Code Card */}
              <div className="w-full max-w-[340px] sm:max-w-[380px] rounded-2xl bg-white/[0.07] backdrop-blur-md border border-white/20 p-5 shadow-2xl space-y-4">
                {/* Window Header Dots */}
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
                </div>

                {/* Center Code Symbol & Lines */}
                <div className="flex items-center justify-between gap-6 py-2">
                  <div className="space-y-2 flex-1">
                    <div className="h-2 w-24 bg-white/30 rounded-full" />
                    <div className="h-2 w-32 bg-white/20 rounded-full" />
                    <div className="h-2 w-20 bg-white/25 rounded-full" />
                    <div className="h-2 w-28 bg-white/15 rounded-full" />
                  </div>

                  {/* Glowing </> Code Mark */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-white/15 to-white/5 border border-white/30 flex items-center justify-center shadow-inner shrink-0">
                    <span className="font-mono text-2xl sm:text-3xl font-extrabold text-[#FFF8CA] drop-shadow-[0_0_15px_rgba(255,248,202,0.6)]">
                      &lt;/&gt;
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating Badge Bottom Right: Trending */}
              <div className="absolute bottom-2 right-2 sm:right-6 z-20 flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#780D18]/80 to-[#9E1A2B]/80 backdrop-blur-md border border-white/20 text-white font-sans text-xs font-bold shadow-md">
                <Flame className="w-3.5 h-3.5 text-[#F97316]" />
                <span>Trending</span>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* SEARCH & CATEGORY PILLS BAR                                           */}
        {/* ===================================================================== */}
        <section ref={categoriesRef} className="space-y-4 pt-2">
          <div className="flex flex-col lg:flex-row gap-3.5 items-stretch lg:items-center justify-between">
            {/* Search Input Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6E5952]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects, technologies, or creators..."
                className="w-full rounded-full border border-[#DECDBA] bg-white pl-11 pr-4 py-2.5 text-xs sm:text-sm text-[#2D120D] placeholder-[#6E5952]/60 focus:outline-none focus:border-[#780D18] focus:ring-1 focus:ring-[#780D18] transition shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#6E5952] hover:text-[#2D120D]"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Filter Pills Track */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
              {[
                { id: "all", label: "All", icon: LayoutGrid },
                { id: "web", label: "Web Dev", icon: CodeXml },
                { id: "data", label: "Data", icon: Database },
                { id: "ai", label: "AI/ML", icon: Sparkles },
                { id: "mobile", label: "Mobile", icon: Smartphone },
                { id: "devops", label: "DevOps", icon: InfinityIcon },
              ].map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full text-xs font-semibold transition shrink-0 cursor-pointer ${
                      isActive
                        ? "bg-[#780D18] text-white shadow-xs"
                        : "bg-white border border-[#DECDBA] text-[#2D120D] hover:bg-[#FAF7F2] shadow-2xs"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}

              {/* Others dropdown button */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    showToast("Filter expanded");
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full text-xs font-semibold bg-white border border-[#DECDBA] text-[#2D120D] hover:bg-[#FAF7F2] transition shadow-2xs cursor-pointer"
                >
                  <span>Others</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#6E5952]" />
                </button>
              </div>

              {/* Alternate View Switchers (Reels & Retro TV) */}
              <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-[#DECDBA] shrink-0">
                <Link
                  to="/explore/reels"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold text-[#6E5952] hover:text-[#780D18] hover:bg-white transition"
                  title="Watch as Instagram Reels"
                >
                  <Film className="w-3.5 h-3.5 text-[#780D18]" />
                  <span>Reels</span>
                </Link>
                <Link
                  to="/explore/tv"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold text-[#6E5952] hover:text-[#780D18] hover:bg-white transition"
                  title="Explore in Retro TV World"
                >
                  <Tv className="w-3.5 h-3.5 text-[#780D18]" />
                  <span>TV Room</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================== */}
        {/* CURATED SHOWCASE ROWS                                                 */}
        {/* ===================================================================== */}
        <div className="space-y-10 pt-2">
          {/* Row 1: Top 10 CSS Projects */}
          {showCss && filteredCss.length > 0 && (
            <ShowcaseRow
              title="Top 10 CSS Projects"
              subtitle="Most popular and well-built projects using CSS."
              icon={<CssLogoBadge />}
              items={filteredCss}
              bookmarkedMap={bookmarkedMap}
              onToggleBookmark={handleToggleBookmark}
            />
          )}

          {/* Row 2: Top 10 Python Projects */}
          {showPython && filteredPython.length > 0 && (
            <ShowcaseRow
              title="Top 10 Python Projects"
              subtitle="Trending and practical projects built with Python."
              icon={<PythonLogoBadge />}
              items={filteredPython}
              bookmarkedMap={bookmarkedMap}
              onToggleBookmark={handleToggleBookmark}
            />
          )}

          {/* Row 3: Top 10 JavaScript Projects */}
          {showJs && filteredJs.length > 0 && (
            <ShowcaseRow
              title="Top 10 JavaScript Projects"
              subtitle="Popular and creative projects using JavaScript."
              icon={<JavaScriptLogoBadge />}
              items={filteredJs}
              bookmarkedMap={bookmarkedMap}
              onToggleBookmark={handleToggleBookmark}
            />
          )}

          {/* Fallback if no search results */}
          {query && !showCss && !showPython && !showJs && (
            <div className="py-16 text-center bg-white rounded-3xl border border-[#DECDBA] p-8 space-y-3">
              <Compass className="w-10 h-10 text-[#780D18] mx-auto opacity-70" />
              <h3 className="font-serif font-bold text-lg text-[#2D120D]">
                No projects found for &ldquo;{searchQuery}&rdquo;
              </h3>
              <p className="font-sans text-xs text-[#6E5952]">
                Try adjusting your search terms or clearing filters.
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#780D18] text-white text-xs font-semibold hover:bg-[#5C0A12] transition"
              >
                Clear Search
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
