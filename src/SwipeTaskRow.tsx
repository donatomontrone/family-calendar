import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";

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
  horizontal: boolean;
};

const REVEAL_WIDTH = 64;
const START_THRESHOLD = 6;
const OPEN_THRESHOLD = 28;
const DELETE_RATIO = 0.46;
const SWIPE_OPEN_EVENT = "family-calendar-task-swipe-open";

export default function SwipeTaskRow({ item, deleteLabel, onToggle, onDelete }: SwipeTaskRowProps) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const gestureRef = useRef<Gesture | null>(null);
  const offsetRef = useRef(0);
  const suppressClickRef = useRef(false);

  const setSwipeOffset = (value: number) => {
    offsetRef.current = value;
    setOffset(value);
  };

  useEffect(() => {
    const closeWhenAnotherRowOpens = (event: Event) => {
      const openedId = (event as CustomEvent<number>).detail;
      if (openedId === item.id || offsetRef.current === 0) return;
      setSwipeOffset(0);
    };

    window.addEventListener(SWIPE_OPEN_EVENT, closeWhenAnotherRowOpens);
    return () => window.removeEventListener(SWIPE_OPEN_EVENT, closeWhenAnotherRowOpens);
  }, [item.id]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;

    suppressClickRef.current = false;
    gestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startOffset: offsetRef.current,
      horizontal: false,
    };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;

    const dx = event.clientX - gesture.startX;
    const dy = event.clientY - gesture.startY;

    if (!gesture.horizontal) {
      if (Math.abs(dx) < START_THRESHOLD && Math.abs(dy) < START_THRESHOLD) return;

      // A vertical intent belongs to the task-list scroller. Abandon the row
      // gesture without changing its current snapped position.
      if (Math.abs(dy) >= Math.abs(dx) * 0.9) {
        gestureRef.current = null;
        return;
      }

      gesture.horizontal = true;
      suppressClickRef.current = true;
      setDragging(true);
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture is an enhancement; React listeners remain sufficient.
      }
    }

    event.preventDefault();
    const width = Math.max(1, event.currentTarget.getBoundingClientRect().width);
    const rawOffset = gesture.startOffset + dx;
    const next = Math.max(-width, Math.min(0, rawOffset));
    setSwipeOffset(next);
  };

  const finishGesture = (event: ReactPointerEvent<HTMLDivElement>, cancelled = false) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    gestureRef.current = null;

    if (gesture.horizontal) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // Browsers may release pointer capture automatically.
      }
    }

    setDragging(false);
    if (!gesture.horizontal) return;

    event.preventDefault();

    if (cancelled) {
      setSwipeOffset(gesture.startOffset <= -OPEN_THRESHOLD ? -REVEAL_WIDTH : 0);
      return;
    }

    const width = Math.max(1, event.currentTarget.getBoundingClientRect().width);
    const distance = -offsetRef.current;

    if (distance >= width * DELETE_RATIO) {
      // Full swipe: finish the destructive travel first, then remove the row.
      setSwipeOffset(-width);
      window.setTimeout(onDelete, 135);
      return;
    }

    if (distance >= OPEN_THRESHOLD) {
      window.dispatchEvent(new CustomEvent<number>(SWIPE_OPEN_EVENT, { detail: item.id }));
      setSwipeOffset(-REVEAL_WIDTH);
      return;
    }

    setSwipeOffset(0);
  };

  const onContentClickCapture = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    // A tap on the content while the action is open closes the row first,
    // matching the one-open-action behaviour of iOS lists.
    if (offsetRef.current !== 0) {
      event.preventDefault();
      event.stopPropagation();
      setSwipeOffset(0);
    }
  };

  const revealWidth = Math.max(0, -offset);
  const revealVisible = revealWidth > 1;
  const iconVisible = revealWidth >= 34;
  const commitReady = revealWidth >= REVEAL_WIDTH * 1.7;

  return (
    <div
      className={`task-row swipe-task-row ${item.done ? "done" : ""} ${dragging ? "is-swiping" : ""} ${revealVisible ? "has-swipe-reveal" : ""} ${iconVisible ? "has-delete-icon" : ""} ${commitReady ? "delete-commit-ready" : ""}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(event) => finishGesture(event)}
      onPointerCancel={(event) => finishGesture(event, true)}
    >
      <button
        type="button"
        className="swipe-delete-action"
        style={{ width: `${revealWidth}px` }}
        onClick={onDelete}
        aria-label={deleteLabel}
        title={deleteLabel}
        tabIndex={revealWidth >= REVEAL_WIDTH - 2 ? 0 : -1}
      >
        <TrashIcon />
      </button>

      <div
        className="task-row-content"
        style={{ transform: `translate3d(${offset}px,0,0)` }}
        onClickCapture={onContentClickCapture}
      >
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
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.1 8.25h7.8l-.55 9.1a1.9 1.9 0 0 1-1.9 1.78h-2.9a1.9 1.9 0 0 1-1.9-1.78l-.55-9.1Z" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"/><path d="M6.2 6.4h11.6M9.35 6.4V4.85h5.3V6.4M10.25 11v4.9M13.75 11v4.9" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/></svg>;
}

function CheckIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6.2 12.4 3.65 3.65L17.9 8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
