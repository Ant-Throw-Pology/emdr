import { useTimerEvent, type TimerControls } from "@/hooks/use-timer";
import soundFile from "../noteblock_xylophone.wav";
import { Howl } from "howler";

const soundLeft = new Howl({ src: [soundFile] });
soundLeft.stereo(-1);
const soundRight = new Howl({ src: [soundFile] });
soundRight.stereo(1);

export function AudioEmdr({
  period,
  timer,
  lead,
}: {
  period: number;
  timer: TimerControls;
  lead?: number;
}) {
  useTimerEvent(
    timer,
    { time: period / 4 - (lead ?? 0), period: period / 2 },
    (count) => {
      // const play =
      (count % 2 === 1 ? soundLeft : soundRight).play();
      // soundLeft.stereo((count % 2) * -2 + 1, play);
    },
  );

  return <></>;
}
