import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { fetchProjects } from "../api";
import { getApiErrorMessage } from "../utils/apiError";
import type { ApiProject } from "../types/project";
import { toTvProject } from "../components/tvworld/worldLayout";

// A simple deterministic hash to decide if "liked by coders" (red) or "employers" (green)
function getLikeStatus(id: string, likes: number) {
  if (likes >= 10000) return { color: "bg-purple-500", text: "10K+ LIKES" };
  if (likes >= 5000) return { color: "bg-blue-500", text: "5K+ LIKES" };
  
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const isCoders = Math.abs(hash) % 2 === 0;
  if (isCoders) return { color: "bg-red-500", text: "LIKED BY CODERS" };
  return { color: "bg-green-500", text: "LIKED BY EMPLOYERS" };
}

export function CardsWorldPage() {
  const navigate = useNavigate();
  const [apiProjects, setApiProjects] = useState<ApiProject[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  const load = useCallback(async () => {
    try {
      const list = await fetchProjects();
      setApiProjects(list);
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err));
      setApiProjects([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const projects = useMemo(() => {
    if (!apiProjects) return [];
    // We reuse the toTvProject mapping just to normalize data easily
    let list = apiProjects.map((p, i) => toTvProject(p, i));
    if (search.trim() !== "") {
      const q = search.toLowerCase();
      list = list.filter(t => 
        t.title.toLowerCase().includes(q) ||
        t.techStack.some(ts => ts.toLowerCase().includes(q)) ||
        t.category?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [apiProjects, search]);

  // Make sure index is valid when filtering
  useEffect(() => {
    if (projects.length > 0 && currentIndex >= projects.length) {
      setCurrentIndex(0);
    }
  }, [projects, currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target && (e.target as HTMLElement).tagName === "INPUT") return;
      if (e.key === "ArrowLeft") {
        setCurrentIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === "ArrowRight") {
        setCurrentIndex(prev => Math.min(projects.length - 1, prev + 1));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [projects.length]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "DevZGo House of Cards",
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-stone-900 text-white flex items-center justify-center font-sans">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={load} className="px-4 py-2 bg-stone-800 rounded">Retry</button>
        </div>
      </div>
    );
  }

  if (apiProjects === null) {
    return (
      <div className="min-h-screen bg-stone-900 text-white flex items-center justify-center font-sans">
        <p className="animate-pulse font-mono tracking-widest text-sm">SHUFFLING CARDS...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black overflow-hidden flex flex-col font-sans" style={{ fontFamily: "'Fredoka One', 'Comic Sans MS', 'Nunito', sans-serif" }}>
      {/* Header */}
      <header className="relative z-50 p-6 flex items-center justify-between pointer-events-auto">
        <Link to="/explore" className="text-white/60 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest">
          &larr; BACK
        </Link>

        {/* Search Bar / Filters */}
        <div className="flex-1 max-w-md mx-6">
          <input
            type="text"
            placeholder="Filter by type, tech, or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/10 border-2 border-white/20 rounded-full px-6 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all text-center"
          />
        </div>

        <button onClick={handleShare} className="text-white/60 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest flex items-center gap-2">
          SHARE
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
        </button>
      </header>

      {/* Main Stage */}
      <main className="flex-1 relative flex items-center justify-center w-full px-4 overflow-hidden">
        {projects.length === 0 ? (
          <div className="text-white/50 text-xl">No projects found.</div>
        ) : (
          <div className="relative w-full max-w-5xl h-[70vh] flex items-center justify-center perspective-[1000px]">
            <AnimatePresence mode="popLayout">
              {projects.map((t, index) => {
                const isCenter = index === currentIndex;
                const isLeft = index === currentIndex - 1;
                const isRight = index === currentIndex + 1;

                if (!isCenter && !isLeft && !isRight) return null;

                const likeData = getLikeStatus(t.id, t.likes);

                // Media: Try video first, fallback to image
                const mediaUrl = t.videoUrl || t.coverUrl;

                return (
                  <motion.div
                    key={t.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8, y: 100 }}
                    animate={{
                      opacity: isCenter ? 1 : 0.6,
                      scale: isCenter ? 1 : 0.8,
                      x: isCenter ? "0%" : isLeft ? "-60%" : "60%",
                      y: isCenter ? "0%" : "20%", // Edges and at bottom
                      zIndex: isCenter ? 30 : 10,
                      filter: isCenter ? "blur(0px)" : "blur(8px)",
                      rotateY: isCenter ? 0 : isLeft ? 15 : -15, // slight tilt
                    }}
                    exit={{ opacity: 0, scale: 0.8, y: 100 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="absolute w-[320px] sm:w-[400px] aspect-[3/4] bg-white rounded-[2.5rem] p-4 flex flex-col shadow-2xl cursor-pointer"
                    onClick={() => {
                      if (isLeft) setCurrentIndex(prev => prev - 1);
                      if (isRight) setCurrentIndex(prev => prev + 1);
                    }}
                  >
                    {/* Inner Card content */}
                    <div className="w-full h-full rounded-3xl bg-stone-100 flex flex-col overflow-hidden relative border-4 border-stone-200">
                      
                      {/* Top Header */}
                      <div className="p-4 bg-white border-b-4 border-stone-200 flex justify-between items-center z-10 shrink-0">
                        <div className="flex items-center gap-2">
                          {t.authorAvatar ? (
                            <img src={t.authorAvatar} className="w-8 h-8 rounded-full bg-stone-300" alt="" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-emerald-200" />
                          )}
                          <span className="font-bold text-stone-800 text-sm">{t.author}</span>
                        </div>
                        <span className="text-xs font-black text-stone-400 bg-stone-100 px-2 py-1 rounded-full border-2 border-stone-200">
                          {t.category || "PROJECT"}
                        </span>
                      </div>

                      {/* Media Area */}
                      <div className="flex-1 w-full bg-stone-900 relative flex items-center justify-center overflow-hidden">
                        {mediaUrl ? (
                          t.videoUrl && isCenter ? (
                            <video src={mediaUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                          ) : (
                            <img src={mediaUrl} className="w-full h-full object-cover" alt="" />
                          )
                        ) : (
                          <div className="text-stone-700 font-black text-4xl opacity-50">NO SIGNAL</div>
                        )}
                        
                        {/* Overlay Gradient for Text Readability */}
                        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                        
                        {/* Project Title overlaying media bottom */}
                        <div className="absolute bottom-4 left-4 right-4 text-white">
                          <h2 className="text-2xl font-black leading-tight mb-1" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>
                            {t.title}
                          </h2>
                          <div className="flex flex-wrap gap-1">
                            {t.techStack.slice(0, 3).map(tech => (
                              <span key={tech} className="text-[10px] uppercase font-bold bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/30 text-white/90">
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Action Bar (Bottom) */}
                      {isCenter && (
                        <div className="p-4 bg-white border-t-4 border-stone-200 shrink-0 space-y-3">
                          <button className={`w-full py-3 rounded-2xl text-white font-black text-lg shadow-[0_4px_0_rgba(0,0,0,0.2)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 ${likeData.color}`}>
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                            {likeData.text}
                          </button>
                          <div className="flex gap-2">
                            <button
                              onClick={() => navigate(`/project/${t.id}`)}
                              className="flex-1 py-2.5 rounded-xl bg-stone-100 border-2 border-stone-300 text-stone-600 font-bold hover:bg-stone-200 transition-colors"
                            >
                              SEE DETAILS
                            </button>
                            <button className="flex-1 py-2.5 rounded-xl bg-indigo-100 border-2 border-indigo-300 text-indigo-700 font-bold hover:bg-indigo-200 transition-colors">
                              CONNECT +
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Nav Controls for Desktop */}
      {projects.length > 0 && (
        <div className="fixed bottom-12 inset-x-0 flex justify-center gap-6 z-50 pointer-events-auto">
          <button
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 border-2 border-white/20 text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-md transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="h-14 flex items-center px-4 font-bold text-white/50 tracking-widest bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
            {currentIndex + 1} OF {projects.length}
          </div>
          <button
            onClick={() => setCurrentIndex(prev => Math.min(projects.length - 1, prev + 1))}
            disabled={currentIndex === projects.length - 1}
            className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 border-2 border-white/20 text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-md transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}
    </div>
  );
}
