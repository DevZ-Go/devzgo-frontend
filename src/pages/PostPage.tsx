import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { fetchActivity } from "../api/network";
import { queryKeys } from "../api/queryKeys";
import { FeedItem } from "../features/network/FeedItem";

export function PostPage() {
  const { id = "" } = useParams();
  const [toast, setToast] = useState<string | null>(null);
  const post = useQuery({ queryKey: queryKeys.activity(id), queryFn: () => fetchActivity(id), retry: false });

  function notify(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link to="/network" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-blue-600">
          <ArrowLeft className="h-4 w-4" /> Back to feed
        </Link>
        {post.isPending ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
        ) : post.isError ? (
          <p className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-600">
            This post was deleted or you can't see it.
          </p>
        ) : (
          <FeedItem activity={post.data} expanded notify={notify} />
        )}
      </main>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-xl bg-gray-900 px-4 py-2 text-sm text-white shadow-lg">{toast}</div>
      )}
    </div>
  );
}
