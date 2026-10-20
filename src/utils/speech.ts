/**
 * Web Speech API helper for SmartSpeak audio playback
 */

export function speakText(text: string, lang = 'en-US', rate = 0.9): Promise<void> {
  return new Promise((resolve) => {
    try {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        console.warn('Speech synthesis is not supported in this browser.');
        resolve();
        return;
      }

      // Cancel any previous speech
      try {
        window.speechSynthesis.cancel();
      } catch {}

      const cleanText = text.trim();
      if (!cleanText) {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = 1.0;

      // Safety timeout: prevents audio state from hanging if onend doesn't fire (common in sandboxed iframes)
      const maxDuration = Math.max(2500, Math.min(cleanText.length * 150, 15000));
      const safetyTimer = setTimeout(() => {
        resolve();
      }, maxDuration);

      utterance.onend = () => {
        clearTimeout(safetyTimer);
        resolve();
      };

      utterance.onerror = (e) => {
        clearTimeout(safetyTimer);
        console.warn('SpeechSynthesis error:', e);
        resolve();
      };

      const voices = window.speechSynthesis.getVoices() || [];
      if (lang.startsWith('en')) {
        const preferredVoice = voices.find(
          (v) =>
            (v.name.includes('Natural') ||
              v.name.includes('Google') ||
              v.name.includes('Samantha') ||
              v.name.includes('Daniel') ||
              v.name.includes('Alex')) &&
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

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech execution caught error:', err);
      resolve();
    }
  });
}

export function stopSpeaking(): void {
  try {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  } catch {}
}
