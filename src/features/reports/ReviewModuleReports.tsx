import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Get from "../../utility/Get";
import Post from "../../utility/Post";
import { getGrades, postReleaseAllGrades } from "../../utility/endpoints/GradeEndpoints";
import { getCourse, getUsersInCourse } from "../../utility/endpoints/CourseEndpoints";
import { GradeType, ModuleType } from "../../utility/types/CourseTypes";
import { CustomUserType } from "../../utility/types/UserTypes";
import { AlertContext } from "../../utility/context/AlertContext";
import { useTranslation } from "../../hooks/useTranslation";
import { DialogWrapper } from "../../components/ui-wrappers/DialogWrapper";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { PageLoader, PageHeaderCard } from "../../components/Common";
import { logEvent } from "../../utility/endpoints/UserEndpoints";
import {
  CheckCircle, ChevronLeft, ChevronRight, ClipboardCheck, RefreshCw,
  MessageSquare, Users, Star,
} from "lucide-react";

const ROWS_OPTIONS = [10, 25, 50] as const;

export default function ReviewModuleReports(): JSX.Element {
  const { courseId = "", moduleId = "" } = useParams<{ courseId: string; moduleId: string }>();
  const navigate = useNavigate();
  const { setAlert } = useContext(AlertContext);
  const { t } = useTranslation();

  const [courseName, setCourseName] = useState("");
  const [module, setModule] = useState<ModuleType>();
  const [grades, setGrades] = useState<GradeType[]>([]);
  const [students, setStudents] = useState<CustomUserType[]>([]);
  const [gradesLoading, setGradesLoading] = useState(true);
  const [courseLoaded, setCourseLoaded] = useState(true);
  const [studentsLoaded, setStudentsLoaded] = useState(true);
  const isLoading = gradesLoading || courseLoaded || studentsLoaded;
  const [isReleasing, setIsReleasing] = useState(false);
  const [openReleaseAllModal, setOpenReleaseAllModal] = useState(false);

  const [search, setSearch] = useState("");
  const [submittedFilter, setSubmittedFilter] = useState<"all" | "submitted" | "not-submitted">("all");
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!courseId || !moduleId) return;
    const controller = new AbortController();

    Post(logEvent(), { eventType: "view_page", metadata: { courseId, moduleId, page: "review_module_reports" } });

    Get(getCourse(courseId), controller.signal).then((res) => {
      if (res?.status < 300 && res.data) {
        setCourseName(res.data.name ?? "");
        setModule(res.data.modules.find((m: ModuleType) => m.id === moduleId));
      } else if (res?.status === 401) {
        navigate("/login");
      }
      setCourseLoaded(false);
    });

    const fetchStudents = (nextToken?: string, acc: CustomUserType[] = []) => {
      Get(getUsersInCourse(courseId, 50, nextToken ?? ""), controller.signal).then((res) => {
        if (res?.status < 300 && res.data) {
          const page = Array.isArray(res.data.users) ? res.data.users : [];
          const all = [...acc, ...page];
          if (res.data.nextToken) fetchStudents(res.data.nextToken, all);
          else { setStudents(all); setStudentsLoaded(false); }
        } else {
          setStudentsLoaded(false);
        }
      });
    };
    fetchStudents();

    loadGrades(courseId, moduleId, controller.signal);
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

  // Derived data
  const rubric = module?.rubrics?.[0];
  const maxPerCriterion = rubric ? Math.max(...rubric.columns.map(Number).filter(Number.isFinite)) : undefined;
  const maxTotal = maxPerCriterion !== undefined && rubric ? rubric.criteria.length * maxPerCriterion : undefined;
  const pendingCount = grades.filter((g) => !g.released).length;
  const studentsSubmitted = new Set(grades.map((g) => g.username)).size;
  const avgScore =
    grades.length > 0
      ? (grades.reduce((sum, g) => sum + g.totalScore, 0) / grades.length).toFixed(1)
      : null;

  const gradesByUser = grades.reduce<Record<string, GradeType[]>>((acc, g) => {
    (acc[g.username] ??= []).push(g);
    return acc;
  }, {});

  const bestGradeByUser = Object.fromEntries(
    Object.entries(gradesByUser).map(([u, gs]) => [
      u,
      gs.reduce((best, g) => (g.totalScore > best.totalScore ? g : best)),
    ])
  );

  const sortedStudents = [...students].sort((a, b) => {
    const cmp = (a.family_name ?? "").localeCompare(b.family_name ?? "");
    return cmp !== 0 ? cmp : (a.name ?? "").localeCompare(b.name ?? "");
  });

  // Search + filter
  const filteredStudents = sortedStudents.filter((s) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      `${s.name} ${s.family_name}`.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q);
    const hasSubmission = !!bestGradeByUser[s.username];
    const matchesFilter =
      submittedFilter === "all" ||
      (submittedFilter === "submitted" && hasSubmission) ||
      (submittedFilter === "not-submitted" && !hasSubmission);
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredStudents.length / rowsPerPage);
  const paginatedStudents = filteredStudents.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  // Reset to page 0 when filters change
  const handleSearch = (v: string) => { setSearch(v); setPage(0); };
  const handleFilter = (v: "all" | "submitted" | "not-submitted") => { setSubmittedFilter(v); setPage(0); };
  const handleRowsPerPage = (v: string) => { setRowsPerPage(Number(v)); setPage(0); };

  if (isLoading) return <PageLoader pageName={t("reviewReports.title")} />;

  return (
    <main className="bg-background text-foreground p-4 space-y-6">
      <DialogWrapper
        open={openReleaseAllModal}
        onOpenChange={setOpenReleaseAllModal}
        title={t("reviewReports.releaseAllTitle")}
        description={t("reviewReports.releaseAllDescription")}
        actions={[
          { label: t("common.cancel"), onClick: () => setOpenReleaseAllModal(false), variant: "outline" },
          { label: t("reviewReports.releaseAll"), onClick: handleReleaseAll },
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
            {pendingCount > 0 && (
              <Button
                size="sm"
                onClick={() => setOpenReleaseAllModal(true)}
                disabled={isReleasing}
                className="gap-2"
              >
                {isReleasing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                {t("reviewReports.releaseAll")} ({pendingCount})
              </Button>
            )}
          </div>
        }
      />

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                {t("reviewReports.studentsSubmitted")}
              </p>
              <p className="text-3xl font-bold mt-1">{studentsSubmitted}</p>
            </div>
            <Users className="h-10 w-10 text-primary opacity-40" aria-hidden="true" />
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
      </div>

      {/* Student table card */}
      <Card className="transition-all duration-300 hover:shadow-md">
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <h3 className="text-lg font-semibold">{t("reports.studentReports")}</h3>
              <div className="flex items-center gap-2">
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
            <div className="flex flex-col sm:flex-row gap-3 flex-wrap p-3 rounded-lg bg-muted/50">
              <Input
                placeholder={t("reports.searchByNameOrEmail")}
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="max-w-xs bg-background"
                aria-label={t("common.search")}
              />
              <Select value={submittedFilter} onValueChange={(v) => handleFilter(v as any)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-muted z-[100]">
                  <SelectItem value="all">{t("reviewReports.filterAll")}</SelectItem>
                  <SelectItem value="submitted">{t("reviewReports.filterSubmitted")}</SelectItem>
                  <SelectItem value="not-submitted">{t("reviewReports.filterNotSubmitted")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("reports.name")}</TableHead>
                  <TableHead>{t("reviewReports.bestScore")}</TableHead>
                  <TableHead>{t("reviewReports.bestSubmission")}</TableHead>
                  <TableHead aria-label={t("common.actions")}></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
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
                    return (
                      <TableRow key={student.username}>
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
                          {convPath && convNumber !== null ? (
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
                          )}
                        </TableCell>
                        <TableCell>
                          {totalConvs > 0 ? (
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
