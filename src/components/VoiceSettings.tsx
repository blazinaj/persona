import React from 'react';
import { UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { Volume2, Sliders, VolumeX, Info } from 'lucide-react';

interface VoiceSettingsData {
  gender?: 'male' | 'female' | 'neutral';
  age?: 'young' | 'middle-aged' | 'elderly';
  accent?: string;
  pitch?: number;
  rate?: number;
}

interface VoiceSettingsProps {
  register: UseFormRegister<any>;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  disabled?: boolean;
}

const VoiceSettings: React.FC<VoiceSettingsProps> = ({ 
  register, 
  watch, 
  setValue, 
  disabled = false 
}) => {
  // Initialize voice settings if they don't exist
  React.useEffect(() => {
    // Ensure voice object exists
    const voice = watch('voice');
    if (!voice) {
      setValue('voice', {
        gender: undefined,
        age: undefined,
        accent: '',
        pitch: 1.0,
        rate: 1.0
      });
      return;
    }
    
    // Set default values if not already set
    if (voice.pitch === undefined) {
      setValue('voice.pitch', 1.0);
    }
    
    if (voice.rate === undefined) {
      setValue('voice.rate', 1.0);
    }
    
    if (voice.accent === undefined) {
      setValue('voice.accent', '');
    }
  }, [setValue, watch, watch('voice')]);
  
  const voiceGender = watch('voice.gender') || '';
  const voiceAge = watch('voice.age') || '';
  const voiceAccent = watch('voice.accent') || '';
  const voicePitch = watch('voice.pitch') || 1.0;
  const voiceRate = watch('voice.rate') || 1.0;

  return (
    <div className={`space-y-4 p-4 bg-gray-50 rounded-lg ${disabled ? 'opacity-75' : ''}`}>
      <div className="flex items-center gap-2 mb-3">
        <Volume2 size={18} className="text-blue-600" />
        <h3 className="text-sm font-medium text-gray-700">Voice Customization</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gender
          </label>
          <select
            {...register('voice.gender')}
            className={`w-full rounded-md border border-gray-300 px-3 py-2 ${
              !disabled ? 'focus:border-blue-500 focus:ring-1 focus:ring-blue-500' : ''
            }`}
            disabled={disabled}
          >
            <option value="">Default</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="neutral">Neutral</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Age
          </label>
          <select
            {...register('voice.age')}
            className={`w-full rounded-md border border-gray-300 px-3 py-2 ${
              !disabled ? 'focus:border-blue-500 focus:ring-1 focus:ring-blue-500' : ''
            }`}
            disabled={disabled}
          >
            <option value="">Default</option>
            <option value="young">Young</option>
            <option value="middle-aged">Middle-aged</option>
            <option value="elderly">Elderly</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Accent (optional)
          </label>
          <input
            type="text"
            disabled={disabled}
            {...register('voice.accent')}
            className={`w-full rounded-md border border-gray-300 px-3 py-2 ${
              !disabled ? 'focus:border-blue-500 focus:ring-1 focus:ring-blue-500' : ''
            }`}
            placeholder="e.g., British, American, etc."
          />
        </div>
      </div>
      
      <div className="space-y-4 mt-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Speech Rate
            </label>
            <span className="text-xs text-gray-500">{voiceRate}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            disabled={disabled}
            value={voiceRate}
            onChange={(e) => setValue('voice.rate', parseFloat(e.target.value))}
            className={`w-full h-2 bg-gray-200 rounded-lg appearance-none ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Slower</span>
            <span>Normal</span>
            <span>Faster</span>
          </div>
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Pitch
            </label>
            <span className="text-xs text-gray-500">{voicePitch}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            disabled={disabled}
            value={voicePitch}
            onChange={(e) => setValue('voice.pitch', parseFloat(e.target.value))}
            className={`w-full h-2 bg-gray-200 rounded-lg appearance-none ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Lower</span>
            <span>Normal</span>
            <span>Higher</span>
          </div>
        </div>
      </div>
      
      <div className="mt-2 text-xs text-gray-500 flex items-start gap-2 border-t border-gray-200 pt-3">
        <Info size={14} className="mt-0.5 flex-shrink-0 text-blue-500" />
        <div>
          <p>
            These settings will be used when the text-to-speech feature is enabled during chat.
          </p>
          {disabled ? (
            <p className="mt-1 text-amber-600 flex items-center">
              <VolumeX size={12} className="mr-1 flex-shrink-0" />
              Voice settings are currently disabled for this persona type.
            </p>
          ) : (
            <p className="mt-1 flex items-center">
              <Volume2 size={12} className="mr-1 flex-shrink-0 text-blue-500" />
              The voice will be selected based on these preferences.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceSettings;