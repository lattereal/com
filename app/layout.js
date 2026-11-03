import './globals.css';
import { Inter } from 'next/font/google';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { getUser } from '@/lib/auth';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata = {
  title: { default: 'ComForums', template: '%s · ComForums' },
  description: 'A private discussion board.',
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }) {
  const user = await getUser();
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-screen flex-col bg-bg font-sans text-fg">
        {user?.is_banned ? (
          <main className="grid flex-1 place-items-center text-muted">Your account has been suspended.</main>
        ) : (
          <>
            <Nav user={user} />
            <main className="mx-auto w-full max-w-[960px] flex-1 px-5 py-10">{children}</main>
            <Footer />
          </>
        )}
      </body>
    </html>
  );
}
