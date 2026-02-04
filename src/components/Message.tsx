import React, { useEffect, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CustomTypingIndicator } from "./CustomTypingIndictor";
import { MessageTypeType } from "../utility/types/ConversationTypes";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { DialogWrapper } from "./ui-wrappers/DialogWrapper";
import { TooltipWrapper } from "./ui-wrappers/TooltipWrapper";
import {
  ChevronUp,
  ChevronDown,
  Maximize2,
  Volume2,
  VolumeX,
  Copy,
  ExternalLink,
} from "lucide-react";
import RaterEssay from "./RaterEssay";
import { truncateString } from "../utility/Helpers";
import removeMarkdown from "markdown-to-text";
import { toast } from "sonner";
import { t } from "i18next";

interface MessageProps {
  message: string;
  displayName?: string;
  typing?: boolean;
  messageType?: MessageTypeType;
  outOfContext?: boolean;
  visible?: boolean; // visible to user?
  expandableMessage?: string; //message is clickable and shows extra text in modal
  isInstructor?: boolean; //show the message if not user visible and is an instructor
  sources?: Array<any>; //web access sources
}

interface ViewSourcesProps {
  sources: Array<{ url: string; title: string; summary?: string }>; // An array of Source objects
}

const ViewSources: React.FC<ViewSourcesProps> = ({ sources }) => {
  return (
    <div className="flex flex-row gap-4 overflow-x-auto pb-4 no-scrollbar">
      {sources.map(
        (
          source: { url: string; title: string; summary?: string },
          index: number
        ) => (
          <Card
            key={index}
            className="flex-shrink-0 w-[280px] transition-all duration-200 hover:shadow-md border-t-4 border-t-primary/20"
          >
            <CardContent className="flex flex-row gap-2">
              <div className="w-4/5 p-2">
                <h4 className="font-semibold text-sm mb-2 line-clamp-3 min-h-[2.5rem]">
                  {source.title}
                </h4>
                {source.summary && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {truncateString(source.summary, 200)}
                  </p>
                )}
              </div>
              <div className="w-1/5 flex items-start justify-end">
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
                    aria-label={`${t("common.visitSource")}: ${source.title}`}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
};

export const MessageLeft = (props: MessageProps) => {
  const displayName = props.displayName ? props.displayName : "Assistant";
  const [isPlaying, setIsPlaying] = useState(false);
  const [utterance, setUtterance] = useState<any>(null);
  const [showExpandableMessage, setShowExpandableMessage] =
    useState<boolean>(false);
  const [expandableMessage] = useState(
    props.expandableMessage ? JSON.parse(props.expandableMessage) : undefined
  );

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
    toast.success(t("components.messageCopiedClipboard"));
  };

  function LinkRenderer(props: any) {
    return (
      <a
        href={props.href}
        target="_blank"
        rel="noreferrer"
        className="text-primary dark:text-gold colorful-dark:text-gold hover:text-primary/80 underline underline-offset-2 transition-colors"
      >
        {props.children}
      </a>
    );
  }

  //if empty message
  if ((props.message === "" || props.message === null) && !props.typing) {
    return <></>;
  }
  console.log(props.sources)

  return props.visible === undefined || props.visible || props.isInstructor ? (
    <div className="flex flex-col gap-2 mb-6">
      {props.expandableMessage && expandableMessage && (
        <DialogWrapper
          open={showExpandableMessage}
          onOpenChange={setShowExpandableMessage}
          title={t("chat.essayFeedback")}
          contentClassName="max-w-4xl max-h-[80vh] overflow-y-auto"
          showFooter={false}
        >
          <RaterEssay
            message={expandableMessage.message}
            raterArray={expandableMessage.rater}
            essay={expandableMessage.essay}
          />
        </DialogWrapper>
      )}

      {props.sources?.length === 0 && <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              {props.isInstructor && !props.visible && (
                <span className="text-sm">{t("common.source")} - </span>
              )}
              {displayName}
            </span>
            <div className="flex items-center gap-1">
              <TooltipWrapper content={isPlaying ? t("common.stop") : t("common.readAloud")}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={isPlaying ? handleStop : handlePlay}
                  aria-label={isPlaying ? t("common.stopReading") : t("common.readMessageAloud")}
                >
                  {isPlaying ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
              </TooltipWrapper>

              <TooltipWrapper content={t("common.copyMessage")}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={handleCopy}
                  aria-label={t("common.copyMessage")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipWrapper>
            </div>
          </div>

          {props.expandableMessage ? (
            <Button
              variant="outline"
              onClick={() => setShowExpandableMessage(true)}
              className={`w-full justify-start text-left p-4 h-auto whitespace-normal ${props.outOfContext || (!props.visible && props.isInstructor)
                ? "opacity-80 border-dashed"
                : ""
                }`}
            >
              {props.typing ? (
                <div aria-live="polite">
                  <CustomTypingIndicator />
                </div>
              ) : (
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  className="prose prose-sm max-w-none dark:prose-invert 
                  colorful-dark:prose-invert prose-headings:font-semibold 
                  prose-headings:tracking-tight prose-p:leading-relaxed prose-pre:bg-muted 
                  prose-pre:border prose-pre:border-border prose-code:bg-muted prose-code:px-1.5 
                  prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-sm 
                  prose-strong:font-semibold prose-blockquote:border-l-4 prose-blockquote:border-primary 
                  prose-blockquote:pl-4 prose-blockquote:italic prose-table:border-collapse prose-th:border 
                  prose-th:border-border prose-th:bg-muted prose-th:px-3 prose-th:py-2 prose-th:font-semibold 
                  prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2 prose-ul:list-disc 
                  prose-ol:list-decimal prose-li:marker:text-muted-foreground markdown-content"
                  components={{ a: LinkRenderer }}
                >
                  {props.message}
                </Markdown>
              )}
            </Button>
          ) : (
            <div
              className={`bg-muted rounded-lg p-4 ${props.outOfContext || (!props.visible && props.isInstructor)
                ? "opacity-80 border border-dashed"
                : ""
                }`}
            >
              {props.typing ? (
                <div aria-live="polite">
                  <CustomTypingIndicator />
                </div>
              ) : (
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  className="prose prose-sm max-w-none dark:prose-invert colorful-dark:prose-invert 
                  prose-headings:font-semibold prose-headings:tracking-tight prose-p:leading-relaxed 
                  prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-code:bg-muted 
                  prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono 
                  prose-code:text-sm prose-strong:font-semibold prose-blockquote:border-l-4 
                  prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic 
                  prose-table:border-collapse prose-th:border prose-th:border-border prose-th:bg-muted 
                  prose-th:px-3 prose-th:py-2 prose-th:font-semibold prose-td:border prose-td:border-border 
                  prose-td:px-3 prose-td:py-2 prose-ul:list-disc prose-ol:list-decimal 
                  prose-li:marker:text-muted-foreground markdown-content"
                  components={{ a: LinkRenderer }}
                >
                  {props.message}
                </Markdown>
              )}
            </div>
          )}
        </div>
      </div>}

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
    toast.success(t("components.messageCopiedClipboard"));
  };

  function LinkRenderer(props: any) {
    return (
      <a
        href={props.href}
        target="_blank"
        rel="noreferrer"
        className="text-primary dark:text-gold colorful-dark:text-gold hover:text-primary/80 underline underline-offset-2 transition-colors"
      >
        {props.children}
      </a>
    );
  }
  //Note: replace new lines with double new line for markdown
  return props.visible === undefined || props.visible || props.isInstructor ? (
    <div className="flex flex-col gap-2 mb-6">
      <div className="flex items-start gap-3 justify-end">
        <div className="flex-1 flex flex-col items-end">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1">
              <TooltipWrapper content={isPlaying ? t("common.stop") : t("common.readAloud")}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={isPlaying ? handleStop : handlePlay}
                  aria-label={isPlaying ? t("common.stopReading") : t("common.readMessageAloud")}
                >
                  {isPlaying ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
              </TooltipWrapper>

              <TooltipWrapper content={t("common.copyMessage")}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={handleCopy}
                  aria-label={t("common.copyMessage")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipWrapper>
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {props.isInstructor && !props.visible && (
                <span className="text-destructive dark:text-orange colorful-dark:text-orange">{t("common.hiddenMessage")} - </span>
              )}
              {props.displayName ? props.displayName : "You"}
            </span>
          </div>

          {props.messageType && props.messageType === "file" ? (
            <div
              className={`max-w-md ${props.outOfContext || (!props.visible && props.isInstructor)
                ? "opacity-80 border border-dashed"
                : ""
                }`}
            >
              <DialogWrapper
                open={openFileModal}
                onOpenChange={setOpenFileModal}
                title={t("chat.fileContent")}
                contentClassName="max-w-4xl max-h-[80vh] overflow-y-auto"
                showFooter={false}
              >
                <Markdown className="whitespace-pre-wrap font-mono text-sm p-4 rounded-lg">
                  {props.message.replace(/\n/g, "\n\n")}
                </Markdown>
              </DialogWrapper>

              <Card className="transition-all duration-200">
                <CardContent className="p-4">
                  <Markdown className="whitespace-pre-wrap font-mono text-sm mb-4 overflow-hidden">
                    {expandFile
                      ? props.message.replace(/\n/g, "\n\n")
                      : props.message.substring(0, 200) + "..."}
                  </Markdown>
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
                          {t("common.collapse")}
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          {t("common.expand")}
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
                      {t("common.fullscreen")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div
              className={`bg-primary/20 colorful-dark:bg-card rounded-lg p-4 max-w-md ${props.outOfContext || (!props.visible && props.isInstructor)
                ? "opacity-80 border border-dashed"
                : ""
                }`}
            >
              <Markdown
                className="prose prose-sm max-w-none dark:prose-invert colorful-dark:prose-invert 
                prose-headings:font-semibold prose-headings:tracking-tight prose-p:leading-relaxed 
                prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-code:bg-muted 
                prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono 
                prose-code:text-sm prose-strong:font-semibold prose-blockquote:border-l-4 
                prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic 
                prose-table:border-collapse prose-th:border prose-th:border-border prose-th:bg-muted 
                prose-th:px-3 prose-th:py-2 prose-th:font-semibold prose-td:border prose-td:border-border 
                prose-td:px-3 prose-td:py-2 prose-ul:list-disc prose-ol:list-decimal prose-li:marker:text-muted-foreground"
                components={{ a: LinkRenderer }}
              >
                {props.message.replace(/\n/g, "\n\n")}
              </Markdown>
            </div>
          )}
        </div>
      </div>
    </div>
  ) : null;
};
