import React, { useEffect, useRef } from "react";
import IndividualStudentStats from "./IndividualStudentStats";
import * as Plot from "@observablehq/plot";
import { colorToHex, PLOT_COLOR_PALETTE } from "../../utility/reports/color";

interface StudentPageProps {
  students: Record<string, unknown>[];
}

function getStudentName(student: Record<string, unknown>) {
  const info = student.info as Record<string, unknown> | undefined;
  return info
    ? `${info.name as string} ${info.family_name as string}`
    : "Unknown";
}

// Helper function to truncate labels
const truncateLabel = (label: string, maxLength: number = 15) => {
  if (label.length <= maxLength) return label;
  return label.substring(0, maxLength - 3) + "...";
};

function getStackedDailyData(students: Record<string, unknown>[]) {
  const countsMap = new Map<
    string,
    { date: Date; value: number; studentName: string }
  >();
  const lengthsMap = new Map<
    string,
    { date: Date; value: number; studentName: string; count: number }
  >();

  students.forEach((student) => {
    const studentName = getStudentName(student);
    const dailyConvoCounts = student.dailyConvoCounts as
      | Array<Record<string, unknown>>
      | undefined;
    if (dailyConvoCounts) {
      dailyConvoCounts.forEach((d) => {
        const date = new Date(d.date as string);
        const dateKey = `${studentName}-${date.toISOString().split("T")[0]}`;
        const currentValue = countsMap.get(dateKey)?.value || 0;
        countsMap.set(dateKey, {
          date,
          value: currentValue + (d.num_convos as number),
          studentName,
        });
      });
    }
    const dailyConvoLengths = student.dailyConvoLengths as
      | Array<Record<string, unknown>>
      | undefined;
    if (dailyConvoLengths) {
      dailyConvoLengths.forEach((d) => {
        const date = new Date(d.date as string);
        const dateKey = `${studentName}-${date.toISOString().split("T")[0]}`;
        const currentValue = lengthsMap.get(dateKey)?.value || 0;
        const currentCount = lengthsMap.get(dateKey)?.count || 0;
        lengthsMap.set(dateKey, {
          date,
          value:
            (currentValue * currentCount + (d.avg_convo_length as number)) /
            (currentCount + 1),
          studentName,
          count: currentCount + 1,
        });
      });
    }
  });

  return {
    counts: Array.from(countsMap.values()),
    lengths: Array.from(lengthsMap.values()).map(({ count, ...rest }) => rest),
  };
}

