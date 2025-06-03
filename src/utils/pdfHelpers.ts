/**
 * Utility functions for working with PDF data
 */
import { jsPDF } from 'jspdf';
import { PDFDocument } from '../types';

/**
 * Sanitizes text for PDF generation to prevent invalid PDF structure errors
 * @param text Text to sanitize for PDF generation
 * @returns Cleaned text safe for PDF generation
 */
export function cleanTextForPdf(text: string): string {
  if (!text) return '';
  
  // Replace problematic characters that could break PDF structure
  return text
    // Remove control characters
    .replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Replace non-printable characters and certain symbols that can cause issues
    .replace(/[\u2028\u2029\uFEFF\uFFFD]/g, ' ')
    // Replace any character outside the standard printable ASCII and common Latin-1 range
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '?')
    // Escape backslashes and certain special characters
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[\r\n]+/g, '\n')
    // Truncate extremely long strings to prevent buffer issues
    .substring(0, 50000);
}

/**
 * Check if a string contains a request for PDF generation
 * @param text Text to check for PDF request
 * @returns Boolean indicating if text contains PDF request
 */
export function isPDFRequest(text: string): boolean {
  const pdfKeywords = [
    'generate pdf',
    'create pdf',
    'make pdf',
    'generate a pdf',
    'create a pdf',
    'make a pdf',
    'export to pdf',
    'save as pdf',
    'download pdf',
    'pdf report',
    'pdf document',
    'create report',
    'generate report',
    'pdf version',
    'pdf format',
    'export as pdf',
    'compile pdf',
    'convert to pdf',
    'give me a pdf',
    'provide a pdf',
    'as a pdf document',
    'in pdf form',
    'document format',
    'formal report',
    'written report',
    'comprehensive report',
    'detailed document',
    'official document'
  ];
  
  const lowerText = text.toLowerCase();
  return pdfKeywords.some(keyword => lowerText.includes(keyword));
}

/**
 * Check if a message content contains a PDF data URL
 * @param content Message content to check for PDF data
 * @returns PDF data URL if found, null otherwise
 */
export function extractPDFDataUrl(content: string): string | null {
  // Match PDF data URLs - these would be embedded by the backend
  const pdfDataUrlRegex = /data:application\/pdf;base64,[a-zA-Z0-9+/=]+/;
  const match = content.match(pdfDataUrlRegex);
  
  if (match && match[0]) {
    return match[0];
  }
  
  return null;
}

/**
 * Generate a simple PDF from text content
 * @param title PDF title
 * @param content Text content for the PDF
 * @returns Base64 data URL of the generated PDF
 */
export function generateSimplePDF(title: string, content: string): string {
  const doc = new jsPDF();
  
  // Add title - sanitize to prevent PDF structure issues
  doc.setFontSize(18);
  doc.text(cleanTextForPdf(title), 20, 20);
  
  // Add horizontal line
  doc.setLineWidth(0.5);
  doc.line(20, 25, 190, 25);
  
  // Add content - sanitize to prevent PDF structure issues
  doc.setFontSize(12);
  
  // Clean and split text into lines to fit page width
  const cleanedContent = cleanTextForPdf(content);
  const lines = doc.splitTextToSize(cleanedContent, 170);
  doc.text(lines, 20, 35);
  
  // Return as base64 data URL
  return doc.output('dataurlstring');
}

/**
 * Generate a styled PDF report
 * @param title Report title
 * @param sections Array of report sections, each with a title and content
 * @param metadata Optional metadata like author, date, etc.
 * @returns Base64 data URL of the generated PDF
 */
