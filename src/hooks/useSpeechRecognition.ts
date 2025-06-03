import { useState, useEffect, useCallback } from 'react';
import 'regenerator-runtime/runtime';

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
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  // Check if SpeechRecognition is supported
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const isBrowserSupported = !!SpeechRecognition;
    
    setIsSpeechSupported(isBrowserSupported);
    console.log('Speech recognition supported (direct check):', isBrowserSupported);
    
    // Initialize recognition instance if supported
    if (isBrowserSupported) {
      const recognition = new SpeechRecognition();
      recognition.continuous = options?.continuous ?? false;
      recognition.interimResults = true;
      recognition.lang = options?.language ?? 'en-US';
      
      setRecognitionInstance(recognition);
    }
    
    return () => {
      // Clean up any active recognition on unmount
      if (recognitionInstance) {
        try {
          recognitionInstance.stop();
        } catch (e) {
          console.error('Error stopping recognition on unmount:', e);
        }
      }
    };
  }, []);

  const clearNoSpeechTimeout = () => {
    if (noSpeechTimeout) {
      clearTimeout(noSpeechTimeout);
      setNoSpeechTimeout(null);
    }
  };

  // Set up event handlers when recognition instance is created
  useEffect(() => {
    if (!recognitionInstance) return;
    
    // Set up event handlers
    recognitionInstance.onstart = () => {
      console.log('Speech recognition started');
      // Set timeout for no speech detection
      const timeout = setTimeout(() => {
        if (isListening) {
          stopListening();
          setError('No speech detected. Please try again and speak clearly.');
        }
      }, 10000); // 10 seconds timeout
      setNoSpeechTimeout(timeout);
    };

    recognitionInstance.onaudiostart = () => {
      console.log('Audio capture started');
      // Check if microphone is actually receiving audio
      navigator.mediaDevices.getUserMedia({ audio: true })
        .catch(err => {
          console.error('Microphone access error:', err);
          setError('Unable to access microphone. Please check permissions and device settings.');
          stopListening();
        });
    };
    
    recognitionInstance.onresult = (event: any) => {
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
    
    recognitionInstance.onerror = (event: any) => {
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
    
    recognitionInstance.onend = () => {
      console.log('Speech recognition ended');
      clearNoSpeechTimeout();
      if (isListening) {
        // If we're still supposed to be listening, restart
        try {
          recognitionInstance.start();
        } catch (e) {
          console.error('Failed to restart recognition:', e);
          setIsListening(false);
          setError('Failed to restart speech recognition. Please try again.');
        }
      }
    };
  }, [recognitionInstance, isListening, options?.onResult]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  const startListening = useCallback(async () => {
    if (!recognitionInstance) {
      setError('Speech recognition not supported in this browser');
      return;
    }
    
    setError(null);
    
    try {
      // Check microphone permissions first
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Clean up the stream
      
      console.log('Starting speech recognition');
      recognitionInstance.start();
      setIsListening(true);
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
  }, [recognitionInstance]);

  const stopListening = useCallback(() => {
    try {
      console.log('Stopping speech recognition');
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
      clearNoSpeechTimeout();
      setIsListening(false);
    } catch (err) {
      console.error('Error stopping speech recognition:', err);
    }
  }, [recognitionInstance]);

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
    browserSupportsSpeechRecognition: !!window.SpeechRecognition || !!window.webkitSpeechRecognition
  };
};

export default useSpeechRecognition;