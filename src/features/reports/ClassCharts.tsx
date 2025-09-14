import { useCallback, useEffect, useRef, useState } from "react";
import * as Plot from "@observablehq/plot";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import IndividualStudentStats from "./IndividualStudentStats";
import StudentMenu from "./StudentMenu";

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
  const [showClassificationChart, setShowClassificationChart] =
    useState<boolean>(false);
  const [chartRefreshTrigger, setChartRefreshTrigger] = useState<number>(0);
  const [studentMenuOpen, setStudentMenuOpen] = useState<boolean>(false);
  const lengthsRef = useRef<HTMLDivElement>(null);
  const chatClassificationRef = useRef<HTMLDivElement>(null);
  const countsRef = useRef<HTMLDivElement>(null);
  const moduleUsageRef = useRef<HTMLDivElement>(null);

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

  // Helper functions for stacked charts
  const getStudentName = useCallback((student: Record<string, unknown>) => {
    const info = student.info as Record<string, unknown> | undefined;
    return info
      ? `${info.name as string} ${info.family_name as string}`
      : "Unknown";
  }, []);

  const getStackedDailyData = useCallback(
    (students: Record<string, unknown>[]) => {
      const counts: Array<{ date: Date; value: number; studentName: string }> =
        [];
      const lengths: Array<{ date: Date; value: number; studentName: string }> =
        [];

      students.forEach((student) => {
        const studentName = getStudentName(student);
        const dailyConvoCounts = student.dailyConvoCounts as
          | Array<Record<string, unknown>>
          | undefined;
        if (dailyConvoCounts) {
          dailyConvoCounts.forEach((d) => {
            counts.push({
              date: new Date(d.date as string),
              value: d.num_convos as number,
              studentName,
            });
          });
        }
        const dailyConvoLengths = student.dailyConvoLengths as
          | Array<Record<string, unknown>>
          | undefined;
        if (dailyConvoLengths) {
          dailyConvoLengths.forEach((d) => {
            lengths.push({
              date: new Date(d.date as string),
              value: d.avg_convo_length as number,
              studentName,
            });
          });
        }
      });
      return { counts, lengths };
    },
    [getStudentName]
  );

  const getStackedClassificationData = useCallback(
    (students: Record<string, unknown>[]) => {
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
    },
    [getStudentName, truncateLabel]
  );

  const getStackedModuleUsageData = useCallback(
    (students: Record<string, unknown>[]) => {
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
    },
    [getStudentName, truncateLabel]
  );

  // Render stacked charts for collective stats
  const renderStackedCharts = useCallback(
    (students: Record<string, unknown>[]) => {
      const { counts, lengths } = getStackedDailyData(students);
      const classificationData = getStackedClassificationData(students);
      const moduleData = getStackedModuleUsageData(students);

      // Render stacked daily conversation counts
      if (counts.length > 0) {
        const plot = Plot.plot({
          x: {
            type: "time",
            label: "Date",
          },
          y: { label: "Number of Conversations" },
          color: { legend: true, label: "Student", scheme: "category10" },
          marks: [
            Plot.rectY(counts, {
              x: "date",
              y: "value",
              fill: "studentName",
              tip: { fill: "white" },
              interval: "1 day",
            }),
          ],
          width: 500,
          height: 300,
        });
        const countsContainer = document.getElementById("stacked-counts");
        if (countsContainer) {
          countsContainer.innerHTML = "";
          countsContainer.appendChild(plot);
        }
      }

      // Render stacked daily conversation lengths
      if (lengths.length > 0) {
        const plot = Plot.plot({
          x: {
            type: "time",
            label: "Date",
          },
          y: { label: "Avg Conversation Length" },
          color: { legend: true, label: "Student", scheme: "category10" },
          marks: [
            Plot.rectY(lengths, {
              x: "date",
              y: "value",
              fill: "studentName",
              tip: { fill: "white" },
              interval: "1 day",
            }),
          ],
          width: 500,
          height: 300,
        });
        const lengthsContainer = document.getElementById("stacked-lengths");
        if (lengthsContainer) {
          lengthsContainer.innerHTML = "";
          lengthsContainer.appendChild(plot);
        }
      }

      // Render stacked classification data
      if (classificationData.length > 0) {
        const plot = Plot.plot({
          x: { label: "Classification" },
          y: { label: "Count" },
          color: { legend: true, label: "Student", scheme: "category10" },
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
                  x: (d: any) => d.fullClassification || d.classification, // Show full name in tooltip
                },
                fill: "white",
              },
              order: "stack",
            }),
          ],
          width: 500,
          height: 300,
        });
        const classificationContainer = document.getElementById(
          "stacked-classification"
        );
        if (classificationContainer) {
          classificationContainer.innerHTML = "";
          classificationContainer.appendChild(plot);
        }
      }

      // Render stacked module usage data
      if (moduleData.length > 0) {
        const plot = Plot.plot({
          x: { label: "Module" },
          y: { label: "Count" },
          color: { legend: true, label: "Student", scheme: "category10" },
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
                  x: (d: any) => d.fullModuleName || d.moduleName, // Show full name in tooltip
                },
                fill: "white",
              },
              order: "stack",
            }),
          ],
          width: 500,
          height: 300,
        });
        const moduleContainer = document.getElementById("stacked-module");
        if (moduleContainer) {
          moduleContainer.innerHTML = "";
          moduleContainer.appendChild(plot);
        }
      }
    },
    [
      getStackedDailyData,
      getStackedClassificationData,
      getStackedModuleUsageData,
    ]
  );

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
      // Charts will be rendered by the individual useEffect hooks
      // No need to manually call renderCharts()
    }
  }, [selectedStudentIds.length, analysis, isAnalysisEmpty]);

  // Render stacked charts when selected students change
  useEffect(() => {
    if (selectedStudentIds.length > 0 && analysis) {
      const students = getStudents();
      const selectedStudents = students
        .filter(([id]) => selectedStudentIds.includes(id))
        .map(([id, student]) => ({ id, ...student }));

      const timer = setTimeout(() => {
        renderStackedCharts(selectedStudents);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedStudentIds, analysis, getStudents, renderStackedCharts]);

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
    // Make it taller to accommodate rotated labels
    const maxHeight = Math.min(maxWidth * 0.8, 500);
    return { width: maxWidth, height: maxHeight };
  };

  useEffect(() => {
    if (!analysis || !startDate || !endDate) return;

    const aggregatedData = getAggregatedModuleData();
    const { width, height } = getModuleChartDimensions();

    const plot = Plot.plot({
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
        scheme: "cividis",
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
            fill: "white",
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
      style: {},
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
          Plot.pointerX({ x: "date", y: "avg_convo_length", fill: "white" })
        ),
      ],
      width,
      height,
    });
    if (lengthsRef.current) {
      lengthsRef.current.innerHTML = "";
      lengthsRef.current.appendChild(plot);
    }
  }, [analysis, startDate, endDate, chartRefreshTrigger]);

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
          Plot.pointerX({ x: "date", y: "num_convos", fill: "white" })
        ),
      ],
      width,
      height,
    });
    if (countsRef.current) {
      countsRef.current.innerHTML = "";
      countsRef.current.appendChild(plot);
    }
  }, [analysis, startDate, endDate, chartRefreshTrigger]);

  useEffect(() => {
    if (!analysis || !startDate || !endDate || !showClassificationChart) return;

    const aggregatedData = getAggregatedClassificationData();
    const { width, height } = getModuleChartDimensions();
    const plot = Plot.plot({
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
        scheme: "cividis",
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
            fill: "white",
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
    showClassificationChart,
    chartRefreshTrigger,
    getAggregatedClassificationData,
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
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "2rem",
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

        <div style={{ marginBottom: "2rem" }}>
          <h2>Individual Student Statistics</h2>
          <p style={{ color: "#666", marginBottom: "1rem" }}>
            Showing data for {selectedStudentIds.length} selected student
            {selectedStudentIds.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Collective Stats Section */}
        <div style={{ marginBottom: "3rem" }}>
          <h3>Combined Statistics</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1.5rem",
              alignItems: "start",
              marginBottom: "2rem",
            }}
            className="chart-grid"
          >
            <div style={{ marginBottom: "1rem" }}>
              <h4>Module Usage (Stacked by Student)</h4>
              <div id="stacked-module" style={{ minHeight: "300px" }} />
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <h4>Classification Counts (Stacked by Student)</h4>
              <div id="stacked-classification" style={{ minHeight: "300px" }} />
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <h4>Daily Conversation Lengths (Stacked by Student)</h4>
              <div id="stacked-lengths" style={{ minHeight: "300px" }} />
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <h4>Daily Conversation Counts (Stacked by Student)</h4>
              <div id="stacked-counts" style={{ minHeight: "300px" }} />
            </div>
          </div>
        </div>

        {selectedStudents.map((student, index) => (
          <div
            key={student.id}
            style={{
              marginBottom:
                index < selectedStudents.length - 1 ? "3rem" : "1rem",
              borderBottom:
                index < selectedStudents.length - 1 ? "1px solid #eee" : "none",
              paddingBottom: index < selectedStudents.length - 1 ? "2rem" : "0",
            }}
          >
            <IndividualStudentStats student={student} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div
        style={{ display: "flex", alignItems: "center", marginBottom: "2rem" }}
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
          <h2 style={{ marginBottom: "1rem", color: "#333" }}>
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
            <div style={{ marginBottom: "2rem" }}>
              <h3 style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                Select Date Range
              </h3>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "1rem",
                  marginBottom: "1rem",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <label
                    htmlFor="startDate"
                    style={{ marginBottom: "0.5rem", fontWeight: 500 }}
                  >
                    Start Date:
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{
                      padding: "0.5rem",
                      borderRadius: 4,
                      border: "1px solid #ccc",
                      fontSize: "0.9rem",
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <label
                    htmlFor="endDate"
                    style={{ marginBottom: "0.5rem", fontWeight: 500 }}
                  >
                    End Date:
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{
                      padding: "0.5rem",
                      borderRadius: 4,
                      border: "1px solid #ccc",
                      fontSize: "0.9rem",
                    }}
                  />
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
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
              }}
              className="chart-grid"
            >
              <div style={{ marginBottom: "1rem" }}>
                <h3>Daily Conversation Lengths</h3>
                <div ref={lengthsRef} />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <h3>Daily Conversation Counts</h3>
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
              }}
              className="chart-grid"
            >
              <div style={{ marginBottom: "1rem" }}>
                <h3>Module Usage</h3>
                {startDate && endDate ? (
                  <div ref={moduleUsageRef} />
                ) : (
                  <EmptyChartPlaceholder title="Module Usage Data" />
                )}
              </div>

              <div style={{ marginBottom: "1rem" }}>
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
                      {/* Comment out until implemented <div
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
                      </button> */}
                    </div>
                  )
                ) : (
                  <EmptyChartPlaceholder title="Classification Data" />
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
