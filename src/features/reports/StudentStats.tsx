import React, { useEffect, useRef } from "react";
import IndividualStudentStats from "./IndividualStudentStats";
import * as Plot from "@observablehq/plot";

interface StudentStatsProps {
  students: Record<string, unknown>[];
}

function getStudentName(student: Record<string, unknown>) {
  const info = student.info as Record<string, unknown> | undefined;
  return info
    ? `${info.name as string} ${info.family_name as string}`
    : "Unknown";
}

function getStackedWeeklyData(students: Record<string, unknown>[]) {
  const counts: Array<{ week: string; value: number; studentName: string }> =
    [];
  const lengths: Array<{ week: string; value: number; studentName: string }> =
    [];
  students.forEach((student) => {
    const studentName = getStudentName(student);
    const weeklyConvoCounts = student.weeklyConvoCounts as
      | Array<Record<string, unknown>>
      | undefined;
    if (weeklyConvoCounts) {
      weeklyConvoCounts.forEach((w) => {
        counts.push({
          week: w.week as string,
          value: w.num_convos as number,
          studentName,
        });
      });
    }
    const weeklyConvoLengths = student.weeklyConvoLengths as
      | Array<Record<string, unknown>>
      | undefined;
    if (weeklyConvoLengths) {
      weeklyConvoLengths.forEach((w) => {
        lengths.push({
          week: w.week as string,
          value: w.avg_convo_length as number,
          studentName,
        });
      });
    }
  });
  return { counts, lengths };
}

function getStackedClassificationData(students: Record<string, unknown>[]) {
  const classificationData: Array<{
    classification: string;
    count: number;
    studentName: string;
  }> = [];

  students.forEach((student) => {
    const studentName = getStudentName(student);
    const classificationCounts = student.classificationCounts as
      | Array<Record<string, unknown>>
      | undefined;
    if (classificationCounts) {
      classificationCounts.forEach((c) => {
        classificationData.push({
          classification: c.classification as string,
          count: c.count as number,
          studentName,
        });
      });
    }
  });
  return classificationData;
}

function getStackedModuleUsageData(students: Record<string, unknown>[]) {
  const moduleData: Array<{
    moduleName: string;
    count: number;
    studentName: string;
  }> = [];

  students.forEach((student) => {
    const studentName = getStudentName(student);
    const moduleUsage = student.moduleUsage as
      | Array<Record<string, unknown>>
      | undefined;
    if (moduleUsage) {
      moduleUsage.forEach((m) => {
        moduleData.push({
          moduleName: m.moduleName as string,
          count: m.count as number,
          studentName,
        });
      });
    }
  });
  return moduleData;
}

export default function StudentStats({ students }: StudentStatsProps) {
  const { counts, lengths } = getStackedWeeklyData(students);
  const classificationData = getStackedClassificationData(students);
  const moduleData = getStackedModuleUsageData(students);

  const countsRef = useRef<HTMLDivElement>(null);
  const lengthsRef = useRef<HTMLDivElement>(null);
  const classificationRef = useRef<HTMLDivElement>(null);
  const moduleUsageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!counts.length) return;
    const plot = Plot.plot({
      x: { label: "Week" },
      y: { label: "Number of Conversations" },
      color: { legend: true, label: "Student", scheme: "category10" },
      marks: [
        Plot.barY(counts, {
          x: "week",
          y: "value",
          fill: "studentName",
          tip: { fill: "black" },
          order: "stack",
        }),
      ],
      width: 500,
      height: 300,
    });
    if (countsRef.current) {
      countsRef.current.innerHTML = "";
      countsRef.current.appendChild(plot);
    }
  }, [counts]);

  useEffect(() => {
    if (!lengths.length) return;
    const plot = Plot.plot({
      x: { label: "Week" },
      y: { label: "Avg Conversation Length" },
      color: { legend: true, label: "Student", scheme: "category10" },
      marks: [
        Plot.barY(lengths, {
          x: "week",
          y: "value",
          fill: "studentName",
          tip: { fill: "black" },
          order: "stack",
        }),
      ],
      width: 500,
      height: 300,
    });
    if (lengthsRef.current) {
      lengthsRef.current.innerHTML = "";
      lengthsRef.current.appendChild(plot);
    }
  }, [lengths]);

  useEffect(() => {
    if (!classificationData.length) return;
    const plot = Plot.plot({
      x: { label: "Classification" },
      y: { label: "Count" },
      color: { legend: true, label: "Student", scheme: "category10" },
      marks: [
        Plot.barY(classificationData, {
          x: "classification",
          y: "count",
          fill: "studentName",
          tip: { fill: "black" },
          order: "stack",
        }),
      ],
      width: 500,
      height: 300,
    });
    if (classificationRef.current) {
      classificationRef.current.innerHTML = "";
      classificationRef.current.appendChild(plot);
    }
  }, [classificationData]);

  useEffect(() => {
    if (!moduleData.length) return;
    const plot = Plot.plot({
      x: { label: "Module" },
      y: { label: "Count" },
      color: { legend: true, label: "Student", scheme: "category10" },
      marks: [
        Plot.barY(moduleData, {
          x: "moduleName",
          y: "count",
          fill: "studentName",
          tip: { fill: "black" },
          order: "stack",
        }),
      ],
      width: 500,
      height: 300,
    });
    if (moduleUsageRef.current) {
      moduleUsageRef.current.innerHTML = "";
      moduleUsageRef.current.appendChild(plot);
    }
  }, [moduleData]);

  return (
    <div>
      <h2>Selected Students: {students.length}</h2>
      <h3>Combined Stats</h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1.5rem",
          marginBottom: "3rem",
        }}
        className="chart-grid"
      >
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h4>Module Usage (Stacked by Student)</h4>
          <div ref={moduleUsageRef} />
        </div>
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h4>Classification Counts (Stacked by Student)</h4>
          <div ref={classificationRef} />
        </div>
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h4>Weekly Conversation Lengths (Stacked by Student)</h4>
          <div ref={lengthsRef} />
        </div>
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h4>Weekly Conversation Counts (Stacked by Student)</h4>
          <div ref={countsRef} />
        </div>
      </div>
      <h3>Individual Stats</h3>
      {students.map((student, i) => (
        <div
          key={i}
          style={{ marginBottom: 32, borderBottom: "1px solid #eee" }}
        >
          <IndividualStudentStats student={student} />
        </div>
      ))}
    </div>
  );
}
