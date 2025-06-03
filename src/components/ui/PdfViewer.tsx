import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import { Download, Copy, Check, FileText, ChevronLeft, ChevronRight, X, Maximize2, Minimize2, AlertCircle } from 'lucide-react';
import Button from './Button';

// Set up the worker for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PdfViewerProps {
  data: string; // Base64 PDF data URL or URL to a PDF file
  title?: string;
  className?: string;
  onClose?: () => void;
}

const PdfViewer: React.FC<PdfViewerProps> = ({
  data,
  title = 'PDF Document',
  className = '',
  onClose
}) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [pdfError, setPdfError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setLoading(false);
    setPdfError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    setPdfError(error);
    setLoading(false);
    
    // Try to handle the error better if we have a URL that's not a data URL
    if (data && !data.startsWith('data:') && data.match(/^https?:\/\//)) {
      console.log('Attempting to fetch PDF from URL instead of direct rendering');
      // We'll handle external URLs differently
    }
  };

  const handleDownload = () => {
    // For data URLs, we can download directly
    if (data.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = data;
      link.download = `${title.toLowerCase().replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
    
    // For external URLs, we open in a new tab or window
    if (data.match(/^https?:\/\//)) {
      window.open(data, '_blank');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(data);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const changePage = (offset: number) => {
    if (!numPages) return;
    const newPage = pageNumber + offset;
    if (newPage >= 1 && newPage <= numPages) {
      setPageNumber(newPage);
    }
  };

  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
  };

  return (
    <div className={`bg-white rounded-lg shadow ${fullscreen ? 'fixed inset-0 z-50 flex flex-col' : 'border border-gray-200'} ${className}`}>
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
        <h3 className="font-medium text-gray-700 flex items-center gap-2">
          <FileText size={16} />
          <span>{title}</span>
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={copied ? <Check size={14} /> : <Copy size={14} />}
            onClick={handleCopy}
            title="Copy PDF data URL"
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download size={14} />}
            onClick={handleDownload}
            title="Download PDF"
          >
            Download
          </Button>
          <button
            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
            onClick={toggleFullscreen}
            title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          {onClose && (
            <button
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
              onClick={onClose}
              title="Close"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className={`flex flex-col items-center overflow-auto ${fullscreen ? 'flex-1' : 'max-h-[500px]'}`}>
        {loading && !pdfError && (
          <div className="p-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading PDF document...</p>
          </div>
        )}
        
        {pdfError ? (
          <div className="p-8 text-center">
            <div className="text-red-500 mb-4">
              <AlertCircle size={48} className="mx-auto" />
            </div>
            <h3 className="font-medium text-lg text-red-700 mb-2">Error Loading PDF</h3>
            <p className="text-gray-600">{pdfError.message || 'Could not load the PDF document'}</p>
            
            {/* Show alternative options */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Try these options:</h4>
              <Button 
                variant="outline" 
                size="sm"
                className="mb-2 w-full"
                onClick={handleDownload}
              >
                Download and Open Externally
              </Button>
            </div>
          </div>
        ) : (
          <Document
            file={data}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
            }
            className="w-full"
            error={
              <div className="p-4 text-center text-red-500">
                <AlertCircle size={24} className="mx-auto mb-2" />
                <p>Failed to load PDF</p>
              </div>
            }
          >
            <Page 
              pageNumber={pageNumber} 
              renderTextLayer={true}
              renderAnnotationLayer={true}
              scale={fullscreen ? 1.5 : 1}
              className="flex justify-center p-4"
              error={
                <div className="p-4 text-center text-red-500">
                  <AlertCircle size={16} className="mx-auto mb-2" />
                  <p>Error rendering page {pageNumber}</p>
                </div>
              }
            />
          </Document>
        )}
      </div>

      {numPages && numPages > 1 && !pdfError && (
        <div className="flex items-center justify-center gap-4 p-2 border-t border-gray-200">
          <button
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm">
            Page {pageNumber} of {numPages}
          </span>
          <button
            onClick={() => changePage(1)}
            disabled={pageNumber >= (numPages || 1)}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next page"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default PdfViewer;