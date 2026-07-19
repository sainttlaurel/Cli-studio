"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Send, PenLine } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getSessionId } from "@/lib/session";
import { containsProfanity } from "@/lib/moderation";

const NAME_MAX = 40;
const MSG_MAX = 80;

interface Signature {
  id: string;
  session_id: string;
  name: string | null;
  message: string;
  created_at: string;
}

export function YearbookSignatures({ stripId }: { stripId: string }) {
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ownId, setOwnId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("messages")
      .select("id, session_id, name, message, created_at")
      .eq("strip_id", stripId)
      .order("created_at", { ascending: true })
      .limit(50);
    setSignatures((data ?? []) as Signature[]);
    setLoading(false);
  }, [stripId]);

  useEffect(() => {
    load();
    getSessionId().then(setOwnId).catch(() => undefined);
  }, [load]);

  const sign = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = text.trim();
    if (!trimmed) return;
    if (trimmed.length > MSG_MAX) {
      setError(`Keep it under ${MSG_MAX} characters.`);
      return;
    }
    if (containsProfanity(trimmed) || containsProfanity(name)) {
      setError("Please keep it kind ✨");
      return;
    }

    setPosting(true);
    try {
      const userId = await getSessionId();
      setOwnId(userId);
      const { data, error: insertError } = await supabase
        .from("messages")
        .insert({
          strip_id: stripId,
          session_id: userId,
          name: name.trim().slice(0, NAME_MAX) || null,
          message: trimmed,
        })
        .select()
        .single();
      if (insertError) throw insertError;
      setSignatures((s) => [...s, data as Signature]);
      setText("");
      setName("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not post. Try again."
      );
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <PenLine className="text-primary" size={16} />
        <h3 className="text-sm font-heading font-bold text-foreground">
          Sign this strip ✍️
        </h3>
        {signatures.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {signatures.length} signature{signatures.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Signatures list */}
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
          <Loader2 className="animate-spin" size={13} />
          <span>Loading signatures...</span>
        </div>
      ) : signatures.length > 0 ? (
        <div className="flex flex-col gap-2">
          {signatures.map((sig) => (
            <div
              key={sig.id}
              className={`px-3 py-2.5 rounded-xl text-sm border ${
                ownId === sig.session_id
                  ? "bg-primary/5 border-primary/20"
                  : "bg-muted border-border"
              }`}
            >
              <div className="flex items-baseline gap-2">
                <span className="font-heading font-bold text-primary text-xs">
                  {sig.name || "Anonymous"}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(sig.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-foreground/80 mt-0.5 text-xs leading-relaxed">
                {sig.message}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          No signatures yet — be the first!
        </p>
      )}

      {/* Sign form */}
      <form
        onSubmit={sign}
        className="flex flex-col gap-2 pt-2 border-t border-border"
      >
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={NAME_MAX}
          placeholder="Your name (optional)"
          className="px-3 py-2 bg-muted border border-border rounded-xl text-xs outline-none focus:border-primary transition-colors"
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={MSG_MAX}
            placeholder="Leave a message... 💖"
            className="flex-1 px-3 py-2 bg-muted border border-border rounded-xl text-xs outline-none focus:border-primary transition-colors"
          />
          <button
            type="submit"
            disabled={posting || !text.trim()}
            className="px-3 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground text-xs font-bold rounded-xl transition-all flex items-center gap-1"
          >
            {posting ? (
              <Loader2 className="animate-spin" size={13} />
            ) : (
              <Send size={13} />
            )}
          </button>
        </div>
        <div className="flex items-center justify-between">
          {error ? (
            <p className="text-xs text-destructive">{error}</p>
          ) : (
            <span className="text-[10px] text-muted-foreground">
              {MSG_MAX - text.length} chars left
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
