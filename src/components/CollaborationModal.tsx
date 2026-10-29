import { useState } from "react";
import { Users, X, Loader2, CheckCircle } from "lucide-react";
import { requestCollaboration } from "../api/collaborations";
import { getApiErrorMessage } from "../utils/apiError";
import { Select } from "./ui/Select";

interface CollaborationModalProps {
  projectId: string;
  projectTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const COMMON_ROLES = [
  "Frontend Engineer",
  "Backend Developer",
  "Full Stack Engineer",
  "UI/UX Designer",
  "DevOps / Cloud Architect",
  "Mobile Developer",
  "ML / AI Specialist",
  "QA & Testing Engineer",
];

export function CollaborationModal({
  projectId,
  projectTitle,
  isOpen,
  onClose,
  onSuccess,
}: CollaborationModalProps) {
  const [role, setRole] = useState(COMMON_ROLES[0]!);
  const [customRole, setCustomRole] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const chosenRole = role === "Other" && customRole.trim() ? customRole.trim() : role;

    try {
      await requestCollaboration(projectId, {
        role: chosenRole,
        message: message.trim() || undefined,
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#FDFBF7] p-6 sm:p-8 shadow-2xl border-2 border-forest-600/30 font-sans">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-10 text-center">
            <CheckCircle className="w-14 h-14 text-forest-600 mx-auto mb-3 animate-bounce" />
            <h3 className="font-cursive text-3xl font-bold text-[#1C1917] mb-1">
              Collaboration Request Sent!
            </h3>
            <p className="text-sm text-stone-600">
              The project owner will be notified to review your proposal.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-gradient-to-tr from-maroon-800 to-autumn-rust text-white shadow-md shadow-maroon-800/20">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-forest-700 uppercase tracking-wide">
                  Developer Collaboration
                </div>
                <h3 className="font-cursive text-3xl font-bold text-[#1C1917]">
                  Request to Join Project
                </h3>
              </div>
            </div>

            <div className="mb-5 p-3.5 rounded-2xl bg-white border border-stone-200">
              <span className="text-xs text-stone-500 uppercase tracking-wider block mb-1">
                Target Project
              </span>
              <p className="text-sm font-semibold text-[#1C1917] truncate">
                {projectTitle}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-crimson-50 border border-crimson-200 text-xs text-crimson-800">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                  Role / Specialization
                </label>
                <Select
                  aria-label="Role / Specialization"
                  value={role}
                  onChange={setRole}
                  options={[...COMMON_ROLES.map((r) => [r, r] as const), ["Other", "Other (Custom Role)"] as const]}
                  className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-[#1C1917] shadow-sm"
                />
                {role === "Other" && (
                  <input
                    type="text"
                    placeholder="Enter custom role..."
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    required
                    className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-sm text-[#1C1917] shadow-sm focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-400"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                  Proposal & Experience (Optional)
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share what components you want to build, tech experience, or why you're interested in collaborating..."
                  className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-[#1C1917] shadow-sm focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-400"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-maroon-800 via-maroon-700 to-autumn-rust text-sm font-semibold text-white shadow-md shadow-maroon-800/20 hover:from-maroon-900 hover:to-autumn-amber transition disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Submit Proposal
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
