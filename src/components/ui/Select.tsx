import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

export type SelectOption = { value: string; label: string; hint?: string; disabled?: boolean };
type OptionInput = SelectOption | readonly [string, string, ...string[]] | string;

function normalize(option: OptionInput): SelectOption {
  if (typeof option === "string") return { value: option, label: option };
  if (Array.isArray(option)) return { value: option[0], label: option[1], hint: option[2] };
  return option as SelectOption;
}

type Place = { left: number; top: number; width: number; maxHeight: number; above: boolean };

const GAP = 6;
const MAX_HEIGHT = 288;

/**
 * The app's dropdown. Same look as the text inputs it sits beside, with a list that matches the
 * rest of the UI instead of the operating system's menu. Keyboard: arrows, Home/End, Enter/Space,
 * Escape, and typing a letter to jump.
 */
export function Select({
  value,
  onChange,
  options,
  className = "",
  placeholder = "Choose…",
  disabled,
  required,
  id,
  name,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly OptionInput[];
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}) {
  const items = useMemo(() => options.map(normalize), [options]);
  const listId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typed = useRef({ text: "", at: 0 });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [place, setPlace] = useState<Place | null>(null);

  const selectedIndex = items.findIndex((item) => item.value === value);
  const selected = selectedIndex >= 0 ? items[selectedIndex] : null;

  const measure = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const below = window.innerHeight - rect.bottom - GAP - 8;
    const aboveSpace = rect.top - GAP - 8;
    const above = below < Math.min(MAX_HEIGHT, 180) && aboveSpace > below;
    setPlace({
      left: rect.left,
      top: above ? rect.top - GAP : rect.bottom + GAP,
      width: rect.width,
      maxHeight: Math.max(120, Math.min(MAX_HEIGHT, above ? aboveSpace : below)),
      above,
    });
  }, []);

  const firstEnabled = useCallback(
    (from: number, step: 1 | -1) => {
      for (let i = from; i >= 0 && i < items.length; i += step) if (!items[i]!.disabled) return i;
      return -1;
    },
    [items],
  );

  const openList = useCallback(() => {
    if (disabled) return;
    measure();
    setActive(selectedIndex >= 0 ? selectedIndex : firstEnabled(0, 1));
    setOpen(true);
  }, [disabled, measure, selectedIndex, firstEnabled]);

  const close = useCallback((refocus = true) => {
    setOpen(false);
    if (refocus) buttonRef.current?.focus();
  }, []);

  const choose = (index: number) => {
    const item = items[index];
    if (!item || item.disabled) return;
    if (item.value !== value) onChange(item.value);
    close();
  };

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => measure();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, measure]);

  useEffect(() => {
    if (!open) return;
    const outside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || listRef.current?.contains(target)) return;
      close(false);
    };
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, [open, close]);

  useEffect(() => {
    if (!open || active < 0) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  function jumpTo(char: string) {
    const now = Date.now();
    typed.current = { text: now - typed.current.at > 700 ? char : typed.current.text + char, at: now };
    const query = typed.current.text.toLowerCase();
    const start = open ? active : selectedIndex;
    const order = [...items.keys()].map((_, i) => (start + 1 + i) % items.length);
    const hit = order.find((i) => !items[i]!.disabled && items[i]!.label.toLowerCase().startsWith(query));
    if (hit === undefined) return;
    if (open) setActive(hit);
    else if (items[hit]!.value !== value) onChange(items[hit]!.value);
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const key = event.key;
    if (!open) {
      if (key === "ArrowDown" || key === "ArrowUp" || key === "Enter" || key === " ") {
        event.preventDefault();
        openList();
      } else if (key.length === 1 && /\S/.test(key)) {
        jumpTo(key);
      }
      return;
    }
    if (key === "Escape") {
      event.preventDefault();
      close();
    } else if (key === "Tab") {
      close(false);
    } else if (key === "ArrowDown") {
      event.preventDefault();
      const next = firstEnabled(active + 1, 1);
      if (next >= 0) setActive(next);
    } else if (key === "ArrowUp") {
      event.preventDefault();
      const prev = firstEnabled(active - 1, -1);
      if (prev >= 0) setActive(prev);
    } else if (key === "Home") {
      event.preventDefault();
      setActive(firstEnabled(0, 1));
    } else if (key === "End") {
      event.preventDefault();
      setActive(firstEnabled(items.length - 1, -1));
    } else if (key === "Enter" || key === " ") {
      event.preventDefault();
      choose(active);
    } else if (key.length === 1 && /\S/.test(key)) {
      jumpTo(key);
    }
  }

  return (
    <>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-required={required || undefined}
        disabled={disabled}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onKeyDown}
        className={`devz-select relative flex items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        <span className={`min-w-0 flex-1 truncate ${selected ? "" : "text-stone-400"}`}>{selected?.label ?? placeholder}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 opacity-60 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {(required || name) && (
        <input
          tabIndex={-1}
          aria-hidden
          name={name}
          required={required}
          value={value}
          onChange={() => undefined}
          onFocus={() => buttonRef.current?.focus()}
          className="pointer-events-none absolute h-0 w-0 opacity-0"
        />
      )}
      {open && place &&
        createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            style={{
              position: "fixed",
              left: place.left,
              top: place.top,
              minWidth: place.width,
              maxWidth: Math.max(place.width, 320),
              maxHeight: place.maxHeight,
              transform: place.above ? "translateY(-100%)" : undefined,
            }}
            className="devz-select-list z-[1000] overflow-y-auto rounded-2xl border border-stone-200 bg-white p-1.5 text-sm text-stone-800 shadow-lg shadow-stone-900/10"
          >
            {items.map((item, index) => {
              const isSelected = index === selectedIndex;
              const isActive = index === active;
              return (
                <li
                  key={`${item.value}-${index}`}
                  id={`${listId}-${index}`}
                  data-index={index}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={item.disabled || undefined}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => !item.disabled && setActive(index)}
                  onClick={() => choose(index)}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 ${
                    item.disabled
                      ? "cursor-not-allowed text-stone-400"
                      : isActive
                        ? "bg-amber-50 text-stone-900"
                        : "text-stone-700"
                  } ${isSelected ? "font-semibold text-maroon-800" : ""}`}
                >
                  <span className="min-w-0">
                    <span className="block break-words">{item.label}</span>
                    {item.hint && <span className="mt-0.5 block text-xs font-normal leading-snug text-stone-500">{item.hint}</span>}
                  </span>
                  {isSelected && <Check className="h-4 w-4 shrink-0 text-maroon-800" aria-hidden />}
                </li>
              );
            })}
            {items.length === 0 && <li className="px-3 py-2 text-stone-400">Nothing to choose</li>}
          </ul>,
          document.body,
        )}
    </>
  );
}
