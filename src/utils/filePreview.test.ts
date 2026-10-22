import { describe, expect, it } from "vitest";
import { sameOriginStream, viewerFor } from "./filePreview";

describe("viewerFor", () => {
  it("keeps known kinds and treats the rest as binary", () => {
    expect(viewerFor("svg")).toBe("svg");
    expect(viewerFor("pdf")).toBe("pdf");
    expect(viewerFor("nope")).toBe("binary");
  });
});

describe("sameOriginStream", () => {
  const id = "11111111-1111-1111-1111-111111111111";

  it("accepts this project's stream path and drops anything else", () => {
    const ok = `https://api.example/projects/${id}/files/stream?path=a.txt&token=abc`;
    expect(sameOriginStream(ok, id)).toBe(`/projects/${id}/files/stream?path=a.txt&token=abc`);
    expect(sameOriginStream("javascript:alert(1)", id)).toBeNull();
    expect(sameOriginStream(`https://api.example/projects/${id}/file/raw?path=a`, id)).toBeNull();
    expect(sameOriginStream(`https://api.example/projects/other/files/stream?path=a`, id)).toBeNull();
  });
});
