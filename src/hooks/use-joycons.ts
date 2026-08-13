import { useEffect, useState } from "react";
import { TypedEventTarget } from "@/utils";
import randomColor from "randomcolor";
import type { DeviceInfo } from "joy-con-webhid";
export type * from "joy-con-webhid";

let jcwModule = undefined;

if (typeof navigator.hid == "object") {
  jcwModule = await import("joy-con-webhid");
}

export const { GeneralController, JoyConLeft, JoyConRight, connectJoyCon } =
  jcwModule ?? {};

export type JoyConLeft = InstanceType<
  Exclude<typeof jcwModule, undefined>["JoyConLeft"]
>;
export type JoyConRight = InstanceType<
  Exclude<typeof jcwModule, undefined>["JoyConRight"]
>;
export type GeneralController = InstanceType<
  Exclude<typeof jcwModule, undefined>["GeneralController"]
>;

const connectedJoyCons: Map<
  number,
  JoyConLeft | JoyConRight | GeneralController
> = jcwModule?.connectedJoyCons ?? new Map();

export class JoyConEvent extends Event {
  constructor(
    type: keyof JoyConEvents,
    public deviceId: number,
    public joycon: JoyConLeft | JoyConRight | GeneralController,
    eventInitDict?: EventInit
  ) {
    super(type, eventInitDict);
  }
}

type JoyConEvents = {
  joyconconnected: JoyConEvent;
  joycondisconnected: JoyConEvent;
};

export const joyConEvents = new TypedEventTarget<JoyConEvents>();

const oldSet = connectedJoyCons.set;
connectedJoyCons.set = function (key, value) {
  const prev = connectedJoyCons.get(key);
  oldSet.call(this, key, value);
  if (!prev)
    joyConEvents.dispatchEvent(new JoyConEvent("joyconconnected", key, value));
  return this;
};

const oldDelete = connectedJoyCons.delete;
connectedJoyCons.delete = function (key) {
  const prev = connectedJoyCons.get(key);
  const result = oldDelete.call(this, key);
  if (prev)
    joyConEvents.dispatchEvent(
      new JoyConEvent("joycondisconnected", key, prev)
    );
  return result;
};

export interface Haptic {
  run(amplitude: number, duration: number): void;
  type: "unknown" | "left" | "right";
  color: string;
}

export interface JoyConTracked {
  id: number;
  controller: JoyConLeft | JoyConRight | GeneralController;
  actuators: Haptic[];
  deviceInfo?: DeviceInfo;
}

const trackedJoyCons = new Map<number, JoyConTracked>();
const subscribers = new Set<() => void>();

function notify() {
  for (const subscriber of subscribers) subscriber();
}

joyConEvents.addEventListener("joyconconnected", async (event) => {
  const id = event.deviceId;
  const controller = event.joycon;
  console.log("initializing", id, controller);
  await controller.enableVibration();
  const deviceInfo = await new Promise<DeviceInfo>((resolve, reject) => {
    const i = setInterval(() => {
      controller.getRequestDeviceInfo();
    }, 2000);

    controller.getRequestDeviceInfo().then((value) => {
      resolve(value as DeviceInfo);
      clearInterval(i);
    }, reject);
  });
  console.log(deviceInfo);

  let intervalId = -1,
    timeoutId = -1;
  const actuators: Haptic[] = [
    {
      run(amplitude, duration) {
        clearInterval(intervalId);
        clearTimeout(timeoutId);
        controller.rumble(600, 600, amplitude);
        let hasFinished = false;
        const intv = (intervalId = +setInterval(() => {
          if (!hasFinished) {
            controller.rumble(600, 600, amplitude);
          } else clearInterval(intv);
        }, 500));
        timeoutId = +setTimeout(() => {
          hasFinished = true;
          controller.rumble(600, 600, 0);
        }, duration);
      },
      type:
        JoyConLeft === undefined || JoyConRight === undefined
          ? "unknown"
          : controller instanceof JoyConLeft
            ? "left"
            : controller instanceof JoyConRight
              ? "right"
              : "unknown",
      color: randomColor(),
    },
  ];

  if (!connectedJoyCons.has(id)) return;

  trackedJoyCons.set(id, { id, controller, actuators, deviceInfo });
  notify();

  await controller.rumble(600, 600, 0.5);

  console.log("done initializing", id, controller);
});

joyConEvents.addEventListener("joycondisconnected", (event) => {
  console.log("disconnected", event.deviceId, event.joycon);
  if (trackedJoyCons.delete(event.deviceId)) notify();
});

export function useJoycons() {
  const [joycons, setJoycons] = useState<JoyConTracked[]>(() => [
    ...trackedJoyCons.values(),
  ]);

  useEffect(() => {
    const handler = () => setJoycons([...trackedJoyCons.values()]);
    setJoycons([...trackedJoyCons.values()]);
    subscribers.add(handler);
    return () => {
      subscribers.delete(handler);
    };
  }, []);

  return { joycons };
}
