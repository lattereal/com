import './globals.css';
import { Inter } from 'next/font/google';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { getUser } from '@/lib/auth';
import { sql } from '@/lib/db';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata = {
  title: { default: 'comforums.com', template: '%s · comforums.com' },
  applicationName: 'comforums.com',
  description: 'A private discussion board.',
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }) {
  const user = await getUser();
  const [announcement] = await sql`select message from site_announcement where id = 1 and enabled = true`.catch(() => []);
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-screen flex-col bg-bg font-sans text-fg">
        {user?.is_banned ? (
          <main className="grid flex-1 place-items-center text-muted">Your account has been suspended.</main>
        ) : (
          <>
            <Nav user={user} />
            {announcement?.message && <div role="status" className="border-b border-line bg-[#19191b] px-4 py-2 text-center text-[13px] text-fg">{announcement.message}</div>}
            <main className="mx-auto w-full max-w-[960px] flex-1 px-5 py-10">{children}</main>
            <Footer />
          </>
        )}
      </body>
    </html>
  );
}
