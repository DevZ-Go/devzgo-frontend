import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchInsights, type UsageStat } from "../../api/admin";
import { ui } from "../../styles/editorial";
import { Loading, panel } from "./bits";

const RANGES = [7, 30, 90] as const;

export function InsightsPage() {
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);
  const insights = useQuery({ queryKey: ["admin", "insights", days], queryFn: () => fetchInsights(days) });

  const data = insights.data;
  const pages = useMemo(() => {
    const rows = data?.pages ?? data?.rows ?? [];
    return rows.filter((row) => (row.kind ?? "page") === "page");
  }, [data]);
  const features = useMemo(() => {
    const rows = data?.pages ?? data?.rows ?? [];
    return rows.filter((row) => row.kind === "feature");
  }, [data]);

  const gallery = data?.gallery ?? pickStat(pages, "visit.gallery", "Gallery");
  const tv = data?.tv ?? pickStat(pages, "visit.tv", "TV World");
  const horizontal = data?.horizontal ?? pickStat(features, "scroll.horizontal", "Horizontal scrolling");
  const vertical = data?.vertical ?? pickStat(features, "scroll.vertical", "Vertical scrolling");
  const busiest = pages[0]?.count ?? 0;

  if (insights.isLoading) return <Loading label="Gathering visits" />;
  if (insights.isError || !data) {
    return <p className={ui.error}>Insights could not be loaded.</p>;
  }

  const areas = data.areas?.length
    ? data.areas
    : Array.from(new Set(pages.map((p) => p.group).filter(Boolean) as string[]));

  return (
    <div className="space-y-4">
      <section className={panel}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className={ui.heading}>How people move</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
              A quiet count of pages opened in the last {data.days} days. Names, messages, and anything someone typed are not part of this.
            </p>
          </div>
          <div className="flex gap-2" role="group" aria-label="Time range">
            {RANGES.map((range) => (
              <button
                key={range}
                type="button"
                className={`${ui.btn} px-3 py-2 text-sm ${days === range ? ui.primary : ui.neutral}`}
                onClick={() => setDays(range)}
              >
                {range} days
              </button>
            ))}
          </div>
        </div>
        <p className="mt-4 font-serif text-3xl font-bold text-[#2D120D]">
          {data.visits}{" "}
          <span className="font-sans text-base font-semibold text-stone-500">
            visits from {data.people} {data.people === 1 ? "person" : "people"}
          </span>
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Split
          title="Gallery and TV World"
          hint="Gallery is the project studio. TV World is the retro room."
          left={gallery}
          right={tv}
        />
        <Split
          title="Gallery scrolling"
          hint="Counted when the gallery is on screen, and again when someone switches direction."
          left={horizontal}
          right={vertical}
        />
      </div>

      {areas.map((area) => {
        const groupPages = pages.filter((p) => (p.group || "Other") === area);
        if (groupPages.length === 0) return null;
        const localBusy = Math.max(...groupPages.map((p) => p.count), 0);
        return (
          <section key={area} className={panel}>
            <h2 className={ui.heading}>{area}</h2>
            <ol className="mt-4 space-y-3">
              {groupPages.map((page) => (
                <li key={page.key}>
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-semibold text-[#2D120D]">{page.label}</p>
                    <p className="shrink-0 text-sm tabular-nums text-stone-600">
                      {page.count}{" "}
                      <span className="text-xs text-stone-500">
                        · {page.people} {page.people === 1 ? "person" : "people"}
                      </span>
                    </p>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#E7E5E4]" aria-hidden>
                    <div
                      className="h-full rounded-full bg-[#6B0B0C]"
                      style={{
                        width: `${localBusy ? Math.max(6, Math.round((page.count / localBusy) * 100)) : 0}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ol>
          </section>
        );
      })}

      {pages.length === 0 && (
        <section className={panel}>
          <h2 className={ui.heading}>Pages people open</h2>
          <p className="mt-3 text-sm text-stone-600">
            Nothing has been counted in this stretch yet. Visits begin the next time someone moves through DevZ-Go.
          </p>
        </section>
      )}

      {pages.length > 0 && areas.length === 0 && (
        <section className={panel}>
          <h2 className={ui.heading}>Pages people open</h2>
          <ol className="mt-4 space-y-3">
            {pages.map((page) => (
              <li key={page.key}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-semibold text-[#2D120D]">{page.label}</p>
                  <p className="shrink-0 text-sm tabular-nums text-stone-600">
                    {page.count}{" "}
                    <span className="text-xs text-stone-500">
                      · {page.people} {page.people === 1 ? "person" : "people"}
                    </span>
                  </p>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#E7E5E4]" aria-hidden>
                  <div
                    className="h-full rounded-full bg-[#6B0B0C]"
                    style={{ width: `${busiest ? Math.max(6, Math.round((page.count / busiest) * 100)) : 0}%` }}
                  />
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

function pickStat(rows: UsageStat[], key: string, label: string): UsageStat {
  return rows.find((r) => r.key === key) ?? { key, label, count: 0, people: 0 };
}

function Split({ title, hint, left, right }: { title: string; hint: string; left: UsageStat; right: UsageStat }) {
  const total = (left?.count ?? 0) + (right?.count ?? 0);
  const leftShare = total ? Math.round((left.count / total) * 100) : 0;
  const rightShare = total ? 100 - leftShare : 0;
  return (
    <section className={panel}>
      <h2 className={ui.heading}>{title}</h2>
      <p className="mt-1 text-sm text-stone-600">{hint}</p>
      <div
        className="mt-4 flex h-3 overflow-hidden rounded-full bg-[#E7E5E4]"
        role="img"
        aria-label={`${left.label} ${left.count} visits, ${right.label} ${right.count} visits`}
      >
        <div className="h-full bg-[#6B0B0C]" style={{ width: `${leftShare}%` }} />
        <div className="h-full bg-[#284E45]" style={{ width: `${rightShare}%` }} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Side stat={left} swatch="bg-[#6B0B0C]" share={leftShare} />
        <Side stat={right} swatch="bg-[#284E45]" share={rightShare} />
      </div>
    </section>
  );
}

function Side({ stat, swatch, share }: { stat: UsageStat; swatch: string; share: number }) {
  return (
    <div>
      <p className="flex items-center gap-2 text-sm font-semibold text-[#2D120D]">
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${swatch}`} aria-hidden />
        {stat.label}
      </p>
      <p className="mt-1 font-serif text-2xl font-bold text-[#2D120D]">{stat.count}</p>
      <p className="text-xs text-stone-500">
        {share}% · {stat.people} {stat.people === 1 ? "person" : "people"}
      </p>
    </div>
  );
}
