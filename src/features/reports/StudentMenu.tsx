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
  }, [isOpen]);

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
    return <div style={{ padding: 20 }}>Loading students...</div>;
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
    <div
      style={{ paddingTop: 0, marginTop: 0, position: "relative" }}
      ref={dropdownRef}
    >
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: smallButtons ? "0.3rem 0.8rem" : "0.5rem 1rem",
          fontSize: smallButtons ? "0.9rem" : "1rem",
          minWidth: smallButtons ? "120px" : "150px",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Users size={16} />
          <span>{getSelectedStudentsText()}</span>
        </div>
        <ChevronDown size={16} />
      </Button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            minWidth: "200px",
            maxHeight: "300px",
            overflowY: "auto",
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            boxShadow:
              "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            zIndex: 1000,
            marginTop: "4px",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "0.5rem 0.75rem",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                fontSize: "0.875rem",
                fontWeight: "600",
                color: "#374151",
              }}
            >
              Students ({students.length})
            </div>
          </div>

          {/* Select All / Clear All buttons */}
          <div
            style={{
              padding: "0.5rem",
              display: "flex",
              gap: "0.5rem",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={selectAllStudents}
              style={{ flex: 1, fontSize: "0.8rem" }}
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllStudents}
              style={{ flex: 1, fontSize: "0.8rem" }}
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
                style={{
                  padding: "0.5rem 0.75rem",
                  fontSize: "0.9rem",
                  minHeight: "2rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  cursor: "pointer",
                  backgroundColor: "transparent",
                  transition: "background-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#f3f4f6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid #ccc",
                    borderRadius: "3px",
                    backgroundColor: selected ? "#1976d2" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
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
                <span>{studentName}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
