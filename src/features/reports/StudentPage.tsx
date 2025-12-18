/**
 * StudentPage.tsx, component for displaying a page of student reports
 * Handles stacked charts for a set of selected students
 * Renders IndividualStudentStats.tsx for each student selected
 */
import React, { useEffect, useRef } from "react";
import IndividualStudentStats from "./IndividualStudentStats";
import * as Plot from "@observablehq/plot";
import { colorToHex, PLOT_COLOR_PALETTE } from "../../utility/reports/color";
import { parseLocalDate, formatDateForTooltip } from "../../utility/reports/date";
import { useTranslation } from "../../hooks/useTranslation";

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
        const date = parseLocalDate(d.date as string);
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
        const date = parseLocalDate(d.date as string);
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
  const { t } = useTranslation();
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
      ariaLabel: t("reports.stackedDailyConvoCounts"),
      x: {
        type: "time",
        label: t("common.date"),
      },
      y: { label: t("reports.numConvos") },
      color: { legend: true, label: t("reports.student"), range: PLOT_COLOR_PALETTE },
      marks: [
        Plot.rectY(counts, {
          x: "date",
          y: "value",
          fill: "studentName",
          title: (d: any) =>
            `${t("common.date")}: ${formatDateForTooltip(d.date)}\n${t("reports.student")}: ${d.studentName
            }\n ${t("reports.conversations")}: ${d.value}`,
          tip: {
            format: {
              x: (d: any) => formatDateForTooltip(d.date),
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

      setTimeout(() => {
        const rects = plot.querySelectorAll("rect[fill]");
        let dataIndex = 0;
        rects.forEach((rect) => {
          // Only process rects that are likely data points (have fill color)
          if (rect.getAttribute("fill") && dataIndex < counts.length) {
            const data = counts[dataIndex];
            rect.setAttribute("role", "img");
            rect.setAttribute(
              "aria-label",
              `${t("common.date")} ${data.date.toLocaleDateString()}, ${t("reports.student")} ${data.studentName
              }, ${data.value} ${t("reports.conversations")}`
            );
            rect.setAttribute("tabindex", "0");
            dataIndex++;
          }
        });
      }, 0);
    }
  }, [counts, backgroundColor, foregroundColor, t]);

  useEffect(() => {
    if (!lengths.length) return;
    const plot = Plot.plot({
      style: {
        background: "transparent",
        color: foregroundColor,
      },
      ariaLabel: t("reports.stackedDailyConvoLengths"),
      x: {
        type: "time",
        label: t("common.date"),
      },
      y: { label: t("reports.avgConvoLength") },
      color: { legend: true, label: t("reports.student"), range: PLOT_COLOR_PALETTE },
      marks: [
        Plot.rectY(lengths, {
          x: "date",
          y: "value",
          fill: "studentName",
          title: (d: any) =>
            `${t("common.date")}: ${formatDateForTooltip(d.date)}\n${t("reports.student")}: ${d.studentName
            }\n${t("reports.avgConvoLength")}: ${d.value.toFixed(1)}`,
          tip: {
            format: {
              x: (d: any) => formatDateForTooltip(d.date),
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

      setTimeout(() => {
        const rects = plot.querySelectorAll("rect[fill]");
        let dataIndex = 0;
        rects.forEach((rect) => {
          if (rect.getAttribute("fill") && dataIndex < lengths.length) {
            const data = lengths[dataIndex];
            rect.setAttribute("role", "img");
            rect.setAttribute(
              "aria-label",
              `${t("common.date")} ${data.date.toLocaleDateString()}, ${t("reports.student")} ${data.studentName
              }, ${t("reports.avgConvoLength")} ${data.value.toFixed(1)}`
            );
            rect.setAttribute("tabindex", "0");
            dataIndex++;
          }
        });
      }, 0);
    }
  }, [lengths, backgroundColor, foregroundColor, t]);

  useEffect(() => {
    if (!classificationData.length) return;
    const plot = Plot.plot({
      style: {
        background: "transparent",
        color: foregroundColor,
      },
      ariaLabel: ("reports.stackedClassificationCounts"),
      x: { label: t("reports.classification") },
      y: { label: t("reports.count") },
      color: { legend: true, label: t("reports.student"), range: PLOT_COLOR_PALETTE },
      marks: [
        Plot.barY(classificationData, {
          x: "classification",
          y: "count",
          fill: "studentName",
          title: (d: any) =>
            `${t("reports.classification")}: ${d.fullClassification || d.classification
            }\n${t("reports.student")}: ${d.studentName}\n${t("reports.count")}: ${d.count}`,
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
  }, [classificationData, backgroundColor, foregroundColor, t]);

  useEffect(() => {
    if (!moduleData.length) return;
    const plot = Plot.plot({
      style: {
        background: "transparent",
        color: foregroundColor,
      },
      ariaLabel: t("reports.stackedModuleUseage"),
      x: { label: t("common.modules") },
      y: { label: t("reports.count") },
      color: { legend: true, label: t("reports.student"), range: PLOT_COLOR_PALETTE },
      marks: [
        Plot.barY(moduleData, {
          x: "moduleName",
          y: "count",
          fill: "studentName",
          title: (d: any) =>
            `${t("common.modules")}: ${d.fullModuleName || d.moduleName}\n${t("reports.student")}: ${d.studentName
            }\n${t("reports.count")}: ${d.count}`,
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
      ],
      width: 500,
      height: 300,
    });
    if (moduleUsageRef.current) {
      moduleUsageRef.current.innerHTML = "";
      moduleUsageRef.current.appendChild(plot);

      setTimeout(() => {
        const rects = plot.querySelectorAll("rect[fill]");
        let dataIndex = 0;
        rects.forEach((rect) => {
          if (rect.getAttribute("fill") && dataIndex < moduleData.length) {
            const data = moduleData[dataIndex];
            rect.setAttribute("role", "img");
            rect.setAttribute(
              "aria-label",
              `${t("common.modules")} ${data.fullModuleName || data.moduleName}, ${t("reports.student")} ${data.studentName
              }, ${t("reports.count")} ${data.count}`
            );
            rect.setAttribute("tabindex", "0");
            dataIndex++;
          }
        });
      }, 0);
    }
  }, [moduleData, backgroundColor, foregroundColor, t]);

  return (
    <div>
      {students.length > 1 && (
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
            <h4
              className="text-2xl font-bold text-foreground mb-2"
              id="stacked-lengths-chart-heading"
            >
              {t("reports.dailyConversationLengths")} ({t("reports.stackedByStudent")})
            </h4>
            <div
              ref={lengthsRef}
              role="region"
              aria-labelledby="stacked-lengths-chart-heading"
              tabIndex={0}
              className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
            />
            <div className="sr-only">
              <table>
                <caption>{t("reports.dailyConvoLengthTable")}</caption>
                <thead>
                  <tr>
                    <th>{t("common.date")}</th>
                    <th>{t("reports.student")}</th>
                    <th>{t("reports.avgConvoLength")}</th>
                  </tr>
                </thead>
                <tbody>
                  {lengths.map((d, i) => (
                    <tr key={i}>
                      <td>{d.date.toLocaleDateString()}</td>
                      <td>{d.studentName}</td>
                      <td>{d.value.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card" style={{ marginBottom: "1rem" }}>
            <h4
              className="text-2xl font-bold text-foreground mb-2"
              id="stacked-counts-chart-heading"
            >
              {t("reports.dailyConversationCounts")} ({t("reports.stackedByStudent")})
            </h4>
            <div
              ref={countsRef}
              role="region"
              aria-labelledby="stacked-counts-chart-heading"
              tabIndex={0}
              className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
            />
            <div className="sr-only">
              <table>
                <caption>{t("reports.dailyConvoCountsTable")}</caption>
                <thead>
                  <tr>
                    <th>{t("common.date")}</th>
                    <th>{t("reports.student")}</th>
                    <th>{t("reports.conversations")}</th>
                  </tr>
                </thead>
                <tbody>
                  {counts.map((d, i) => (
                    <tr key={i}>
                      <td>{d.date.toLocaleDateString()}</td>
                      <td>{d.studentName}</td>
                      <td>{d.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card" style={{ marginBottom: "1rem" }}>
            <h4
              className="text-2xl font-bold text-foreground mb-2"
              id="stacked-module-usage-chart-heading"
            >
              {t("reports.moduleUsage")} ({t("reports.stackedByStudent")})
            </h4>
            <div
              ref={moduleUsageRef}
              role="region"
              aria-labelledby="stacked-module-usage-chart-heading"
              tabIndex={0}
              className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
            />
            <div className="sr-only">
              <table>
                <caption>{t("reports.moduleUsageTable")}</caption>
                <thead>
                  <tr>
                    <th>{t("common.modules")}</th>
                    <th>{t("reports.student")}</th>
                    <th>{t("reports.count")}</th>
                  </tr>
                </thead>
                <tbody>
                  {moduleData.map((d, i) => (
                    <tr key={i}>
                      <td>{d.fullModuleName || d.moduleName}</td>
                      <td>{d.studentName}</td>
                      <td>{d.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* <div className="card" style={{ marginBottom: "1rem" }}>
          <h4>Classification Counts (Stacked by Student)</h4>
          <div ref={classificationRef} />
        </div> */}
        </div>
      )}
      <h2
        className="text-2xl font-bold text-foreground mb-1"
        style={{ padding: "0 2rem" }}
      >
        {t("reports.individualStats")}
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
