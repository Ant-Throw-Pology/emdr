import { useCanvas } from "@/hooks/use-canvas";
import { useTimerEvent, type TimerControls } from "@/hooks/use-timer";
import { useViewport } from "@/hooks/use-viewport";
import { useWakeLock } from "@/hooks/use-wake-lock";
import { range } from "@/utils";
import { useEffect, useRef } from "react";

function expSmooth(
  x: number,
  base: number,
  duration: number,
  movement: number,
) {
  return (
    (movement * base - movement * Math.pow(base, 1 - x / duration)) / (base - 1)
  );
}

export function VisualEmdr({
  period,
  timer,
}: {
  period: number;
  timer: TimerControls;
}) {
  const { width: viewWidth, devicePixelRatio } = useViewport();
  const canvasWidth = viewWidth * devicePixelRatio;
  const canvasHeight = 200 * devicePixelRatio;

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const particles = useRef<
    {
      x: number;
      y: number;
      start: number;
    }[]
  >([]);
  useEffect(() => {
    particles.current = [];
  }, [canvasWidth]);

  const ballShockwaves = useRef<
    {
      x: number;
      start: number;
    }[]
  >([]);
  useEffect(() => {
    ballShockwaves.current = [];
  }, [canvasWidth]);

  const lastPosRef = useRef(0);
  useCanvas(canvasRef, (ctx, canvas, dt) => {
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    const lastPos = lastPosRef.current;
    const pos =
      Math.sin((timer.getElapsed() / period) * 2 * Math.PI) *
      (canvasWidth * 0.5 - 0.66 * canvasHeight);
    lastPosRef.current = pos;

    for (const _ of range(dt * 2)) {
      const back = Math.random() ** 2;
      const angle = Math.random() * 360;
      const radius = (Math.random() * canvasHeight) / 10;

      particles.current.push({
        x:
          pos +
          back * (lastPos - pos) +
          canvasWidth / 2 +
          Math.cos(angle) * radius,
        y: canvasHeight / 2 + Math.sin(angle) * radius,
        start: Date.now(),
      });
    }

    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    for (const item of (particles.current = particles.current.filter(
      (p) => p.start >= Date.now() - 100,
    ))) {
      ctx.beginPath();
      ctx.arc(item.x, item.y, canvasHeight / 80, 0, 2 * Math.PI);
      ctx.fill();
    }

    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
    ctx.lineWidth = 1;
    for (const item of (ballShockwaves.current = ballShockwaves.current.filter(
      (p) => p.start >= Date.now() - 1000,
    ))) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, (1000 - (Date.now() - item.start)) / 700);
      ctx.beginPath();
      ctx.arc(
        item.x,
        canvasHeight / 2,
        expSmooth(Date.now() - item.start, 200, 700, canvasHeight * 0.45),
        0,
        2 * Math.PI,
      );
      ctx.stroke();
      ctx.restore();
    }

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(
      pos + canvasWidth / 2,
      canvasHeight / 2,
      canvasHeight / 8,
      0,
      2 * Math.PI,
    );
    ctx.fill();
  });

  useTimerEvent(
    timer,
    { time: period / 4 - 100, period: period / 2 },
    (count) => {
      const evPhase = (count % 2) * -2 + 1;
      ballShockwaves.current.push({
        x:
          evPhase * (canvasWidth * 0.5 - canvasHeight * 0.66) + canvasWidth / 2,
        start: Date.now(),
      });
    },
  );

  useWakeLock();

  return <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight} />;
}