export function generatePDFReport(
  title: string, 
  sections: Array<{ title: string, content: string }>,
  metadata?: { 
    author?: string;
    date?: string;
    subject?: string;
    keywords?: string[];
  }
): string {
  const doc = new jsPDF();
  
  // Set document properties - sanitize text values
  if (metadata) {
    if (metadata.author) doc.setProperties({ author: cleanTextForPdf(metadata.author) });
    if (metadata.subject) doc.setProperties({ subject: cleanTextForPdf(metadata.subject) });
    if (metadata.keywords) doc.setProperties({ keywords: metadata.keywords.map(k => cleanTextForPdf(k)).join(', ') });
  }
  
  // Set date
  const date = metadata?.date ? cleanTextForPdf(metadata.date) : new Date().toLocaleDateString();
  
  // Add title - sanitize to prevent PDF structure issues
  doc.setFontSize(24);
  doc.setTextColor(0, 0, 140); // Dark blue
  doc.text(cleanTextForPdf(title), 105, 20, { align: 'center' });
  
  // Add date
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100); // Gray
  doc.text(date, 105, 30, { align: 'center' });
  
  // Add horizontal line
  doc.setDrawColor(0, 0, 140); // Dark blue
  doc.setLineWidth(0.5);
  doc.line(20, 35, 190, 35);
  
  let yPosition = 45;
  
  // Add each section
  sections.forEach((section, index) => {
    // Check if we need a new page
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 20;
    }
    
    // Add section title - sanitize to prevent PDF structure issues
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 140); // Dark blue
    doc.text(cleanTextForPdf(section.title), 20, yPosition);
    yPosition += 10;
    
    // Add section content - sanitize to prevent PDF structure issues
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0); // Black
    
    // Truncate and clean content to prevent PDF structure issues
    const cleanedContent = cleanTextForPdf(section.content);
    const truncatedContent = cleanedContent.length > 2000 
      ? cleanedContent.substring(0, 2000) + '...(content truncated)' 
      : cleanedContent;
    
    // Split text into lines to fit page width
    const lines = doc.splitTextToSize(truncatedContent, 170);
    
    // Check if we need to add a new page for long content
    if (yPosition + (lines.length * 7) > 280) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.text(lines, 20, yPosition);
    yPosition += (lines.length * 7) + 10;
  });
  
  // Add page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100); // Gray
    doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
  }
  
  // Return as base64 data URL
  return doc.output('dataurlstring');
}

/**
 * Generate a PDF from tabular data
 * @param title PDF title
 * @param headers Table headers
 * @param rows Table data rows
 * @returns Base64 data URL of the generated PDF
 */
export function generateTablePDF(
  title: string,
  headers: string[],
  rows: string[][]
): string {
  const doc = new jsPDF();
  
  // Add title - sanitize to prevent PDF structure issues
  doc.setFontSize(18);
  doc.text(cleanTextForPdf(title), 20, 20);
  
  // Add horizontal line
  doc.setLineWidth(0.5);
  doc.line(20, 25, 190, 25);
  
  // Define table settings
  const startY = 35;
  const cellWidth = 170 / headers.length;
  const cellHeight = 10;
  let yPosition = startY;
  
  // Add table headers with background
  doc.setFillColor(240, 240, 240); // Light gray
  doc.rect(20, yPosition, 170, cellHeight, 'F');
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  
  // Sanitize headers
  const cleanedHeaders = headers.map(header => cleanTextForPdf(header));
  
  cleanedHeaders.forEach((header, i) => {
    doc.text(header, 20 + (cellWidth * i) + 2, yPosition + 7);
  });
  yPosition += cellHeight;
  
  // Add table rows
  rows.forEach((row, rowIndex) => {
    // Check if we need a new page
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 20;
      
      // Add headers to new page
      doc.setFillColor(240, 240, 240);
      doc.rect(20, yPosition, 170, cellHeight, 'F');
      
      cleanedHeaders.forEach((header, i) => {
        doc.text(header, 20 + (cellWidth * i) + 2, yPosition + 7);
      });
      yPosition += cellHeight;
    }
    
    // Add row background (alternating colors)
    if (rowIndex % 2 === 1) {
      doc.setFillColor(250, 250, 250);
      doc.rect(20, yPosition, 170, cellHeight, 'F');
    }
    
    // Add row data - sanitize each cell
    row.forEach((cell, cellIndex) => {
      if (cellIndex < headers.length) {
        doc.text(cleanTextForPdf(String(cell)), 20 + (cellWidth * cellIndex) + 2, yPosition + 7);
      }
    });
    
    yPosition += cellHeight;
  });
  
  // Add border around the table
  doc.setLineWidth(0.1);
  doc.rect(20, startY, 170, yPosition - startY, 'S');
  
  // Add vertical lines
  for (let i = 1; i < headers.length; i++) {
    doc.line(20 + (cellWidth * i), startY, 20 + (cellWidth * i), yPosition);
  }
  
  // Add horizontal lines
  for (let i = startY; i <= yPosition; i += cellHeight) {
    doc.line(20, i, 190, i);
  }
  
  // Add page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
  }
  
  // Return as base64 data URL
  return doc.output('dataurlstring');
}

/**
 * Extract potential report/document sections from text
 * @param text Text to analyze for document sections
 * @returns Array of section objects with titles and content
 */
