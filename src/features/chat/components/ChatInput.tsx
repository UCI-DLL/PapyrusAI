import React, { useState } from "react";
import { Button } from "../../../components/ui/button";
import { Textarea } from "../../../components/ui/textarea";
import { Alert, AlertDescription } from "../../../components/ui/alert";
import { TooltipWrapper } from "../../../components/ui-wrappers/TooltipWrapper";
import { Send, Paperclip, Mic, AlertCircle } from "lucide-react";
import { removeSpecialCharacters } from "../../../utility/Helpers";

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
    <div className="border-t border-border bg-card flex-shrink-0 lg:sticky lg:bottom-0 z-10">
      <div className="p-4 max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="w-full">
          <div className="relative flex items-end gap-3 p-3 border rounded-lg bg-background shadow-sm">
            <TooltipWrapper content="Add file" side="top">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground transition-colors"
                onClick={onOpenDocumentModal}
                aria-label="Add file"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </TooltipWrapper>

            <Textarea
              placeholder="Ask me anything about your studies..."
              value={message}
              disabled={isLoading}
              className="flex-1 min-h-[44px] max-h-[120px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm leading-6"
              onChange={handleMessageChange}
              onKeyDown={handleKeyDown}
            />

            <TooltipWrapper content="Speech to text" side="top">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground transition-colors"
                onClick={onOpenSpeechToTextModal}
                aria-label="Speech to text"
              >
                <Mic className="h-4 w-4" />
              </Button>
            </TooltipWrapper>

            <Button
              type="submit"
              size="sm"
              className="h-8 w-8 p-0 bg-primary hover:bg-primary/90 transition-colors"
              disabled={isLoading || !message.trim()}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
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
