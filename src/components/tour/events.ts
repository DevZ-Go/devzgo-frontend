export const TOUR_EVENT = "devzgo:recruiter-tour";

export function openRecruiterTour() {
  window.dispatchEvent(new Event(TOUR_EVENT));
}
