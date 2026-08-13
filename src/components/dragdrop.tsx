import { useAbortEffect } from "@/hooks/use-abort-effect";
import { useAnimationFrame } from "motion/react";
import {
  createContext,
  useContext,
  useDebugValue,
  useEffect,
  useRef,
  useState,
  type Context,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

interface DropZoneIntf<T> {
  rect: DOMRect;
  handleDragEnter(data: T): void;
  handleDragLeave(data: T): void;
  handleDrop(data: T): void;
  handlePickup(data: T): void;
}

export type DragContext<T> = Context<
  RefObject<Set<DropZoneIntf<T>>> | undefined
>;

export function createDragContext<T>(): DragContext<T> {
  return createContext<RefObject<Set<DropZoneIntf<T>>> | undefined>(undefined);
}

export function DragProvider<T>({
  context: Context,
  children,
}: {
  context: DragContext<T>;
  children: ReactNode;
}) {
  const drops = useRef(new Set<DropZoneIntf<T>>());

  return <Context value={drops}>{children}</Context>;
}

function useRefFollow<T>(source: T) {
  const ref = useRef<T>(source);
  useDebugValue(source ?? String(source));
  ref.current = source;
  return ref;
}

export function Draggable<T>({
  children,
  context,
  value,
}: {
  children?: ReactNode;
  context: DragContext<T>;
  value: T;
}) {
  const elementRef = useRef<HTMLDivElement>(null);
  const pointerDownRef = useRef<React.PointerEvent<HTMLDivElement> | undefined>(
    undefined,
  );
  const pointerTimeoutRef = useRef<number | undefined>(undefined);
  const dragData = useContext(context);
  const [isDragging, setIsDragging] = useState(false);
  const [rect, setRect] = useState<DOMRect | undefined>(undefined);
  const [{ x: pointerX, y: pointerY }, setPointerPos] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });
  const draggingOverRef = useRef<DropZoneIntf<T> | undefined>(undefined);
  const valueRef = useRefFollow(value);

  useAbortEffect((signal) => {
    window.addEventListener(
      "pointermove",
      (event) => {
        if (event.pointerId !== pointerDownRef.current?.pointerId) return;
        event.preventDefault();

        setPointerPos({ x: event.clientX, y: event.clientY });
        if (dragData && dragData.current && elementRef.current) {
          const rect1 = elementRef.current.getBoundingClientRect();

          let best: DropZoneIntf<T> | undefined, bestDist2: number | undefined;
          for (const intf of dragData.current) {
            const rect2 = intf.rect;
            if (
              rect1.left + rect1.width >= rect2.left &&
              rect1.left <= rect2.left + rect2.width &&
              rect1.top + rect1.height >= rect2.top &&
              rect1.top <= rect2.top + rect2.height
            ) {
              const dx =
                rect1.left + rect1.width / 2 - (rect2.left + rect2.width / 2);
              const dy =
                rect1.top + rect1.height / 2 - (rect2.top + rect2.height / 2);
              const dist2 = dx * dx + dy * dy;

              if (typeof bestDist2 == "undefined" || dist2 < bestDist2) {
                bestDist2 = dist2;
                best = intf;
              }
            }
          }
          if (draggingOverRef.current !== best) {
            if (draggingOverRef.current)
              draggingOverRef.current.handleDragLeave(valueRef.current);
            draggingOverRef.current = best;
            if (draggingOverRef.current)
              draggingOverRef.current.handleDragEnter(valueRef.current);
          }
        }

        if (
          typeof pointerTimeoutRef.current == "number" &&
          (event.clientX - pointerDownRef.current.clientX) ** 2 +
            (event.clientY - pointerDownRef.current.clientY) ** 2 >
            5 ** 2
        ) {
          // we have moved
          clearTimeout(pointerTimeoutRef.current);
          pointerTimeoutRef.current = undefined;
          console.log("real start");
          setIsDragging(true);
          setRect(elementRef.current?.getBoundingClientRect());
        }
      },
      { signal, capture: true },
    );

    function handleUp(event: PointerEvent) {
      if (event.pointerId !== pointerDownRef.current?.pointerId) return;
      event.preventDefault();
      console.log("up", event.type);

      setIsDragging(false);
      pointerDownRef.current = undefined;

      if (draggingOverRef.current) {
        console.log("drop to", draggingOverRef.current);
        draggingOverRef.current.handleDragLeave(valueRef.current);
        draggingOverRef.current.handleDrop(valueRef.current);
        draggingOverRef.current = undefined;
      }

      if (typeof pointerTimeoutRef.current == "number") {
        clearTimeout(pointerTimeoutRef.current);
        pointerTimeoutRef.current = undefined;

        console.log("click instead");
        // they went down and up fast enough, so click
        event.target?.dispatchEvent(
          new MouseEvent("click", { ...event, view: window }),
        );
      }
    }

    window.addEventListener("pointerup", handleUp, { signal, capture: true });
    window.addEventListener("pointercancel", handleUp, {
      signal,
      capture: true,
    });
  }, []);

  return isDragging ? (
    <>
      <div
        className="drag-shell"
        style={{ width: rect?.width, height: rect?.height }}
      />
      {createPortal(
        <div
          ref={elementRef}
          className="drag-float"
          style={{
            position: "fixed",
            left:
              pointerX -
              ((pointerDownRef.current?.clientX ?? 0) - (rect?.left ?? 0)) +
              "px",
            top:
              pointerY -
              ((pointerDownRef.current?.clientY ?? 0) - (rect?.top ?? 0)) +
              "px",
          }}
        >
          {children}
        </div>,
        document.body,
      )}
    </>
  ) : (
    <div
      ref={elementRef}
      className="drag-item"
      onPointerDownCapture={(event) => {
        if (typeof pointerDownRef.current == "number") return; // already have a pointer to focus on
        console.log("start");
        pointerDownRef.current = event;
        setPointerPos({ x: event.clientX, y: event.clientY });
        pointerTimeoutRef.current = +setTimeout(() => {
          setIsDragging(true);
          console.log("setting rect", elementRef.current);
          setRect(elementRef.current?.getBoundingClientRect());
        }, 100);
        event.stopPropagation();
        event.preventDefault();
      }}
    >
      {children}
    </div>
  );
}

export function DropZone<T>({
  children,
  context,
  className,
  handleDragEnter,
  handleDragLeave,
  handleDrop,
  handlePickup,
}: {
  children?: ReactNode;
  context: DragContext<T>;
  className?: string;
} & Pick<
  DropZoneIntf<T>,
  "handleDragEnter" | "handleDragLeave" | "handleDrop" | "handlePickup"
>) {
  const dragData = useContext(context);
  const elementRef = useRef<HTMLDivElement>(null);
  const intfRef = useRef<DropZoneIntf<T> | undefined>(undefined);

  useEffect(() => {
    if (!elementRef.current || !dragData) return;
    const el = elementRef.current;
    const rect = el.getBoundingClientRect();
    const obj = (intfRef.current = {
      rect,
      handleDragEnter,
      handleDragLeave,
      handleDrop,
      handlePickup,
    });

    dragData.current.add(obj);

    return () => {
      dragData.current.delete(obj);
    };
  }, []);

  useAnimationFrame(() => {
    if (intfRef.current && elementRef.current) {
      intfRef.current.rect = elementRef.current.getBoundingClientRect();
    }
  });

  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  );
}
