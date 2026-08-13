import { useRef } from "react";

export function useSetChanges<T, K = number | string>(
  source: Set<T>,
  getKey: (value: T) => K,
  onAdd: (value: T) => void,
  onRemove: (value: T) => void
) {
  const oldKeys = useRef(new Map<K, T>());
  const newKeys = new Map([...source].map((item) => [getKey(item), item]));
  const allKeys = new Set([...oldKeys.current.keys(), ...newKeys.keys()]);

  for (const key of allKeys) {
    const inOld = oldKeys.current.has(key);
    const inNew = newKeys.has(key);

    if (inOld !== inNew) {
      if (inNew) {
        const item = newKeys.get(key)!;
        oldKeys.current.set(key, item);
        onAdd(item);
      } else {
        const item = oldKeys.current.get(key)!;
        oldKeys.current.delete(key);
        onRemove(item);
      }
    }
  }
}
