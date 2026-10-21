import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchUserCollaborations } from "../api/collaborations";
import { queryKeys } from "../api/queryKeys";
import { ui } from "../styles/editorial";

/** Projects this person joined, limited by the server to what the viewer may see; hidden when empty. */
export function CollaboratingOn({ userId }: { userId: string }) {
  const { data } = useQuery({
    queryKey: [...queryKeys.collab, "profile", userId],
    queryFn: () => fetchUserCollaborations(userId),
  });
  if (!data?.length) return null;
  return (
    <section className={`mb-8 p-5 ${ui.card}`}>
      <h2 className="mb-3 font-cursive text-3xl font-bold text-[#1C1917]">Collaborating on</h2>
      <ul className="flex flex-wrap gap-2">
        {data.map((p) => (
          <li key={p.id}>
            <Link to={`/project/${p.id}`} className="inline-block rounded-xl border border-forest-600/40 bg-[#FDFBF7] px-3 py-2 font-sans text-sm hover:border-crimson-600 transition">
              <span className="font-semibold text-[#1C1917]">{p.title}</span>
              <span className="block text-xs text-stone-500">
                {p.contribution_info}{p.owner_username ? ` · with @${p.owner_username}` : ""}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
