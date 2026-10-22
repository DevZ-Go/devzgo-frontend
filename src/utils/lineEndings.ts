export function lineEndingOf(text: string): "lf" | "crlf" {
  return text.includes("\r\n") ? "crlf" : "lf";
}

export function hasBom(text: string): boolean {
  return text.charCodeAt(0) === 0xfeff;
}
