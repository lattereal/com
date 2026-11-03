'use client';

import { useRef, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';

function Submit({ label }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="btn-primary">{pending ? 'saving…' : label}</button>;
}

export default function CropUpload({ action, label, aspect = 1, currentSrc, accept = 'image/png,image/jpeg,image/gif,image/webp' }) {
  const [state, formAction] = useFormState(action, null);
  const [src, setSrc] = useState('');
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState(null);
  const [ready, setReady] = useState(false);
  const formRef = useRef(null);
  const fileRef = useRef(null);
  const previewRef = useRef(null);
  const imageRef = useRef(null);

  function choose(file) {
    if (!file) return;
    if (src) URL.revokeObjectURL(src);
    setSrc(URL.createObjectURL(file));
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setReady(false);
  }

  async function submit(e) {
    if (ready) return;
    e.preventDefault();
    const img = imageRef.current;
    const frame = previewRef.current;
    if (!img || !frame || !fileRef.current?.files?.[0]) return;
    const rect = frame.getBoundingClientRect();
    const outW = aspect === 1 ? 512 : 1200;
    const outH = Math.round(outW / aspect);
    const scale = Math.max(outW / img.naturalWidth, outH / img.naturalHeight) * zoom;
    const cropW = outW / scale;
    const cropH = outH / scale;
    const sx = (img.naturalWidth - cropW) / 2 - offset.x * (outW / rect.width) / scale;
    const sy = (img.naturalHeight - cropH) / 2 - offset.y * (outW / rect.width) / scale;
    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, Math.max(0, Math.min(img.naturalWidth - cropW, sx)), Math.max(0, Math.min(img.naturalHeight - cropH, sy)), cropW, cropH, 0, 0, outW, outH);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.88));
    if (!blob) return;
    const cropped = new File([blob], aspect === 1 ? 'avatar.jpg' : 'banner.jpg', { type: 'image/jpeg' });
    const transfer = new DataTransfer();
    transfer.items.add(cropped);
    fileRef.current.files = transfer.files;
    setReady(true);
    requestAnimationFrame(() => formRef.current?.requestSubmit());
  }

  return (
    <form ref={formRef} action={formAction} onSubmit={submit} className="flex flex-col gap-3">
      <input ref={fileRef} name="file" type="file" accept={accept} required onChange={(e) => choose(e.target.files?.[0])} className="text-sm text-muted file:mr-3 file:rounded file:border file:border-line file:bg-bg file:px-3 file:py-1.5 file:text-sm file:text-fg" />
      {(src || currentSrc) && (
        <div className="flex flex-col gap-3">
          <div ref={previewRef} onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setDrag({ x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }); }} onPointerMove={(e) => { if (drag) setOffset({ x: drag.ox + e.clientX - drag.x, y: drag.oy + e.clientY - drag.y }); }} onPointerUp={() => setDrag(null)} onPointerCancel={() => setDrag(null)} className="relative w-full max-w-[520px] overflow-hidden rounded border border-line bg-black touch-none cursor-grab" style={{ aspectRatio: String(aspect) }}>
            <img ref={imageRef} src={src || currentSrc} alt="crop preview" draggable="false" onLoad={() => setOffset({ x: 0, y: 0 })} className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover" style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }} />
            <div className="pointer-events-none absolute inset-0 border border-white/20" />
          </div>
          {src && <label className="flex max-w-[520px] items-center gap-3 text-xs text-muted">zoom <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-[#6366f1]" /></label>}
          <p className="text-xs text-muted">drag to position · use the slider to zoom · the preview shows what will be saved</p>
        </div>
      )}
      {state?.error && <p role="alert" className="text-[13px] text-red-400">{state.error}</p>}
      {state?.message && <p role="status" className="text-[13px] text-emerald-400">{state.message}</p>}
      <div className="flex justify-end"><Submit label={label} /></div>
    </form>
  );
}
