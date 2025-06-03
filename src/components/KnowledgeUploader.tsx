import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, AlertCircle, Check, Loader2, FileText, Type } from 'lucide-react';
import Button from './ui/Button';
import { supabase } from '../lib/supabase'; // Import supabase client

interface KnowledgeUploaderProps {
  personaId: string;
  onUploadComplete: () => void;
}

const KnowledgeUploader: React.FC<KnowledgeUploaderProps> = ({
  personaId,
  onUploadComplete
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'document' | 'text'>('document');
  const [textInput, setTextInput] = useState<string>('');
  const [documentName, setDocumentName] = useState<string>('');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    setUploadStatus('uploading');
    setError(null);
    setProgress('Uploading document...');
    setDocumentName(file.name);
    
    try {
      // First, read the file content
      const fileContent = await readFileAsync(file);
      
      // Now send the content to the processing function
      setUploadStatus('processing');
      setProgress('Processing document content...');
      
      await processContent(fileContent, file.name, file.type);
    } catch (err: any) {
      console.error('Error processing document:', err);
      setUploadStatus('error');
      setError(err.message || 'Failed to process document');
    }
  }, [personaId, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/html': ['.html', '.htm'],
      'application/json': ['.json']
    },
    maxSize: 5242880, // 5MB
    multiple: false,
    disabled: uploadStatus !== 'idle'
  });

  // Function to read file content as text
  const readFileAsync = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        resolve(reader.result as string);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      if (file.type === 'application/pdf' || 
          file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          file.type === 'application/msword') {
        // For these types, we'll need to extract text on the server
        // Just read as binary string for now
        reader.readAsBinaryString(file);
      } else {
        // For text-based files, read as text
        reader.readAsText(file);
      }
    });
  };

  // Function to process content (works for both file content and direct text input)
  const processContent = async (content: string, fileName: string, fileType: string = 'text/plain') => {
    setUploadStatus('processing');
    setProgress('Processing content...');
    
    try {
      // Get the current user session to use the authenticated token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('You must be logged in to process knowledge');
      }
      
      // Use the user's session token instead of the anon key
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-knowledge`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            personaId,
            fileName,
            fileContent: content,
            fileType
          })
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process content');
      }
      
      const result = await response.json();
      setUploadStatus('success');
      setProgress(`Successfully processed ${result.entriesCreated} knowledge entries`);
      
      // Notify parent component
      onUploadComplete();
      
      // Reset after 3 seconds
      setTimeout(() => {
        setUploadStatus('idle');
        setProgress('');
        setTextInput('');
      }, 3000);
    } catch (err: any) {
      console.error('Error processing content:', err);
      setUploadStatus('error');
      setError(err.message || 'Failed to process content');
    }
  };

  // Handle direct text submission
  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || isProcessing) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Use current timestamp as the filename for the text submission
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `text-input-${timestamp}.txt`;
      
      await processContent(textInput, fileName);
    } catch (err: any) {
      console.error('Error processing text input:', err);
      setUploadStatus('error');
      setError(err.message || 'Failed to process text input');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tab Selector */}
      <div className="flex border-b border-gray-200">
        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'document'
              ? 'text-blue-600 border-b-2 border-blue-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('document')}
        >
          <div className="flex items-center gap-2">
            <FileText size={16} />
            <span>Upload Document</span>
          </div>
        </button>
        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'text'
              ? 'text-blue-600 border-b-2 border-blue-500'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('text')}
        >
          <div className="flex items-center gap-2">
            <Type size={16} />
            <span>Paste Text</span>
          </div>
        </button>
      </div>

      {/* Document Upload Tab */}
      {activeTab === 'document' && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragActive
              ? 'border-blue-400 bg-blue-50'
              : uploadStatus === 'error'
              ? 'border-red-300 bg-red-50'
              : uploadStatus === 'success'
              ? 'border-green-300 bg-green-50'
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
          } ${uploadStatus !== 'idle' ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <input {...getInputProps()} />
          
          {uploadStatus === 'idle' && (
            <div className="space-y-2">
              <Upload size={32} className={`mx-auto ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
              <p className="text-sm text-gray-600">
                {isDragActive ? 'Drop the file here' : 'Drag and drop a file, or click to select'}
              </p>
              <p className="text-xs text-gray-500">
                Supported formats: TXT, MD, PDF, DOCX, HTML (max 5MB)
              </p>
            </div>
          )}
          
          {uploadStatus === 'uploading' && (
            <div className="space-y-2">
              <Loader2 size={32} className="mx-auto text-blue-500 animate-spin" />
              <p className="text-sm text-blue-600">Uploading document...</p>
              <p className="text-xs text-blue-500">Preparing {documentName}</p>
            </div>
          )}
          
          {uploadStatus === 'processing' && (
            <div className="space-y-2">
              <Loader2 size={32} className="mx-auto text-blue-500 animate-spin" />
              <p className="text-sm text-blue-600">{progress}</p>
              <p className="text-xs text-blue-500">This may take a moment for large documents</p>
            </div>
          )}
          
          {uploadStatus === 'success' && (
            <div className="space-y-2">
              <Check size={32} className="mx-auto text-green-500" />
              <p className="text-sm text-green-600">{progress}</p>
            </div>
          )}
          
          {uploadStatus === 'error' && (
            <div className="space-y-2">
              <AlertCircle size={32} className="mx-auto text-red-500" />
              <p className="text-sm text-red-600">Error: {error}</p>
              <p className="text-xs text-red-500">
                Click or drag another file to try again
              </p>
            </div>
          )}
        </div>
      )}

      {/* Text Input Tab */}
      {activeTab === 'text' && (
        <div>
          <form onSubmit={handleTextSubmit}>
            <div className="space-y-4">
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste or type text content here..."
                className={`w-full min-h-[200px] rounded-md border ${
                  uploadStatus === 'error' ? 'border-red-300' : 'border-gray-300'
                } px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500`}
                disabled={uploadStatus !== 'idle' && uploadStatus !== 'error'}
              />
              
              {uploadStatus === 'processing' && (
                <div className="flex items-center justify-center text-blue-600">
                  <Loader2 className="animate-spin mr-2\" size={16} />
                  <span>{progress}</span>
                </div>
              )}
              
              {uploadStatus === 'success' && (
                <div className="flex items-center justify-center text-green-600">
                  <Check className="mr-2" size={16} />
                  <span>{progress}</span>
                </div>
              )}
              
              {uploadStatus === 'error' && (
                <div className="flex items-center justify-center text-red-600">
                  <AlertCircle className="mr-2" size={16} />
                  <span>{error}</span>
                </div>
              )}
              
              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!textInput.trim() || isProcessing || uploadStatus === 'processing'}
                  loading={isProcessing || uploadStatus === 'processing'}
                >
                  Process Text
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}
      
      {/* Instructions */}
      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs text-gray-600">
        <p className="font-medium text-gray-700 mb-1">Tips for better knowledge processing:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Provide well-structured content with clear sections and headings</li>
          <li>Break up long paragraphs to improve readability</li>
          <li>Include a descriptive filename or title for better categorization</li>
          <li>Consider splitting very large documents into smaller, focused files</li>
        </ul>
      </div>
    </div>
  );
};

export default KnowledgeUploader;