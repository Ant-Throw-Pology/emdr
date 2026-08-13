import { useEffect, useRef, type RefObject } from "react";

export function useCanvas(
  ref: RefObject<HTMLCanvasElement | null>,
  frame: (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    dt: number
  ) => void
) {
  const frameIdRef = useRef(-1);

  useEffect(() => {
    if (ref.current !== null) {
      const canvas = ref.current;
      const ctx = ref.current.getContext("2d");
      if (!ctx) return;

      let then = Date.now();

      function cycle() {
        if (!ctx) return;
        frameIdRef.current = requestAnimationFrame(cycle);

        const now = Date.now();
        const dt = now - then;
        then = now;

        ctx.save();
        try {
          frame(ctx, canvas, dt);
        } finally {
          ctx.restore();
        }
      }

      frameIdRef.current = requestAnimationFrame(cycle);

      return () => {
        cancelAnimationFrame(frameIdRef.current);
      };
    }
  });
}
