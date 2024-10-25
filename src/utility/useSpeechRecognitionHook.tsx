//reference: https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition
//https://www.youtube.com/watch?v=W0-hJ-9YG3I
import { useEffect, useState } from 'react';

let recognition: any = null;
if ("webkitSpeechRecognition" in window) {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.lang = "en-US";
}

const useSpeechRecognition = () => {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (!recognition) return;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      var finalTranscript = "";
      for (var i = event.resultIndex; i < event.results.length; ++i) {
        finalTranscript = finalTranscript + " " + event.results[i][0].transcript;
      }
      setTranscript(finalTranscript);//event.results[0][0].transcript)
    }

    recognition.onend = () => {
      setIsListening(false);
      recognition.stop();
    }

  }, []);

  const startListening = () => {
    setTranscript('');
    setIsListening(true);
    recognition.start();
  }

  const stopListening = () => {
    setIsListening(false);
    recognition.stop();
  }

  return {
    transcript,
    isListening,
    startListening,
    stopListening,
    hasRecognitionSupport: !!recognition,
  }
}

export default useSpeechRecognition;