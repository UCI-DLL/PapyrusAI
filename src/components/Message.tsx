//reference: https://codesandbox.io/s/material-ui-chat-drh4l?file=/src/Message.js:0-4329
//reference: https://edvins.io/react-text-to-speech

import React, { useEffect, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CustomTypingIndicator } from "./CustomTypingIndictor";
import { MessageTypeType } from "../utility/types/ConversationTypes";
import {
  ChevronUp,
  ChevronDown,
  Expand,
  Volume2,
  VolumeX,
  Copy,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { cn } from "../lib/utils";
import RaterEssay from "./RaterEssay";
// Using native browser clipboard notification

interface MessageProps {
  message: string;
  displayName?: string;
  typing?: boolean;
  messageType?: MessageTypeType;
  outOfContext?: boolean;
  visible?: boolean; // visible to user?
  expandableMessage?: string; //message is clickable and shows extra text in modal
  isInstructor?: boolean; //show the message if not user visible and is an instructor
}

export const MessageLeft = (props: MessageProps) => {
  const displayName = props.displayName ? props.displayName : "Displayname";
  const [isPlaying, setIsPlaying] = useState(false);
  const [utterance, setUtterance] = useState<any>(null);
  const [showExpandableMessage, setShowExpandableMessage] =
    useState<boolean>(false);
  const [expandableMessage] = useState(
    props.expandableMessage ? JSON.parse(props.expandableMessage) : undefined
  );

  useEffect(() => {
    const synth = window.speechSynthesis;
    const u = new SpeechSynthesisUtterance(props.message);
    setUtterance(u);
    return () => {
      synth.cancel();
    };
  }, [props.message]);

  const handlePlay = () => {
    const synth = window.speechSynthesis;
    synth.speak(utterance);
    setIsPlaying(true);
  };

  const handleStop = () => {
    const synth = window.speechSynthesis;
    synth.cancel();
    setIsPlaying(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(props.message);
    // Simple feedback without external toast library
    // Could implement a temporary state change here if needed
  };

  //if empty message
  if (props.message === "" && !props.typing) {
    return <></>;
  }

  return props.visible === undefined || props.visible || props.isInstructor ? (
    <div className="flex flex-col mb-3">
      {props.expandableMessage && expandableMessage ? (
        <Dialog open={showExpandableMessage} onOpenChange={setShowExpandableMessage}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Essay Feedback</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <RaterEssay
                message={expandableMessage.message}
                raterArray={expandableMessage.rater}
                essay={expandableMessage.essay}
              />
            </div>
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => setShowExpandableMessage(false)}
              >
                Back to Conversation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}

      <div className="flex items-center gap-2 mb-1 pl-2 text-xs text-muted-foreground">
        {props.isInstructor && !props.visible && (
          <span className="text-orange font-medium">Hidden - </span>
        )}
        <span className="font-medium">{displayName}</span>

        <TooltipProvider>
          <div className="flex items-center gap-0.5 ml-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 transition-colors"
                  onClick={isPlaying ? handleStop : handlePlay}
                >
                  {isPlaying ? (
                    <VolumeX className="h-2.5 w-2.5" />
                  ) : (
                    <Volume2 className="h-2.5 w-2.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isPlaying ? "Stop" : "Play"}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 transition-colors"
                  onClick={handleCopy}
                >
                  <Copy className="h-2.5 w-2.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      {props.expandableMessage ? (
        <Button
          variant="outline"
          onClick={() => setShowExpandableMessage(true)}
          className={cn(
            "ml-2 mr-auto max-w-[85%] sm:max-w-[80%] md:max-w-[75%] min-h-[2rem] h-auto p-3 text-left justify-start whitespace-pre-wrap",
            "bg-card hover:bg-muted/60 border border-border rounded-lg rounded-bl-none transition-colors",
            (props.outOfContext || (!props.visible && props.isInstructor)) &&
              "opacity-60 bg-muted/30"
          )}
        >
          {props.typing ? (
            <CustomTypingIndicator />
          ) : (
            <Markdown
              remarkPlugins={[remarkGfm]}
              className="prose prose-xs max-w-none dark:prose-invert"
            >
              {props.message}
            </Markdown>
          )}
        </Button>
      ) : (
        <div
          className={cn(
            "ml-2 mr-auto max-w-[85%] sm:max-w-[80%] md:max-w-[75%] p-3",
            "bg-card border border-border rounded-lg rounded-bl-none shadow-sm",
            (props.outOfContext || (!props.visible && props.isInstructor)) &&
              "opacity-60 bg-muted/30"
          )}
        >
          {props.typing ? (
            <CustomTypingIndicator />
          ) : (
            <Markdown
              remarkPlugins={[remarkGfm]}
              className="prose prose-xs max-w-none dark:prose-invert text-card-foreground"
            >
              {props.message}
            </Markdown>
          )}
        </div>
      )}
    </div>
  ) : null;
};

export const MessageRight = (props: MessageProps) => {
  const [openFileModal, setOpenFileModal] = useState<boolean>(false);
  const [expandFile, setExpandFile] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [utterance, setUtterance] = useState<any>(null);

  useEffect(() => {
    const synth = window.speechSynthesis;
    const u = new SpeechSynthesisUtterance(props.message);
    setUtterance(u);
    return () => {
      synth.cancel();
    };
  }, [props.message]);

  const handlePlay = () => {
    const synth = window.speechSynthesis;
    synth.speak(utterance);
    setIsPlaying(true);
  };

  const handleStop = () => {
    const synth = window.speechSynthesis;
    synth.cancel();
    setIsPlaying(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(props.message);
    // Simple feedback without external toast library
    // Could implement a temporary state change here if needed
  };

  function LinkRenderer(props: any) {
    return (
      <a
        href={props.href}
        target="_blank"
        rel="noreferrer"
        className="text-primary-foreground underline hover:no-underline"
      >
        {props.children}
      </a>
    );
  }

  return props.visible === undefined || props.visible || props.isInstructor ? (
    <div className="flex flex-col mb-3">
      <div className="flex items-center gap-2 mb-1 pr-2 justify-end text-xs text-muted-foreground">
        <TooltipProvider>
          <div className="flex items-center gap-0.5 mr-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 transition-colors"
                  onClick={handleCopy}
                >
                  <Copy className="h-2.5 w-2.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 transition-colors"
                  onClick={isPlaying ? handleStop : handlePlay}
                >
                  {isPlaying ? (
                    <VolumeX className="h-2.5 w-2.5" />
                  ) : (
                    <Volume2 className="h-2.5 w-2.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isPlaying ? "Stop" : "Play"}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        {props.isInstructor && !props.visible && (
          <span className="text-orange font-medium">Hidden - </span>
        )}
        <span className="font-medium">
          {props.displayName ? props.displayName : "You"}
        </span>
      </div>

      {props.messageType && props.messageType === "file" ? (
        <div
          className={cn(
            "mr-2 ml-auto max-w-[85%] sm:max-w-[80%] md:max-w-[75%] p-3",
            "bg-primary text-primary-foreground rounded-lg rounded-br-none shadow-sm",
            (props.outOfContext || (!props.visible && props.isInstructor)) &&
              "opacity-60 bg-primary/50"
          )}
        >
          <Dialog open={openFileModal} onOpenChange={setOpenFileModal}>
            <DialogContent className="max-w-4xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>Full Document</DialogTitle>
              </DialogHeader>
              <div className="overflow-auto max-h-[60vh] p-4 bg-muted rounded-md">
                <pre className="whitespace-pre-wrap text-sm">
                  {props.message}
                </pre>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setOpenFileModal(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="bg-primary-foreground/10 rounded-md p-2 mb-2">
            <div className="text-xs whitespace-pre-wrap">
              {expandFile
                ? props.message
                : props.message.substring(0, 150) + "..."}
            </div>
          </div>

          <div className="flex items-center gap-1 pt-1 border-t border-primary-foreground/20">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandFile(!expandFile)}
              className="h-auto p-1 text-primary-foreground hover:bg-primary-foreground/20 transition-colors text-xs"
            >
              {expandFile ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Collapse
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Expand
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpenFileModal(true)}
              className="h-auto p-1 text-primary-foreground hover:bg-primary-foreground/20 transition-colors text-xs"
            >
              <Expand className="h-3 w-3 mr-1" />
              Fullscreen
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "mr-2 ml-auto max-w-[85%] sm:max-w-[80%] md:max-w-[75%] p-3",
            "bg-primary text-primary-foreground rounded-lg rounded-br-none shadow-sm",
            (props.outOfContext || (!props.visible && props.isInstructor)) &&
              "opacity-60 bg-primary/50"
          )}
        >
          <Markdown
            className="prose prose-xs max-w-none prose-invert"
            components={{ a: LinkRenderer }}
          >
            {props.message}
          </Markdown>
        </div>
      )}
    </div>
  ) : null;
};
