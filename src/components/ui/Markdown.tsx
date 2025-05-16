import React from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { Image } from 'lucide-react';

interface MarkdownProps {
  content: string;
  className?: string;
}

// Create a custom renderer by extending the base Renderer class
class CustomRenderer extends marked.Renderer {
  // Ensure text method is implemented
  override text(text: string) {
    return text;
  }

  // Override image rendering
  override image(href: string, title: string | null, text: string) {
    if (!href) return text;
    return `
      <div class="my-4">
        <img 
          src="${href}" 
          alt="${text}" 
          title="${title || text}"
          class="rounded-lg shadow-lg max-w-full h-auto"
          loading="lazy"
        />
        ${title ? `<p class="mt-2 text-sm text-gray-500 italic">${title}</p>` : ''}
      </div>
    `;
  }
}

export const Markdown: React.FC<MarkdownProps> = ({ content, className = '' }) => {
  // Configure marked options with the custom renderer
  marked.setOptions({
    gfm: true, // GitHub Flavored Markdown
    breaks: true, // Convert \n to <br>
    headerIds: false, // Disable header IDs to prevent XSS
    mangle: false, // Disable mangling to prevent XSS
    renderer: new CustomRenderer()
  });

  // Parse markdown and sanitize HTML
  const html = DOMPurify.sanitize(marked(content), {
    ALLOWED_TAGS: [
      'p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'code', 'blockquote', 'img', 'div',
      'del', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'src', 'alt', 'title', 'loading']
  });

  return (
    <div 
      className={`prose prose-sm max-w-none prose-pre:bg-gray-800 prose-pre:text-gray-100 prose-code:text-gray-800 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-img:rounded-lg prose-img:shadow-lg ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};