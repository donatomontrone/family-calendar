import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";

type SwipeTaskRowProps = {
  item: { id: number; label: string; done: boolean };
  deleteLabel: string;
  onToggle: () => void;
  onDelete: () => void;
};

type Gesture = {
  pointerId: number;
  startX: number;
  startY: number;
  startOffset: number;
  width: number;
  horizontal: boolean;
};

const REVEAL_WIDTH = 72;
const START_THRESHOLD = 6;
const DELETE_RATIO = 0.52;
const OPEN_EVENT = "family-calendar-task-swipe-open";

export default function SwipeTaskRow({ item, deleteLabel, onToggle, onDelete }: SwipeTaskRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const offsetRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const suppressClickUntilRef = useRef(0);
  const instanceIdRef = useRef(`task-${item.id}-${Math.random().toString(36).slice(2)}`);

  const paintOffset = (value: number) => {
    const row = rowRef.current;
    if (!row) return;

    const reveal = Math.max(0, -value);
    row.style.setProperty("--task-swipe-x", `${value}px`);
    row.style.setProperty("--task-swipe-reveal", `${reveal}px`);
    row.style.setProperty("--task-delete-opacity", String(Math.min(1, reveal / 34)));
    row.classList.toggle("delete-commit-ready", reveal >= Math.max(REVEAL_WIDTH * 1.7, row.clientWidth * DELETE_RATIO));
  };

  const setOffset = (value: number, immediate = false) => {
    offsetRef.current = value;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (immediate) {
      paintOffset(value);
      return;
    }

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      paintOffset(value);
    });
  };

  const settle = (value: number) => {
    const row = rowRef.current;
    if (!row) return;
    row.classList.remove("is-swiping");
    setOffset(value, true);
  };

  useEffect(() => {
    const handleOtherRowOpen = (event: Event) => {
      const id = (event as CustomEvent<string>).detail;
      if (id === instanceIdRef.current || offsetRef.current === 0) return;
      settle(0);
    };

    document.addEventListener(OPEN_EVENT, handleOtherRowOpen);
    return () => {
      document.removeEventListener(OPEN_EVENT, handleOtherRowOpen);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
    if ((event.target as Element).closest(".swipe-delete-action")) return;

    const row = rowRef.current;
    if (!row) return;

    gestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startOffset: offsetRef.current,
      width: Math.max(1, row.getBoundingClientRect().width),
      horizontal: false,
    };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;
    const row = rowRef.current;
    if (!gesture || !row || gesture.pointerId !== event.pointerId) return;

    const dx = event.clientX - gesture.startX;
    const dy = event.clientY - gesture.startY;

    if (!gesture.horizontal) {
      if (Math.abs(dx) < START_THRESHOLD && Math.abs(dy) < START_THRESHOLD) return;
      if (Math.abs(dy) >= Math.abs(dx) * 0.92) {
        gestureRef.current = null;
        return;
      }

      gesture.horizontal = true;
      row.classList.add("is-swiping");
      try {
        row.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture is an enhancement; the gesture still works without it.
      }
    }

    event.preventDefault();
    const next = Math.max(-gesture.width, Math.min(0, gesture.startOffset + dx));
    setOffset(next);
  };

  const finishGesture = (event: ReactPointerEvent<HTMLDivElement>, cancelled = false) => {
    const gesture = gestureRef.current;
    const row = rowRef.current;
    if (!gesture || !row || gesture.pointerId !== event.pointerId) return;
    gestureRef.current = null;

    if (!gesture.horizontal) return;

    try {
      row.releasePointerCapture(event.pointerId);
    } catch {
      // Browsers may release capture automatically.
    }

    suppressClickUntilRef.current = performance.now() + 280;
    row.classList.remove("is-swiping");

    if (cancelled) {
      settle(gesture.startOffset);
      return;
    }

    const distance = -offsetRef.current;
    if (distance >= gesture.width * DELETE_RATIO) {
      row.classList.add("is-deleting");
      setOffset(-gesture.width, true);
      window.setTimeout(onDelete, 190);
      return;
    }

    if (distance >= REVEAL_WIDTH * 0.48) {
      settle(-REVEAL_WIDTH);
      document.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: instanceIdRef.current }));
      return;
    }

    settle(0);
  };

  const onClickCapture = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (performance.now() < suppressClickUntilRef.current) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (offsetRef.current === 0 || (event.target as Element).closest(".swipe-delete-action")) return;
    event.preventDefault();
    event.stopPropagation();
    settle(0);
  };

  return (
    <div
      ref={rowRef}
      className={`task-row swipe-task-row ${item.done ? "done" : ""}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(event) => finishGesture(event)}
      onPointerCancel={(event) => finishGesture(event, true)}
      onClickCapture={onClickCapture}
    >
      <button
        type="button"
        className="swipe-delete-action"
        onClick={onDelete}
        aria-label={deleteLabel}
        title={deleteLabel}
      >
        <TrashIcon />
      </button>

      <div className="task-row-content">
        <label>
          <input className="task-checkbox-input" type="checkbox" checked={item.done} onChange={onToggle} />
          <span className="task-check-indicator" aria-hidden="true"><CheckIcon /></span>
          <span className="task-label">{item.label}</span>
        </label>
      </div>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

function CheckIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6.2 12.4 3.65 3.65L17.9 8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
