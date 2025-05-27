import { useState, useEffect, useCallback } from 'react';
import 'regenerator-runtime/runtime';
import SpeechRecognition from 'react-speech-recognition';

interface SpeechRecognitionOptions {
  onResult?: (transcript: string) => void;
  continuous?: boolean;
  language?: string;
}

export const useSpeechRecognition = (options?: SpeechRecognitionOptions) => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [noSpeechTimeout, setNoSpeechTimeout] = useState<NodeJS.Timeout | null>(null);

  // Check if SpeechRecognition is supported
  useEffect(() => {
    const isBrowserSupported = 
      'SpeechRecognition' in window || 
      'webkitSpeechRecognition' in window;
    
    setIsSpeechSupported(isBrowserSupported);
    console.log('Speech recognition supported (direct check):', isBrowserSupported);
  }, []);

  const clearNoSpeechTimeout = () => {
    if (noSpeechTimeout) {
      clearTimeout(noSpeechTimeout);
      setNoSpeechTimeout(null);
    }
  };

  useEffect(() => {
    // Initialize SpeechRecognition
    if (isSpeechSupported) {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognitionAPI) {
        const recognition = new SpeechRecognitionAPI();
        
        // Configure recognition
        recognition.continuous = options?.continuous ?? false;
        recognition.interimResults = true;
        recognition.lang = options?.language ?? 'en-US';
        
        // Set up event handlers
        recognition.onstart = () => {
          // Set timeout for no speech detection
          const timeout = setTimeout(() => {
            if (isListening) {
              stopListening();
              setError('No speech detected. Please try again and speak clearly.');
            }
          }, 10000); // 10 seconds timeout
          setNoSpeechTimeout(timeout);
        };

        recognition.onaudiostart = () => {
          // Check if microphone is actually receiving audio
          navigator.mediaDevices.getUserMedia({ audio: true })
            .catch(err => {
              console.error('Microphone access error:', err);
              setError('Unable to access microphone. Please check permissions and device settings.');
              stopListening();
            });
        };
        
        recognition.onresult = (event) => {
          clearNoSpeechTimeout();
          const current = event.resultIndex;
          const transcript = event.results[current][0].transcript;
          
          if (transcript.trim()) {
            setTranscript(transcript);
            setError(null);
            
            if (options?.onResult) {
              options.onResult(transcript);
            }
          }
          
          console.log('Speech recognition result:', transcript);
        };
        
        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          clearNoSpeechTimeout();

          let errorMessage = 'Speech recognition error';
          switch (event.error) {
            case 'no-speech':
              errorMessage = 'No speech detected. Please speak clearly and try again.';
              break;
            case 'audio-capture':
              errorMessage = 'No microphone detected. Please check your device settings.';
              break;
            case 'not-allowed':
              errorMessage = 'Microphone access denied. Please enable microphone permissions.';
              break;
            case 'network':
              errorMessage = 'Network error. Please check your internet connection.';
              break;
            default:
              errorMessage = `Error: ${event.error}`;
          }
          
          setError(errorMessage);
          setIsListening(false);
        };
        
        recognition.onend = () => {
          clearNoSpeechTimeout();
          if (isListening) {
            // If we're still supposed to be listening, restart
            try {
              recognition.start();
            } catch (e) {
              console.error('Failed to restart recognition:', e);
              setIsListening(false);
              setError('Failed to restart speech recognition. Please try again.');
            }
          }
        };
        
        // Store recognition instance
        (window as any).recognitionInstance = recognition;
      }
    }
    
    // Cleanup
    return () => {
      clearNoSpeechTimeout();
      const recognition = (window as any).recognitionInstance;
      if (recognition) {
        try {
          recognition.stop();
        } catch (e) {
          console.error('Error stopping recognition:', e);
        }
      }
    };
  }, [isSpeechSupported, options?.continuous, options?.language, options?.onResult, isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  const startListening = useCallback(async () => {
    setError(null);
    if (!isSpeechSupported) {
      setError('Speech recognition not supported in this browser');
      console.error('Speech recognition not supported');
      return;
    }

    try {
      // Check microphone permissions first
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Clean up the stream

      console.log('Starting speech recognition');
      const recognition = (window as any).recognitionInstance;
      if (recognition) {
        recognition.start();
        setIsListening(true);
      } else {
        throw new Error('Speech recognition not initialized');
      }
    } catch (err: any) {
      let errorMessage = 'Failed to start speech recognition';
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Microphone access denied. Please enable microphone permissions.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please check your device settings.';
      }
      setError(errorMessage);
      console.error('Speech recognition error:', err);
      setIsListening(false);
    }
  }, [isSpeechSupported]);

  const stopListening = useCallback(() => {
    try {
      console.log('Stopping speech recognition');
      const recognition = (window as any).recognitionInstance;
      if (recognition) {
        recognition.stop();
      }
      clearNoSpeechTimeout();
      setIsListening(false);
    } catch (err) {
      console.error('Error stopping speech recognition:', err);
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      console.log('Stopping speech recognition');
      stopListening();
    } else {
      console.log('Starting speech recognition');
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    transcript,
    isListening,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
    error,
    isSpeechSupported,
    browserSupportsSpeechRecognition: isSpeechSupported
  };
};

export default useSpeechRecognition;