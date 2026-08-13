import { useGamepads } from "@/hooks/use-gamepads";
import {
  useEffect,
  useState,
  type CSSProperties,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  connectJoyCon,
  useJoycons,
  type DeviceInfo,
  type Haptic,
} from "@/hooks/use-joycons";
import randomColor from "randomcolor";
import { useMemoArray } from "@/hooks/use-memo-array";
import {
  createDragContext,
  Draggable,
  DragProvider,
  DropZone,
} from "@/components/dragdrop";

export type { Haptic } from "@/hooks/use-joycons";

interface CSSActuatorProperties extends CSSProperties {
  "--actuator-color"?: string;
}

const actuatorDragContext = createDragContext<Haptic>();

function Actuator({ actuator }: { actuator: Haptic }) {
  return (
    <button
      className={`actuator actuator-${actuator.type}`}
      style={
        {
          "--actuator-color": actuator.color,
        } as CSSActuatorProperties
      }
      onClick={() => {
        actuator.run(1, 500);
      }}
    />
  );
}

function ActuatorDrop({
  title,
  actuator,
  handleActuatorChange,
}: {
  title?: ReactNode;
  actuator: Haptic | undefined;
  handleActuatorChange: Dispatch<SetStateAction<Haptic | undefined>>;
}) {
  const [over, setOver] = useState(new Set<Haptic>());

  return (
    <DropZone
      context={actuatorDragContext}
      className="actuator-select"
      handleDragEnter={(data) => {
        console.log("drag enter", data);
        setOver((prev) => prev.union(new Set([data])));
      }}
      handleDragLeave={(data) => {
        console.log("drag leave", data);
        setOver((prev) => prev.difference(new Set([data])));
      }}
      handleDrop={(data) => {
        console.log("drop", data);
        handleActuatorChange(data);
      }}
      handlePickup={(data) => {
        console.log("pickup", data);
        handleActuatorChange(undefined);
      }}
    >
      {title && <h3 className="actuator-select-title">{title}</h3>}
      {[...over].map((actuator) => (
        <Actuator actuator={actuator} key={actuator.color} />
      ))}
      {actuator && <Actuator actuator={actuator} />}
    </DropZone>
  );
}

function GamepadDisplay({
  gamepad,
  actuators,
}: {
  gamepad: Gamepad;
  actuators: Haptic[];
}) {
  return (
    <div className="gamepad">
      <p className="gamepad-name">{gamepad.id.replace(/\s*\([^(]*\)$/, "")}</p>
      {actuators.length > 0
        ? actuators.map((actuator, index) => (
            <Draggable
              context={actuatorDragContext}
              key={index}
              value={actuator}
            >
              <Actuator actuator={actuator} />
            </Draggable>
          ))
        : "(No haptics)"}
    </div>
  );
}

function JoyConDisplay({
  actuators,
  deviceInfo,
}: {
  actuators: Haptic[];
  deviceInfo?: DeviceInfo;
}) {
  return (
    <div className="gamepad">
      <p className="gamepad-name">{deviceInfo?.type ?? "..."}</p>
      {actuators.length > 0
        ? actuators.map((actuator, index) => (
            <Draggable
              context={actuatorDragContext}
              key={index}
              value={actuator}
            >
              <Actuator actuator={actuator} />
            </Draggable>
          ))
        : "(No haptics)"}
    </div>
  );
}

export function HapticsSelector({
  left,
  right,
  handleLeftChange,
  handleRightChange,
}: {
  left: Haptic | undefined;
  right: Haptic | undefined;
  handleLeftChange: Dispatch<SetStateAction<Haptic | undefined>>;
  handleRightChange: Dispatch<SetStateAction<Haptic | undefined>>;
}) {
  const { gamepads } = useGamepads();

  const gamepadsPlusActuators = useMemoArray(
    gamepads,
    (gamepad) => (gamepad?.index ?? -1) + (gamepad?.id ?? ""),
    (gamepad) => {
      if (!gamepad) return {};

      const hapticActuators =
        "hapticActuators" in gamepad
          ? (gamepad.hapticActuators as GamepadHapticActuator[])
          : gamepad.vibrationActuator
            ? [gamepad.vibrationActuator]
            : [];

      const actuators = hapticActuators.flatMap((actuator) => {
        const effects =
          "effects" in actuator && Array.isArray(actuator.effects)
            ? (actuator.effects as GamepadHapticEffectType[])
            : ["dual-rumble" as const];

        const out: Haptic[] = [];

        if (effects.includes("trigger-rumble")) {
          out.push(
            {
              run(amplitude, duration) {
                actuator.playEffect("trigger-rumble", {
                  duration,
                  leftTrigger: amplitude,
                });
              },
              type: "left",
              color: randomColor(),
            },
            {
              run(amplitude, duration) {
                actuator.playEffect("trigger-rumble", {
                  duration,
                  rightTrigger: amplitude,
                });
              },
              type: "right",
              color: randomColor(),
            }
          );
        }
        if (effects.includes("dual-rumble")) {
          out.push({
            run(amplitude, duration) {
              actuator.playEffect("dual-rumble", {
                duration,
                strongMagnitude: amplitude,
                weakMagnitude: amplitude,
              });
            },
            type: "unknown",
            color: randomColor(),
          });
        }

        return out;
      });
      return { gamepad, actuators };
    },
    []
  );
  const realGamepadsPlusActuators = gamepadsPlusActuators.filter(
    ({ gamepad, actuators }) => gamepad && actuators
  ) as { gamepad: Gamepad; actuators: Haptic[] }[];

  const { joycons } = useJoycons();

  useEffect(() => {
    if (left || right) {
      const allActuators = new Set(
        gamepadsPlusActuators
          .flatMap(({ actuators }) => actuators)
          .filter((actuator) => actuator !== undefined)
          .concat(joycons.flatMap(({ actuators }) => actuators))
      );
      if (left && !allActuators.has(left)) handleLeftChange(undefined);
      if (right && !allActuators.has(right)) handleRightChange(undefined);
    }
  }, [left, right, gamepadsPlusActuators, joycons]);

  const haveControllers =
    realGamepadsPlusActuators.length > 0 || joycons.length > 0;

  return (
    <div className="haptics-selector">
      <DragProvider context={actuatorDragContext}>
        {typeof navigator.hid == "object" && (
          <div className="webhid-buttons">
            <button
              onClick={async () => {
                await connectJoyCon?.();
              }}
            >
              Connect Joy-con
            </button>
          </div>
        ) || "No WebHID available"}
        <div className="gamepads top-gap">
          {haveControllers ? (
            <>
              {realGamepadsPlusActuators.length > 0 && <h3>Normal Gamepads</h3>}
              {realGamepadsPlusActuators.map(({ gamepad, actuators }) => (
                <GamepadDisplay
                  gamepad={gamepad}
                  actuators={actuators}
                  key={gamepad.index}
                />
              ))}
              {joycons.length > 0 && <h3>Joy-Cons</h3>}
              {joycons.map(({ id, actuators, deviceInfo }) => (
                <JoyConDisplay
                  actuators={actuators}
                  deviceInfo={deviceInfo}
                  key={id}
                />
              ))}
            </>
          ) : (
            "Connect a controller to access its haptic actuators"
          )}
        </div>
        <div className="actuator-selects top-gap">
          <ActuatorDrop
            title="Left"
            actuator={left}
            handleActuatorChange={handleLeftChange}
          />
          <ActuatorDrop
            title="Right"
            actuator={right}
            handleActuatorChange={handleRightChange}
          />
        </div>
      </DragProvider>
    </div>
  );
}
