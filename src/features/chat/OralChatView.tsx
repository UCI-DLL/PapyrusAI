mediaRecorder.onstop = async () => {
      setTurnState('PROCESSING');
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
      
      try {
        // Send the raw audio Blob directly to Deepgram!
        const response = await fetch("https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true", {
          method: "POST",
          headers: { 
            // Swap "REACT_APP" for "VITE" or "NEXT_PUBLIC" if your framework requires it
            "Authorization": `Token ${process.env.REACT_APP_DEEPGRAM_API_KEY}`, 
            "Content-Type": "audio/wav"
          },
          body: audioBlob // Pass the Blob directly
        });

        const data = await response.json();
        
        // Deepgram's direct API returns the transcript nested like this:
        const transcript = data.results?.channels[0]?.alternatives[0]?.transcript;
        
        if (transcript) {
          // Display what the user said in the local transcript
          setMessages(prev => [...prev, { role: 'user', content: transcript }]);
          
          // Send the transcript into the existing WebSocket pipeline in Chat.tsx!
          onSubmit(transcript);
        }
      } catch (error) {
        console.error("Error transcribing audio:", error);
        setTurnState('IDLE'); // Reset on failure so the user isn't stuck
      }
    };

// Watch for new AI messages and read them out loud
useEffect(() => {
  // 1. Get the very last message in the chat
  const lastMessage = chatMessages[chatMessages.length - 1];

  // 2. Make sure it exists, it's from the AI, and it has finished streaming
  if (lastMessage && lastMessage.role === 'assistant' && lastMessage.finished) {
    
    // 3. Create the native browser speech request
    const utterance = new SpeechSynthesisUtterance(lastMessage.content);
    
    // Optional: You can change the voice, pitch, or speed here
    // utterance.rate = 1.0; 
    
    // 4. Speak the message!
    window.speechSynthesis.speak(utterance);
    
    // 5. Reset your UI state back to 'IDLE' so the user knows they can speak again
    setTurnState('IDLE'); 
  }
}, [chatMessages]); // Re-run this check every time the messages array updates