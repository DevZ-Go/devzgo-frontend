import { expect, it } from "vitest";
import { passwordValid } from "./passwordPolicy";

it("matches the backend password rules", () => {
  expect(passwordValid("Password1!")).toBe(true);
  expect(passwordValid("Ünïcode_pass")).toBe(true);
  expect(passwordValid("password1!")).toBe(false);
  expect(passwordValid("Password12")).toBe(false);
  expect(passwordValid("Pa!1")).toBe(false);
  expect(passwordValid("P!" + "a".repeat(127))).toBe(false);
});
