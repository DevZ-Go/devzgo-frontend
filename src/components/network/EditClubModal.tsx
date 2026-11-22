import { useEffect, useRef, useState } from "react";
import { ImagePlus, X, Building2 } from "lucide-react";
import type { NetworkGroup } from "../../types/groups";
import {
  approveClubAvatar,
  cancelPendingClubAvatar,
  patchClub,
  uploadClubAvatar,
  uploadClubBanner,
} from "../../api/groups";
import { PhotoCropper } from "../PhotoCropper";
import { assetUrlOrNull } from "../../api/config";
import { getApiErrorMessage } from "../../utils/apiError";

const field =
  "w-full rounded-lg border border-[#DECDBA] bg-white px-3 py-2.5 text-sm text-[#2D120D] placeholder:text-[#6E5952]/60 focus:outline-none focus:ring-2 focus:ring-[#780D18]/20 focus:border-[#780D18]";
const label = "block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#780D18] mb-1.5";

export function EditClubModal({
  group,
  onClose,
  onSuccess,
  userId,
}: {
  group: NetworkGroup;
  onClose: () => void;
  onSuccess: (club: NetworkGroup) => void;
  userId?: string;
}) {
  const bannerRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(group.name);
  const [tagline, setTagline] = useState(group.tagline || "");
  const [about, setAbout] = useState(group.about || "");
  const [institution, setInstitution] = useState(group.institution || "");
  const [purpose, setPurpose] = useState(group.purpose || "");
  const [category, setCategory] = useState(group.category || "general");
  const [joinPolicy, setJoinPolicy] = useState(group.joinPolicy || "open");
  const [policies, setPolicies] = useState(group.policies || "");
  const [tagsText, setTagsText] = useState((group.tags || []).join(", "));
  const [instagram, setInstagram] = useState(group.contactSocials?.instagram || "");
  const [discord, setDiscord] = useState(group.contactSocials?.discord || "");
  const [website, setWebsite] = useState(group.contactSocials?.website || "");
  const [bannerPreview, setBannerPreview] = useState<string | null>(group.bannerUrl || null);
  const [logoPreview, setLogoPreview] = useState<string | null>(group.avatarUrl || null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [cropKind, setCropKind] = useState<"banner" | "logo" | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [club, setClub] = useState(group);

  useEffect(() => {
    setClub(group);
  }, [group]);

  useEffect(() => {
    return () => {
      if (bannerPreview?.startsWith("blob:")) URL.revokeObjectURL(bannerPreview);
      if (logoPreview?.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
    };
  }, [bannerPreview, logoPreview]);

  const pending = club.pendingAvatarUrl;
  const approvals = club.pendingAvatarApprovals || [];
  const needed = club.pendingAvatarNeeded || 3;
  const alreadyApproved = userId ? approvals.includes(userId) : false;
  const hasLiveLogo = Boolean(club.avatarUrl);

  const save = async () => {
    if (!name.trim()) {
      setError("Club name is required.");
      return;
    }
    if (!hasLiveLogo && !logoFile && !logoPreview) {
      setError("Every club must have a published logo.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const tags = tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 20);
      let next = await patchClub(group.id, {
        name: name.trim(),
        tagline: tagline.trim(),
        about: about.trim(),
        institution: institution.trim() || undefined,
        purpose: purpose.trim() || undefined,
        category: category.trim() || "general",
        joinPolicy: joinPolicy as "open" | "request" | "invite",
        policies: policies.trim(),
        tags,
        contactSocials: {
          ...(instagram.trim() ? { instagram: instagram.trim() } : {}),
          ...(discord.trim() ? { discord: discord.trim() } : {}),
          ...(website.trim() ? { website: website.trim() } : {}),
        },
      });
      if (bannerFile) next = await uploadClubBanner(group.id, bannerFile);
      if (logoFile) next = await uploadClubAvatar(group.id, logoFile);
      setClub(next);
      onSuccess(next);
      if (logoFile && next.pendingAvatarUrl) {
        setLogoFile(null);
        setError(null);
      } else {
        onClose();
      }
    } catch (err) {
      setError(getApiErrorMessage(err) || "Could not save club");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#2D120D]/50"
        onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-[#DECDBA] bg-[#F7F1E8] shadow-2xl max-h-[92vh] overflow-y-auto">
          <div className="relative h-36 bg-[#2D120D]">
            {(bannerPreview || club.bannerUrl) && (
              <img
                src={assetUrlOrNull(bannerPreview) || bannerPreview || club.bannerUrl || ""}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-90"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#2D120D]/80 to-transparent" />
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 p-2 rounded-lg bg-black/40 text-white"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => bannerRef.current?.click()}
              className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-1.5 text-[11px] font-bold text-[#780D18]"
            >
              <ImagePlus className="w-3.5 h-3.5" /> Banner
            </button>
            <div className="absolute -bottom-8 left-5">
              <button type="button" onClick={() => logoRef.current?.click()} className="relative group" title="Change club logo">
                <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border-2 border-[#F7F1E8] bg-[#780D18] text-[#F7F1E8] shadow-md">
                  {logoPreview || club.avatarUrl || pending ? (
                    <img
                      src={
                        assetUrlOrNull(logoPreview) ||
                        logoPreview ||
                        assetUrlOrNull(pending) ||
                        pending ||
                        club.avatarUrl ||
                        ""
                      }
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Building2 className="w-7 h-7" />
                  )}
                </span>
                <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/45 opacity-0 group-hover:opacity-100 text-white text-[10px] font-bold">
                  Logo
                </span>
              </button>
            </div>
          </div>

          <div className="p-5 sm:p-6 pt-12 space-y-4">
            <h3 className="font-serif text-xl font-bold text-[#2D120D]">Edit club</h3>
            {error && (
              <p className="text-xs text-[#780D18] bg-[#780D18]/10 border border-[#780D18]/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <p className="text-[11px] text-[#6E5952]">
              Banner updates go live immediately. Changing the published logo needs {needed} executive
              approval{needed === 1 ? "" : "s"} (first logo publishes right away).
            </p>

            {pending && (
              <div className="rounded-xl border border-[#780D18]/30 bg-white p-3 space-y-2">
                <div className="flex items-center gap-3">
                  <img
                    src={assetUrlOrNull(pending) || pending}
                    alt=""
                    className="h-12 w-12 rounded-xl object-cover border border-[#DECDBA]"
                  />
                  <div>
                    <p className="text-xs font-bold text-[#780D18]">
                      Logo pending · {approvals.length}/{needed} executives
                    </p>
                    <p className="text-[11px] text-[#6E5952]">Live logo stays until approvals complete.</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!alreadyApproved && (
                    <button
                      type="button"
                      className="rounded-lg bg-[#780D18] px-3 py-1.5 text-[11px] font-bold text-white"
                      onClick={() =>
                        void approveClubAvatar(group.id)
                          .then((c) => {
                            setClub(c);
                            onSuccess(c);
                            if (c.avatarUrl && !c.pendingAvatarUrl) {
                              setLogoPreview(c.avatarUrl);
                            }
                          })
                          .catch((err) => setError(getApiErrorMessage(err) || "Approve failed"))
                      }
                    >
                      Approve logo
                    </button>
                  )}
                  {alreadyApproved && (
                    <span className="text-[11px] font-semibold text-[#284E45]">You already approved</span>
                  )}
                  <button
                    type="button"
                    className="rounded-lg border border-[#DECDBA] px-3 py-1.5 text-[11px] font-bold"
                    onClick={() =>
                      void cancelPendingClubAvatar(group.id)
                        .then((c) => {
                          setClub(c);
                          onSuccess(c);
                        })
                        .catch((err) => setError(getApiErrorMessage(err) || "Cancel failed"))
                    }
                  >
                    Cancel proposal
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className={label}>Name</label>
              <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Club name" />
            </div>
            <div>
              <label className={label}>Tagline</label>
              <input className={field} value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="One short line" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={label}>Category</label>
                <select className={field} value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="general">General</option>
                  <option value="ai_ml">AI / ML</option>
                  <option value="web_cloud">Web / Cloud</option>
                  <option value="game_dev">Game Dev</option>
                  <option value="open_source">Open Source</option>
                  <option value="robotics">Robotics</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className={label}>Join policy</label>
                <select
                  className={field}
                  value={joinPolicy}
                  onChange={(e) => setJoinPolicy(e.target.value as "open" | "request" | "invite")}
                >
                  <option value="open">Open</option>
                  <option value="request">Request</option>
                  <option value="invite">Invite only</option>
                </select>
              </div>
            </div>
            <div>
              <label className={label}>Institution</label>
              <input className={field} value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Campus / school" />
            </div>
            <div>
              <label className={label}>Purpose</label>
              <input className={field} value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Why this club exists" />
            </div>
            <div>
              <label className={label}>About</label>
              <textarea className={field} rows={3} value={about} onChange={(e) => setAbout(e.target.value)} placeholder="Tell members what you do" />
            </div>
            <div>
              <label className={label}>Tags</label>
              <input className={field} value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="hardware, community, …" />
            </div>
            <div>
              <label className={label}>Policies</label>
              <textarea className={field} rows={3} value={policies} onChange={(e) => setPolicies(e.target.value)} placeholder="Club rules / code of conduct" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input className={field} value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="Instagram" />
              <input className={field} value={discord} onChange={(e) => setDiscord(e.target.value)} placeholder="Discord" />
              <input className={field} value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Website" />
            </div>

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

            <div className="flex justify-end gap-2 pt-2 border-t border-[#DECDBA]">
              <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-[#6E5952]">
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void save()}
                className="rounded-lg bg-[#780D18] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {cropFile && cropKind && (
        <PhotoCropper
          file={cropFile}
          title={cropKind === "banner" ? "Crop banner" : "Crop logo"}
          aspect={cropKind === "banner" ? 16 / 5 : 1}
          cropShape={cropKind === "logo" ? "round" : "rect"}
          outputWidth={cropKind === "banner" ? 1600 : 512}
          outputHeight={cropKind === "banner" ? 500 : 512}
          maxBytes={8 * 1024 * 1024}
          confirmLabel={cropKind === "banner" ? "Use banner" : "Use logo"}
          onCancel={() => {
            setCropFile(null);
            setCropKind(null);
          }}
          onDone={(cropped) => {
            if (cropKind === "banner") {
              if (bannerPreview?.startsWith("blob:")) URL.revokeObjectURL(bannerPreview);
              setBannerFile(cropped);
              setBannerPreview(URL.createObjectURL(cropped));
            } else {
              if (logoPreview?.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
              setLogoFile(cropped);
              setLogoPreview(URL.createObjectURL(cropped));
            }
            setCropFile(null);
            setCropKind(null);
          }}
        />
      )}
    </>
  );
}
