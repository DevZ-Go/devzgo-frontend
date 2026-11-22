import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchLinkPreview } from "../../api/network";

const URL_RE = /https?:\/\/[^\s<>"')\]]+/i;

export function extractFirstUrl(text: string): string | null {
  const m = text.match(URL_RE);
  return m ? m[0].replace(/[.,;:!?)]+$/, "") : null;
}

export function LinkPreviewCard({ url, className = "" }: { url: string; className?: string }) {
  const preview = useQuery({
    queryKey: ["link-preview", url],
    queryFn: () => fetchLinkPreview(url),
    retry: false,
    staleTime: 60_000,
  });

  if (preview.isLoading) {
    return (
      <div className={`rounded-2xl border border-[#DECDBA] bg-[#FAF7F2] px-4 py-3 text-xs text-[#6E5952] ${className}`}>
        Loading link preview…
      </div>
    );
  }
  if (preview.isError || !preview.data) return null;
  const data = preview.data;
  const href = data.kind === "project" && data.projectId ? `/project/${data.projectId}` : data.url;

  const inner = (
    <div className={`rounded-2xl border border-[#DECDBA] bg-[#FAF7F2] overflow-hidden hover:border-[#780D18] transition ${className}`}>
      {data.imageUrl && (
        <div className="aspect-[2.4/1] w-full overflow-hidden bg-stone-100">
          <img src={data.imageUrl} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-3.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6E5952] truncate">
            {data.domain || "Link"}
          </p>
          <p className="font-bold text-sm text-[#2D120D] mt-0.5 line-clamp-2">{data.title || url}</p>
          {data.description && (
            <p className="text-xs text-[#6E5952] mt-1 line-clamp-2 leading-relaxed">{data.description}</p>
          )}
        </div>
        <ExternalLink className="w-3.5 h-3.5 text-[#6E5952] shrink-0 mt-1" />
      </div>
    </div>
  );

  if (data.kind === "project" && data.projectId) {
    return <Link to={href}>{inner}</Link>;
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {inner}
    </a>
  );
}
