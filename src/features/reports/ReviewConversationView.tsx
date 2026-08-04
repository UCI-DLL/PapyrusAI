import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Get from "../../utility/Get";
import Post from "../../utility/Post";
import Put from "../../utility/Put";
import { getConversation } from "../../utility/endpoints/ConversationEndpoints";
import { getCourse, getUsersInCourse } from "../../utility/endpoints/CourseEndpoints";
import { getGrades, postRegrade, putUpdateGrade } from "../../utility/endpoints/GradeEndpoints";
import { buildRegradeContent } from "../../utility/chat/buildRegradeContent";
import { GradeScore, GradeType, ModuleType } from "../../utility/types/CourseTypes";
import { CustomUserType } from "../../utility/types/UserTypes";
import { useTranslation } from "../../hooks/useTranslation";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Textarea } from "../../components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../components/ui/accordion";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../../components/ui/sheet";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { PageLoader } from "../../components/Common";
import { MessageLeft, MessageRight } from "../../components/Message";
import { AlertContext } from "../../utility/context/AlertContext";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AlertTriangle, BookOpen, CheckCircle, ChevronLeft, Clock, Download, Edit2, Eye, MessageSquare, RefreshCw } from "lucide-react";

type GradingType = "ma6";

type ExportFormat = "json" | "txt" | "csv";

