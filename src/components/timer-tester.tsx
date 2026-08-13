import {
  useElapsedTime,
  useTimer,
  useTimerEvent,
  useTimerState,
  type TimerControls,
} from "@/hooks/use-timer";
import { useEffect, useId, useState } from "react";

function TimerEvent({ timer }: { timer: TimerControls }) {
  const id = useId();
  const options = ["single", "infinite", "finite"] as const;
  const [mode, setMode] = useState<(typeof options)[number]>("single");

  const [first, setFirst] = useState(1000);
  const [period, setPeriod] = useState(500);
  const [repeatCount, setRepeatCount] = useState(5);

  const [fires, setFires] = useState<number[]>([]);

  function handleFire(count: number) {
    console.log("fire", id, count, Date.now());
    setFires((prev) => [...prev.slice(-10), count]);
  }

  switch (mode) {
    case "single":
      useTimerEvent(timer, { time: first }, handleFire);
      break;
    case "infinite":
      useTimerEvent(timer, { time: first, period }, handleFire);
      break;
    case "finite":
      useTimerEvent(timer, { time: first, period, repeatCount }, handleFire);
      break;
  }

  return (
    <div style={{ border: "1px solid", padding: "4px" }}>
      <label htmlFor={`${id}-mode`}>
        <select
          name={`${id}-mode`}
          id={`${id}-mode`}
          value={mode}
          onChange={(event) => {
            setMode(event.target.value as (typeof options)[number]);
          }}
        >
          {options.map((o) => (
            <option value={o} key={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
      <label htmlFor={`${id}-first`}>
        <input
          type="number"
          name={`${id}-first`}
          id={`${id}-first`}
          min={0}
          value={first}
          onChange={(event) => {
            setFirst(Number(event.target.value));
          }}
        />
      </label>
      {(mode == "infinite" || mode == "finite") && (
        <label htmlFor={`${id}-period`}>
          <input
            type="number"
            name={`${id}-period`}
            id={`${id}-period`}
            min={0}
            value={period}
            onChange={(event) => {
              setPeriod(Number(event.target.value));
            }}
          />
        </label>
      )}
      {mode == "finite" && (
        <label htmlFor={`${id}-repeatCount`}>
          <input
            type="number"
            name={`${id}-repeatCount`}
            id={`${id}-repeatCount`}
            min={0}
            value={repeatCount}
            onChange={(event) => {
              setRepeatCount(Number(event.target.value));
            }}
          />
        </label>
      )}
      <p
        onClick={() => {
          setFires([]);
        }}
      >
        {fires.join(", ")}
      </p>
    </div>
  );
}

export function TimerTester() {
  const timer = useTimer();
  const timerState = useTimerState(timer);

  const [timerEvents, setTimerEvents] = useState<string[]>([]);

  return (
    <div>
      <p>Time elapsed: {useElapsedTime(timer)}</p>
      <p>Timer state: {timerState}</p>
      <button
        onClick={() => {
          timer.reset();
        }}
      >
        Reset
      </button>
      <button
        onClick={() => {
          timer.stop();
        }}
      >
        Stop
      </button>
      <button
        onClick={() => {
          timer.pause();
        }}
      >
        Pause
      </button>
      <button
        onClick={() => {
          timer.resume();
        }}
      >
        Resume
      </button>
      <div style={{ border: "1px solid", padding: "4px" }}>
        {timerEvents.map((item) => (
          <TimerEvent timer={timer} key={item} />
        ))}
        <button
          onClick={() => {
            setTimerEvents(() => [...timerEvents, crypto.randomUUID()]);
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}
