import { useCallback, useEffect, useRef, useState } from "react";
import * as Plot from "@observablehq/plot";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import StudentStats from "./StudentStats";
import StudentMenu from "./StudentMenu";
import { Card, CardContent } from "../../components/ui/card";
import { colorToHex, PLOT_COLOR_PALETTE } from "./color";

interface ClassChartsProps {
  analysis: Record<string, unknown> | null;
  setAnalysis: any;
}

export default function ClassCharts({
  analysis,
  setAnalysis,
}: ClassChartsProps) {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  // const [showClassificationChart, setShowClassificationChart] =
  //   useState<boolean>(false); // Unused state variable
  const [chartRefreshTrigger, setChartRefreshTrigger] = useState<number>(0);
  const [studentMenuOpen, setStudentMenuOpen] = useState<boolean>(false);
  const lengthsRef = useRef<HTMLDivElement>(null);
  const chatClassificationRef = useRef<HTMLDivElement>(null);
  const countsRef = useRef<HTMLDivElement>(null);
  const moduleUsageRef = useRef<HTMLDivElement>(null);
  const backgroundColor = colorToHex(
    getComputedStyle(document.documentElement).getPropertyValue("--background")
  );
  const foregroundColor = colorToHex(
    getComputedStyle(document.documentElement).getPropertyValue("--foreground")
  );

  // Get available dates from the data and convert to proper date format
  const getAvailableDates = useCallback(() => {
    if (!analysis) return [];

    // Check multiple data sources for dates
    const dailyModuleUsage = analysis.dailyModuleUsage as
      | Array<{ date: string; moduleName: string; count: number }>
      | undefined;
    const dailyConvoLengths = analysis.dailyConvoLengths as
      | Array<{ date: string; avg_convo_length: number }>
      | undefined;
    const dailyConvoCounts = analysis.dailyConvoCounts as
      | Array<{ date: string; num_convos: number }>
      | undefined;
    const dailyClassificationCounts = analysis.dailyClassificationCounts as
      | Array<{ date: string; classification: string; count: number }>
      | undefined;

    // Collect dates from all available data sources
    const allDates = new Set<string>();

    if (dailyModuleUsage) {
      dailyModuleUsage.forEach((item) => allDates.add(item.date));
    }
    if (dailyConvoLengths) {
      dailyConvoLengths.forEach((item) => allDates.add(item.date));
    }
    if (dailyConvoCounts) {
      dailyConvoCounts.forEach((item) => allDates.add(item.date));
    }
    if (dailyClassificationCounts) {
      dailyClassificationCounts.forEach((item) => allDates.add(item.date));
    }

    const dates = Array.from(allDates);
    return dates.sort((a, b) => a.localeCompare(b));
  }, [analysis]);

  // Get available dates for use in effects
  const availableDates = getAvailableDates();

  // Check if analysis data is empty
  const isAnalysisEmpty = useCallback(() => {
    if (!analysis) return true;

    // Check if any of the main data categories have content
    const dailyConvoLengths = analysis.dailyConvoLengths as
      | Array<any>
      | undefined;
    const dailyConvoCounts = analysis.dailyConvoCounts as
      | Array<any>
      | undefined;
    const dailyModuleUsage = analysis.dailyModuleUsage as
      | Array<any>
      | undefined;
    const dailyClassificationCounts = analysis.dailyClassificationCounts as
      | Array<any>
      | undefined;

    return (
      (!dailyConvoLengths || dailyConvoLengths.length === 0) &&
      (!dailyConvoCounts || dailyConvoCounts.length === 0) &&
      (!dailyModuleUsage || dailyModuleUsage.length === 0) &&
      (!dailyClassificationCounts || dailyClassificationCounts.length === 0)
    );
  }, [analysis]);

  // Get students data for filtering
  const getStudents = useCallback(() => {
    if (!analysis || !analysis.students) return [];

    return Object.entries(
      analysis.students as Record<string, Record<string, unknown>>
    );
  }, [analysis]);

  // Helper function to truncate long labels
  const truncateLabel = useCallback((label: string, maxLength: number = 15) => {
    if (label.length <= maxLength) return label;
    return label.substring(0, maxLength - 3) + "...";
  }, []);

  // Set initial selected date range when analysis first loads
  useEffect(() => {
    if (!analysis) return;

    // Wait a bit for the analysis data to be fully processed
    const timer = setTimeout(() => {
      const dates = getAvailableDates();
      if (dates.length > 0) {
        const firstDate = dates[0];
        const lastDate = dates[dates.length - 1];
        setStartDate(firstDate);
        setEndDate(lastDate);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [analysis, getAvailableDates]);

  // Also set default dates when availableDates changes
  useEffect(() => {
    const dates = getAvailableDates();
    if (dates.length > 0 && (!startDate || !endDate)) {
      const firstDate = dates[0];
      const lastDate = dates[dates.length - 1];
      setStartDate(firstDate);
      setEndDate(lastDate);
    }
  }, [availableDates, startDate, endDate, getAvailableDates]);

  // Final fallback to ensure dates are set
  useEffect(() => {
    if (analysis && availableDates.length > 0 && (!startDate || !endDate)) {
      const firstDate = availableDates[0];
      const lastDate = availableDates[availableDates.length - 1];
      setStartDate(firstDate);
      setEndDate(lastDate);
    }
  }, [analysis, availableDates, startDate, endDate]);

  // Force chart re-rendering when switching back to class view
  useEffect(() => {
    if (selectedStudentIds.length === 0 && analysis) {
      // Force a re-render of charts by updating the refresh trigger
      const timer = setTimeout(() => {
        setChartRefreshTrigger((prev) => prev + 1);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedStudentIds.length, analysis]);

  // Ensure charts are rendered when class view is displayed
  useEffect(() => {
    if (selectedStudentIds.length === 0 && analysis && !isAnalysisEmpty()) {
    }
  }, [selectedStudentIds.length, analysis, isAnalysisEmpty]);

  // Force chart re-rendering when switching back to class view
  useEffect(() => {
    if (selectedStudentIds.length === 0 && analysis) {
      // This will cause the chart useEffect hooks to run again
      setTimeout(() => {
        // Trigger chart re-rendering by updating dependencies
        if (startDate && endDate) {
          setStartDate(startDate);
        }
      }, 200);
    }
  }, [selectedStudentIds.length, analysis, startDate, endDate]);

  // Helper function to check if a date is within the selected range
  const isDateInRange = useCallback(
    (dateStr: string) => {
      if (!startDate || !endDate) return false;

      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);

      const dateObj = new Date(dateStr);

      return dateObj >= startDateObj && dateObj <= endDateObj;
    },
    [startDate, endDate]
  );

  // Aggregate data for selected date range
  const getAggregatedModuleData = useCallback(() => {
    if (!analysis || !startDate || !endDate) return [];

    const dailyModuleUsage = analysis.dailyModuleUsage as
      | Array<{ date: string; moduleName: string; count: number }>
      | undefined;

    if (!dailyModuleUsage) return [];

    // Filter data for selected date range
    const dateData = dailyModuleUsage.filter((item) =>
      isDateInRange(item.date)
    );

    // Aggregate counts by module name
    const moduleMap: Record<string, number> = {};
    dateData.forEach((item) => {
      moduleMap[item.moduleName] =
        (moduleMap[item.moduleName] || 0) + item.count;
    });

    return Object.entries(moduleMap).map(([moduleName, count]) => ({
      moduleName: truncateLabel(moduleName),
      count,
      fullModuleName: moduleName, // Keep original name for tooltips
    }));
  }, [analysis, startDate, endDate, isDateInRange, truncateLabel]);

  const getAggregatedClassificationData = useCallback(() => {
    if (!analysis || !startDate || !endDate) return [];

    const chatClassificationData = analysis.dailyClassificationCounts as
      | Array<{ date: string | number; classification: string; count: number }>
      | undefined;

    if (!chatClassificationData) return [];

    // Filter data for selected date range
    const dateData = chatClassificationData.filter((item) =>
      isDateInRange(item.date as string)
    );

    // Aggregate counts by classification
    const classificationMap: Record<string, number> = {};
    dateData.forEach((item) => {
      classificationMap[item.classification] =
        (classificationMap[item.classification] || 0) + item.count;
    });

    return Object.entries(classificationMap).map(([classification, count]) => ({
      classification: truncateLabel(classification),
      count,
      fullClassification: classification, // Keep original name for tooltips
    }));
  }, [analysis, startDate, endDate, isDateInRange, truncateLabel]);

  // Get responsive chart dimensions based on container size
  const getChartDimensions = () => {
    const containerWidth =
      moduleUsageRef.current?.parentElement?.offsetWidth || 700;
    const maxWidth = Math.min(containerWidth - 40, 700); // Account for padding
    const maxHeight = Math.min(maxWidth * 0.6, 400); // Maintain aspect ratio
    return { width: maxWidth, height: maxHeight };
  };

  // Get chart dimensions specifically for module usage (taller to accommodate rotated labels)
  const getModuleChartDimensions = () => {
    const containerWidth =
      moduleUsageRef.current?.parentElement?.offsetWidth || 700;
    const maxWidth = Math.min(containerWidth - 40, 700);
    const maxHeight = Math.min(maxWidth * 0.8, 500);
    return { width: maxWidth, height: maxHeight };
  };

  useEffect(() => {
    if (!analysis || !startDate || !endDate) return;

    const aggregatedData = getAggregatedModuleData();
    const { width, height } = getModuleChartDimensions();

    const plot = Plot.plot({
      style: {
        background: "transparent",
        color: foregroundColor,
      },
      x: {
        label: "Module",
        tickRotate: aggregatedData.length > 5 ? -45 : 0, // Rotate labels if more than 5 modules
        tickSize: 6,
        padding: 0.1,
      },
      y: { label: "Count", grid: true },
      color: {
        legend: true,
        label: "Module",
        range: PLOT_COLOR_PALETTE,
        domain: aggregatedData.map((d) => d.fullModuleName || d.moduleName), // Use full names in legend
      },
      marks: [
        Plot.barY(aggregatedData, {
          x: "moduleName",
          y: "count",
          fill: (d: any) => d.fullModuleName || d.moduleName, // Use full names for color mapping
          title: (d: any) =>
            `Module: ${d.fullModuleName || d.moduleName}\nCount: ${d.count}`,
          tip: {
            format: {
              x: (d: any) => d.fullModuleName || d.moduleName, // Show full name in tooltip
              fill: (d: any) => d.fullModuleName || d.moduleName, // Show full name in tooltip
              count: true,
            },
            fill: backgroundColor,
          },
        }),
      ],
      width,
      height,
      marginLeft: aggregatedData.length > 5 ? 60 : 40, // More margin for rotated labels
      marginBottom: aggregatedData.length > 5 ? 80 : 40, // More margin for rotated labels
    });
    if (moduleUsageRef.current) {
      moduleUsageRef.current.innerHTML = "";
      moduleUsageRef.current.appendChild(plot);
    }
  }, [
    analysis,
    startDate,
    endDate,
    chartRefreshTrigger,
    getAggregatedModuleData,
    backgroundColor,
    foregroundColor,
  ]);

  useEffect(() => {
    if (!analysis) return;
    const lengthsData = analysis.dailyConvoLengths as
      | Array<{ date: string; avg_convo_length: number }>
      | undefined;
    if (!lengthsData) return;

    // Filter data based on selected date range
    let filteredData = lengthsData;
    if (startDate && endDate) {
      filteredData = lengthsData.filter((item) => {
        const itemDate = new Date(item.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return itemDate >= start && itemDate <= end;
      });
    }

    // Parse date strings to Date objects
    const parsedData = filteredData.map((item) => ({
      ...item,
      date: new Date(item.date),
    }));

    const { width, height } = getChartDimensions();

    const plot = Plot.plot({
      style: {
        background: "transparent",
        color: foregroundColor,
      },
      x: {
        type: "time",
        label: "Date",
      },
      y: { label: "Avg Conversation Length" },
      marks: [
        Plot.line(parsedData, { x: "date", y: "avg_convo_length" }),
        Plot.dot(parsedData, { x: "date", y: "avg_convo_length" }),
        Plot.tip(
          parsedData,
          Plot.pointerX({
            x: "date",
            y: "avg_convo_length",
            fill: backgroundColor,
          })
        ),
      ],
      width,
      height,
    });
    if (lengthsRef.current) {
      lengthsRef.current.innerHTML = "";
      lengthsRef.current.appendChild(plot);
    }
  }, [
    analysis,
    startDate,
    endDate,
    chartRefreshTrigger,
    backgroundColor,
    foregroundColor,
  ]);

  useEffect(() => {
    if (!analysis) return;
    const countsData = analysis.dailyConvoCounts as
      | Array<{ date: string; num_convos: number }>
      | undefined;
    if (!countsData) return;

    // Filter data based on selected date range
    let filteredData = countsData;
    if (startDate && endDate) {
      filteredData = countsData.filter((item) => {
        const itemDate = new Date(item.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return itemDate >= start && itemDate <= end;
      });
    }

    // Parse date strings to Date objects
    const parsedData = filteredData.map((item) => ({
      ...item,
      date: new Date(item.date),
    }));

    const { width, height } = getChartDimensions();

    const plot = Plot.plot({
      style: {
        background: "transparent",
        color: foregroundColor,
      },
      x: {
        type: "time",
        label: "Date",
      },
      y: { label: "Number of Conversations" },
      marks: [
        Plot.line(parsedData, { x: "date", y: "num_convos" }),
        Plot.dot(parsedData, { x: "date", y: "num_convos" }),
        Plot.tip(
          parsedData,
          Plot.pointerX({
            x: "date",
            y: "num_convos",
            fill: backgroundColor,
          })
        ),
      ],
      width,
      height,
    });
    if (countsRef.current) {
      countsRef.current.innerHTML = "";
      countsRef.current.appendChild(plot);
    }
  }, [
    analysis,
    startDate,
    endDate,
    chartRefreshTrigger,
    backgroundColor,
    foregroundColor,
  ]);

  useEffect(() => {
    if (
      !analysis ||
      !startDate ||
      !endDate ||
      /*!showClassificationChart*/ false
    )
      return;

    const aggregatedData = getAggregatedClassificationData();
    const { width, height } = getModuleChartDimensions();
    const plot = Plot.plot({
      style: {
        background: "transparent",
        color: foregroundColor,
      },
      x: {
        label: "Classification",
        tickRotate: aggregatedData.length > 5 ? -45 : 0, // Rotate labels if more than 5 classifications
        tickSize: 6,
        padding: 0.1,
      },
      y: { label: "Count", grid: true },
      color: {
        legend: true,
        label: "Classification",
        range: PLOT_COLOR_PALETTE,
        domain: aggregatedData.map(
          (d) => d.fullClassification || d.classification
        ), // Use full names in legend
      },
      marks: [
        Plot.barY(aggregatedData, {
          x: "classification",
          y: "count",
          fill: (d: any) => d.fullClassification || d.classification, // Use full names for color mapping
          title: (d: any) =>
            `Classification: ${
              d.fullClassification || d.classification
            }\nCount: ${d.count}`,
          tip: {
            format: {
              x: (d: any) => d.fullClassification || d.classification, // Show full name in tooltip
              fill: (d: any) => d.fullClassification || d.classification, // Show full name in tooltip
              count: true,
            },
            fill: backgroundColor,
          },
        }),
      ],
      width,
      height,
      marginLeft: aggregatedData.length > 5 ? 60 : 40, // More margin for rotated labels
      marginBottom: aggregatedData.length > 5 ? 80 : 40, // More margin for rotated labels
    });
    if (chatClassificationRef.current) {
      chatClassificationRef.current.innerHTML = "";
      chatClassificationRef.current.appendChild(plot);
    }
  }, [
    analysis,
    startDate,
    endDate,
    /* showClassificationChart, */ // Removed unused dependency
    chartRefreshTrigger,
    getAggregatedClassificationData,
    backgroundColor,
    foregroundColor,
  ]);

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
          <div>Select a date range to view data</div>
        </div>
      </div>
    );
  };

  // Student filter component
  const StudentFilter = () => {
    const students = getStudents();

    if (students.length === 0) return null;

    return (
      <div style={{ marginLeft: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontSize: "0.9rem", color: "#666" }}>
            Filter by students:
          </span>
          <StudentMenu
            analysis={analysis}
            selectedStudentIds={selectedStudentIds}
            onStudentSelect={setSelectedStudentIds}
            smallButtons={true}
            isOpen={studentMenuOpen}
            onOpenChange={setStudentMenuOpen}
          />
        </div>
      </div>
    );
  };

  // If students are selected, show individual student stats
  if (selectedStudentIds.length > 0) {
    const students = getStudents();
    const selectedStudents = students
      .filter(([id]) => selectedStudentIds.includes(id))
      .map(([id, student]) => ({ id, ...student }));

    return (
      <Card className="w-[99%] mx-auto my-2 shadow-md transition-shadow">
        <CardContent className="p-4">
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <div style={{ cursor: "pointer" }}>
              <ArrowBackIcon
                onClick={() => setAnalysis(null)}
                style={{
                  fontSize: "3rem",
                  padding: "0.5rem",
                  margin: "0.5rem",
                  color: "#666",
                  transition: "color 0.2s ease-in-out",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#1976d2";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#666";
                }}
              />
            </div>
            <StudentFilter />
          </div>

          <div style={{ marginBottom: "2rem", padding: "0 2rem" }}>
            <h2 className="text-2xl font-bold text-foreground mb-1">Course:</h2>
            <h1 className="text-4xl font-bold mb-2 text-foreground leading-tight">
              {(analysis?.courseName as string) || "Course Reports"}
            </h1>
            <p>
              Showing data for {selectedStudentIds.length} selected student
              {selectedStudentIds.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Collective Stats Section */}
          <div style={{ marginBottom: "3rem" }}>
            <h2
              className="text-2xl font-bold text-foreground mb-1"
              style={{ padding: "0 2rem" }}
            >
              Combined Statistics
            </h2>
            <StudentStats students={selectedStudents} />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-[99%] mx-auto my-2 shadow-md transition-shadow">
      <CardContent className="p-4">
        <div
          style={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <div style={{ cursor: "pointer" }}>
            <ArrowBackIcon
              onClick={() => setAnalysis(null)}
              style={{
                fontSize: "3rem",
                padding: "0.5rem",
                margin: "0.5rem",
                color: "#666",
                transition: "color 0.2s ease-in-out",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#1976d2";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#666";
              }}
            />
          </div>
          <StudentFilter />
        </div>

        {isAnalysisEmpty() ? (
          <div
            style={{
              textAlign: "center",
              padding: "4rem 2rem",
              color: "#666",
            }}
          >
            <h2 className="text-2xl font-bold text-foreground mb-1">
              No Data Available
            </h2>
            <p style={{ fontSize: "1.1rem" }}>
              No data available for this course. This could mean:
            </p>
            <ul
              style={{
                textAlign: "left",
                display: "inline-block",
                marginTop: "1rem",
                fontSize: "1rem",
              }}
            >
              <li>No conversations have been recorded yet</li>
              <li>No modules have been created</li>
              <li>No students have interacted with the course</li>
            </ul>
          </div>
        ) : (
          <>
            {/* Date Range Selector */}
            {availableDates.length > 0 && (
              <div style={{ marginBottom: "2rem", padding: "0 2rem" }}>
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  Course:
                </h2>
                <h1 className="text-4xl font-bold mb-2 text-foreground leading-tight">
                  {(analysis?.courseName as string) || "Course Reports"}
                </h1>
                <p
                  style={{
                    fontWeight: 500,
                    marginBottom: "1rem",
                  }}
                >
                  Select a date range to filter data
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    marginBottom: "1rem",
                    flexWrap: "wrap",
                  }}
                >
                  <div className="flex flex-col items-start">
                    <label
                      htmlFor="startDate"
                      className="mb-2 font-medium text-foreground"
                    >
                      Start Date:
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="px-3 py-2 rounded border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div className="flex flex-col items-start">
                    <label
                      htmlFor="endDate"
                      className="mb-2 font-medium text-foreground"
                    >
                      End Date:
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="px-3 py-2 rounded border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    marginBottom: "1rem",
                  }}
                >
                  <button
                    onClick={() => {
                      if (availableDates.length > 0) {
                        const firstDate = availableDates[0];
                        const lastDate =
                          availableDates[availableDates.length - 1];
                        setStartDate(firstDate);
                        setEndDate(lastDate);
                      }
                    }}
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
                    Select All Dates
                  </button>
                  <button
                    onClick={() => {
                      setStartDate("");
                      setEndDate("");
                    }}
                    style={{
                      padding: "0.3rem 0.8rem",
                      borderRadius: 4,
                      border: "1px solid #e53935",
                      background: "#fff",
                      color: "#e53935",
                      cursor: "pointer",
                    }}
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            )}
            {/* Daily Charts Section */}
            <div style={{ marginBottom: "3rem" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1.5rem",
                  alignItems: "start",
                  padding: "0 2rem",
                }}
                className="chart-grid"
              >
                <div style={{ marginBottom: "1rem" }}>
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    Daily Conversation Lengths
                  </h3>
                  <div ref={lengthsRef} />
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    Daily Conversation Counts
                  </h3>
                  <div ref={countsRef} />
                </div>
              </div>
            </div>

            {/* Module Usage & Classification Charts Section */}
            <div style={{ marginBottom: "3rem" }}>
              {/* Daily Charts Grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1.5rem",
                  alignItems: "start",
                  padding: "0 2rem",
                }}
                className="chart-grid"
              >
                <div style={{ marginBottom: "1rem" }}>
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    Module Usage
                  </h3>
                  {startDate && endDate ? (
                    <div ref={moduleUsageRef} />
                  ) : (
                    <EmptyChartPlaceholder title="Module Usage Data" />
                  )}
                </div>

                {/* <div style={{ marginBottom: "1rem" }}>
                <h3>Student Chat Classification</h3>
                {startDate && endDate ? (
                  showClassificationChart ? (
                    <div ref={chatClassificationRef} />
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "300px",
                        // border: "2px dashed #ccc",
                        borderRadius: "8px",
                        // backgroundColor: "#f9f9f9",
                        textAlign: "center",
                        padding: "2rem",
                      }}
                    >
                      Comment out until implemented <div
                        style={{
                          fontWeight: 600,
                          marginBottom: "1rem",
                          color: "#666",
                          fontSize: "1.1rem",
                        }}
                      >
                        Classification Data Available On Request
                      </div>
                      <button
                        onClick={() => setShowClassificationChart(true)}
                        style={{
                          padding: "0.75rem 1.5rem",
                          backgroundColor: "#1976d2",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "0.9rem",
                          fontWeight: 500,
                          cursor: "pointer",
                          transition: "background-color 0.2s ease",
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = "#1565c0";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = "#1976d2";
                        }}
                      >
                        View Classification Chart
                      </button>
                    </div>
                  )
                ) : (
                  <EmptyChartPlaceholder title="Classification Data" />
                )}
              </div> */}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
