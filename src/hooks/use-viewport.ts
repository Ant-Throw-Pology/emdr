import { useAbortEffect } from "@/hooks/use-abort-effect";
import { useState } from "react";

export function useViewport() {
  const [width, setWidth] = useState(window.innerWidth);
  const [height, setHeight] = useState(window.innerHeight);
  const [devicePixelRatio, setDevicePixelRatio] = useState(
    window.devicePixelRatio,
  );

  useAbortEffect((signal) => {
    window.addEventListener(
      "resize",
      () => {
        setWidth(window.innerWidth);
        setHeight(window.innerHeight);
        setDevicePixelRatio(window.devicePixelRatio);
      },
      { signal },
    );
  }, []);

  return { width, height, devicePixelRatio };
}
