import { describe, expect, it } from "vitest";
import { hasBom, lineEndingOf } from "./lineEndings";

describe("line endings", () => {
  it("detects CRLF and a leading BOM", () => {
    expect(lineEndingOf("a\nb")).toBe("lf");
    expect(lineEndingOf("a\r\nb")).toBe("crlf");
    expect(hasBom("\ufeffhello")).toBe(true);
    expect(hasBom("hello")).toBe(false);
  });
});
