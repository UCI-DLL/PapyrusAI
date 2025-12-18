import React, { useState } from "react";
import { Button } from "../../../components/ui/button";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { TooltipWrapper } from "../../../components/ui-wrappers/TooltipWrapper";
import { Send, Paperclip, Mic, AlertCircle } from "lucide-react";
import { removeSpecialCharacters } from "../../../utility/Helpers";
import { AutosizeTextarea } from '../../../components/ui/autosize-textarea';
import { useTranslation } from "../../../hooks/useTranslation";

interface ChatInputProps {
  isConnected: boolean;
  isLoading: boolean;
  chatError?: string;
  onSubmit: (message: string) => void;
  onOpenDocumentModal: () => void;
  onOpenSpeechToTextModal: () => void;
  disabled?: boolean;
}

export default function ChatInput({
  isConnected,
  isLoading,
  chatError,
  onSubmit,
  onOpenDocumentModal,
  onOpenSpeechToTextModal,
  disabled = false,
}: ChatInputProps): JSX.Element | null {
  const { t } = useTranslation();
  const [message, setMessage] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || disabled || !isConnected) return;

    if (message.length > 100000) {
      return;
    }

    onSubmit(message);
    setMessage("");
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length < 100000) {
      setMessage(removeSpecialCharacters(e.target.value));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      setMessage((prev) => prev + "\n");
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!isConnected || disabled) {
    return null;
  }

  return (
    <div className="border-t border-border bg-card flex-shrink-0 sticky bottom-0 z-10 w-full">
      <div className="p-4 max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="w-full">
          <div className="relative flex lg:items-start gap-2 p-2 border rounded-lg bg-background shadow-sm md:pb-1 items-center">
            <TooltipWrapper content={t("chat.addFile")} side="top">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 my-1 text-muted-foreground dark:hover:text-foreground colorful-dark:hover:text-foreground transition-colors"
                onClick={onOpenDocumentModal}
                aria-label={t("chat.addFile")}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </TooltipWrapper>

            <AutosizeTextarea
              aria-label={t("chat.messageInput")}
              placeholder={t("chat.enterMessage")}
              value={message}
              disabled={isLoading}
              className="flex-1 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm leading-6"
              onChange={handleMessageChange}
              onKeyDown={handleKeyDown}
              maxHeight={200}
              minHeight={30}
              style={{ height: "30px" }}
            />

            <div className="flex flex-col md:flex-row">
              <TooltipWrapper content={t("chat.speechToText")} side="top">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 my-1 text-muted-foreground dark:hover:text-foreground colorful-dark:hover:text-foreground transition-colors"
                  onClick={onOpenSpeechToTextModal}
                  aria-label={t("chat.speechToText")}
                >
                  <Mic className="h-4 w-4" />
                </Button>
              </TooltipWrapper>

              <Button
                type="submit"
                size="sm"
                className="h-8 w-8 my-1 md:m-1 bg-primary hover:bg-primary/90 transition-colors"
                disabled={isLoading || !message.trim()}
                aria-label={t("chat.sendMessage")}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

          </div>
        </form>

        {chatError && (
          <Alert className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{chatError}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