function csvCell(v: string | number | null | undefined): string {
  if (v == null) return "";
  const s = String(v);
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

export default function ReviewConversationView(): JSX.Element {
  const { courseId = "", moduleId = "", username = "", convIndex = "" } = useParams<{
    courseId: string;
    moduleId: string;
    username: string;
    convIndex: string;
  }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [courseName, setCourseName] = useState("");
  const [module, setModule] = useState<ModuleType>();
  const [student, setStudent] = useState<CustomUserType>();
  const [conversation, setConversation] = useState<any>(null);
  const [allGrades, setAllGrades] = useState<GradeType[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("json");
  const [regradeDialogOpen, setRegradeDialogOpen] = useState(false);
  const [gradingType, setGradingType] = useState<GradingType>("ma6");
  const [regradeContext, setRegradeContext] = useState("");
  const [regradeLoading, setRegradeLoading] = useState(false);
  const [regradeResults, setRegradeResults] = useState<GradeScore[] | null>(null);
  const [regradeError, setRegradeError] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editScores, setEditScores] = useState<GradeScore[]>([]);
  const [editErrors, setEditErrors] = useState<string[]>([]);
  const [approveLoading, setApproveLoading] = useState(false);
  const [approveDialogMode, setApproveDialogMode] = useState<"asIs" | "edit" | null>(null);
  const [approveNotes, setApproveNotes] = useState("");

  const { setAlert } = useContext(AlertContext);

  const [dataKey, setDataKey] = useState<string | null>(null);

  const paramsKey = courseId && moduleId && username && convIndex !== ""
    ? `${courseId}:${moduleId}:${username}:${convIndex}`
    : null;
  const isLoading = dataKey !== paramsKey;

  useEffect(() => {
    if (!courseId || !moduleId || !username || convIndex === "") return;
    const controller = new AbortController();
    const key = `${courseId}:${moduleId}:${username}:${convIndex}`;

    let courseReady = false;
    let conversationReady = false;
    let gradesReady = false;
    let studentReady = false;
    const checkReady = () => {
      if (courseReady && conversationReady && gradesReady && studentReady) setDataKey(key);
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

    Get(getConversation(courseId, moduleId, convIndex, username), controller.signal).then((res) => {
      if (controller.signal.aborted) return;
      if (res?.status < 300 && res.data) setConversation(res.data);
      else if (res?.status === 401) navigate("/login");
      conversationReady = true;
      checkReady();
    });

    Get(getGrades(courseId, moduleId), controller.signal, true).then((res) => {
      if (controller.signal.aborted) return;
      if (res?.status < 300 && res.data) {
        const all: GradeType[] = Array.isArray(res.data) ? res.data : [];
        setAllGrades(all.filter((g: GradeType) => g.username === username));
      } else if (res?.status === 401) navigate("/login");
      gradesReady = true;
      checkReady();
    });

    const fetchStudents = (nextToken?: string, acc: CustomUserType[] = []) => {
      Get(getUsersInCourse(courseId, 50, nextToken ?? ""), controller.signal).then((res) => {
        if (controller.signal.aborted) return;
        if (res?.status < 300 && res.data) {
          const page: CustomUserType[] = Array.isArray(res.data.users) ? res.data.users : [];
          const all = [...acc, ...page];
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
  }, [courseId, moduleId, username, convIndex]);

  const rubric = module?.rubrics?.[0];
  const maxPerCriterion = rubric
    ? Math.max(...rubric.columns.map(Number).filter(Number.isFinite))
    : undefined;
  const maxTotal =
    maxPerCriterion !== undefined && rubric
      ? rubric.criteria.length * maxPerCriterion
      : undefined;

  const isSummative = module?.assessmentType === "summative";
  const studentName = student ? `${student.name} ${student.family_name}`.trim() : username;
  const convTitle = conversation?.name || `${t("reviewReports.attempt")} ${Number(convIndex) + 1}`;
  const grade = allGrades.find(
    (g) => conversation?.id && g.courseModuleConversationId.endsWith(`+${conversation.id}`)
  ) ?? null;
  const messages: any[] = [...(conversation?.messages ?? [])].sort(
    (a, b) => parseInt(a.timestamp ?? "0") - parseInt(b.timestamp ?? "0")
  );
  const visibleMessages = messages;
  const essayMessage = messages.filter((m: any) => m.messageType === "essayDraft").slice(-1)[0];
  const gradedAt = grade ? new Date(parseInt(grade.timestamp, 10)).toLocaleString() : null;

  function buildExportPayload() {
    return {
      exported_at: new Date().toISOString(),
      course: { name: courseName, id: courseId },
      module: {
        name: module?.name ?? "",
        id: moduleId,
        assessment_type: module?.assessmentType ?? "",
        essay_mode: module?.essaySubmission ?? false,
      },
      student: { name: studentName, email: student?.email ?? "", username },
      submission: {
        conversation_name: convTitle,
        submitted_at: gradedAt,
        total_score: grade?.totalScore ?? null,
        max_score: maxTotal ?? null,
        status: grade?.released ? "released" : grade ? "pending" : "not_graded",
        instructor_edited: grade?.instructorEdited ?? false,
        instructor_notes: grade?.instructorNotes ?? null,
        scores: grade?.scores.map((s) => ({
          criterion: s.name,
          score: s.score,
          max_score: maxPerCriterion ?? null,
          feedback: s.feedback,
        })) ?? [],
      },
      conversation: messages.map((m: any) => ({
        role: m.role === "user" ? "student" : "ai",
        content: m.content,
        hidden: m.userVisible === false,
        timestamp: (() => { const n = m.id ? parseInt(m.id.substring(0, 13), 10) : NaN; return isNaN(n) ? null : new Date(n).toISOString(); })(),
      })),
    };
  }

  function buildTxt(): string {
    const p = buildExportPayload();
    const line = (label: string, val: string | number | null | undefined) =>
      `  ${label}: ${val ?? "—"}`;
    const scoreLines = p.submission.scores
      .map((s) =>
        [
          `  [${s.criterion}]: ${s.score}${s.max_score != null ? ` / ${s.max_score}` : ""}`,
          s.feedback ? `    Feedback: ${s.feedback}` : null,
        ].filter(Boolean).join("\n")
      ).join("\n\n");
    const convLines = p.conversation
      .map((m) =>
        [
          `  [${m.role === "student" ? "Student" : "AI"}]${m.hidden ? " (hidden)" : ""}${m.timestamp ? ` — ${m.timestamp}` : ""}`,
          `  ${m.content}`,
        ].join("\n")
      ).join("\n\n");

    return [
      "=== PapyrusAI Review Export ===",
      `Exported At: ${p.exported_at}`,
      "",
      "COURSE",
      line("Name", p.course.name),
      line("ID", p.course.id),
      "",
      "MODULE",
      line("Name", p.module.name),
      line("Assessment Type", p.module.assessment_type),
      line("Essay Mode", p.module.essay_mode ? "Yes" : "No"),
      "",
      "STUDENT",
      line("Name", p.student.name),
      line("Email", p.student.email),
      "",
      "SUBMISSION",
      line("Conversation", p.submission.conversation_name),
      line("Submitted At", p.submission.submitted_at),
      line(
        "Total Score",
        p.submission.total_score != null
          ? `${p.submission.total_score}${p.submission.max_score != null ? ` / ${p.submission.max_score}` : ""}`
          : null
      ),
      line("Status", p.submission.status),
      line("Instructor Edited", p.submission.instructor_edited ? "Yes" : "No"),
      ...(p.submission.instructor_notes ? [line("Instructor Notes", p.submission.instructor_notes)] : []),
      "",
      "CRITERION SCORES",
      scoreLines || "  No scores recorded.",
      "",
      "CONVERSATION",
      convLines || "  No messages.",
    ].join("\n");
  }

  function buildCsv(): string {
    const p = buildExportPayload();
    const rows: (string | number | null | undefined)[][] = [];
    rows.push(["Field", "Value"]);
    rows.push(["Course", p.course.name]);
    rows.push(["Module", p.module.name]);
    rows.push(["Assessment Type", p.module.assessment_type]);
    rows.push(["Essay Mode", p.module.essay_mode ? "Yes" : "No"]);
    rows.push(["Student Name", p.student.name]);
    rows.push(["Student Email", p.student.email]);
    rows.push(["Conversation", p.submission.conversation_name]);
    rows.push(["Submitted At", p.submission.submitted_at]);
    rows.push(["Total Score", p.submission.total_score]);
    rows.push(["Max Score", p.submission.max_score]);
    rows.push(["Status", p.submission.status]);
    rows.push(["Instructor Edited", p.submission.instructor_edited ? "Yes" : "No"]);
    rows.push(["Instructor Notes", p.submission.instructor_notes]);
    rows.push([]);
    rows.push(["Criterion", "Score", "Max Score", "Feedback"]);
    p.submission.scores.forEach((s) => rows.push([s.criterion, s.score, s.max_score, s.feedback]));
    rows.push([]);
    rows.push(["Role", "Content", "Hidden", "Timestamp"]);
    p.conversation.forEach((m) => rows.push([m.role, m.content, m.hidden ? "Yes" : "No", m.timestamp]));
    return rows.map((r) => r.map(csvCell).join(",")).join("\n");
  }

  function handleDownload() {
    const p = buildExportPayload();
    const safeName = `${studentName.replace(/\s+/g, "_")}_${convTitle.replace(/\s+/g, "_")}_review`;
    let content: string;
    let mime: string;
    let ext: string;
    if (exportFormat === "json") {
      content = JSON.stringify(p, null, 2); mime = "application/json"; ext = "json";
    } else if (exportFormat === "txt") {
      content = buildTxt(); mime = "text/plain"; ext = "txt";
    } else {
      content = buildCsv(); mime = "text/csv"; ext = "csv";
    }
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.download = `${safeName}.${ext}`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
    setExportDialogOpen(false);
  }

  function handleRegradeClose() {
    setRegradeDialogOpen(false);
    setRegradeResults(null);
    setRegradeContext("");
    setRegradeError(null);
  }

  async function handleRegrade() {
    if (!student || !module) return;
    setRegradeLoading(true);
    setRegradeError(null);
    const essay = buildRegradeContent(messages, { name: student.name, family_name: student.family_name }, module);
    const body: Record<string, any> = {
      essay,
      gradingType,
      organization: process.env.REACT_APP_ORGANIZATION ?? "",
      courseId,
      moduleId,
      rubricId: rubric?.id,
    };
    if (regradeContext.trim()) body.essayQuestion = regradeContext.trim();
    const res = await Post(postRegrade(), body, true);
    setRegradeLoading(false);
    if (res?.status < 300 && Array.isArray(res.data?.data)) {
      setRegradeResults(res.data.data as GradeScore[]);
    } else {
      setRegradeError(t("reviewReports.regradeError"));
    }
  }

  async function handleSaveGrades() {
    if (!regradeResults || !conversation?.id) return;
    setSaveLoading(true);
    const totalScore = regradeResults.reduce((sum, s) => sum + (s.score ?? 0), 0);
    const res = await Put(putUpdateGrade(courseId, moduleId, username, conversation.id), {
      scores: regradeResults,
      totalScore,
      released: grade?.released ?? false,
      instructorNotes: grade?.instructorNotes ?? "",
    }, true);
    if (res?.status < 300) {
      const gradesRes = await Get(getGrades(courseId, moduleId), undefined, true);
      if (gradesRes?.status < 300) {
        const all: GradeType[] = Array.isArray(gradesRes.data) ? gradesRes.data : [];
        setAllGrades(all.filter((g: GradeType) => g.username === username));
      }
      handleRegradeClose();
    } else {
      setRegradeError(t("reviewReports.regradeError"));
    }
    setSaveLoading(false);
  }

  const canEditApprove = isSummative && !!grade && !grade.released;
  const editTotal = editScores.reduce((sum, s) => sum + (Number(s.score) || 0), 0);

  function handleStartEdit() {
    if (!grade) return;
    setEditScores(grade.scores.map((s) => ({ ...s })));
    setEditErrors(grade.scores.map(() => ""));
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setIsEditing(false);
    setEditScores([]);
    setEditErrors([]);
  }

  function handleScoreChange(i: number, raw: string) {
    const num = raw === "" ? 0 : Number(raw);
    const errors = [...editErrors];
    if (isNaN(num) || !Number.isInteger(num) || num < 0 || (maxPerCriterion !== undefined && num > maxPerCriterion)) {
      errors[i] = maxPerCriterion !== undefined
        ? t("reviewReports.scoreError", { max: maxPerCriterion })
        : t("reviewReports.scoreErrorGeneric");
    } else {
      errors[i] = "";
    }
    setEditErrors(errors);
    const clamped = isNaN(num) ? 0 : Math.max(0, maxPerCriterion !== undefined ? Math.min(num, maxPerCriterion) : num);
    setEditScores((prev) => prev.map((s, idx) => idx === i ? { ...s, score: clamped } : s));
  }

  function handleFeedbackChange(i: number, value: string) {
    setEditScores((prev) => prev.map((s, idx) => idx === i ? { ...s, feedback: value } : s));
  }

  function handleApproveEditOpen() {
    if (!grade || editErrors.some((e) => e !== "")) return;
    setApproveNotes(grade.instructorNotes ?? "");
    setApproveDialogMode("edit");
  }

  function handleApproveAsIs() {
    if (!grade) return;
    setApproveNotes(grade.instructorNotes ?? "");
    setApproveDialogMode("asIs");
  }

  async function handleApproveConfirm() {
    if (!grade || !conversation || approveDialogMode === null) return;
    const conversationId = grade.courseModuleConversationId.split("+").pop() ?? "";
    setApproveLoading(true);
    const isEdit = approveDialogMode === "edit";
    const res = await Put(putUpdateGrade(courseId, moduleId, username, conversationId), {
      scores: isEdit ? editScores : grade.scores,
      totalScore: isEdit ? editTotal : grade.totalScore,
      instructorNotes: approveNotes,
      released: true,
    }, true);
    if (res?.status < 300) {
      setAlert({ message: t("reviewReports.gradeApproved"), type: "success" });
      const gradesRes = await Get(getGrades(courseId, moduleId), undefined, true);
      if (gradesRes?.status < 300 && gradesRes.data) {
        const all = Array.isArray(gradesRes.data) ? gradesRes.data : [];
        setAllGrades(all.filter((g: GradeType) => g.username === username));
      }
      if (isEdit) handleCancelEdit();
    } else {
      setAlert({ message: t("errorMessage.genericError"), type: "error" });
    }
    setApproveLoading(false);
    setApproveDialogMode(null);
  }

  if (isLoading) return <PageLoader pageName={t("reviewReports.conversationDetails")} />;

  return (
    <main className="bg-background text-foreground p-4 space-y-6">
      <Link
        to={`/reports/review-module/${courseId}/${moduleId}/student/${username}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground no-underline"
      >
        <ChevronLeft className="h-4 w-4" />
        {t("reviewReports.backToStudentConversations")}
      </Link>

      {/* Title card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-3 min-w-0">
              <h1 className="text-2xl font-bold leading-tight">
                {studentName}
                <span className="text-muted-foreground font-normal"> — </span>
                {convTitle}
              </h1>
              <p className="text-sm text-muted-foreground">
                {courseName}{module?.name ? ` · ${module.name}` : ""}
              </p>
              <div className="flex flex-wrap gap-2">
                {module?.assessmentType && (
                  <Badge variant={module.assessmentType === "formative" ? "default" : "secondary"}>
                    {t(`reviewModule.${module.assessmentType}`)}
                  </Badge>
                )}
                {module?.essaySubmission && (
                  <Badge variant="outline">{t("reviewModule.essaySubmission")}</Badge>
                )}
                {grade?.released ? (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-white gap-1 pointer-events-none">
                    <CheckCircle className="h-3 w-3" />
                    {t("reviewReports.released")}
                  </Badge>
                ) : grade ? (
                  <Badge variant="secondary" className="gap-1 pointer-events-none">
                    <Clock className="h-3 w-3" />
                    {t("reviewReports.pending")}
                  </Badge>
                ) : null}
                {grade?.instructorEdited && (
                  <Badge variant="outline" className="text-xs pointer-events-none">
                    {t("reviewReports.edited")}
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" />
                  {visibleMessages.length} {t("reviewReports.numMessages").toLowerCase()}
                </span>
                {gradedAt && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {t("reviewReports.submittedAt")}: {gradedAt}
                  </span>
                )}
              </div>
            </div>

            <div className="shrink-0 text-right">
              <div className="text-5xl font-bold tabular-nums leading-none">
                {grade?.totalScore ?? "—"}
              </div>
              {maxTotal !== undefined && (
                <div className="text-lg text-muted-foreground mt-1">/ {maxTotal}</div>
              )}
              <div className="text-xs text-muted-foreground mt-1.5 uppercase tracking-wide">
                {t("reviewReports.totalScore")}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rubric accordion */}
      {rubric && (
        <Card>
          <CardContent className="p-4">
            <Accordion type="single" collapsible>
              <AccordionItem value="rubric" className="border-none">
                <AccordionTrigger className="hover:no-underline py-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <BookOpen className="h-4 w-4" />
                    {t("reviewModule.rubric")} — {rubric.name}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="overflow-x-auto mt-2">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr>
                          <th className="text-left p-2 font-semibold border-b w-36">
                            {t("reviewReports.criterion")}
                          </th>
                          {rubric.columns.map((col, ci) => (
                            <th key={ci} className="text-center p-2 font-semibold border-b border-l min-w-[80px]">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rubric.criteria.map((criterion, ri) => (
                          <tr key={ri} className={ri % 2 === 0 ? "bg-muted/30" : ""}>
                            <td className="p-2 font-medium border-b">{criterion.name}</td>
                            {criterion.cells.map((cell, ci) => (
                              <td key={ci} className="p-2 text-xs text-muted-foreground border-b border-l align-top leading-relaxed">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* View Review Conversation */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-semibold">
              {isEditing ? t("reviewReports.editingReview") : t("reviewReports.viewReviewConversation")}
            </h2>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                    {t("common.cancel")}
                  </Button>
                  <Button
                    size="sm"
                    className="gap-2"
                    disabled={editErrors.some((e) => e !== "")}
                    onClick={handleApproveEditOpen}
                  >
                    {t("reviewReports.approve")}
                  </Button>
                </>
              ) : (
                <>
                  {module?.essaySubmission && (
                    <Button variant="ghost" size="sm" className="gap-2" onClick={() => setDrawerOpen(true)}>
                      <Eye className="h-4 w-4" />
                      {t("reviewReports.openConversation")}
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="gap-2" onClick={() => setExportDialogOpen(true)}>
                    <Download className="h-4 w-4" />
                    {t("reviewReports.export")}
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => setRegradeDialogOpen(true)}>
                    <RefreshCw className="h-4 w-4" />
                    {t("reviewReports.regrade")}
                  </Button>
                  {canEditApprove && (
                    <>
                      <Button variant="outline" size="sm" className="gap-2" onClick={handleStartEdit}>
                        <Edit2 className="h-4 w-4" />
                        {t("reviewReports.editGrade")}
                      </Button>
                      <Button variant="default" size="sm" className="gap-2" disabled={approveLoading} onClick={handleApproveAsIs}>
                        {approveLoading
                          ? <RefreshCw className="h-4 w-4 animate-spin" />
                          : <CheckCircle className="h-4 w-4" />}
                        {t("reviewReports.approve")}
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: essay or conversation */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {module?.essaySubmission
                  ? t("reviewReports.essayContent")
                  : t("reviewReports.conversationDetails")}
              </h3>
              {module?.essaySubmission ? (
                <div className="rounded-lg border bg-muted/20 p-4">
                  {essayMessage ? (
                    <Markdown remarkPlugins={[remarkGfm]} >
                      {essayMessage.content ?? ""}
                    </Markdown>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("reviewReports.noGrades")}</p>
                  )}
                </div>
              ) : (
                <ConversationThread
                  messages={messages}
                  studentName={studentName}
                />
              )}
            </div>

            {/* Right: scores */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("reviewReports.rubricScores")}
              </h3>
              {grade ? (
                <>
                  <div className="flex items-center justify-between py-2 border-b mb-1">
                    <span className="font-semibold">{t("reviewReports.totalScore")}</span>
                    <span className="text-xl font-bold">
                      {isEditing ? editTotal : grade.totalScore}
                      {maxTotal !== undefined ? ` / ${maxTotal}` : ""}
                    </span>
                  </div>
                  <Accordion
                    type="multiple"
                    className="w-full"
                    {...(isEditing
                      ? { value: grade.scores.map((_, i) => `score-${i}`), onValueChange: () => {} }
                      : {})}
                  >
                    {(isEditing ? editScores : grade.scores).map((score, i) => (
                      <AccordionItem key={i} value={`score-${i}`}>
                        <AccordionTrigger className="hover:no-underline py-3">
                          <div className="flex items-center justify-between w-full pr-2">
                            <span className="text-sm font-medium text-left">{score.name}</span>
                            {isEditing ? (
                              <div className="flex items-center gap-1.5 ml-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                                <Input
                                  type="number"
                                  min={0}
                                  max={maxPerCriterion}
                                  value={score.score}
                                  onChange={(e) => handleScoreChange(i, e.target.value)}
                                  className={`w-16 h-7 text-center text-sm px-1 ${editErrors[i] ? "border-destructive focus-visible:ring-destructive" : ""}`}
                                />
                                {maxPerCriterion !== undefined && (
                                  <span className="text-sm text-muted-foreground">/ {maxPerCriterion}</span>
                                )}
                              </div>
                            ) : (
                              <Badge variant="secondary" className="ml-2 shrink-0">
                                {score.score}
                                {maxPerCriterion !== undefined ? ` / ${maxPerCriterion}` : ""}
                              </Badge>
                            )}
                          </div>
                        </AccordionTrigger>
                        {editErrors[i] && (
                          <p className="text-xs text-destructive px-1 pb-1">{editErrors[i]}</p>
                        )}
                        <AccordionContent>
                          {isEditing ? (
                            <Textarea
                              value={score.feedback}
                              onChange={(e) => handleFeedbackChange(i, e.target.value)}
                              className="text-sm min-h-[80px]"
                              placeholder={t("reviewReports.noFeedback")}
                            />
                          ) : score.feedback ? (
                            <Markdown remarkPlugins={[remarkGfm]} className="text-muted-foreground">
                              {score.feedback}
                            </Markdown>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">
                              {t("reviewReports.noFeedback")}
                            </p>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                  {grade.instructorNotes && (
                    <div className="mt-4 rounded-lg border p-3 space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {t("reviewReports.instructorNotes")}
                      </p>
                      <p className="text-sm">{grade.instructorNotes}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="mx-auto h-8 w-8 mb-2 opacity-50" aria-hidden="true" />
                  <p className="text-sm">{t("reviewReports.pending")}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversation drawer (non-essay only) */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="w-[520px] sm:max-w-[520px] flex flex-col gap-0 p-0 overflow-hidden">
          <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <SheetTitle>{convTitle}</SheetTitle>
            <SheetDescription>{studentName}</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <ConversationThread
              messages={messages}
              studentName={studentName}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Regrade dialog */}
      <Dialog open={regradeDialogOpen} onOpenChange={(open) => { if (!open) handleRegradeClose(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {regradeResults ? t("reviewReports.regradeResults") : t("reviewReports.regrade")}
            </DialogTitle>
          </DialogHeader>

          {regradeResults ? (
            /* Results phase */
            <div className="space-y-4">
              <div className="rounded-md border divide-y text-sm">
                {regradeResults.map((s, i) => (
                  <div key={i} className="px-3 py-2.5 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{s.name}</span>
                      <Badge variant="secondary">
                        {s.score ?? "—"}
                        {maxPerCriterion !== undefined ? ` / ${maxPerCriterion}` : ""}
                      </Badge>
                    </div>
                    {s.feedback && (
                      <p className="text-xs text-muted-foreground leading-relaxed">{s.feedback}</p>
                    )}
                  </div>
                ))}
                <div className="px-3 py-2.5 flex items-center justify-between font-semibold">
                  <span>{t("reviewReports.totalScore")}</span>
                  <span>
                    {regradeResults.reduce((sum, s) => sum + (s.score ?? 0), 0)}
                    {maxTotal !== undefined ? ` / ${maxTotal}` : ""}
                  </span>
                </div>
              </div>
              {module?.assessmentType === "formative" && (
                <div className="flex gap-2 rounded-md border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30 px-3 py-2 text-sm text-yellow-800 dark:text-yellow-300">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{t("reviewReports.formativeRegradeNote")}</span>
                </div>
              )}
              {regradeError && (
                <p className="text-sm text-destructive">{regradeError}</p>
              )}
            </div>
          ) : (
            /* Configure phase */
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {t("reviewReports.gradingMethod")}
                </p>
                <button
                  onClick={() => setGradingType("ma6")}
                  className={`w-full text-left rounded-lg border p-3 transition-colors ${
                    gradingType === "ma6" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                  }`}
                >
                  <p className="font-medium">MA6</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t("reviewReports.ma6Desc")}</p>
                </button>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {t("reviewReports.additionalContext")}{" "}
                  <span className="normal-case font-normal text-muted-foreground">({t("common.optional")})</span>
                </p>
                <Textarea
                  placeholder={t("reviewReports.additionalContextPlaceholder")}
                  value={regradeContext}
                  onChange={(e) => setRegradeContext(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
              {module?.assessmentType === "formative" && (
                <div className="flex gap-2 rounded-md border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30 px-3 py-2 text-sm text-yellow-800 dark:text-yellow-300">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{t("reviewReports.formativeRegradeNote")}</span>
                </div>
              )}
              {regradeError && (
                <p className="text-sm text-destructive">{regradeError}</p>
              )}
            </div>
          )}

          <DialogFooter>
            {regradeResults ? (
              <>
                <Button variant="outline" onClick={() => { setRegradeResults(null); setRegradeError(null); }}>
                  {t("reviewReports.startOver")}
                </Button>
                <Button onClick={handleSaveGrades} disabled={saveLoading} className="gap-2">
                  {saveLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
                  {saveLoading ? t("reviewReports.savingGrades") : t("reviewReports.replaceGrades")}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleRegradeClose}>{t("common.cancel")}</Button>
                <Button onClick={handleRegrade} disabled={regradeLoading} className="gap-2">
                  {regradeLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
                  {regradeLoading ? t("reviewReports.regrading") : t("reviewReports.runRegrade")}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve with notes dialog */}
      <Dialog open={approveDialogMode !== null} onOpenChange={(open) => { if (!open && !approveLoading) setApproveDialogMode(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("reviewReports.approveConfirmTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("reviewReports.approveConfirmDescription")}</p>
            {grade && (
              <div className="rounded-md border p-3 flex items-center justify-between">
                <span className="text-sm font-medium">{t("reviewReports.scoreToRelease")}</span>
                <span className="font-bold">
                  {approveDialogMode === "edit" ? editTotal : grade.totalScore}
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
            <Button variant="outline" disabled={approveLoading} onClick={() => setApproveDialogMode(null)}>
              {t("common.cancel")}
            </Button>
            <Button disabled={approveLoading} onClick={handleApproveConfirm} className="gap-2">
              {approveLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
              {t("reviewReports.approve")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export format dialog */}
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
                className={`w-full text-left rounded-lg border p-3 transition-colors ${exportFormat === fmt
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                  }`}
              >
                <div className="font-semibold text-sm uppercase tracking-wide">{fmt.toUpperCase()}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {fmt === "json" && "Structured data — best for importing into other tools or scripts"}
                  {fmt === "txt" && "Human-readable text — easy to read and print"}
                  {fmt === "csv" && "Spreadsheet-friendly — open in Excel or Google Sheets"}
                </div>
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleDownload} className="gap-2">
              <Download className="h-4 w-4" />
              {t("reviewReports.download")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function ConversationThread({ messages, studentName }: { messages: any[]; studentName: string }) {
  if (messages.length === 0) {
    return <p className="text-sm text-muted-foreground">No messages.</p>;
  }

  return (
    <div>
      {messages.map((msg: any, i: number) => {
        const visible = msg.userVisible === undefined || msg.userVisible ? true : false;
        return msg.role === "user"
          ? <MessageRight key={msg.id ?? i} id={msg.id ?? String(i)} message={msg.content ?? ""} displayName={studentName} visible={visible} isInstructor={true} />
          : <MessageLeft key={msg.id ?? i} id={msg.id ?? String(i)} message={msg.content ?? ""} visible={visible} isInstructor={true} />;
      })}
    </div>
  );
}
