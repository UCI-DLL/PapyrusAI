/**
 * StudentMenu.tsx, component for displaying a dropdown menu of students
 * Allows for selecting multiple students
 */
import React, { useState, useRef, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { ChevronDown, Users } from "lucide-react";

interface StudentMenuProps {
  analysis: Record<string, unknown> | null;
  selectedStudentIds: string[];
  onStudentSelect?: (studentIds: string[]) => void;
  smallButtons?: boolean;
  clearSelection?: () => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function StudentMenu({
  analysis,
  selectedStudentIds,
  onStudentSelect,
  smallButtons,
  clearSelection,
  isOpen: externalIsOpen,
  onOpenChange,
}: StudentMenuProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  // Use external state if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = onOpenChange || setInternalIsOpen;

  const dropdownRef = useRef<HTMLDivElement>(null);

  const loading = !analysis || !analysis.students;
  const students =
    analysis && analysis.students
      ? Object.entries(
          analysis.students as Record<string, Record<string, unknown>>
        )
      : [];

  // Close dropdown on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, setIsOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        isOpen
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  if (loading) {
    return <div className="p-5 text-muted-foreground">Loading students...</div>;
  }

  const toggleStudent = (id: string) => {
    if (!onStudentSelect) return;
    if (selectedStudentIds.includes(id)) {
      onStudentSelect(selectedStudentIds.filter((sid) => sid !== id));
    } else {
      onStudentSelect([...selectedStudentIds, id]);
    }
    // Don't close the dropdown - keep it open for multi-select
  };

  const selectAllStudents = () => {
    if (!onStudentSelect) return;
    const allStudentIds = students.map(([id]) => id);
    onStudentSelect(allStudentIds);
  };

  const clearAllStudents = () => {
    if (!onStudentSelect) return;
    onStudentSelect([]);
  };

  const getSelectedStudentsText = () => {
    if (selectedStudentIds.length === 0) {
      return "Select students";
    } else if (selectedStudentIds.length === 1) {
      const student = students.find(([id]) => id === selectedStudentIds[0]);
      if (student) {
        const studentInfo = student[1] as Record<string, unknown>;
        const info = studentInfo.info as Record<string, unknown> | undefined;
        return `${info?.name as string} ${info?.family_name as string}`;
      }
    } else {
      return `${selectedStudentIds.length} students selected`;
    }
    return "Select students";
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-2 ${
          smallButtons
            ? "px-3 py-1.5 text-sm min-w-[120px]"
            : "px-4 py-2 text-base min-w-[150px]"
        }`}
      >
        <div className="flex items-center gap-2">
          <Users size={16} />
          <span>{getSelectedStudentsText()}</span>
        </div>
        <ChevronDown size={16} />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 min-w-[200px] max-h-[300px] overflow-y-auto bg-card border border-border rounded-md shadow-lg z-[1000] mt-1">
          {/* Header */}
          <div className="px-3 py-2 border-b border-border">
            <div className="text-sm font-semibold text-foreground">
              Students ({students.length})
            </div>
          </div>

          {/* Select All / Clear All buttons */}
          <div className="p-2 flex gap-2 border-b border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={selectAllStudents}
              className="flex-1 text-xs"
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllStudents}
              className="flex-1 text-xs"
            >
              Clear All
            </Button>
          </div>

          {/* Student checkboxes */}
          {students.map(([id, student]) => {
            const selected = selectedStudentIds.includes(id);
            const studentInfo = student as Record<string, unknown>;
            const info = studentInfo.info as
              | Record<string, unknown>
              | undefined;
            const studentName = `${info?.name as string} ${
              info?.family_name as string
            }`;

            return (
              <div
                key={id}
                onClick={() => toggleStudent(id)}
                className="px-3 py-2 text-sm min-h-8 flex items-center gap-3 cursor-pointer hover:bg-accent transition-colors"
              >
                <div
                  className={`w-4 h-4 border-2 rounded-sm flex items-center justify-center flex-shrink-0 ${
                    selected
                      ? "bg-primary border-primary"
                      : "border-muted-foreground"
                  }`}
                >
                  {selected && (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20,6 9,17 4,12"></polyline>
                    </svg>
                  )}
                </div>
                <span className="text-foreground">{studentName}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
