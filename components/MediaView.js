// Renders a stored file by its type. `mime` comes from our own database, never from the browser.
export default function MediaView({ id, mime, className = '' }) {
  const src = `/m/${id}`;
  if (mime.startsWith('image/')) return <img src={src} alt="" className={`max-h-[70vh] max-w-full rounded border border-line ${className}`} />;
  if (mime.startsWith('video/')) return <video src={src} controls preload="metadata" className={`max-h-[70vh] max-w-full rounded border border-line ${className}`} />;
  return <audio src={src} controls preload="none" className={`w-full max-w-md ${className}`} />;
}
