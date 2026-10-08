import { Link } from "react-router-dom";
import { motion } from "motion/react";

export function ThemeSelectPage() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 flex flex-col items-center justify-center font-sans p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl w-full text-center space-y-12"
      >
        <h1 className="text-4xl md:text-5xl font-serif text-white tracking-tight">
          Choose Your Explore Theme
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* TV Theme */}
          <Link
            to="/explore/tv"
            className="group relative rounded-3xl bg-stone-900 border border-stone-800 p-8 flex flex-col items-center justify-center hover:bg-stone-800 transition-colors shadow-lg overflow-hidden h-80"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(40,40,40,1)0%,rgba(0,0,0,1)100%)] opacity-50 pointer-events-none" />
            <h2 className="relative z-10 text-3xl font-mono text-[#fced96] mb-4 tracking-widest group-hover:scale-105 transition-transform">
              TV WORLD
            </h2>
            <p className="relative z-10 text-stone-400 text-sm max-w-xs">
              A vast ocean of CRT televisions in a dark pixel-art room. Free roam, deterministic placement.
            </p>
          </Link>

          {/* House of Cards Theme */}
          <Link
            to="/explore/cards"
            className="group relative rounded-3xl bg-[#f8f6f0] border border-stone-200 p-8 flex flex-col items-center justify-center hover:bg-white transition-colors shadow-lg overflow-hidden h-80"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,200,200,0.1),transparent)] pointer-events-none" />
            <h2 className="relative z-10 text-4xl font-black text-rose-500 mb-4 tracking-tighter group-hover:scale-105 transition-transform drop-shadow-sm" style={{ fontFamily: "'Comic Sans MS', 'Chalkboard SE', 'Marker Felt', sans-serif" }}>
              House of Cards
            </h2>
            <p className="relative z-10 text-stone-500 text-sm max-w-xs font-medium">
              Playful and cartoonish. Focus on one project at a time with a dynamic stack of project cards.
            </p>
          </Link>
        </div>

        <Link
          to="/home"
          className="inline-block mt-8 text-stone-500 hover:text-stone-300 transition-colors text-sm font-semibold tracking-widest uppercase"
        >
          &larr; Back to Home
        </Link>
      </motion.div>
    </div>
  );
}
