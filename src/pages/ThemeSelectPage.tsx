import { Link } from "react-router-dom";
import { useExploreProjects } from "../hooks/useExploreProjects";
import { resolveApiAssetUrl } from "../api/config";

function TvThumb() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#1a120c]">
      <div className="absolute inset-x-6 top-4 bottom-8 rounded-lg border-[6px] border-[#3a2a22] bg-black shadow-[0_0_28px_rgba(252,237,150,0.45)]">
        <div className="absolute inset-1 bg-[repeating-linear-gradient(0deg,rgba(252,237,150,0.18)_0px,rgba(252,237,150,0.18)_1px,transparent_1px,transparent_4px)]" />
        <div className="absolute inset-3 rounded-sm bg-gradient-to-b from-[#fced96] to-[#c4552a]" />
      </div>
      <div className="absolute bottom-2 left-1/2 h-2 w-16 -translate-x-1/2 rounded-full bg-[#3a2a22]" />
    </div>
  );
}

function CardsThumb() {
  return (
    <div className="relative h-full w-full bg-[#146b3a]">
      <div className="absolute left-[16%] top-[18%] h-[64%] w-[26%] -rotate-12 rounded-md bg-[#9f1239]" />
      <div className="absolute left-1/2 top-[14%] h-[70%] w-[32%] -translate-x-1/2 rotate-2 rounded-md bg-white shadow">
        <div className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-600" />
      </div>
    </div>
  );
}

function StudioThumb() {
  return (
    <div className="flex h-full w-full items-center justify-center gap-3 bg-[#efe6d4] px-4">
      <div className="h-[58%] w-[22%] border-[5px] border-stone-900 bg-white p-1 shadow">
        <div className="h-full w-full bg-[#d7c4a3]" />
      </div>
      <div className="h-[74%] w-[30%] border-[6px] border-stone-900 bg-[#fced96] p-1 shadow-md">
        <div className="h-full w-full bg-white" />
      </div>
      <div className="h-[50%] w-[18%] border-[5px] border-stone-900 bg-stone-200 p-1 shadow">
        <div className="h-full w-full bg-maroon-800" />
      </div>
    </div>
  );
}

function CatalogThumb({ covers }: { covers: string[] }) {
  const rows = covers.slice(0, 3);
  return (
    <div className="flex h-full w-full flex-col justify-center gap-2 bg-[#f7f5ed] px-4">
      {(rows.length ? rows : ["", "", ""]).slice(0, 3).map((src, i) => (
        <div key={i} className="flex h-8 items-center gap-2 rounded-lg border border-stone-200 bg-white px-2 shadow-sm">
          {src ? (
            <img src={src} alt="" className="h-6 w-8 rounded object-cover" />
          ) : (
            <span className="h-6 w-8 rounded bg-[#efe6d4]" />
          )}
          <span className="h-1.5 flex-1 rounded bg-stone-200" />
        </div>
      ))}
    </div>
  );
}

export function ThemeSelectPage() {
  const data = useExploreProjects();
  const covers = (data.projects ?? [])
    .map((p) => resolveApiAssetUrl(p.cover_image_url || p.image_url))
    .filter((src): src is string => Boolean(src))
    .slice(0, 3);

  const themes = [
    { to: "/explore/tv", name: "TV World", label: "bg-stone-950 text-[#fced96]", thumb: <TvThumb /> },
    { to: "/explore/cards", name: "House of Cards", label: "bg-[#f4efe4] text-stone-900", thumb: <CardsThumb /> },
    { to: "/explore/studio", name: "Studio Wall", label: "bg-white text-stone-900", thumb: <StudioThumb /> },
    { to: "/explore/catalog", name: "Projects", label: "bg-[#f7f5ed] text-stone-900", thumb: <CatalogThumb covers={covers} /> },
  ];

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-stone-950 text-stone-100">
      <header className="flex shrink-0 items-center justify-between px-6 py-4 sm:px-10">
        <Link to="/home" className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400 hover:text-white">
          Home
        </Link>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#fced96]">Explore</p>
      </header>
      <main className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col justify-center px-6 pb-6 sm:px-10">
        <h1 className="font-serif text-4xl text-white sm:text-5xl">Choose a room</h1>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {themes.map((theme) => (
            <Link
              key={theme.to}
              to={theme.to}
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white transition hover:bg-white/[0.08]"
            >
              <div className="h-14 w-20 shrink-0 overflow-hidden rounded-xl opacity-80">{theme.thumb}</div>
              <h2 className="font-serif text-2xl text-inherit sm:text-3xl">{theme.name}</h2>
            </Link>
          ))}
        </div>
        <Link
          to="/explore/developers"
          className="mt-3 flex shrink-0 items-center justify-between rounded-2xl border border-stone-700 bg-stone-900 px-5 py-3 hover:border-[#fced96]"
        >
          <span className="font-serif text-lg text-white">Find developers</span>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#fced96]">Search</span>
        </Link>
      </main>
    </div>
  );
}
