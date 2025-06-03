import React from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { Image } from 'lucide-react';
import { isLikelyCSV, csvToHtmlTable } from '../../utils/csvHelpers';

// Configure DOMPurify to allow custom data attributes
if (typeof window !== 'undefined') {
  DOMPurify.addHook('afterSanitizeAttributes', function(node) {
    // Allow data-text attribute for interactive elements
    if (node.hasAttribute('data-text')) {
      // Do nothing, just keep the attribute
    }
    
    // Add click handlers for interactive elements
    if (node.classList && 
        (node.classList.contains('interactive-keyword') || 
         node.classList.contains('interactive-checklist') ||
         node.classList.contains('interactive-button'))) {
      node.setAttribute('role', 'button');
      node.setAttribute('tabindex', '0');
    }
  });
}

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
  
  // Override code block rendering to detect CSV data
  override code(code: string, language?: string) {
    if ((language === 'csv' || !language) && isLikelyCSV(code)) {
      // If it's a CSV, convert to an HTML table
      return `<div class="my-4 csv-data">${csvToHtmlTable(code)}</div>`;
    }
    
    // Regular code block rendering
    return `<pre><code class="language-${language || ''}">${code}</code></pre>`;
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
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'code', 'blockquote', 'img', 'div', 'span',
      'del', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'span'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'src', 'alt', 'title', 'loading', 'data-text', 'role', 'tabindex', 'border', 'cellpadding', 'cellspacing', 'style']
  });

  return (
    <div 
      className={`prose prose-sm max-w-none prose-pre:bg-gray-800 prose-pre:text-gray-100 prose-code:text-gray-800 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-img:rounded-lg prose-img:shadow-lg ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};