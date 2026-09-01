import React, { useState, useEffect, useRef } from 'react';

// Anti-Garbage-Collection safeguard: Keeps the audio object alive in memory
let activeUtterance: SpeechSynthesisUtterance | null = null;

interface OralChatViewProps {
  onSubmit: (text: string) => void;
  chatMessages: any[];
}

export default function OralChatView({ onSubmit, chatMessages }: OralChatViewProps) {
  const [turnState, setTurnState] = useState<'IDLE' | 'RECORDING' | 'PROCESSING'>('IDLE');
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const lastSpokenMessageId = useRef<string | null>(null);

  useEffect(() => {
    if (!chatMessages || chatMessages.length === 0) return;
    const lastMessage = chatMessages[chatMessages.length - 1];
    
    if (
      lastMessage && 
      lastMessage.role === 'assistant' && 
      lastMessage.finished &&
      lastMessage.id !== lastSpokenMessageId.current 
    ) {
      lastSpokenMessageId.current = lastMessage.id;
      
      // 1. Force clear any stuck/ghost utterances in the browser's queue
      window.speechSynthesis.cancel();
      
      // 2. Bind to external variable to survive React re-renders
      activeUtterance = new SpeechSynthesisUtterance(lastMessage.content);
      
      // 3. Micro-delay to ensure the browser audio thread is ready after DOM paint
      setTimeout(() => {
        if (activeUtterance) {
          window.speechSynthesis.speak(activeUtterance);
        }
      }, 50);
    }
  }, [chatMessages]);
  
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        const recorder = new MediaRecorder(stream);

        recorder.ondataavailable = (event: BlobEvent) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = async () => {
          setTurnState('PROCESSING');
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          audioChunksRef.current = [];
          
          try {
            const response = await fetch("https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true", {
              method: "POST",
              headers: {
                "Authorization": `Token ${process.env.REACT_APP_DEEPGRAM_API_KEY}`, 
                "Content-Type": "audio/wav"
              },
              body: audioBlob
            });

            const data = await response.json();
            const transcript = data.results?.channels[0]?.alternatives[0]?.transcript;
            
            if (transcript) {
              onSubmit(transcript);
              setTurnState('IDLE'); 
            } else {
              setTurnState('IDLE');
            }
          } catch (error) {
            console.error("Error transcribing audio:", error);
            setTurnState('IDLE'); 
          }
        };

        setMediaRecorder(recorder);
      })
      .catch((err) => {
        console.error("Microphone access denied or not found:", err);
      });
  }, [onSubmit]);

  return (
    <div className="flex flex-col items-center justify-center gap-2 py-4 w-full border-t bg-background shrink-0">
      <p className={`text-sm font-semibold transition-colors ${
        turnState === 'RECORDING' ? 'text-red-500 animate-pulse' : 
        turnState === 'PROCESSING' ? 'text-muted-foreground animate-pulse' : 
        'text-foreground'
      }`}>
        {turnState === 'RECORDING' ? "Listening..." : 
         turnState === 'PROCESSING' ? "AI is processing..." : 
         "Your turn to speak"}
      </p>

      <button
        onClick={() => {
          if (mediaRecorder) {
            if (turnState === 'RECORDING') {
              mediaRecorder.stop();
            } else {
              window.speechSynthesis.cancel();
              document.querySelectorAll('audio').forEach(audio => {
                audio.pause();
                audio.currentTime = 0;
              });
              mediaRecorder.start();
              setTurnState('RECORDING');
            }
          }
        }}
        disabled={turnState === 'PROCESSING' || !mediaRecorder}
        className={`h-16 w-16 rounded-full flex items-center justify-center shadow-lg transition-all ${
          turnState === 'RECORDING' 
            ? 'bg-red-500 hover:bg-red-600 scale-110' 
            : turnState === 'PROCESSING' || !mediaRecorder
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
  );
}