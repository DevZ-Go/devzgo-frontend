import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  ImagePlus,
  X,
  Users,
  Check,
  Lock,
  Globe,
  Cpu,
  Sparkles,
  Layers,
  Gamepad2,
  Code2,
  Building2,
  Crown,
  Shield,
  Wallet,
  Star,
} from "lucide-react";
import type { NetworkGroup, GroupCategory, ClubMemberRole, GroupVisibility } from "../../types/groups";
import { useAuth } from "../../auth/AuthContext";
import { createNetworkGroup } from "../../api/groups";
import { PhotoCropper } from "../PhotoCropper";

const STEPS = [
  { id: "identity", label: "Identity" },
  { id: "look", label: "Look" },
  { id: "lead", label: "Lead" },
  { id: "review", label: "Review" },
] as const;

const CREATOR_ROLES: {
  id: ClubMemberRole;
  label: string;
  defaultTitle: string;
  Icon: typeof Crown;
  hint: string;
}[] = [
  { id: "president", label: "President", defaultTitle: "Club President", Icon: Crown, hint: "Full club control" },
  { id: "vice_president", label: "Vice President", defaultTitle: "Vice President", Icon: Shield, hint: "Second in command" },
  { id: "treasurer", label: "Treasurer", defaultTitle: "Treasurer", Icon: Wallet, hint: "Budgets & funds" },
  { id: "executive", label: "Executive", defaultTitle: "Executive Member", Icon: Star, hint: "Assigned permissions" },
];

const CATEGORIES: {
  id: GroupCategory;
  label: string;
  Icon: typeof Cpu;
  placeholder: string;
}[] = [
  { id: "robotics", label: "Hardware", Icon: Cpu, placeholder: "Building robots, IoT, makerspaces…" },
  { id: "ai_ml", label: "AI & ML", Icon: Sparkles, placeholder: "Models, research, applied AI…" },
  { id: "web_cloud", label: "Web & Cloud", Icon: Layers, placeholder: "Full-stack, devops, platforms…" },
  { id: "game_dev", label: "Game Dev", Icon: Gamepad2, placeholder: "Games, XR, interactive media…" },
  { id: "open_source", label: "Open Source", Icon: Code2, placeholder: "OSS projects & maintainers…" },
  { id: "general", label: "General", Icon: Users, placeholder: "Broad student community…" },
  { id: "other", label: "Other", Icon: Building2, placeholder: "Something unique to your campus…" },
];

const fieldClass =
  "w-full rounded-xl border border-[#DECDBA] bg-white px-3.5 py-3 text-sm text-[#2D120D] placeholder:text-[#6E5952]/55 focus:outline-none focus:ring-2 focus:ring-[#780D18]/20 focus:border-[#780D18] transition";
const labelClass = "block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#780D18] mb-1.5";

interface CreateGroupModalProps {
  onClose: () => void;
  onSuccess: (newGroup: NetworkGroup) => void;
}

