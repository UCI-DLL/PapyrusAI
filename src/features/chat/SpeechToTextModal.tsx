import { useEffect, useState } from "react";
import {
  Button,
  TextField,
} from "@mui/material";
import useSpeechRecognition from "../../utility/useSpeechRecognitionHook";
import KeyboardVoiceIcon from '@mui/icons-material/KeyboardVoice';
import StopIcon from '@mui/icons-material/Stop';


interface ChatWizardProps {
  returnSpeechText: (text: string) => void;
}

export default function SpeechToTextModal({
  returnSpeechText,
}: ChatWizardProps): JSX.Element {
  //Need to save the index of the document just in case some documents are the same name
  const [text, setText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { transcript, startListening, stopListening, hasRecognitionSupport, isListening } = useSpeechRecognition();

  useEffect(() => {
    setIsLoading(false);
  }, []);

  useEffect(() => {
    //add to the new transcript to the end of the current text
    setText(prev => (prev + transcript + " "))
  }, [transcript]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setText(e.target.value);
  }

  return (
    <div className="chat__wizard">
      <div className="chat__wizard__modal">
        {hasRecognitionSupport ? (
          <>
            <div>
              {isListening ? (
                <Button
                  onClick={() => {
                    setText(transcript)
                    stopListening()
                  }}
                  variant="outlined"
                  sx={{ width: "100%" }}
                >
                  <StopIcon />
                  Stop Listening
                </Button>
              ) : (
                <Button variant="outlined" sx={{ width: "100%" }} onClick={startListening}>
                  <KeyboardVoiceIcon />
                  Start Listening
                </Button>
              )}
            </div>
          </>
        ) : (
          <div>Your browser has no speech recognition support.</div>
        )}

        <TextField
          name="text"
          label={"Message"}
          autoFocus
          fullWidth
          sx={{ margin: ".5rem 0" }}
          multiline
          minRows={3}
          maxRows={6}
          value={text}
          onChange={handleChange}
          InputLabelProps={{ shrink: true }}
          disabled={isLoading}
        />
        <div>
          <Button
            sx={{ width: "100%" }}
            variant="contained"
            onClick={() => {
              setIsLoading(true);
              returnSpeechText(text);
              setText("");
            }}
          >
            Send Message
          </Button>
        </div>
      </div>
    </div>
  )
}