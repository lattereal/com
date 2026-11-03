import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { login } from '@/app/actions';
import ActionForm from '@/components/ActionForm';

export const metadata = { title: 'Sign in' };

export default async function Page() {
  if (await getUser()) redirect('/');
  return (
    <div className="mx-auto mt-8 w-full max-w-[380px] rounded border border-line bg-surface p-8">
      <h1 className="mb-6 text-xl font-medium">Sign in</h1>
      <ActionForm action={login} label="Sign in" buttonClass="btn-primary h-10 w-full" wrapClass="flex flex-col gap-3" footClass="mt-2">
        <input name="username" required autoComplete="username" placeholder="Username" aria-label="Username" className="input" />
        <input name="password" type="password" required autoComplete="current-password" placeholder="Password" aria-label="Password" className="input" />
      </ActionForm>
      <p className="mt-5 text-[13px] text-muted">No account? <Link href="/register" className="hover:text-fg hover:underline">Register</Link></p>
    </div>
  );
}
