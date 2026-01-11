import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks.
 * Only allows safe HTML tags and attributes for rich text content.
 */
export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
      'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'code', 'pre', 'span', 'div'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    // Force all links to have safe attributes
    ADD_ATTR: ['target'],
    FORCE_BODY: true,
  });
};
