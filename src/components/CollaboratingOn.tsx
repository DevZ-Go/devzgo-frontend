import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchUserCollaborations } from "../api/collaborations";
import { queryKeys } from "../api/queryKeys";

/** Projects this person joined, limited by the server to what the viewer may see; hidden when empty. */
export function CollaboratingOn({ userId }: { userId: string }) {
  const { data } = useQuery({
    queryKey: [...queryKeys.collab, "profile", userId],
    queryFn: () => fetchUserCollaborations(userId),
  });
  if (!data?.length) return null;
  return (
    <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-5">
      <h2 className="mb-3 text-sm font-bold text-gray-900">Collaborating on</h2>
      <ul className="flex flex-wrap gap-2">
        {data.map((p) => (
          <li key={p.id}>
            <Link to={`/project/${p.id}`} className="inline-block rounded-xl border border-gray-200 px-3 py-2 text-sm hover:border-blue-300">
              <span className="font-semibold text-gray-900">{p.title}</span>
              <span className="block text-xs text-gray-500">
                {p.contribution_info}{p.owner_username ? ` · with @${p.owner_username}` : ""}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
