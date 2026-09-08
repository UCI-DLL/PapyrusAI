import React, { useState, useEffect, useRef } from 'react';
import removeMarkdown from "markdown-to-text";

// --- STT / TTS: currently using browser-native APIs (no API keys required) ---
//
// STT: Web Speech API (SpeechRecognition) — free, built-in, limited accuracy
// TTS: Web Speech API (speechSynthesis)   — free, built-in, robotic voice quality
//
// To improve voice quality, two backend upgrade paths are available.
// Both MUST be implemented server-side (AWS Lambda / relay) — never expose API keys to the browser.
//
// Option 1 — Deepgram (STT) + OpenAI TTS via Lambda proxy endpoints (lower cost, modular):
//   POST /api/transcribe  — receives audio blob, forwards to Deepgram, returns transcript
//   POST /api/tts         — receives text, calls OpenAI TTS, streams audio back to client
//   Keeps the existing chat pipeline intact; swap only OralChatView's fetch targets.
//
// Option 2 — OpenAI Realtime API via a WebSocket relay Lambda/server (higher cost, lower latency):
//   Single persistent WebSocket session handles STT + AI + TTS simultaneously.
//   Supports voice activity detection (no push-to-talk needed) and natural interruption.
//   Replaces or bypasses the existing backend AI pipeline — requires more architectural work.

interface OralChatViewProps {
  onSubmit: (text: string) => void;
  pendingSpeech: { text: string; ts: number } | null;
}

export default function OralChatView({ onSubmit, pendingSpeech }: OralChatViewProps) {
  const [turnState, setTurnState] = useState<'IDLE' | 'RECORDING'>('IDLE');
  const [isReady, setIsReady] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);
  // Stable ref so recognition's onresult always calls the latest onSubmit
  // without the effect having to re-run (and recreate the recognizer) on every render.
  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;
  // Accumulates transcript across multiple onresult firings (continuous mode).
  const transcriptRef = useRef('');

  useEffect(() => {
    if (!pendingSpeech) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(removeMarkdown(pendingSpeech.text));
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [pendingSpeech]);

  useEffect(() => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      console.error("SpeechRecognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setTurnState('RECORDING');

    // Fires once per phrase; accumulate across pauses until stop() is called.
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcriptRef.current += event.results[i][0].transcript + ' ';
        }
      }
    };

    // stop() triggers onend — submit everything collected so far.
    recognition.onend = () => {
      const transcript = transcriptRef.current.trim();
      if (transcript) {
        onSubmitRef.current(transcript);
      }
      transcriptRef.current = '';
      setTurnState('IDLE');
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'aborted') {
        transcriptRef.current = '';
        setTurnState('IDLE');
      }
    };

    recognitionRef.current = recognition;
    setIsReady(true);

    return () => {
      recognition.abort();
      recognitionRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col items-center justify-center gap-2 py-4 w-full border-t bg-background shrink-0">
      <p className={`text-sm font-semibold transition-colors ${
        turnState === 'RECORDING' ? 'text-red-500 animate-pulse' : 'text-foreground'
      }`}>
        {turnState === 'RECORDING' ? "Listening..." : "Your turn to speak"}
      </p>

      <div className="flex items-center gap-4">
        {isSpeaking && (
          <button
            onClick={() => {
              window.speechSynthesis.cancel();
              setIsSpeaking(false);
            }}
            className="h-10 w-10 rounded-full flex items-center justify-center bg-muted hover:bg-muted/80 transition-all shadow"
            aria-label="Stop reading"
            title="Stop reading"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-foreground">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </button>
        )}

        <button
          onClick={() => {
            const recognition = recognitionRef.current;
            if (!recognition) return;
            if (turnState === 'RECORDING') {
              recognition.stop();
            } else {
              window.speechSynthesis.cancel();
              setIsSpeaking(false);
              recognition.start();
            }
          }}
          disabled={!isReady}
          className={`h-16 w-16 rounded-full flex items-center justify-center shadow-lg transition-all ${
            turnState === 'RECORDING'
              ? 'bg-red-500 hover:bg-red-600 scale-110'
              : !isReady
                ? 'bg-muted cursor-not-allowed opacity-50'
                : 'bg-primary hover:bg-primary/90 hover:scale-105'
          }`}
        >
          {turnState === 'RECORDING' ? (
            <svg className="text-white" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            <svg className="text-white" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
