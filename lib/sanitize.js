import DOMPurify from "isomorphic-dompurify";

// Null byte / control char guard (allow \n, \t, \r)
const CTRL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

export function hasBadChars(str) {
  return typeof str === "string" && CTRL_RE.test(str);
}

// Strip ALL HTML, return plain text. Use for titles, names, short fields.
export function sanitizeText(input) {
  if (typeof input !== "string") return "";
  const clean = DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  return clean.trim().normalize("NFC");
}

// Allow safe subset. Use for explanation / description.
const RICH_ALLOWED_TAGS = ["p", "br", "strong", "em", "b", "i", "u", "ul", "ol", "li", "code", "pre", "blockquote", "a"];
const RICH_ALLOWED_ATTR = ["href", "title", "target", "rel"];

export function sanitizeRichText(input) {
  if (typeof input !== "string") return "";
  const clean = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: RICH_ALLOWED_TAGS,
    ALLOWED_ATTR: RICH_ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|tel:|#)/i,
  });
  return clean.trim().normalize("NFC");
}
