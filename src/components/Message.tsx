import React, { useEffect, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CustomTypingIndicator } from "./CustomTypingIndictor";
import { MessageTypeType } from "../utility/types/ConversationTypes";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { 
  ChevronUp, 
  ChevronDown, 
  Maximize2, 
  Volume2, 
  VolumeX, 
  Copy, 
  X,
  ExternalLink
} from "lucide-react";
import RaterEssay from "./RaterEssay";
import { truncateString } from "../utility/Helpers";
import removeMarkdown from "markdown-to-text";
import { toast } from "sonner";

interface MessageProps {
  message: string;
  displayName?: string;
  typing?: boolean;
  messageType?: MessageTypeType,
  outOfContext?: boolean,
  visible?: boolean, // visible to user?
  expandableMessage?: string, //message is clickable and shows extra text in modal
  isInstructor?: boolean, //show the message if not user visible and is an instructor
  sources?: Array<any> //web access sources
}

interface ViewSourcesProps {
  sources: Array<{ url: string, title: string, summary?: string }>; // An array of Source objects
}

const ViewSources: React.FC<ViewSourcesProps> = ({ sources }) => {
  return (
    <div className="space-y-3 mt-4">
      {sources.map((source: { url: string, title: string, summary?: string }, index: number) => (
        <Card key={index} className="transition-all duration-200 hover:shadow-md border-l-4 border-l-primary/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-muted-foreground">
                Source {index + 1}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-8 w-8 p-0"
              >
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Visit source: ${source.title}`}
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <h4 className="font-semibold text-sm mb-2 line-clamp-2">
              {truncateString(source.title, 50)}
            </h4>
            {source.summary && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {truncateString(source.summary, 200)}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export const MessageLeft = (props: MessageProps) => {
  const displayName = props.displayName ? props.displayName : "Assistant";
  const [isPlaying, setIsPlaying] = useState(false);
  const [utterance, setUtterance] = useState<any>(null);
  const [showExpandableMessage, setShowExpandableMessage] = useState<boolean>(false);
  const [expandableMessage] = useState(props.expandableMessage ? JSON.parse(props.expandableMessage) : undefined);

  useEffect(() => {
    const synth = window.speechSynthesis;
    const u = new SpeechSynthesisUtterance(removeMarkdown(props.message));
    u.rate = 0.9;
    u.pitch = 1;
    setUtterance(u);
    return () => {
      synth.cancel();
    };
  }, [props.message]);

  const handlePlay = () => {
    const synth = window.speechSynthesis;
    if (utterance) {
      synth.speak(utterance);
      setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
    }
  };

  const handleStop = () => {
    const synth = window.speechSynthesis;
    synth.cancel();
    setIsPlaying(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(removeMarkdown(props.message));
    toast.success("Message copied to clipboard");
  };

  function LinkRenderer(props: any) {
    return (
      <a 
        href={props.href} 
        target="_blank" 
        rel="noreferrer"
        className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
      >
        {props.children}
      </a>
    );
  }

  //if empty message
  if ((props.message === "" || props.message === null) && !props.typing) {
    return <></>;
  }

  return (props.visible === undefined || props.visible || props.isInstructor) ? (
    <div className="flex flex-col gap-2 mb-6">
      {props.expandableMessage && expandableMessage && (
        <Dialog open={showExpandableMessage} onOpenChange={setShowExpandableMessage}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Essay Feedback</DialogTitle>
            </DialogHeader>
            <RaterEssay 
              message={expandableMessage.message} 
              raterArray={expandableMessage.rater} 
              essay={expandableMessage.essay} 
            />
          </DialogContent>
        </Dialog>
      )}
      
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              {props.isInstructor && !props.visible && (
                <span className="text-sm">Sources - </span>
              )}
              {displayName}
            </span>
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={isPlaying ? handleStop : handlePlay}
                      aria-label={isPlaying ? "Stop reading" : "Read message aloud"}
                    >
                      {isPlaying ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isPlaying ? "Stop" : "Read aloud"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={handleCopy}
                      aria-label="Copy message"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy message</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          
          {props.expandableMessage ? (
            <Button
              variant="outline"
              onClick={() => setShowExpandableMessage(true)}
              className={`w-full justify-start text-left p-4 h-auto whitespace-normal ${
                (props.outOfContext || (!props.visible && props.isInstructor)) 
                  ? "opacity-60 border-dashed" 
                  : ""
              }`}
            >
              {props.typing ? (
                <CustomTypingIndicator />
              ) : (
                <Markdown 
                  remarkPlugins={[remarkGfm]} 
                  className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-p:leading-relaxed prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-sm prose-strong:font-semibold prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-table:border-collapse prose-th:border prose-th:border-border prose-th:bg-muted prose-th:px-3 prose-th:py-2 prose-th:font-semibold prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2 prose-ul:list-disc prose-ol:list-decimal prose-li:marker:text-muted-foreground markdown-content"
                  components={{ a: LinkRenderer }}
                >
                  {props.message}
                </Markdown>
              )}
            </Button>
          ) : (
            <div className={`bg-muted/50 rounded-lg p-4 ${
              (props.outOfContext || (!props.visible && props.isInstructor)) 
                ? "opacity-60 border border-dashed" 
                : ""
            }`}>
              {props.typing ? (
                <CustomTypingIndicator />
              ) : (
                <Markdown 
                  remarkPlugins={[remarkGfm]} 
                  className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-p:leading-relaxed prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-sm prose-strong:font-semibold prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-table:border-collapse prose-th:border prose-th:border-border prose-th:bg-muted prose-th:px-3 prose-th:py-2 prose-th:font-semibold prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2 prose-ul:list-disc prose-ol:list-decimal prose-li:marker:text-muted-foreground markdown-content"
                  components={{ a: LinkRenderer }}
                >
                  {props.message}
                </Markdown>
              )}
            </div>
          )}
        </div>
      </div>
      
      {props.sources && <ViewSources sources={props.sources} />}
    </div>
  ) : props.sources ? (
    <ViewSources sources={props.sources} />
  ) : null;
};


export const MessageRight = (props: MessageProps) => {
  const [openFileModal, setOpenFileModal] = useState<boolean>(false);
  const [expandFile, setExpandFile] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [utterance, setUtterance] = useState<any>(null);

  useEffect(() => {
    const synth = window.speechSynthesis;
    const u = new SpeechSynthesisUtterance(removeMarkdown(props.message));
    u.rate = 0.9;
    u.pitch = 1;
    setUtterance(u);
    return () => {
      synth.cancel();
    };
  }, [props.message]);

  const handlePlay = () => {
    const synth = window.speechSynthesis;
    if (utterance) {
      synth.speak(utterance);
      setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
    }
  };

  const handleStop = () => {
    const synth = window.speechSynthesis;
    synth.cancel();
    setIsPlaying(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(removeMarkdown(props.message));
    toast.success("Message copied to clipboard");
  };

  function LinkRenderer(props: any) {
    return (
      <a 
        href={props.href} 
        target="_blank" 
        rel="noreferrer"
        className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
      >
        {props.children}
      </a>
    );
  }

  return (props.visible === undefined || props.visible || props.isInstructor) ? (
    <div className="flex flex-col gap-2 mb-6">
      <div className="flex items-start gap-3 justify-end">
        <div className="flex-1 flex flex-col items-end">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={isPlaying ? handleStop : handlePlay}
                      aria-label={isPlaying ? "Stop reading" : "Read message aloud"}
                    >
                      {isPlaying ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isPlaying ? "Stop" : "Read aloud"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={handleCopy}
                      aria-label="Copy message"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copy message</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {props.isInstructor && !props.visible && (
                <span className="text-destructive">Hidden Message - </span>
              )}
              {props.displayName ? props.displayName : "You"}
            </span>
          </div>
          
          {props.messageType && props.messageType === "file" ? (
            <div className={`max-w-md ${
              (props.outOfContext || (!props.visible && props.isInstructor)) 
                ? "opacity-60 border border-dashed" 
                : ""
            }`}>
              <Dialog open={openFileModal} onOpenChange={setOpenFileModal}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>File Content</DialogTitle>
                  </DialogHeader>
                  <div className="whitespace-pre-wrap font-mono text-sm p-4 rounded-lg">
                    {props.message}
                  </div>
                </DialogContent>
              </Dialog>
              
              <Card className="transition-all duration-200">
                <CardContent className="p-4">
                  <div className="whitespace-pre-wrap font-mono text-sm mb-4 max-h-32 overflow-hidden">
                    {expandFile ? props.message : props.message.substring(0, 200) + "..."}
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandFile(!expandFile)}
                      className="flex items-center gap-2"
                    >
                      {expandFile ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          Collapse
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          Expand
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setOpenFileModal(true)}
                      className="flex items-center gap-2"
                    >
                      <Maximize2 className="h-4 w-4" />
                      Fullscreen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className={`bg-primary/10 rounded-lg p-4 max-w-md ${
              (props.outOfContext || (!props.visible && props.isInstructor)) 
                ? "opacity-60 border border-dashed" 
                : ""
            }`}>
              <Markdown 
                className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-p:leading-relaxed prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-sm prose-strong:font-semibold prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-table:border-collapse prose-th:border prose-th:border-border prose-th:bg-muted prose-th:px-3 prose-th:py-2 prose-th:font-semibold prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2 prose-ul:list-disc prose-ol:list-decimal prose-li:marker:text-muted-foreground" 
                components={{ a: LinkRenderer }}
              >
                {props.message}
              </Markdown>
            </div>
          )}
        </div>
      </div>
    </div>
  ) : null;
};
