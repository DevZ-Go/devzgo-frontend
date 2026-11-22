import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "../components/Navbar";
import { fetchMyActivity, type MyActivityTab } from "../api/network";
import { getApiErrorMessage } from "../utils/apiError";

const TABS: { id: MyActivityTab; label: string }[] = [
  { id: "saved", label: "Saved" },
  { id: "liked", label: "Liked" },
  { id: "comments", label: "Comments" },
];

export function MyActivityPage() {
  const [tab, setTab] = useState<MyActivityTab>("saved");
  const query = useQuery({
    queryKey: ["me-activity", tab],
    queryFn: () => fetchMyActivity(tab),
    retry: false,
  });

  return (
    <div className="min-h-screen bg-[#FBF8F2] text-[#2D120D]">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <h1 className="font-serif text-3xl font-bold text-[#2D120D]">My Activity</h1>
        <p className="mt-2 text-sm text-[#6E5952]">
          Private to you — likes, comments, and saves across network posts and projects.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                tab === t.id
                  ? "bg-[#780D18] text-white"
                  : "bg-white border border-[#DECDBA] text-[#2D120D] hover:bg-[#FAF7F2]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {query.isLoading && <p className="text-sm text-[#6E5952]">Loading…</p>}
          {query.isError && (
            <p className="text-sm text-crimson-700">{getApiErrorMessage(query.error)}</p>
          )}
          {query.data && query.data.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#DECDBA] bg-white px-5 py-10 text-center">
              <p className="font-semibold text-sm">Nothing here yet</p>
              <p className="text-xs text-[#6E5952] mt-1">
                {tab === "liked" && "Posts and projects you like will show up here."}
                {tab === "comments" && "Your comments will appear here."}
                {tab === "saved" && "Bookmark posts and projects to find them later."}
              </p>
            </div>
          )}
          {query.data?.map((item) => (
            <Link
              key={`${item.kind}-${item.id}`}
              to={item.href}
              className="block rounded-2xl border border-[#DECDBA] bg-white px-4 py-3.5 hover:border-[#780D18] transition"
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#780D18]">{item.kind.replace(/_/g, " ")}</p>
              <p className="font-semibold text-sm text-[#2D120D] mt-1">{item.title || "Item"}</p>
              {item.preview && (
                <p className="text-xs text-[#6E5952] mt-1 line-clamp-2">{item.preview}</p>
              )}
              {item.createdAt && (
                <p className="text-[11px] text-[#6E5952] mt-2">{item.createdAt.slice(0, 19).replace("T", " ")}</p>
              )}
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
