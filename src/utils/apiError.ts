import axios from "axios";

/** Extract a readable message from FastAPI / axios errors. */
export function getApiErrorMessage(err: unknown): string {
  if (!axios.isAxiosError(err)) {
    return err instanceof Error ? err.message : "Something went wrong";
  }

  const data = err.response?.data as
    | { detail?: string | Array<{ msg?: string; loc?: unknown[] }> }
    | undefined;

  if (!data) {
    return err.message || "Request failed";
  }

  if (typeof data.detail === "string") {
    return data.detail;
  }

  if (Array.isArray(data.detail)) {
    return data.detail
      .map((d) => (typeof d === "object" && d && "msg" in d ? String(d.msg) : String(d)))
      .join(". ");
  }

  return err.message || "Request failed";
}
