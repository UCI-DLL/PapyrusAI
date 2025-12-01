import React, { useEffect, useRef } from "react";
import { MessageLeft, MessageRight } from "../../../components/Message";
import { MessageCircle } from "lucide-react";
import { MessageType } from "../../../utility/types/ConversationTypes";
import { ModuleType } from "../../../utility/types/CourseTypes";
import { UserType } from "../../../utility/types/UserTypes";
import ChatWizard from "../ChatWizard";
import EssayWizard from "../EssayWizard";

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
  onWizardReturnPrompts: (selectedPrompt: string) => void;
  onWizardReturnEssay: (essay: string, message?: string) => void;
  onBackToConversationList: () => void;
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
  onWizardReturnPrompts,
  onWizardReturnEssay,
  onBackToConversationList,
}: ChatMessagesProps): JSX.Element {
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, showTypingIndicator]);

  const isCurrentUser = user && viewUser && user.username === viewUser.username;
  const isInstructor = user?.groups.includes(instructor) || user?.groups.includes(admin);

  // Show essay wizard for rater enabled modules
  const showEssayWizard = isCurrentUser &&
    messages.length < 1 &&
    moduleInfo?.raterEnabled;

  // Show regular wizard for prompt-based modules
  const showPromptWizard = showWizard && !showEssayWizard;

  // Show empty state when no messages and no wizards
  const showEmptyState = messages.length === 0 &&
    !showPromptWizard &&
    !showEssayWizard;

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
        {showEmptyState && (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
            <div className="bg-card border border-border rounded-lg p-8 max-w-md text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h2 className="text-lg font-semibold mb-2">Start the conversation</h2>
              <p className="text-sm text-muted-foreground mb-4">
                {moduleInfo.moduleDescription}
              </p>
              <p className="text-xs text-muted-foreground">
                For more information on how to converse with the AI, please see the{" "}
                {isInstructor ? (
                  <a
                    href="https://docs.google.com/document/d/1o3He0CdgV7hJOX65gc3Gpf3_Fr3GYvSm4Q-i-Y5cNHQ/edit?tab=t.0#heading=h.7e2lilt0vxyx"
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2 hover:no-underline text-primary dark:text-gold colorful-dark:text-gold font-medium"
                  >
                    "Starting a Conversation" section of our user guide
                  </a>
                ) : (
                  <a
                    href="https://docs.google.com/document/d/1hVXs5RwWi8Pau1YlhwoF5Y5zO3-1hMZAyUxych7iIDo/edit?tab=t.0#heading=h.ap3bxaogq8pi"
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2 hover:no-underline text-primary dark:text-gold colorful-dark:text-gold font-medium"
                  >
                    "Starting a Conversation" section of our user guide
                  </a>
                )}
                .
              </p>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.length > 0 && (
          <div className="space-y-4">
            {messages.map((message, index) => {
              const isContextDivider =
                index ===
                messages.findIndex((message: MessageType) => !message.inContext);

              return (
                <React.Fragment key={message.id || index}>
                  {isContextDivider && (
                    <div className="relative flex items-center justify-center my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground font-medium">
                          In Context
                        </span>
                      </div>
                    </div>
                  )}

                  {message.role === "assistant" ? (
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
                  This conversation has been flagged as inappropriate for this setting.
                  Please start a new conversation.
                </div>
                <button
                  onClick={onBackToConversationList}
                  className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Back to Conversation List
                </button>
              </div>
            )}
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} className="h-1" />
      </div>
    </div>
  );
}