import { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Alert, AlertDescription } from "../../components/ui/alert";
import useSpeechRecognition from "../../utility/useSpeechRecognitionHook";
import { Mic, MicOff, Send, MessageSquare } from 'lucide-react';
import { useTranslation } from "../../hooks/useTranslation";

interface ChatWizardProps {
  returnSpeechText: (text: string) => void;
}

export default function SpeechToTextModal({
  returnSpeechText,
}: ChatWizardProps): JSX.Element {
  const { t } = useTranslation();
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
            {t("chat.voiceToText")}
          </CardTitle>
          <CardDescription>
            {t("chat.voiceToTextDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription className="text-sm">
              {t("chat.voiceToTextDescription2")}
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
                    {t("chat.stopListening")}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    size="lg"
                    onClick={startListening}
                  >
                    <Mic className="mr-2 h-4 w-4" />
                    {t("chat.startListening")}
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">{t("chat.message")}</Label>
                <Textarea
                  id="message"
                  name="text"
                  placeholder={t("chat.transcribedMessageHere")}
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
                {t("chat.sendMessage")}
              </Button>
            </div>
          ) : (
            <Alert variant="destructive">
              <AlertDescription>
                {t("chat.voiceError")}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}