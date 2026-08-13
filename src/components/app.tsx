import { InitForm, StoredConfig, type RunConfig } from "@/components/init-form";
import { Runner } from "@/components/runner";
import { Toggle } from "@/components/toggle";
import { Activity, useMemo, useState } from "react";
import z from "zod/mini";

function Info() {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="info">
      <h1>EMDR App</h1>
      <p>
        This is an app I (Ant_Throw_Pology) made in React and TypeScript for
        doing visual, haptic and audio EMDR easily and for free. My dad
        regularly does it with my other family members, and they say it works,
        so this exists now.
      </p>
      <button
        className="top-gap"
        onClick={() => {
          setMoreOpen((prev) => !prev);
        }}
      >
        {moreOpen ? "Show less" : "More info"}
      </button>
      <Toggle open={moreOpen}>
        <h2>What is EMDR?</h2>
        <p>
          EMDR (or Eye Movement Desensitization and Reprocessing) is a
          psychotherapy method that helps people heal from trauma and
          distressing life events by processing difficult memories through
          bilateral stimulation (like eye movements, taps, or tones) while
          recalling the memory, reducing its emotional impact and changing
          negative beliefs, making it effective for PTSD, anxiety, and other
          conditions.
        </p>
        <h2>Visual Mode</h2>
        <p>
          Visual mode makes a ball go back and forth across the screen in a sine
          wave pattern. Ideally, you'd connect your device to a TV and sit in
          front of the TV to maximize FOV coverage without having a screen eight
          inches from your face. Follow the ball with your eyes, keeping your
          head fixed in place.
        </p>
        <h2>Haptic Mode</h2>
        <p>
          Haptic mode activates alternating vibration motors. You'll need a
          controller or pair of controllers with haptic feedback available. Some
          controllers have rumble on both sides, while others will require two
          separate modules. I recommend Nintendo Switch Joy-Cons, if you use the
          button that connects them over WebHID. If any vibration actuators are
          available, they will show up as uniquely-colored buttons that you can
          click to test the vibration features. Next, drag the vibration buttons
          onto the areas below (marked "Left" and "Right") to select which
          actuators to use.
        </p>
        <h3>Limitations</h3>
        <p>
          You may see some gamepads that you know have multiple separate
          vibration actuators, but show up as one in the list. This is due to
          limitations in the Web Gamepad API, causing the actuators to show up
          as one <code>"dual-rumble"</code> (the name is misleading) actuator
          instead of something with two sides that can be rumbled individually (
          <code>"trigger-rumble"</code>). To get around this, buttons are
          provided to connect to certain devices over WebHID instead (if your
          browser supports it).
        </p>
        <h2>Audio Mode</h2>
        <p>
          Audio mode plays a sound in alternating ears. You'll want stereo
          headphones for this. The sound in question is the Xylophone Note Block
          sound effect from Minecraft, obtained through{" "}
          <a href="https://thirtydollar.website/">thirtydollar.website</a>.
        </p>
        <p>
          For both audio mode and haptic mode, you can specify an amount ahead
          of time that each event will trigger. If you are seeking a reference
          point, my Pixel Buds Pro need about 200-250 ms of lead time to sound
          accurate to the visuals.
        </p>
        <hr />
        <p className="disclaimer">
          These statements have not been evaluated by the Food and Drug
          Administration. This product is not intended to diagnose, treat, cure,
          or prevent any disease.
        </p>
      </Toggle>
    </div>
  );
}

export function App() {
  const [runningConfig, setRunningConfig] = useState<
    (RunConfig & { id: string }) | undefined
  >();
  const storedConfig = useMemo(() => {
    try {
      const json = localStorage.getItem("emdr_config");
      if (!json) return undefined;
      return StoredConfig.parse(JSON.parse(json));
    } catch (e) {
      return;
    }
  }, []);

  function handleStart(config: RunConfig) {
    setRunningConfig({ ...config, id: crypto.randomUUID() });
    try {
      localStorage.setItem(
        "emdr_config",
        JSON.stringify({
          ...config,
          haptic: config.haptic && {
            ...config.haptic,
            left: undefined,
            right: undefined,
          },
        }),
      );
    } catch (e) {}
  }

  function handleStop() {
    setRunningConfig(undefined);
  }

  return (
    <div className={runningConfig ? "app" : "app app-initial"}>
      <Activity mode={runningConfig ? "hidden" : "visible"}>
        <Info />
        <InitForm handleStart={handleStart} initialConfig={storedConfig} />
      </Activity>
      {runningConfig && (
        <Runner
          config={runningConfig}
          handleStop={handleStop}
          key={runningConfig.id}
        />
      )}
    </div>
  );
}
