import { useEffect, useRef, useState } from "react";
import * as Plot from "@observablehq/plot";

interface ClassChartsProps {
  analysis: Record<string, unknown> | null;
}

export default function ClassCharts({ analysis }: ClassChartsProps) {
  const [selectedWeeks, setSelectedWeeks] = useState<string[]>([]);
  const lengthsRef = useRef<HTMLDivElement>(null);
  const chatClassificationRef = useRef<HTMLDivElement>(null);
  const countsRef = useRef<HTMLDivElement>(null);
  const moduleUsageRef = useRef<HTMLDivElement>(null);

  // Get available weeks from the data
  const getAvailableWeeks = () => {
    if (!analysis) return [];

    const weeklyModuleUsage = analysis.weeklyModuleUsage as
      | Array<{ week: string; moduleName: string; count: number }>
      | undefined;

    if (!weeklyModuleUsage) return [];

    const weeks = [...new Set(weeklyModuleUsage.map((item) => item.week))];
    return weeks.sort((a, b) => a.localeCompare(b));
  };

  // Set initial selected weeks when analysis first loads
  useEffect(() => {
    if (!analysis) return;
    const weeks = getAvailableWeeks();
    if (weeks.length > 0 && selectedWeeks.length === 0) {
      setSelectedWeeks([weeks[0]]);
    }
  }, [analysis]); // Remove selectedWeeks dependency

  // Aggregate data for selected weeks
  const getAggregatedModuleData = () => {
    if (!analysis || selectedWeeks.length === 0) return [];

    const weeklyModuleUsage = analysis.weeklyModuleUsage as
      | Array<{ week: string; moduleName: string; count: number }>
      | undefined;

    if (!weeklyModuleUsage) return [];

    // Filter data for selected weeks
    const weekData = weeklyModuleUsage.filter((item) =>
      selectedWeeks.includes(item.week)
    );

    // Aggregate counts by module name
    const moduleMap: Record<string, number> = {};
    weekData.forEach((item) => {
      moduleMap[item.moduleName] =
        (moduleMap[item.moduleName] || 0) + item.count;
    });

    return Object.entries(moduleMap).map(([moduleName, count]) => ({
      moduleName,
      count,
    }));
  };

  const getAggregatedClassificationData = () => {
    if (!analysis || selectedWeeks.length === 0) return [];

    const chatClassificationData = analysis.weeklyClassificationCounts as
      | Array<{ week: string | number; classification: string; count: number }>
      | undefined;

    if (!chatClassificationData) return [];

    // Filter data for selected weeks
    const weekData = chatClassificationData.filter((item) =>
      selectedWeeks.includes(item.week as string)
    );

    // Aggregate counts by classification
    const classificationMap: Record<string, number> = {};
    weekData.forEach((item) => {
      classificationMap[item.classification] =
        (classificationMap[item.classification] || 0) + item.count;
    });

    return Object.entries(classificationMap).map(([classification, count]) => ({
      classification,
      count,
    }));
  };

  // Get responsive chart dimensions based on container size
  const getChartDimensions = () => {
    const containerWidth =
      moduleUsageRef.current?.parentElement?.offsetWidth || 700;
    const maxWidth = Math.min(containerWidth - 40, 700); // Account for padding
    const maxHeight = Math.min(maxWidth * 0.6, 400); // Maintain aspect ratio
    return { width: maxWidth, height: maxHeight };
  };

  useEffect(() => {
    if (!analysis || selectedWeeks.length === 0) return;

    const aggregatedData = getAggregatedModuleData();
    const { width, height } = getChartDimensions();

    const plot = Plot.plot({
      x: { label: "Module" },
      y: { label: "Count", grid: true },
      color: {
        legend: true,
        label: "Module",
        scheme: "tableau10",
      },
      marks: [
        Plot.barY(aggregatedData, {
          x: "moduleName",
          y: "count",
          fill: "moduleName",
          tip: {
            format: {
              x: true,
              fill: true,
              count: true,
            },
            fill: "black",
          },
        }),
      ],
      width,
      height,
    });
    if (moduleUsageRef.current) {
      moduleUsageRef.current.innerHTML = "";
      moduleUsageRef.current.appendChild(plot);
    }
  }, [analysis, selectedWeeks]);

  useEffect(() => {
    if (!analysis) return;
    const lengthsData = analysis.weeklyConvoLengths as
      | Array<{ week: string | number; avg_convo_length: number }>
      | undefined;
    if (!lengthsData) return;

    const { width, height } = getChartDimensions();

    const plot = Plot.plot({
      style: {},
      x: { label: "Week" },
      y: { label: "Avg Conversation Length" },
      marks: [
        Plot.line(lengthsData, { x: "week", y: "avg_convo_length" }),
        Plot.dot(lengthsData, { x: "week", y: "avg_convo_length" }),
        Plot.tip(
          lengthsData,
          Plot.pointerX({ x: "week", y: "avg_convo_length", fill: "black" })
        ),
      ],
      width,
      height,
    });
    if (lengthsRef.current) {
      lengthsRef.current.innerHTML = "";
      lengthsRef.current.appendChild(plot);
    }
  }, [analysis]);

  useEffect(() => {
    if (!analysis) return;
    const countsData = analysis.weeklyConvoCounts as
      | Array<{ week: string | number; num_convos: number }>
      | undefined;
    if (!countsData) return;

    const { width, height } = getChartDimensions();

    const plot = Plot.plot({
      x: { label: "Week" },
      y: { label: "Number of Conversations" },
      marks: [
        Plot.line(countsData, { x: "week", y: "num_convos" }),
        Plot.dot(countsData, { x: "week", y: "num_convos" }),
        Plot.tip(
          countsData,
          Plot.pointerX({ x: "week", y: "num_convos", fill: "black" })
        ),
      ],
      width,
      height,
    });
    if (countsRef.current) {
      countsRef.current.innerHTML = "";
      countsRef.current.appendChild(plot);
    }
  }, [analysis]);

  useEffect(() => {
    if (!analysis || selectedWeeks.length === 0) return;

    const aggregatedData = getAggregatedClassificationData();
    const { width, height } = getChartDimensions();

    const plot = Plot.plot({
      x: { label: "Classification" },
      y: { label: "Count", grid: true },
      color: {
        legend: true,
        label: "Classification",
        scheme: "tableau10",
      },
      marks: [
        Plot.barY(aggregatedData, {
          x: "classification",
          y: "count",
          fill: "classification",
          tip: {
            format: {
              x: true,
              fill: true,
              count: true,
            },
            fill: "black",
          },
        }),
      ],
      width,
      height,
    });
    if (chatClassificationRef.current) {
      chatClassificationRef.current.innerHTML = "";
      chatClassificationRef.current.appendChild(plot);
    }
  }, [analysis, selectedWeeks]);

  const availableWeeks = getAvailableWeeks();

  const handleWeekToggle = (week: string) => {
    setSelectedWeeks((prev) => {
      if (prev.includes(week)) {
        return prev.filter((w) => w !== week);
      } else {
        return [...prev, week];
      }
    });
  };

  const selectAllWeeks = () => {
    setSelectedWeeks(availableWeeks);
  };

  const clearAllWeeks = () => {
    setSelectedWeeks([]);
  };

  // Placeholder component for empty charts
  const EmptyChartPlaceholder = ({ title }: { title: string }) => {
    const { width, height } = getChartDimensions();

    return (
      <div
        style={{
          width,
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "2px dashed",
          borderRadius: 8,
          color: "#666",
          fontSize: "1.1rem",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>{title}</div>
          <div>Select one or more weeks to view data</div>
        </div>
      </div>
    );
  };

  return (
    <>
      {availableWeeks.length > 0 && (
        <div className="card" style={{ marginBottom: "2rem" }}>
          <h3 style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            Select Weeks
          </h3>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "1rem",
            }}
          >
            <button
              onClick={selectAllWeeks}
              style={{
                marginRight: "0.5rem",
                padding: "0.3rem 0.8rem",
                borderRadius: 4,
                border: "1px solid #1976d2",
                background: "#fff",
                color: "#1976d2",
                cursor: "pointer",
              }}
            >
              Select All
            </button>
            <button
              onClick={clearAllWeeks}
              style={{
                padding: "0.3rem 0.8rem",
                borderRadius: 4,
                border: "1px solid #e53935",
                background: "#fff",
                color: "#e53935",
                cursor: "pointer",
              }}
            >
              Clear All
            </button>
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
              justifyContent: "center",
            }}
          >
            {availableWeeks.map((week) => (
              <button
                key={week}
                onClick={() => handleWeekToggle(week)}
                style={{
                  padding: "0.4rem 0.8rem",
                  borderRadius: 16,
                  border: selectedWeeks.includes(week)
                    ? "2px solid #1976d2"
                    : "1px solid #ccc",
                  background: selectedWeeks.includes(week) ? "#e3f0ff" : "#fff",
                  color: selectedWeeks.includes(week) ? "#1976d2" : "#222",
                  fontWeight: selectedWeeks.includes(week) ? 600 : 400,
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
              >
                {week}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="by2">
        <div className="card" style={{ marginBottom: "3rem" }}>
          <h2>Module Usage</h2>
          {selectedWeeks.length > 0 ? (
            <div ref={moduleUsageRef} />
          ) : (
            <EmptyChartPlaceholder title="Module Usage Data" />
          )}
        </div>

        <div className="card" style={{ marginBottom: "3rem" }}>
          <h2>Chat Classification</h2>
          {selectedWeeks.length > 0 ? (
            <div ref={chatClassificationRef} />
          ) : (
            <EmptyChartPlaceholder title="Classification Data" />
          )}
        </div>

        <div className="card" style={{ marginBottom: "3rem" }}>
          <h2>Weekly Conversation Lengths</h2>
          <div ref={lengthsRef} />
        </div>

        <div className="card" style={{ marginBottom: "3rem" }}>
          <h2>Weekly Conversation Counts</h2>
          <div ref={countsRef} />
        </div>
      </div>
    </>
  );
}
