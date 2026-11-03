'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Avatar from './Avatar';
import RoleBadge from './RoleBadge';
import { ClipIcon, MicIcon, SendIcon, StopIcon } from './Icons';

const MAX = 4 * 1024 * 1024;
const clock = (d) => new Date(d).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

function Attachment({ m }) {
  if (!m.media_id) return null;
  const src = `/m/${m.media_id}`;
  if (m.mime.startsWith('image/'))
    return <a href={src} target="_blank" rel="noreferrer"><img src={src} alt="" loading="lazy" className="mt-1.5 max-h-72 max-w-full rounded border border-line" /></a>;
  if (m.mime.startsWith('video/'))
    return <video src={src} controls preload="metadata" className="mt-1.5 max-h-72 max-w-full rounded border border-line" />;
  return <audio src={src} controls preload="none" className="mt-1.5 h-9 w-72 max-w-full" />;
}

// Shared by the public lounge (endpoint "/api/chat") and friend DMs ("/api/chat?dm=name").
// Live updates come from polling every 2.5s, which works on Vercel without a websocket server.
export default function Chat({ endpoint, me, canModerate = false, placeholder = 'Message…' }) {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [err, setErr] = useState('');
  const [sending, setSending] = useState(false);
  const [rec, setRec] = useState(null);
  const last = useRef(0);
  const box = useRef(null);
  const stick = useRef(true);
  const recorder = useRef(null);
  const timer = useRef(null);
  const fileInput = useRef(null);
  const sep = endpoint.includes('?') ? '&' : '?';

  const poll = useCallback(async () => {
    try {
      const r = await fetch(`${endpoint}${sep}after=${last.current}`, { cache: 'no-store' });
      if (!r.ok) return;
      const { messages } = await r.json();
      if (messages.length) {
        last.current = messages[messages.length - 1].id;
        setMsgs((m) => [...m, ...messages].slice(-300));
      }
    } catch {}
  }, [endpoint, sep]);

  useEffect(() => {
    let stop = false;
    let t;
    const loop = async () => {
      if (!document.hidden) await poll();
      if (!stop) t = setTimeout(loop, 2500);
    };
    loop();
    return () => { stop = true; clearTimeout(t); };
  }, [poll]);

  useEffect(() => {
    if (stick.current && box.current) box.current.scrollTop = box.current.scrollHeight;
  }, [msgs]);

  useEffect(() => () => {
    clearInterval(timer.current);
    if (recorder.current?.state === 'recording') recorder.current.stop();
  }, []);

  const send = async () => {
    if (sending || (!text.trim() && !file)) return;
    setSending(true);
    setErr('');
    const fd = new FormData();
    fd.set('body', text);
    if (file) fd.set('file', file, file.name);
    try {
      const r = await fetch(endpoint, { method: 'POST', body: fd });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) setErr(j.error || 'Could not send.');
      else {
        setText('');
        setFile(null);
        stick.current = true;
        await poll();
      }
    } catch {
      setErr('Network error.');
    }
    setSending(false);
  };

  const pick = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > MAX) return setErr('Files are limited to 4 MB.');
    setErr('');
    setFile(f);
  };

  const startRec = async () => {
    setErr('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((t) => window.MediaRecorder?.isTypeSupported?.(t));
      const mr = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
      const chunks = [];
      mr.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(timer.current);
        setRec(null);
        const blob = new Blob(chunks, { type: mr.mimeType || 'audio/webm' });
        if (blob.size > MAX) return setErr('That voice note is too long.');
        if (blob.size) setFile(new File([blob], `voice.${blob.type.includes('mp4') ? 'm4a' : 'webm'}`, { type: blob.type }));
      };
      recorder.current = mr;
      mr.start();
      let s = 0;
      setRec(0);
      timer.current = setInterval(() => {
        setRec(++s);
        if (s >= 120) mr.stop();
      }, 1000);
    } catch {
      setErr('Microphone access was blocked. Allow it in your browser to send voice notes.');
    }
  };
  const stopRec = () => recorder.current?.state === 'recording' && recorder.current.stop();

  const remove = async (id) => {
    setMsgs((m) => m.filter((x) => x.id !== id));
    await fetch(`${endpoint}${sep}id=${id}`, { method: 'DELETE' }).catch(() => {});
  };

  return (
    <div className="flex h-[calc(100dvh-15rem)] min-h-[420px] flex-col rounded border border-line bg-surface">
      <div
        ref={box}
        onScroll={(e) => { const t = e.currentTarget; stick.current = t.scrollHeight - t.scrollTop - t.clientHeight < 80; }}
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        {!msgs.length && <p className="py-10 text-center text-muted">No messages yet. Say hi.</p>}
        {msgs.map((m, i) => {
          const prev = msgs[i - 1];
          const joined = prev && prev.username === m.username && new Date(m.created_at) - new Date(prev.created_at) < 5 * 60 * 1000;
          const mine = m.username === me;
          return (
            <div key={m.id} className={`group flex gap-3 ${joined ? 'mt-0.5' : 'mt-4 first:mt-0'}`}>
              <div className="w-8 shrink-0">{!joined && <Avatar user={m} size={32} />}</div>
              <div className="min-w-0 flex-1">
                {!joined && (
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <Link href={`/u/${m.username}`} className="text-sm font-medium hover:underline">{m.display_name || m.username}</Link>
                    {m.display_name && <span className="text-xs text-muted">@{m.username}</span>}
                    <RoleBadge role={m.role} />
                    <span className="text-xs text-muted">{clock(m.created_at)}</span>
                  </div>
                )}
                {m.body && <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{m.body}</p>}
                <Attachment m={m} />
              </div>
              {(mine || canModerate) && (
                <button onClick={() => remove(m.id)} className="self-start text-xs text-muted opacity-0 transition-opacity hover:text-red-400 focus:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
                  Delete
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t border-line px-3 py-2 text-center text-[11px] text-muted">messages and attachments are automatically deleted after 15 hours.</div>
      <div className="border-t border-line p-3">
        {err && <p role="alert" className="mb-2 text-[13px] text-red-400">{err}</p>}
        {file && (
          <div className="mb-2 flex items-center gap-2 text-[13px] text-muted">
            <span className="truncate rounded border border-line bg-bg px-2 py-1">{file.name.startsWith('voice.') ? 'Voice note ready' : file.name}</span>
            <button onClick={() => setFile(null)} className="hover:text-fg">Remove</button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/gif,image/webp,audio/*,video/mp4,video/webm" onChange={pick} className="hidden" />
          <button type="button" onClick={() => fileInput.current?.click()} aria-label="Attach a file" className="btn-ghost h-10 w-10 shrink-0 px-0">
            <ClipIcon width={16} height={16} />
          </button>
          {rec === null ? (
            <button type="button" onClick={startRec} aria-label="Record a voice note" className="btn-ghost h-10 w-10 shrink-0 px-0">
              <MicIcon width={16} height={16} />
            </button>
          ) : (
            <button type="button" onClick={stopRec} aria-label="Stop recording" className="btn-ghost h-10 shrink-0 gap-2 border-red-400/40 px-3 text-red-400">
              <StopIcon width={12} height={12} /> {mmss(rec)}
            </button>
          )}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            maxLength={2000}
            rows={1}
            placeholder={placeholder}
            aria-label="Message"
            className="max-h-32 min-h-10 flex-1 resize-none rounded border border-line bg-bg px-3 py-2 text-[15px] placeholder:text-muted focus:border-accent focus:outline-none"
          />
          <button type="button" onClick={send} disabled={sending} aria-label="Send" className="btn-primary h-10 w-10 shrink-0 px-0">
            <SendIcon width={16} height={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
