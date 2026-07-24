import React, { useEffect, useRef, useState } from "react";
import { MessageLeft, MessageRight } from "../../../components/Message";
import { MessageCircle, ChevronDown, ChevronUp, CheckCircle, Clock, FileText } from "lucide-react";
import { MessageType } from "../../../utility/types/ConversationTypes";
import { ModuleType, GradeScore } from "../../../utility/types/CourseTypes";
import { UserType } from "../../../utility/types/UserTypes";
import ChatWizard from "../ChatWizard";
import EssayWizard from "../EssayWizard";
import { useTranslation } from "../../../hooks/useTranslation";
import { Badge } from "../../../components/ui/badge";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMessagesProps {
  messages: MessageType[];
  moduleInfo: ModuleType;
  user?: UserType | null;
  viewUser?: UserType;
  showWizard: boolean;
  showTypingIndicator: boolean;
  messageNote?: string;
  conversationCompleted: boolean;
  instructor: string;
  admin: string;
  conversationArchived: boolean;
  canStartNewConversation?: boolean;
  onWizardReturnPrompts: (selectedPrompt: string) => void;
  onWizardReturnEssay: (essay: string, message?: string) => void;
  newConversation: () => void;
  gradeResult?: { scores: GradeScore[]; totalScore: number; instructorNotes?: string } | null;
  gradePending?: boolean;
  gradeError?: string;
  isEssayMode?: boolean;
  onScrolledUpChange?: (up: boolean) => void;
  scrollToBottomRef?: React.MutableRefObject<(() => void) | null>;
}

