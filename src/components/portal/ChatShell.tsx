"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MemberAvatar } from "./Avatar";
import {
  Send,
  Paperclip,
  Smile,
  Mic,
  X,
  Plus,
  Search,
  Users,
  MessageSquare,
  ChevronLeft,
  Loader2,
  FileIcon,
  Download,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ChatAttachment = {
  url: string;
  name?: string;
  type?: string;
  kind?: string; // "image" | "audio" | "file"
  size?: number;
};

export type ChatMsg = {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  body: string | null;
  type: string; // "text" | "file" | "voice"
  attachments: ChatAttachment[];
  createdAt: string;
  editedAt: string | null;
};

export type ChatRoom = {
  id: string;
  type: string; // "general" | "direct"
  name: string | null;
  unread: number;
  lastMessage: {
    body: string | null;
    authorName: string;
    createdAt: string;
  } | null;
  members: {
    id: string;
    name: string | null;
    avatar: string | null;
    role: string;
    company: string | null;
  }[];
};

export type ChatUser = {
  id: string;
  name: string | null;
  avatar: string | null;
  role: string;
  company?: string | null;
};

// ─── Emoji set ────────────────────────────────────────────────────────────────
const EMOJIS = [
  "😀","😂","🥹","😊","😍","🤩","😎","🥳","😅","😭","😤","🤔","😴","🤯","🫡","😇",
  "👍","👎","👏","🙌","🤝","✌️","🫶","❤️","🔥","⭐","💯","🎉","✅","❌","⚠️","💪",
  "📎","📁","💼","🖥️","📱","💡","🔑","📧","📞","📅","🕐","💬","📌","🏆","🚀","🛠️",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) +
    " " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function VoicePlayer({ src, isMe }: { src: string; isMe: boolean }) {
  return (
    <audio
      src={src}
      controls
      className={`h-9 w-48 sm:w-64 max-w-full ${isMe ? "invert" : ""}`}
      style={{ filter: isMe ? "invert(1) hue-rotate(180deg)" : undefined }}
    />
  );
}

function AttachmentBubble({
  a,
  isMe,
}: {
  a: ChatAttachment;
  isMe: boolean;
}) {
  if (a.kind === "image") {
    return (
      <a href={a.url} target="_blank" rel="noopener noreferrer" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={a.url}
          alt={a.name ?? "imagen"}
          className="max-w-[200px] max-h-[180px] rounded-lg object-cover"
        />
      </a>
    );
  }
  return (
    <a
      href={a.url}
      download={a.name ?? true}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-2 text-xs underline-offset-2 hover:underline ${
        isMe ? "text-[var(--color-ink-950)]/80" : "text-white/70"
      }`}
    >
      <FileIcon size={14} />
      <span className="truncate max-w-[180px]">{a.name ?? "Archivo"}</span>
      {a.size != null && (
        <span className="opacity-60 shrink-0">{formatBytes(a.size)}</span>
      )}
      <Download size={12} className="shrink-0" />
    </a>
  );
}

// ─── ChatShell ────────────────────────────────────────────────────────────────

export function ChatShell({
  currentUser,
  allUsers,
}: {
  currentUser: ChatUser;
  allUsers: ChatUser[];
}) {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [draft, setDraft] = useState("");
  const [draftFiles, setDraftFiles] = useState<ChatAttachment[]>([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showNewDM, setShowNewDM] = useState(false);
  const [userQuery, setUserQuery] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [mobileView, setMobileView] = useState<"rooms" | "chat">("rooms");

  const scrollEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastMsgTimeRef = useRef<string | null>(null);
  const selectedRoomIdRef = useRef<string | null>(null);

  // ── Fetch rooms ──────────────────────────────────────────────────────────
  const fetchRooms = useCallback(async () => {
    try {
      const r = await fetch("/api/chat/rooms");
      const j = await r.json();
      setRooms(Array.isArray(j.rooms) ? j.rooms : []);
    } catch { /* network error */ }
  }, []);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  // ── Load messages ────────────────────────────────────────────────────────
  const fetchMessages = useCallback(async (roomId: string, silent = false) => {
    if (!silent) setLoadingMsgs(true);
    try {
      const r = await fetch(`/api/chat/rooms/${roomId}/messages`);
      const j = await r.json();
      const msgs: ChatMsg[] = Array.isArray(j.messages) ? j.messages : [];
      setMessages(msgs);
      if (msgs.length > 0) {
        lastMsgTimeRef.current = msgs[msgs.length - 1].createdAt;
      } else {
        lastMsgTimeRef.current = new Date().toISOString();
      }
    } finally {
      if (!silent) setLoadingMsgs(false);
    }
  }, []);

  // ── Select a room ────────────────────────────────────────────────────────
  const selectRoom = useCallback(
    async (room: ChatRoom) => {
      if (pollRef.current) clearInterval(pollRef.current);
      selectedRoomIdRef.current = room.id;
      setSelectedRoom(room);
      setMobileView("chat");
      setMessages([]);
      await fetchMessages(room.id);
      // Mark as read
      fetch(`/api/chat/rooms/${room.id}/read`, { method: "POST" }).then(() =>
        fetchRooms()
      );
    },
    [fetchMessages, fetchRooms]
  );

  // ── Start polling when selectedRoom changes ──────────────────────────────
  useEffect(() => {
    if (!selectedRoom) return;
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      const roomId = selectedRoomIdRef.current;
      if (!roomId || !lastMsgTimeRef.current) return;
      try {
        const r = await fetch(
          `/api/chat/rooms/${roomId}/messages?after=${encodeURIComponent(lastMsgTimeRef.current)}`
        );
        const j = await r.json();
        const newMsgs: ChatMsg[] = Array.isArray(j.messages) ? j.messages : [];
        if (newMsgs.length > 0) {
          setMessages((prev) => {
            const ids = new Set(prev.map((m) => m.id));
            const fresh = newMsgs.filter((m) => !ids.has(m.id));
            if (fresh.length === 0) return prev;
            lastMsgTimeRef.current = fresh[fresh.length - 1].createdAt;
            return [...prev, ...fresh];
          });
          // Mark as read + refresh rooms
          fetch(`/api/chat/rooms/${roomId}/read`, { method: "POST" });
          fetchRooms();
        }
      } catch { /* ignore */ }
    }, 2500);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [selectedRoom?.id, fetchRooms]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Scroll to bottom ─────────────────────────────────────────────────────
  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send message ─────────────────────────────────────────────────────────
  async function sendMessage() {
    if ((!draft.trim() && draftFiles.length === 0) || !selectedRoom || isSending) return;
    setIsSending(true);
    const roomId = selectedRoom.id;
    const body = draft.trim() || null;
    const type = draftFiles.length > 0 && !body ? "file" : "text";
    setDraft("");
    setDraftFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    try {
      const r = await fetch(`/api/chat/rooms/${roomId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, type, attachments: draftFiles }),
      });
      const j = await r.json();
      if (j.message) {
        setMessages((prev) => {
          const ids = new Set(prev.map((m) => m.id));
          if (ids.has(j.message.id)) return prev;
          lastMsgTimeRef.current = j.message.createdAt;
          return [...prev, j.message];
        });
        fetchRooms();
      }
    } finally {
      setIsSending(false);
    }
  }

  // ── File upload ──────────────────────────────────────────────────────────
  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const r = await fetch("/api/upload", { method: "POST", body: fd });
        const j = await r.json();
        if (r.ok && j.url) {
          setDraftFiles((prev) => [
            ...prev,
            { url: j.url, name: file.name, type: file.type, kind: j.kind, size: file.size },
          ]);
        }
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // ── Voice recording ──────────────────────────────────────────────────────
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg";
      const mr = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const ext = mimeType.includes("ogg") ? "ogg" : "webm";
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const file = new File([blob], `voice-${Date.now()}.${ext}`, { type: mimeType });
        const fd = new FormData();
        fd.append("file", file);
        const r = await fetch("/api/upload", { method: "POST", body: fd });
        const j = await r.json();
        if (r.ok && j.url && selectedRoomIdRef.current) {
          const roomId = selectedRoomIdRef.current;
          const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              body: null,
              type: "voice",
              attachments: [{ url: j.url, name: file.name, type: mimeType, kind: "audio", size: file.size }],
            }),
          });
          const rj = await res.json();
          if (rj.message) {
            setMessages((prev) => {
              const ids = new Set(prev.map((m) => m.id));
              if (ids.has(rj.message.id)) return prev;
              lastMsgTimeRef.current = rj.message.createdAt;
              return [...prev, rj.message];
            });
            fetchRooms();
          }
        }
      };

      mr.start(250);
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      setRecordSecs(0);
      recordTimerRef.current = setInterval(() => setRecordSecs((s) => s + 1), 1000);
    } catch {
      alert("No se pudo acceder al micrófono.");
    }
  }

  function stopRecording(send = true) {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    if (mediaRecorderRef.current && isRecording) {
      if (!send) {
        mediaRecorderRef.current.ondataavailable = () => {};
        mediaRecorderRef.current.onstop = () => {};
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream?.getTracks().forEach((t) => t.stop());
      } else {
        mediaRecorderRef.current.stop();
      }
    }
    setIsRecording(false);
    setRecordSecs(0);
  }

  // ── Open / create DM ─────────────────────────────────────────────────────
  async function openDM(userId: string) {
    const r = await fetch("/api/chat/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const j = await r.json();
    if (j.room) {
      setShowNewDM(false);
      setUserQuery("");
      await fetchRooms();
      selectRoom(j.room);
    }
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    const q = userQuery.toLowerCase();
    return allUsers.filter(
      (u) =>
        u.id !== currentUser.id &&
        (!q || `${u.name ?? ""} ${u.company ?? ""}`.toLowerCase().includes(q))
    );
  }, [allUsers, currentUser.id, userQuery]);

  function roomName(room: ChatRoom) {
    if (room.type === "general") return "General";
    const other = room.members.find((m) => m.id !== currentUser.id);
    return other?.name ?? "Chat directo";
  }

  function roomOther(room: ChatRoom) {
    return room.members.find((m) => m.id !== currentUser.id) ?? null;
  }

  const totalUnread = rooms.reduce((s, r) => s + r.unread, 0);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[500px] overflow-hidden rounded-2xl border border-white/8 bg-[var(--color-ink-950,#060b14)]">
      {/* ══ SIDEBAR ════════════════════════════════════════════════════════ */}
      <div
        className={`${
          mobileView === "rooms" ? "flex" : "hidden"
        } lg:flex flex-col w-full lg:w-72 lg:flex-none border-r border-white/8`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-sm">Chats</h2>
            {totalUnread > 0 && (
              <span className="min-w-[18px] h-[18px] rounded-full bg-[var(--color-brand-500)] text-[var(--color-ink-950)] text-[10px] font-bold grid place-items-center px-1">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowNewDM(true)}
            className="p-1.5 rounded-lg hover:bg-white/8 text-white/50 hover:text-white transition-colors"
            title="Nuevo chat directo"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Room list */}
        <div className="flex-1 overflow-y-auto py-1">
          {rooms.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-white/30">Cargando chats…</p>
          ) : (
            rooms.map((room) => {
              const other = roomOther(room);
              const isSelected = selectedRoom?.id === room.id;
              return (
                <button
                  key={room.id}
                  onClick={() => selectRoom(room)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    isSelected
                      ? "bg-[var(--color-brand-500)]/10 border-r-2 border-[var(--color-brand-500)]"
                      : "hover:bg-white/5"
                  }`}
                >
                  {room.type === "general" ? (
                    <div className="w-9 h-9 rounded-full bg-[var(--color-brand-500)]/20 grid place-items-center shrink-0">
                      <Users size={16} className="text-[var(--color-brand-400)]" />
                    </div>
                  ) : (
                    <MemberAvatar
                      id={other?.id ?? ""}
                      name={other?.name ?? "?"}
                      avatar={other?.avatar ?? null}
                      size={36}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-sm font-medium truncate">{roomName(room)}</span>
                      {room.unread > 0 && (
                        <span className="shrink-0 min-w-[18px] h-[18px] rounded-full bg-[var(--color-brand-500)] text-[var(--color-ink-950)] text-[10px] font-bold grid place-items-center px-1">
                          {room.unread > 99 ? "99+" : room.unread}
                        </span>
                      )}
                    </div>
                    {room.lastMessage ? (
                      <p className="text-xs text-white/40 truncate mt-0.5">
                        {room.lastMessage.body ?? "📎 Archivo"}
                      </p>
                    ) : (
                      <p className="text-xs text-white/25 mt-0.5 italic">Sin mensajes</p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ══ MESSAGE PANE ═══════════════════════════════════════════════════ */}
      <div
        className={`${
          mobileView === "chat" ? "flex" : "hidden"
        } lg:flex flex-col flex-1 min-w-0`}
      >
        {!selectedRoom ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-white/25">
            <MessageSquare size={40} />
            <p className="text-sm">Selecciona un chat para comenzar</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 shrink-0">
              <button
                onClick={() => setMobileView("rooms")}
                className="lg:hidden p-1.5 -ml-1 rounded hover:bg-white/5 text-white/60"
              >
                <ChevronLeft size={18} />
              </button>
              {selectedRoom.type === "general" ? (
                <div className="w-8 h-8 rounded-full bg-[var(--color-brand-500)]/20 grid place-items-center shrink-0">
                  <Users size={15} className="text-[var(--color-brand-400)]" />
                </div>
              ) : (
                <MemberAvatar
                  id={roomOther(selectedRoom)?.id ?? ""}
                  name={roomOther(selectedRoom)?.name ?? "?"}
                  avatar={roomOther(selectedRoom)?.avatar ?? null}
                  size={32}
                />
              )}
              <div>
                <div className="font-semibold text-sm">{roomName(selectedRoom)}</div>
                {selectedRoom.type === "general" && (
                  <div className="text-[11px] text-white/40">
                    {selectedRoom.members.length} miembros
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {loadingMsgs ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 size={20} className="animate-spin text-white/30" />
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-white/25 gap-2">
                  <MessageSquare size={28} />
                  <p className="text-xs">Sé el primero en escribir algo</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {messages.map((msg, i) => {
                    const isMe = msg.authorId === currentUser.id;
                    const prevMsg = messages[i - 1];
                    const showMeta =
                      !prevMsg || prevMsg.authorId !== msg.authorId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""} ${
                          showMeta ? "mt-3" : "mt-0.5"
                        }`}
                      >
                        {/* Avatar */}
                        <div className="w-8 shrink-0 self-end">
                          {showMeta && !isMe && (
                            <MemberAvatar
                              id={msg.authorId}
                              name={msg.authorName}
                              avatar={msg.authorAvatar}
                              size={28}
                            />
                          )}
                        </div>

                        <div
                          className={`max-w-[72%] space-y-0.5 flex flex-col ${
                            isMe ? "items-end" : "items-start"
                          }`}
                        >
                          {showMeta && !isMe && (
                            <span className="text-[11px] text-white/45 px-1 font-medium">
                              {msg.authorName}
                            </span>
                          )}

                          <div
                            className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                              isMe
                                ? "bg-[var(--color-brand-500)] text-[var(--color-ink-950)] rounded-br-sm"
                                : "bg-white/8 text-white/90 rounded-bl-sm"
                            }`}
                          >
                            {msg.type === "voice" && msg.attachments[0] ? (
                              <VoicePlayer src={msg.attachments[0].url} isMe={isMe} />
                            ) : (
                              <div className="space-y-2">
                                {msg.body && (
                                  <div className="whitespace-pre-wrap break-words">
                                    {msg.body}
                                  </div>
                                )}
                                {msg.attachments.map((a) => (
                                  <AttachmentBubble key={a.url} a={a} isMe={isMe} />
                                ))}
                              </div>
                            )}
                          </div>

                          <span
                            className={`text-[10px] text-white/30 px-1 ${
                              isMe ? "text-right" : ""
                            }`}
                          >
                            {formatTime(msg.createdAt)}
                            {msg.editedAt && " · editado"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={scrollEndRef} />
                </div>
              )}
            </div>

            {/* Composer */}
            <div className="border-t border-white/8 px-4 py-3 shrink-0">
              {/* Draft files preview */}
              {draftFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {draftFiles.map((f) => (
                    <div
                      key={f.url}
                      className="relative flex items-center gap-1.5 bg-white/8 rounded-lg px-2 py-1 text-xs max-w-[160px]"
                    >
                      {f.kind === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={f.url} alt="" className="w-6 h-6 rounded object-cover" />
                      ) : (
                        <FileIcon size={12} className="shrink-0" />
                      )}
                      <span className="truncate flex-1">{f.name ?? "Archivo"}</span>
                      <button
                        onClick={() =>
                          setDraftFiles((p) => p.filter((x) => x.url !== f.url))
                        }
                        className="text-white/40 hover:text-white shrink-0"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Recording state */}
              {isRecording ? (
                <div className="flex items-center gap-3 py-1">
                  <span className="flex items-center gap-2 text-red-400 text-sm font-medium">
                    <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                    Grabando&nbsp;
                    {String(Math.floor(recordSecs / 60)).padStart(2, "0")}:
                    {String(recordSecs % 60).padStart(2, "0")}
                  </span>
                  <div className="flex-1" />
                  <button
                    onClick={() => stopRecording(false)}
                    className="p-2 rounded-lg hover:bg-white/8 text-white/50 hover:text-white"
                    title="Cancelar"
                  >
                    <X size={16} />
                  </button>
                  <button
                    onClick={() => stopRecording(true)}
                    className="p-2 rounded-lg bg-[var(--color-brand-500)] text-[var(--color-ink-950)]"
                    title="Enviar nota de voz"
                  >
                    <Send size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-end gap-2">
                  {/* Emoji */}
                  <div className="relative">
                    <button
                      onClick={() => setShowEmoji((v) => !v)}
                      className="p-2 rounded-lg hover:bg-white/8 text-white/50 hover:text-white transition-colors"
                    >
                      <Smile size={18} />
                    </button>
                    <AnimatePresence>
                      {showEmoji && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          transition={{ duration: 0.12 }}
                          className="absolute bottom-full left-0 mb-2 w-72 rounded-xl border border-white/10 bg-[var(--color-ink-900,#0a1322)] shadow-2xl p-3 z-20"
                        >
                          <div className="grid grid-cols-8 gap-1">
                            {EMOJIS.map((e) => (
                              <button
                                key={e}
                                onClick={() => {
                                  setDraft((d) => d + e);
                                  setShowEmoji(false);
                                  textareaRef.current?.focus();
                                }}
                                className="text-xl leading-none hover:bg-white/10 rounded p-0.5 aspect-square grid place-items-center"
                              >
                                {e}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* File attach */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="p-2 rounded-lg hover:bg-white/8 text-white/50 hover:text-white transition-colors disabled:opacity-40"
                    title="Adjuntar archivo"
                  >
                    {isUploading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Paperclip size={18} />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    hidden
                    onChange={(e) => handleFiles(e.target.files)}
                  />

                  {/* Text input */}
                  <textarea
                    ref={textareaRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    onInput={(e) => {
                      const t = e.target as HTMLTextAreaElement;
                      t.style.height = "auto";
                      t.style.height = Math.min(t.scrollHeight, 128) + "px";
                    }}
                    placeholder="Escribe un mensaje… (Enter para enviar, Shift+Enter para nueva línea)"
                    rows={1}
                    className="flex-1 resize-none bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-[var(--color-brand-500)]/60 transition-colors overflow-y-auto"
                    style={{ maxHeight: 128 }}
                  />

                  {/* Voice */}
                  <button
                    onClick={startRecording}
                    className="p-2 rounded-lg hover:bg-white/8 text-white/50 hover:text-white transition-colors"
                    title="Grabar nota de voz"
                  >
                    <Mic size={18} />
                  </button>

                  {/* Send */}
                  <button
                    onClick={sendMessage}
                    disabled={
                      isSending || (!draft.trim() && draftFiles.length === 0)
                    }
                    className="p-2 rounded-lg bg-[var(--color-brand-500)] text-[var(--color-ink-950)] disabled:opacity-35 transition-opacity"
                    title="Enviar"
                  >
                    {isSending ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ══ NEW DM MODAL ════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showNewDM && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60"
              onClick={() => { setShowNewDM(false); setUserQuery(""); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="w-full max-w-sm bg-[var(--color-ink-900,#0a1322)] rounded-2xl border border-white/10 shadow-2xl overflow-hidden pointer-events-auto">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                  <h3 className="font-semibold text-sm">Nueva conversación</h3>
                  <button
                    onClick={() => { setShowNewDM(false); setUserQuery(""); }}
                    className="p-1 text-white/50 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="px-4 py-2 border-b border-white/8">
                  <div className="flex items-center gap-2">
                    <Search size={14} className="text-white/40 shrink-0" />
                    <input
                      autoFocus
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                      placeholder="Buscar usuario…"
                      className="flex-1 bg-transparent outline-none text-sm placeholder-white/30"
                    />
                  </div>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {filteredUsers.length === 0 ? (
                    <p className="px-4 py-6 text-center text-xs text-white/30">
                      No se encontraron usuarios
                    </p>
                  ) : (
                    filteredUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => openDM(u.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left transition-colors"
                      >
                        <MemberAvatar
                          id={u.id}
                          name={u.name ?? "?"}
                          avatar={u.avatar}
                          size={34}
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">
                            {u.name ?? "Usuario"}
                          </div>
                          <div className="text-xs text-white/40 truncate">
                            {u.role === "admin" ? "Administrador" : "Empleado"}
                            {u.company ? ` · ${u.company}` : ""}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
