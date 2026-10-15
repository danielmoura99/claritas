"use client";

import * as React from "react";
import { TIME_ZONE } from "@/lib/market/presentation";

/** Relógio de Brasília. Só existe no navegador (vazio no SSR para não divergir na hidratação). */
export function Clock() {
  const [t, setT] = React.useState("--:--:--");
  React.useEffect(() => {
    const tick = () => setT(new Date().toLocaleTimeString("pt-BR", { timeZone: TIME_ZONE, hourCycle: "h23" }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <>{t}</>;
}
