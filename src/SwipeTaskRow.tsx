import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

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

const REVEAL_WIDTH = 66;
const START_THRESHOLD = 5;
const DELETE_RATIO = 0.46;

export default function SwipeTaskRow({ item, deleteLabel, onToggle, onDelete }: SwipeTaskRowProps) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const gestureRef = useRef<Gesture | null>(null);
  const offsetRef = useRef(0);

  const setSwipeOffset = (value: number) => {
    offsetRef.current = value;
    setOffset(value);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
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
      if (Math.abs(dy) >= Math.abs(dx)) {
        gestureRef.current = null;
        return;
      }

      gesture.horizontal = true;
      setDragging(true);
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture is optional; React still receives the active gesture.
      }
    }

    event.preventDefault();
    const width = Math.max(1, event.currentTarget.getBoundingClientRect().width);
    const next = Math.max(-width, Math.min(0, gesture.startOffset + dx));
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
    if (cancelled || !gesture.horizontal) return;

    const width = Math.max(1, event.currentTarget.getBoundingClientRect().width);
    const distance = -offsetRef.current;

    if (distance >= width * DELETE_RATIO) {
      setSwipeOffset(-width);
      window.setTimeout(onDelete, 150);
      return;
    }

    setSwipeOffset(distance >= REVEAL_WIDTH * 0.5 ? -REVEAL_WIDTH : 0);
  };

  const closeBeforeContentAction = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (offsetRef.current === 0 || dragging) return;
    event.preventDefault();
    event.stopPropagation();
    setSwipeOffset(0);
  };

  const revealWidth = Math.max(REVEAL_WIDTH, -offset);
  const commitReady = -offset >= REVEAL_WIDTH * 1.65;

  return (
    <div
      className={`task-row swipe-task-row ${item.done ? "done" : ""} ${dragging ? "is-swiping" : ""} ${commitReady ? "delete-commit-ready" : ""}`}
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
      >
        <TrashIcon />
      </button>

      <div
        className="task-row-content"
        style={{ transform: `translate3d(${offset}px,0,0)` }}
        onPointerDownCapture={closeBeforeContentAction}
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
