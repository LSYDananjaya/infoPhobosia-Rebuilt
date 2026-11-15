import React from "react";
import { PhobosiaLoader } from "@/components/ui/PhobosiaLoader";

export default function Loading() {
  return (
    <PhobosiaLoader
      variant="fullscreen"
      state="streaming"
      label="Acquiring Sector Telemetry"
      detail="Elysium Relay"
      telemetryCode="PHOBOSIA // ROUTE SYNC"
      phaseBadge="MRO LINK"
    />
  );
}
