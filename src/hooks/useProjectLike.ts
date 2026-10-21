import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { setProjectLiked } from "../api/projects";
import { queryKeys } from "../api/queryKeys";

type LikeState = { count: number; liked: boolean };

/**
 * Like state for one project, shared by every card, page and feed preview showing it.
 * Flips instantly, then settles on the server's numbers (or reverts on error).
 */
export function useProjectLike(projectId: string, initialCount: number, initialLiked: boolean) {
  const client = useQueryClient();
  const key = queryKeys.projectLike(projectId);
  const { data = { count: initialCount, liked: initialLiked } } = useQuery<LikeState>({
    queryKey: key,
    queryFn: () => client.getQueryData<LikeState>(key) ?? { count: initialCount, liked: initialLiked },
    initialData: { count: initialCount, liked: initialLiked },
    staleTime: Infinity,
  });

  // A parent that refetched hands down newer server numbers; the first render keeps whatever is already shared.
  const seen = useRef(`${initialCount}|${initialLiked}`);
  useEffect(() => {
    const next = `${initialCount}|${initialLiked}`;
    if (seen.current === next) return;
    seen.current = next;
    client.setQueryData<LikeState>(queryKeys.projectLike(projectId), { count: initialCount, liked: initialLiked });
  }, [client, projectId, initialCount, initialLiked]);

  const mutation = useMutation({
    mutationFn: (liked: boolean) => setProjectLiked(projectId, liked),
    onMutate: (liked) => {
      const prev = client.getQueryData<LikeState>(key);
      client.setQueryData<LikeState>(key, { liked, count: Math.max(0, data.count + (liked ? 1 : -1)) });
      return prev;
    },
    onError: (_err, _liked, prev) => client.setQueryData(key, prev),
    onSuccess: (res) => client.setQueryData<LikeState>(key, { liked: res.is_liked, count: res.likes_count }),
  });

  const toggle = () => {
    if (!mutation.isPending) mutation.mutate(!data.liked);
  };
  return { ...data, busy: mutation.isPending, toggle };
}
