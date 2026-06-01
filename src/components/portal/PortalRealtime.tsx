"use client";

import { useRealtimeRefresh } from "@/lib/realtime";

export function PortalRealtime() {
  useRealtimeRefresh({
    channelName: "portal-global",
    tables: [
      "Quote",
      "Order",
      "Invoice",
      "Service",
      "Project",
      "SiteSetting",
      "User",
      "DailyNote",
      "Shift",
      "Punch",
      "PunchBreak",
      "TimeEntry",
    ],
    fallbackMs: 30000,
  });

  return null;
}

