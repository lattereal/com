'use client';
import { useRef, useState } from 'react';
import { PlayIcon, PauseIcon } from './Icons';

const t = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// One <audio> element shared by every track; only the track you press loads.
export default function SongPlayer({ songs, accent = '#6366f1' }) {
  const a = useRef(null);
  const [cur, setCur] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState({ pos: 0, dur: 0 });

  const play = (i) => {
    const el = a.current;
    if (cur === i) return void (el.paused ? el.play() : el.pause());
    setCur(i);
    el.src = songs[i].src;
    el.play().catch(() => {});
  };

  return (
    <div>
      <audio
        ref={a}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => (cur + 1 < songs.length ? play(cur + 1) : setPlaying(false))}
        onTimeUpdate={(e) => setTime({ pos: e.currentTarget.currentTime, dur: e.currentTarget.duration || 0 })}
      />
      <ul className="flex flex-col">
        {songs.map((s, i) => {
          const on = cur === i;
          return (
            <li key={s.id} className="flex items-center gap-3 py-2">
              <button
                onClick={() => play(i)}
                aria-label={`${on && playing ? 'Pause' : 'Play'} ${s.title}`}
                style={on ? { background: accent, color: '#0f0f11' } : undefined}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-fg transition-colors hover:border-[#3a3a3f]"
              >
                {on && playing ? <PauseIcon width={14} height={14} /> : <PlayIcon width={14} height={14} className="translate-x-px" />}
              </button>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{s.title}</div>
                {on ? (
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="range" min={0} max={time.dur || 0} step={0.1} value={time.pos}
                      onChange={(e) => { a.current.currentTime = Number(e.target.value); }}
                      aria-label="Seek" style={{ accentColor: accent }} className="h-1 flex-1"
                    />
                    <span className="text-xs tabular-nums text-muted">{t(time.pos)} / {t(time.dur)}</span>
                  </div>
                ) : (
                  s.artist && <div className="truncate text-[13px] text-muted">{s.artist}</div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
