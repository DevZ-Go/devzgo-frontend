import { autocompletion } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { css } from "@codemirror/lang-css";
import { go } from "@codemirror/lang-go";
import { html } from "@codemirror/lang-html";
import { java } from "@codemirror/lang-java";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { php } from "@codemirror/lang-php";
import { python } from "@codemirror/lang-python";
import { rust } from "@codemirror/lang-rust";
import { sql } from "@codemirror/lang-sql";
import { xml } from "@codemirror/lang-xml";
import { yaml } from "@codemirror/lang-yaml";
import { cpp } from "@codemirror/lang-cpp";
import { bracketMatching, StreamLanguage, syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";
import { shell } from "@codemirror/legacy-modes/mode/shell";
import { MergeView } from "@codemirror/merge";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { EditorState, type Extension } from "@codemirror/state";
import { EditorView, highlightActiveLine, keymap, lineNumbers } from "@codemirror/view";

function languageOf(path: string): Extension | null {
  const ext = path.toLowerCase().split(".").pop() ?? "";
  const name = path.split("/").pop()?.toLowerCase() ?? "";
  if (name === "dockerfile" || ext === "sh" || ext === "bash") return StreamLanguage.define(shell);
  if (ext === "py") return python();
  if (ext === "ts" || ext === "tsx") return javascript({ typescript: true, jsx: ext === "tsx" });
  if (ext === "js" || ext === "jsx" || ext === "mjs" || ext === "cjs") return javascript({ jsx: ext === "jsx" });
  if (ext === "java") return java();
  if (ext === "go") return go();
  if (ext === "rs") return rust();
  if (ext === "php") return php();
  if (ext === "cpp" || ext === "cc" || ext === "cxx" || ext === "h" || ext === "hpp") return cpp();
  if (ext === "html" || ext === "htm") return html();
  if (ext === "css") return css();
  if (ext === "sql") return sql();
  if (ext === "json") return json();
  if (ext === "xml" || ext === "svg") return xml();
  if (ext === "md" || ext === "markdown") return markdown();
  if (ext === "yml" || ext === "yaml") return yaml();
  return null;
}

const theme = EditorView.theme({
  "&": { backgroundColor: "#FFFcf5", color: "#1C1917", fontSize: "13px", maxHeight: "480px" },
  ".cm-scroller": { overflow: "auto", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" },
  ".cm-gutters": { backgroundColor: "#F5F0E6", color: "#78716C", border: "none" },
});

function extensions(path: string, readOnly: boolean, onChange?: (value: string) => void): Extension[] {
  const language = languageOf(path);
  return [
    lineNumbers(),
    history(),
    bracketMatching(),
    highlightActiveLine(),
    highlightSelectionMatches(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    autocompletion(),
    keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
    theme,
    EditorState.readOnly.of(readOnly),
    EditorView.editable.of(!readOnly),
    ...(language ? [language] : []),
    ...(onChange
      ? [EditorView.updateListener.of((update) => { if (update.docChanged) onChange(update.state.doc.toString()); })]
      : []),
  ];
}

export function createEditor(parent: HTMLElement, doc: string, path: string, readOnly: boolean, onChange: (value: string) => void) {
  return new EditorView({
    parent,
    state: EditorState.create({ doc, extensions: extensions(path, readOnly, readOnly ? undefined : onChange) }),
  });
}

export function mountMerge(parent: HTMLElement, original: string, value: string, path: string) {
  return new MergeView({
    parent,
    a: { doc: original, extensions: extensions(path, true) },
    b: { doc: value, extensions: extensions(path, true) },
  });
}
