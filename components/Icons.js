const base = { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };

export const PinIcon = (p) => (
  <svg {...base} {...p}><title>Pinned</title><path d="M9.5 2.5l4 4-2 .8-2.2 2.2.4 3-1 1-2.6-2.6L3 13.5M6.3 6.8l-.4 0-1-1 1-1 3 .4" /></svg>
);
export const LockIcon = (p) => (
  <svg {...base} {...p}><title>Locked</title><rect x="3.5" y="7" width="9" height="6.5" rx="1.5" /><path d="M5.5 7V5a2.5 2.5 0 015 0v2" /></svg>
);

export const ClipIcon = (p) => (
  <svg {...base} {...p}><title>Attach</title><path d="M13 7.5l-4.9 4.9a3 3 0 01-4.2-4.2l5.2-5.2a2 2 0 012.8 2.8L6.8 11a1 1 0 01-1.4-1.4L10 5" /></svg>
);
export const MicIcon = (p) => (
  <svg {...base} {...p}><title>Record voice</title><rect x="6" y="1.5" width="4" height="8" rx="2" /><path d="M3.5 7.5a4.5 4.5 0 009 0M8 12v2.5" /></svg>
);
export const SendIcon = (p) => (
  <svg {...base} {...p}><title>Send</title><path d="M2 8l12-5.5L10.5 14 8 9 2 8zM8 9l6-6.5" /></svg>
);
export const PlayIcon = (p) => (
  <svg {...base} fill="currentColor" stroke="none" {...p}><title>Play</title><path d="M4.5 2.8v10.4a.5.5 0 00.77.42l8-5.2a.5.5 0 000-.84l-8-5.2a.5.5 0 00-.77.42z" /></svg>
);
export const PauseIcon = (p) => (
  <svg {...base} fill="currentColor" stroke="none" {...p}><title>Pause</title><rect x="3.5" y="2.5" width="3.2" height="11" rx="1" /><rect x="9.3" y="2.5" width="3.2" height="11" rx="1" /></svg>
);
export const StopIcon = (p) => (
  <svg {...base} fill="currentColor" stroke="none" {...p}><title>Stop</title><rect x="3.5" y="3.5" width="9" height="9" rx="1.5" /></svg>
);
export const MusicIcon = (p) => (
  <svg {...base} {...p}><title>Audio</title><path d="M6 12.5V3l7-1.5v9.5M6 12.5a2 2 0 11-4 0 2 2 0 014 0zM13 11a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
);
export const FilmIcon = (p) => (
  <svg {...base} {...p}><title>Video</title><rect x="2" y="3" width="12" height="10" rx="1.5" /><path d="M6.5 6l3.5 2-3.5 2z" /></svg>
);
