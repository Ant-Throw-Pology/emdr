import type { Haptic } from "@/components/haptics-selector";
import { useTimerEvent, type TimerControls } from "@/hooks/use-timer";

export function HapticEmdr({
  period,
  timer,
  left,
  right,
  leadLeft,
  leadRight,
}: {
  period: number;
  timer: TimerControls;
  left: Haptic;
  right: Haptic;
  leadLeft?: number;
  leadRight?: number;
}) {
  useTimerEvent(
    timer,
    { time: period / 4 - (leadRight ?? 0), period: period },
    (count) => {
      right.run(1, 250);
    }
  );
  useTimerEvent(
    timer,
    { time: (period * 3) / 4 - (leadLeft ?? 0), period: period },
    (count) => {
      left.run(1, 250);
    }
  );

  return <></>;
}
