"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type RealtimeTable =
  | "Task"
  | "TaskColumn"
  | "TaskComment"
  | "TaskActivity"
  | "TaskView"
  | "ApprovalSheet"
  | "WorkSession"
  | "TimeEntry"
  | "Punch"
  | "PunchBreak"
  | "Shift"
  | "ChatMessage"
  | "ChatRoom"
  | "ChatRoomMember"
  | "DailyNote"
  | "Order"
  | "Invoice"
  | "Quote"
  | "Service"
  | "Project"
  | "SiteSetting"
  | "User";

type UseRealtimeRefreshOptions = {
  channelName: string;
  tables: RealtimeTable[];
  enabled?: boolean;
  debounceMs?: number;
  fallbackMs?: number;
  onChange?: () => void;
};

export function useRealtimeRefresh({
  channelName,
  tables,
  enabled = true,
  debounceMs = 350,
  fallbackMs,
  onChange,
}: UseRealtimeRefreshOptions) {
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeRef = useRef(onChange);
  const tableKey = useMemo(() => tables.join(","), [tables]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const tableList = tableKey.split(",").filter(Boolean) as RealtimeTable[];
    if (!enabled || tableList.length === 0) return;

    let channel: RealtimeChannel | null = null;
    let fallback: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    const refresh = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        onChangeRef.current?.();
        router.refresh();
      }, debounceMs);
    };

    try {
      const supabase = getSupabaseBrowserClient();
      channel = supabase.channel(channelName);

      for (const table of tableList) {
        channel.on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          refresh
        );
      }

      channel.subscribe((status) => {
        if (!cancelled && status === "CHANNEL_ERROR" && fallbackMs) {
          fallback = setInterval(refresh, fallbackMs);
        }
      });
    } catch {
      if (fallbackMs) fallback = setInterval(refresh, fallbackMs);
    }

    return () => {
      cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (fallback) clearInterval(fallback);
      if (channel) {
        getSupabaseBrowserClient().removeChannel(channel);
      }
    };
  }, [channelName, debounceMs, enabled, fallbackMs, router, tableKey]);
}
