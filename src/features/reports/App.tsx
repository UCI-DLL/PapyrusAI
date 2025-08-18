// TODO: Mock up reports page. Later change Lambda to include the student analysis functions as part of the analysis json
import React, { useEffect, useState, useRef } from "react";
import StudentMenu from "./StudentMenu";
import ClassCharts from "./ClassCharts";
import "./App.css";
import StudentStatsArea from "./StudentStatsArea";
import analyzeAllCourses, { Course } from "./analysis";

function App() {
  const [analysis, setAnalysis] = useState<Record<string, unknown> | null>(
    null
  );

  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourseKey, setSelectedCourseKey] = useState<string | null>(
    null
  );
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentMenuOpen, setStudentMenuOpen] = useState(false);
  const studentMenuRef = useRef<HTMLDivElement>(null);

  // Click-away logic for student menu
  useEffect(() => {
    if (!studentMenuOpen) return;
    function handleClick(event: MouseEvent) {
      if (
        studentMenuRef.current &&
        !studentMenuRef.current.contains(event.target as Node)
      ) {
        setStudentMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [studentMenuOpen]);

  // Load classification.json and run analysis
  useEffect(() => {
    fetch(import.meta.env.BASE_URL + "src/testfiles/classification.json")
      .then((res) => res.json())
      .then((json: unknown) => {
        if (!json || !Array.isArray(json)) {
          setError(
            "Invalid classification.json format - expected array of courses"
          );
          setDataLoading(false);
          return;
        }

        try {
          // Run analysis on the course data
          const analysisResult = analyzeAllCourses(json as Course[]);
          setAnalysis(analysisResult);
          console.log(analysisResult);
          // Default to first course key
          const firstKey = Object.keys(analysisResult)[0];
          setSelectedCourseKey(firstKey);
          setDataLoading(false);
        } catch (err) {
          setError(
            `Analysis failed: ${err instanceof Error ? err.message : "Unknown error"
            }`
          );
          setDataLoading(false);
        }
      })
      .catch((err) => {
        setError(`Failed to load classification.json: ${err.message}`);
        setDataLoading(false);
      });
  }, []);

  // Get the selected course's analysis result
  const courseAnalysis =
    selectedCourseKey && analysis
      ? (analysis[selectedCourseKey] as Record<string, unknown>)
      : null;

  // Get the selected students' data
  let selectedStudents: Record<string, unknown>[] = [];
  if (selectedStudentIds.length && courseAnalysis && courseAnalysis.students) {
    selectedStudents = selectedStudentIds
      .map(
        (id) =>
          (courseAnalysis.students as Record<string, Record<string, unknown>>)[
          id
          ]
      )
      .filter(Boolean);
  }

  if (dataLoading)
    return (
      <div style={{ padding: 40 }}>
        Loading and analyzing classification data...
      </div>
    );
  if (error) return <div style={{ color: "red", padding: 40 }}>{error}</div>;

  return (
    <div style={{ maxWidth: 1500, margin: "0 auto", padding: "2rem" }}>
      {analysis && (
        <div
          style={{
            marginBottom: 32,
            padding: "1rem",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            gap: 16,
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            position: "relative",
            justifyContent: "center", // Center the row
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 600 }}>
            Select Course
          </h2>
          <select
            id="course-select"
            value={selectedCourseKey || ""}
            onChange={(e) => setSelectedCourseKey(e.target.value)}
            style={{
              fontSize: "1rem",
              padding: "0.5rem 1rem",
              borderRadius: 4,
              border: "1px solid #ccc",
              minWidth: 200,
            }}
          >
            {Object.keys(analysis).map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={() => setStudentMenuOpen((open) => !open)}
              style={{
                fontSize: "1rem",
                padding: "0.4rem 1rem",
                borderRadius: 4,
                border: "1px solid #1976d2",
                background: studentMenuOpen ? "#e3f0ff" : "#fff",
                color: "#1976d2",
                fontWeight: 600,
                cursor: "pointer",
                marginLeft: 16,
              }}
              aria-expanded={studentMenuOpen}
              aria-controls="student-menu-popup"
            >
              {selectedStudentIds.length > 0
                ? `${selectedStudentIds.length} Student${selectedStudentIds.length > 1 ? "s" : ""
                } Selected`
                : "Select Students"}
            </button>
            {selectedStudentIds.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedStudentIds([])}
                style={{
                  marginLeft: 0,
                  background: "none",
                  border: "none",
                  color: "#e53935",
                  borderRadius: 0,
                  fontSize: "1.5rem",
                  width: "auto",
                  height: "auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontWeight: 700,
                  padding: 0,
                  lineHeight: 1,
                }}
                title="Clear all selected students"
                aria-label="Clear all selected students"
              >
                ×
              </button>
            )}
            {studentMenuOpen && (
              <div
                ref={studentMenuRef}
                id="student-menu-popup"
                style={{
                  position: "absolute",
                  top: "110%",
                  left: 0,
                  zIndex: 10,
                  background: "#fff",
                  border: "1px solid #ccc",
                  borderRadius: 8,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
                  padding: 16,
                  minWidth: 220,
                }}
              >
                <StudentMenu
                  analysis={courseAnalysis}
                  selectedStudentIds={selectedStudentIds}
                  onStudentSelect={setSelectedStudentIds}
                  smallButtons={true}
                />
              </div>
            )}
          </div>
        </div>
      )}
      <div style={{ width: "100%" }}>
        {selectedStudentIds.length === 0 ? (
          <ClassCharts analysis={courseAnalysis} />
        ) : (
          <StudentStatsArea students={selectedStudents} />
        )}
      </div>
    </div>
  );
}

export default App;
