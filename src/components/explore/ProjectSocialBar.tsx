import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Heart, MessageCircle, Share2, X } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { useProjectLike } from "../../hooks/useProjectLike";
import { ProjectComments } from "../ProjectComments";
import { ShareProjectDialog } from "../ShareProjectDialog";

interface ProjectSocialBarProps {
  projectId: string;
  title: string;
  initialLikes: number;
  initialLiked: boolean;
  likesHidden?: boolean;
  isOwner?: boolean;
  commentsCount?: number;
  commentsEnabled?: boolean;
  className?: string;
}

/**
 * Shared workable Like, Comment, and Share controls for Gallery cards and TV World.
 */
export function ProjectSocialBar({
  projectId,
  title,
  initialLikes,
  initialLiked,
  likesHidden = false,
  isOwner = false,
  commentsCount = 0,
  commentsEnabled = true,
  className = "",
}: ProjectSocialBarProps) {
  const { token } = useAuth();
  const signedIn = Boolean(token);
  const { count, liked, busy, toggle } = useProjectLike(projectId, initialLikes, initialLiked);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const showLikeCount = !likesHidden || isOwner;

  useEffect(() => {
    if (!commentsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCommentsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [commentsOpen]);

  return (
    <>
      <div className={`flex items-center gap-1.5 ${className}`} data-ui>
        {/* Like Button */}
        <button
          type="button"
          onClick={toggle}
          disabled={!signedIn || busy}
          aria-pressed={liked}
          title={signedIn ? (liked ? "Unlike project" : "Like project") : "Sign in to like projects"}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
            liked
              ? "bg-[#B81D27] text-[#FCFBF4] border-[#B81D27] shadow-xs"
              : "bg-white/90 text-[#5B233B] border-[#5B233B]/25 hover:bg-[#FCE7F3] hover:border-[#B81D27]/40"
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${liked ? "fill-current" : ""}`} />
          {showLikeCount && <span className="tabular-nums">{count}</span>}
        </button>

        {/* Comment Button */}
        <button
          type="button"
          onClick={() => setCommentsOpen(true)}
          title="View and post comments"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border bg-white/90 text-[#5B233B] border-[#5B233B]/25 hover:bg-[#E9DCF6] transition-all cursor-pointer"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          {commentsCount > 0 ? (
            <span className="tabular-nums">{commentsCount}</span>
          ) : (
            <span className="hidden sm:inline">Comment</span>
          )}
        </button>

        {/* Share Button */}
        <button
          type="button"
          onClick={() => setShareOpen(true)}
          title="Share project"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border bg-white/90 text-[#5B233B] border-[#5B233B]/25 hover:bg-[#DCE7F7] transition-all cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>

      {/* Comments Modal (Portaled so it renders cleanly above TV World & Gallery) */}
      {commentsOpen &&
        createPortal(
          <div
            data-ui
            role="dialog"
            aria-modal="true"
            aria-label={`Comments for ${title}`}
            onClick={(e) => {
              if (e.target === e.currentTarget) setCommentsOpen(false);
            }}
            className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-xs p-3 sm:p-6"
          >
            <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl bg-[#FAF6EC] border-2 border-[#5B233B]/25 shadow-2xl p-4 sm:p-6">
              <div className="flex items-center justify-between gap-3 mb-3 px-1">
                <div>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#DA6844] block">
                    PROJECT DISCUSSION
                  </span>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#5B233B] m-0">
                    {title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setCommentsOpen(false)}
                  aria-label="Close comments"
                  className="p-2 rounded-full bg-white border border-[#5B233B]/20 text-[#5B233B] hover:bg-[#E9DCF6] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <ProjectComments
                projectId={projectId}
                enabled={commentsEnabled}
                signedIn={signedIn}
              />
            </div>
          </div>,
          document.body
        )}

      {/* Share Dialog (Portaled with data-ui so TV World doesn't unfocus on click) */}
      {shareOpen &&
        createPortal(
          <div data-ui>
            <ShareProjectDialog
              projectId={projectId}
              title={title}
              open={shareOpen}
              onClose={() => setShareOpen(false)}
            />
          </div>,
          document.body
        )}
    </>
  );
}
