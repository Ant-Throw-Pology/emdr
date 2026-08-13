import { useRef, type DependencyList } from "react";

export function useMemoArray<T, R>(
  source: T[],
  getKey: (item: T) => number | string,
  compute: (item: T) => R,
  otherDeps: DependencyList
) {
  const oldKeys = useRef<Set<number | string> | undefined>(undefined);
  const oldValues = useRef<Map<number | string, R> | undefined>(undefined);
  const oldDeps = useRef<DependencyList | undefined>(undefined);

  if (
    oldDeps.current === undefined ||
    oldDeps.current.length !== otherDeps.length ||
    oldDeps.current.some((v, i) => v !== otherDeps[i])
  ) {
    oldKeys.current = undefined;
    oldValues.current = undefined;
  }

  const newKeys = source.map((v) => getKey(v));
  const newKeySet = new Set(newKeys);

  oldKeys.current ??= new Set();
  oldValues.current ??= new Map();

  for (const key of oldKeys.current.difference(newKeySet)) {
    oldValues.current.delete(key);
  }

  for (const [index, item] of source.entries()) {
    const key = newKeys[index]!;
    if (!oldValues.current.has(key)) oldValues.current.set(key, compute(item));
  }

  oldKeys.current = newKeySet;
  oldDeps.current = otherDeps;

  return newKeys.map((key) => oldValues.current!.get(key) as R);
}
