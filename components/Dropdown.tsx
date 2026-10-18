"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CheckIcon, ChevronIcon } from "./Icons";

export interface DropdownOption<V extends string | number> {
  value: V;
  label: string;
}

interface Props<V extends string | number> {
  id: string;
  /** Id of the visible label element. */
  labelledBy: string;
  value: V;
  options: DropdownOption<V>[];
  onChange: (value: V) => void;
  className?: string;
}

/** A styled dropdown (select-only combobox): focus stays on the button, arrow keys move through the list. */
export function Dropdown<V extends string | number>({ id, labelledBy, value, options, onChange, className = "" }: Props<V>) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selected = Math.max(0, options.findIndex((o) => o.value === value));
  const [active, setActive] = useState(selected);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  function show() {
    setActive(selected);
    setOpen(true);
  }

  function choose(i: number) {
    onChange(options[i].value);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const last = options.length - 1;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (open) setActive(Math.min(last, active + 1));
        else show();
        break;
      case "ArrowUp":
        e.preventDefault();
        if (open) setActive(Math.max(0, active - 1));
        else show();
        break;
      case "Home":
        if (open) {
          e.preventDefault();
          setActive(0);
        }
        break;
      case "End":
        if (open) {
          e.preventDefault();
          setActive(last);
        }
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (open) choose(active);
        else show();
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          setOpen(false);
        }
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={labelledBy}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
        className="flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border-2 border-line-strong bg-surface px-4 py-3 text-left text-lg font-semibold text-ink hover:bg-hover"
      >
        <span>{options[selected]?.label}</span>
        <ChevronIcon className={`h-5 w-5 shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={labelledBy}
          className="absolute left-0 top-full z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border-2 border-line-strong bg-surface p-1 shadow-lg"
        >
          {options.map((o, i) => (
            <li
              key={o.value}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === selected}
              onPointerEnter={() => setActive(i)}
              // Keep focus on the button so the click does not blur it first.
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => choose(i)}
              className={`flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-lg ${
                i === active ? "bg-accent text-accent-ink" : ""
              } ${i === selected ? "font-bold" : ""}`}
            >
              {o.label}
              {i === selected && <CheckIcon className="h-5 w-5 shrink-0" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
