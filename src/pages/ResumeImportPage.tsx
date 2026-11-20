import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload } from "lucide-react";
import { Navbar } from "../components/Navbar";
import {
  CATEGORY_LABELS,
  confirmImport,
  importFromPortfolioResume,
  uploadCareerImport,
  type ImportJob,
  type ImportItem,
  type ImportSaveAs,
} from "../api/career";
import { fetchMyProfile } from "../api/profiles";
import { ui } from "../styles/editorial";
import { getApiErrorMessage } from "../utils/apiError";

type ItemValue = Record<string, unknown>;

function baseValue(item: ImportItem): ItemValue {
  return { ...((item.normalized_value || item.extracted_value || {}) as ItemValue) };
}

function asText(v: unknown) {
  return v == null ? "" : String(v);
}

function asNum(v: unknown): number | "" {
  if (v == null || v === "") return "";
  const n = Number(v);
  return Number.isFinite(n) ? n : "";
}

export function ResumeImportPage() {
  const qc = useQueryClient();
  const profile = useQuery({ queryKey: ["my-profile-resume"], queryFn: fetchMyProfile });
  const [job, setJob] = useState<ImportJob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<Record<string, string>>({});
  const [edits, setEdits] = useState<Record<string, ItemValue>>({});
  const [saveAs, setSaveAs] = useState<Record<string, ImportSaveAs>>({});
  const [autoTried, setAutoTried] = useState(false);

  const hasPortfolioResume = Boolean(profile.data?.resumeUrl);

  function applyJob(uploaded: ImportJob, extraNotice?: string) {
    setJob(uploaded);
    const nextDecisions: Record<string, string> = {};
    const nextEdits: Record<string, ItemValue> = {};
    const nextSaveAs: Record<string, ImportSaveAs> = {};
    for (const item of uploaded.items) {
      nextDecisions[item.id] =
        item.item_type === "experience" || item.item_type === "education" || item.item_type === "certification"
          ? "confirmed"
          : "rejected";
      nextEdits[item.id] = baseValue(item);
      nextSaveAs[item.id] = (["experience", "education", "skill", "certification"].includes(item.item_type)
        ? item.item_type
        : "skill") as ImportSaveAs;
    }
    setDecisions(nextDecisions);
    setEdits(nextEdits);
    setSaveAs(nextSaveAs);
    if (uploaded.analysis?.scanned_or_empty) {
      setNotice("Little extractable text was found. Use manual career entry — OCR is disabled by default.");
    } else if (extraNotice) {
      setNotice(extraNotice);
    }
  }

  function patchEdit(id: string, patch: ItemValue) {
    setEdits((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), ...patch } }));
  }

  async function fromPortfolio() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      applyJob(
        await importFromPortfolioResume(),
        "Using your portfolio PDF — edit anything below before confirming. Skills can be saved as certificates.",
      );
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (autoTried || job || profile.isLoading || !hasPortfolioResume) return;
    setAutoTried(true);
    void fromPortfolio();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when portfolio resume is known
  }, [autoTried, job, profile.isLoading, hasPortfolioResume]);

  async function onFile(file: File | null) {
    if (!file) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      applyJob(await uploadCareerImport(file));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    if (!job) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await confirmImport(
        job.id,
        job.items.map((item) => {
          const publishAs = saveAs[item.id] || (item.item_type as ImportSaveAs);
          let value = { ...(edits[item.id] || baseValue(item)) };
          if (publishAs === "certification" && !asText(value.name).trim()) {
            value = {
              ...value,
              name: asText(value.name || value.title || value.institution).trim(),
            };
          }
          return {
            item_id: item.id,
            review_state: decisions[item.id] || "rejected",
            visibility: "connections" as const,
            normalized_value: value,
            save_as: publishAs,
          };
        }),
      );
      setJob(updated);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["career"] }),
        qc.invalidateQueries({ queryKey: ["badges"] }),
      ]);
      setNotice("Confirmed. Edited values were saved — open Portfolio and Badges to review.");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function label(item: ImportItem) {
    const v = edits[item.id] || baseValue(item);
    const publishAs = saveAs[item.id] || item.item_type;
    if (publishAs === "experience") return `${asText(v.title) || "Role"} @ ${asText(v.organization) || "?"}`;
    if (publishAs === "education") return `${asText(v.institution) || "School"}${v.degree ? ` · ${asText(v.degree)}` : ""}`;
    if (publishAs === "certification") return `Certificate: ${asText(v.name || v.title) || "?"}`;
    if (publishAs === "skill") return `Skill: ${asText(v.name) || "?"}`;
    return item.field_path;
  }

  function renderEditors(item: ImportItem) {
    const locked = job?.status === "confirmed";
    const v = edits[item.id] || baseValue(item);
    const publishAs = saveAs[item.id] || (item.item_type as ImportSaveAs);

    if (publishAs === "experience") {
      return (
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <input className={ui.input} disabled={locked} placeholder="Title" value={asText(v.title)}
            onChange={(e) => patchEdit(item.id, { title: e.target.value })} />
          <input className={ui.input} disabled={locked} placeholder="Organization" value={asText(v.organization)}
            onChange={(e) => patchEdit(item.id, { organization: e.target.value })} />
          <select className={ui.input} disabled={locked} value={asText(v.category) || "full_time"}
            onChange={(e) => patchEdit(item.id, { category: e.target.value })}>
            {Object.entries(CATEGORY_LABELS).map(([key, labelText]) => (
              <option key={key} value={key}>{labelText}</option>
            ))}
          </select>
          <input className={ui.input} disabled={locked} placeholder="Location" value={asText(v.location)}
            onChange={(e) => patchEdit(item.id, { location: e.target.value })} />
          <input className={ui.input} disabled={locked} type="number" placeholder="Start year" value={asNum(v.start_year)}
            onChange={(e) => patchEdit(item.id, { start_year: e.target.value ? Number(e.target.value) : null })} />
          <input className={ui.input} disabled={locked} type="number" min={1} max={12} placeholder="Start month" value={asNum(v.start_month)}
            onChange={(e) => patchEdit(item.id, { start_month: e.target.value ? Number(e.target.value) : null })} />
          <input className={ui.input} disabled={locked || Boolean(v.is_current)} type="number" placeholder="End year" value={asNum(v.end_year)}
            onChange={(e) => patchEdit(item.id, { end_year: e.target.value ? Number(e.target.value) : null })} />
          <input className={ui.input} disabled={locked || Boolean(v.is_current)} type="number" min={1} max={12} placeholder="End month" value={asNum(v.end_month)}
            onChange={(e) => patchEdit(item.id, { end_month: e.target.value ? Number(e.target.value) : null })} />
          <label className="flex items-center gap-2 text-xs text-stone-600 sm:col-span-2">
            <input type="checkbox" disabled={locked} checked={Boolean(v.is_current)}
              onChange={(e) => patchEdit(item.id, { is_current: e.target.checked, end_year: e.target.checked ? null : v.end_year, end_month: e.target.checked ? null : v.end_month })} />
            Current role
          </label>
          <textarea className={`${ui.input} sm:col-span-2`} disabled={locked} rows={2} placeholder="Description"
            value={asText(v.description)} onChange={(e) => patchEdit(item.id, { description: e.target.value })} />
        </div>
      );
    }

    if (publishAs === "education") {
      return (
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <input className={ui.input} disabled={locked} placeholder="Institution" value={asText(v.institution)}
            onChange={(e) => patchEdit(item.id, { institution: e.target.value })} />
          <input className={ui.input} disabled={locked} placeholder="Degree" value={asText(v.degree)}
            onChange={(e) => patchEdit(item.id, { degree: e.target.value })} />
          <input className={`${ui.input} sm:col-span-2`} disabled={locked} placeholder="Field of study" value={asText(v.field_of_study)}
            onChange={(e) => patchEdit(item.id, { field_of_study: e.target.value })} />
          <input className={ui.input} disabled={locked} type="number" placeholder="Start year" value={asNum(v.start_year)}
            onChange={(e) => patchEdit(item.id, { start_year: e.target.value ? Number(e.target.value) : null })} />
          <input className={ui.input} disabled={locked} type="number" min={1} max={12} placeholder="Start month" value={asNum(v.start_month)}
            onChange={(e) => patchEdit(item.id, { start_month: e.target.value ? Number(e.target.value) : null })} />
          <input className={ui.input} disabled={locked || Boolean(v.is_current)} type="number" placeholder="End year" value={asNum(v.end_year)}
            onChange={(e) => patchEdit(item.id, { end_year: e.target.value ? Number(e.target.value) : null })} />
          <input className={ui.input} disabled={locked || Boolean(v.is_current)} type="number" min={1} max={12} placeholder="End month" value={asNum(v.end_month)}
            onChange={(e) => patchEdit(item.id, { end_month: e.target.value ? Number(e.target.value) : null })} />
        </div>
      );
    }

    if (publishAs === "certification") {
      return (
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <input className={ui.input} disabled={locked} placeholder="Certificate name" value={asText(v.name || v.title)}
            onChange={(e) => patchEdit(item.id, { name: e.target.value })} />
          <input className={ui.input} disabled={locked} placeholder="Issuer" value={asText(v.issuer)}
            onChange={(e) => patchEdit(item.id, { issuer: e.target.value })} />
          <input className={ui.input} disabled={locked} type="number" placeholder="Year" value={asNum(v.year)}
            onChange={(e) => patchEdit(item.id, { year: e.target.value ? Number(e.target.value) : null })} />
          <input className={ui.input} disabled={locked} type="number" min={1} max={12} placeholder="Month" value={asNum(v.month)}
            onChange={(e) => patchEdit(item.id, { month: e.target.value ? Number(e.target.value) : null })} />
          <input className={`${ui.input} sm:col-span-2`} disabled={locked} placeholder="Credential URL (optional)" value={asText(v.credential_url)}
            onChange={(e) => patchEdit(item.id, { credential_url: e.target.value })} />
        </div>
      );
    }

    return (
      <div className="mt-2">
        <input className={ui.input} disabled={locked} placeholder="Skill name" value={asText(v.name)}
          onChange={(e) => patchEdit(item.id, { name: e.target.value })} />
      </div>
    );
  }

  return (
    <div className={ui.page}>
      <Navbar />
      <main className={`${ui.main} max-w-5xl`}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-maroon-800">Free for all developers</p>
        <h1 className={ui.title}>Resume import</h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-600">
          Extracted experience and skills are editable before confirm. Mis-tagged skills can be saved as certificates instead.
        </p>

        {hasPortfolioResume ? (
          <div className="mt-6 rounded-3xl border border-stone-200 bg-white p-5">
            <p className="text-sm font-semibold text-stone-900">Portfolio resume found</p>
            <p className="mt-1 text-sm text-stone-600">
              Extraction uses that same PDF. Edit proposals below
              {busy && !job ? " — loading…" : "."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className={`${ui.btn} ${ui.primary}`} disabled={busy} onClick={() => void fromPortfolio()}>
                {busy && !job ? "Extracting…" : "Extract again from portfolio PDF"}
              </button>
              <Link to="/profile?tab=portfolio" className={`${ui.btn} ${ui.neutral}`}>Open portfolio</Link>
            </div>
          </div>
        ) : (
          <label className="mt-6 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-stone-300 bg-white px-6 py-10 hover:border-maroon-800/40">
            <Upload className="h-8 w-8 text-maroon-800" />
            <span className="text-sm font-semibold text-stone-800">Upload a resume to your portfolio first</span>
            <span className="text-xs text-stone-500">Or choose a PDF, DOCX, or LinkedIn CSV here · max 8 MB</span>
            <input type="file" accept=".pdf,.docx,.csv,application/pdf" className="hidden" disabled={busy}
              onChange={(e) => void onFile(e.target.files?.[0] || null)} />
          </label>
        )}

        {hasPortfolioResume && (
          <details className="mt-4 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600">
            <summary className="cursor-pointer font-semibold text-stone-800">Replace with a different file</summary>
            <label className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-stone-300 px-4 py-6 hover:border-maroon-800/40">
              <Upload className="h-5 w-5 text-maroon-800" />
              <span className="text-xs">PDF, DOCX, or LinkedIn CSV</span>
              <input type="file" accept=".pdf,.docx,.csv,application/pdf" className="hidden" disabled={busy}
                onChange={(e) => void onFile(e.target.files?.[0] || null)} />
            </label>
          </details>
        )}

        {busy && <p className="mt-4 flex items-center gap-2 text-sm text-stone-500"><Loader2 className="h-4 w-4 animate-spin" /> Working…</p>}
        {error && <p className={`mt-4 ${ui.error}`}>{error}</p>}
        {notice && <p className="mt-4 text-sm text-forest-800">{notice}</p>}

        {job && (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-stone-200 bg-white p-5">
              <h2 className="font-serif text-xl">Source file</h2>
              <p className="mt-1 text-sm text-stone-600">{job.original_filename} · {job.format} · {job.status}</p>
              {job.error && <p className={`mt-2 ${ui.error}`}>{job.error}</p>}
              {job.analysis && (
                <div className="mt-4 space-y-2 text-sm text-stone-700">
                  <p className="font-semibold">Free analysis</p>
                  <p className="text-xs text-stone-500">Not a score or ranking — suggestions only.</p>
                  <p>Missing sections: {(job.analysis.missing_sections as string[] | undefined)?.join(", ") || "none flagged"}</p>
                  <p>Skills mentioned: {(job.analysis.skills_mentioned as string[] | undefined)?.join(", ") || "none"}</p>
                </div>
              )}
              <Link to="/profile?tab=portfolio&section=experience" className={`${ui.link} mt-4 inline-block`}>Back to portfolio career</Link>
            </div>
            <div className="rounded-3xl border border-stone-200 bg-white p-5">
              <h2 className="font-serif text-xl">Extracted proposals</h2>
              <p className="mt-1 text-xs text-stone-500">Edit fields, then confirm or reclassify (e.g. skill → certificate).</p>
              <ul className="mt-3 max-h-[36rem] space-y-3 overflow-y-auto">
                {job.items.length === 0 && <li className="text-sm text-stone-500">No fields extracted. Enter experience manually on Portfolio.</li>}
                {job.items.map((item) => {
                  const publishAs = saveAs[item.id] || (item.item_type as ImportSaveAs);
                  return (
                    <li key={item.id} className="rounded-xl border border-stone-100 px-3 py-3">
                      <p className="text-sm font-medium text-stone-800">{label(item)}</p>
                      <p className="text-[11px] text-stone-500">
                        Extracted as {item.item_type} · {item.confidence} confidence
                        {publishAs !== item.item_type ? ` · saving as ${publishAs}` : ""}
                      </p>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        <select
                          className={ui.input}
                          value={decisions[item.id] || "rejected"}
                          onChange={(e) => setDecisions({ ...decisions, [item.id]: e.target.value })}
                          disabled={job.status === "confirmed"}
                        >
                          <option value="confirmed">Confirm</option>
                          <option value="rejected">Reject</option>
                          <option value="pending_review">Skip for now</option>
                        </select>
                        <select
                          className={ui.input}
                          value={publishAs}
                          disabled={job.status === "confirmed"}
                          onChange={(e) => {
                            const next = e.target.value as ImportSaveAs;
                            setSaveAs({ ...saveAs, [item.id]: next });
                            if (next === "certification") {
                              const cur = edits[item.id] || baseValue(item);
                              if (!asText(cur.name).trim()) {
                                patchEdit(item.id, { name: asText(cur.name || cur.title || cur.institution) });
                              }
                              if (decisions[item.id] === "rejected") {
                                setDecisions({ ...decisions, [item.id]: "confirmed" });
                              }
                            }
                          }}
                        >
                          <option value="experience">Save as experience</option>
                          <option value="education">Save as education</option>
                          <option value="skill">Save as skill</option>
                          <option value="certification">Save as certificate</option>
                        </select>
                      </div>
                      {renderEditors(item)}
                    </li>
                  );
                })}
              </ul>
              {job.status !== "confirmed" && job.items.length > 0 && (
                <button type="button" className={`${ui.btn} ${ui.primary} mt-4`} disabled={busy} onClick={() => void confirm()}>
                  Confirm selected into career profile
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
