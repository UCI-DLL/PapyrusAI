import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Get from "../../utility/Get";
import Post from "../../utility/Post";
import Put from "../../utility/Put";
import { getGrades, postReleaseAllGrades, putUpdateGrade } from "../../utility/endpoints/GradeEndpoints";
import { getCourse, getUsersInCourse } from "../../utility/endpoints/CourseEndpoints";
import { getConversation } from "../../utility/endpoints/ConversationEndpoints";
import { GradeType, ModuleType } from "../../utility/types/CourseTypes";
import { CustomUserType } from "../../utility/types/UserTypes";
import { AlertContext } from "../../utility/context/AlertContext";
import { useTranslation } from "../../hooks/useTranslation";
import { DialogWrapper } from "../../components/ui-wrappers/DialogWrapper";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Checkbox } from "../../components/ui/checkbox";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../../components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { PageLoader, PageHeaderCard } from "../../components/Common";
import { logEvent } from "../../utility/endpoints/UserEndpoints";
import {
  ArrowUpDown, CheckCircle, ChevronLeft, ChevronRight, ClipboardCheck, Clock, Download, RefreshCw,
  MessageSquare, SlidersHorizontal, Users, Star,
} from "lucide-react";

const ROWS_OPTIONS = [10, 25, 50] as const;
type ExportFormat = "json" | "txt" | "csv";
function csvCell(v: string | number | null | undefined): string {
  if (v == null) return "";
  const s = String(v);
  return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
}
type SortBy = "name-asc" | "name-desc" | "email-asc" | "email-desc" | "score-asc" | "score-desc" | "time-asc" | "time-desc";

