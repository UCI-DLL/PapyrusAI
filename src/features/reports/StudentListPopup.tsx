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

export default function StudentListPopup({
  isOpen,
  onClose,
  analysis,
}: StudentListPopupProps) {
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
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        isOpen
      ) {
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

  const students =
    analysis && analysis.students
      ? Object.entries(
        analysis.students as Record<string, Record<string, unknown>>
      )
      : [];

  const handleStudentClick = (
    studentId: string,
    student: Record<string, unknown>
  ) => {
    const info = student.info as Record<string, unknown> | undefined;
    const userId = info?.username || studentId;
    navigate(`/reports/${userId}`);
    onClose();
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
            <h2
              id="student-list-title"
              className="text-xl font-semibold text-foreground"
            >
              {t("reports.studentsInClass")}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label={t("common.close")}
            className="h-8 w-8 p-0"
          >
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
              {students.map(([id, student]) => {
                const studentInfo = student as Record<string, unknown>;
                const info = studentInfo.info as
                  | Record<string, unknown>
                  | undefined;
                const studentName = `${info?.name as string} ${info?.family_name as string
                  }`;
                const studentEmail = info?.email as string;

                return (
                  <div
                    key={id}
                    tabIndex={0}
                    role="button"
                    aria-label={`${t("reports.viewReports")} ${studentName}`}
                    onClick={() => handleStudentClick(id, student)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleStudentClick(id, student);
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
                        <div className="text-sm text-muted-foreground">
                          {studentEmail}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground group-hover:text-primary dark:group-hover:text-gold colorful-dark:group-hover:text-gold transition-colors">
                      {t("reports.viewReports")} →
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border">
          <div className="text-sm text-muted-foreground text-center">
            {t("reports.clickViewStudentReports")}
          </div>
        </div>
      </div>
    </div>
  );
}
