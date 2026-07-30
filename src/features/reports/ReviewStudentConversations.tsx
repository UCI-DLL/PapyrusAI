import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Get from "../../utility/Get";
import { getConversationList } from "../../utility/endpoints/ConversationEndpoints";
import { getCourse, getUsersInCourse } from "../../utility/endpoints/CourseEndpoints";
import { getGrades } from "../../utility/endpoints/GradeEndpoints";
import { ConversationListType, ConversationType } from "../../utility/types/ConversationTypes";
import { GradeType, ModuleType } from "../../utility/types/CourseTypes";
import { CustomUserType } from "../../utility/types/UserTypes";
import { useTranslation } from "../../hooks/useTranslation";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { PageLoader, PageHeaderCard } from "../../components/Common";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, ClipboardCheck, Clock, MessageSquare } from "lucide-react";

const ROWS_OPTIONS = [10, 25, 50] as const;
type SortField = "name" | "date" | "messages" | "score";

export default function ReviewStudentConversations(): JSX.Element {
  const { courseId = "", moduleId = "", username = "" } = useParams<{
    courseId: string;
    moduleId: string;
    username: string;
  }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [courseName, setCourseName] = useState("");
  const [module, setModule] = useState<ModuleType>();
  const [student, setStudent] = useState<CustomUserType>();
  const [conversations, setConversations] = useState<ConversationType[]>([]);
  const [grades, setGrades] = useState<GradeType[]>([]);
  const [loadCount, setLoadCount] = useState(0);
  const [studentLoaded, setStudentLoaded] = useState(false);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [page, setPage] = useState(0);

  //TODO check this works on prod
  const isLoading = loadCount < 5 || !studentLoaded;

  useEffect(() => {
    if (!courseId || !moduleId || !username) return;
    const controller = new AbortController();
    const done = () => setLoadCount((n) => n + 1);

    Get(getCourse(courseId), controller.signal).then((res) => {
      if (res?.status < 300 && res.data) {
        setCourseName(res.data.name ?? "");
        setModule(res.data.modules.find((m: ModuleType) => m.id === moduleId));
      } else if (res?.status === 401) navigate("/login");
      done();
    });

    Get(getConversationList(courseId, moduleId, username), controller.signal).then((res) => {
      if (res?.status < 300 && res.data) {
        setConversations((res.data as ConversationListType).conversations ?? []);
      } else if (res?.status === 401) navigate("/login");
      done();
    });

    Get(getGrades(courseId, moduleId), controller.signal, true).then((res) => {
      if (res?.status < 300 && res.data) {
        const all = Array.isArray(res.data) ? res.data : [];
        setGrades(all.filter((g: GradeType) => g.username === username));
      } else if (res?.status === 401) navigate("/login");
      done();
    });

    const fetchStudents = (nextToken?: string, acc: CustomUserType[] = []) => {
      Get(getUsersInCourse(courseId, 50, nextToken ?? ""), controller.signal).then((res) => {
        if (res?.status < 300 && res.data) {
          const pg: CustomUserType[] = Array.isArray(res.data.users) ? res.data.users : [];
          const all = [...acc, ...pg];
          const found = all.find((u) => u.username === username || u.sub === username);
          if (found) { setStudent(found); setStudentLoaded(true); return; }
          if (res.data.nextToken) fetchStudents(res.data.nextToken, all);
          else setStudentLoaded(true);
        } else {
          setStudentLoaded(true);
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

  const studentName = student ? `${student.name} ${student.family_name}`.trim() : "";
  const visibleConversations = conversations.filter((c) => !c.isDeleted);

  const rows = visibleConversations.map((conv, idx) => ({
    conv,
    idx,
    grade: getGradeForConv(conv.id),
  }));

  const filteredRows = rows
    .filter(({ conv }) => !search || conv.name.toLowerCase().includes(search.toLowerCase()));

  const sortedRows = [...filteredRows].sort((a, b) => {
    let cmp = 0;
    switch (sortBy) {
      case "name":
        cmp = (a.conv.name || "").localeCompare(b.conv.name || "");
        break;
      case "date":
        cmp = parseInt(a.grade?.timestamp ?? "0", 10) - parseInt(b.grade?.timestamp ?? "0", 10);
        break;
      case "messages":
        cmp = a.conv.messages.length - b.conv.messages.length;
        break;
      case "score":
        cmp = (a.grade?.totalScore ?? -1) - (b.grade?.totalScore ?? -1);
        break;
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const totalPages = Math.ceil(sortedRows.length / rowsPerPage);
  const paginatedRows = sortedRows.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  const handleSearch = (v: string) => { setSearch(v); setPage(0); };
  const handleRowsPerPage = (v: string) => { setRowsPerPage(Number(v)); setPage(0); };
  const handleSort = (field: SortField) => {
    if (sortBy === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(field); setSortDir("asc"); }
    setPage(0);
  };

  function SortIcon({ field }: { field: SortField }) {
    if (sortBy !== field) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sortDir === "asc"
      ? <ArrowUp className="h-3 w-3" />
      : <ArrowDown className="h-3 w-3" />;
  }

  if (isLoading) return <PageLoader pageName={t("reviewReports.studentConversations")} />;

  return (
    <main className="bg-background text-foreground p-4 space-y-6">
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
              <Select value={sortBy} onValueChange={(v) => { setSortBy(v as SortField); setPage(0); }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-muted z-[100]">
                  <SelectItem value="name">{t("reviewReports.conversationName")}</SelectItem>
                  <SelectItem value="date">{t("reviewReports.dateSubmitted")}</SelectItem>
                  <SelectItem value="messages">{t("reviewReports.numMessages")}</SelectItem>
                  <SelectItem value="score">{t("reviewReports.totalScore")}</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                aria-label={sortDir === "asc" ? t("common.desc") : t("common.asc")}
                className="gap-1"
              >
                {sortDir === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                {sortDir === "asc" ? t("common.asc") : t("common.desc")}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button
                      onClick={() => handleSort("name")}
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      {t("reviewReports.conversationName")}
                      <SortIcon field="name" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("date")}
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      {t("reviewReports.dateSubmitted")}
                      <SortIcon field="date" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("messages")}
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      {t("reviewReports.numMessages")}
                      <SortIcon field="messages" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("score")}
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      {t("reviewReports.totalScore")}
                      <SortIcon field="score" />
                    </button>
                  </TableHead>
                  <TableHead aria-label={t("common.actions")} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
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
                        <TableCell>
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
