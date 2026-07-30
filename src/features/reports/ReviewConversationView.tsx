import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Get from "../../utility/Get";
import { getConversation } from "../../utility/endpoints/ConversationEndpoints";
import { getCourse, getUsersInCourse } from "../../utility/endpoints/CourseEndpoints";
import { getGrades } from "../../utility/endpoints/GradeEndpoints";
import { GradeType, ModuleType } from "../../utility/types/CourseTypes";
import { CustomUserType } from "../../utility/types/UserTypes";
import { useTranslation } from "../../hooks/useTranslation";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../components/ui/accordion";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../../components/ui/sheet";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { PageLoader } from "../../components/Common";
import { MessageLeft, MessageRight } from "../../components/Message";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BookOpen, CheckCircle, ChevronLeft, Clock, Download, Eye, MessageSquare } from "lucide-react";

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

  const [courseLoading, setCourseLoading] = useState(true);
  const [conversationLoading, setConversationLoading] = useState(true);
  const [gradesLoading, setGradesLoading] = useState(true);
  const [studentLoading, setStudentLoading] = useState(true);
  const isLoading = courseLoading || conversationLoading || gradesLoading || studentLoading;

  useEffect(() => {
    if (!courseId || !moduleId || !username || convIndex === "") return;
    const controller = new AbortController();

    Get(getCourse(courseId), controller.signal).then((res) => {
      if (res?.status < 300 && res.data) {
        setCourseName(res.data.name ?? "");
        setModule(res.data.modules.find((m: ModuleType) => m.id === moduleId));
      } else if (res?.status === 401) navigate("/login");
      setCourseLoading(false);
    });

    Get(getConversation(courseId, moduleId, convIndex, username), controller.signal).then((res) => {
      if (res?.status < 300 && res.data) setConversation(res.data);
      else if (res?.status === 401) navigate("/login");
      setConversationLoading(false);
    });

    Get(getGrades(courseId, moduleId), controller.signal, true).then((res) => {
      if (res?.status < 300 && res.data) {
        const all: GradeType[] = Array.isArray(res.data) ? res.data : [];
        setAllGrades(all.filter((g: GradeType) => g.username === username));
      } else if (res?.status === 401) navigate("/login");
      setGradesLoading(false);
    });

    const fetchStudents = (nextToken?: string, acc: CustomUserType[] = []) => {
      Get(getUsersInCourse(courseId, 50, nextToken ?? ""), controller.signal).then((res) => {
        if (res?.status < 300 && res.data) {
          const page: CustomUserType[] = Array.isArray(res.data.users) ? res.data.users : [];
          const all = [...acc, ...page];
          const found = all.find((u) => u.username === username || u.sub === username);
          if (found) { setStudent(found); setStudentLoading(false); return; }
          if (res.data.nextToken) fetchStudents(res.data.nextToken, all);
          else setStudentLoading(false);
        } else {
          setStudentLoading(false);
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

  const studentName = student ? `${student.name} ${student.family_name}`.trim() : username;
  const convTitle = conversation?.name || `${t("reviewReports.attempt")} ${Number(convIndex) + 1}`;
  const grade = allGrades.find(
    (g) => conversation?.id && g.courseModuleConversationId.endsWith(`+${conversation.id}`)
  ) ?? null;
  const messages: any[] = [...(conversation?.messages ?? [])].sort(
    (a, b) => parseInt(a.timestamp ?? "0") - parseInt(b.timestamp ?? "0")
  );
  const visibleMessages = messages.filter((m: any) => m.userVisible !== false);
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
        timestamp: m.id ? new Date(parseInt(m.id.substring(0, 13), 10)).toISOString() : null,
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
            <h2 className="text-lg font-semibold">{t("reviewReports.viewReviewConversation")}</h2>
            <div className="flex gap-2">
              {module?.essaySubmission && (
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setDrawerOpen(true)}>
                  <Eye className="h-4 w-4" />
                  {t("reviewReports.openConversation")}
                </Button>
              )}
              <Button size="sm" className="gap-2" onClick={() => setExportDialogOpen(true)}>
                <Download className="h-4 w-4" />
                {t("reviewReports.export")}
              </Button>
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
                      {grade.totalScore}
                      {maxTotal !== undefined ? ` / ${maxTotal}` : ""}
                    </span>
                  </div>
                  <Accordion type="multiple" className="w-full">
                    {grade.scores.map((score, i) => (
                      <AccordionItem key={i} value={`score-${i}`}>
                        <AccordionTrigger className="hover:no-underline py-3">
                          <div className="flex items-center justify-between w-full pr-2">
                            <span className="text-sm font-medium text-left">{score.name}</span>
                            <Badge variant="secondary" className="ml-2 shrink-0">
                              {score.score}
                              {maxPerCriterion !== undefined ? ` / ${maxPerCriterion}` : ""}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          {score.feedback ? (
                            <Markdown remarkPlugins={[remarkGfm]} className={" text-muted-foreground"}>
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
