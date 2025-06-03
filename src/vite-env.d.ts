/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface Window {
  SpeechRecognition?: typeof SpeechRecognition;
  webkitSpeechRecognition?: typeof SpeechRecognition;
}