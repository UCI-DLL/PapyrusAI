import React, { useEffect, useRef } from "react";
import * as Plot from "@observablehq/plot";

type StudentStatsProps = {
  student: Record<string, unknown>;
};

export default function StudentStats({ student }: StudentStatsProps) {
  const info = student.info as Record<string, unknown> | undefined;
  const weeklyConvoLengths = student.weeklyConvoLengths as
    | Array<Record<string, unknown>>
    | undefined;
  const weeklyConvoCounts = student.weeklyConvoCounts as
    | Array<Record<string, unknown>>
    | undefined;
  const classificationCounts = student.classificationCounts as
    | Array<Record<string, unknown>>
    | undefined;
  const moduleUsage = student.moduleUsage as
    | Array<Record<string, unknown>>
    | undefined;
  const totalMessages = student.totalMessages as number | undefined;

  const lengthsRef = useRef<HTMLDivElement>(null);
  const countsRef = useRef<HTMLDivElement>(null);
  const classificationRef = useRef<HTMLDivElement>(null);
  const moduleUsageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!weeklyConvoLengths || weeklyConvoLengths.length === 0) return;
    const plot = Plot.plot({
      x: { label: "Week" },
      y: { label: "Avg Conversation Length" },
      marks: [
        Plot.line(weeklyConvoLengths, { x: "week", y: "avg_convo_length" }),
        Plot.dot(weeklyConvoLengths, { x: "week", y: "avg_convo_length" }),
        Plot.tip(
          weeklyConvoLengths,
          Plot.pointerX({ x: "week", y: "avg_convo_length", fill: "black" })
        ),
      ],
      width: 500,
      height: 300,
    });
    if (lengthsRef.current) {
      lengthsRef.current.innerHTML = "";
      lengthsRef.current.appendChild(plot);
    }
  }, [weeklyConvoLengths]);

  useEffect(() => {
    if (!weeklyConvoCounts || weeklyConvoCounts.length === 0) return;
    const plot = Plot.plot({
      x: { label: "Week" },
      y: { label: "Number of Conversations" },
      marks: [
        Plot.line(weeklyConvoCounts, { x: "week", y: "num_convos" }),
        Plot.dot(weeklyConvoCounts, { x: "week", y: "num_convos" }),
        Plot.tip(
          weeklyConvoCounts,
          Plot.pointerX({ x: "week", y: "num_convos", fill: "black" })
        ),
      ],
      width: 500,
      height: 300,
    });
    if (countsRef.current) {
      countsRef.current.innerHTML = "";
      countsRef.current.appendChild(plot);
    }
  }, [weeklyConvoCounts]);

  useEffect(() => {
    if (!classificationCounts || classificationCounts.length === 0) return;
    const plot = Plot.plot({
      x: { label: "Classification" },
      y: { label: "Count" },
      color: { legend: true, scheme: "tableau10" },
      marks: [
        Plot.barY(classificationCounts, {
          x: "classification",
          y: "count",
          fill: "classification",
          tip: { fill: "black" },
        }),
      ],
      width: 500,
      height: 300,
    });
    if (classificationRef.current) {
      classificationRef.current.innerHTML = "";
      classificationRef.current.appendChild(plot);
    }
  }, [classificationCounts]);

  useEffect(() => {
    if (!moduleUsage || moduleUsage.length === 0) return;
    const plot = Plot.plot({
      x: { label: "Module" },
      y: { label: "Count" },
      color: { legend: true, scheme: "tableau10" },
      marks: [
        Plot.barY(moduleUsage, {
          x: "moduleName",
          y: "count",
          fill: "moduleName",
          tip: { fill: "black" },
        }),
      ],
      width: 500,
      height: 300,
    });
    if (moduleUsageRef.current) {
      moduleUsageRef.current.innerHTML = "";
      moduleUsageRef.current.appendChild(plot);
    }
  }, [moduleUsage]);

  if (!student) return null;
  return (
    <div style={{ padding: 32 }}>
      <h2>
        {info?.name as string} {info?.family_name as string}
      </h2>
      <p>Email: {info?.email as string}</p>
      <p>Total Messages: {totalMessages}</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "2rem",
          marginTop: "2rem",
        }}
      >
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h3>Module Usage</h3>
          <div ref={moduleUsageRef} />
        </div>
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h3>Classification Counts</h3>
          <div ref={classificationRef} />
        </div>
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h3>Weekly Conversation Lengths</h3>
          <div ref={lengthsRef} />
        </div>
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h3>Weekly Conversation Counts</h3>
          <div ref={countsRef} />
        </div>
      </div>
    </div>
  );
}
