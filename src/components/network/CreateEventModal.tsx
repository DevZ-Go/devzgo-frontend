import { useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  ImagePlus,
  X,
  MapPin,
  Video,
  Blend,
  Clock,
  Gift,
  Mail,
} from "lucide-react";
import {
  createGroupEvent,
  patchGroupEvent,
  uploadEventPoster,
  type ClubEventPayload,
} from "../../api/groups";
import { PhotoCropper } from "../PhotoCropper";
import { assetUrlOrNull } from "../../api/config";
import { getApiErrorMessage } from "../../utils/apiError";

type Modality = "in_person" | "virtual" | "hybrid";
type PosterFormat = "letter" | "tabloid" | "custom";
type PosterOrientation = "portrait" | "landscape";

export type EditableClubEvent = {
  id: string;
  title: string;
  description?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  modality?: string | null;
  venueName?: string | null;
  venueAddress?: string | null;
  roomNumber?: string | null;
  meetingUrl?: string | null;
  meetingPlatform?: string | null;
  rsvpUrl?: string | null;
  attractions?: string | null;
  status?: string | null;
  academicTerm?: string | null;
  academicYear?: string | null;
  posterUrl?: string | null;
  posterFormat?: string | null;
  posterOrientation?: string | null;
};

interface CreateEventModalProps {
  groupId: string;
  initialEvent?: EditableClubEvent | null;
  onClose: () => void;
  onSuccess: (event: Record<string, unknown>) => void;
}

function splitIso(iso?: string | null): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

const field =
  "w-full rounded-lg border border-[#DECDBA] bg-white px-3 py-2.5 text-sm text-[#2D120D] placeholder:text-[#6E5952]/55 focus:outline-none focus:ring-2 focus:ring-[#780D18]/20 focus:border-[#780D18]";

function suggestTerm(dateStr: string): { term: string; year: string } {
  if (!dateStr) {
    const y = new Date().getFullYear();
    return { term: "Fall", year: String(y) };
  }
  const d = new Date(`${dateStr}T12:00:00`);
  const month = d.getMonth() + 1;
  const year = String(d.getFullYear());
  if (month >= 9) return { term: "Fall", year };
  if (month >= 5) return { term: "Spring/Summer", year };
  return { term: "Winter", year };
}

/** Letter / Tabloid paper sizes, or custom free-form. */
function posterAspect(format: PosterFormat, orientation: PosterOrientation): number | undefined {
  if (format === "custom") return undefined;
  const letter = 8.5 / 11;
  const tabloid = 11 / 17;
  const base = format === "tabloid" ? tabloid : letter;
  return orientation === "landscape" ? 1 / base : base;
}

function posterOutput(format: PosterFormat, orientation: PosterOrientation) {
  if (format === "custom") return { width: 2000, height: 2000 };
  // 200 dpi: letter 1700×2200, tabloid 2200×3400
  const dims =
    format === "tabloid"
      ? orientation === "portrait"
        ? [2200, 3400]
        : [3400, 2200]
      : orientation === "portrait"
        ? [1700, 2200]
        : [2200, 1700];
  return { width: dims[0], height: dims[1] };
}

