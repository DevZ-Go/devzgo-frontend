import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Camera, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchMyProfile } from "../api/profiles";
import { useAuth } from "../auth/AuthContext";
import { useAccount } from "../auth/account";

const dismissKey = (userId: string) => `devzgo:avatar-prompt-dismissed:${userId}`;

/**
 * Soft prompt for developers without a profile photo.
 * Skippable; reappears on a new browser/profile until they add a photo or dismiss.
 */
export function AvatarPrompt() {
  const { user } = useAuth();
  const { ready, recruiter } = useAccount();
  const userId = user?.id ? String(user.id) : "";
  const [dismissed, setDismissed] = useState(false);

  const profile = useQuery({
    queryKey: ["avatar-prompt-profile", userId],
    queryFn: fetchMyProfile,
    enabled: Boolean(userId) && ready && !recruiter,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!userId) return;
    setDismissed(localStorage.getItem(dismissKey(userId)) === "1");
  }, [userId]);

  if (!ready || recruiter || !userId || dismissed) return null;
  if (profile.isLoading || profile.isError) return null;
  if (profile.data?.avatarUrl) return null;
  // Wait until username/name gates are cleared so prompts don't stack.
  if (user?.username_needs_choice || user?.name_needs_choice) return null;

  function skip() {
    localStorage.setItem(dismissKey(userId), "1");
    setDismissed(true);
  }

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-[65] mx-auto flex max-w-lg items-start gap-3 rounded-2xl border border-[#DECDBA] bg-[#FAF7EE] p-4 shadow-2xl sm:left-auto sm:right-6"
      role="dialog"
      aria-labelledby="avatar-prompt-title"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-maroon-800 text-amber-50">
        <Camera className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 id="avatar-prompt-title" className="font-serif text-lg font-bold text-stone-900">
          Add a profile photo
        </h2>
        <p className="mt-0.5 text-sm text-stone-600">
          Help people recognise you on Network and Explore.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Link
            to="/settings?section=account"
            className="inline-flex min-h-9 items-center rounded-xl bg-maroon-800 px-4 text-xs font-semibold text-white hover:bg-maroon-900"
          >
            Upload photo
          </Link>
          <button
            type="button"
            onClick={skip}
            className="inline-flex min-h-9 items-center rounded-xl px-3 text-xs font-semibold text-stone-600 hover:bg-stone-200/70"
          >
            Not now
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={skip}
        className="-mr-1 -mt-1 rounded-lg p-1 text-stone-400 hover:bg-stone-200/70 hover:text-stone-800"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
