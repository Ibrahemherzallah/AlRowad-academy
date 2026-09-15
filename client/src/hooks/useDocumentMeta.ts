import { useEffect } from 'react';

interface Meta {
  title?: string;
  description?: string;
  ogImage?: string;
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/**
 * Client-side document head management. For true SSR SEO the course landing
 * page would be pre-rendered (Next.js) — this keeps titles/OG correct for the
 * SPA and social crawlers that execute JS.
 */
export function useDocumentMeta({ title, description, ogImage }: Meta) {
  useEffect(() => {
    if (title) {
      document.title = `${title} | Rawad Academy`;
      setMeta('property', 'og:title', title);
    }
    if (description) {
      setMeta('name', 'description', description);
      setMeta('property', 'og:description', description);
    }
    if (ogImage) setMeta('property', 'og:image', ogImage);
  }, [title, description, ogImage]);
}
