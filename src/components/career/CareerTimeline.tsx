import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Briefcase, GraduationCap, Award, Loader2, Plus, Trash2 } from "lucide-react";
import {
  CATEGORY_LABELS, createCertification, createEducation, createExperience, deleteCertification,
  deleteEducation, deleteExperience, fetchMyCareer, fetchUserCareer, updateCertification,
  updateEducation, updateExperience, type Audience, type ExperienceCategory,
} from "../../api/career";
import { ui } from "../../styles/editorial";
import { getApiErrorMessage } from "../../utils/apiError";

const CATEGORIES = Object.keys(CATEGORY_LABELS) as ExperienceCategory[];

export type CareerSection = "experience" | "education" | "certifications";

function ShowcaseToggle({
  checked, onChange, disabled,
}: { checked: boolean; onChange: (next: Audience) => void; disabled?: boolean }) {
  return (
    <label className="inline-flex items-center gap-2 text-[11px] font-semibold text-stone-600">
      <input
        type="checkbox"
        className="h-3.5 w-3.5 accent-maroon-800"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked ? "public" : "connections")}
      />
      Show on portfolio
    </label>
  );
}

export function CareerTimeline({
  userId,
  editable = false,
  section = "experience",
}: {
  userId?: string;
  editable?: boolean;
  section?: CareerSection | "all";
}) {
  const qc = useQueryClient();
  const career = useQuery({
    queryKey: ["career", userId || "me"],
    queryFn: () => (userId ? fetchUserCareer(userId) : fetchMyCareer()),
  });
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [addingEdu, setAddingEdu] = useState(false);
  const [addingCert, setAddingCert] = useState(false);
  const [form, setForm] = useState({
    organization: "", title: "", category: "full_time" as ExperienceCategory,
    start_year: "", start_month: "", end_year: "", end_month: "", is_current: false, description: "",
  });
  const [eduForm, setEduForm] = useState({
    institution: "", degree: "", field_of_study: "",
    start_year: "", start_month: "", end_year: "", end_month: "", is_current: false, description: "",
  });
  const [certForm, setCertForm] = useState({ name: "", issuer: "", year: "", month: "" });

  const save = useMutation({
    mutationFn: () => createExperience({
      organization: form.organization,
      title: form.title,
      category: form.category,
      start_year: form.start_year ? Number(form.start_year) : null,
      start_month: form.start_month ? Number(form.start_month) : null,
      end_year: form.is_current ? null : (form.end_year ? Number(form.end_year) : null),
      end_month: form.is_current ? null : (form.end_month ? Number(form.end_month) : null),
      is_current: form.is_current,
      description: form.description || null,
      responsibilities: [],
      achievements: [],
      visibility: "connections",
      skill_intervals: [],
      project_ids: [],
    }),
    onSuccess: async () => {
      setAdding(false);
      setForm({ organization: "", title: "", category: "full_time", start_year: "", start_month: "", end_year: "", end_month: "", is_current: false, description: "" });
      await qc.invalidateQueries({ queryKey: ["career"] });
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  if (career.isLoading) return <p className="flex items-center gap-2 text-sm text-stone-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading career…</p>;
  if (career.isError) return <p className={ui.error}>{getApiErrorMessage(career.error)}</p>;
  const data = career.data!;
  const showExp = section === "all" || section === "experience";
  const showEdu = section === "all" || section === "education";
  const showCert = section === "all" || section === "certifications";

  return (
    <section className="space-y-6">
      {showExp && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-maroon-800">Portfolio</p>
              <h2 className="font-serif text-2xl text-stone-900">Work experience</h2>
              <p className="mt-1 text-sm text-stone-600">
                Confirm imported roles here. Toggle “Show on portfolio” for public write-up highlights. Duration never becomes a proficiency score.
              </p>
            </div>
            {editable && (
              <button type="button" className={`${ui.btn} ${ui.primary}`} onClick={() => setAdding((v) => !v)}>
                <Plus className="h-3.5 w-3.5" /> Add experience
              </button>
            )}
          </div>

          {Object.keys(data.category_durations).length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {Object.entries(data.category_durations).map(([cat, dur]) => (
                <li key={cat} className="rounded-full border border-stone-200 bg-[#faf6ee] px-3 py-1 text-xs font-medium text-stone-700">
                  {CATEGORY_LABELS[cat as ExperienceCategory] || cat}: {dur.label}
                </li>
              ))}
            </ul>
          )}

          {adding && (
            <div className="grid gap-3 rounded-2xl border border-stone-200 bg-[#FAF7EE]/50 p-4 sm:grid-cols-2">
              <input className={ui.input} placeholder="Organization" value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} />
              <input className={ui.input} placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <select className={ui.input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ExperienceCategory })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <input type="checkbox" className="accent-maroon-800" checked={form.is_current} onChange={(e) => setForm({ ...form, is_current: e.target.checked })} /> Current role
              </label>
              <input className={ui.input} placeholder="Start year" value={form.start_year} onChange={(e) => setForm({ ...form, start_year: e.target.value })} />
              <input className={ui.input} placeholder="Start month (1-12)" value={form.start_month} onChange={(e) => setForm({ ...form, start_month: e.target.value })} />
              {!form.is_current && (
                <>
                  <input className={ui.input} placeholder="End year" value={form.end_year} onChange={(e) => setForm({ ...form, end_year: e.target.value })} />
                  <input className={ui.input} placeholder="End month" value={form.end_month} onChange={(e) => setForm({ ...form, end_month: e.target.value })} />
                </>
              )}
              <textarea className={`${ui.input} sm:col-span-2`} rows={2} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <button type="button" className={`${ui.btn} ${ui.primary} sm:col-span-2 justify-center py-2`} disabled={save.isPending || !form.organization || !form.title} onClick={() => save.mutate()}>
                {save.isPending ? "Saving…" : "Save experience"}
              </button>
            </div>
          )}

          <ol className="space-y-3">
            {data.experiences.length === 0 && <li className={ui.empty}>No confirmed work experience yet. Import a resume or add a role.</li>}
            {data.experiences.map((exp) => (
              <li key={exp.id} className={`rounded-2xl border p-4 ${exp.visibility === "public" ? "border-amber-300 bg-amber-50/30" : "border-stone-200 bg-white"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-maroon-800">
                      <Briefcase className="h-3 w-3" /> {CATEGORY_LABELS[exp.category]}
                    </p>
                    <h3 className="font-serif text-xl text-stone-900">{exp.title}</h3>
                    <p className="text-sm text-stone-600">{exp.organization}</p>
                    <p className="mt-1 text-xs text-stone-500">
                      {exp.start_year || "?"}{exp.start_month ? `/${exp.start_month}` : ""} — {exp.is_current ? "Present" : `${exp.end_year || "?"}${exp.end_month ? `/${exp.end_month}` : ""}`}
                      {exp.duration ? ` · ${exp.duration.label}` : ""}
                      {exp.source === "resume_import" ? " · document-supported" : " · self-reported"}
                    </p>
                    {exp.description && <p className="mt-2 text-sm text-stone-700">{exp.description}</p>}
                    {editable && (
                      <div className="mt-3">
                        <ShowcaseToggle
                          checked={exp.visibility === "public"}
                          onChange={(visibility) => {
                            void updateExperience(exp.id, { visibility }).then(() => qc.invalidateQueries({ queryKey: ["career"] }));
                          }}
                        />
                      </div>
                    )}
                  </div>
                  {editable && (
                    <button type="button" aria-label="Delete experience" className="rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-crimson-700"
                      onClick={() => void deleteExperience(exp.id).then(() => qc.invalidateQueries({ queryKey: ["career"] }))}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {showEdu && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 font-serif text-2xl text-stone-900"><GraduationCap className="h-5 w-5" /> Education</h3>
              <p className="mt-1 text-sm text-stone-600">Institute, program, and dates. Showcase selected rows on the portfolio overview.</p>
            </div>
            {editable && (
              <button type="button" className={`${ui.btn} ${ui.primary}`} onClick={() => setAddingEdu((v) => !v)}>
                <Plus className="h-3.5 w-3.5" /> Add education
              </button>
            )}
          </div>
          {addingEdu && (
            <div className="grid gap-3 rounded-2xl border border-stone-200 bg-[#FAF7EE]/50 p-4 sm:grid-cols-2">
              <input className={ui.input} placeholder="Institution / school" value={eduForm.institution} onChange={(e) => setEduForm({ ...eduForm, institution: e.target.value })} />
              <input className={ui.input} placeholder="Degree (e.g. B.Sc.)" value={eduForm.degree} onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })} />
              <input className={`${ui.input} sm:col-span-2`} placeholder="Field of study" value={eduForm.field_of_study} onChange={(e) => setEduForm({ ...eduForm, field_of_study: e.target.value })} />
              <input className={ui.input} placeholder="Start year" value={eduForm.start_year} onChange={(e) => setEduForm({ ...eduForm, start_year: e.target.value })} />
              <input className={ui.input} placeholder="Start month (1-12)" value={eduForm.start_month} onChange={(e) => setEduForm({ ...eduForm, start_month: e.target.value })} />
              <label className="flex items-center gap-2 text-sm text-stone-700 sm:col-span-2">
                <input type="checkbox" className="accent-maroon-800" checked={eduForm.is_current} onChange={(e) => setEduForm({ ...eduForm, is_current: e.target.checked })} /> Currently studying
              </label>
              {!eduForm.is_current && (
                <>
                  <input className={ui.input} placeholder="End year" value={eduForm.end_year} onChange={(e) => setEduForm({ ...eduForm, end_year: e.target.value })} />
                  <input className={ui.input} placeholder="End month" value={eduForm.end_month} onChange={(e) => setEduForm({ ...eduForm, end_month: e.target.value })} />
                </>
              )}
              <textarea className={`${ui.input} sm:col-span-2`} rows={2} placeholder="Notes (optional)" value={eduForm.description} onChange={(e) => setEduForm({ ...eduForm, description: e.target.value })} />
              <button
                type="button"
                className={`${ui.btn} ${ui.primary} sm:col-span-2 justify-center py-2`}
                disabled={!eduForm.institution.trim()}
                onClick={() => void createEducation({
                  institution: eduForm.institution.trim(),
                  degree: eduForm.degree.trim() || null,
                  field_of_study: eduForm.field_of_study.trim() || null,
                  start_year: eduForm.start_year ? Number(eduForm.start_year) : null,
                  start_month: eduForm.start_month ? Number(eduForm.start_month) : null,
                  end_year: eduForm.is_current ? null : (eduForm.end_year ? Number(eduForm.end_year) : null),
                  end_month: eduForm.is_current ? null : (eduForm.end_month ? Number(eduForm.end_month) : null),
                  is_current: eduForm.is_current,
                  description: eduForm.description.trim() || null,
                  visibility: "connections",
                }).then(() => {
                  setAddingEdu(false);
                  setEduForm({ institution: "", degree: "", field_of_study: "", start_year: "", start_month: "", end_year: "", end_month: "", is_current: false, description: "" });
                  return qc.invalidateQueries({ queryKey: ["career"] });
                }).catch((err) => setError(getApiErrorMessage(err)))}
              >
                Save education
              </button>
            </div>
          )}
          <ul className="space-y-2">
            {data.education.length === 0 && <li className={ui.empty}>No education listed yet.</li>}
            {data.education.map((edu) => (
              <li key={edu.id} className={`rounded-xl border px-3 py-3 text-sm ${edu.visibility === "public" ? "border-amber-300 bg-amber-50/30" : "border-stone-200 bg-white"}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span className="font-semibold text-stone-900">{edu.institution}</span>
                    {edu.degree && <span className="text-stone-600"> · {edu.degree}</span>}
                    {edu.field_of_study && <p className="text-xs text-stone-500">{edu.field_of_study}</p>}
                    <p className="mt-1 text-xs text-stone-500">
                      {edu.start_year || "?"}{edu.start_month ? `/${edu.start_month}` : ""} — {edu.is_current ? "Present" : `${edu.end_year || "?"}${edu.end_month ? `/${edu.end_month}` : ""}`}
                    </p>
                  </div>
                  {editable && (
                    <button type="button" className="text-xs text-crimson-700" onClick={() => void deleteEducation(edu.id).then(() => qc.invalidateQueries({ queryKey: ["career"] }))}>Remove</button>
                  )}
                </div>
                {editable && (
                  <div className="mt-2">
                    <ShowcaseToggle
                      checked={edu.visibility === "public"}
                      onChange={(visibility) => {
                        void updateEducation(edu.id, {
                          institution: edu.institution,
                          degree: edu.degree,
                          field_of_study: edu.field_of_study,
                          start_year: edu.start_year,
                          start_month: edu.start_month,
                          end_year: edu.end_year,
                          end_month: edu.end_month,
                          is_current: edu.is_current,
                          description: edu.description,
                          visibility,
                          sort_order: edu.sort_order ?? 0,
                        }).then(() => qc.invalidateQueries({ queryKey: ["career"] }));
                      }}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {showCert && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 font-serif text-2xl text-stone-900"><Award className="h-5 w-5" /> Certifications</h3>
              <p className="mt-1 text-sm text-stone-600">Name, issuer, and when you earned it. Showcase selected ones on the portfolio overview.</p>
            </div>
            {editable && (
              <button type="button" className={`${ui.btn} ${ui.primary}`} onClick={() => setAddingCert((v) => !v)}>
                <Plus className="h-3.5 w-3.5" /> Add certification
              </button>
            )}
          </div>
          {addingCert && (
            <div className="grid gap-3 rounded-2xl border border-stone-200 bg-[#FAF7EE]/50 p-4 sm:grid-cols-2">
              <input className={ui.input} placeholder="Certification name" value={certForm.name} onChange={(e) => setCertForm({ ...certForm, name: e.target.value })} />
              <input className={ui.input} placeholder="Issuer / organization" value={certForm.issuer} onChange={(e) => setCertForm({ ...certForm, issuer: e.target.value })} />
              <input className={ui.input} placeholder="Year" value={certForm.year} onChange={(e) => setCertForm({ ...certForm, year: e.target.value })} />
              <input className={ui.input} placeholder="Month (1-12, optional)" value={certForm.month} onChange={(e) => setCertForm({ ...certForm, month: e.target.value })} />
              <button
                type="button"
                className={`${ui.btn} ${ui.primary} sm:col-span-2 justify-center py-2`}
                disabled={!certForm.name.trim()}
                onClick={() => void createCertification({
                  name: certForm.name.trim(),
                  issuer: certForm.issuer.trim() || null,
                  year: certForm.year ? Number(certForm.year) : null,
                  month: certForm.month ? Number(certForm.month) : null,
                  visibility: "connections",
                }).then(() => {
                  setAddingCert(false);
                  setCertForm({ name: "", issuer: "", year: "", month: "" });
                  return qc.invalidateQueries({ queryKey: ["career"] });
                }).catch((err) => setError(getApiErrorMessage(err)))}
              >
                Save certification
              </button>
            </div>
          )}
          <ul className="space-y-2">
            {data.certifications.length === 0 && <li className={ui.empty}>No certifications listed yet.</li>}
            {data.certifications.map((cert) => (
              <li key={cert.id} className={`rounded-xl border px-3 py-3 text-sm ${cert.visibility === "public" ? "border-amber-300 bg-amber-50/30" : "border-stone-200 bg-white"}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span className="font-semibold text-stone-900">{cert.name}</span>
                    {cert.issuer && <span className="text-stone-600"> · {cert.issuer}</span>}
                    {(cert.year != null || cert.month != null) && (
                      <p className="text-xs text-stone-500">{[cert.month, cert.year].filter(Boolean).join("/")}</p>
                    )}
                  </div>
                  {editable && (
                    <button type="button" className="text-xs text-crimson-700" onClick={() => void deleteCertification(cert.id).then(() => qc.invalidateQueries({ queryKey: ["career"] }))}>Remove</button>
                  )}
                </div>
                {editable && (
                  <div className="mt-2">
                    <ShowcaseToggle
                      checked={cert.visibility === "public"}
                      onChange={(visibility) => {
                        void updateCertification(cert.id, {
                          name: cert.name,
                          issuer: cert.issuer,
                          year: cert.year,
                          month: cert.month,
                          visibility,
                        }).then(() => qc.invalidateQueries({ queryKey: ["career"] }));
                      }}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {error && <p className={ui.error}>{error}</p>}
    </section>
  );
}
