import { useAbortEffect } from "@/hooks/use-abort-effect";
import { useSetChanges } from "@/hooks/use-changes";
import { useEffect, useState } from "react";

export function useGamepads() {
  const [rawGamepads, setRawGamepads] = useState<(Gamepad | null)[]>(() =>
    navigator.getGamepads()
  );

  useAbortEffect((signal) => {
    function handler() {
      setRawGamepads(navigator.getGamepads());
    }

    window.addEventListener("gamepadconnected", handler, { signal });
    window.addEventListener("gamepaddisconnected", handler, { signal });
  }, []);

  const [gamepadInfo, setGamepadInfo] = useState<
    { gamepad: Gamepad; real: boolean }[]
  >([]);

  useSetChanges(
    new Set(rawGamepads.filter((gamepad) => gamepad !== null)),
    (gamepad) => gamepad.index + gamepad.id,
    (gamepad) => {
      console.log("added", gamepad);
      setGamepadInfo((prev) => [...prev, { gamepad, real: true }]);
    },
    (gamepad) => {
      console.log("removed", gamepad);
      setGamepadInfo((prev) =>
        prev.filter(
          (item) =>
            item.gamepad.index !== gamepad.index &&
            item.gamepad.id !== gamepad.id
        )
      );
    }
  );

  useEffect(() => {
    const intv = setInterval(() => {
      const nextRawGamepads = navigator.getGamepads();
      setRawGamepads(nextRawGamepads);
      const gamepadMap = new Map(
        nextRawGamepads
          .filter((gamepad) => gamepad !== null)
          .map((gamepad) => [`${gamepad.index}-${gamepad.id}`, gamepad])
      );
      setGamepadInfo((prev) =>
        prev.map(({ gamepad, real }) => {
          const nextGamepad = gamepadMap.get(`${gamepad.index}-${gamepad.id}`);
          if (!nextGamepad) throw new Error("gamepad ceased to exist");

          if (real && nextGamepad.vibrationActuator) {
            (async () => {
              try {
                const actuator = nextGamepad.vibrationActuator;
                const type: GamepadHapticEffectType | "vibration" =
                  //@ts-expect-error
                  actuator.effects?.[0] ?? actuator.type ?? "dual-rumble";
                console.log(nextGamepad.id, type);
                //@ts-expect-error
                if (type == "vibration") await actuator.pulse(0, 0);
                else
                  console.log(
                    nextGamepad.id,
                    await actuator.playEffect(type, {
                      duration: 0,
                      startDelay: 0,
                      strongMagnitude: 0,
                      weakMagnitude: 0,
                      leftTrigger: 0,
                      rightTrigger: 0,
                    })
                  );
              } catch (e) {
                console.error(nextGamepad.id, e);
                setGamepadInfo((prev) => {
                  const i = prev.findIndex(
                    (item) =>
                      `${item.gamepad.index}-${item.gamepad.id}` ===
                      `${nextGamepad.index}-${nextGamepad.id}`
                  );
                  if (i == -1) return prev;
                  const item = prev[i]!;
                  console.log(i, item.gamepad.id);
                  return prev.splice(i, 1, {
                    gamepad: item.gamepad,
                    real: false,
                  });
                });
              }
            })();
          } else if (nextGamepad.timestamp > gamepad.timestamp) real = true;

          return {
            gamepad: nextGamepad,
            real,
          };
        })
      );
    }, 1000);

    return () => {
      clearInterval(intv);
    };
  }, []);

  return {
    gamepads: gamepadInfo
      .filter((item) => item.real)
      .map((item) => item.gamepad),
  };
}