function getStackedClassificationData(students: Record<string, unknown>[]) {
  const classificationData: Array<{
    classification: string;
    count: number;
    studentName: string;
    fullClassification: string;
  }> = [];

  students.forEach((student) => {
    const studentName = getStudentName(student);
    const classificationCounts = student.classificationCounts as
      | Array<Record<string, unknown>>
      | undefined;
    if (classificationCounts) {
      classificationCounts.forEach((c) => {
        classificationData.push({
          classification: truncateLabel(c.classification as string),
          count: c.count as number,
          studentName,
          fullClassification: c.classification as string, // Keep original for tooltips
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
    fullModuleName: string;
  }> = [];

  students.forEach((student) => {
    const studentName = getStudentName(student);
    const moduleUsage = student.moduleUsage as
      | Array<Record<string, unknown>>
      | undefined;
    if (moduleUsage) {
      moduleUsage.forEach((m) => {
        moduleData.push({
          moduleName: truncateLabel(m.moduleName as string),
          count: m.count as number,
          studentName,
          fullModuleName: m.moduleName as string, // Keep original for tooltips
        });
      });
    }
  });
  return moduleData;
}

export default function StudentPage({ students }: StudentPageProps) {
  const { counts, lengths } = getStackedDailyData(students);
  const classificationData = getStackedClassificationData(students);
  const moduleData = getStackedModuleUsageData(students);

  const countsRef = useRef<HTMLDivElement>(null);
  const lengthsRef = useRef<HTMLDivElement>(null);
  const classificationRef = useRef<HTMLDivElement>(null);
  const moduleUsageRef = useRef<HTMLDivElement>(null);
  const backgroundColor = colorToHex(
    getComputedStyle(document.documentElement).getPropertyValue("--background")
  );
  const foregroundColor = colorToHex(
    getComputedStyle(document.documentElement).getPropertyValue("--foreground")
  );

  useEffect(() => {
    if (!counts.length) return;
    const plot = Plot.plot({
      style: {
        background: "transparent",
        color: foregroundColor,
      },
      ariaLabel:
        "Stacked daily conversation counts chart showing number of conversations by student over time",
      x: {
        type: "time",
        label: "Date",
      },
      y: { label: "Number of Conversations" },
      color: { legend: true, label: "Student", range: PLOT_COLOR_PALETTE },
      marks: [
        Plot.rectY(counts, {
          x: "date",
          y: "value",
          fill: "studentName",
          title: (d: any) =>
            `Date: ${d.date.toLocaleDateString()}\nStudent: ${
              d.studentName
            }\nConversations: ${d.value}`,
          tip: {
            format: {
              x: (d: any) => d.date.toLocaleDateString(),
              fill: (d: any) => d.studentName,
              value: true,
            },
            fill: backgroundColor,
          },
          interval: "1 day",
        }),
      ],
      width: 500,
      height: 300,
    });
    if (countsRef.current) {
      countsRef.current.innerHTML = "";
      countsRef.current.appendChild(plot);
    }
  }, [counts, backgroundColor, foregroundColor]);

  useEffect(() => {
    if (!lengths.length) return;
    const plot = Plot.plot({
      style: {
        background: "transparent",
        color: foregroundColor,
      },
      ariaLabel:
        "Stacked daily conversation lengths chart showing average conversation length by student over time",
      x: {
        type: "time",
        label: "Date",
      },
      y: { label: "Avg Conversation Length" },
      color: { legend: true, label: "Student", range: PLOT_COLOR_PALETTE },
      marks: [
        Plot.rectY(lengths, {
          x: "date",
          y: "value",
          fill: "studentName",
          title: (d: any) =>
            `Date: ${d.date.toLocaleDateString()}\nStudent: ${
              d.studentName
            }\nAvg Length: ${d.value.toFixed(1)}`,
          tip: {
            format: {
              x: (d: any) => d.date.toLocaleDateString(),
              fill: (d: any) => d.studentName,
              value: true,
            },
            fill: backgroundColor,
          },
          interval: "1 day",
        }),
      ],
      width: 500,
      height: 300,
    });
    if (lengthsRef.current) {
      lengthsRef.current.innerHTML = "";
      lengthsRef.current.appendChild(plot);
    }
  }, [lengths, backgroundColor, foregroundColor]);

  useEffect(() => {
    if (!classificationData.length) return;
    const plot = Plot.plot({
      style: {
        background: "transparent",
        color: foregroundColor,
      },
      ariaLabel:
        "Stacked classification counts chart showing conversation classifications by student",
      x: { label: "Classification" },
      y: { label: "Count" },
      color: { legend: true, label: "Student", range: PLOT_COLOR_PALETTE },
      marks: [
        Plot.barY(classificationData, {
          x: "classification",
          y: "count",
          fill: "studentName",
          title: (d: any) =>
            `Classification: ${
              d.fullClassification || d.classification
            }\nStudent: ${d.studentName}\nCount: ${d.count}`,
          tip: {
            format: {
              x: (d: any) => d.fullClassification || d.classification,
              fill: (d: any) => d.fullClassification || d.classification,
              count: true,
            },
            fill: backgroundColor,
          },
          order: "stack",
        }),
        Plot.text(classificationData, {
          x: "classification",
          y: "count",
          text: "count",
          dy: -8,
          fontSize: 12,
          fill: foregroundColor,
          fontWeight: "bold",
        }),
      ],
      width: 500,
      height: 300,
    });
    if (classificationRef.current) {
      classificationRef.current.innerHTML = "";
      classificationRef.current.appendChild(plot);
    }
  }, [classificationData, backgroundColor, foregroundColor]);

  useEffect(() => {
    if (!moduleData.length) return;
    const plot = Plot.plot({
      style: {
        background: "transparent",
        color: foregroundColor,
      },
      ariaLabel:
        "Stacked module usage chart showing module usage counts by student",
      x: { label: "Module" },
      y: { label: "Count" },
      color: { legend: true, label: "Student", range: PLOT_COLOR_PALETTE },
      marks: [
        Plot.barY(moduleData, {
          x: "moduleName",
          y: "count",
          fill: "studentName",
          title: (d: any) =>
            `Module: ${d.fullModuleName || d.moduleName}\nStudent: ${
              d.studentName
            }\nCount: ${d.count}`,
          tip: {
            format: {
              x: (d: any) => d.fullModuleName || d.moduleName,
              fill: (d: any) => d.fullModuleName || d.moduleName,
              count: true,
            },
            fill: backgroundColor,
          },
          order: "stack",
        }),
        Plot.text(moduleData, {
          x: "moduleName",
          y: "count",
          text: "count",
          dy: -8,
          fontSize: 12,
          fill: foregroundColor,
          fontWeight: "bold",
        }),
      ],
      width: 500,
      height: 300,
    });
    if (moduleUsageRef.current) {
      moduleUsageRef.current.innerHTML = "";
      moduleUsageRef.current.appendChild(plot);
    }
  }, [moduleData, backgroundColor, foregroundColor]);

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1.5rem",
          marginBottom: "2rem",
          padding: "0 2rem",
          borderBottom: "1px solid #eee",
        }}
        className="chart-grid"
      >
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h4 className="text-2xl font-bold text-foreground mb-2">
            Daily Conversation Lengths (Stacked by Student)
          </h4>
          <div ref={lengthsRef} />
        </div>
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h4 className="text-2xl font-bold text-foreground mb-2">
            Daily Conversation Counts (Stacked by Student)
          </h4>
          <div ref={countsRef} />
        </div>
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h4 className="text-2xl font-bold text-foreground mb-2">
            Module Usage (Stacked by Student)
          </h4>
          <div ref={moduleUsageRef} />
        </div>
        {/* <div className="card" style={{ marginBottom: "1rem" }}>
          <h4>Classification Counts (Stacked by Student)</h4>
          <div ref={classificationRef} />
        </div> */}
      </div>
      <h2
        className="text-2xl font-bold text-foreground mb-1"
        style={{ padding: "0 2rem" }}
      >
        Individual Stats
      </h2>
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
