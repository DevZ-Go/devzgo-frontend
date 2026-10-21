// src/pages/WrapPage.tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import type { ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { WrapChapter } from "../components/wrap/WrapChapter";
import { PixelSprite } from "../components/wrap/PixelSprite";
import { POTION, INVADER, CHERRIES, HEART, GHOST } from "../components/wrap/sprites";
import { fetchCurrentWrap, fetchWrap, fetchWrapMonths, shareWrap, type Wrap } from "../api/wraps";
import { queryKeys } from "../api/queryKeys";
import { getApiErrorMessage } from "../utils/apiError";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
const monthName = (month: string) =>
  new Date(`${month}-15T12:00:00Z`).toLocaleDateString(undefined, { month: "long", year: "numeric" });

/** One slide per metric that actually happened; nothing is shown for zero or missing data. */
function chapters(w: Wrap): { title: string; text: string; sprite: ReactNode }[] {
  const m = w.metrics;
  const out: { title: string; text: string; sprite: ReactNode }[] = [];
  const add = (show: unknown, title: string, text: string, sprite: typeof HEART) =>
    show && out.push({ title, text, sprite: <PixelSprite sprite={sprite} size={18} /> });

  add(m.projects_created, `You started ${plural(m.projects_created, "project")}`, "Every one of them is on your profile.", POTION);
  add(m.top_tech.length, `Your stack: ${m.top_tech[0]}`, m.top_tech.join(" • "), INVADER);
  add(m.project_likes_received + m.project_comments_received, "People noticed your work",
    `${plural(m.project_likes_received, "like")} and ${plural(m.project_comments_received, "comment")} on your projects.`, HEART);
  add(m.posts_published, `You posted ${plural(m.posts_published, "time")}`,
    `${plural(m.post_likes_received, "like")} and ${plural(m.post_comments_received, "comment")} came back.`, CHERRIES);
  add(m.connections_made, `${plural(m.connections_made, "new connection")}`, "Your network grew.", GHOST);
  add(m.projects_joined + m.members_joined_my_projects + m.invitations_sent, "Built together",
    `${plural(m.projects_joined, "project")} joined, ${plural(m.members_joined_my_projects, "member")} joined yours, ${plural(m.invitations_sent, "invitation")} sent.`, HEART);
  add(m.top_liked_category, `You liked ${m.top_liked_category} projects the most`, "Based on the projects you liked.", CHERRIES);
  return out;
}

function Center({ children }: { children: ReactNode }) {
  return <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-8 text-center">{children}</div>;
}

export function WrapPage() {
  const client = useQueryClient();
  const [params, setParams] = useSearchParams();
  const picked = params.get("month");
  const months = useQuery({ queryKey: [...queryKeys.wrap("list")], queryFn: fetchWrapMonths });
  const wrap = useQuery({
    queryKey: queryKeys.wrap(picked ?? "current"),
    queryFn: () => (picked ? fetchWrap(picked) : fetchCurrentWrap()),
    retry: (count, err) => count < 1 && !(axios.isAxiosError(err) && err.response?.status === 404),
  });
  const share = useMutation({
    mutationFn: () => shareWrap(wrap.data!.month),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: queryKeys.wrap(wrap.data!.month) });
      void client.invalidateQueries({ queryKey: queryKeys.feed });
    },
  });

  const w = wrap.data;
  const code = axios.isAxiosError(wrap.error) ? (wrap.error.response?.data as { code?: string } | undefined)?.code : undefined;

  return (
    <main className="h-screen overflow-y-scroll snap-y snap-mandatory bg-[#f2f2f2]">
      <header className="fixed left-0 right-0 top-0 z-10 flex items-center justify-between gap-3 bg-[#f2f2f2]/90 px-6 py-3 backdrop-blur">
        <Link to="/home" className="text-sm font-semibold text-gray-700 hover:underline">← DevZ-Go</Link>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          Month
          <select value={picked ?? ""} aria-label="Wrap month" className="rounded-lg border border-gray-300 bg-white px-2 py-1"
            onChange={(e) => setParams(e.target.value ? { month: e.target.value } : {})}>
            <option value="">This month (so far)</option>
            {(months.data ?? []).map((m) => <option key={m} value={m}>{monthName(m)}</option>)}
          </select>
        </label>
      </header>

      {wrap.isPending ? (
        <Center>
          <div className="h-10 w-64 animate-pulse rounded bg-gray-300" />
          <div className="h-4 w-48 animate-pulse rounded bg-gray-300" />
        </Center>
      ) : code === "not_ready" ? (
        <Center>
          <h2 className="text-3xl font-black">Your wrap is being prepared</h2>
          <p className="text-gray-600">Finished months are stored a few hours after they end. Check back soon.</p>
        </Center>
      ) : wrap.isError ? (
        <Center>
          <h2 className="text-2xl font-bold">Could not load your wrap</h2>
          <p className="text-gray-600">{getApiErrorMessage(wrap.error)}</p>
          <button className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white" onClick={() => void wrap.refetch()}>Try again</button>
        </Center>
      ) : w!.empty ? (
        <Center>
          <h2 className="text-3xl font-black">{w!.status === "completed" ? `Nothing happened in ${monthName(w!.month)}` : "Your month is just getting started"}</h2>
          <p className="max-w-md text-gray-600">Your wrap fills in from real activity: projects, posts, connections and collaborations.</p>
          <div className="flex gap-3">
            <Link to="/add-project" className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white">Add a project</Link>
            <Link to="/network" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold">Visit the network</Link>
          </div>
        </Center>
      ) : (
        <>
          <section className="flex h-screen snap-start flex-col items-center justify-center gap-3 px-8 text-center">
            <span className="font-mono text-sm tracking-widest text-gray-500">
              {w!.status === "completed" ? "MONTHLY WRAP" : `SO FAR · AS OF ${new Date(w!.as_of!).toLocaleString()}`}
            </span>
            <h1 className="text-5xl font-black md:text-7xl">{monthName(w!.month)}</h1>
            <p className="text-gray-600">Times in {w!.period.timezone}. Scroll down.</p>
          </section>
          {chapters(w!).map((c, i) => (
            <WrapChapter key={c.title} index={String(i + 1).padStart(2, "0")} title={c.title} text={c.text}>{c.sprite}</WrapChapter>
          ))}
          <WrapChapter index="★" title={w!.persona?.label ?? "That's your month"} text={w!.persona ? `Why: ${w!.persona.rule}.` : ""}>
            <div className="flex flex-col items-center gap-3">
              <PixelSprite sprite={GHOST} size={18} />
              {w!.status === "completed" && (w!.shared || share.isSuccess ? (
                <Link to="/network" className="text-sm font-semibold text-emerald-700">Shared to your feed ✓</Link>
              ) : (
                <button className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  disabled={share.isPending} onClick={() => share.mutate()}>Share to feed</button>
              ))}
              {share.isError && <p className="text-sm text-red-600">{getApiErrorMessage(share.error)}</p>}
            </div>
          </WrapChapter>
        </>
      )}
    </main>
  );
}
