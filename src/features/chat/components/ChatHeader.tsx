import React from "react";
import { Button } from "../../../components/ui/button";
import { MessageSquare, PanelRightOpen, Download } from "lucide-react";
import { CourseType, ModuleType } from "../../../utility/types/CourseTypes";
import { UserType } from "../../../utility/types/UserTypes";
import { useTranslation } from "../../../hooks/useTranslation";
import { TooltipWrapper } from "../../../components/ui-wrappers/TooltipWrapper";

interface ChatHeaderProps {
  conversationName: string;
  courseInfo: CourseType;
  moduleInfo: ModuleType;
  user?: UserType | null;
  viewUser?: UserType;
  onToggleSidebar: () => void;
  isMobile?: boolean;
  onDownloadConversation?: () => void;
  canDownload?: boolean;
}

export default function ChatHeader({
  conversationName,
  courseInfo,
  moduleInfo,
  user,
  viewUser,
  onToggleSidebar,
  isMobile = false,
  onDownloadConversation,
  canDownload = false,
}: ChatHeaderProps): JSX.Element {

  const { t } = useTranslation();

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
          {canDownload && onDownloadConversation && (
            <TooltipWrapper content={t("common.download")} side="top">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={onDownloadConversation}
                aria-label={t("common.download")}
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipWrapper>
          )}
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 lg:hidden"
              onClick={onToggleSidebar}
              aria-label={t("common.expand")}
            >
              <PanelRightOpen className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
