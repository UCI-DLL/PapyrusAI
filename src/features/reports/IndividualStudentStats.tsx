/**
 * IndividualStudentStats.tsx, component for displaying a single student's report
 * Handles individual charts for a student's data
 */
import React, { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as Plot from "@observablehq/plot";
import { colorToHex, PLOT_COLOR_PALETTE } from "../../utility/reports/color";
import { parseLocalDate, formatDateForTooltip } from "../../utility/reports/date";
import { useTranslation } from "../../hooks/useTranslation";

type StudentStatsProps = {
  student: Record<string, unknown>;
};

export default function IndividualStudentStats({ student }: StudentStatsProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
  const backgroundColor = colorToHex(
    getComputedStyle(document.documentElement).getPropertyValue("--background")
  );
  const foregroundColor = colorToHex(
    getComputedStyle(document.documentElement).getPropertyValue("--foreground")
  );

  // Helper function to truncate long labels
  const truncateLabel = useCallback((label: string, maxLength: number = 15) => {
    if (label.length <= maxLength) return label;
    return label.substring(0, maxLength - 3) + "...";
  }, []);


  // Get chart dimensions specifically for module usage (taller to accommodate rotated labels)
  const getModuleChartDimensions = () => {
    const containerWidth =
      moduleUsageRef.current?.parentElement?.offsetWidth || 500;
    const maxWidth = Math.min(containerWidth - 40, 500);
    // Make it taller to accommodate rotated labels
    const maxHeight = Math.min(maxWidth * 0.8, 400);
    return { width: maxWidth, height: maxHeight };
  };

  useEffect(() => {
    if (!dailyConvoLengths || dailyConvoLengths.length === 0) return;

    // Parse date strings to Date objects
    const processedData = dailyConvoLengths.map((item) => ({
      ...item,
      date: parseLocalDate(item.date as string),
    }));
    console.log(processedData);

    const plot = Plot.plot({
      style: {
        background: "transparent",
        color: foregroundColor,
      },
      ariaLabel: t("reports.individualDailyConvoLength"),
      x: { label: t("common.date"), type: "time" },
      y: { label: t("reports.avgConvoLength") },
      marks: [
        Plot.line(processedData, { x: "date", y: "avg_convo_length" }),
        Plot.dot(processedData, { x: "date", y: "avg_convo_length" }),
        Plot.tip(
          processedData,
          Plot.pointerX({
            x: "date",
            y: "avg_convo_length",
            fill: backgroundColor,
            format: {
              x: (date: any) => formatDateForTooltip(date),
            },
          })
        ),
      ],
      width: 500,
      height: 300,
    });
    if (lengthsRef.current) {
      lengthsRef.current.innerHTML = "";
      lengthsRef.current.appendChild(plot);

      setTimeout(() => {
        const dots = plot.querySelectorAll("circle");
        let dataIndex = 0;
        dots.forEach((dot) => {
          if (dataIndex < processedData.length) {
            const data = processedData[dataIndex] as any;
            dot.setAttribute("role", "img");
            dot.setAttribute(
              "aria-label",
              `${t("common.date")} ${data.date.toLocaleDateString()}, ${t("reports.avgConvoLength")} ${data.avg_convo_length
              }`
            );
            dot.setAttribute("tabindex", "0");
            dataIndex++;
          }
        });
      }, 0);
    }
  }, [dailyConvoLengths, backgroundColor, foregroundColor, t]);

  useEffect(() => {
    if (!dailyConvoCounts || dailyConvoCounts.length === 0) return;

    // Parse date strings to Date objects
    const processedData = dailyConvoCounts.map((item) => ({
      ...item,
      date: parseLocalDate(item.date as string),
    }));

    const plot = Plot.plot({
      style: {
        background: "transparent",
        color: foregroundColor,
      },
      ariaLabel: t("common.individualDailyConvoCount"),
      x: { label: t("common.date"), type: "time" },
      y: { label: t("common.numConvos") },
      marks: [
        Plot.line(processedData, { x: "date", y: "num_convos" }),
        Plot.dot(processedData, { x: "date", y: "num_convos" }),
        Plot.tip(
          processedData,
          Plot.pointerX({
            x: "date",
            y: "num_convos",
            fill: backgroundColor,
            format: {
              x: (date: any) => formatDateForTooltip(date),
            },
          })
        ),
      ],
      width: 500,
      height: 300,
    });
    if (countsRef.current) {
      countsRef.current.innerHTML = "";
      countsRef.current.appendChild(plot);

      // Chart container is already set up in JSX with tabindex and aria-labelledby

      setTimeout(() => {
        const dots = plot.querySelectorAll("circle");
        let dataIndex = 0;
        dots.forEach((dot) => {
          if (dataIndex < processedData.length) {
            const data = processedData[dataIndex] as any;
            dot.setAttribute("role", "img");
            dot.setAttribute(
              "aria-label",
              `${t("common.date")} ${data.date.toLocaleDateString()}, ${t("common.numConvos")} ${data.num_convos
              }`
            );
            dot.setAttribute("tabindex", "0");
            dataIndex++;
          }
        });
      }, 0);
    }
  }, [dailyConvoCounts, backgroundColor, foregroundColor, t]);

  useEffect(() => {
    if (!classificationCounts || classificationCounts.length === 0) return;

    // Process classification data to truncate long names
    const processedClassificationData = classificationCounts.map((item) => ({
      ...item,
      classification: truncateLabel(item.classification as string),
      fullClassification: item.classification as string, // Keep original for tooltips
    }));

    const { width, height } = getModuleChartDimensions(); // Use same dimensions

    const plot = Plot.plot({
      style: {
        background: "transparent",
        color: foregroundColor,
      },
      ariaLabel: t("reports.individualClassification"),
      x: {
        label: t("reports.classification"),
        tickRotate: processedClassificationData.length > 5 ? -45 : 0, // Rotate labels if more than 5 classifications
        tickSize: 6,
        padding: 0.1,
      },
      y: { label: t("reports.count") },
      color: {
        legend: true,
        range: PLOT_COLOR_PALETTE,
        domain: processedClassificationData.map(
          (d) => d.fullClassification || d.classification
        ), // Use full names in legend
      },
      marks: [
        Plot.barY(processedClassificationData, {
          x: "classification",
          y: "count",
          fill: (d: any) => d.fullClassification || d.classification, // Use full names for color mapping
          title: (d: any) =>
            `${t("reports.classification")}: ${d.fullClassification || d.classification
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
        Plot.text(processedClassificationData, {
          x: "classification",
          y: "count",
          text: "count",
          dy: -8,
          fontSize: 12,
          fill: foregroundColor,
          fontWeight: "bold",
        }),
      ],
      width,
      height,
      marginLeft: processedClassificationData.length > 5 ? 60 : 40, // More margin for rotated labels
      marginBottom: processedClassificationData.length > 5 ? 80 : 40, // More margin for rotated labels
    });
    if (classificationRef.current) {
      classificationRef.current.innerHTML = "";
      classificationRef.current.appendChild(plot);

      setTimeout(() => {
        const rects = plot.querySelectorAll("rect[fill]");
        let dataIndex = 0;
        rects.forEach((rect) => {
          if (
            rect.getAttribute("fill") &&
            dataIndex < processedClassificationData.length
          ) {
            const data = processedClassificationData[dataIndex] as any;
            rect.setAttribute("role", "img");
            rect.setAttribute(
              "aria-label",
              `${t("reports.classification")} ${data.fullClassification || data.classification
              }, ${t("reports.count")} ${data.count}`
            );
            rect.setAttribute("tabindex", "0");
            dataIndex++;
          }
        });
      }, 0);
    }
  }, [classificationCounts, truncateLabel, backgroundColor, foregroundColor, t]);

  useEffect(() => {
    if (!moduleUsage || moduleUsage.length === 0) return;

    // Process module data to truncate long names
    const processedModuleData = moduleUsage.map((item) => ({
      ...item,
      moduleName: truncateLabel(item.moduleName as string),
      fullModuleName: item.moduleName as string, // Keep original for tooltips
    }));

    const { width, height } = getModuleChartDimensions();

    const plot = Plot.plot({
      style: {
        background: "transparent",
        color: foregroundColor,
      },
      ariaLabel: t("reports.individualStudentModuleUsage"),
      x: {
        label: t("common.module"),
        tickRotate: processedModuleData.length > 5 ? -45 : 0, // Rotate labels if more than 5 modules
        tickSize: 6,
        padding: 0.1,
      },
      y: { label: t("reports.count") },
      color: {
        legend: true,
        range: PLOT_COLOR_PALETTE,
        domain: processedModuleData.map(
          (d) => d.fullModuleName || d.moduleName
        ), // Use full names in legend
      },
      marks: [
        Plot.barY(processedModuleData, {
          x: "moduleName",
          y: "count",
          fill: (d: any) => d.fullModuleName || d.moduleName, // Use full names for color mapping
          title: (d: any) =>
            `${t("common.module")}: ${d.fullModuleName || d.moduleName}\n${t("reports.count")}: ${d.count}`,
          tip: {
            format: {
              x: (d: any) => d.fullModuleName || d.moduleName, // Show full name in tooltip
              fill: (d: any) => d.fullModuleName || d.moduleName, // Show full name in tooltip
              count: true,
            },
            fill: backgroundColor,
          },
        }),
        Plot.text(processedModuleData, {
          x: "moduleName",
          y: "count",
          text: "count",
          dy: -8,
          fontSize: 12,
          fill: foregroundColor,
          fontWeight: "bold",
        }),
      ],
      width,
      height,
      marginLeft: processedModuleData.length > 5 ? 60 : 40, // More margin for rotated labels
      marginBottom: processedModuleData.length > 5 ? 80 : 40, // More margin for rotated labels
    });
    if (moduleUsageRef.current) {
      moduleUsageRef.current.innerHTML = "";
      moduleUsageRef.current.appendChild(plot);

      setTimeout(() => {
        const rects = plot.querySelectorAll("rect[fill]");
        let dataIndex = 0;
        rects.forEach((rect) => {
          if (
            rect.getAttribute("fill") &&
            dataIndex < processedModuleData.length
          ) {
            const data = processedModuleData[dataIndex] as any;
            rect.setAttribute("role", "img");
            rect.setAttribute(
              "aria-label",
              `${t("common.module")} ${data.fullModuleName || data.moduleName}, ${t("reports.count")} ${data.count
              }`
            );
            rect.setAttribute("tabindex", "0");
            dataIndex++;
          }
        });
      }, 0);
    }
  }, [moduleUsage, truncateLabel, backgroundColor, foregroundColor, t]);

  if (!student) return null;
  return (
    <div style={{ padding: "0 2rem", marginBottom: "3rem" }}>
      <h2 className="text-2xl font-bold text-foreground mb-1">
        {t("reports.student")}: {info?.name as string} {info?.family_name as string}
      </h2>
      <p>{t("reports.email")}: {info?.email as string}</p>
      <p>{t("reports.totalMessages")}: {totalMessages}</p>
      <button
        onClick={() => {
          const userId = info?.username || student.id || "unknown";

          navigate(`/reports/${userId}`);
        }}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: "#1976d2",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "0.9rem",
          fontWeight: 500,
          marginTop: "0.5rem",
          transition: "background-color 0.2s ease",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = "#1565c0";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = "#1976d2";
        }}
      >
        {t("reports.viewDetailedReports")}
      </button>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1.5rem",
          marginTop: "2rem",
          padding: "0 2rem",
        }}
        className="chart-grid"
      >
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h2
            className="text-2xl font-bold text-foreground mb-2"
            id="lengths-chart-heading"
          >
            {t("reports.dailyConversationLengths")}
          </h2>
          <div
            ref={lengthsRef}
            role="region"
            aria-labelledby="lengths-chart-heading"
            tabIndex={0}
            className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
          />
          {dailyConvoLengths && dailyConvoLengths.length > 0 && (
            <div className="sr-only">
              <table>
                <caption>{t("reports.dailyConvoLengthTable")}</caption>
                <thead>
                  <tr>
                    <th>{t("common.date")}</th>
                    <th>{t("reports.avgConvoLength")}</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyConvoLengths.map((d: any, i) => (
                    <tr key={i}>
                      <td>
                        {parseLocalDate(d.date as string).toLocaleDateString()}
                      </td>
                      <td>{d.avg_convo_length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h2
            className="text-2xl font-bold text-foreground mb-2"
            id="counts-chart-heading"
          >
            {t("reports.dailyConversationCounts")}
          </h2>
          <div
            ref={countsRef}
            role="region"
            aria-labelledby="counts-chart-heading"
            tabIndex={0}
            className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
          />
          {dailyConvoCounts && dailyConvoCounts.length > 0 && (
            <div className="sr-only">
              <table>
                <caption>{t("reports.dailyConvoCountsTable")}</caption>
                <thead>
                  <tr>
                    <th>{t("common.date")}</th>
                    <th>{t("reports.count")}</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyConvoCounts.map((d: any, i) => (
                    <tr key={i}>
                      <td>
                        {parseLocalDate(d.date as string).toLocaleDateString()}
                      </td>
                      <td>{d.num_convos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h2
            className="text-2xl font-bold text-foreground mb-2"
            id="module-usage-chart-heading"
          >
            {t("reports.moduleUsage")}
          </h2>
          <div
            ref={moduleUsageRef}
            role="region"
            aria-labelledby="module-usage-chart-heading"
            tabIndex={0}
            className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
          />
          {moduleUsage && moduleUsage.length > 0 && (
            <div className="sr-only">
              <table>
                <caption>{t("reports.moduleUsageTable")}</caption>
                <thead>
                  <tr>
                    <th>{t("common.module")}</th>
                    <th>{t("reports.count")}</th>
                  </tr>
                </thead>
                <tbody>
                  {moduleUsage.map((d: any, i) => (
                    <tr key={i}>
                      <td>{d.moduleName}</td>
                      <td>{d.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {/* <div className="card" style={{ marginBottom: "1rem" }}>
          <h2>Classification Counts</h2>
          <div ref={classificationRef} />
        </div> */}
      </div>
    </div>
  );
}
