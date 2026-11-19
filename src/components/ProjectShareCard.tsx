import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowUpRight, FolderCode } from "lucide-react";
import { fetchProject } from "../api";
import { resolveApiAssetUrl } from "../api/config";
import { queryKeys } from "../api/queryKeys";
import { ImageWithFallback } from "./ImageWithFallback";

/** Rich project preview inside a chat bubble (loads live details by id). */
export function ProjectShareCard({
  id,
  title,
  mine = false,
}: {
  id: string;
  title: string;
  mine?: boolean;
}) {
  const project = useQuery({
    queryKey: queryKeys.project(id),
    queryFn: () => fetchProject(id),
    staleTime: 60_000,
    retry: 1,
  });
  const data = project.data;
  const cover = resolveApiAssetUrl(data?.cover_image_url || data?.image_url);
  const blurb = (data?.short_description || "").trim();
  const tech = (data?.tech_stacks || []).slice(0, 3);
  const likes = data?.likes_count ?? 0;
  const comments = data?.comments_count ?? 0;

  return (
    <Link
      to={`/project/${id}`}
      className={`mb-1 block overflow-hidden rounded-2xl border text-left transition hover:opacity-95 ${
        mine ? "border-white/20 bg-white/10" : "border-stone-200 bg-[#faf6ee]"
      }`}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-stone-900/10">
        {cover ? (
          <ImageWithFallback src={cover} alt="" className="h-full w-full object-cover object-center" />
        ) : (
          <div className={`flex h-full w-full items-center justify-center ${mine ? "bg-white/5" : "bg-stone-100"}`}>
            <FolderCode className={`h-8 w-8 ${mine ? "text-[#fced96]" : "text-maroon-800"}`} />
          </div>
        )}
        <span
          className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
            mine ? "bg-[#fced96] text-[#3d0a14]" : "bg-maroon-800 text-amber-50"
          }`}
        >
          Project
        </span>
      </div>
      <div className="space-y-1.5 px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <span className="min-w-0 text-sm font-semibold leading-snug">{data?.title || title}</span>
          <ArrowUpRight className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${mine ? "text-[#fced96]" : "text-maroon-800"}`} />
        </div>
        {project.isLoading ? (
          <span className={`block text-xs ${mine ? "text-[#f6d7b0]" : "text-stone-500"}`}>Loading details…</span>
        ) : (
          <>
            {blurb && (
              <span className={`block text-xs leading-relaxed line-clamp-2 ${mine ? "text-[#f6d7b0]" : "text-stone-600"}`}>
                {blurb}
              </span>
            )}
            {tech.length > 0 && (
              <span className="flex flex-wrap gap-1 pt-0.5">
                {tech.map((item) => (
                  <span
                    key={item}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      mine ? "bg-white/15 text-[#fff8ca]" : "bg-white text-stone-700 border border-stone-200"
                    }`}
                  >
                    {item}
                  </span>
                ))}
              </span>
            )}
            {(likes > 0 || comments > 0) && (
              <span className={`block text-[11px] ${mine ? "text-[#f6d7b0]" : "text-stone-500"}`}>
                {likes > 0 ? `${likes} like${likes === 1 ? "" : "s"}` : ""}
                {likes > 0 && comments > 0 ? " · " : ""}
                {comments > 0 ? `${comments} comment${comments === 1 ? "" : "s"}` : ""}
              </span>
            )}
          </>
        )}
      </div>
    </Link>
  );
}
