import type { ReactNode } from "react";

const URL_RE = /(https?:\/\/[^\s<>"')\]]+)/gi;

/** Turn plain-text URLs into safe external links for project descriptions. */
export function linkifyText(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  const re = new RegExp(URL_RE.source, URL_RE.flags);
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }
    const href = match[1];
    nodes.push(
      <a
        key={`url-${match.index}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-forest-700 underline decoration-forest-700/30 underline-offset-2 hover:text-maroon-800"
      >
        {href}
      </a>,
    );
    last = match.index + href.length;
  }
  if (last < text.length) {
    nodes.push(text.slice(last));
  }
  return nodes.length ? nodes : [text];
}
