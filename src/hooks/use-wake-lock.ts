import { useEffect, useRef } from "react";

export function useWakeLock(active = true) {
  if (!navigator.wakeLock) {
    return;
  }
  const lockRef = useRef<WakeLockSentinel | Promise<WakeLockSentinel>>(
    undefined,
  );

  useEffect(() => {
    if (!active) return;
    function handleVisibility() {
      if (document.visibilityState != "visible") {
        if (lockRef.current instanceof WakeLockSentinel) {
          lockRef.current.release();
          lockRef.current = undefined;
        }
        return;
      }
      if (lockRef.current) return;
      (lockRef.current = navigator.wakeLock.request("screen")).then(
        (sentinel) => {
          lockRef.current = sentinel;
          sentinel.addEventListener("release", () => {});
        },
        () => {
          lockRef.current = undefined;
        },
      );
    }
    handleVisibility();

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);

      if (lockRef.current instanceof WakeLockSentinel) {
        lockRef.current.release();
        lockRef.current = undefined;
      }
    };
  }, [active]);
}
