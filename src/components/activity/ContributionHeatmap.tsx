import { useEffect, useMemo, useRef, useState } from "react";
import { DAY_MS as DAY, dayString as iso, describeDay, parseDay as parse } from "./format";

const LEVELS = ["#EFE9DC", "#F8D0D7", "#E67184", "#B32842", "#5E1522"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type Cell = { day: string; commits: number; pushes: number; future: boolean };

/** A year of daily commits and pushes, one column per week, in the viewer's time zone. */
export function ContributionHeatmap({ rows, start, today, selected, onSelect }: {
  rows: [string, number, number][];
  start: string;
  today: string;
  selected: string | null;
  onSelect: (day: string | null) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<Cell | null>(null);

  const { weeks, months, max } = useMemo(() => {
    const counts = new Map(rows.map(([day, c, p]) => [day, [c, p] as const]));
    const first = parse(start) - new Date(parse(start)).getUTCDay() * DAY;
    const last = parse(today);
    const columns: Cell[][] = [];
    const labels: { index: number; label: string }[] = [];
    let top = 0;
    for (let week = first, index = 0; week <= last; week += 7 * DAY, index += 1) {
      const column: Cell[] = [];
      for (let d = 0; d < 7; d += 1) {
        const ms = week + d * DAY;
        const day = iso(ms);
        const [commits, pushes] = counts.get(day) ?? [0, 0];
        top = Math.max(top, commits + pushes);
        column.push({ day, commits, pushes, future: ms > last });
        if (new Date(ms).getUTCDate() === 1 && ms <= last) labels.push({ index, label: MONTHS[new Date(ms).getUTCMonth()] });
      }
      columns.push(column);
    }
    return { weeks: columns, months: labels, max: top };
  }, [rows, start, today]);

  useEffect(() => {
    if (scroller.current) scroller.current.scrollLeft = scroller.current.scrollWidth;
  }, [weeks.length]);

  const level = (n: number) => (n === 0 || max === 0 ? 0 : Math.min(4, Math.max(1, Math.ceil((n / max) * 4))));
  const focus = hovered ?? (selected ? weeks.flat().find((c) => c.day === selected) ?? null : null);

  return (
    <div>
      <div ref={scroller} className="overflow-x-auto pb-3 [scrollbar-width:thin]">
        <div className="inline-grid min-w-max grid-cols-[auto_1fr] gap-x-2 [--cell:12px] [--gap:3px] lg:[--cell:14px] lg:[--gap:4px]">
          <span />
          <div className="relative h-5 text-[10px] font-semibold uppercase tracking-wider text-stone-400" aria-hidden>
            {months.map((m) => (
              <span key={`${m.index}-${m.label}`} className="absolute top-0" style={{ left: `calc((var(--cell) + var(--gap)) * ${m.index})` }}>{m.label}</span>
            ))}
          </div>
          <div className="grid grid-rows-7 gap-[var(--gap)] pr-1 text-[10px] text-stone-400" aria-hidden>
            {["", "Mon", "", "Wed", "", "Fri", ""].map((d, i) => <span key={i} className="flex h-[var(--cell)] items-center">{d}</span>)}
          </div>
          <div className="flex gap-[var(--gap)]" role="grid" aria-label="Daily commits and pushes over the last year">
            {weeks.map((column, w) => (
              <div key={w} className="grid grid-rows-7 gap-[var(--gap)]" role="row">
                {column.map((cell) => {
                  const total = cell.commits + cell.pushes;
                  const active = cell.day === selected;
                  const style = { backgroundColor: cell.future ? "transparent" : LEVELS[level(total)] };
                  const ring = active ? "ring-2 ring-[#E0B100] ring-offset-1 ring-offset-white" : "";
                  if (cell.future) return <span key={cell.day} className="h-[var(--cell)] w-[var(--cell)]" role="gridcell" />;
                  return total ? (
                    <button key={cell.day} type="button" role="gridcell" style={style}
                      aria-label={describeDay(cell.day, cell.commits, cell.pushes)} aria-pressed={active}
                      onMouseEnter={() => setHovered(cell)} onMouseLeave={() => setHovered(null)}
                      onFocus={() => setHovered(cell)} onBlur={() => setHovered(null)}
                      onClick={() => onSelect(active ? null : cell.day)}
                      className={`h-[var(--cell)] w-[var(--cell)] rounded-[3px] transition hover:scale-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon-500 ${ring}`} />
                  ) : (
                    <span key={cell.day} role="gridcell" style={style} title={describeDay(cell.day, 0, 0)}
                      onMouseEnter={() => setHovered(cell)} onMouseLeave={() => setHovered(null)}
                      className="h-[var(--cell)] w-[var(--cell)] rounded-[3px]" />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500">
        <p aria-live="polite" className="min-h-4">
          {focus ? describeDay(focus.day, focus.commits, focus.pushes) : "Pick a day to see just that day's activity."}
        </p>
        <span className="flex items-center gap-1.5" aria-hidden>
          Less {LEVELS.map((c) => <span key={c} className="h-3 w-3 rounded-[3px]" style={{ backgroundColor: c }} />)} More
        </span>
      </div>
    </div>
  );
}