export default function ChatMessages({
  messages,
  moduleInfo,
  user,
  viewUser,
  showWizard,
  showTypingIndicator,
  messageNote,
  conversationCompleted,
  instructor,
  admin,
  conversationArchived,
  canStartNewConversation = true,
  onWizardReturnPrompts,
  onWizardReturnEssay,
  newConversation,
  gradeResult,
  gradePending,
  gradeError,
  isEssayMode = false,
  onScrolledUpChange,
  scrollToBottomRef,
}: ChatMessagesProps): JSX.Element {
  const { t } = useTranslation();
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const containerRef = useRef<null | HTMLDivElement>(null);
  const shouldAutoScroll = useRef(true);
  const [essayExpanded, setEssayExpanded] = useState(false);
  const [gradeExpanded, setGradeExpanded] = useState(true);
  const [expandedCriteria, setExpandedCriteria] = useState<Set<number>>(new Set());

  const scrollToBottom = () => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  };

  if (scrollToBottomRef) scrollToBottomRef.current = scrollToBottom;

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const scrolledUp = distanceFromBottom > 100;
    onScrolledUpChange?.(scrolledUp);
    shouldAutoScroll.current = !scrolledUp;
  };

  //screen reader new message announcement
  const [srAnnouncement, setSrAnnouncement] = React.useState("");

  const isCurrentUser = user && viewUser && user.username === viewUser.username;
  const isInstructor = user?.groups.includes(instructor) || user?.groups.includes(admin);

  // Show essay wizard for rater enabled modules
  const showEssayWizard = isCurrentUser &&
    messages.length < 1 &&
    moduleInfo?.raterEnabled;

  // Show regular wizard for prompt-based modules
  const showPromptWizard = showWizard && !showEssayWizard && !showTypingIndicator;

  // Show empty state when no messages and no wizards
  const showEmptyState = (messages.length === 0 &&
    !showPromptWizard &&
    !showEssayWizard) ||
    (!isInstructor && conversationArchived);

  // Find essay message index for inserting grade card after it
  const essayMessageIndex = isEssayMode
    ? messages.findIndex(m => m.role === "user" && m.messageType === "essayDraft")
    : -1;

  // Rubric max scores
  const rubric = moduleInfo?.rubrics?.[0];
  const maxPerCriterion = rubric
    ? Math.max(...rubric.columns.map(Number).filter(Number.isFinite))
    : undefined;
  const maxTotal = maxPerCriterion !== undefined
    ? (rubric?.criteria.length ?? 0) * maxPerCriterion
    : undefined;

  useEffect(() => { //handles new message announcement
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant") return;

    // Wait briefly so SR only reads chunks, not every token
    const timeout = setTimeout(() => {
      setSrAnnouncement(last.content);
    }, last.finished ? 600 : 200);

    return () => clearTimeout(timeout);
  }, [messages]);

  // Scroll to bottom on mount
  useEffect(() => {
    scrollToBottom();
  }, []);

  // Auto-scroll when messages update; reset auto-scroll flag when streaming finishes
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    const streamingFinished = lastMessage?.role === "assistant" && lastMessage?.finished;

    if (shouldAutoScroll.current) {
      scrollToBottom();
    }

    // Once streaming finishes, re-enable auto-scroll so the next message scrolls down
    if (streamingFinished) {
      shouldAutoScroll.current = true;
    }
  }, [messages]);

  function renderEssayCard(message: MessageType) {
    const preview = message.content
      .split("\n")
      .filter(l => l.trim())
      .slice(0, 3)
      .join(" ")
      .slice(0, 200);

    return (
      <div className="border rounded-xl bg-muted/30 overflow-hidden">
        <button
          onClick={() => setEssayExpanded(p => !p)}
          className="w-full flex items-start justify-between gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
        >
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary shrink-0" />
              <span className="font-semibold text-sm">{t("reviewChat.submittedEssay")}</span>
            </div>
            {!essayExpanded && preview && (
              <p className="text-xs text-muted-foreground truncate">
                {preview}{message.content.length > 200 ? "…" : ""}
              </p>
            )}
          </div>
          {essayExpanded
            ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />}
        </button>
        {essayExpanded && (
          <div className="px-4 pb-4 border-t border-border/50">
            <p className="text-sm whitespace-pre-wrap mt-3 text-foreground/90">{message.content}</p>
          </div>
        )}
      </div>
    );
  }

  function renderGradeCard() {
    if (gradeError) {
      return (
        <div className="p-4 border border-destructive rounded-xl bg-destructive/10">
          <p className="text-destructive text-sm">{gradeError}</p>
        </div>
      );
    }
    if (gradePending) {
      return (
        <div className="p-6 border rounded-xl bg-card flex flex-col items-center gap-3 text-center">
          <Clock className="h-10 w-10 text-primary opacity-70" />
          <div>
            <h3 className="font-bold text-base">{t("reviewChat.pendingTitle")}</h3>
            <p className="text-muted-foreground text-sm mt-1">{t("reviewChat.pendingDescription")}</p>
          </div>
        </div>
      );
    }
    if (gradeResult) {
      return (
        <div className="border rounded-xl bg-card overflow-hidden">
          <button
            onClick={() => setGradeExpanded(p => !p)}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
              <div>
                <span className="font-semibold text-sm">{t("reviewChat.gradeResult")}</span>
                <span className="text-muted-foreground text-sm ml-2">
                  {t("reviewChat.totalScore")}:{" "}
                  <span className="font-semibold text-foreground">
                    {gradeResult.totalScore}{maxTotal !== undefined ? ` / ${maxTotal}` : ""}
                  </span>
                </span>
              </div>
            </div>
            {gradeExpanded
              ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
          </button>
          {gradeExpanded && (
            <div className="p-2 border-t border-border/50 space-y-2 mt-3">
              {gradeResult.scores.map((score, i) => {
                const criterionOpen = expandedCriteria.has(i);
                return (
                  <div key={i} className="border rounded-lg bg-background overflow-hidden">
                    <button
                      onClick={() => setExpandedCriteria(prev => {
                        const next = new Set(prev);
                        next.has(i) ? next.delete(i) : next.add(i);
                        return next;
                      })}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-muted/30 transition-colors"
                    >
                      <span className="font-semibold text-sm">{score.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="secondary" className="text-xs">
                          {score.score}{maxPerCriterion !== undefined ? ` / ${maxPerCriterion}` : ""}
                        </Badge>
                        {score.feedback && (criterionOpen
                          ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                          : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />)}
                      </div>
                    </button>
                    {criterionOpen && score.feedback && (
                      <div className="px-3 pb-3 border-t border-border/50">
                        <Markdown
                          remarkPlugins={[remarkGfm]}
                          className="prose prose-sm max-w-none dark:prose-invert colorful-dark:prose-invert mt-2
                            prose-p:text-muted-foreground prose-p:leading-relaxed
                            prose-strong:font-semibold prose-ul:list-disc prose-ol:list-decimal
                            prose-li:marker:text-muted-foreground"
                        >
                          {score.feedback}
                        </Markdown>
                      </div>
                    )}
                  </div>
                );
              })}
              {gradeResult.instructorNotes && (
                <div className="border rounded-lg p-3 bg-primary/5 border-primary/20">
                  <p className="text-xs font-semibold text-primary mb-1">{t("reviewChat.instructorNotes")}</p>
                  <p className="text-sm text-foreground/90">{gradeResult.instructorNotes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    return null;
  }

  const hasGradeContent = !!(gradeResult || gradePending || gradeError);

  return (
    <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto relative">
      <div className="p-4 max-w-4xl mx-auto">
        {/* Essay Wizard */}
        {showEssayWizard && (
          <div className="mb-6">
            <EssayWizard
              prompts={
                moduleInfo.prompts && moduleInfo.prompts.length > 0
                  ? moduleInfo.prompts
                  : undefined
              }
              returnEssay={onWizardReturnEssay}
            />
          </div>
        )}

        {/* Prompt Wizard */}
        {showPromptWizard && (
          <div className="mb-6">
            <ChatWizard
              prompts={moduleInfo.prompts}
              returnPrompt={onWizardReturnPrompts}
            />
          </div>
        )}

        {/* Empty State */}
        {showEmptyState ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
            <div className="bg-card border border-border rounded-lg p-8 max-w-md text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h2 className="text-lg font-semibold mb-2">{t("chat.startConversation")}</h2>
              <p className="text-sm text-muted-foreground mb-4">
                {moduleInfo?.moduleDescription}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("chat.startConversationDescription")}
                {isInstructor ? (
                  <a
                    href="https://docs.google.com/document/d/1o3He0CdgV7hJOX65gc3Gpf3_Fr3GYvSm4Q-i-Y5cNHQ/edit?tab=t.0#heading=h.7e2lilt0vxyx"
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2 hover:no-underline text-primary dark:text-gold colorful-dark:text-gold font-medium"
                  >
                    {t("chat.conversationListDescriptionLinkText")}
                  </a>
                ) : (
                  <a
                    href="https://docs.google.com/document/d/1hVXs5RwWi8Pau1YlhwoF5Y5zO3-1hMZAyUxych7iIDo/edit?tab=t.0#heading=h.ap3bxaogq8pi"
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2 hover:no-underline text-primary dark:text-gold colorful-dark:text-gold font-medium"
                  >
                    {t("chat.conversationListDescriptionLinkText")}
                  </a>
                )}
                .
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Messages — hidden while prompt wizard is active */}
            {!showPromptWizard && messages.length > 0 && (
              <div className="space-y-4">
                {messages.map((message, index) => {
                  const isContextDivider =
                    index ===
                    messages.findIndex((message: MessageType) => !message.inContext);

                  const isLastMessage = index === messages.length - 1;
                  const isStreamingAssistant = message.role === "assistant" && isLastMessage && message.finished ? false : true;

                  // Essay message — render as special card
                  const isEssayMessage = index === essayMessageIndex;

                  return (
                    <React.Fragment key={message.id}>
                      {isContextDivider && (
                        <div className="relative flex items-center justify-center my-6">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground font-medium">
                              {t("chat.inContext")}
                            </span>
                          </div>
                        </div>
                      )}

                      {isEssayMessage ? (
                        <>
                          {renderEssayCard(message)}
                          {/* Grade card immediately after the essay */}
                          {index === essayMessageIndex && hasGradeContent && (
                            <div className="mt-2">
                              {renderGradeCard()}
                            </div>
                          )}
                        </>
                      ) : message.role === "assistant" ? isStreamingAssistant ? (
                        /* wrap message with aria-hidden when streaming message  */
                        <div aria-hidden="true">
                          <MessageLeft
                            id={message.id}
                            message={message.content}
                            displayName={
                              ["ChatGPT", "AI", "Papyrus", "PapyrusAI"].includes(message.sender) ? "Papyrus" : message.sender
                            }
                            messageType={message.messageType}
                            outOfContext={message.inContext ? true : false}
                            visible={
                              message.userVisible === undefined || message.userVisible
                                ? true
                                : false
                            }
                            expandableMessage={
                              message.expandableMessage && message.expandableMessage !== ""
                                ? message.expandableMessage
                                : undefined
                            }
                            isInstructor={isInstructor}
                            sources={
                              message.sources
                                ? typeof message.sources === "string"
                                  ? JSON.parse(message.sources)
                                  : message.sources
                                : []
                            }
                          />
                        </div>
                      ) : (
                        <MessageLeft
                          id={message.id}
                          message={message.content}
                          displayName={
                            ["ChatGPT", "AI"].includes(message.sender) ? "Papyrus" : message.sender
                          }
                          messageType={message.messageType}
                          outOfContext={message.inContext ? true : false}
                          visible={
                            message.userVisible === undefined || message.userVisible
                              ? true
                              : false
                          }
                          expandableMessage={
                            message.expandableMessage && message.expandableMessage !== ""
                              ? message.expandableMessage
                              : undefined
                          }
                          isInstructor={isInstructor}
                          sources={
                            message.sources
                              ? typeof message.sources === "string"
                                ? JSON.parse(message.sources)
                                : message.sources
                              : []
                          }
                        />
                      ) : !moduleInfo?.showInitialPrompt && message?.promptId ? null : (
                        <MessageRight
                          id={message.id}
                          message={message.content}
                          displayName={viewUser?.name}
                          messageType={message.messageType}
                          outOfContext={message.inContext ? true : false}
                          visible={
                            message.userVisible === undefined || message.userVisible
                              ? true
                              : false
                          }
                          isInstructor={isInstructor}
                        />
                      )}
                    </React.Fragment>
                  );
                })}

                {/* Grade card for non-essay review modules — shown after all messages */}
                {!isEssayMode && hasGradeContent && (
                  <div>{renderGradeCard()}</div>
                )}

                {/* Typing Indicator */}
                {showTypingIndicator && (
                  <MessageLeft id={""} message={""} displayName={"Papyrus"} typing />
                )}

                {/* screen reader announcement  */}
                <div
                  aria-live="polite"
                  aria-atomic="true"
                  style={{ //sr-only messes up the styling of everything else
                    position: 'absolute',
                    left: '-9999px',
                    width: '1px',
                    height: '1px',
                    overflow: 'hidden'
                  }}
                >
                  {srAnnouncement}
                </div>


                {/* Message Note */}
                {messageNote && (
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-4">
                    <p className="text-sm text-primary/80">{messageNote}</p>
                  </div>
                )}

                {/* Conversation Completed Message (regular chat only — review modules show a badge above) */}
                {conversationCompleted && moduleInfo?.moduleType !== "review" && (
                  <div className="text-center py-8 border-t border-border mt-6">
                    <div className="pb-4 text-muted-foreground text-sm max-w-md mx-auto">
                      {moduleInfo?.essaySubmission
                        ? t("chat.reviewConvoCompletedDescription")
                        : t("chat.flaggedConvoDescription")}
                    </div>
                    {(!moduleInfo?.essaySubmission || canStartNewConversation) && (
                      <button
                        onClick={newConversation}
                        className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                      >
                        {t("chat.newConversation")}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} className="h-1" />
      </div>

    </div>
  );
}
