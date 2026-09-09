import { useEffect, useRef, useState, type ReactNode } from "react";

type ScrollRegionProps = {
  className: string;
  shellClassName: string;
  buttonLabel: string;
  resetKey?: string | number;
  children: ReactNode;
};

export default function ScrollRegion({ className, shellClassName, buttonLabel, resetKey, children }: ScrollRegionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    element.scrollTop = 0;

    const update = () => {
      const remaining = element.scrollHeight - element.clientHeight - element.scrollTop;
      setCanScrollDown(element.scrollHeight > element.clientHeight + 2 && remaining > 3);
    };

    update();
    element.addEventListener("scroll", update, { passive: true });

    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(element);

    const mutationObserver = new MutationObserver(() => requestAnimationFrame(update));
    mutationObserver.observe(element, { childList: true, subtree: true, characterData: true });

    window.addEventListener("resize", update, { passive: true });

    return () => {
      element.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [resetKey]);

  const scrollToBottom = () => {
    const element = scrollRef.current;
    if (!element) return;
    element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
  };

  return (
    <div className={shellClassName}>
      <div ref={scrollRef} className={className}>
        {children}
      </div>
      {canScrollDown && (
        <button
          type="button"
          className="scroll-bottom-button"
          onClick={scrollToBottom}
          aria-label={buttonLabel}
          title={buttonLabel}
        >
          <ChevronDownIcon />
        </button>
      )}
    </div>
  );
}

function ChevronDownIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
