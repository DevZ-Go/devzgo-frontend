import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Lock } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { downloadResumeExport, fetchEntitlements, generateResume, listGeneratedResumes, listResumeTemplates } from "../api/career";
import { ui } from "../styles/editorial";
import { getApiErrorMessage } from "../utils/apiError";

export function ResumeStudioPage() {
  const qc = useQueryClient();
  const entitlements = useQuery({ queryKey: ["entitlements"], queryFn: fetchEntitlements });
  const templates = useQuery({
    queryKey: ["resume-templates"],
    queryFn: listResumeTemplates,
    enabled: Boolean(entitlements.data?.features.some((f) => f.feature === "resume_studio" && f.active)),
  });
  const resumes = useQuery({
    queryKey: ["generated-resumes"],
    queryFn: listGeneratedResumes,
    enabled: Boolean(entitlements.data?.features.some((f) => f.feature === "resume_studio" && f.active)),
  });
  const [title, setTitle] = useState("My DevZ-Go Resume");
  const [template, setTemplate] = useState("classic_ats");
  const [jd, setJd] = useState("");
  const [error, setError] = useState<string | null>(null);

  const active = entitlements.data?.features.some((f) => f.feature === "resume_studio" && f.active);
  const create = useMutation({
    mutationFn: () => generateResume({ title, template_key: template, job_description: jd || undefined }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["generated-resumes"] });
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  return (
    <div className={ui.page}>
      <Navbar />
      <main className={`${ui.main} max-w-3xl`}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-maroon-800">Premium only</p>
        <h1 className={ui.title}>Resume Studio</h1>
        <p className="mt-2 text-sm text-stone-600">
          Generate and export resumes from confirmed career data. Never fabricates employment, dates, or impact numbers.
          Premium does not change recruiter matching or badge eligibility.
        </p>

        {entitlements.isLoading && <p className="mt-6 flex items-center gap-2 text-sm text-stone-500"><Loader2 className="h-4 w-4 animate-spin" /> Checking entitlement…</p>}

        {!entitlements.isLoading && !active && (
          <div className="mt-8 rounded-3xl border border-stone-200 bg-white p-6">
            <Lock className="h-6 w-6 text-maroon-800" />
            <h2 className="mt-2 font-serif text-xl">Resume Studio is Premium</h2>
            <p className="mt-2 text-sm text-stone-600">
              Free users can still upload resumes, import career data, earn badges, and appear in recruiter results.
              Ask an admin for a development grant (`RESUME_STUDIO_DEV_GRANTS`) — payment collection is not enabled yet.
            </p>
            <Link to="/career/import" className={`${ui.link} mt-4 inline-block`}>Go to free resume import</Link>
          </div>
        )}

        {active && (
          <div className="mt-8 space-y-6">
            <div className="rounded-3xl border border-stone-200 bg-white p-5 space-y-3">
              <input className={ui.input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Resume title" />
              <select className={ui.input} value={template} onChange={(e) => setTemplate(e.target.value)}>
                {(templates.data || []).map((t) => <option key={t.key} value={t.key}>{t.name} — {t.description}</option>)}
              </select>
              <textarea className={ui.input} rows={4} value={jd} onChange={(e) => setJd(e.target.value)}
                placeholder="Optional job description for tailoring (reorders existing confirmed content only)" />
              <button type="button" className={`${ui.btn} ${ui.primary}`} disabled={create.isPending} onClick={() => create.mutate()}>
                {create.isPending ? "Generating…" : "Generate from confirmed career data"}
              </button>
              {error && <p className={ui.error}>{error}</p>}
            </div>

            <ul className="space-y-2">
              {(resumes.data || []).map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3">
                  <div>
                    <p className="font-medium text-stone-900">{r.title}</p>
                    <p className="text-xs text-stone-500">{r.template_key}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className={`${ui.btn} ${ui.neutral}`} onClick={() => void downloadResumeExport(r.id, "pdf").catch((err) => setError(getApiErrorMessage(err)))}>PDF</button>
                    <button type="button" className={`${ui.btn} ${ui.neutral}`} onClick={() => void downloadResumeExport(r.id, "docx").catch((err) => setError(getApiErrorMessage(err)))}>DOCX</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
