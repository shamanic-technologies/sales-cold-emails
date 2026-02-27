"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "./store";
import { getSetup } from "./api-client";

export function useSetupSync() {
  const hydrateFromServer = useAppStore((s) => s.hydrateFromServer);
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    getSetup().then((setup) => {
      if (setup) {
        hydrateFromServer(setup);
      }
    });
  }, [hydrateFromServer]);
}
