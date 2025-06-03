import React, { useState } from 'react';
import { Download, Copy, Check, Table, List, Grid, X } from 'lucide-react';
import Button from './Button';
import { parseCSV, objectsToCSV } from '../../utils/csvHelpers';

interface SpreadsheetDisplayProps {
  data: string | Record<string, any>[];
  title?: string;
  hasHeaders?: boolean;
  className?: string;
  maxHeight?: string;
  onClose?: () => void;
}

const SpreadsheetDisplay: React.FC<SpreadsheetDisplayProps> = ({
  data,
  title = 'Spreadsheet',
  hasHeaders = true,
  className = '',
  maxHeight = '400px',
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'csv'>('table');
  
  // Convert data to array of objects if it's a string (CSV)
  const parsedData = typeof data === 'string' ? parseCSV(data, hasHeaders) : data;
  
  // Get all headers from all objects
  const headers = Array.from(
    new Set(
      parsedData.flatMap(obj => Object.keys(obj))
    )
  );

  // Generate CSV string
  const csvString = typeof data === 'string' ? data : objectsToCSV(parsedData, hasHeaders);

  const handleDownload = () => {
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(csvString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden bg-white ${className}`}>
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
        <h3 className="font-medium text-gray-700 flex items-center gap-2">
          <Table size={16} />
          <span>{title}</span>
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex border rounded overflow-hidden">
            <button
              className={`p-1.5 ${viewMode === 'table' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
              onClick={() => setViewMode('table')}
              title="Table view"
            >
              <Grid size={14} />
            </button>
            <button
              className={`p-1.5 ${viewMode === 'csv' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
              onClick={() => setViewMode('csv')}
              title="CSV view"
            >
              <List size={14} />
            </button>
          </div>
          <Button
            variant="outline"
            size="sm"
            leftIcon={copied ? <Check size={14} /> : <Copy size={14} />}
            onClick={handleCopy}
            title="Copy to clipboard"
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download size={14} />}
            onClick={handleDownload}
            title="Download as CSV"
          >
            Download
          </Button>
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

      <div style={{ maxHeight: maxHeight, overflow: 'auto' }}>
        {viewMode === 'table' ? (
          <table className="min-w-full divide-y divide-gray-200">
            {hasHeaders && (
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {headers.map((header, index) => (
                    <th 
                      key={index}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="bg-white divide-y divide-gray-200">
              {parsedData.map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {headers.map((header, cellIndex) => (
                    <td 
                      key={`${rowIndex}-${cellIndex}`}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                    >
                      {row[header] !== undefined ? String(row[header]) : ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <pre className="p-4 whitespace-pre-wrap break-words text-sm bg-gray-50 text-gray-700 font-mono">
            {csvString}
          </pre>
        )}
      </div>
      
      {parsedData.length > 10 && (
        <div className="p-2 text-center text-xs text-gray-500 border-t">
          Showing {parsedData.length} rows and {headers.length} columns
        </div>
      )}
    </div>
  );
};

export default SpreadsheetDisplay;