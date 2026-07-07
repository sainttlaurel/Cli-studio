'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Camera, Loader2, Send, Trash2, MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getSessionId } from '@/lib/session';
import { containsProfanity } from '@/lib/moderation';
import type { Message } from '@/lib/types';

const MESSAGE_MAX = 300;
const NAME_MAX = 40;
const PAGE_SIZE = 50;

type Status = 'loading' | 'ready' | 'error';

export default function WallPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [ownId, setOwnId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setStatus('loading');
      const { data, error: queryError } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);
      if (queryError) throw queryError;
      setMessages((data ?? []) as Message[]);
      setStatus('ready');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError(err instanceof Error ? err.message : 'Could not load the wall.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
    getSessionId()
      .then(setOwnId)
      .catch(() => undefined);
  }, [load]);

  const post = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostError(null);

    const trimmed = text.trim();
    if (!trimmed) return;
    if (trimmed.length > MESSAGE_MAX) {
      setPostError(`Keep it under ${MESSAGE_MAX} characters.`);
      return;
    }
    if (containsProfanity(trimmed) || containsProfanity(name)) {
      setPostError("That message contains language we don't allow here. Please rephrase.");
      return;
    }

    setPosting(true);
    try {
      const userId = await getSessionId();
      setOwnId(userId);
      const { data, error: insertError } = await supabase
        .from('messages')
        .insert({
          session_id: userId,
          name: name.trim().slice(0, NAME_MAX) || null,
          message: trimmed,
        })
        .select()
        .single();
      if (insertError) throw insertError;
      setMessages((m) => [data as Message, ...m]);
      setText('');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setPostError(err instanceof Error ? err.message : 'Could not post your message. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this message?')) return;
    setBusyId(id);
    try {
      const { error: deleteError } = await supabase.from('messages').delete().eq('id', id);
      if (deleteError) throw deleteError;
      setMessages((m) => m.filter((msg) => msg.id !== id));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      window.alert('Could not delete that message. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-border bg-background/70 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow">
            <Camera className="text-primary-foreground" size={16} />
          </div>
          <span className="text-xl font-heading font-bold text-primary tracking-wide">
            Click<span className="text-secondary-foreground">Studio</span>
          </span>
        </Link>
        <Link
          href="/studio"
          className="px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-heading font-bold rounded-xl shadow-md shadow-primary/20 transition-all"
        >
          Shoot a Strip
        </Link>
      </header>

      <main className="flex-1 max-w-2xl mx-auto px-6 py-10 w-full flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <MessageCircle className="text-primary" size={20} />
          <h1 className="text-2xl font-heading font-extrabold text-foreground">Feedback Wall</h1>
        </div>
        <p className="text-sm text-muted-foreground -mt-4">
          Leave a note for other ClickStudio visitors. Public, site-wide, anonymous.
        </p>

        <form
          onSubmit={post}
          className="bg-background p-4 rounded-2xl border border-border/80 shadow-md flex flex-col gap-3"
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={NAME_MAX}
            placeholder="Name (optional)"
            className="px-3 py-2 bg-muted border border-border rounded-xl text-sm outline-none focus:border-primary transition-colors"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={MESSAGE_MAX}
            rows={3}
            placeholder="Say something nice... ✨"
            className="px-3 py-2 bg-muted border border-border rounded-xl text-sm outline-none focus:border-primary transition-colors resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">{MESSAGE_MAX - text.length} characters left</span>
            <button
              type="submit"
              disabled={posting || !text.trim()}
              className="px-4 py-2 bg-primary hover:bg-primary/95 disabled:opacity-50 text-primary-foreground text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
            >
              {posting ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
              <span>Post</span>
            </button>
          </div>
          {postError && <p className="text-xs text-destructive">{postError}</p>}
        </form>

        {status === 'loading' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-12 justify-center">
            <Loader2 className="animate-spin" size={18} />
            <span>Loading the wall...</span>
          </div>
        )}

        {status === 'error' && <p className="text-sm text-destructive">{error}</p>}

        {status === 'ready' && messages.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-12">
            No messages yet — be the first to say something!
          </p>
        )}

        {status === 'ready' && messages.length > 0 && (
          <div className="flex flex-col gap-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="bg-background p-4 rounded-2xl border border-border/60 shadow-sm flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary">{msg.name || 'Anonymous'}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(msg.created_at).toLocaleDateString()}
                    </span>
                    {ownId === msg.session_id && (
                      <button
                        onClick={() => remove(msg.id)}
                        disabled={busyId === msg.id}
                        title="Delete your message"
                        className="p-1 text-destructive hover:bg-destructive/10 rounded-md transition-all disabled:opacity-50"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{msg.message}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
