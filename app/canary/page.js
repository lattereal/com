export const metadata = { title: 'Transparency status' };

export default function Canary() {
  return (
    <article className="prose-page">
      <p className="mb-2 text-xs uppercase tracking-widest text-muted">transparency</p>
      <h1>Transparency status</h1>
      <p>This page is reserved for signed transparency statements from the service operator.</p>
      <section className="my-6 border-y border-line py-4">
        <p className="text-xs uppercase tracking-widest text-muted">current publication status</p>
        <p className="mt-2 font-medium">No verified, PGP-signed warrant canary is currently published.</p>
        <p className="mt-2 text-sm text-muted">Do not interpret the presence, absence, or age of this page as a statement about whether the service has received a request, order, demand, or other communication.</p>
      </section>
      <h2>PGP verification</h2>
      <p>A future statement will be verifiable only after the operator publishes an independently verified public key and its fingerprint, and signs each statement with the matching private key. The private key must be kept offline and must never be placed in this repository, Vercel environment variables, or the website database.</p>
      <h2>What a canary can and cannot do</h2>
      <p>A signed statement can help readers verify that a message was signed by the holder of a particular key and has not been altered. It does not prove that the statement is true, prevent legal process, guarantee anonymity, or protect the operator from lawsuits. The operator must not publish claims about legal requests unless those claims have been checked and approved by counsel.</p>
      <p className="mt-8 border-t border-line pt-4 text-xs text-muted">No sample signature or third-party public key is used here. A real canary must be written, checked, signed, and periodically renewed by the operator using their own key.</p>
    </article>
  );
}
