import { Heart, MessageCircle } from "lucide-react";
import { useProjectLike } from "../hooks/useProjectLike";
import type { ProjectPreview } from "../types/network";

/** The embedded project's own like and comment counts, kept apart from the post's like/comment row. */
export function FeedProjectStats({ project }: { project: ProjectPreview }) {
  const { count, liked, busy, toggle } = useProjectLike(project.id, project.likesCount, project.isLiked);
  return (
    <div className="-mt-2 mb-4 flex items-center gap-3 px-1 font-sans text-xs text-stone-500">
      <button type="button" onClick={toggle} disabled={busy}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-semibold transition ${
          liked ? "border-[#DC2626] bg-[#FEE2E2] text-[#991B1B]" : "border-stone-200 hover:bg-stone-50"}`}>
        <Heart className={`w-3.5 h-3.5 ${liked ? "fill-crimson-600 text-crimson-600" : ""}`} />
        {liked ? "Project liked" : "Like project"} · {count}
      </button>
      <span className="inline-flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> {project.commentsCount} project comment{project.commentsCount === 1 ? "" : "s"}</span>
    </div>
  );
}
