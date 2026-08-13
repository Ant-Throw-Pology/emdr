import { useAnimationFrame, useMotionValue } from "motion/react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";

export type TimerState = "running" | "paused" | "stopped";

export interface TimerControls {
  reset(): void;
  stop(): void;
  pause(): void;
  resume(): void;
  getElapsed(): number;
  getState(): TimerState;
  addEvent(ev: TimerEventInfo): void;
  removeEvent(ev: TimerEventInfo): void;
  watchState(callback: (newState: TimerState) => void): void;
  unwatchState(callback: (newState: TimerState) => void): void;
  _: {
    timerStartRef: RefObject<number | undefined>;
    timeElapsedRef: RefObject<number | undefined>;
  };
}

interface TimerEventInfo {
  firstTime: number;
  morePeriod?: number;
  moreCount?: number;
  _lastTrigger?: number;
  _timeoutId?: number;
  callback: (count: number) => void;
}

export function useTimer(isRunning?: boolean): TimerControls {
  const timerStartRef = useRef<number | undefined>(undefined);
  const timeElapsedRef = useRef<number | undefined>(undefined);
  const eventsRef = useRef(new Set<TimerEventInfo>());
  const stateWatchersRef = useRef(new Set<(newState: TimerState) => void>());

  function updateEvent(ev: TimerEventInfo, isReset = false) {
    if (typeof timerStartRef.current != "number") return; // not running
    const elapsed = Date.now() - timerStartRef.current;

    if (typeof ev._lastTrigger == "undefined") {
      if (typeof ev.morePeriod == "number") {
        ev._lastTrigger =
          elapsed < ev.firstTime
            ? undefined
            : Math.min(
                Math.floor((elapsed - ev.firstTime) / ev.morePeriod),
                ev.moreCount ?? Infinity
              );
        if (isReset && ev.firstTime === 0) ev._lastTrigger = undefined;
      } else {
        if (elapsed >= ev.firstTime && !(isReset && ev.firstTime === 0))
          ev._lastTrigger = 0;
      }
    }

    const nextTime =
      ev._lastTrigger === undefined
        ? ev.firstTime
        : ev.morePeriod
          ? typeof ev.moreCount == "number" && ev._lastTrigger >= ev.moreCount
            ? undefined
            : (ev._lastTrigger + 1) * ev.morePeriod + ev.firstTime
          : undefined;
    if (typeof nextTime == "number") {
      ev._timeoutId = +setTimeout(() => {
        ev._lastTrigger ??= -1;
        ev._lastTrigger++;
        ev.callback(ev._lastTrigger);
        updateEvent(ev);
      }, nextTime - elapsed);
    } else ev._timeoutId = undefined;
  }

  function notifyState() {
    const newState = getState();
    for (const callback of stateWatchersRef.current) {
      callback(newState);
    }
  }

  const getState = useCallback(() => {
    if (typeof timerStartRef.current == "number") return "running";
    else if (typeof timeElapsedRef.current == "number") return "paused";
    else return "stopped";
  }, []);

  const reset = useCallback(() => {
    timerStartRef.current = Date.now();
    timeElapsedRef.current = undefined;
    for (const ev of eventsRef.current) {
      ev._lastTrigger = undefined;
      clearTimeout(ev._timeoutId);
      ev._timeoutId = undefined;
      updateEvent(ev, true);
    }
    notifyState();
  }, []);

  const stop = useCallback(() => {
    timerStartRef.current = undefined;
    timeElapsedRef.current = undefined;
    for (const ev of eventsRef.current) {
      clearTimeout(ev._timeoutId);
      ev._timeoutId = undefined;
      ev._lastTrigger = undefined;
    }
    notifyState();
  }, []);

  const pause = useCallback(() => {
    if (typeof timerStartRef.current == "number") {
      timeElapsedRef.current = Date.now() - timerStartRef.current;
      timerStartRef.current = undefined;
      for (const ev of eventsRef.current) {
        clearTimeout(ev._timeoutId);
        ev._timeoutId = undefined;
      }
    }
    // else: not running
    notifyState();
  }, []);

  const resume = useCallback(() => {
    if (typeof timerStartRef.current == "number") return; // already running
    if (typeof timeElapsedRef.current == "number") {
      timerStartRef.current = Date.now() - timeElapsedRef.current;
      timeElapsedRef.current = undefined;
      for (const ev of eventsRef.current) updateEvent(ev);
    } else {
      reset();
    }
    notifyState();
  }, []);

  const addEvent = useCallback((ev: TimerEventInfo) => {
    eventsRef.current.add(ev);

    updateEvent(ev);
  }, []);

  const removeEvent = useCallback((ev: TimerEventInfo) => {
    if (eventsRef.current.has(ev)) {
      eventsRef.current.delete(ev);
      clearTimeout(ev._timeoutId);
      ev._timeoutId = undefined;
      ev._lastTrigger = undefined;
    }
  }, []);

  const watchState = useCallback((callback: (newState: TimerState) => void) => {
    stateWatchersRef.current.add(callback);
  }, []);

  const unwatchState = useCallback(
    (callback: (newState: TimerState) => void) => {
      stateWatchersRef.current.delete(callback);
    },
    []
  );

  const getElapsed = useCallback(() => {
    if (typeof timerStartRef.current == "number")
      return Date.now() - timerStartRef.current;
    else if (typeof timeElapsedRef.current == "number")
      return timeElapsedRef.current;
    else return 0;
  }, []);

  useEffect(() => {
    reset();
  }, []);

  useEffect(() => {
    if (typeof isRunning == "boolean") {
      if (isRunning) resume();
      else pause();
    }
  }, [isRunning]);

  return useMemo(
    () => ({
      reset,
      stop,
      pause,
      resume,
      getState,
      addEvent,
      removeEvent,
      watchState,
      unwatchState,
      getElapsed,
      _: {
        timerStartRef,
        timeElapsedRef,
      },
    }),
    [reset, stop, pause, resume, getState, addEvent, removeEvent]
  );
}

