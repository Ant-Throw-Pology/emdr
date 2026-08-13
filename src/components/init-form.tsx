import { HapticsSelector, type Haptic } from "@/components/haptics-selector";
import { Toggle } from "@/components/toggle";
import { motion } from "motion/react";
import { useState, useId } from "react";
import { z } from "zod/mini";

export interface RunConfig {
  visual: boolean;
  audio: { lead: number } | false;
  haptic:
    | {
        left: Haptic;
        right: Haptic;
        leadLeft: number;
        leadRight: number;
      }
    | false;
  period: number;
}

export const StoredConfig = z.object({
  visual: z.boolean(),
  haptic: z.union([
    z.literal(false),
    z.object({ leadLeft: z.number(), leadRight: z.number() }),
  ]),
  audio: z.union([
    z.literal(false),
    z.object({
      lead: z.number(),
    }),
  ]),
  period: z.number(),
});
export type StoredConfig = z.infer<typeof StoredConfig>;

export function InitForm({
  handleStart,
  initialConfig,
}: {
  handleStart: (config: RunConfig) => void;
  initialConfig?: StoredConfig;
}) {
  const [visual, setVisual] = useState(initialConfig?.visual ?? true);
  const [haptic, setHaptic] = useState(
    (initialConfig?.haptic ?? false) !== false,
  );
  const [audio, setAudio] = useState((initialConfig?.audio ?? false) !== false);

  const [leftActuator, setLeftActuator] = useState<Haptic | undefined>(
    undefined,
  );
  const [rightActuator, setRightActuator] = useState<Haptic | undefined>(
    undefined,
  );
  const [hapticLeadLeft, setHapticLeadLeft] = useState(
    (initialConfig?.haptic && initialConfig.haptic.leadLeft) || 0,
  );
  const [hapticLeadRight, setHapticLeadRight] = useState(
    (initialConfig?.haptic && initialConfig.haptic.leadRight) || 0,
  );

  const [audioLead, setAudioLead] = useState(
    (initialConfig?.audio && initialConfig.audio.lead) || 0,
  );

  const [period, setPeriod] = useState(initialConfig?.period ?? 2500);
  const id = useId();

  return (
    <div className="controls">
      <div>
        <small>Select Modes</small>
        <div className="modes">
          <label htmlFor={`${id}-visual`}>
            <input
              type="checkbox"
              name={`${id}-visual`}
              id={`${id}-visual`}
              checked={visual}
              onChange={(event) => {
                setVisual(event.target.checked);
              }}
            />{" "}
            Visual
          </label>
          <label htmlFor={`${id}-haptic`}>
            <input
              type="checkbox"
              name={`${id}-haptic`}
              id={`${id}-haptic`}
              checked={haptic}
              onChange={(event) => {
                setHaptic(event.target.checked);
              }}
            />{" "}
            Haptic
          </label>
          <label htmlFor={`${id}-audio`}>
            <input
              type="checkbox"
              name={`${id}-audio`}
              id={`${id}-audio`}
              checked={audio}
              onChange={(event) => {
                setAudio(event.target.checked);
              }}
            />{" "}
            Audio
          </label>
        </div>
      </div>
      <div className="top-gap">
        <label htmlFor="period">
          Period:{" "}
          <input
            type="number"
            name="period"
            id="period"
            value={period}
            onChange={(event) => {
              setPeriod(Number(event.target.value));
            }}
          />{" "}
          ms
        </label>
      </div>
      <Toggle open={haptic} topGap={true}>
        <h2>Haptic options</h2>
        <HapticsSelector
          left={leftActuator}
          right={rightActuator}
          handleLeftChange={setLeftActuator}
          handleRightChange={setRightActuator}
        />
        <Toggle
          open={
            typeof leftActuator != "undefined" &&
            typeof rightActuator != "undefined" &&
            leftActuator === rightActuator
          }
          topGap={true}
        >
          <p className="warning">
            <strong>Warning:</strong> The left and right haptic actuators are
            the same.
          </p>
        </Toggle>
        <div className="top-gap">
          <label htmlFor="haptic-lead-left">
            Haptic lead time (left):{" "}
            <input
              type="number"
              name="haptic-lead-left"
              id="haptic-lead-left"
              value={hapticLeadLeft}
              onChange={(event) => {
                setHapticLeadLeft(+event.target.value);
              }}
            />{" "}
            ms
          </label>
        </div>
        <div>
          <label htmlFor="haptic-lead-right">
            Haptic lead time (right):{" "}
            <input
              type="number"
              name="haptic-lead-right"
              id="haptic-lead-right"
              value={hapticLeadRight}
              onChange={(event) => {
                setHapticLeadRight(+event.target.value);
              }}
            />{" "}
            ms
          </label>
        </div>
        <p>(for Bluetooth and other HID delay issues)</p>
      </Toggle>
      <Toggle open={audio} topGap={true}>
        <h2>Audio options</h2>
        <label htmlFor="audio-lead">
          Audio lead time:{" "}
          <input
            type="number"
            name="audio-lead"
            id="audio-lead"
            value={audioLead}
            onChange={(event) => {
              setAudioLead(+event.target.value);
            }}
          />{" "}
          ms
        </label>
        <p>(for Bluetooth and other audio delay issues)</p>
      </Toggle>
      <Toggle
        open={
          haptic &&
          (typeof leftActuator == "undefined" ||
            typeof rightActuator == "undefined")
        }
        topGap={true}
      >
        <p className="error">
          <strong>Error:</strong> Haptic mode requires two actuators to be
          selected.
        </p>
      </Toggle>
      <div className="start top-gap">
        <button
          onClick={() => {
            const conf: RunConfig = {
              visual,
              audio: false,
              haptic: false,
              period,
            };
            if (haptic) {
              if (!leftActuator || !rightActuator) return;

              conf.haptic = {
                left: leftActuator,
                right: rightActuator,
                leadLeft: hapticLeadLeft,
                leadRight: hapticLeadRight,
              };
            }
            if (audio) conf.audio = { lead: audioLead };
            handleStart(conf);
          }}
        >
          Start
        </button>
      </div>
    </div>
  );
}