export function CreateGroupModal({ onClose, onSuccess }: CreateGroupModalProps) {
  const { user } = useAuth();
  const bannerRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [about, setAbout] = useState("");
  const [purpose, setPurpose] = useState("");
  const [institution, setInstitution] = useState("");
  const [category, setCategory] = useState<GroupCategory>("general");
  const [customCategory, setCustomCategory] = useState("");
  const [visibility, setVisibility] = useState<GroupVisibility>("public");
  const [fundsVisibility, setFundsVisibility] = useState<"members" | "executives">("members");
  const [hostRole, setHostRole] = useState<ClubMemberRole>("president");
  const [hostTitle, setHostTitle] = useState("Club President");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [cropKind, setCropKind] = useState<"banner" | "logo" | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [bannerPreview, logoPreview]);

  const commitTag = (raw: string) => {
    const next = raw.trim().replace(/,/g, "");
    if (!next) return;
    setTags((prev) => (prev.includes(next) || prev.length >= 12 ? prev : [...prev, next]));
    setTagDraft("");
  };

  const onTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "," || e.key === "Enter") {
      e.preventDefault();
      commitTag(tagDraft);
    } else if (e.key === "Backspace" && !tagDraft && tags.length) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const validateStep = (): boolean => {
    if (step === 0) {
      if (!name.trim()) {
        setError("Add a club name to continue.");
        return false;
      }
      if (category === "other" && !customCategory.trim()) {
        setError("Enter a custom category name.");
        return false;
      }
    }
    if (step === 1 && !logoFile) {
      setError("Upload a club logo — it’s required on every club card.");
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      setError("Sign in to create a club.");
      return;
    }
    if (!logoFile) {
      setError("Upload a club logo — it’s required on every club card.");
      setStep(1);
      return;
    }
    if (tagDraft.trim()) commitTag(tagDraft);
    setSubmitting(true);
    setError(null);
    try {
      const finalCategory: GroupCategory =
        category === "other" ? customCategory.trim() : category;
      const created = await createNetworkGroup({
        name: name.trim(),
        tagline: tagline.trim() || `Community of builders in ${finalCategory}`,
        about: about.trim() || "A collaborative space for club members.",
        purpose: purpose.trim() || undefined,
        institution: institution.trim() || undefined,
        category: finalCategory,
        visibility,
        joinPolicy: visibility === "private" ? "request" : "open",
        tags,
        bannerFile,
        avatarFile: logoFile,
        host: {
          id: String(user.id),
          name: user.username || "Club Founder",
          username: user.username || "founder",
        },
        hostRole,
        hostTitle: hostTitle.trim() || "President",
        fundsVisibility,
      });
      onSuccess(created);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create group");
    } finally {
      setSubmitting(false);
    }
  };

  const categoryMeta = CATEGORIES.find((c) => c.id === category) || CATEGORIES[5];

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#2D120D]/55"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="relative w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl border border-[#DECDBA] bg-[#F7F1E8] shadow-2xl max-h-[94vh] overflow-y-auto">
          {/* Live visual preview hero */}
          <div className="relative h-36 sm:h-40 bg-[#2D120D] overflow-hidden">
            {bannerPreview ? (
              <img src={bannerPreview} alt="" className="absolute inset-0 w-full h-full object-cover opacity-90" />
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "radial-gradient(ellipse 70% 80% at 20% 10%, #780D18 0%, transparent 55%), radial-gradient(ellipse 45% 50% at 90% 90%, #284E45 0%, transparent 50%)",
                }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#2D120D]/90 via-[#2D120D]/25 to-transparent" />
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 p-2 rounded-lg bg-black/40 text-white hover:bg-black/55"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-3 left-4 right-4 flex items-end gap-3">
              <button
                type="button"
                onClick={() => logoRef.current?.click()}
                className="relative shrink-0 group"
                title="Upload logo"
              >
                <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-2 border-[#F7F1E8] bg-[#780D18] text-[#F7F1E8] shadow-lg">
                  {logoPreview ? (
                    <img src={logoPreview} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <ImagePlus className="w-6 h-6 opacity-90" />
                  )}
                </span>
                <span className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] font-bold text-white">
                  Logo
                </span>
              </button>
              <div className="min-w-0 pb-0.5 flex-1">
                <p className="font-serif text-lg sm:text-xl font-bold text-[#F7F1E8] truncate leading-tight">
                  {name.trim() || "Your club name"}
                </p>
                <p className="text-[11px] text-[#F7F1E8]/75 truncate mt-0.5">
                  {tagline.trim() || "A short tagline appears here"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => bannerRef.current?.click()}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1.5 text-[10px] font-bold text-[#780D18] shrink-0"
              >
                <ImagePlus className="w-3 h-3" /> Banner
              </button>
            </div>
          </div>

          <input
            ref={logoRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) {
                setCropKind("logo");
                setCropFile(f);
              }
            }}
          />
          <input
            ref={bannerRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) {
                setCropKind("banner");
                setCropFile(f);
              }
            }}
          />

          <div className="p-5 sm:p-6 space-y-5 text-[#2D120D]">
            {/* Progress */}
            <div className="flex items-center gap-2">
              {STEPS.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => i < step && setStep(i)}
                  className="flex-1 group"
                  aria-current={i === step ? "step" : undefined}
                >
                  <div
                    className={`h-1 rounded-full transition ${
                      i <= step ? "bg-[#780D18]" : "bg-[#DECDBA]"
                    }`}
                  />
                  <p
                    className={`mt-1.5 text-[10px] font-bold uppercase tracking-wider ${
                      i === step ? "text-[#780D18]" : i < step ? "text-[#2D120D]" : "text-[#6E5952]/70"
                    }`}
                  >
                    {s.label}
                  </p>
                </button>
              ))}
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-[#780D18]/10 border border-[#780D18]/25 text-xs text-[#780D18]">
                {error}
              </div>
            )}

            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Club name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sheridan Robotics Society"
                    className={`${fieldClass} font-serif text-base font-bold`}
                  />
                </div>

                <div>
                  <label className={labelClass}>Focus</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCategory(c.id)}
                        className={`rounded-xl border p-3 text-left transition ${
                          category === c.id
                            ? "border-[#780D18] bg-[#780D18] text-white shadow-md"
                            : "border-[#DECDBA] bg-white text-[#2D120D] hover:border-[#780D18]/40"
                        }`}
                      >
                        <c.Icon className={`w-4 h-4 mb-1.5 ${category === c.id ? "text-white" : "text-[#780D18]"}`} />
                        <span className="block text-[11px] font-bold leading-tight">{c.label}</span>
                      </button>
                    ))}
                  </div>
                  {category === "other" && (
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Name your category — e.g. FinTech Club"
                      className={`${fieldClass} mt-2`}
                    />
                  )}
                </div>

                <div>
                  <label className={labelClass}>Campus / institution</label>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="e.g. Sheridan College — Trafalgar"
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Who can join</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setVisibility("public")}
                      className={`flex items-center gap-2.5 rounded-xl border p-3.5 text-left transition ${
                        visibility === "public"
                          ? "border-[#780D18] bg-[#780D18]/10 ring-1 ring-[#780D18]/25"
                          : "border-[#DECDBA] bg-white hover:border-[#780D18]/35"
                      }`}
                    >
                      <Globe className="w-5 h-5 text-[#780D18] shrink-0" />
                      <div>
                        <p className="text-xs font-bold">Open</p>
                        <p className="text-[10px] text-[#6E5952]">Anyone can join</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisibility("private")}
                      className={`flex items-center gap-2.5 rounded-xl border p-3.5 text-left transition ${
                        visibility === "private"
                          ? "border-[#780D18] bg-[#780D18]/10 ring-1 ring-[#780D18]/25"
                          : "border-[#DECDBA] bg-white hover:border-[#780D18]/35"
                      }`}
                    >
                      <Lock className="w-5 h-5 text-[#780D18] shrink-0" />
                      <div>
                        <p className="text-xs font-bold">Request</p>
                        <p className="text-[10px] text-[#6E5952]">Execs approve</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Tagline</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder={categoryMeta.placeholder}
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Purpose</label>
                  <textarea
                    rows={2}
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Why does this club exist? One or two sentences…"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>About</label>
                  <textarea
                    rows={3}
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    placeholder="What members do together — workshops, builds, competitions, socials…"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Tags</label>
                  <div className="rounded-xl border border-[#DECDBA] bg-white px-2.5 py-2.5 flex flex-wrap gap-1.5 focus-within:ring-2 focus-within:ring-[#780D18]/20">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 rounded-md bg-[#780D18] text-[#F7F1E8] px-2 py-0.5 text-[11px] font-semibold"
                      >
                        {t}
                        <button
                          type="button"
                          aria-label={`Remove ${t}`}
                          onClick={() => setTags((prev) => prev.filter((x) => x !== t))}
                          className="opacity-80 hover:opacity-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={tagDraft}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v.includes(",")) commitTag(v);
                        else setTagDraft(v);
                      }}
                      onKeyDown={onTagKeyDown}
                      onBlur={() => tagDraft.trim() && commitTag(tagDraft)}
                      placeholder={tags.length ? "Add another tag…" : "e.g. hardware, workshops — press Enter"}
                      className="flex-1 min-w-[10rem] bg-transparent text-sm outline-none py-1 placeholder:text-[#6E5952]/55"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => logoRef.current?.click()}
                    className={`rounded-xl border-2 border-dashed p-4 text-left transition ${
                      logoPreview
                        ? "border-[#780D18]/40 bg-white"
                        : "border-[#780D18]/50 bg-[#780D18]/05 hover:bg-[#780D18]/08"
                    }`}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#780D18] mb-2">Logo *</p>
                    {logoPreview ? (
                      <img src={logoPreview} alt="" className="h-16 w-16 rounded-xl object-cover border border-[#DECDBA]" />
                    ) : (
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#780D18]">
                        <ImagePlus className="w-5 h-5" />
                        Upload square logo
                      </div>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => bannerRef.current?.click()}
                    className="rounded-xl border-2 border-dashed border-[#DECDBA] bg-white p-4 text-left hover:border-[#780D18]/35 transition"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#6E5952] mb-2">Banner</p>
                    {bannerPreview ? (
                      <img src={bannerPreview} alt="" className="h-16 w-full rounded-lg object-cover border border-[#DECDBA]" />
                    ) : (
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#6E5952]">
                        <ImagePlus className="w-5 h-5" />
                        Optional cover
                      </div>
                    )}
                  </button>
                </div>

                <div>
                  <label className={labelClass}>Funds visibility</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        ["members", "All members"],
                        ["executives", "Executives only"],
                      ] as const
                    ).map(([id, text]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setFundsVisibility(id)}
                        className={`rounded-xl border px-3 py-3 text-xs font-bold transition ${
                          fundsVisibility === id
                            ? "border-[#780D18] bg-[#780D18] text-white"
                            : "border-[#DECDBA] bg-white text-[#2D120D]"
                        }`}
                      >
                        {text}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Your seat</label>
                  <div className="grid grid-cols-2 gap-2">
                    {CREATOR_ROLES.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setHostRole(r.id);
                          setHostTitle(r.defaultTitle);
                        }}
                        className={`rounded-xl border p-3.5 text-left transition ${
                          hostRole === r.id
                            ? "border-[#780D18] bg-[#780D18] text-white"
                            : "border-[#DECDBA] bg-white hover:border-[#780D18]/40"
                        }`}
                      >
                        <r.Icon className={`w-4 h-4 mb-1.5 ${hostRole === r.id ? "text-white" : "text-[#780D18]"}`} />
                        <span className="block text-xs font-bold">{r.label}</span>
                        <span className={`block text-[10px] mt-0.5 ${hostRole === r.id ? "text-white/80" : "text-[#6E5952]"}`}>
                          {r.hint}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Display title</label>
                  <input
                    type="text"
                    value={hostTitle}
                    onChange={(e) => setHostTitle(e.target.value)}
                    placeholder="e.g. Club President, Founding Chair"
                    className={fieldClass}
                  />
                </div>
                <div className="rounded-xl bg-[#2D120D] text-[#F7F1E8] p-4 space-y-2">
                  <p className="text-xs font-bold flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-[#DECDBA]" /> After you publish
                  </p>
                  <p className="text-[11px] text-[#F7F1E8]/75 leading-relaxed">
                    Open People → Permissions to decide what VPs, treasurers, and executives can manage —
                    events, announcements, galleries, email, and more.
                  </p>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden border border-[#DECDBA] bg-[#2D120D] shadow-md">
                  <div className="relative h-28">
                    {bannerPreview ? (
                      <img src={bannerPreview} alt="" className="absolute inset-0 w-full h-full object-cover opacity-90" />
                    ) : (
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundImage:
                            "radial-gradient(ellipse 70% 80% at 20% 10%, #780D18 0%, transparent 55%), linear-gradient(160deg,#2D120D,#5C0A12)",
                        }}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#2D120D] to-transparent" />
                    <div className="absolute -bottom-6 left-4">
                      <span className="flex h-14 w-14 overflow-hidden rounded-2xl border-2 border-[#F7F1E8] bg-[#780D18]">
                        {logoPreview ? (
                          <img src={logoPreview} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Users className="w-6 h-6 m-auto text-white" />
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="bg-[#F7F1E8] pt-8 px-4 pb-4 space-y-1.5">
                    <p className="font-serif text-xl font-bold text-[#2D120D]">{name || "Untitled club"}</p>
                    <p className="text-xs text-[#6E5952] line-clamp-2">
                      {tagline || categoryMeta.placeholder}
                    </p>
                    {institution && (
                      <p className="text-[11px] font-semibold text-[#780D18]">{institution}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-xl bg-white border border-[#DECDBA] p-3">
                    <p className="font-bold uppercase tracking-wider text-[#780D18] text-[9px] mb-1">Join</p>
                    <p className="font-semibold text-[#2D120D]">{visibility === "private" ? "Request" : "Open"}</p>
                  </div>
                  <div className="rounded-xl bg-white border border-[#DECDBA] p-3">
                    <p className="font-bold uppercase tracking-wider text-[#780D18] text-[9px] mb-1">Your role</p>
                    <p className="font-semibold text-[#2D120D] truncate">{hostTitle}</p>
                  </div>
                  <div className="rounded-xl bg-white border border-[#DECDBA] p-3">
                    <p className="font-bold uppercase tracking-wider text-[#780D18] text-[9px] mb-1">Focus</p>
                    <p className="font-semibold text-[#2D120D]">
                      {category === "other" ? customCategory || "Other" : categoryMeta.label}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white border border-[#DECDBA] p-3">
                    <p className="font-bold uppercase tracking-wider text-[#780D18] text-[9px] mb-1">Funds</p>
                    <p className="font-semibold text-[#2D120D]">
                      {fundsVisibility === "executives" ? "Executives" : "Members"}
                    </p>
                  </div>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((t) => (
                      <span key={t} className="rounded-md bg-[#780D18]/10 text-[#780D18] px-2 py-0.5 text-[10px] font-semibold">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {!logoFile && (
                  <p className="text-xs text-[#780D18] font-semibold flex items-center gap-1.5">
                    <ImagePlus className="w-3.5 h-3.5" /> Logo still required before publishing.
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-[#DECDBA]">
              <button
                type="button"
                onClick={() => (step === 0 ? onClose() : setStep((s) => s - 1))}
                className="px-4 py-2 text-xs font-semibold text-[#6E5952] hover:text-[#780D18]"
              >
                {step === 0 ? "Cancel" : "Back"}
              </button>
              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep()) setStep((s) => s + 1);
                  }}
                  className="rounded-xl bg-[#780D18] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#5C0A12] shadow-sm"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleSubmit()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#780D18] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#5C0A12] disabled:opacity-60 shadow-sm"
                >
                  {submitting ? (
                    "Publishing…"
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Publish club
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {cropFile && cropKind && (
        <PhotoCropper
          file={cropFile}
          title={cropKind === "logo" ? "Crop club logo" : "Crop cover banner"}
          aspect={cropKind === "logo" ? 1 : 16 / 5}
          cropShape={cropKind === "logo" ? "round" : "rect"}
          outputWidth={cropKind === "logo" ? 512 : 1600}
          outputHeight={cropKind === "logo" ? 512 : 500}
          maxBytes={cropKind === "logo" ? 5 * 1024 * 1024 : 8 * 1024 * 1024}
          hint={cropKind === "logo" ? "Square logo · under 5 MB" : "Wide banner · under 8 MB"}
          confirmLabel={cropKind === "logo" ? "Use logo" : "Use banner"}
          onCancel={() => {
            setCropFile(null);
            setCropKind(null);
          }}
          onDone={(cropped) => {
            if (cropKind === "logo") {
              if (logoPreview) URL.revokeObjectURL(logoPreview);
              setLogoFile(cropped);
              setLogoPreview(URL.createObjectURL(cropped));
            } else {
              if (bannerPreview) URL.revokeObjectURL(bannerPreview);
              setBannerFile(cropped);
              setBannerPreview(URL.createObjectURL(cropped));
            }
            setCropFile(null);
            setCropKind(null);
          }}
        />
      )}
    </>
  );
}