export function useElapsedTime(timer: TimerControls) {
  const [elapsed, setElapsed] = useState(0);

  useAnimationFrame(() => {
    if (typeof timer._.timerStartRef.current == "number")
      setElapsed(Date.now() - timer._.timerStartRef.current);
    else if (typeof timer._.timeElapsedRef.current == "number")
      setElapsed(timer._.timeElapsedRef.current);
    else setElapsed(0);
  });

  return elapsed;
}

export function useElapsedTimeMotion(timer: TimerControls) {
  const elapsed = useMotionValue(0);

  useAnimationFrame(() => {
    if (typeof timer._.timerStartRef.current == "number")
      elapsed.set(Date.now() - timer._.timerStartRef.current);
    else if (typeof timer._.timeElapsedRef.current == "number")
      elapsed.set(timer._.timeElapsedRef.current);
    else elapsed.set(0);
  });

  return elapsed;
}

export function useHasElapsed(timer: TimerControls, threshold: number) {
  const [hasElapsed, setHasElapsed] = useState(false);

  useAnimationFrame(() => {
    const timeElapsed =
      typeof timer._.timerStartRef.current == "number"
        ? Date.now() - timer._.timerStartRef.current
        : typeof timer._.timeElapsedRef.current == "number"
          ? timer._.timeElapsedRef.current
          : 0;
    setHasElapsed(timeElapsed >= threshold);
  });

  return hasElapsed;
}

export function useRemainingTime(timer: TimerControls, until: number) {
  const [remaining, setRemaining] = useState(0);

  useAnimationFrame(() => {
    const timeElapsed =
      typeof timer._.timerStartRef.current == "number"
        ? Date.now() - timer._.timerStartRef.current
        : typeof timer._.timeElapsedRef.current == "number"
          ? timer._.timeElapsedRef.current
          : 0;
    setRemaining(Math.max(until - timeElapsed, 0));
  });

  return remaining;
}

export function useTimerEvent(
  timer: TimerControls,
  options: number | { time: number; period?: number; repeatCount?: number },
  callback: (count: number) => void
) {
  const { time, period, repeatCount } =
    typeof options == "number" ? { time: options } : options;

  const eventRef = useRef<TimerEventInfo | undefined>(undefined);

  useEffect(() => {
    const ev: TimerEventInfo = {
      firstTime: time,
      morePeriod: period,
      moreCount: repeatCount,
      callback,
    };

    timer.addEvent(ev);
    eventRef.current = ev;

    return () => {
      timer.removeEvent(ev);
      eventRef.current = undefined;
    };
  }, [timer, time, period, repeatCount]);

  useEffect(() => {
    if (eventRef.current) {
      eventRef.current.callback = callback;
    }
  }, [callback]);
}

export function useTimerState(timer: TimerControls) {
  const [timerState, setTimerState] = useState(() => timer.getState());

  useEffect(() => {
    setTimerState(timer.getState());

    function handler(newState: TimerState) {
      setTimerState(newState);
    }

    timer.watchState(handler);

    return () => {
      timer.unwatchState(handler);
    };
  }, [timer]);

  return timerState;
}
