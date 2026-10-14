import { useEffect, useState } from "react";
import { setProjectLiked } from "../api/projects";

/** Like state for one project: flips instantly, then settles on the server's numbers (or reverts on error). */
export function useProjectLike(projectId: string, initialCount: number, initialLiked: boolean) {
  const [state, setState] = useState({ count: initialCount, liked: initialLiked });
  const [busy, setBusy] = useState(false);

  useEffect(() => setState({ count: initialCount, liked: initialLiked }), [projectId, initialCount, initialLiked]);

  async function toggle() {
    if (busy) return;
    const prev = state;
    const liked = !prev.liked;
    setState({ liked, count: Math.max(0, prev.count + (liked ? 1 : -1)) });
    setBusy(true);
    try {
      const res = await setProjectLiked(projectId, liked);
      setState({ liked: res.is_liked, count: res.likes_count });
    } catch {
      setState(prev);
    } finally {
      setBusy(false);
    }
  }

  return { ...state, busy, toggle };
}
