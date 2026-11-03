import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { register } from '@/app/actions';
import ActionForm from '@/components/ActionForm';

export const metadata = { title: 'Create account' };

export default async function Page() {
  if (await getUser()) redirect('/');
  return (
    <div className="mx-auto mt-8 w-full max-w-[380px] rounded border border-line bg-surface p-8">
      <h1 className="mb-6 text-xl font-medium">Create account</h1>
      <ActionForm action={register} label="Create account" buttonClass="btn-primary h-10 w-full" wrapClass="flex flex-col gap-3" footClass="mt-2">
        <div>
          <input name="username" required minLength={3} maxLength={20} pattern="[a-z0-9_]{3,20}" autoComplete="username" placeholder="Username" aria-label="Username" className="input" />
          <p className="mt-1.5 text-xs text-muted">3–20 chars, lowercase, numbers and underscores only</p>
        </div>
        <input name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="Password (8+ characters)" aria-label="Password" className="input" />
        <p className="text-xs text-muted">There is no email, so there is no self-serve password reset. One account per network.</p>
      </ActionForm>
      <p className="mt-5 text-[13px] text-muted">Have an account? <Link href="/login" className="hover:text-fg hover:underline">Sign in</Link></p>
    </div>
  );
}
