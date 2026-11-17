export type ParsedChat = {
  forwarded: boolean;
  voice: boolean;
  reply?: { id?: string; name: string; snippet: string };
  contact?: { name: string; username: string; href: string };
  text: string;
};

/** Pull reply, contact and forward markers out of a message body. */
export function parseChatContent(raw: string): ParsedChat {
  let text = raw || "";
  let forwarded = false;
  let voice = false;
  let reply: ParsedChat["reply"];
  let contact: ParsedChat["contact"];
  if (text.startsWith("⟦voice⟧")) {
    voice = true;
    text = text.slice("⟦voice⟧".length).replace(/^\n/, "");
  }
  if (text.startsWith("⟦fwd⟧")) {
    forwarded = true;
    text = text.slice("⟦fwd⟧".length).replace(/^\n/, "");
  }
  const replyMatch = text.match(/^⟦reply:([^⟧]*)⟧([\s\S]*?)⟦\/reply⟧\n?/);
  if (replyMatch) {
    const rawName = replyMatch[1] || "Message";
    const splitAt = rawName.indexOf("|");
    const maybeId = splitAt >= 0 ? rawName.slice(0, splitAt) : "";
    const named = splitAt >= 0 ? rawName.slice(splitAt + 1) : rawName;
    reply = {
      id: /^[0-9a-f-]{36}$/i.test(maybeId) ? maybeId : undefined,
      name: named || "Message",
      snippet: replyMatch[2] || "",
    };
    text = text.slice(replyMatch[0].length);
  }
  const contactMatch = text.match(/^⟦contact:([^|]*)\|([^|]*)\|([^⟧]*)⟧\n?/);
  if (contactMatch) {
    contact = { href: contactMatch[1] || "/profile", name: contactMatch[2] || "Member", username: contactMatch[3] || "" };
    text = text.slice(contactMatch[0].length);
  }
  return { forwarded, voice, reply, contact, text };
}

export function replyBody(id: string, name: string, snippet: string, text: string): string {
  const short = snippet.replace(/\s+/g, " ").trim().slice(0, 80);
  const safeName = name.split("|").join(" ").split("⟧").join("");
  return `⟦reply:${id}|${safeName}⟧${short}⟦/reply⟧\n${text}`;
}

export function contactBody(href: string, name: string, username: string): string {
  return `⟦contact:${href}|${name.split("|").join(" ")}|${username.split("|").join("")}⟧`;
}

export function forwardBody(text: string): string {
  return `⟦fwd⟧\n${text}`;
}

export function visibleText(raw: string): string {
  const parsed = parseChatContent(raw);
  if (parsed.voice && !parsed.text) return "";
  if (parsed.contact) return `${parsed.contact.name} (@${parsed.contact.username})`;
  return parsed.text;
}

const URLS = /https?:\/\/[^\s]+/g;

export function linksIn(raw: string): string[] {
  return visibleText(raw).match(URLS) || [];
}
