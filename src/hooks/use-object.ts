import { useMemo } from "react";

export function useObject<T extends object>(obj: T) {
  return useMemo(() => obj, Object.values(obj));
}
