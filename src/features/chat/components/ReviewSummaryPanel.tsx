import React, { useState, useRef, useLayoutEffect } from "react";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  FileText,
  LayoutList,
  X,
} from "lucide-react";
import { GradeScore } from "../../../utility/types/CourseTypes";
import { MessageType } from "../../../utility/types/ConversationTypes";
import { useTranslation } from "../../../hooks/useTranslation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ReviewSummaryPanelProps {
  essayMessage?: MessageType;
  gradeResult?: { scores: GradeScore[]; totalScore: number; instructorNotes?: string } | null;
  gradePending?: boolean;
  gradeError?: string;
  maxPerCriterion?: number;
  maxTotal?: number;
}

export default function ReviewSummaryPanel({
  essayMessage,
  gradeResult,
  gradePending,
  gradeError,
  maxPerCriterion,
  maxTotal,
}: ReviewSummaryPanelProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [essayExpanded, setEssayExpanded] = useState(false);
  const [gradeExpanded, setGradeExpanded] = useState(true);
  const [expandedCriteria, setExpandedCriteria] = useState<Set<number>>(new Set());
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const pillRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    if (!isOpen || !pillRef.current) return;
    if (window.innerWidth < 640) {
      const rect = pillRef.current.getBoundingClientRect();
      // Find actual header bottom so we don't render beneath it
      const headerEl = document.querySelector("header");
      const topOffset = headerEl ? headerEl.getBoundingClientRect().bottom + 8 : 64;
      setPanelStyle({
        position: "fixed",
        left: "0.5rem",
        right: "0.5rem",
        top: topOffset,
        bottom: window.innerHeight - rect.top + 4,
      });
    } else {
      setPanelStyle({});
    }
  }, [isOpen]);

  const hasGradeContent = !!(gradeResult || gradePending || gradeError);
  const hasEssay = !!essayMessage;

  if (!hasEssay && !hasGradeContent) return null;

  const preview = essayMessage?.content
    .split("\n")
    .filter((l) => l.trim())
    .slice(0, 2)
    .join(" ")
    .slice(0, 120);

  return (
    <div className="relative">
        {/* Expanded panel — floats above the toggle button */}
        {isOpen && (
          <div
            className="absolute bottom-full right-0 mb-2 w-[calc(100vw-2rem)] overflow-y-auto border-2 rounded-xl bg-card shadow-lg sm:w-96 sm:max-h-[440px] lg:w-[520px] lg:max-h-[640px]"
            style={panelStyle}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 lg:px-5 lg:py-3 border-b sticky top-0 bg-card z-10">
              <span className="font-semibold text-sm lg:text-base">{t("reviewChat.reviewSummary")}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="p-3 lg:p-4 space-y-3 lg:space-y-4">
              {/* Essay card */}
              {essayMessage && (
                <div className="border rounded-lg bg-muted/30 overflow-hidden">
                  <button
                    onClick={() => setEssayExpanded((p) => !p)}
                    className="w-full flex items-center justify-between gap-2 px-3 lg:px-4 py-2 lg:py-3 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-primary shrink-0" />
                      <span className="font-medium text-xs lg:text-sm truncate">
                        {t("reviewChat.submittedEssay")}
                      </span>
                    </div>
                    {essayExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                  </button>
                  {!essayExpanded && preview && (
                    <p className="text-xs lg:text-sm text-muted-foreground px-3 lg:px-4 pb-2 lg:pb-3 line-clamp-2">
                      {preview}
                      {(essayMessage.content.length > 120) ? "…" : ""}
                    </p>
                  )}
                  {essayExpanded && (
                    <div className="px-3 lg:px-4 pb-3 lg:pb-4 border-t border-border/50">
                      <p className="text-xs lg:text-sm whitespace-pre-wrap mt-2 lg:mt-3 text-foreground/90 leading-relaxed">
                        {essayMessage.content}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Grade card */}
              {hasGradeContent && (
                gradeError ? (
                  <div className="p-3 lg:p-4 border border-destructive rounded-lg bg-destructive/10">
                    <p className="text-destructive text-xs lg:text-sm">{gradeError}</p>
                  </div>
                ) : gradePending ? (
                  <div className="p-3 lg:p-4 border rounded-lg bg-card flex items-center gap-2.5 lg:gap-3">
                    <Clock className="h-4 w-4 lg:h-5 lg:w-5 text-primary opacity-70 shrink-0" />
                    <div>
                      <p className="font-medium text-xs lg:text-sm">{t("reviewChat.pendingTitle")}</p>
                      <p className="text-muted-foreground text-xs lg:text-sm leading-snug mt-0.5">
                        {t("reviewChat.pendingDescription")}
                      </p>
                    </div>
                  </div>
                ) : gradeResult ? (
                  <div className="border rounded-lg bg-background overflow-hidden">
                    <button
                      onClick={() => setGradeExpanded((p) => !p)}
                      className="w-full flex items-center justify-between gap-2 px-3 lg:px-4 py-2 lg:py-3 text-left hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <CheckCircle className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-green-600 shrink-0" />
                        <span className="font-medium text-xs lg:text-sm">{t("reviewChat.gradeResult")}</span>
                        <Badge variant="secondary" className="text-xs lg:text-sm px-1.5 py-0">
                          {gradeResult.totalScore}
                          {maxTotal !== undefined ? ` / ${maxTotal}` : ""}
                        </Badge>
                      </div>
                      {gradeExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      )}
                    </button>

                    {gradeExpanded && (
                      <div className="p-2 lg:p-3 border-t border-border/50 space-y-1.5 lg:space-y-2">
                        {gradeResult.scores.map((score, i) => {
                          const open = expandedCriteria.has(i);
                          return (
                            <div key={i} className="border rounded-md bg-card overflow-hidden">
                              <button
                                onClick={() =>
                                  setExpandedCriteria((prev) => {
                                    const next = new Set(prev);
                                    next.has(i) ? next.delete(i) : next.add(i);
                                    return next;
                                  })
                                }
                                className="w-full flex items-center justify-between gap-2 px-2.5 lg:px-3 py-2 lg:py-2.5 text-left hover:bg-muted/30 transition-colors"
                              >
                                <span className="font-medium text-xs lg:text-sm">{score.name}</span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <Badge variant="secondary" className="text-xs lg:text-sm px-1.5 py-0">
                                    {score.score}
                                    {maxPerCriterion !== undefined ? ` / ${maxPerCriterion}` : ""}
                                  </Badge>
                                  {score.feedback && (
                                    open ? (
                                      <ChevronUp className="h-3 w-3 lg:h-3.5 lg:w-3.5 text-muted-foreground" />
                                    ) : (
                                      <ChevronDown className="h-3 w-3 lg:h-3.5 lg:w-3.5 text-muted-foreground" />
                                    )
                                  )}
                                </div>
                              </button>
                              {open && score.feedback && (
                                <div className="px-2.5 lg:px-3 pb-2.5 lg:pb-3 border-t border-border/50">
                                  <Markdown
                                    remarkPlugins={[remarkGfm]}
                                    className="prose prose-xs lg:prose-sm max-w-none dark:prose-invert colorful-dark:prose-invert mt-1.5 lg:mt-2
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
                          <div className="border rounded-md p-2.5 lg:p-3 bg-primary/5 border-primary/20">
                            <p className="text-xs lg:text-sm font-semibold text-primary mb-1">
                              {t("reviewChat.instructorNotes")}
                            </p>
                            <p className="text-xs lg:text-sm text-foreground/90">
                              {gradeResult.instructorNotes}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : null
              )}
            </div>
          </div>
        )}

        {/* Toggle pill */}
        <button
          ref={pillRef}
          onClick={() => setIsOpen((p) => !p)}
          className="flex items-center gap-1.5 lg:gap-2 border rounded-full bg-card shadow-md px-3 lg:px-4 py-2 lg:py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors"
        >
          <LayoutList className="h-4 w-4 lg:h-5 lg:w-5 text-primary shrink-0" />
          {gradeResult && (
            <span className="text-xs lg:text-sm text-muted-foreground">
              {gradeResult.totalScore}
              {maxTotal !== undefined ? `/${maxTotal}` : ""}
            </span>
          )}
          {gradePending && <Clock className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-muted-foreground" />}
          <span className="hidden lg:inline text-sm">{t("reviewChat.reviewSummary")}</span>
          {isOpen ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>
    </div>
  );
}