export function extractDocumentSections(text: string): Array<{ title: string, content: string }> {
  // Try to identify headings and their content
  const sections: Array<{ title: string, content: string }> = [];
  
  // Look for heading patterns like:
  // # Heading
  // ## Subheading
  // Heading:
  // HEADING
  // Heading
  // -------
  
  // First try to split by markdown headings
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  let hasHeadings = false;
  
  // Clone the text for regex operations to avoid mutating it
  let remainingText = text;
  
  // Find all headings first
  const headings: { level: number, title: string, index: number }[] = [];
  let match;
  while ((match = headingRegex.exec(remainingText)) !== null) {
    headings.push({
      level: match[1].length,
      title: match[2],
      index: match.index
    });
  }
  
  // Process headings to extract sections
  if (headings.length > 0) {
    hasHeadings = true;
    
    for (let i = 0; i < headings.length; i++) {
      const heading = headings[i];
      const nextHeading = headings[i + 1];
      
      const startIndex = heading.index + heading.title.length + heading.level + 1;
      const endIndex = nextHeading ? nextHeading.index : remainingText.length;
      
      const content = remainingText.substring(startIndex, endIndex).trim();
      sections.push({ title: heading.title, content });
    }
  }
  
  // If no markdown headings found, try to split by "Section:" style headings
  if (!hasHeadings) {
    const colonHeadingRegex = /^([A-Za-z0-9\s]+):\s*$/gm;
    const colonHeadings: { title: string, index: number }[] = [];
    
    while ((match = colonHeadingRegex.exec(text)) !== null) {
      colonHeadings.push({
        title: match[1].trim(),
        index: match.index
      });
    }
    
    if (colonHeadings.length > 0) {
      hasHeadings = true;
      
      for (let i = 0; i < colonHeadings.length; i++) {
        const heading = colonHeadings[i];
        const nextHeading = colonHeadings[i + 1];
        
        const startIndex = heading.index + heading.title.length + 1; // +1 for the colon
        const endIndex = nextHeading ? nextHeading.index : text.length;
        
        const content = text.substring(startIndex, endIndex).trim();
        sections.push({ title: heading.title, content });
      }
    }
  }
  
  // If no structured headings found, try to create logical sections
  if (!hasHeadings) {
    // Split by double newlines to identify paragraphs
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
    
    if (paragraphs.length === 0) {
      // If no paragraphs, use the whole text
      sections.push({ title: 'Document', content: text });
    } else if (paragraphs.length === 1) {
      // If only one paragraph, use the whole text
      sections.push({ title: 'Document', content: paragraphs[0] });
    } else {
      // Try to create sections from paragraphs
      let currentTitle = 'Introduction';
      let currentContent: string[] = [];
      
      paragraphs.forEach((paragraph, index) => {
        // Check if this paragraph looks like a heading (short, ends with colon, etc.)
        if (
          (paragraph.length < 50 && index > 0) || 
          paragraph.toUpperCase() === paragraph || 
          paragraph.endsWith(':')
        ) {
          // Save previous section if we have content
          if (currentContent.length > 0) {
            sections.push({ 
              title: currentTitle, 
              content: currentContent.join('\n\n') 
            });
          }
          
          // Start new section
          currentTitle = paragraph.replace(/:$/, '').trim();
          currentContent = [];
        } else {
          // Add to current section
          currentContent.push(paragraph);
        }
      });
      
      // Add the last section
      if (currentContent.length > 0) {
        sections.push({ 
          title: currentTitle, 
          content: currentContent.join('\n\n') 
        });
      }
    }
  }
  
  // If we still couldn't create sections, create a default one
  if (sections.length === 0) {
    sections.push({ title: 'Document', content: text });
  }
  
  return sections;
}

/**
 * Check if text content seems to be intended for a formal document/report
 * @param text Text content to analyze
 * @returns Boolean indicating if text appears to be a formal document
 */
export function isDocumentLike(text: string): boolean {
  // Signs that this might be a formal document
  const documentSignifiers = [
    /^(Executive Summary|Abstract|Introduction|Conclusion):/im,
    /^#{1,3}\s+(Executive Summary|Abstract|Introduction|Conclusion)/im,
    /Table of Contents/i,
    /(Report|Document) prepared by/i,
    /^(TITLE|AUTHOR|DATE):/im,
    /CONFIDENTIAL|DRAFT|FINAL/i,
    /^Page \d+ of \d+$/m,
  ];
  
  // Check for document signifiers
  for (const regex of documentSignifiers) {
    if (regex.test(text)) {
      return true;
    }
  }
  
  // Check for structured sections (e.g., 1. Section, 2. Section)
  if (/^\d+\.\s+[A-Z][a-z]/m.test(text)) {
    return true;
  }
  
  // Check if the text has multiple headings
  const headingCount = (text.match(/^#{1,3}\s+.+$/gm) || []).length;
  if (headingCount >= 2) {
    return true;
  }
  
  // Check if the text is long enough to be a document
  if (text.length > 1000 && text.split('\n').length > 15) {
    // If there are clear paragraph breaks and a longer text, likely a document
    return true;
  }
  
  return false;
}