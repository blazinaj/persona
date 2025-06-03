import { useState, useRef, useEffect } from 'react';
import { Persona } from '../types';
import { getVoiceForPersona, getSpeechSpeed, getSpeechPitch, cleanTextForSpeech } from '../lib/speechSynthesis';

export const useAudioPlayback = (persona: Persona | undefined) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    
    audio.addEventListener('ended', () => {
      setIsSpeaking(false);
    });
    
    audio.addEventListener('error', (e) => {
      if (e?.target?.error?.code === 4) {
        return;
      }
      console.error('Audio playback error:', {
        error: e?.toString(),
        errorCode: e.target?.error?.code,
        errorMessage: e.target?.error?.message,
        currentSrc: audio.currentSrc,
        readyState: audio.readyState
      });
      
      setIsSpeaking(false);
      setError('Failed to play audio. Please try again.');
    });

    audio.addEventListener('canplay', () => {
      if (audioEnabled && !audio.paused) {
        audio.play().catch(err => {
          console.error('Error during audio play:', err);
          setIsSpeaking(false);
          setError('Failed to start audio playback.');
        });
      }
    });
    
    return () => {
      try {
        if (audio) {
          audio.pause();
          audio.src = '';
        }
        
        if (currentAudioUrlRef.current) {
          URL.revokeObjectURL(currentAudioUrlRef.current);
          currentAudioUrlRef.current = null;
        }
      } catch (err) {
        console.error('Error during audio cleanup:', err);
      }
    };
  }, []);

  const speakText = async (text: string) => {
    if (!audioRef.current || !text) {
      console.log('Skipping audio playback - conditions not met:', {
        hasAudioRef: Boolean(audioRef.current),
        hasText: Boolean(text)
      });
      return;
    }

    try {
      stopSpeaking();
     
      setIsSpeaking(true);
      setError(null);
      
      // Ensure we have valid voice settings
      const voice = getVoiceForPersona(persona || undefined);
      const speed = getSpeechSpeed(persona || undefined);
      const pitch = getSpeechPitch(persona || undefined);
      
      // Clean up text for better speech synthesis
      const cleanedText = cleanTextForSpeech(text);
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            text: cleanedText,
            voice,
            speed,
            pitch,
            personaId: persona?.id || null
          })
        }
      );
      
      if (!response.ok) {
        throw new Error(`Speech generation failed: ${response.status} ${response.statusText}`);
      }
      
      const audioBlob = await response.blob();
      
      if (!audioBlob || audioBlob.size === 0) {
        throw new Error('Received empty audio data');
      }
      
      if (currentAudioUrlRef.current) {
        URL.revokeObjectURL(currentAudioUrlRef.current);
      }
      
      const audioUrl = URL.createObjectURL(audioBlob);
      currentAudioUrlRef.current = audioUrl;
      
      if (!audioRef.current) {
        throw new Error('Audio element not initialized');
      }

      // Verify the audio URL is valid before setting it
      if (!audioUrl) {
        throw new Error('Failed to create audio URL');
      }
      
      // Set the audio source and attempt playback
      audioRef.current.src = audioUrl;
      
      try {
        // Wait for the audio to be loaded before playing
        if (audioRef.current) {
          await audioRef.current.play();
        }
      } catch (playError) {
        console.error('Error playing audio:', playError);
        setIsSpeaking(false);
      }
    } catch (error: any) {
      console.error('Error generating or playing speech:', error);
      setIsSpeaking(false);
      setError(`Audio playback failed: ${error.message}`);
      
      if (currentAudioUrlRef.current) {
        URL.revokeObjectURL(currentAudioUrlRef.current);
        currentAudioUrlRef.current = null;
      }

      // Reset audio element state
      if (audioRef.current) {
        audioRef.current.src = '';
      }
    }
  };
  
  const stopSpeaking = () => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = ''; // Clear the source
      }
    } catch (err) {
      console.error('Error stopping audio:', err);
    } finally {
      setIsSpeaking(false);
    }
  };
  
  const toggleAudio = () => {
    try {
      if (audioEnabled) {
        stopSpeaking();
        setAudioEnabled(false);
      } else {
        setAudioEnabled(true);
      }
    } catch (err) {
      console.error('Error toggling audio:', err);
      setError('Failed to toggle audio. Please try again.');
    }
  };

  return {
    isSpeaking,
    audioEnabled,
    error,
    speakText,
    stopSpeaking,
    toggleAudio
  };
};