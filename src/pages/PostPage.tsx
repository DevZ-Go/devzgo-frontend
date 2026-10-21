import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { fetchActivity } from "../api/network";
import { queryKeys } from "../api/queryKeys";
import { FeedItem } from "../features/network/FeedItem";
import { ui } from "../styles/editorial";

export function PostPage() {
  const { id = "" } = useParams();
  const [toast, setToast] = useState<string | null>(null);
  const post = useQuery({ queryKey: queryKeys.activity(id), queryFn: () => fetchActivity(id), retry: false });

  function notify(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <div className={ui.page}>
      <Navbar />
      <main className={`${ui.main} max-w-2xl`}>
        <Link to="/network" className="mb-5 inline-flex items-center gap-1 font-cursive text-2xl font-bold text-forest-800 hover:text-crimson-600">
          <ArrowLeft className="h-4 w-4" /> Back to feed
        </Link>
        {post.isPending ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-forest-700" /></div>
        ) : post.isError ? (
          <p className={ui.empty}>
            This post was deleted or you can't see it.
          </p>
        ) : (
          <FeedItem activity={post.data} expanded notify={notify} />
        )}
      </main>
      {toast && (
        <div className={ui.toast}>{toast}</div>
      )}
    </div>
  );
}
