"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getSessionId } from "@/lib/session";

const EMOJIS = ["❤️", "✨", "😂", "🔥"] as const;
type Emoji = (typeof EMOJIS)[number];

interface ReactionCount {
  emoji: Emoji;
  count: number;
  reacted: boolean;
}

export function MessageReactions({ messageId }: { messageId: string }) {
  const [reactions, setReactions] = useState<ReactionCount[]>(
    EMOJIS.map((e) => ({ emoji: e, count: 0, reacted: false }))
  );
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getSessionId().then(setSessionId).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    async function load() {
      const { data } = await supabase
        .from("message_reactions")
        .select("emoji, session_id")
        .eq("message_id", messageId);

      if (!data) return;

      setReactions(
        EMOJIS.map((emoji) => ({
          emoji,
          count: data.filter((r) => r.emoji === emoji).length,
          reacted: data.some(
            (r) => r.emoji === emoji && r.session_id === sessionId
          ),
        }))
      );
    }

    load();
  }, [messageId, sessionId]);

  const toggle = async (emoji: Emoji) => {
    if (!sessionId || busy) return;
    setBusy(true);

    const current = reactions.find((r) => r.emoji === emoji)!;

    // Optimistic update
    setReactions((prev) =>
      prev.map((r) =>
        r.emoji === emoji
          ? {
              ...r,
              count: current.reacted ? r.count - 1 : r.count + 1,
              reacted: !current.reacted,
            }
          : r
      )
    );

    try {
      if (current.reacted) {
        await supabase
          .from("message_reactions")
          .delete()
          .eq("message_id", messageId)
          .eq("session_id", sessionId)
          .eq("emoji", emoji);
      } else {
        await supabase.from("message_reactions").insert({
          message_id: messageId,
          session_id: sessionId,
          emoji,
        });
      }
    } catch {
      // Revert optimistic update on failure
      setReactions((prev) =>
        prev.map((r) =>
          r.emoji === emoji
            ? { ...r, count: current.count, reacted: current.reacted }
            : r
        )
      );
    } finally {
      setBusy(false);
    }
  };

  const visible = reactions.filter((r) => r.count > 0 || true);

  return (
    <div className="flex items-center gap-1.5 flex-wrap mt-1">
      {visible.map(({ emoji, count, reacted }) => (
        <button
          key={emoji}
          onClick={() => toggle(emoji as Emoji)}
          disabled={busy}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border transition-all ${
            reacted
              ? "bg-primary/10 border-primary text-primary"
              : "bg-muted border-border text-muted-foreground hover:border-primary/50"
          } disabled:cursor-not-allowed`}
        >
          <span>{emoji}</span>
          {count > 0 && <span>{count}</span>}
        </button>
      ))}
    </div>
  );
}
