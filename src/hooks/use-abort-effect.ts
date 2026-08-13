import { useEffect, type DependencyList } from "react";

export function useAbortEffect(
  callback: (signal: AbortSignal) => void,
  deps?: DependencyList
) {
  useEffect(() => {
    const ctrl = new AbortController();

    callback(ctrl.signal);

    return () => {
      ctrl.abort();
    };
  }, deps);
}