export function CreateEventModal({ groupId, initialEvent = null, onClose, onSuccess }: CreateEventModalProps) {
  const isEdit = Boolean(initialEvent?.id);
  const startParts = splitIso(initialEvent?.startsAt);
  const endParts = splitIso(initialEvent?.endsAt);
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(initialEvent?.title || "");
  const [description, setDescription] = useState(initialEvent?.description || "");
  const [date, setDate] = useState(startParts.date);
  const [startTime, setStartTime] = useState(startParts.time || "18:00");
  const [endTime, setEndTime] = useState(endParts.time || "20:00");
  const [modality, setModality] = useState<Modality>(
    (initialEvent?.modality as Modality) || "in_person"
  );
  const [venueName, setVenueName] = useState(initialEvent?.venueName || "");
  const [venueAddress, setVenueAddress] = useState(initialEvent?.venueAddress || "");
  const [roomNumber, setRoomNumber] = useState(initialEvent?.roomNumber || "");
  const [meetingUrl, setMeetingUrl] = useState(initialEvent?.meetingUrl || "");
  const [meetingPlatform, setMeetingPlatform] = useState(initialEvent?.meetingPlatform || "");
  const [rsvpUrl, setRsvpUrl] = useState(initialEvent?.rsvpUrl || "");
  const [attractions, setAttractions] = useState(initialEvent?.attractions || "");
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [status, setStatus] = useState<"draft" | "published">(
    initialEvent?.status === "draft" ? "draft" : "published"
  );
  const suggested = useMemo(() => suggestTerm(date), [date]);
  const [academicTerm, setAcademicTerm] = useState(initialEvent?.academicTerm || suggested.term);
  const [academicYear, setAcademicYear] = useState(initialEvent?.academicYear || suggested.year);
  const [posterFormat, setPosterFormat] = useState<PosterFormat>(
    initialEvent?.posterFormat === "tabloid"
      ? "tabloid"
      : initialEvent?.posterFormat === "custom"
        ? "custom"
        : "custom"
  );
  const [posterOrientation, setPosterOrientation] = useState<PosterOrientation>(
    initialEvent?.posterOrientation === "landscape" ? "landscape" : "portrait"
  );
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(initialEvent?.posterUrl || null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDateChange = (v: string) => {
    setDate(v);
    const s = suggestTerm(v);
    setAcademicTerm(s.term);
    setAcademicYear(s.year);
  };

  const submit = async () => {
    if (!title.trim() || !date || !startTime) {
      setError("Add a name, date, and start time.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const startsAt = new Date(`${date}T${startTime}:00`).toISOString();
      const endsAt = endTime ? new Date(`${date}T${endTime}:00`).toISOString() : undefined;
      const payload: ClubEventPayload = {
        title: title.trim(),
        description: description.trim(),
        startsAt,
        endsAt,
        modality,
        venueName: modality !== "virtual" ? venueName.trim() || undefined : undefined,
        venueAddress: modality !== "virtual" ? venueAddress.trim() || undefined : undefined,
        roomNumber: modality !== "virtual" ? roomNumber.trim() || undefined : undefined,
        meetingUrl: modality !== "in_person" ? meetingUrl.trim() || undefined : undefined,
        meetingPlatform: modality !== "in_person" ? meetingPlatform.trim() || undefined : undefined,
        rsvpUrl: rsvpUrl.trim() || undefined,
        attractions: attractions.trim() || undefined,
        notifyEmail: !isEdit && notifyEmail && status === "published",
        status,
        academicTerm,
        academicYear,
        posterFormat: posterFormat === "custom" ? "custom" : posterFormat,
        posterOrientation: posterFormat === "custom" ? undefined : posterOrientation,
        location:
          modality === "virtual"
            ? meetingPlatform || meetingUrl || "Virtual"
            : [venueName, roomNumber ? `Room ${roomNumber}` : "", venueAddress].filter(Boolean).join(" · ") ||
              undefined,
      };
      let saved = isEdit && initialEvent
        ? await patchGroupEvent(groupId, initialEvent.id, payload)
        : await createGroupEvent(groupId, payload);
      if (posterFile && saved?.id) {
        saved = await uploadEventPoster(groupId, String(saved.id), posterFile);
      }
      onSuccess(saved);
      onClose();
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(err) ||
          (err instanceof Error ? err.message : null) ||
          (isEdit ? "Failed to update event" : "Failed to create event")
      );
    } finally {
      setSaving(false);
    }
  };

  const aspect = posterAspect(posterFormat, posterOrientation);
  const out = posterOutput(posterFormat, posterOrientation);

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#2D120D]/55"
        onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl border border-[#DECDBA] bg-[#F7F1E8] shadow-2xl max-h-[92vh] overflow-y-auto">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative w-full overflow-hidden group text-left bg-[#2D120D]"
            style={{
              aspectRatio: aspect ? String(aspect) : "16 / 10",
              maxHeight: "16rem",
            }}
          >
            {posterPreview ? (
              <img
                src={assetUrlOrNull(posterPreview) || posterPreview}
                alt=""
                className={`absolute inset-0 w-full h-full ${posterFormat === "custom" ? "object-contain bg-[#2D120D]" : "object-cover"}`}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[#F7F1E8]/85">
                <ImagePlus className="w-8 h-8" />
                <span className="text-xs font-bold tracking-wide">Add poster</span>
                <span className="text-[10px] opacity-70">
                  {posterFormat === "custom"
                    ? "Custom size — any crop"
                    : `${posterFormat === "tabloid" ? "Tabloid 11×17″" : "Letter 8.5×11″"} · ${posterOrientation}`}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#2D120D]/75 via-transparent to-transparent" />
            <div className="absolute top-3 right-3 flex gap-1.5">
              <select
                value={posterFormat}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setPosterFormat(e.target.value as PosterFormat)}
                className="rounded-md bg-black/50 text-white text-[10px] px-2 py-1 border border-white/20"
              >
                <option value="custom">Custom size</option>
                <option value="letter">Letter 8.5×11</option>
                <option value="tabloid">Tabloid 11×17</option>
              </select>
              {posterFormat !== "custom" && (
                <select
                  value={posterOrientation}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setPosterOrientation(e.target.value as PosterOrientation)}
                  className="rounded-md bg-black/50 text-white text-[10px] px-2 py-1 border border-white/20"
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              )}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="absolute top-3 left-3 p-2 rounded-lg bg-black/40 text-white"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) setCropFile(f);
            }}
          />

          <div className="p-5 sm:p-6 space-y-4">
            {error && (
              <p className="text-xs text-[#780D18] bg-[#780D18]/10 border border-[#780D18]/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <input
              className={`${field} font-serif text-lg font-bold`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Event name"
            />
            <textarea
              className={field}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Event description…"
            />

            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ["in_person", "In person", MapPin],
                  ["virtual", "Virtual", Video],
                  ["hybrid", "Hybrid", Blend],
                ] as const
              ).map(([id, text, Icon]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setModality(id)}
                  className={`rounded-xl border p-3 flex flex-col items-center gap-1.5 transition ${
                    modality === id
                      ? "border-[#780D18] bg-[#780D18] text-white"
                      : "border-[#DECDBA] bg-white text-[#2D120D] hover:border-[#780D18]/40"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[11px] font-bold">{text}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="relative col-span-1">
                <CalendarDays className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#6E5952]" />
                <input
                  type="date"
                  className={`${field} pl-9`}
                  value={date}
                  onChange={(e) => onDateChange(e.target.value)}
                />
              </div>
              <div className="relative">
                <Clock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#6E5952]" />
                <input
                  type="time"
                  className={`${field} pl-9`}
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="relative">
                <Clock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#6E5952]" />
                <input
                  type="time"
                  className={`${field} pl-9`}
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            {modality !== "virtual" && (
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    className={field}
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    placeholder="Building / venue"
                  />
                  <input
                    className={field}
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="Room number (campus)"
                  />
                </div>
                <input
                  className={field}
                  value={venueAddress}
                  onChange={(e) => setVenueAddress(e.target.value)}
                  placeholder="Address (optional)"
                />
              </div>
            )}
            {modality !== "in_person" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  className={field}
                  value={meetingPlatform}
                  onChange={(e) => setMeetingPlatform(e.target.value)}
                  placeholder="Platform"
                />
                <input
                  className={field}
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  placeholder="Meeting link"
                />
              </div>
            )}

            <div className="relative">
              <Gift className="w-3.5 h-3.5 absolute left-3 top-3 text-[#780D18]" />
              <input
                className={`${field} pl-9`}
                value={attractions}
                onChange={(e) => setAttractions(e.target.value)}
                placeholder="Free food, swag, prizes…"
              />
            </div>

            <input
              className={field}
              value={rsvpUrl}
              onChange={(e) => setRsvpUrl(e.target.value)}
              placeholder="RSVP link (optional)"
            />

            <div className="grid grid-cols-3 gap-2">
              <select className={field} value={academicTerm} onChange={(e) => setAcademicTerm(e.target.value)}>
                <option>Fall</option>
                <option>Winter</option>
                <option>Spring/Summer</option>
              </select>
              <input
                className={field}
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="Year"
              />
              <select
                className={field}
                value={status}
                onChange={(e) => setStatus(e.target.value as "draft" | "published")}
              >
                <option value="published">Publish</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            {!isEdit && (
              <label className="flex items-start gap-3 rounded-xl border border-[#DECDBA] bg-white p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.checked)}
                  className="mt-0.5 rounded text-[#780D18]"
                />
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-[#2D120D]">
                    <Mail className="w-3.5 h-3.5 text-[#780D18]" />
                    Email opted-in members
                  </span>
                  <span className="text-[11px] text-[#6E5952] block mt-0.5">
                    Needs broadcast permission. Photos can be added later in the event gallery.
                  </span>
                </span>
              </label>
            )}

            <button
              type="button"
              disabled={saving}
              onClick={() => void submit()}
              className="w-full rounded-xl bg-[#780D18] py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {saving
                ? "Saving…"
                : isEdit
                  ? "Save changes"
                  : status === "draft"
                    ? "Save draft"
                    : "Publish event"}
            </button>
          </div>
        </div>
      </div>

      {cropFile && (
        <PhotoCropper
          file={cropFile}
          title={
            posterFormat === "custom"
              ? "Crop poster (custom size)"
              : `Crop ${posterFormat === "tabloid" ? "tabloid 11×17" : "letter 8.5×11"} poster`
          }
          aspect={aspect}
          cropShape="rect"
          outputWidth={out.width}
          outputHeight={out.height}
          maxBytes={12 * 1024 * 1024}
          hint={
            posterFormat === "custom"
              ? "Free-form crop — keep any size. Drag and zoom to frame the poster."
              : undefined
          }
          confirmLabel="Use poster"
          onCancel={() => setCropFile(null)}
          onDone={(cropped) => {
            if (posterPreview) URL.revokeObjectURL(posterPreview);
            setPosterFile(cropped);
            setPosterPreview(URL.createObjectURL(cropped));
            setCropFile(null);
          }}
        />
      )}
    </>
  );
}
