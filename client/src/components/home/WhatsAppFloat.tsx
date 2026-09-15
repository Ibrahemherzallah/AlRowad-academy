import { motion } from 'framer-motion';

/** Inline WhatsApp glyph so we don't pull an icon pack for one mark. */
function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.04 4C9.9 4 4.9 9 4.9 15.14c0 2.03.55 3.98 1.6 5.71L4.5 27l6.32-1.96a11.1 11.1 0 0 0 5.22 1.32h.01c6.14 0 11.14-5 11.14-11.14C27.19 9 22.18 4 16.04 4Zm0 20.4h-.01a9.2 9.2 0 0 1-4.68-1.28l-.34-.2-3.75 1.16 1.19-3.65-.22-.37a9.18 9.18 0 0 1-1.41-4.9c0-5.09 4.14-9.23 9.23-9.23 2.46 0 4.78.96 6.52 2.71a9.16 9.16 0 0 1 2.7 6.52c0 5.09-4.14 9.24-9.23 9.24Zm5.06-6.92c-.28-.14-1.64-.81-1.9-.9-.25-.09-.44-.14-.62.14-.18.28-.71.9-.87 1.08-.16.18-.32.2-.6.07-.28-.14-1.17-.43-2.23-1.38-.82-.73-1.38-1.64-1.54-1.92-.16-.28-.02-.43.12-.57.13-.13.28-.32.42-.48.14-.16.18-.28.28-.46.09-.18.05-.35-.02-.49-.07-.14-.62-1.5-.85-2.05-.22-.54-.45-.47-.62-.48-.16-.01-.35-.01-.53-.01-.18 0-.49.07-.74.35-.25.28-.97.95-.97 2.3 0 1.36.99 2.67 1.13 2.85.14.18 1.95 2.98 4.73 4.18.66.29 1.18.46 1.58.58.66.21 1.27.18 1.75.11.53-.08 1.64-.67 1.87-1.32.23-.65.23-1.2.16-1.32-.07-.11-.25-.18-.53-.32Z" />
    </svg>
  );
}

interface Props {
  /** Phone in international format without +, e.g. 970590000000. */
  phone?: string;
  message?: string;
}

/** Fixed floating WhatsApp contact button, bottom-start corner (RTL-aware). */
export function WhatsAppFloat({ phone = '970590000000', message = '' }: Props) {
  const href = `https://wa.me/${phone}${message ? `?text=${encodeURIComponent(message)}` : ''}`;

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      className="fixed bottom-6 start-6 z-50 grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/40"
    >
      {/* Pulsing ring */}
      <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366]/40" />
      <WhatsAppGlyph className="relative size-7" />
    </motion.a>
  );
}
