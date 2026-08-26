import React, { useState, useRef, useEffect } from 'react';

// Define our strict states
type TurnState = 'IDLE' | 'USER_RECORDING' | 'PROCESSING' | 'AI_SPEAKING';

interface OralChatViewProps {
  onSubmit: (message: string) => void;
  onComplete: () => void;
  chatMessages: any[]; 
  token: string; // <-- Add this
}

export default function OralChatView({ onSubmit, onComplete, chatMessages, token }: OralChatViewProps) {
  const [turnState, setTurnState] = useState<TurnState>('IDLE');
  const [messages, setMessages] = useState<{ role: string, content: string }[]>([]);
  
  // Refs to manage our MediaRecorder and SpeechSynthesis
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // ---------------------------------------------------------
  // 1. TTS: Handling AI Playback (Web Speech API)
  // ---------------------------------------------------------
  const playAIResponse = (text: string) => {
    setTurnState('AI_SPEAKING');
    
    // Add the AI's response to the local transcript
    setMessages(prev => [...prev, { role: 'assistant', content: text }]);
    
    // Use the native browser TTS
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0; 
    
    utterance.onend = () => {
      // Strict Turn-based constraint: Only return to IDLE when AI finishes speaking
      setTurnState('IDLE');
    };

    window.speechSynthesis.speak(utterance);
  };

  // ---------------------------------------------------------
  // 2. Watch for incoming AI messages from the WebSocket
  // ---------------------------------------------------------
  useEffect(() => {
    if (chatMessages.length === 0) return;

    const latestMessage = chatMessages[chatMessages.length - 1];

    // Check if the newest message is from the assistant and is finished streaming
    if (
        latestMessage.role === "assistant" && 
        turnState === "PROCESSING" && 
        latestMessage.messageType === "finalMessage" 
    ) {
        playAIResponse(latestMessage.content);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatMessages, turnState]);

  // ---------------------------------------------------------
  // 3. STT: Handling User Recording
  // ---------------------------------------------------------
  const handleStartRecording = async () => {
    setTurnState('USER_RECORDING');
    
    // Request microphone access
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      setTurnState('PROCESSING');
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
      
      // 1. Convert the Blob to a Base64 string using FileReader
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        // Strip the data URL prefix (e.g., "data:audio/wav;base64,")
        const base64data = (reader.result as string).split(',')[1];

        try {
          // 2. Send the Base64 string to your new Lambda endpoint
          // TODO: Replace with your actual API Gateway URL once deployed
          const response = await fetch("YOUR_NEW_API_GATEWAY_URL/transcribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audioData: base64data })
          });

          const data = await response.json();
          
          if (data.transcript) {
            // Display what the user said in the local transcript
            setMessages(prev => [...prev, { role: 'user', content: data.transcript }]);
            
            // 3. Send the transcript into the existing WebSocket pipeline in Chat.tsx!
            onSubmit(data.transcript);
          }
        } catch (error) {
          console.error("Error transcribing audio:", error);
          setTurnState('IDLE'); // Reset on failure so the user isn't stuck
        }
      };
    };

    mediaRecorder.start();
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
  };

  // ---------------------------------------------------------
  // 4. UI Rendering
  // ---------------------------------------------------------
  return (
    <div className="flex flex-col h-full items-center justify-between p-6">
      
      {/* Top: Chat History / Live Transcript */}
      <div className="flex-1 w-full max-w-2xl overflow-y-auto mb-4 p-4 border rounded-xl bg-card shadow-sm">
        {messages.map((msg, idx) => (
           <div key={idx} className={`mb-3 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
             <span 
               className={`p-3 rounded-lg inline-block shadow-sm max-w-[85%] ${
                 msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-foreground'
               }`}
             >
               {msg.content}
             </span>
           </div>
        ))}
        {turnState === 'PROCESSING' && (
          <p className="text-muted-foreground animate-pulse text-center mt-4">Thinking...</p>
        )}
      </div>

      {/* Middle: The Big Interaction Button */}
      <div className="flex flex-col items-center">
        {turnState === 'IDLE' && (
          <button 
            onClick={handleStartRecording}
            className="w-32 h-32 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg transition-colors flex items-center justify-center font-bold text-lg"
          >
            Tap to Speak
          </button>
        )}
        
        {turnState === 'USER_RECORDING' && (
          <button 
            onClick={handleStopRecording}
            className="w-32 h-32 rounded-full bg-red-500 text-white shadow-lg animate-pulse flex items-center justify-center font-bold text-lg"
          >
            Stop
          </button>
        )}
        
        {(turnState === 'PROCESSING' || turnState === 'AI_SPEAKING') && (
           <button 
             disabled 
             className="w-32 h-32 rounded-full bg-gray-400 text-white cursor-not-allowed flex items-center justify-center font-bold text-center p-4 leading-tight"
           >
             {turnState === 'PROCESSING' ? 'Processing...' : 'AI is speaking...'}
           </button>
        )}
      </div>

      {/* Bottom: Completion Handoff */}
      <div className="mt-8">
        <button 
          onClick={onComplete}
          className="px-6 py-2 border-2 rounded-lg text-green-600 border-green-600 hover:bg-green-50 transition-colors font-semibold"
        >
          Complete Assessment
        </button>
      </div>

    </div>
  );
}