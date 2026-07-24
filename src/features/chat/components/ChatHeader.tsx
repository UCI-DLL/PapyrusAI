import React from "react";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { MessageSquare, PanelRightOpen, Download, BookOpen, ClipboardCheck, CheckCircle } from "lucide-react";
import { CourseType, ModuleType } from "../../../utility/types/CourseTypes";
import { useTranslation } from "../../../hooks/useTranslation";
import { TooltipWrapper } from "../../../components/ui-wrappers/TooltipWrapper";

interface ChatHeaderProps {
  conversationName: string;
  courseInfo: CourseType;
  moduleInfo: ModuleType;
  onToggleSidebar: () => void;
  isMobile?: boolean;
  onDownloadConversation?: () => void;
  canDownload?: boolean;
  reviewBadge?: "pending" | "available" | null;
  onViewRubric?: () => void;
  attemptsLabel?: string;
  onComplete?: () => void;
  showComplete?: boolean;
}

export default function ChatHeader({
  conversationName,
  courseInfo,
  moduleInfo,
  onToggleSidebar,
  isMobile = false,
  onDownloadConversation,
  canDownload = false,
  reviewBadge,
  onViewRubric,
  attemptsLabel,
  onComplete,
  showComplete = false,
}: ChatHeaderProps): JSX.Element {

  const { t } = useTranslation();

  const badge = reviewBadge && (
    <Badge
      variant={reviewBadge === "available" ? "default" : "secondary"}
      className="gap-1 text-xs shrink-0"
    >
      <ClipboardCheck className="h-3 w-3" />
      {reviewBadge === "available"
        ? t("reviewChat.badgeReviewAvailable")
        : t("reviewChat.badgePendingReview")}
    </Badge>
  );

  return (
    <div className="bg-card border-b border-border px-4 py-2.5 sticky top-0 z-20">
      <div className="flex items-center justify-between gap-2">

        {/* Left: title + subtitle */}
        <div className="flex flex-col items-start gap-0.5 min-w-0 flex-1">

          {/* Title row */}
          <div className="flex items-center gap-2 text-sm min-w-0 w-full">
            <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="font-medium text-foreground truncate">
              {conversationName || "Chat Title"}
            </span>
            {/* Badge inline with title on sm+ only */}
            {badge && <span className="hidden sm:flex">{badge}</span>}
          </div>

          {/* Mobile: badge on its own row */}
          {badge && <div className="sm:hidden pl-6">{badge}</div>}

          {/* Desktop subtitle: course · module · attempts */}
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <span className="truncate">{courseInfo.name} - {moduleInfo.name}</span>
            {attemptsLabel && (
              <span className="text-xs border border-border rounded px-1.5 py-0.5 shrink-0">
                {attemptsLabel}
              </span>
            )}
          </div>

          {/* Mobile: attempts pill only (course name hidden to save space) */}
          {attemptsLabel && (
            <div className="sm:hidden pl-6">
              <span className="text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5">
                {attemptsLabel}
              </span>
            </div>
          )}
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {showComplete && onComplete && (
            <>
              <TooltipWrapper content={t("reviewChat.complete")} side="bottom">
                <Button
                  size="sm"
                  className="sm:hidden h-8 w-8 p-0"
                  onClick={onComplete}
                  aria-label={t("reviewChat.complete")}
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </TooltipWrapper>
              <Button
                size="sm"
                className="hidden sm:flex gap-1.5 px-2"
                onClick={onComplete}
              >
                <CheckCircle className="h-4 w-4" />
                {t("reviewChat.complete")}
              </Button>
            </>
          )}
          {onViewRubric && (
            <>
              {/* Icon-only on mobile */}
              <TooltipWrapper content={t("reviewModule.viewRubric")} side="bottom">
                <Button
                  variant="outline"
                  size="sm"
                  className="sm:hidden h-8 w-8 p-0"
                  onClick={onViewRubric}
                  aria-label={t("reviewModule.viewRubric")}
                >
                  <BookOpen className="h-4 w-4" />
                </Button>
              </TooltipWrapper>
              {/* Icon + text on sm+ */}
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex gap-1.5 px-2"
                onClick={onViewRubric}
              >
                <BookOpen className="h-4 w-4" />
                {t("reviewModule.viewRubric")}
              </Button>
            </>
          )}

          {canDownload && onDownloadConversation && (
            <TooltipWrapper content={t("common.download")} side="bottom">
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
