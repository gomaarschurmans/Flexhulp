"use client";

import { useRef, useState } from "react";
import { formatRating } from "@/lib/utils";

/**
 * Toont een score als sterren, tot op de helft ingekleurd: bij 3,5 zijn drie
 * sterren en een halve ster gekleurd. Werkt ook voor gemiddelden (4,3).
 */
export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  const v = Math.max(0, Math.min(5, Number(value)));
  return (
    <span
      role="img"
      aria-label={`${formatRating(v)} van 5 sterren`}
      className="relative inline-block whitespace-nowrap leading-none"
      style={{ fontSize: size }}
    >
      <span className="text-[#D9D5CC]">★★★★★</span>
      <span
        className="absolute left-0 top-0 overflow-hidden whitespace-nowrap text-amber-deep"
        style={{ width: `${(v / 5) * 100}%` }}
      >
        ★★★★★
      </span>
    </span>
  );
}

const MIN = 1;
const MAX = 5;
const STEP = 0.5;

/**
 * Sterrenkiezer met halve sterren: tik of klik op de linkerhelft van een ster
 * voor een halve ster, op de rechterhelft voor een hele. Alle sterren tot de
 * gekozen waarde kleuren in. Ook te bedienen met de pijltjestoetsen.
 */
export function StarRatingInput({
  name,
  defaultValue = 5,
  size = 40,
}: {
  name: string;
  defaultValue?: number;
  size?: number;
}) {
  const [value, setValue] = useState(defaultValue);
  const [hover, setHover] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  const clamp = (n: number) => Math.min(MAX, Math.max(MIN, n));
  const valueAt = (clientX: number) => {
    const rect = box.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return value;
    const ratio = (clientX - rect.left) / rect.width;
    return clamp(Math.ceil(ratio * (MAX / STEP)) * STEP);
  };

  function onKeyDown(e: React.KeyboardEvent) {
    const move = (delta: number) => {
      e.preventDefault();
      setValue((v) => clamp(v + delta));
    };
    if (e.key === "ArrowRight" || e.key === "ArrowUp") move(STEP);
    else if (e.key === "ArrowLeft" || e.key === "ArrowDown") move(-STEP);
    else if (e.key === "Home") {
      e.preventDefault();
      setValue(MIN);
    } else if (e.key === "End") {
      e.preventDefault();
      setValue(MAX);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <input type="hidden" name={name} value={value} />
      <div
        ref={box}
        role="slider"
        tabIndex={0}
        aria-label="Aantal sterren"
        aria-valuemin={MIN}
        aria-valuemax={MAX}
        aria-valuenow={value}
        aria-valuetext={`${formatRating(value)} van 5 sterren`}
        onKeyDown={onKeyDown}
        onPointerDown={(e) => {
          setDragging(true);
          e.currentTarget.setPointerCapture(e.pointerId);
          setValue(valueAt(e.clientX));
        }}
        onPointerMove={(e) => {
          if (dragging) setValue(valueAt(e.clientX));
          else if (e.pointerType === "mouse") setHover(valueAt(e.clientX));
        }}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        onPointerLeave={() => setHover(null)}
        className="inline-block cursor-pointer touch-none select-none rounded outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal"
      >
        <Stars value={hover ?? value} size={size} />
      </div>
      <span className="text-sm font-medium text-ink">{formatRating(value)} van 5</span>
    </div>
  );
}
