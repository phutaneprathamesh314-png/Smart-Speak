/**
 * Web Speech API helper for SmartSpeak audio playback
 */

export function speakText(text: string, lang = 'en-US', rate = 0.9): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis is not supported in this browser.');
      resolve();
      return;
    }

    // Cancel any previous speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    // Try to find natural English voice
    if (lang.startsWith('en')) {
      const preferredVoice = voices.find(
        (v) =>
          (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel')) &&
          v.lang.startsWith('en')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
    } else if (lang.startsWith('hi')) {
      const hindiVoice = voices.find((v) => v.lang.startsWith('hi'));
      if (hindiVoice) {
        utterance.voice = hindiVoice;
      }
    }

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    window.speechSynthesis.speak(utterance);
  });
}

export function stopSpeaking(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
