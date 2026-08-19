import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Get from "../../utility/Get";
import Post from "../../utility/Post";
import Put from "../../utility/Put";
import { getConversation, getConversationList, patchVoidConversation } from "../../utility/endpoints/ConversationEndpoints";
import { getCourse, getUsersInCourse } from "../../utility/endpoints/CourseEndpoints";
import { getGrades, putUpdateGrade } from "../../utility/endpoints/GradeEndpoints";
import { ConversationListType, ConversationType } from "../../utility/types/ConversationTypes";
import { GradeType, ModuleType } from "../../utility/types/CourseTypes";
import { CustomUserType } from "../../utility/types/UserTypes";
import { AlertContext } from "../../utility/context/AlertContext";
import { useTranslation } from "../../hooks/useTranslation";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Checkbox } from "../../components/ui/checkbox";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../../components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { PageLoader, PageHeaderCard } from "../../components/Common";
import { DialogWrapper } from "../../components/ui-wrappers/DialogWrapper";
import { ArrowUpDown, CheckCircle, ChevronLeft, ChevronRight, ClipboardCheck, Clock, Download, MessageSquare, RefreshCw, SlidersHorizontal, XCircle } from "lucide-react";

const ROWS_OPTIONS = [10, 25, 50] as const;
type SortBy = "name-asc" | "name-desc" | "score-asc" | "score-desc" | "time-asc" | "time-desc" | "messages-asc" | "messages-desc";
type ExportFormat = "json" | "txt" | "csv";
function csvCell(v: string | number | null | undefined): string {
  if (v == null) return "";
  const s = String(v);
  return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function ReviewStudentConversations(): JSX.Element {
  const { courseId = "", moduleId = "", username = "" } = useParams<{
    courseId: string;
    moduleId: string;
    username: string;
  }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setAlert } = useContext(AlertContext);

  const SORT_LABELS: Record<SortBy, string> = {
    "name-asc": t("reviewReports.sortNameAZ"), "name-desc": t("reviewReports.sortNameZA"),
    "score-asc": t("reviewReports.sortScoreLowHigh"), "score-desc": t("reviewReports.sortScoreHighLow"),
    "time-asc": t("reviewReports.sortSubmittedFirst"), "time-desc": t("reviewReports.sortSubmittedLast"),
    "messages-asc": t("reviewReports.sortMessagesLowHigh"), "messages-desc": t("reviewReports.sortMessagesHighLow"),
  };

  const [courseName, setCourseName] = useState("");
  const [module, setModule] = useState<ModuleType>();
  const [student, setStudent] = useState<CustomUserType>();
  const [conversations, setConversations] = useState<ConversationType[]>([]);
  const [grades, setGrades] = useState<GradeType[]>([]);
  const [dataKey, setDataKey] = useState<string | null>(null);

  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [voidConfirmConv, setVoidConfirmConv] = useState<{ grade: GradeType; conv: ConversationType; idx: number } | null>(null);
  const [approveConfirmData, setApproveConfirmData] = useState<{ grade: GradeType; conv: ConversationType } | null>(null);
  const [approveNotes, setApproveNotes] = useState("");

  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("json");
  const [exportLoading, setExportLoading] = useState(false);
  const [selectedConvIds, setSelectedConvIds] = useState<Set<string>>(new Set());

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("time-desc");
  const [scoreMin, setScoreMin] = useState("");
  const [scoreMax, setScoreMax] = useState("");
  const [msgMin, setMsgMin] = useState("");
  const [msgMax, setMsgMax] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState(0);

  const paramsKey = courseId && moduleId && username ? `${courseId}:${moduleId}:${username}` : null;
  const isLoading = dataKey !== paramsKey;

  useEffect(() => {
    if (!courseId || !moduleId || !username) return;
    const controller = new AbortController();
    const key = `${courseId}:${moduleId}:${username}`;

    let courseReady = false;
    let conversationsReady = false;
    let gradesReady = false;
    let studentReady = false;
    const checkReady = () => {
      if (courseReady && conversationsReady && gradesReady && studentReady) setDataKey(key);
    };

    Get(getCourse(courseId), controller.signal).then((res) => {
      if (controller.signal.aborted) return;
      if (res?.status < 300 && res.data) {
        setCourseName(res.data.name ?? "");
        setModule(res.data.modules.find((m: ModuleType) => m.id === moduleId));
      } else if (res?.status === 401) navigate("/login");
      courseReady = true;
      checkReady();
    });

    Get(getConversationList(courseId, moduleId, username), controller.signal).then((res) => {
      if (controller.signal.aborted) return;
      if (res?.status < 300 && res.data) {
        setConversations((res.data as ConversationListType).conversations ?? []);
      } else if (res?.status === 401) navigate("/login");
      conversationsReady = true;
      checkReady();
    });

    Get(getGrades(courseId, moduleId), controller.signal, true).then((res) => {
      if (controller.signal.aborted) return;
      if (res?.status < 300 && res.data) {
        const all = Array.isArray(res.data) ? res.data : [];
        setGrades(all.filter((g: GradeType) => g.username === username));
      } else if (res?.status === 401) navigate("/login");
      gradesReady = true;
      checkReady();
    });

    const fetchStudents = (nextToken?: string, acc: CustomUserType[] = []) => {
      Get(getUsersInCourse(courseId, 50, nextToken ?? ""), controller.signal).then((res) => {
        if (controller.signal.aborted) return;
        if (res?.status < 300 && res.data) {
          const pg: CustomUserType[] = Array.isArray(res.data.users) ? res.data.users : [];
          const all = [...acc, ...pg];
          const found = all.find((u) => u.username === username || u.sub === username);
          if (found) { setStudent(found); studentReady = true; checkReady(); return; }
          if (res.data.nextToken) fetchStudents(res.data.nextToken, all);
          else { studentReady = true; checkReady(); }
        } else {
          studentReady = true;
          checkReady();
        }
      });
    };
    fetchStudents();

    return () => controller.abort();
    // eslint-disable-next-line
  }, [courseId, moduleId, username]);

  function getGradeForConv(convId: string): GradeType | undefined {
    return grades.find((g) => g.courseModuleConversationId.endsWith(`+${convId}`));
  }

  const rubric = module?.rubrics?.[0];
  const maxPerCriterion = rubric
    ? Math.max(...rubric.columns.map(Number).filter(Number.isFinite))
    : undefined;
  const maxTotal =
    maxPerCriterion !== undefined && rubric
      ? rubric.criteria.length * maxPerCriterion
      : undefined;

  const isSummative = module?.assessmentType === "summative";
  const studentName = student ? `${student.name} ${student.family_name}`.trim() : "";
  const visibleConversations = conversations.filter((c) => !c.isDeleted);

  const rows = visibleConversations.map((conv, idx) => ({
    conv,
    idx,
    grade: getGradeForConv(conv.id),
  }));

  const minScoreVal = scoreMin !== "" ? Number(scoreMin) : null;
  const maxScoreVal = scoreMax !== "" ? Number(scoreMax) : null;
  const minMsgVal = msgMin !== "" ? Number(msgMin) : null;
  const maxMsgVal = msgMax !== "" ? Number(msgMax) : null;

  const filteredRows = rows.filter(({ conv, grade }) => {
    const matchesSearch = !search || conv.name.toLowerCase().includes(search.toLowerCase());
    const score = grade?.totalScore;
    const matchesScore =
      (minScoreVal === null || (score !== undefined && score >= minScoreVal)) &&
      (maxScoreVal === null || (score !== undefined && score <= maxScoreVal));
    const msgCount = conv.messages.length;
    const matchesMessages =
      (minMsgVal === null || msgCount >= minMsgVal) &&
      (maxMsgVal === null || msgCount <= maxMsgVal);
    return matchesSearch && matchesScore && matchesMessages;
  });

  const sortedRows = [...filteredRows].sort((a, b) => {
    switch (sortBy) {
      case "name-asc": return (a.conv.name || "").localeCompare(b.conv.name || "");
      case "name-desc": return (b.conv.name || "").localeCompare(a.conv.name || "");
      case "score-asc": return (a.grade?.totalScore ?? -Infinity) - (b.grade?.totalScore ?? -Infinity);
      case "score-desc": return (b.grade?.totalScore ?? -Infinity) - (a.grade?.totalScore ?? -Infinity);
      case "time-asc": return parseInt(a.grade?.timestamp ?? "0", 10) - parseInt(b.grade?.timestamp ?? "0", 10);
      case "time-desc": return parseInt(b.grade?.timestamp ?? "0", 10) - parseInt(a.grade?.timestamp ?? "0", 10);
      case "messages-asc": return a.conv.messages.length - b.conv.messages.length;
      case "messages-desc": return b.conv.messages.length - a.conv.messages.length;
    }
  });

  const totalPages = Math.ceil(sortedRows.length / rowsPerPage);
  const paginatedRows = sortedRows.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  const activeFilterCount = (scoreMin !== "" ? 1 : 0) + (scoreMax !== "" ? 1 : 0) + (msgMin !== "" ? 1 : 0) + (msgMax !== "" ? 1 : 0);

  const handleSearch = (v: string) => { setSearch(v); setPage(0); };
  const handleSort = (v: SortBy) => { setSortBy(v); setPage(0); };
  const handleScoreMin = (v: string) => { setScoreMin(v); setPage(0); };
  const handleScoreMax = (v: string) => { setScoreMax(v); setPage(0); };
  const handleMsgMin = (v: string) => { setMsgMin(v); setPage(0); };
  const handleMsgMax = (v: string) => { setMsgMax(v); setPage(0); };
  const handleRowsPerPage = (v: string) => { setRowsPerPage(Number(v)); setPage(0); };

  const allVisibleIds = visibleConversations.map((c) => c.id);
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedConvIds.has(id));
  const someSelected = !allSelected && allVisibleIds.some((id) => selectedConvIds.has(id));
  const toggleConv = (id: string) => setSelectedConvIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const toggleAll = () => setSelectedConvIds(allSelected ? new Set() : new Set(allVisibleIds));
  const clearSelection = () => setSelectedConvIds(new Set());

  function loadGrades() {
    Get(getGrades(courseId, moduleId), undefined, true).then((res) => {
      if (res?.status < 300 && res.data) {
        const all = Array.isArray(res.data) ? res.data : [];
        setGrades(all.filter((g: GradeType) => g.username === username));
      }
    });
  }

  function openApproveDialog(grade: GradeType, conv: ConversationType) {
    setApproveNotes(grade.instructorNotes ?? "");
    setApproveConfirmData({ grade, conv });
  }

  async function handleApproveConfirm() {
    if (!approveConfirmData) return;
    const { grade, conv } = approveConfirmData;
    const conversationId = grade.courseModuleConversationId.split("+").pop() ?? "";
    const key = `${conv.id}_approve`;
    setActionLoading(prev => ({ ...prev, [key]: true }));
    const res = await Put(putUpdateGrade(courseId, moduleId, username, conversationId), {
      scores: grade.scores, totalScore: grade.totalScore,
      instructorNotes: approveNotes, released: true,
    }, true);
    if (res?.status < 300) {
      setAlert({ message: t("reviewReports.gradeApproved"), type: "success" });
      loadGrades();
    } else {
      setAlert({ message: t("errorMessage.genericError"), type: "error" });
    }
    setActionLoading(prev => ({ ...prev, [key]: false }));
    setApproveConfirmData(null);
  }

  async function handleVoid(grade: GradeType, conv: ConversationType, idx: number) {
    const key = `${conv.id}_void`;
    setActionLoading(prev => ({ ...prev, [key]: true }));
    const res = await Post(patchVoidConversation(courseId, moduleId, String(idx), username), { voidedByInstructor: true });
    if (res?.status < 300) {
      loadGrades();
    } else {
      setAlert({ message: t("errorMessage.genericError"), type: "error" });
    }
    setActionLoading(prev => ({ ...prev, [key]: false }));
  }

  async function handleDownload() {
    setExportLoading(true);
    const rubric = module?.rubrics?.[0];
    const maxPerCriterion = rubric ? Math.max(...rubric.columns.map(Number).filter(Number.isFinite)) : undefined;
    const maxTotal = maxPerCriterion !== undefined && rubric ? rubric.criteria.length * maxPerCriterion : undefined;
    const studentName = student ? `${student.name} ${student.family_name}`.trim() : username;

    const exportConversations = selectedConvIds.size > 0
      ? visibleConversations.map((c, idx) => ({ conv: c, idx })).filter(({ conv }) => selectedConvIds.has(conv.id))
      : visibleConversations.map((c, idx) => ({ conv: c, idx }));

    const convDetails = await Promise.all(
      exportConversations.map(({ idx }) =>
        Get(getConversation(courseId, moduleId, String(idx), username)).then((res) =>
          res?.status < 300 && res.data ? res.data : null
        )
      )
    );

    const conversationsPayload = exportConversations.map(({ conv, idx }, detailIdx) => {
      const grade = getGradeForConv(conv.id);
      const detail = convDetails[detailIdx];
      const messages: any[] = detail?.messages
        ? [...detail.messages].sort((a: any, b: any) => parseInt(a.timestamp ?? "0") - parseInt(b.timestamp ?? "0"))
        : [];
      return {
        name: conv.name || `Attempt ${idx + 1}`,
        total_score: grade?.totalScore ?? null,
        max_score: maxTotal ?? null,
        status: grade?.released ? "released" : grade ? "pending" : "not_graded",
        submitted_at: grade ? new Date(parseInt(grade.timestamp, 10)).toISOString() : null,
        scores: grade?.scores.map((s) => ({ criterion: s.name, score: s.score, feedback: s.feedback })) ?? [],
        messages: messages.map((m: any) => ({
          role: m.role === "user" ? "student" : "ai",
          content: m.content,
          hidden: m.userVisible === false,
          timestamp: (() => { const n = m.id ? parseInt(m.id.substring(0, 13), 10) : NaN; return isNaN(n) ? null : new Date(n).toISOString(); })(),
        })),
      };
    });

    const payload = {
      exported_at: new Date().toISOString(),
      course: { name: courseName, id: courseId },
      module: { name: module?.name ?? "", id: moduleId, assessment_type: module?.assessmentType ?? "", essay_mode: module?.essaySubmission ?? false },
      student: { name: studentName, email: student?.email ?? "", username },
      conversations: conversationsPayload,
    };

    function buildTxt(): string {
      const line = (label: string, val: string | number | null | undefined) => `  ${label}: ${val ?? "—"}`;
      return [
        "=== PapyrusAI Student Export ===",
        `Exported At: ${payload.exported_at}`,
        "",
        "COURSE", line("Name", payload.course.name), line("ID", payload.course.id),
        "",
        "MODULE", line("Name", payload.module.name), line("Assessment Type", payload.module.assessment_type), line("Essay Mode", payload.module.essay_mode ? "Yes" : "No"),
        "",
        "STUDENT", line("Name", payload.student.name), line("Email", payload.student.email),
        "",
        ...payload.conversations.flatMap((conv, i) => [
          `CONVERSATION ${i + 1}: ${conv.name}`,
          line("Score", conv.total_score != null ? `${conv.total_score}${conv.max_score != null ? ` / ${conv.max_score}` : ""}` : null),
          line("Status", conv.status),
          line("Submitted At", conv.submitted_at),
          ...(conv.scores.length ? ["  Scores:", ...conv.scores.map((s) => `    [${s.criterion}]: ${s.score}${s.feedback ? ` — ${s.feedback}` : ""}`)] : []),
          ...(conv.messages.length ? ["  Messages:", ...conv.messages.map((m) => `    [${m.role === "student" ? "Student" : "AI"}]${m.hidden ? " (hidden)" : ""}: ${m.content}`)] : []),
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
      rows.push(["Student Name", payload.student.name]);
      rows.push(["Student Email", payload.student.email]);
      rows.push([]);
      payload.conversations.forEach((conv, i) => {
        rows.push([`Conversation ${i + 1}`, conv.name]);
        rows.push(["Score", conv.total_score]);
        rows.push(["Max Score", conv.max_score]);
        rows.push(["Status", conv.status]);
        rows.push(["Submitted At", conv.submitted_at]);
        if (conv.scores.length) {
          rows.push(["Criterion", "Score", "Feedback"]);
          conv.scores.forEach((s) => rows.push([s.criterion, s.score, s.feedback]));
        }
        if (conv.messages.length) {
          rows.push(["Role", "Content", "Hidden", "Timestamp"]);
          conv.messages.forEach((m) => rows.push([m.role, m.content, m.hidden ? "Yes" : "No", m.timestamp]));
        }
        rows.push([]);
      });
      return rows.map((r) => r.map(csvCell).join(",")).join("\n");
    }

    const safeName = `${(student?.name ?? username).replace(/\s+/g, "_")}_conversations`;
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

  if (isLoading) return <PageLoader pageName={t("reviewReports.studentConversations")} />;

  return (
    <main className="bg-background text-foreground p-4 space-y-6">
      <DialogWrapper
        open={voidConfirmConv !== null}
        onOpenChange={(open) => { if (!open) setVoidConfirmConv(null); }}
        title={t("reviewReports.voidTitle")}
        description={t("reviewReports.voidDescription")}
        actions={[
          { label: t("common.cancel"), onClick: () => setVoidConfirmConv(null), variant: "outline" },
          { label: t("reviewReports.void"), onClick: () => { if (voidConfirmConv) { handleVoid(voidConfirmConv.grade, voidConfirmConv.conv, voidConfirmConv.idx); setVoidConfirmConv(null); } }, variant: "destructive" },
        ]}
      />
      <Dialog open={approveConfirmData !== null} onOpenChange={(open) => { if (!open) setApproveConfirmData(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("reviewReports.approveConfirmTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("reviewReports.approveConfirmDescription")}</p>
            {approveConfirmData?.grade && (
              <div className="rounded-md border p-3 flex items-center justify-between">
                <span className="text-sm font-medium">{t("reviewReports.scoreToRelease")}</span>
                <span className="font-bold">
                  {approveConfirmData.grade.totalScore}
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
            <Button variant="outline" onClick={() => setApproveConfirmData(null)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleApproveConfirm} className="gap-2"
              disabled={approveConfirmData ? !!actionLoading[`${approveConfirmData.conv.id}_approve`] : false}>
              {approveConfirmData && actionLoading[`${approveConfirmData.conv.id}_approve`] && (
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
      <Link
        to={`/reports/review-module/${courseId}/${moduleId}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground no-underline"
      >
        <ChevronLeft className="h-4 w-4" />
        {t("reviewReports.backToModule")}
      </Link>

      <PageHeaderCard
        title={studentName}
        description={
          <p className="text-sm text-muted-foreground mt-1">
            {courseName}{module?.name ? ` — ${module.name}` : ""}
          </p>
        }
        icon={<ClipboardCheck size={192} className="text-primary" />}
      />

      <Card className="transition-all duration-300 hover:shadow-md">
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <h3 className="text-lg font-semibold">{t("reviewReports.studentConversations")}</h3>
              <div className="flex items-center gap-2">
                {selectedConvIds.size > 0 && (
                  <Button size="sm" variant="outline" onClick={clearSelection}>
                    {t("reviewReports.clearSelected", { count: selectedConvIds.size })}
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
                    <SelectItem value={String(visibleConversations.length)}>{t("common.all")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-wrap p-3 rounded-lg bg-muted/50">
              <Input
                placeholder={t("common.search")}
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
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t("reviewReports.messagesRange")}</p>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={msgMin}
                        onChange={(e) => handleMsgMin(e.target.value)}
                        className="w-full"
                        aria-label="Minimum messages"
                      />
                      <span className="text-muted-foreground text-sm shrink-0">–</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={msgMax}
                        onChange={(e) => handleMsgMax(e.target.value)}
                        className="w-full"
                        aria-label="Maximum messages"
                      />
                    </div>
                  </div>
                  {activeFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => { setScoreMin(""); setScoreMax(""); setMsgMin(""); setMsgMax(""); setPage(0); }}
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
                    <DropdownMenuLabel className="text-xs text-muted-foreground">{t("reviewReports.sortSectionScore")}</DropdownMenuLabel>
                    <DropdownMenuRadioItem value="score-asc">{t("reviewReports.sortLowToHigh")}</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="score-desc">{t("reviewReports.sortHighToLow")}</DropdownMenuRadioItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground">{t("reviewReports.sortSectionTime")}</DropdownMenuLabel>
                    <DropdownMenuRadioItem value="time-asc">{t("reviewReports.sortSubmittedFirst")}</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="time-desc">{t("reviewReports.sortSubmittedLast")}</DropdownMenuRadioItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground">{t("reviewReports.sortSectionMessages")}</DropdownMenuLabel>
                    <DropdownMenuRadioItem value="messages-asc">{t("reviewReports.sortLowToHigh")}</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="messages-desc">{t("reviewReports.sortHighToLow")}</DropdownMenuRadioItem>
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
                  <TableHead>{t("reviewReports.conversationName")}</TableHead>
                  <TableHead>{t("reviewReports.dateSubmitted")}</TableHead>
                  <TableHead>{t("reviewReports.numMessages")}</TableHead>
                  <TableHead>{t("reviewReports.totalScore")}</TableHead>
                  {isSummative && <TableHead>{t("reviewReports.status")}</TableHead>}
                  <TableHead aria-label={t("common.actions")} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isSummative ? 7 : 6} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <MessageSquare className="h-8 w-8 text-muted-foreground opacity-50" aria-hidden="true" />
                        <p className="text-muted-foreground">
                          {search ? t("common.noResults") : t("reviewReports.noGrades")}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRows.map(({ conv, idx, grade }) => {
                    const ts = grade
                      ? new Date(parseInt(grade.timestamp, 10)).toLocaleString()
                      : "—";
                    const convLabel = conv.name || `${t("reviewReports.attempt")} ${idx + 1}`;
                    return (
                      <TableRow key={conv.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedConvIds.has(conv.id)}
                            onCheckedChange={() => toggleConv(conv.id)}
                            aria-label={`Select ${convLabel}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{convLabel}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{ts}</TableCell>
                        <TableCell>{conv.messages.length}</TableCell>
                        <TableCell>
                          {grade ? (
                            <span className="font-semibold">
                              {grade.totalScore}
                              {maxTotal !== undefined ? ` / ${maxTotal}` : ""}
                            </span>
                          ) : (
                            <Badge variant="secondary" className="gap-1 pointer-events-none">
                              <Clock className="h-3 w-3" aria-hidden="true" />
                              {t("reviewReports.pending")}
                            </Badge>
                          )}
                        </TableCell>
                        {isSummative && (
                          <TableCell>
                            {conv.voidedByInstructor ? (
                              <Badge variant="outline" className="gap-1 pointer-events-none text-muted-foreground">
                                <XCircle className="h-3 w-3" aria-hidden="true" />
                                {t("reviewReports.void")}
                              </Badge>
                            ) : grade?.released ? (
                              <Badge className="gap-1 pointer-events-none bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                                <CheckCircle className="h-3 w-3" aria-hidden="true" />
                                {t("reviewReports.approved")}
                              </Badge>
                            ) : grade ? (
                              <Badge variant="secondary" className="gap-1 pointer-events-none">
                                <Clock className="h-3 w-3" aria-hidden="true" />
                                {t("reviewReports.pending")}
                              </Badge>
                            ) : null}
                          </TableCell>
                        )}
                        <TableCell>
                          {isSummative ? (
                            <div className="flex gap-2 justify-end">
                              {conv.voidedByInstructor || grade?.released ? (
                                <Button
                                  size="sm"
                                  asChild
                                  variant="outline"
                                  aria-label={`${t("reviewReports.viewConversation")} — ${convLabel}`}
                                >
                                  <Link
                                    to={`/reports/review-module/${courseId}/${moduleId}/student/${username}/conversation/${idx}`}
                                    className="no-underline"
                                  >
                                    {t("reviewReports.viewConversation")}
                                  </Link>
                                </Button>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    asChild
                                    variant="outline"
                                    aria-label={`${t("reviewReports.review")} — ${convLabel}`}
                                  >
                                    <Link
                                      to={`/reports/review-module/${courseId}/${moduleId}/student/${username}/conversation/${idx}`}
                                      className="no-underline"
                                    >
                                      {t("reviewReports.review")}
                                    </Link>
                                  </Button>
                                  {grade && !grade.released && (
                                    <Button
                                      size="sm"
                                      variant="default"
                                      disabled={actionLoading[`${conv.id}_approve`]}
                                      onClick={() => openApproveDialog(grade, conv)}
                                    >
                                      {t("reviewReports.approve")}
                                    </Button>
                                  )}
                                  {grade && !grade.released && (
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      disabled={actionLoading[`${conv.id}_void`]}
                                      onClick={() => setVoidConfirmConv({ grade, conv, idx })}
                                    >
                                      <XCircle className="h-3 w-3 mr-1" aria-hidden="true" />
                                      {t("reviewReports.void")}
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              asChild
                              variant="default"
                              aria-label={`${t("reviewReports.viewConversation")} — ${convLabel}`}
                              className="relative z-10 flex-shrink-0 w-full hover:bg-primary/90 hover:text-primary-foreground"
                            >
                              <Link
                                to={`/reports/review-module/${courseId}/${moduleId}/student/${username}/conversation/${idx}`}
                                aria-label={`${t("reviewReports.viewConversation")} — ${convLabel}`}
                                className="flex items-center justify-center gap-2 no-underline"
                              >
                                {t("reviewReports.viewConversation")}
                              </Link>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {sortedRows.length > 0 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground mt-4">
              <span>
                {page * rowsPerPage + 1}–{Math.min((page + 1) * rowsPerPage, sortedRows.length)}{" "}
                {t("common.of")} {sortedRows.length}
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
