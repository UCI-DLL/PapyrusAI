import { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Alert, AlertDescription } from "../../components/ui/alert";
import useSpeechRecognition from "../../utility/useSpeechRecognitionHook";
import { Mic, MicOff, Send, MessageSquare } from 'lucide-react';

interface ChatWizardProps {
  returnSpeechText: (text: string) => void;
}

export default function SpeechToTextModal({
  returnSpeechText,
}: ChatWizardProps): JSX.Element {
  const [text, setText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { transcript, startListening, stopListening, hasRecognitionSupport, isListening } = useSpeechRecognition();

  useEffect(() => {
    setIsLoading(false);
  }, []);

  useEffect(() => {
    setText(prev => (prev + transcript))
  }, [transcript]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
  }

  return (
    <div className="p-4 space-y-4">
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Voice to Text
          </CardTitle>
          <CardDescription>
            Record your message using voice recognition, then edit and send it to the AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription className="text-sm">
              When you are ready to record your message, click "Start Listening". 
              When you are done recording, click "Stop Listening", then wait for your message to be transcribed. 
              You can edit the transcribed message before sending it to the AI.
            </AlertDescription>
          </Alert>

          {hasRecognitionSupport ? (
            <div className="space-y-4">
              <div>
                {isListening ? (
                  <Button
                    onClick={stopListening}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    <MicOff className="mr-2 h-4 w-4" />
                    Stop Listening
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    size="lg"
                    onClick={startListening}
                  >
                    <Mic className="mr-2 h-4 w-4" />
                    Start Listening
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  name="text"
                  placeholder="Your transcribed message will appear here..."
                  className="min-h-[120px] resize-none"
                  value={text}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>

              <Button
                className="w-full"
                onClick={() => {
                  setIsLoading(true);
                  returnSpeechText(text);
                  setText("");
                }}
                disabled={isLoading || !text.trim()}
              >
                <Send className="mr-2 h-4 w-4" />
                Send Message
              </Button>
            </div>
          ) : (
            <Alert variant="destructive">
              <AlertDescription>
                Your browser does not support speech recognition. Please type your message manually or try using a different browser.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}