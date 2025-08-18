interface StudentMenuProps {
  analysis: Record<string, unknown> | null;
  selectedStudentIds: string[];
  onStudentSelect?: (studentIds: string[]) => void;
  smallButtons?: boolean;
  clearSelection?: () => void;
}

export default function StudentMenu({
  analysis,
  selectedStudentIds,
  onStudentSelect,
  smallButtons,
}: StudentMenuProps) {
  const loading = !analysis || !analysis.students;
  const students =
    analysis && analysis.students
      ? Object.entries(
          analysis.students as Record<string, Record<string, unknown>>
        )
      : [];

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
  };

  return (
    <div style={{ paddingTop: 0, marginTop: 0 }}>
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: smallButtons ? 4 : 8 }}
      >
        {students.map(([id, student]) => {
          const selected = selectedStudentIds.includes(id);
          const studentInfo = student as Record<string, unknown>;
          const info = studentInfo.info as Record<string, unknown> | undefined;
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggleStudent(id)}
              style={{
                padding: smallButtons ? "0.2rem 0.6rem" : "0.5rem 1rem",
                borderRadius: 16,
                border: selected ? "2px solid #1976d2" : "1px solid #ccc",
                background: selected ? "#e3f0ff" : "#fff",
                color: selected ? "#1976d2" : "#222",
                fontWeight: selected ? 600 : 400,
                fontSize: smallButtons ? "0.9rem" : "1rem",
                cursor: "pointer",
                outline: "none",
                boxShadow: selected
                  ? "0 2px 8px rgba(25,118,210,0.08)"
                  : undefined,
                marginBottom: smallButtons ? 2 : 4,
                transition: "background 0.15s, color 0.15s, border 0.15s",
              }}
            >
              {info?.name as string} {info?.family_name as string}
            </button>
          );
        })}
      </div>
    </div>
  );
}
