import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown } from "lucide-react";

type Props = {
  id?: string;
  value: string;
  options: readonly string[];
  placeholder: string;
  onChange: (value: string) => void;
  className: string;
};

/** A styled single-choice dropdown that follows the listbox keyboard pattern. */
export function SelectMenu({ id, value, options, placeholder, onChange, className }: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [upward, setUpward] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  useEffect(() => {
    if (open) listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  function show() {
    const box = rootRef.current?.getBoundingClientRect();
    setUpward(Boolean(box && window.innerHeight - box.bottom < 300 && box.top > window.innerHeight - box.bottom));
    setActive(Math.max(0, options.indexOf(value)));
    setOpen(true);
  }

  function choose(index: number) {
    const picked = options[index];
    if (picked !== undefined) onChange(picked);
    setOpen(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        show();
      }
      return;
    }
    if (event.key === "ArrowDown") setActive((i) => Math.min(options.length - 1, i + 1));
    else if (event.key === "ArrowUp") setActive((i) => Math.max(0, i - 1));
    else if (event.key === "Home") setActive(0);
    else if (event.key === "End") setActive(options.length - 1);
    else if (event.key === "Enter" || event.key === " ") choose(active);
    else if (event.key === "Escape" || event.key === "Tab") {
      setOpen(false);
      if (event.key === "Tab") return;
    } else if (event.key.length === 1) {
      const match = options.findIndex((option) => option.toLowerCase().startsWith(event.key.toLowerCase()));
      if (match >= 0) setActive(match);
      return;
    } else return;
    event.preventDefault();
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
        className={`${className} flex items-center justify-between gap-3 text-left`}
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>{value || placeholder}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-stone-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          className={`absolute left-0 right-0 z-30 max-h-72 overflow-auto rounded-2xl border border-stone-200 bg-white p-1.5 shadow-xl shadow-stone-900/10 ${upward ? "bottom-full mb-2" : "top-full mt-2"}`}
        >
          {options.map((option, index) => {
            const selected = option === value;
            return (
              <li
                key={option}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setActive(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(index)}
                className={`flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors ${
                  index === active ? "bg-[#f7f5ed]" : ""
                } ${selected ? "font-semibold text-maroon-800" : "text-stone-700"}`}
              >
                {option}
                {selected && <Check className="h-4 w-4 text-maroon-800" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
