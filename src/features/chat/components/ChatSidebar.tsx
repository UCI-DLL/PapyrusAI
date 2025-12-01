import React from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { ScrollArea } from "../../../components/ui/scroll-area";
import { Sheet, SheetContent } from "../../../components/ui/sheet";
import { Search, Plus, Loader2, MessageCircle } from "lucide-react";
import { CourseType, ModuleType } from "../../../utility/types/CourseTypes";
import { ConversationListType } from "../../../utility/types/ConversationTypes";
import { UserType } from "../../../utility/types/UserTypes";
import { cn } from "../../../lib/utils";
import { TooltipWrapper } from "@/components/ui-wrappers/TooltipWrapper";

interface ChatSidebarProps {
  courseInfo: CourseType;
  moduleInfo: ModuleType;
  user?: UserType | null;
  conversationList?: ConversationListType;
  currentConversationIndex?: string;
  searchTerm: string;
  creatingConvo: boolean;
  isOpen: boolean;
  isMobile?: boolean;
  onSearchChange: (term: string) => void;
  onNewConversation: () => void;
  onConversationClick: (link: string) => void;
  onClose?: () => void;
}

export default function ChatSidebar({
  courseInfo,
  moduleInfo,
  user,
  conversationList,
  currentConversationIndex,
  searchTerm,
  creatingConvo,
  isOpen,
  isMobile = false,
  onSearchChange,
  onNewConversation,
  onConversationClick,
  onClose,
}: ChatSidebarProps): JSX.Element | null {
  const filteredConversations =
    conversationList?.conversations
      ?.filter((conv) =>
        conv.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .reverse() || [];

  const sidebarContent = (
    <div className="flex flex-col h-full w-full">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Conversations</h2>
          <TooltipWrapper content="Create New Conversation">
            <Button
              size="sm"
              onClick={onNewConversation}
              disabled={creatingConvo}
              className="h-7 px-2 text-xs"
              aria-label="Create new conversation"
            >
              {creatingConvo ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Plus className="h-3 w-3" />
              )}
            </Button>
          </TooltipWrapper>

        </div>
      </div>

      {/* Module Info */}
      <div className="p-4 border-b border-border">
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">{moduleInfo.name}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {moduleInfo.moduleDescription}
          </p>
          <div className="text-xs text-muted-foreground">
            <p>
              <span className="font-medium">Course:</span> {courseInfo.name}
            </p>
            <p>
              <span className="font-medium">Instructor:</span>{" "}
              {courseInfo.instructor.name +
                " " +
                courseInfo.instructor.family_name}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 text-sm h-8"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 min-h-0 border-darkest-blue">
        <ScrollArea className="h-full border-darkest-blue">
          {filteredConversations.length > 0 ? (
            <div className="space-y-1 p-2">
              {filteredConversations.map((conversation) => {
                const conversationIndex = conversationList?.conversations
                  ? conversationList.conversations.findIndex(
                    (c) => c.id === conversation.id
                  )
                  : 0;
                const isCurrentConversation =
                  conversationIndex.toString() === currentConversationIndex;
                const conversationLink = `/chat/${user?.username}/${courseInfo.id}/${moduleInfo.id}/${conversationIndex}`;

                return (
                  <button
                    key={conversation.id}
                    className={cn(
                      "rounded-lg p-3 cursor-pointer transition-colors border text-left w-full",
                      isCurrentConversation
                        ? "bg-primary text-primary-foreground border-primary"
                        : "hover:bg-accent hover:text-secondary-foreground border-transparent"
                    )}
                    onClick={() => onConversationClick(conversationLink)}
                  >
                    <div className="space-y-1">
                      <p className={"text-sm font-medium truncate-text"}>
                        {conversation.name}
                      </p>
                      <p className={"text-xs truncate-text"}>
                        {new Date(
                          parseInt(conversation.id.substring(0, 13))
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground p-4">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {searchTerm
                  ? "No matching conversations"
                  : "No conversations yet"}
              </p>
              {!searchTerm && (
                <Button
                  size="sm"
                  onClick={() => {
                    onNewConversation();
                    if (isMobile && onClose) onClose();
                  }}
                  disabled={creatingConvo}
                  className="mt-3 text-xs"
                >
                  {creatingConvo ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : (
                    <Plus className="mr-1 h-3 w-3" />
                  )}
                  Start conversation
                </Button>
              )}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
        <SheetContent side="right" className="w-80 p-0">
          {sidebarContent}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div
      className="hidden lg:flex w-80 border-l border-border bg-card"
      style={{ height: "calc(100vh - 4rem)" }}
    >
      {sidebarContent}
    </div>
  );
}
