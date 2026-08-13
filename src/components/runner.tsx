import { AudioEmdr } from "@/components/audio-emdr";
import { HapticEmdr } from "@/components/haptic-emdr";
import type { RunConfig } from "@/components/init-form";
import { VisualEmdr } from "@/components/visual-emdr";
import { useAbortEffect } from "@/hooks/use-abort-effect";
import { useTimer, useTimerEvent } from "@/hooks/use-timer";
import { motion, useSpring } from "motion/react";
import { useEffect } from "react";

export function Runner({
  config,
  handleStop,
}: {
  config: RunConfig;
  handleStop: () => void;
}) {
  const interfaceOpacity = useSpring(1, {
    damping: 60,
    stiffness: 280,
  });
  const interfaceOpacityTimer = useTimer();
  useTimerEvent(interfaceOpacityTimer, 5000, () => {
    interfaceOpacity.set(0.1);
  });

  const runTimer = useTimer();

  useAbortEffect((signal) => {
    function handler() {
      interfaceOpacity.jump(1);
      interfaceOpacityTimer.reset();
    }

    window.addEventListener("pointermove", handler, { signal });
    window.addEventListener("pointerdown", handler, { signal });
    window.addEventListener("focus", handler, { signal });

    window.addEventListener(
      "focus",
      () => {
        runTimer.resume();
      },
      { signal },
    );
    window.addEventListener(
      "blur",
      () => {
        runTimer.pause();
      },
      { signal },
    );
  }, []);

  useEffect(() => () => {
    if (document.fullscreenElement) document.exitFullscreen();
  });

  return (
    <div className="runner">
      <div className="runner-before">
        <motion.p style={{ opacity: interfaceOpacity }}>
          Focus on and recall memories of the thing that is bothering you
        </motion.p>
      </div>
      {config.visual && <VisualEmdr period={config.period} timer={runTimer} />}
      {config.haptic && (
        <HapticEmdr
          period={config.period}
          timer={runTimer}
          left={config.haptic.left}
          right={config.haptic.right}
          leadLeft={config.haptic.leadLeft}
          leadRight={config.haptic.leadRight}
        />
      )}
      {config.audio && (
        <AudioEmdr
          period={config.period}
          timer={runTimer}
          lead={config.audio.lead}
        />
      )}
      <div className="runner-after">
        <motion.button
          className="fullscreen"
          style={{ opacity: interfaceOpacity }}
          onClick={() => {
            if (document.fullscreenElement) document.exitFullscreen();
            else document.body.requestFullscreen();
          }}
        >
          Toggle fullscreen
        </motion.button>
        <motion.button
          className="stop"
          style={{ opacity: interfaceOpacity }}
          onClick={() => {
            handleStop();
          }}
        >
          Stop
        </motion.button>
      </div>
    </div>
  );
}
