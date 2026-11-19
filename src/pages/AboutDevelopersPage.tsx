import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, Pencil, Plus } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { useAuth } from "../auth/AuthContext";
import { CharacterStage } from "./about/CharacterStage";
import { BuilderDesk, BuiltSection, ClosingSection, StorySection } from "./about/LowerSections";
import {
  STORAGE_KEY,
  compressPortrait,
  loadDevelopers,
  loadPortraitOverrides,
  portraitOf,
  savePortraitOverrides,
  type PortraitSlot,
  type TeamDeveloper,
} from "./about/team";

export type { TeamDeveloper };

export function AboutDevelopersPage() {
  const { user } = useAuth();
  const canCustomize = Boolean(user?.is_platform_admin);
  const [developers, setDevelopers] = useState<TeamDeveloper[]>(loadDevelopers);
  const [editingRequested, setEditingRequested] = useState(false);
  const editing = canCustomize && editingRequested;
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [portraits, setPortraits] = useState(loadPortraitOverrides);
  const [portraitError, setPortraitError] = useState<string | null>(null);

  useEffect(() => {
    const previous = document.title;
    document.title = "The People Behind the Pixels — DevZ-Go";
    return () => {
      document.title = previous;
    };
  }, []);

  const closeDetails = useCallback(() => setSelectedId(null), []);

  function saveList(next: TeamDeveloper[]) {
    setDevelopers(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  }

  function updateField(id: string, field: keyof TeamDeveloper, value: string) {
    saveList(developers.map((dev) => (dev.id === id ? { ...dev, [field]: value } : dev)));
  }

  function addDeveloper() {
    saveList([
      ...developers,
      {
        id: `dev-${Date.now()}`,
        name: `Developer 0${developers.length + 1}`,
        role: "Full-Stack Developer",
        tagline: "Building tools and experiences on DevZ-Go.",
        craft: "Builder",
        focus: "",
        profileId: `usr-dev-${developers.length + 1}`,
      },
    ]);
  }

  function removeDeveloper(id: string) {
    if (developers.length <= 1) return;
    if (selectedId === id) setSelectedId(null);
    saveList(developers.filter((dev) => dev.id !== id));
  }

  async function updatePortrait(slot: PortraitSlot, file: File | null) {
    setPortraitError(null);
    if (!file) {
      const next = { ...portraits };
      delete next[slot];
      setPortraits(next);
      savePortraitOverrides(next);
      return;
    }
    try {
      const url = await compressPortrait(file);
      const next = { ...portraits, [slot]: url };
      setPortraits(next);
      savePortraitOverrides(next);
    } catch (err) {
      setPortraitError(err instanceof Error ? err.message : "Could not use that picture.");
    }
  }

  const left = developers.find((dev) => portraitOf(dev)?.place === "left") ?? null;
  const centerLeft = developers.find((dev) => portraitOf(dev)?.place === "center-left") ?? null;
  const centerRight = developers.find((dev) => portraitOf(dev)?.place === "center-right") ?? null;
  const right = developers.find((dev) => portraitOf(dev)?.place === "right") ?? null;
  const placed = new Set([left?.id, centerLeft?.id, centerRight?.id, right?.id].filter(Boolean));
  const others = developers.filter((dev) => !placed.has(dev.id));

  return (
    <div className="min-h-screen bg-[#f8f6f0] text-stone-900">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-5 pb-8 pt-24 sm:px-8">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-maroon-800">The people behind DevZ-Go</p>
          <h1 className="mt-2 font-serif text-4xl font-normal tracking-tight text-stone-900 sm:text-5xl">Meet the builders.</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-stone-600 sm:text-base">
            Different minds. Shared vision. A platform made to build.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link to="/home" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 text-xs font-semibold text-stone-800 hover:bg-stone-50">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to home
            </Link>
            {canCustomize && (
              <button
                type="button"
                onClick={() => {
                  setEditingRequested((value) => !value);
                  setSelectedId(null);
                }}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-maroon-800 via-maroon-700 to-autumn-rust px-4 text-xs font-semibold text-white shadow-md shadow-maroon-800/20"
              >
                {editing ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                {editing ? "Done editing" : "Customize team profiles"}
              </button>
            )}
          </div>
        </header>

        <CharacterStage
          left={left}
          centerLeft={centerLeft}
          centerRight={centerRight}
          right={right}
          others={others}
          editing={editing}
          canRemove={developers.length > 1}
          hoverId={hoverId}
          selectedId={selectedId}
          onHover={setHoverId}
          onSelect={(dev) => {
            if (!editing) setSelectedId(dev.id);
          }}
          onClear={closeDetails}
          onChange={updateField}
          onRemove={removeDeveloper}
          portraits={portraits}
          onPortrait={(slot, file) => void updatePortrait(slot, file)}
          portraitError={portraitError}
        />

        {editing && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={addDeveloper}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 text-xs font-semibold text-stone-800 hover:border-maroon-800"
            >
              <Plus className="h-4 w-4 text-maroon-800" />
              Add another developer
            </button>
          </div>
        )}

        <BuilderDesk />
        <StorySection />
        <BuiltSection />
      </main>

      <ClosingSection />
    </div>
  );
}
