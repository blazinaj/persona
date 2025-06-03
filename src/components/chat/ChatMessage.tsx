import React, { useState } from 'react';
import { Loader2, Copy, Check, Download, Volume2, VolumeX, Book, CheckCircle, Circle, ArrowRight, Table, FileText } from 'lucide-react';
import { Markdown } from '../ui/Markdown';
import { Avatar } from '../ui/Avatar';
import { getAvatarUrl } from '../../utils/avatarHelpers';
import { Persona } from '../../types';
import { supabase } from '../../lib/supabase';
import { isLikelyCSV, parseCSV, csvToHtmlTable } from '../../utils/csvHelpers';
import SpreadsheetDisplay from '../ui/SpreadsheetDisplay';
import { extractPDFDataUrl, isDocumentLike, generatePDFReport } from '../../utils/pdfHelpers';
import PdfViewer from '../ui/PdfViewer';

interface InteractiveElement {
  type: 'keyword' | 'checklist' | 'button';
  text: string;
  value: string;
}

interface ChatMessageProps {
  message: any;
  persona: Persona;
  isSpeaking: boolean;
  copiedMessageId: string | null;
  setCopiedMessageId: (id: string | null) => void;
  speakText: (text: string) => Promise<void>;
  stopSpeaking: () => void;
  setError: (error: string | null) => void;
  onSendMessage?: (message: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  persona,
  isSpeaking,
  copiedMessageId,
  setCopiedMessageId,
  speakText,
  stopSpeaking,
  setError,
  onSendMessage
}) => {
  const [relatedKnowledge, setRelatedKnowledge] = useState<any[]>([]);
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [hasReferences, setHasReferences] = useState(false);
  const [interactiveElements, setInteractiveElements] = useState<InteractiveElement[]>([]);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [showSpreadsheet, setShowSpreadsheet] = useState(false);
  const [csvData, setCsvData] = useState<string | null>(null);
  const [showPdf, setShowPdf] = useState(false);
  const [pdfData, setPdfData] = useState<string | null>(null);

  // Check if message is encrypted but couldn't be decrypted
  const isEncryptedMessage = message.isEncrypted === true;

  React.useEffect(() => {
    if (message.role === 'assistant' && !message.isLoading && !isEncryptedMessage) {
      checkForReferences(message.content);
      extractInteractiveElements(message.content);
      checkForCsvData(message.content);
      checkForPdfData(message.content);
    }
  }, [message, isEncryptedMessage]);

  // Check if the message contains CSV data
  const checkForCsvData = (content: string) => {
    // Extract CSV data from triple backtick blocks
    const csvRegex = /```(?:csv)?\s*\n([\s\S]*?)\n```/g;
    let match;
    
    while ((match = csvRegex.exec(content)) !== null) {
      const potentialCsv = match[1].trim();
      
      if (isLikelyCSV(potentialCsv)) {
        setCsvData(potentialCsv);
        return;
      }
    }
    
    // If no CSV block found, check if the whole content might be CSV
    // Only do this if the content has multiple lines and commas
    if (content.includes('\n') && content.includes(',') && isLikelyCSV(content)) {
      setCsvData(content);
    }
  };

  // Check if the message contains PDF data
  const checkForPdfData = (content: string) => {
    // First check for PDF data URL
    const pdfDataUrl = extractPDFDataUrl(content);
    if (pdfDataUrl) {
      setPdfData(pdfDataUrl);
      setShowPdf(true); // Auto-show PDFs when detected
      return;
    }

    // Check if the message contains a link to a PDF file
    const pdfLinkRegex = /(https?:\/\/[^\s]+\.pdf)/gi;
    const pdfLinkMatch = content.match(pdfLinkRegex);
    if (pdfLinkMatch && pdfLinkMatch[0]) {
      setPdfData(pdfLinkMatch[0]);
      setShowPdf(true); // Auto-show PDF links when detected
      return;
    }

    // Check for PDF URL pattern with "I've created a PDF" context
    if (content.includes("I've created a PDF") || 
        content.includes("I've generated a PDF") || 
        content.includes("created a PDF document")) {
      
      // Look for URLs in the content
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urlMatch = content.match(urlRegex);
      if (urlMatch && urlMatch[0]) {
        // Get the first URL
        setPdfData(urlMatch[0]);
        setShowPdf(true);
        return;
      }
    }

    // Check if the content looks like it should be a document/report
    if (isDocumentLike(content)) {
      // This is a flag for possible PDF content, but we won't auto-generate
      // until the user requests it explicitly
      setPdfData(null);
    }
  };

  // Check if the message content contains references
  const checkForReferences = (content: string) => {
    // Look for patterns that indicate references in the message
    const referencePatterns = [
      /\[(\d+)\]:/i,                  // [1]: Reference format
      /reference[s]?:/i,              // "References:" section
      /source[s]?:/i,                 // "Sources:" section
      /citation[s]?:/i,               // "Citations:" section
      /according to ([^,.]+)/i,       // "According to X"
      /based on ([^,.]+)/i,           // "Based on X"
      /as stated in ([^,.]+)/i,       // "As stated in X"
      /as mentioned in ([^,.]+)/i,    // "As mentioned in X"
      /from ([^,.]+) we know that/i   // "From X we know that"
    ];
    
    // Check if any reference pattern is found in the content
    const hasRefs = referencePatterns.some(pattern => pattern.test(content));
    setHasReferences(hasRefs);
    
    // If references are found, extract them
    if (hasRefs) {
      extractReferences(content);
    }
  };
  
  // Extract references from content
  const extractReferences = (content: string) => {
    // Simple extraction of references
    const references: any[] = [];
    
    // Look for a references section
    const referencesSection = content.match(/(?:references|sources|citations):([\s\S]+?)(?:\n\n|$)/i);
    
    if (referencesSection && referencesSection[1]) {
      // Split the references section by new lines and clean up
      const refLines = referencesSection[1].split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      // Add each reference to our list
      refLines.forEach((line, index) => {
        references.push({
          id: `ref-${index}`,
          title: `Reference ${index + 1}`,
          description: line,
          category: 'reference'
        });
      });
    }
    
    // Look for numbered references like [1]: Source
    const numberedRefs = content.matchAll(/\[(\d+)\]:\s*(.+?)(?:\n|$)/g);
    for (const match of numberedRefs) {
      references.push({
        id: `num-${match[1]}`,
        title: `Reference ${match[1]}`,
        description: match[2].trim(),
        category: 'reference'
      });
    }
    
    // Set the extracted references
    setRelatedKnowledge(references);
  };
  
  // Extract interactive elements from message content
  const extractInteractiveElements = (content: string) => {
    const elements: InteractiveElement[] = [];
    
    // Extract checklist items - format: - [ ] Item text
    const checklistRegex = /- \[([ x])\] (.+?)(?=\n|$)/g;
    let checklistMatch;
    while ((checklistMatch = checklistRegex.exec(content)) !== null) {
      elements.push({
        type: 'checklist',
        text: checklistMatch[2],
        value: `I've completed: ${checklistMatch[2]}`
      });
    }
    
    // Extract keywords with dotted underlines - format: [keyword]{.interactive}
    const keywordRegex = /\[([^\]]+)\]\{\.interactive\}/g;
    let keywordMatch;
    while ((keywordMatch = keywordRegex.exec(content)) !== null) {
      elements.push({
        type: 'keyword',
        text: keywordMatch[1],
        value: `Tell me more about ${keywordMatch[1]}`
      });
    }
    
    // Extract button links - format: [Button Text](send:message to send)
    const buttonRegex = /\[([^\]]+)\]\(send:([^)]+)\)/g;
    let buttonMatch;
    while ((buttonMatch = buttonRegex.exec(content)) !== null) {
      elements.push({
        type: 'button',
        text: buttonMatch[1],
        value: buttonMatch[2]
      });
    }
    
    setInteractiveElements(elements);
  };
  
  // Process content to replace interactive elements with their HTML equivalents
  const processContent = (content: string): string => {
    let processedContent = content;
    
    // Replace checklist items
    processedContent = processedContent.replace(
      /- \[([ x])\] (.+?)(?=\n|$)/g, 
      (match, checked, text) => {
        const isChecked = checked === 'x' || checkedItems.includes(text);
        return `- <span class="interactive-checklist ${isChecked ? 'checked' : ''}" data-text="${text}">
          <span class="checklist-icon">${isChecked ? '✓' : '○'}</span>
          <span class="checklist-text">${text}</span>
        </span>`;
      }
    );
    
    // Replace keywords with dotted underlines
    processedContent = processedContent.replace(
      /\[([^\]]+)\]\{\.interactive\}/g,
      '<span class="interactive-keyword">$1</span>'
    );
    
    // Replace button links
    processedContent = processedContent.replace(
      /\[([^\]]+)\]\(send:([^)]+)\)/g,
      '<span class="interactive-button">$1</span>'
    );
    
    return processedContent;
  };
  
  const handleChecklistClick = (text: string) => {
    if (checkedItems.includes(text)) {
      return; // Already checked
    }
    
    setCheckedItems(prev => [...prev, text]);
    
    if (onSendMessage) {
      onSendMessage(`I've completed: ${text}`);
    }
  };
  
  const handleKeywordClick = (text: string) => {
    if (onSendMessage) {
      onSendMessage(`Tell me more about ${text}`);
    }
  };
  
  const handleButtonClick = (value: string) => {
    if (onSendMessage) {
      onSendMessage(value);
    }
  };

  const handleCopyMessage = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      // Stop any ongoing speech when copying
      if (isSpeaking) {
        stopSpeaking();
      }
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const handleDownloadImage = async (imageUrl: string) => {
    try {
      if (!imageUrl || !imageUrl.startsWith('http')) {
        throw new Error('Invalid image URL');
      }

      let response = await fetch(imageUrl, {
        mode: 'cors',
        headers: {
          Accept: 'image/*',
        },
      });

      if (!response.ok && response.type === 'opaque') {
        response = await fetch(imageUrl, {
          mode: 'no-cors',
          headers: {
            Accept: 'image/*',
          },
        });
      }

      if (!response.ok && response.status !== 0) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.startsWith('image/')) {
        throw new Error('Invalid content type: Expected an image');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const extension = contentType ? contentType.split('/')[1] : 'png';
      link.download = `generated-image-${Date.now()}.${extension}`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Image download error:', err);
      let errorMessage = 'Failed to download image';

      if (err.message.includes('Invalid image URL')) {
        errorMessage = 'Invalid image URL provided';
      } else if (err.message.includes('HTTP error')) {
        errorMessage = `Failed to fetch image: ${err.message}`;
      } else if (err.message.includes('Invalid content type')) {
        errorMessage = 'Invalid file type: Expected an image';
      }

      setError(errorMessage);
    }
  };

  // Check if the message contains a memory creation
  const hasMemoryCreation = message.role === 'assistant' && 
    /\[MEMORY:\s*([^=]+)=([^,\]]+)(?:,\s*importance=([1-5]))?\]/g.test(message.content);

  // Clean message content of memory directives
  const cleanContent = message.role === 'assistant' ? 
    message.content.replace(/\[MEMORY:\s*([^=]+)=([^,\]]+)(?:,\s*importance=([1-5]))?\]/g, '') : 
    message.content;

  // Extract PDF links from content for better display
  const extractPdfLink = (content: string): string | null => {
    // Check for sentences like "I've created a PDF document for you" followed by a URL
    if (content.includes("created a PDF") || content.includes("generated a PDF")) {
      const urlMatch = content.match(/(https?:\/\/[^\s]+)/);
      return urlMatch ? urlMatch[0] : null;
    }
    return null;
  };

  // Auto-detect and display PDFs when the message contains a PDF link or data URL
  React.useEffect(() => {
    if (message.role === 'assistant' && !message.isLoading) {
      // Check for data URLs
      const dataUrl = extractPDFDataUrl(message.content);
      if (dataUrl) {
        setPdfData(dataUrl);
        setShowPdf(true);
        return;
      }
      
      // Check for PDF links in context
      const pdfLink = extractPdfLink(message.content);
      if (pdfLink) {
        setPdfData(pdfLink);
        setShowPdf(true);
        return;
      }
    }
  }, [message]);

  return (
    <div
      className={`flex ${
        message.role === 'user' ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`flex items-start space-x-2 max-w-[85%] sm:max-w-[80%] ${
          message.role === 'user'
            ? 'flex-row-reverse space-x-reverse'
            : 'flex-row'
        }`}
      >
        {message.role === 'assistant' && (
          <Avatar
            src={getAvatarUrl(persona)}
            name={persona.name}
            className="w-7 h-7 sm:w-8 sm:h-8 mt-1"
          />
        )}
        <div
          className={`rounded-lg p-3 ${
            message.role === 'user'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100'
          }`}
        >
          {message.isLoading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Thinking...</span>
            </div>
          ) : isEncryptedMessage ? (
            <div className="italic text-gray-500">
              [Encrypted message - enter your key to view]
            </div>
          ) : (
            <div className="space-y-2">
              <Markdown content={cleanContent} />
              
              {/* Display CSV data as spreadsheet if detected */}
              {message.role === 'assistant' && csvData && showSpreadsheet && (
                <div className="mt-4">
                  <SpreadsheetDisplay 
                    data={csvData}
                    title="Generated Data"
                    hasHeaders={true}
                    maxHeight="300px"
                    onClose={() => setShowSpreadsheet(false)}
                  />
                </div>
              )}

              {/* Display PDF if detected */}
              {message.role === 'assistant' && pdfData && showPdf && (
                <div className="mt-4">
                  <PdfViewer
                    data={pdfData}
                    title="Generated Document"
                    onClose={() => setShowPdf(false)}
                  />
                </div>
              )}
              
              {/* Interactive elements */}
              {message.role === 'assistant' && interactiveElements.length > 0 && (
                <div className="mt-4 space-y-2">
                  {interactiveElements.filter(el => el.type === 'checklist').length > 0 && (
                    <div className="space-y-1.5">
                      {interactiveElements
                        .filter(el => el.type === 'checklist')
                        .map((item, index) => (
                          <div 
                            key={`checklist-${index}`}
                            className={`flex items-center gap-2 p-1.5 rounded-md cursor-pointer hover:bg-gray-100 transition-colors ${
                              checkedItems.includes(item.text) ? 'text-green-600' : 'text-gray-700'
                            }`}
                            onClick={() => handleChecklistClick(item.text)}
                          >
                            {checkedItems.includes(item.text) ? (
                              <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
                            ) : (
                              <Circle size={16} className="text-gray-400 flex-shrink-0" />
                            )}
                            <span className={checkedItems.includes(item.text) ? 'line-through' : ''}>
                              {item.text}
                            </span>
                          </div>
                        ))
                      }
                    </div>
                  )}
                  
                  {interactiveElements.filter(el => el.type === 'keyword').length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {interactiveElements
                        .filter(el => el.type === 'keyword')
                        .map((item, index) => (
                          <span
                            key={`keyword-${index}`}
                            className="inline-block border-b border-dotted border-blue-500 text-blue-600 cursor-pointer hover:bg-blue-50 px-1 py-0.5 rounded"
                            onClick={() => handleKeywordClick(item.text)}
                          >
                            {item.text}
                          </span>
                        ))
                      }
                    </div>
                  )}
                  
                  {interactiveElements.filter(el => el.type === 'button').length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {interactiveElements
                        .filter(el => el.type === 'button')
                        .map((item, index) => (
                          <button
                            key={`button-${index}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-sm font-medium transition-colors"
                            onClick={() => handleButtonClick(item.value)}
                          >
                            {item.text}
                            <ArrowRight size={14} />
                          </button>
                        ))
                      }
                    </div>
                  )}
                </div>
              )}
              
              {message.role === 'assistant' && (relatedKnowledge.length > 0 || hasReferences) && (
                <div className="mt-3 pt-2 border-t border-gray-200">
                  <button
                    onClick={() => setShowKnowledge(!showKnowledge)}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Book size={12} />
                    <span>{showKnowledge ? 'Hide knowledge sources' : 'Show knowledge sources'}</span>
                  </button>
                  
                  {showKnowledge && (
                    <div className="mt-2 space-y-2">
                      {relatedKnowledge.map(entry => (
                        <div key={entry.id} className="text-xs bg-blue-50 p-2 rounded">
                          <div className="font-medium">{entry.title}</div>
                          <div className="text-gray-600 mt-1">{entry.description}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <div
                className={`flex items-center space-x-2 mt-2 text-xs justify-end ${
                  message.role === 'user'
                    ? 'justify-start text-blue-200'
                    : 'justify-end text-gray-400'
                }`}
              >
                {message.role === 'assistant' && (
                 <>
                   <button
                     onClick={() => {
                       const textContent = cleanContent.replace(/!\[.*?\]\(.*?\)/g, '').trim();
                       if (isSpeaking && copiedMessageId === message.id) {
                         stopSpeaking();
                       } else {
                         setCopiedMessageId(message.id);
                         speakText(textContent);
                       }
                     }}
                     className="hover:text-gray-600 transition-colors"
                     title="Listen to message"
                   >
                     {isSpeaking && copiedMessageId === message.id ? (
                       <VolumeX size={14} />
                     ) : (
                       <Volume2 size={14} />
                     )}
                   </button>
                   <button
                     onClick={() =>
                       handleCopyMessage(cleanContent, message.id)
                     }
                     className="hover:text-gray-600 transition-colors"
                     title="Copy message"
                   >
                     {copiedMessageId === message.id && !isSpeaking ? (
                       <Check size={14} />
                     ) : (
                       <Copy size={14} />
                     )}
                   </button>
                   {csvData && (
                     <button
                       onClick={() => setShowSpreadsheet(!showSpreadsheet)}
                       className="hover:text-gray-600 transition-colors"
                       title={showSpreadsheet ? "Hide spreadsheet" : "Show spreadsheet"}
                     >
                       <Table size={14} />
                     </button>
                   )}
                   {/* PDF button */}
                   {(pdfData || isDocumentLike(message.content)) && (
                     <button
                       onClick={() => {
                         if (pdfData) {
                           setShowPdf(!showPdf);
                         } else if (isDocumentLike(message.content)) {
                           // Auto-generate PDF from document-like content
                           const sections = extractDocumentSections(message.content);
                           
                           // Generate PDF
                           const pdfDataUrl = generatePDFReport(
                             'Generated Report',
                             sections,
                             { date: new Date().toLocaleDateString() }
                           );
                           setPdfData(pdfDataUrl);
                           setShowPdf(true);
                         }
                       }}
                       className="hover:text-gray-600 transition-colors"
                       title={showPdf ? "Hide PDF" : "Show as PDF"}
                     >
                       <FileText size={14} />
                     </button>
                   )}
                 </>
                )}

                {message.content.includes('![') && (
                  <button
                    onClick={() => {
                      const imageUrl = message.content.match(
                        /!\[.*?\]\((.*?)\)/
                      )?.[1];
                      if (imageUrl) {
                        handleDownloadImage(imageUrl);
                      }
                    }}
                    className="hover:text-gray-600 transition-colors"
                    title="Download image"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage