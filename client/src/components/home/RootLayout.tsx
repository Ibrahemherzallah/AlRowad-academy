import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Navbar } from '../layout/Navbar';
import { Footer } from '../layout/Footer';
import { PageTransition } from '../layout/PageTransition';
import { WhatsAppFloat } from './WhatsAppFloat.tsx';

/** Public site shell: navbar + animated content + footer. */
export function RootLayout() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}
