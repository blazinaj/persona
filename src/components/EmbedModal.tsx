import React, { useState } from 'react';
import { X, Copy, Check, Code } from 'lucide-react';
import Button from './ui/Button';

interface EmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  personaId: string;
}

export const EmbedModal: React.FC<EmbedModalProps> = ({
  isOpen,
  onClose,
  personaId
}) => {
  const [embedCode, setEmbedCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      fetchEmbedCode();
    }
  }, [isOpen, personaId]);

  const fetchEmbedCode = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/embed?personaId=${personaId}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate embed code');
      }

      const data = await response.json();
      setEmbedCode(data.embedCode);
    } catch (err) {
      console.error('Error fetching embed code:', err);
      setError('Failed to generate embed code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
        
        <div className="relative w-full max-w-2xl transform rounded-xl bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Code size={20} className="text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Embed Chat Widget</h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-gray-100 transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Generating embed code...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-4">
                Copy and paste this code into your website where you want the chat widget to appear.
              </p>

              <div className="relative">
                <pre className="bg-gray-50 rounded-lg p-4 text-sm font-mono overflow-x-auto">
                  {embedCode}
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={handleCopy}
                  leftIcon={copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>

              <div className="mt-6 bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">Important Notes:</h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>The chat widget will appear in the bottom-right corner of your website</li>
                  <li>Make sure your persona remains public for the widget to work</li>
                  <li>The widget is responsive and works on all devices</li>
                  <li>Customize the appearance by modifying the embed code's CSS</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};