import Link from 'next/link';
export default function NotFound() {
  return (
    <div>
      <h1 className="text-2xl font-medium">Page not found</h1>
      <p className="mt-2 text-muted">It may have been removed or the link is wrong.</p>
      <Link href="/" className="link mt-4 inline-block">Back to boards</Link>
    </div>
  );
}
