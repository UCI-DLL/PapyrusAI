import React, { useEffect, useRef } from "react";
import * as Plot from "@observablehq/plot";

type StudentStatsProps = {
  student: Record<string, unknown>;
};

export default function StudentStats({ student }: StudentStatsProps) {
  const info = student.info as Record<string, unknown> | undefined;
  const dailyConvoLengths = student.dailyConvoLengths as
    | Array<Record<string, unknown>>
    | undefined;
  const dailyConvoCounts = student.dailyConvoCounts as
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
    if (!dailyConvoLengths || dailyConvoLengths.length === 0) return;

    // Parse date strings to Date objects
    const processedData = dailyConvoLengths.map((item) => ({
      ...item,
      date: new Date(item.date as string),
    }));

    const plot = Plot.plot({
      x: { label: "Date", type: "time" },
      y: { label: "Avg Conversation Length" },
      marks: [
        Plot.line(processedData, { x: "date", y: "avg_convo_length" }),
        Plot.dot(processedData, { x: "date", y: "avg_convo_length" }),
        Plot.tip(
          processedData,
          Plot.pointerX({ x: "date", y: "avg_convo_length", fill: "black" })
        ),
      ],
      width: 500,
      height: 300,
    });
    if (lengthsRef.current) {
      lengthsRef.current.innerHTML = "";
      lengthsRef.current.appendChild(plot);
    }
  }, [dailyConvoLengths]);

  useEffect(() => {
    if (!dailyConvoCounts || dailyConvoCounts.length === 0) return;

    // Parse date strings to Date objects
    const processedData = dailyConvoCounts.map((item) => ({
      ...item,
      date: new Date(item.date as string),
    }));

    const plot = Plot.plot({
      x: { label: "Date", type: "time" },
      y: { label: "Number of Conversations" },
      marks: [
        Plot.line(processedData, { x: "date", y: "num_convos" }),
        Plot.dot(processedData, { x: "date", y: "num_convos" }),
        Plot.tip(
          processedData,
          Plot.pointerX({ x: "date", y: "num_convos", fill: "black" })
        ),
      ],
      width: 500,
      height: 300,
    });
    if (countsRef.current) {
      countsRef.current.innerHTML = "";
      countsRef.current.appendChild(plot);
    }
  }, [dailyConvoCounts]);

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
          <h3>Daily Conversation Lengths</h3>
          <div ref={lengthsRef} />
        </div>
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h3>Daily Conversation Counts</h3>
          <div ref={countsRef} />
        </div>
      </div>
    </div>
  );
}
