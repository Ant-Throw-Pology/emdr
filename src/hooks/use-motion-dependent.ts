import type { MotionValue } from "motion";
import { useAnimationFrame, useMotionValue } from "motion/react";
import { useState } from "react";

function sourcesGet<T extends { [x: string]: any }>(sources: {
  [k in keyof T]: MotionValue<T[k]>;
}) {
  return Object.fromEntries(
    (Object.entries(sources) as [keyof T, MotionValue][]).map(([k, v]) => [
      k,
      v.get(),
    ])
  ) as T;
}

export function useMotionDependent<T extends { [x: string]: any }, R>(
  sources: { [k in keyof T]: MotionValue<T[k]> },
  transformer: (sources: T) => R
) {
  const [initial] = useState(() => transformer(sourcesGet(sources)));
  const value = useMotionValue(initial);

  useAnimationFrame(() => {
    value.set(transformer(sourcesGet(sources)));
  });

  return value;
}
