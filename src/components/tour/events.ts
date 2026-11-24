export const RECRUITER_TOUR_EVENT = "devzgo:recruiter-tour";
export const DEVELOPER_TOUR_EVENT = "devzgo:developer-tour";
export const GUEST_TOUR_EVENT = "devzgo:guest-tour";

/** @deprecated use RECRUITER_TOUR_EVENT */
export const TOUR_EVENT = RECRUITER_TOUR_EVENT;

export function openRecruiterTour() {
  window.dispatchEvent(new Event(RECRUITER_TOUR_EVENT));
}

export function openDeveloperTour() {
  window.dispatchEvent(new Event(DEVELOPER_TOUR_EVENT));
}

export function openGuestTour() {
  window.dispatchEvent(new Event(GUEST_TOUR_EVENT));
}
