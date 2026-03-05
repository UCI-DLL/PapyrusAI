/**
 * StudentListPopup.tsx, component for displaying a list of all students in a course
 * Allows for navigating to a student's individual reports
 */
import React, { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, User } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useTranslation } from "../../hooks/useTranslation";

interface StudentListPopupProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: Record<string, unknown> | null;
}

export default function StudentListPopup({ isOpen, onClose, analysis }: StudentListPopupProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const popupRef = useRef<HTMLDivElement>(null);

  // Close popup on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node) && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Load full student list if available
  type StudentRow = { username: string; name: string; family_name: string; email?: string; numConversations: number };
  let students: Array<[string, StudentRow]> = [];

  if (analysis?.allStudentsWithCounts && Array.isArray(analysis.allStudentsWithCounts)) {
    const list = analysis.allStudentsWithCounts as Array<{
      username: string;
      name?: string;
      family_name?: string;
      email?: string;
      numConversations: number;
    }>;
    students = list.map((s) => [
      s.username,
      {
        username: s.username,
        name: s.name ?? "",
        family_name: s.family_name ?? "",
        email: s.email,
        numConversations: s.numConversations ?? 0,
      },
    ]);
  } else if (analysis?.students && typeof analysis.students === "object") {
    const studentEntries = Object.entries(analysis.students as Record<string, Record<string, unknown>>);
    students = studentEntries.map(([id, student]) => {
      const info = (student.info as Record<string, unknown> | undefined) ?? {};
      const dailyConvoCounts = (student.dailyConvoCounts as Array<{ num_convos: number }> | undefined) ?? [];
      const numConversations = dailyConvoCounts.reduce((sum, d) => sum + (d.num_convos ?? 0), 0);
      return [
        id,
        {
          username: (info.username as string) ?? id,
          name: (info.name as string) ?? "",
          family_name: (info.family_name as string) ?? "",
          email: info.email as string | undefined,
          numConversations,
        },
      ];
    });
    students.sort(([, a], [, b]) => {
      const cmp = a.family_name.trim().toLowerCase().localeCompare(b.family_name.trim().toLowerCase());
      if (cmp !== 0) return cmp;
      return a.name.trim().toLowerCase().localeCompare(b.name.trim().toLowerCase());
    });
  }

  const handleStudentClick = (username: string) => {
    navigate(`/reports/${username}`);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-list-title"
    >
      <div
        ref={popupRef}
        className="bg-card border border-border rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <h2 id="student-list-title" className="text-xl font-semibold text-foreground">
              {t("reports.studentsInClass")}
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label={t("common.close")} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {students.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("reports.noStudentsInClass")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {students.map(([id, row]) => {
                const studentName = `${row.name} ${row.family_name}`.trim() || id;
                const studentEmail = row.email;

                return (
                  <div
                    key={id}
                    tabIndex={0}
                    role="button"
                    aria-label={`${t("reports.viewReports")} ${studentName}`}
                    onClick={() => handleStudentClick(row.username)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleStudentClick(row.username);
                      }
                    }}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted cursor-pointer transition-colors group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground group-hover:text-primary dark:group-hover:text-gold colorful-dark:group-hover:text-gold transition-colors">
                          {studentName}
                        </div>
                        <div className="text-sm text-muted-foreground">{studentEmail}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground tabular-nums">
                        {row.numConversations} {t("reports.conversations")}
                      </span>
                      <span className="text-sm text-muted-foreground group-hover:text-primary dark:group-hover:text-gold colorful-dark:group-hover:text-gold transition-colors">
                        {t("reports.viewReports")} →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border">
          <div className="text-sm text-muted-foreground text-center">{t("reports.clickViewStudentReports")}</div>
        </div>
      </div>
    </div>
  );
}
