import React from "react";
import { Button } from "../../../components/ui/button";
import { DropdownWrapper } from "../../../components/ui-wrappers/DropdownWrapper";
import { MessageSquare, MoreVertical, PanelRightOpen } from "lucide-react";
import { CourseType, ModuleType } from "../../../utility/types/CourseTypes";
import { UserType } from "../../../utility/types/UserTypes";

interface ChatHeaderProps {
  conversationName: string;
  courseInfo: CourseType;
  moduleInfo: ModuleType;
  user?: UserType | null;
  viewUser?: UserType;
  onRename: () => void;
  onDownload: () => void;
  onHide: () => void;
  onToggleSidebar: () => void;
  isMobile?: boolean;
}

export default function ChatHeader({
  conversationName,
  courseInfo,
  moduleInfo,
  user,
  viewUser,
  onRename,
  onDownload,
  onHide,
  onToggleSidebar,
  isMobile = false,
}: ChatHeaderProps): JSX.Element {
  const canModifyConversation =
    user && viewUser && user.username === viewUser.username;

  return (
    <div className="bg-card border-b border-border px-4 py-3 sticky top-0 z-20">
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-start  gap-3 min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            <span className="font-medium text-foreground">
              {conversationName || "Chat Title"}
            </span>
          </div>
          <div className="text-sm text-muted-foreground hidden sm:block">
            {courseInfo.name} - {moduleInfo.name}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <DropdownWrapper
            trigger={
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="More Options">
                <MoreVertical className="h-4 w-4" />
              </Button>
            }
            actions={[
              {
                label: "Rename",
                onClick: onRename,
              },
              {
                label: "Download",
                onClick: onDownload,
              },
              ...(canModifyConversation
                ? [
                  {
                    label: "Archive Conversation",
                    onClick: onHide,
                  },
                ]
                : []),
            ]}
            align="end"
          />
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 lg:hidden"
              onClick={onToggleSidebar}
            >
              <PanelRightOpen className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
