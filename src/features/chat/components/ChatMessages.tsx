import React, { useEffect, useRef } from "react";
import { MessageLeft, MessageRight } from "../../../components/Message";
import { MessageCircle } from "lucide-react";
import { MessageType } from "../../../utility/types/ConversationTypes";
import { ModuleType } from "../../../utility/types/CourseTypes";
import { UserType } from "../../../utility/types/UserTypes";
import ChatWizard from "../ChatWizard";
import EssayWizard from "../EssayWizard";
import { useTranslation } from "../../../hooks/useTranslation";

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
  onWizardReturnPrompts: (selectedPrompt: string) => void;
  onWizardReturnEssay: (essay: string, message?: string) => void;
  newConversation: () => void;
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
  onWizardReturnPrompts,
  onWizardReturnEssay,
  newConversation,
}: ChatMessagesProps): JSX.Element {
  const { t } = useTranslation();
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

  useEffect(() => { //handles new message announcement
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant") return;

    // Wait briefly so SR only reads chunks, not every token
    const timeout = setTimeout(() => {
      setSrAnnouncement(last.content);
    }, last.finished ? 600 : 200);

    return () => clearTimeout(timeout);
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, showTypingIndicator]);

  return (
    <div className="flex-1 lg:overflow-y-auto">
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
                {moduleInfo.moduleDescription}
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
            {/* Messages */}
            {messages.length > 0 && (
              <div className="space-y-4">
                {messages.map((message, index) => {
                  const isContextDivider =
                    index ===
                    messages.findIndex((message: MessageType) => !message.inContext);

                  const isLastMessage = index === messages.length - 1;
                  const isStreamingAssistant = message.role === "assistant" && isLastMessage && message.finished ? false : true;

                  return (
                    <React.Fragment>
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

                      {/* wrap message with aria-hidden when streaming message  */}
                      {message.role === "assistant" ? isStreamingAssistant ? (
                        <div aria-hidden="true">
                          <MessageLeft
                            message={message.content}
                            displayName={
                              message.sender === "ChatGPT" ? "Papyrus" : message.sender
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
                          message={message.content}
                          displayName={
                            message.sender === "ChatGPT" ? "Papyrus" : message.sender
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
                      ) : !moduleInfo.showInitialPrompt && message.promptId ? null : (
                        <MessageRight
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

                {/* Typing Indicator */}
                {showTypingIndicator && (
                  <MessageLeft message={""} displayName={"Papyrus"} typing />
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

                {/* Conversation Completed Message */}
                {conversationCompleted && (
                  <div className="text-center py-8 border-t border-border mt-6">
                    <div className="pb-4 text-muted-foreground text-sm max-w-md mx-auto">
                      {t("chat.flaggedConvoDescription")}
                    </div>
                    <button
                      onClick={newConversation}
                      className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                      {t("chat.newConversation")}
                    </button>
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