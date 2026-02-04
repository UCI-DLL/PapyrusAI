import React, { useEffect, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { ScrollArea } from "../../../components/ui/scroll-area";
import { Sheet, SheetContent } from "../../../components/ui/sheet";
import { Search, Plus, MessageCircle, MoreVertical } from "lucide-react";
import { CourseType, ModuleType } from "../../../utility/types/CourseTypes";
import { ConversationListType, ConversationType } from "../../../utility/types/ConversationTypes";
import { UserType } from "../../../utility/types/UserTypes";
import { cn } from "../../../lib/utils";
import { TooltipWrapper } from "../../../components/ui-wrappers/TooltipWrapper";
import { DropdownWrapper } from "../../../components/ui-wrappers/DropdownWrapper";
import { Link } from "react-router-dom";
import { useTranslation } from "../../../hooks/useTranslation";

interface ChatSidebarProps {
  courseInfo: CourseType;
  moduleInfo: ModuleType;
  user?: UserType | null;
  viewUser?: UserType;
  conversationList?: ConversationListType;
  currentConversationIndex?: string;
  searchTerm: string;
  isOpen: boolean;
  isMobile?: boolean;
  onSearchChange: (term: string) => void;
  onNewConversation: () => void;
  onConversationClick: (link: string) => void;
  onRenameConversation: (courseId: string, moduleId: string, index: string, name: string) => void;
  onArchiveConversation: (courseId: string, moduleId: string, index: string) => void;
  onDownloadConversation: (courseId: string, moduleId: string, index: string) => void;
  onClose?: () => void;
}

export default function ChatSidebar({
  courseInfo,
  moduleInfo,
  user,
  viewUser,
  conversationList,
  currentConversationIndex,
  searchTerm,
  isOpen,
  isMobile = false,
  onSearchChange,
  onNewConversation,
  onConversationClick,
  onRenameConversation,
  onArchiveConversation,
  onDownloadConversation,
  onClose,
}: ChatSidebarProps): JSX.Element | null {
  const { t } = useTranslation();
  const instructor = process.env.REACT_APP_INSTRUCTOR
    ? process.env.REACT_APP_INSTRUCTOR
    : "PapyrusAIInstructors";
  const admin = process.env.REACT_APP_ADMIN
    ? process.env.REACT_APP_ADMIN
    : "PapyrusAIAdmin";
  const [filteredConversations, setFilteredConversations] = useState<ConversationType[]>([]);
  useEffect(() => {
    setFilteredConversations(
      conversationList?.conversations
        ?.filter((conv) =>
          conv.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .reverse() || [])
  }, [conversationList, searchTerm])

  const sidebarContent = (
    <div className="flex flex-col h-full w-full">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">{t("chat.conversations")}</h2>
          <TooltipWrapper content={t("chat.newConversation")}>
            <Button
              size="sm"
              onClick={onNewConversation}
              className="h-7 px-2 text-xs"
              aria-label={t("chat.newConversation")}
            >
              <Plus className="h-3 w-3" />
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
              <span className="font-medium">{t("chat.course")}:</span> {courseInfo.name}
            </p>
            <p>
              <span className="font-medium">{t("common.instructor")}:</span>{" "}
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
            placeholder={t("chat.searchConversation")}
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
                const canModifyConversation =
                  user && viewUser && user.username === viewUser.username;

                // handle archiving/deleted conversations based on user permissions
                if ((!user?.groups.includes(instructor) || !user?.groups.includes(admin)) && conversation.isDeleted) {
                  return <></>
                }

                return (
                  <div
                    key={conversation.id}
                    className={cn(
                      "rounded-lg border transition-colors group",
                      isCurrentConversation
                        ? conversation.isDeleted ? "bg-destructive text-primary-foreground border-primary" : "bg-primary text-primary-foreground border-primary"
                        : conversation.isDeleted ? "hover:bg-destructive hover:text-secondary-foreground border-transparent" : "hover:bg-accent hover:text-secondary-foreground border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-2 p-3">
                      <Link
                        to={conversationLink}
                        className="flex-1 text-left min-w-0 no-underline cursor-pointer"
                        onClick={() => onConversationClick(conversationLink)}
                      >
                        <div className="space-y-1">
                          <p className={"text-sm font-medium truncate"}>
                            {conversation.name.length > 20 ? conversation.name.substring(0, 20) + "..." : conversation.name}
                          </p>
                          <p className={"text-xs truncate"}>
                            {new Date(
                              parseInt(conversation.id.substring(0, 13))
                            ).toLocaleDateString()}
                          </p>
                          {conversation.isDeleted && (
                            <p className={"text-xs truncate "}>{t("chat.archived")}</p>
                          )}
                        </div>
                      </Link>
                      {isCurrentConversation && ( //show conversation options if it is selected (better accessibility)
                        <div onClick={(e) => e.stopPropagation()}>
                          <DropdownWrapper
                            trigger={
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                  "h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity",
                                  isCurrentConversation && "opacity-100"
                                )}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                aria-label={t("chat.conversationOptions")}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            }
                            actions={[
                              {
                                label: t("common.rename"),
                                onClick: () => {
                                  onRenameConversation(
                                    courseInfo.id,
                                    moduleInfo.id,
                                    conversationIndex.toString(),
                                    conversation.name
                                  );
                                  if (isMobile && onClose) onClose();
                                },
                              },
                              {
                                label: t("common.download"),
                                onClick: () => {
                                  onDownloadConversation(
                                    courseInfo.id,
                                    moduleInfo.id,
                                    conversationIndex.toString()
                                  );
                                  if (isMobile && onClose) onClose();
                                },
                              },
                              ...(canModifyConversation
                                ? [
                                  {
                                    label: t("chat.archiveConversation"),
                                    onClick: () => {
                                      onArchiveConversation(
                                        courseInfo.id,
                                        moduleInfo.id,
                                        conversationIndex.toString()
                                      );
                                      if (isMobile && onClose) onClose();
                                    },
                                    className: "text-destructive",
                                  },
                                ]
                                : []),
                            ]}
                            align="end"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground p-4">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {searchTerm
                  ? t("errorMessage.convoNotFound")
                  : t("errorMessage.noConversationsYet")}
              </p>
              {!searchTerm && (
                <Button
                  size="sm"
                  onClick={() => {
                    onNewConversation();
                    if (isMobile && onClose) onClose();
                  }}
                  className="mt-3 text-xs"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  {t("chat.startConversation")}
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
