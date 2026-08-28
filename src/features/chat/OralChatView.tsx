import React, { useState, useEffect, useRef } from 'react';

export default function OralChatView({ onSubmit, onComplete, chatMessages }) {
  const [turnState, setTurnState] = useState('IDLE'); // 'IDLE', 'RECORDING', 'PROCESSING'
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const audioChunksRef = useRef([]);

  // 1. Request Microphone Permissions & Setup Deepgram
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        const recorder = new MediaRecorder(stream);

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = async () => {
          setTurnState('PROCESSING');
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          audioChunksRef.current = []; // Clear chunks for the next recording
          
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
              // Pipe transcript to Chat.tsx which handles displaying it
              onSubmit(transcript);
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

  // 2. Text-to-Speech (Read AI messages aloud)
  useEffect(() => {
    const lastMessage = chatMessages[chatMessages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant' && lastMessage.finished) {
      const utterance = new SpeechSynthesisUtterance(lastMessage.content);
      window.speechSynthesis.speak(utterance);
      setTurnState('IDLE'); 
    }
  }, [chatMessages]);

  // 3. The User Interface
  return (
    <div className="flex-1 flex flex-col h-full bg-background p-4 relative min-h-[500px]">
      
      {/* Chat Display */}
      <div className="flex-1 overflow-y-auto mb-6 space-y-4 p-4 border rounded-xl shadow-sm bg-card">
        {chatMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground italic">
            Press the microphone to start the conversation.
          </div>
        ) : (
          chatMessages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-4 rounded-xl max-w-[80%] shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground rounded-br-sm' 
                  : 'bg-muted rounded-bl-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Voice Controls */}
      <div className="flex flex-col items-center justify-center gap-4 py-2 shrink-0">
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
                mediaRecorder.start();
                setTurnState('RECORDING');
              }
            }
          }}
          disabled={turnState === 'PROCESSING' || !mediaRecorder}
          className={`h-20 w-20 rounded-full flex items-center justify-center shadow-lg transition-all ${
            turnState === 'RECORDING' 
              ? 'bg-red-500 hover:bg-red-600 scale-110' 
              : turnState === 'PROCESSING' || !mediaRecorder
              ? 'bg-muted cursor-not-allowed opacity-50'
              : 'bg-primary hover:bg-primary/90 hover:scale-105'
          }`}
        >
          <span className="text-3xl" role="img" aria-label="microphone">
            {turnState === 'RECORDING' ? '⏹' : '🎙️'}
          </span>
        </button>

        <button 
          onClick={onComplete}
          className="mt-2 px-6 py-2 border rounded-full text-sm font-medium hover:bg-muted transition-colors"
        >
          Finish Oral Module
        </button>
      </div>
    </div>
  );
}