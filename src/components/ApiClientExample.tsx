import React, { useState } from 'react';
import { Code, Copy, Check } from 'lucide-react';
import Button from './ui/Button';

interface ApiClientExampleProps {
  language: 'javascript' | 'python' | 'curl';
  code: string;
  title?: string;
}

const ApiClientExample: React.FC<ApiClientExampleProps> = ({ language, code, title }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Determine the syntax highlighting language
  const syntaxLanguage = language === 'curl' ? 'bash' : language;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between bg-gray-50 px-4 py-2 border-b">
        <div className="flex items-center gap-2">
          <Code size={16} className="text-gray-600" />
          <span className="text-sm font-medium text-gray-700">{title || `${language.charAt(0).toUpperCase() + language.slice(1)} Example`}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          leftIcon={copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
        >
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>
      
      <div className="p-4">
        <pre className="text-sm font-mono whitespace-pre-wrap overflow-auto max-h-96 text-gray-900">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

export default ApiClientExample;