export default function ReviewModuleReports(): JSX.Element {
  const { courseId = "", moduleId = "" } = useParams<{ courseId: string; moduleId: string }>();
  const navigate = useNavigate();
  const { setAlert } = useContext(AlertContext);
  const { t } = useTranslation();

  const SORT_LABELS: Record<SortBy, string> = {
    "name-asc": t("reviewReports.sortNameAZ"), "name-desc": t("reviewReports.sortNameZA"),
    "email-asc": t("reviewReports.sortEmailAZ"), "email-desc": t("reviewReports.sortEmailZA"),
    "score-asc": t("reviewReports.sortScoreLowHigh"), "score-desc": t("reviewReports.sortScoreHighLow"),
    "time-asc": t("reviewReports.sortSubmittedFirst"), "time-desc": t("reviewReports.sortSubmittedLast"),
  };

  const [courseName, setCourseName] = useState("");
  const [module, setModule] = useState<ModuleType>();
  const [grades, setGrades] = useState<GradeType[]>([]);
  const [students, setStudents] = useState<CustomUserType[]>([]);
  const [dataKey, setDataKey] = useState<string | null>(null);
  const [gradesLoading, setGradesLoading] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [openReleaseAllModal, setOpenReleaseAllModal] = useState(false);
  const [selectedUsernames, setSelectedUsernames] = useState<Set<string>>(new Set());
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("json");
  const [exportLoading, setExportLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [approveConfirmStudent, setApproveConfirmStudent] = useState<{ student: CustomUserType; grade: GradeType } | null>(null);
  const [approveNotes, setApproveNotes] = useState("");

  const paramsKey = courseId && moduleId ? `${courseId}:${moduleId}` : null;
  const isLoading = dataKey !== paramsKey;

  const [search, setSearch] = useState("");
  const [submittedFilter, setSubmittedFilter] = useState<"all" | "submitted" | "not-submitted">("all");
  const [sortBy, setSortBy] = useState<SortBy>("name-asc");
  const [scoreMin, setScoreMin] = useState("");
  const [scoreMax, setScoreMax] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!courseId || !moduleId) return;
    const controller = new AbortController();
    const key = `${courseId}:${moduleId}`;

    let courseReady = false;
    let studentsReady = false;
    let gradesReady = false;
    const checkReady = () => {
      if (courseReady && studentsReady && gradesReady) setDataKey(key);
    };

    Post(logEvent(), { eventType: "view_page", metadata: { courseId, moduleId, page: "review_module_reports" } });

    Get(getCourse(courseId), controller.signal).then((res) => {
      if (controller.signal.aborted) return;
      if (res?.status < 300 && res.data) {
        setCourseName(res.data.name ?? "");
        setModule(res.data.modules.find((m: ModuleType) => m.id === moduleId));
      } else if (res?.status === 401) {
        navigate("/login");
      }
      courseReady = true;
      checkReady();
    });

    const fetchStudents = (nextToken?: string, acc: CustomUserType[] = []) => {
      Get(getUsersInCourse(courseId, 50, nextToken ?? ""), controller.signal).then((res) => {
        if (controller.signal.aborted) return;
        if (res?.status < 300 && res.data) {
          const pageUsers = Array.isArray(res.data.users) ? res.data.users : [];
          const all = [...acc, ...pageUsers];
          if (res.data.nextToken) fetchStudents(res.data.nextToken, all);
          else { setStudents(all); studentsReady = true; checkReady(); }
        } else {
          studentsReady = true;
          checkReady();
        }
      });
    };
    fetchStudents();

    Get(getGrades(courseId, moduleId), controller.signal, true).then((res) => {
      if (controller.signal.aborted) return;
      if (res?.status < 300 && res.data) {
        setGrades(Array.isArray(res.data) ? res.data : []);
      } else if (res?.status === 401) {
        navigate("/login");
      }
      gradesReady = true;
      checkReady();
    });

    return () => controller.abort();
    // eslint-disable-next-line
  }, [courseId, moduleId]);

  function loadGrades(cId: string, mId: string, signal?: AbortSignal) {
    setGradesLoading(true);
    Get(getGrades(cId, mId), signal, true).then((res) => {
      if (res?.status < 300 && res.data) {
        setGrades(Array.isArray(res.data) ? res.data : []);
      } else if (res?.status === 401) {
        navigate("/login");
      }
      setGradesLoading(false);
    });
  }

  function handleReleaseAll() {
    setIsReleasing(true);
    setOpenReleaseAllModal(false);
    Post(postReleaseAllGrades(courseId, moduleId), {}, true).then((res) => {
      if (res?.status < 300) {
        setAlert({ message: t("reviewReports.gradesReleased"), type: "success" });
        loadGrades(courseId, moduleId);
      } else if (res?.status === 401) {
        navigate("/login");
      } else {
        setAlert({ message: t("errorMessage.genericError"), type: "error" });
      }
      setIsReleasing(false);
    });
  }

  function openApproveDialog(student: CustomUserType) {
    const studentGrades = grades.filter(g => g.username === student.username)
      .sort((a, b) => parseInt(a.timestamp, 10) - parseInt(b.timestamp, 10));
    const pendingGrade = studentGrades.find(g => !g.released);
    if (!pendingGrade) return;
    setApproveNotes(pendingGrade.instructorNotes ?? "");
    setApproveConfirmStudent({ student, grade: pendingGrade });
  }

  async function handleApproveConfirm() {
    if (!approveConfirmStudent) return;
    const { student, grade: pendingGrade } = approveConfirmStudent;
    const conversationId = pendingGrade.courseModuleConversationId.split("+").pop() ?? "";
    const key = `${student.username}_approve`;
    setActionLoading(prev => ({ ...prev, [key]: true }));
    const res = await Put(putUpdateGrade(courseId, moduleId, student.username, conversationId), {
      scores: pendingGrade.scores,
      totalScore: pendingGrade.totalScore,
      instructorNotes: approveNotes,
      released: true,
    }, true);
    if (res?.status < 300) {
      setAlert({ message: t("reviewReports.gradeApproved"), type: "success" });
      loadGrades(courseId, moduleId);
    } else {
      setAlert({ message: t("errorMessage.genericError"), type: "error" });
    }
    setActionLoading(prev => ({ ...prev, [key]: false }));
    setApproveConfirmStudent(null);
  }

  // Derived data
  const rubric = module?.rubrics?.[0];
  const maxPerCriterion = rubric ? Math.max(...rubric.columns.map(Number).filter(Number.isFinite)) : undefined;
  const maxTotal = maxPerCriterion !== undefined && rubric ? rubric.criteria.length * maxPerCriterion : undefined;
  const studentsSubmitted = new Set(grades.map((g) => g.username)).size;
  const avgScore =
    grades.length > 0
      ? (grades.reduce((sum, g) => sum + g.totalScore, 0) / grades.length).toFixed(1)
      : null;

  const isSummative = module?.assessmentType === "summative";
  const reviewedCount = grades.filter(g => g.released).length;
  const needsReviewCount = grades.filter(g => !g.released).length;

  const gradesByUser = grades.reduce<Record<string, GradeType[]>>((acc, g) => {
    (acc[g.username] ??= []).push(g);
    return acc;
  }, {});

  const pendingGradeByUser: Record<string, GradeType | undefined> = Object.fromEntries(
    Object.entries(gradesByUser).map(([u, gs]) => [
      u,
      [...gs].sort((a, b) => parseInt(a.timestamp, 10) - parseInt(b.timestamp, 10)).find(g => !g.released),
    ])
  );

  const bestGradeByUser = Object.fromEntries(
    Object.entries(gradesByUser).map(([u, gs]) => [
      u,
      gs.reduce((best, g) => (g.totalScore > best.totalScore ? g : best)),
    ])
  );

  const sortedStudents = [...students].sort((a, b) => {
    const aBest = bestGradeByUser[a.username];
    const bBest = bestGradeByUser[b.username];
    switch (sortBy) {
      case "name-asc":
      case "name-desc": {
        const cmp = (a.family_name ?? "").localeCompare(b.family_name ?? "") || (a.name ?? "").localeCompare(b.name ?? "");
        return sortBy === "name-asc" ? cmp : -cmp;
      }
      case "email-asc":
      case "email-desc": {
        const cmp = (a.email ?? "").localeCompare(b.email ?? "");
        return sortBy === "email-asc" ? cmp : -cmp;
      }
      case "score-asc":
      case "score-desc": {
        const aScore = aBest?.totalScore ?? (sortBy === "score-asc" ? Infinity : -Infinity);
        const bScore = bBest?.totalScore ?? (sortBy === "score-asc" ? Infinity : -Infinity);
        return sortBy === "score-asc" ? aScore - bScore : bScore - aScore;
      }
      case "time-asc":
      case "time-desc": {
        const aTime = aBest ? parseInt(aBest.timestamp, 10) : (sortBy === "time-asc" ? Infinity : -Infinity);
        const bTime = bBest ? parseInt(bBest.timestamp, 10) : (sortBy === "time-asc" ? Infinity : -Infinity);
        return sortBy === "time-asc" ? aTime - bTime : bTime - aTime;
      }
    }
  });

  // Search + filter
  const minScoreVal = scoreMin !== "" ? Number(scoreMin) : null;
  const maxScoreVal = scoreMax !== "" ? Number(scoreMax) : null;

  const filteredStudents = sortedStudents.filter((s) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      `${s.name} ${s.family_name}`.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q);
    const bestGrade = bestGradeByUser[s.username];
    const hasSubmission = !!bestGrade;
    const matchesFilter =
      submittedFilter === "all" ||
      (submittedFilter === "submitted" && hasSubmission) ||
      (submittedFilter === "not-submitted" && !hasSubmission);
    const score = bestGrade?.totalScore;
    const matchesScore =
      (minScoreVal === null || (score !== undefined && score >= minScoreVal)) &&
      (maxScoreVal === null || (score !== undefined && score <= maxScoreVal));
    return matchesSearch && matchesFilter && matchesScore;
  });

  const totalPages = Math.ceil(filteredStudents.length / rowsPerPage);
  const paginatedStudents = filteredStudents.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  const activeFilterCount = (submittedFilter !== "all" ? 1 : 0) + (scoreMin !== "" ? 1 : 0) + (scoreMax !== "" ? 1 : 0);

  // Reset to page 0 when filters change
  const handleSearch = (v: string) => { setSearch(v); setPage(0); };
  const handleFilter = (v: "all" | "submitted" | "not-submitted") => { setSubmittedFilter(v); setPage(0); };
  const handleSort = (v: SortBy) => { setSortBy(v); setPage(0); };
  const handleScoreMin = (v: string) => { setScoreMin(v); setPage(0); };
  const handleScoreMax = (v: string) => { setScoreMax(v); setPage(0); };
  const handleRowsPerPage = (v: string) => { setRowsPerPage(Number(v)); setPage(0); };

  const allVisibleUsernames = filteredStudents.map((s) => s.username);
  const allSelected = allVisibleUsernames.length > 0 && allVisibleUsernames.every((u) => selectedUsernames.has(u));
  const someSelected = !allSelected && allVisibleUsernames.some((u) => selectedUsernames.has(u));
  const toggleStudent = (uname: string) => setSelectedUsernames((prev) => { const next = new Set(prev); next.has(uname) ? next.delete(uname) : next.add(uname); return next; });
  const toggleAll = () => setSelectedUsernames(allSelected ? new Set() : new Set(allVisibleUsernames));
  const clearSelection = () => setSelectedUsernames(new Set());

  async function handleDownload() {
    setExportLoading(true);
    const exportStudents = selectedUsernames.size > 0
      ? filteredStudents.filter((s) => selectedUsernames.has(s.username))
      : filteredStudents;

    const studentData = await Promise.all(
      exportStudents.map(async (student) => {
        const bestGrade = bestGradeByUser[student.username];
        const studentGrades = gradesByUser[student.username] ?? [];
        const sortedGrades = [...studentGrades].sort(
          (a, b) => parseInt(a.timestamp, 10) - parseInt(b.timestamp, 10)
        );
        const bestRank = bestGrade
          ? sortedGrades.findIndex(
              (g) => g.courseModuleConversationId === bestGrade.courseModuleConversationId
            ) + 1
          : null;
        const bestConvIdx = bestRank !== null ? bestRank - 1 : null;

        let messages: any[] = [];
        if (bestConvIdx !== null) {
          const res = await Get(getConversation(courseId, moduleId, String(bestConvIdx), student.username));
          if (res?.status < 300 && res.data?.messages) {
            messages = [...res.data.messages].sort(
              (a: any, b: any) => parseInt(a.timestamp ?? "0") - parseInt(b.timestamp ?? "0")
            );
          }
        }

        return {
          name: `${student.name} ${student.family_name}`.trim(),
          email: student.email,
          username: student.username,
          best_score: bestGrade?.totalScore ?? null,
          max_score: maxTotal ?? null,
          status: bestGrade?.released ? "released" : bestGrade ? "pending" : "not_submitted",
          submitted_at: bestGrade ? new Date(parseInt(bestGrade.timestamp, 10)).toISOString() : null,
          scores: bestGrade?.scores.map((s) => ({ criterion: s.name, score: s.score, feedback: s.feedback })) ?? [],
          best_conversation: bestConvIdx !== null ? {
            attempt_number: bestRank,
            total_attempts: studentGrades.length,
            messages: messages.map((m: any) => ({
              role: m.role === "user" ? "student" : "ai",
              content: m.content,
              hidden: m.userVisible === false,
              timestamp: (() => { const n = m.id ? parseInt(m.id.substring(0, 13), 10) : NaN; return isNaN(n) ? null : new Date(n).toISOString(); })(),
            })),
          } : null,
        };
      })
    );

    const payload = {
      exported_at: new Date().toISOString(),
      course: { name: courseName, id: courseId },
      module: { name: module?.name ?? "", id: moduleId, assessment_type: module?.assessmentType ?? "", essay_mode: module?.essaySubmission ?? false },
      students: studentData,
    };

    function buildTxt(): string {
      const line = (label: string, val: string | number | null | undefined) => `  ${label}: ${val ?? "—"}`;
      return [
        "=== PapyrusAI Module Export ===",
        `Exported At: ${payload.exported_at}`,
        "",
        "COURSE", line("Name", payload.course.name), line("ID", payload.course.id),
        "",
        "MODULE", line("Name", payload.module.name), line("Assessment Type", payload.module.assessment_type), line("Essay Mode", payload.module.essay_mode ? "Yes" : "No"),
        "",
        ...payload.students.flatMap((s) => [
          `STUDENT: ${s.name} <${s.email}>`,
          line("Best Score", s.best_score != null ? `${s.best_score}${s.max_score != null ? ` / ${s.max_score}` : ""}` : null),
          line("Status", s.status),
          line("Submitted At", s.submitted_at),
          ...(s.scores.length ? ["  Scores:", ...s.scores.map((sc) => `    [${sc.criterion}]: ${sc.score}${sc.feedback ? ` — ${sc.feedback}` : ""}`)] : []),
          ...(s.best_conversation ? [
            `  Best Conversation (Attempt ${s.best_conversation.attempt_number} of ${s.best_conversation.total_attempts}):`,
            ...(s.best_conversation.messages.length
              ? s.best_conversation.messages.map((m) => `    [${m.role === "student" ? "Student" : "AI"}]${m.hidden ? " (hidden)" : ""}: ${m.content}`)
              : ["    (no messages)"]),
          ] : ["  Best Conversation: —"]),
          "",
        ]),
      ].join("\n");
    }

    function buildCsv(): string {
      const rows: (string | number | null | undefined)[][] = [];
      rows.push(["Field", "Value"]);
      rows.push(["Course", payload.course.name]);
      rows.push(["Module", payload.module.name]);
      rows.push(["Assessment Type", payload.module.assessment_type]);
      rows.push([]);
      payload.students.forEach((s) => {
        rows.push(["Student", s.name, s.email]);
        rows.push(["Best Score", s.best_score, `/ ${s.max_score ?? "?"}`]);
        rows.push(["Status", s.status]);
        rows.push(["Submitted At", s.submitted_at]);
        if (s.scores.length) {
          rows.push(["Criterion", "Score", "Feedback"]);
          s.scores.forEach((sc) => rows.push([sc.criterion, sc.score, sc.feedback]));
        }
        if (s.best_conversation?.messages.length) {
          rows.push([`Best Conversation (Attempt ${s.best_conversation.attempt_number} of ${s.best_conversation.total_attempts})`]);
          rows.push(["Role", "Content", "Hidden", "Timestamp"]);
          s.best_conversation.messages.forEach((m) => rows.push([m.role, m.content, m.hidden ? "Yes" : "No", m.timestamp]));
        }
        rows.push([]);
      });
      return rows.map((r) => r.map(csvCell).join(",")).join("\n");
    }

    const safeName = `${(module?.name ?? moduleId).replace(/\s+/g, "_")}_module_export`;
    let content: string; let mime: string; let ext: string;
    if (exportFormat === "json") { content = JSON.stringify(payload, null, 2); mime = "application/json"; ext = "json"; }
    else if (exportFormat === "txt") { content = buildTxt(); mime = "text/plain"; ext = "txt"; }
    else { content = buildCsv(); mime = "text/csv"; ext = "csv"; }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.download = `${safeName}.${ext}`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
    setExportDialogOpen(false);
    setExportLoading(false);
  }

  if (isLoading) return <PageLoader pageName={t("reviewReports.title")} />;

  return (
    <main className="bg-background text-foreground p-4 space-y-6">
      <Dialog open={approveConfirmStudent !== null} onOpenChange={(open) => { if (!open) setApproveConfirmStudent(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("reviewReports.approveConfirmTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("reviewReports.approveConfirmDescription")}</p>
            {approveConfirmStudent && (
              <div className="rounded-md border p-3 flex items-center justify-between">
                <span className="text-sm font-medium">{t("reviewReports.scoreToRelease")}</span>
                <span className="font-bold">
                  {approveConfirmStudent.grade.totalScore}
                  {maxTotal !== undefined ? ` / ${maxTotal}` : ""}
                </span>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {t("reviewReports.instructorNotes")} <span className="normal-case font-normal">({t("common.optional")})</span>
              </label>
              <Textarea
                placeholder={t("reviewReports.instructorNotesPlaceholder")}
                value={approveNotes}
                onChange={(e) => setApproveNotes(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveConfirmStudent(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleApproveConfirm}
              className="gap-2"
              disabled={approveConfirmStudent ? !!actionLoading[`${approveConfirmStudent.student.username}_approve`] : false}
            >
              {approveConfirmStudent && actionLoading[`${approveConfirmStudent.student.username}_approve`] && (
                <RefreshCw className="h-4 w-4 animate-spin" />
              )}
              {t("reviewReports.approve")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("reviewReports.export")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t("reviewReports.exportBestConvNote")}</p>
          <div className="space-y-2 py-2">
            {(["json", "txt", "csv"] as ExportFormat[]).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setExportFormat(fmt)}
                className={`w-full text-left rounded-lg border p-3 transition-colors ${
                  exportFormat === fmt ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                }`}
              >
                <p className="font-medium">{fmt.toUpperCase()}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {fmt === "json" ? t("reviewReports.exportFormatJson") : fmt === "txt" ? t("reviewReports.exportFormatTxt") : t("reviewReports.exportFormatCsv")}
                </p>
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleDownload} disabled={exportLoading} className="gap-2">
              <Download className="h-4 w-4" />
              {exportLoading ? t("common.loading") : t("reviewReports.download")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DialogWrapper
        open={openReleaseAllModal}
        onOpenChange={setOpenReleaseAllModal}
        title={isSummative ? t("reviewReports.approveAll") : t("reviewReports.releaseAllTitle")}
        description={isSummative ? t("reviewReports.releaseAllDescription") : t("reviewReports.releaseAllDescription")}
        actions={[
          { label: t("common.cancel"), onClick: () => setOpenReleaseAllModal(false), variant: "outline" },
          { label: isSummative ? t("reviewReports.approveAll") : t("reviewReports.releaseAll"), onClick: handleReleaseAll },
        ]}
      />

      <Link
        to={`/reports/course/${courseId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground no-underline"
      >
        <ChevronLeft className="h-4 w-4" />
        {t("reviewReports.backToReports")}
      </Link>

      <PageHeaderCard
        title={`${courseName}${module?.name ? ` — ${module.name}` : ""}`}
        icon={<ClipboardCheck size={192} className="text-primary" />}
        description={
          <div className="space-y-2 mt-1">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-foreground border-border">
                {students.length} {t("reviewReports.students")}
              </Badge>
              {module?.maxDrafts !== undefined && module.maxDrafts !== 999 && (
                <Badge variant="outline" className="text-foreground border-border">
                  {t("reviewReports.conversationLimit")}: {module.maxDrafts}
                </Badge>
              )}
              {module?.assessmentType && (
                <Badge variant={module.assessmentType === "formative" ? "default" : "secondary"}>
                  {module.assessmentType === "formative"
                    ? t("reviewModule.formative")
                    : t("reviewModule.summative")}
                </Badge>
              )}
              {module?.essaySubmission && (
                <Badge variant="outline" className="text-foreground border-border">
                  {t("reviewModule.essaySubmission")}
                </Badge>
              )}
            </div>
            <p className="text-sm">{t("reviewReports.pageDescription")}</p>
          </div>
        }
        action={
          <div className="flex gap-2 flex-wrap justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadGrades(courseId, moduleId)}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {t("common.refresh")}
            </Button>
          </div>
        }
      />

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t("reviewReports.studentsSubmitted")}
              </p>
              <p className="text-3xl font-bold mt-1">{studentsSubmitted}</p>
            </div>
            <Users className="h-10 w-10 text-primary opacity-40" aria-hidden="true" />
          </CardContent>
        </Card>
        {isSummative ? (
          <>
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("reviewReports.reviewedConversations")}
                  </p>
                  <p className="text-3xl font-bold mt-1">{reviewedCount}</p>
                </div>
                <CheckCircle className="h-10 w-10 text-primary opacity-40" aria-hidden="true" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("reviewReports.needsReview")}
                  </p>
                  <p className="text-3xl font-bold mt-1">{needsReviewCount}</p>
                </div>
                <MessageSquare className="h-10 w-10 text-primary opacity-40" aria-hidden="true" />
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("reports.totalConversations")}
                  </p>
                  <p className="text-3xl font-bold mt-1">{grades.length}</p>
                </div>
                <MessageSquare className="h-10 w-10 text-primary opacity-40" aria-hidden="true" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("reviewReports.averageScore")}
                  </p>
                  <p className="text-3xl font-bold mt-1">
                    {avgScore ?? "—"}
                    {avgScore && maxTotal ? (
                      <span className="text-lg text-muted-foreground font-normal"> / {maxTotal}</span>
                    ) : null}
                  </p>
                </div>
                <Star className="h-10 w-10 text-primary opacity-40" aria-hidden="true" />
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Student table card */}
      <Card className="transition-all duration-300 hover:shadow-md">
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <h3 className="text-lg font-semibold">{t("reports.studentReports")}</h3>
              <div className="flex items-center gap-2">
                {selectedUsernames.size > 0 && (
                  <Button size="sm" variant="outline" onClick={clearSelection}>
                    {t("reviewReports.clearSelected", { count: selectedUsernames.size })}
                  </Button>
                )}
                {isSummative && needsReviewCount > 0 && (
                  <Button size="sm" className="gap-2" onClick={() => setOpenReleaseAllModal(true)} disabled={isReleasing}>
                    {isReleasing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    {t("reviewReports.approveAll")} ({needsReviewCount})
                  </Button>
                )}
                <Button size="sm" className="gap-2" onClick={() => setExportDialogOpen(true)}>
                  <Download className="h-4 w-4" />
                  {t("reviewReports.export")}
                </Button>
                <span className="text-sm text-muted-foreground">{t("reports.rowsPerPage")}</span>
                <Select value={String(rowsPerPage)} onValueChange={handleRowsPerPage}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-muted z-[100]">
                    {ROWS_OPTIONS.map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                    <SelectItem value={String(students.length)}>{t("common.all")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 p-3 rounded-lg bg-muted/50">
              <Input
                placeholder={t("reports.searchByNameOrEmail")}
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="max-w-xs bg-background"
                aria-label={t("common.search")}
              />

              {/* Filter popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 h-9">
                    <SlidersHorizontal className="h-4 w-4" />
                    {t("reviewReports.filterButton")}
                    {activeFilterCount > 0 && (
                      <Badge className="ml-0.5 h-5 min-w-5 px-1 text-xs flex items-center justify-center">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-60 space-y-4 p-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t("reviewReports.statusFilter")}</p>
                    <div className="space-y-1">
                      {([
                        { value: "all", label: t("reviewReports.filterAll") },
                        { value: "submitted", label: t("reviewReports.filterSubmitted") },
                        { value: "not-submitted", label: t("reviewReports.filterNotSubmitted") },
                      ] as const).map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => handleFilter(value)}
                          className={`w-full text-left text-sm px-2 py-1.5 rounded-md transition-colors ${
                            submittedFilter === value ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t("reviewReports.scoreRange")}</p>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={scoreMin}
                        onChange={(e) => handleScoreMin(e.target.value)}
                        className="w-full"
                        aria-label="Minimum score"
                      />
                      <span className="text-muted-foreground text-sm shrink-0">–</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={scoreMax}
                        onChange={(e) => handleScoreMax(e.target.value)}
                        className="w-full"
                        aria-label="Maximum score"
                      />
                    </div>
                  </div>
                  {activeFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => { setSubmittedFilter("all"); setScoreMin(""); setScoreMax(""); setPage(0); }}
                    >
                      {t("reviewReports.clearFilters")}
                    </Button>
                  )}
                </PopoverContent>
              </Popover>

              {/* Sort dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 h-9">
                    <ArrowUpDown className="h-4 w-4" />
                    {SORT_LABELS[sortBy]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuRadioGroup value={sortBy} onValueChange={(v) => handleSort(v as SortBy)}>
                    <DropdownMenuLabel className="text-xs text-muted-foreground">{t("reviewReports.sortSectionName")}</DropdownMenuLabel>
                    <DropdownMenuRadioItem value="name-asc">{t("reviewReports.sortAZ")}</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="name-desc">{t("reviewReports.sortZA")}</DropdownMenuRadioItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground">{t("reviewReports.sortSectionEmail")}</DropdownMenuLabel>
                    <DropdownMenuRadioItem value="email-asc">{t("reviewReports.sortAZ")}</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="email-desc">{t("reviewReports.sortZA")}</DropdownMenuRadioItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground">{t("reviewReports.sortSectionScore")}</DropdownMenuLabel>
                    <DropdownMenuRadioItem value="score-asc">{t("reviewReports.sortLowToHigh")}</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="score-desc">{t("reviewReports.sortHighToLow")}</DropdownMenuRadioItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground">{t("reviewReports.sortSectionTime")}</DropdownMenuLabel>
                    <DropdownMenuRadioItem value="time-asc">{t("reviewReports.sortSubmittedFirst")}</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="time-desc">{t("reviewReports.sortSubmittedLast")}</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected ? true : someSelected ? "indeterminate" : false}
                      onCheckedChange={toggleAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>{t("reports.name")}</TableHead>
                  <TableHead>{t("reviewReports.bestScore")}</TableHead>
                  <TableHead>{isSummative ? t("reviewReports.mostRecentSubmission") : t("reviewReports.bestSubmission")}</TableHead>
                  <TableHead>{t("reviewReports.status")}</TableHead>
                  <TableHead aria-label={t("common.actions")}></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gradesLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground opacity-50" aria-hidden="true" />
                        <p className="text-muted-foreground">{t("common.loading")}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <ClipboardCheck className="h-8 w-8 text-muted-foreground opacity-50" aria-hidden="true" />
                        <p className="text-muted-foreground">
                          {search || submittedFilter !== "all"
                            ? t("common.noResults")
                            : t("reviewReports.noGrades")}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedStudents.map((student) => {
                    const bestGrade = bestGradeByUser[student.username];
                    const studentGrades = gradesByUser[student.username] ?? [];
                    const totalConvs = studentGrades.length;
                    // Rank best grade among student's grades sorted by timestamp (1-based)
                    const sortedGrades = [...studentGrades].sort(
                      (a, b) => parseInt(a.timestamp, 10) - parseInt(b.timestamp, 10)
                    );
                    const bestRank = bestGrade
                      ? sortedGrades.findIndex(
                        (g) => g.courseModuleConversationId === bestGrade.courseModuleConversationId
                      ) + 1
                      : null;
                    const convNumber = bestRank ?? null;
                    // bestRank - 1 = 0-based index matching the conversation array order (grades sorted by timestamp = conversation creation order)
                    const bestConvIdx = bestRank !== null ? bestRank - 1 : null;
                    const convPath = bestGrade && bestConvIdx !== null
                      ? `/reports/review-module/${courseId}/${moduleId}/student/${student.username}/conversation/${bestConvIdx}`
                      : null;
                    const submittedAt = bestGrade
                      ? new Date(parseInt(bestGrade.timestamp, 10)).toLocaleString()
                      : null;

                    // Summative-specific: most recent grade, pending grade, and conversation paths
                    const mostRecentGrade = sortedGrades.length > 0 ? sortedGrades[sortedGrades.length - 1] : null;
                    const mostRecentConvIdx = mostRecentGrade ? sortedGrades.indexOf(mostRecentGrade) : null;
                    const mostRecentConvPath = mostRecentGrade && mostRecentConvIdx !== null
                      ? `/reports/review-module/${courseId}/${moduleId}/student/${student.username}/conversation/${mostRecentConvIdx}`
                      : null;
                    const mostRecentSubmittedAt = mostRecentGrade
                      ? new Date(parseInt(mostRecentGrade.timestamp, 10)).toLocaleString()
                      : null;
                    const pendingGrade = pendingGradeByUser[student.username];
                    const pendingConvIdx = pendingGrade
                      ? sortedGrades.findIndex(g => g.courseModuleConversationId === pendingGrade.courseModuleConversationId)
                      : -1;
                    const pendingConvPath = pendingGrade && pendingConvIdx >= 0
                      ? `/reports/review-module/${courseId}/${moduleId}/student/${student.username}/conversation/${pendingConvIdx}`
                      : null;

                    return (
                      <TableRow key={student.username}>
                        <TableCell>
                          <Checkbox
                            checked={selectedUsernames.has(student.username)}
                            onCheckedChange={() => toggleStudent(student.username)}
                            aria-label={`Select ${student.name} ${student.family_name}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{student.name} {student.family_name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{student.email}</div>
                        </TableCell>
                        <TableCell>
                          {bestGrade ? (
                            <span className="font-semibold">
                              {bestGrade.totalScore}
                              {maxTotal !== undefined ? ` / ${maxTotal}` : ""}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isSummative ? (
                            mostRecentConvPath ? (
                              <div>
                                <Link
                                  to={mostRecentConvPath}
                                  className="text-sm text-primary underline-offset-2 hover:underline font-medium"
                                >
                                  {t("reviewReports.conversationId")} {(mostRecentConvIdx ?? 0) + 1}
                                </Link>
                                {mostRecentSubmittedAt && (
                                  <div className="text-xs text-muted-foreground mt-0.5">{mostRecentSubmittedAt}</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )
                          ) : (
                            convPath && convNumber !== null ? (
                              <div>
                                <Link
                                  to={convPath}
                                  className="text-sm text-primary underline-offset-2 hover:underline font-medium"
                                  aria-label={`Conversation ${convNumber} of ${totalConvs} — ${student.name} ${student.family_name}`}
                                >
                                  Conversation {convNumber} of {totalConvs}
                                </Link>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  Best of {totalConvs}{submittedAt ? ` · ${submittedAt}` : ""}
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )
                          )}
                        </TableCell>
                        <TableCell>
                          {totalConvs === 0 ? (
                            <Badge variant="outline" className="gap-1 pointer-events-none text-muted-foreground">
                              {t("reviewReports.notStarted")}
                            </Badge>
                          ) : isSummative && pendingGrade ? (
                            <Badge variant="secondary" className="gap-1 pointer-events-none">
                              <Clock className="h-3 w-3" aria-hidden="true" />
                              {t("reviewReports.pendingReview")}
                            </Badge>
                          ) : (
                            <Badge className="gap-1 pointer-events-none bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                              <CheckCircle className="h-3 w-3" aria-hidden="true" />
                              {isSummative ? t("reviewReports.approved") : t("reviewReports.completed")}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {isSummative ? (
                            <div className="flex flex-wrap gap-1.5 justify-end">
                              {totalConvs === 0 ? (
                                <span className="text-sm text-muted-foreground">—</span>
                              ) : pendingGrade ? (
                                <>
                                  {totalConvs > 1 && (
                                    <Button size="sm" variant="outline" asChild>
                                      <Link className="no-underline" to={`/reports/review-module/${courseId}/${moduleId}/student/${student.username}`}>
                                        {t("reviewReports.viewConversations")}
                                      </Link>
                                    </Button>
                                  )}
                                  {pendingConvPath && (
                                    <Button size="sm" variant="outline" asChild>
                                      <Link className="no-underline" to={pendingConvPath}>
                                        {t("reviewReports.review")}
                                      </Link>
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    disabled={actionLoading[`${student.username}_approve`]}
                                    onClick={() => openApproveDialog(student)}
                                    className="gap-1"
                                  >
                                    {actionLoading[`${student.username}_approve`]
                                      ? <RefreshCw className="h-3 w-3 animate-spin" />
                                      : <CheckCircle className="h-3 w-3" />}
                                    {t("reviewReports.approve")}
                                  </Button>
                                </>
                              ) : (
                                <Button size="sm" variant="outline" asChild>
                                  <Link
                                    className="no-underline"
                                    to={`/reports/review-module/${courseId}/${moduleId}/student/${student.username}`}
                                  >
                                    {t("reviewReports.viewConversations")}
                                  </Link>
                                </Button>
                              )}
                            </div>
                          ) : (
                            totalConvs > 0 ? (
                              <Button
                                size="sm"
                                variant="default"
                                className="relative z-10 flex-shrink-0 w-full hover:bg-primary/90 hover:text-primary-foreground"
                                asChild
                                aria-label={`${t("reviewReports.viewConversations")} — ${student.name} ${student.family_name}`}
                              >
                                <Link
                                  className="flex items-center justify-center gap-2 no-underline"
                                  to={`/reports/review-module/${courseId}/${moduleId}/student/${student.username}`}
                                >
                                  {t("reviewReports.viewConversations")}
                                </Link>
                              </Button>
                            ) : (
                              <span className="text-sm text-muted-foreground">N/A</span>
                            )
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {filteredStudents.length > 0 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground mt-4">
              <span>
                {page * rowsPerPage + 1}–{Math.min((page + 1) * rowsPerPage, filteredStudents.length)}{" "}
                {t("common.of")} {filteredStudents.length}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 0}
                  aria-label={t("common.previous")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages - 1}
                  aria-label={t("common.next")}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
