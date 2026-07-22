import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import Get from "../../utility/Get";
import Post from "../../utility/Post";
import Put from "../../utility/Put";
import {
  getGrades,
  postReleaseAllGrades,
  putUpdateGrade,
} from "../../utility/endpoints/GradeEndpoints";
import { getCourse, getUsersInCourse } from "../../utility/endpoints/CourseEndpoints";
import { GradeScore, GradeType, ModuleType } from "../../utility/types/CourseTypes";
import { CustomUserType } from "../../utility/types/UserTypes";
import { AlertContext } from "../../utility/context/AlertContext";
import { useTranslation } from "../../hooks/useTranslation";
import { DialogWrapper } from "../../components/ui-wrappers/DialogWrapper";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { PageLoader, PageHeaderCard } from "../../components/Common";
import { logEvent } from "../../utility/endpoints/UserEndpoints";
import {
  CheckCircle,
  Clock,
  Edit,
  ChevronLeft,
  ClipboardCheck,
  RefreshCw,
} from "lucide-react";
import { cn } from "../../lib/utils";

export default function ReviewModuleReports(): JSX.Element {
  const location = useLocation();
  const navigator = useNavigate();
  const { setAlert } = useContext(AlertContext);
  const { t } = useTranslation();

  const parts = location.pathname.split("/");
  const courseId = parts[3] ?? "";
  const moduleId = parts[4] ?? "";

  const [module, setModule] = useState<ModuleType>();
  const [grades, setGrades] = useState<Array<GradeType>>([]);
  const [students, setStudents] = useState<Array<CustomUserType>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReleasing, setIsReleasing] = useState(false);

  const [openReleaseAllModal, setOpenReleaseAllModal] = useState(false);

  const [editModal, setEditModal] = useState<{
    open: boolean;
    grade: GradeType | null;
    scores: Array<GradeScore>;
    instructorNotes: string;
    isSaving: boolean;
  }>({ open: false, grade: null, scores: [], instructorNotes: "", isSaving: false });

  const instructor = process.env.REACT_APP_INSTRUCTOR ?? "PapyrusAIInstructors";
  const admin = process.env.REACT_APP_ADMIN ?? "PapyrusAIAdmin";

  useEffect(() => {
    if (!courseId || !moduleId) return;
    const controller = new AbortController();

    Post(logEvent(), { eventType: "view_page", metadata: { courseId, moduleId, page: "review_module_reports" } });

    Get(getCourse(courseId), controller.signal).then((res) => {
      if (res?.status < 300 && res.data) {
        setModule(res.data.modules.find((m: ModuleType) => m.id === moduleId));
      } else if (res?.status === 401) {
        navigator("/login");
      }
    });

    Get(getUsersInCourse(courseId), controller.signal).then((res) => {
      if (res?.status < 300 && res.data) setStudents(res.data);
    });

    loadGrades(courseId, moduleId, controller.signal);

    return () => controller.abort();
    // eslint-disable-next-line
  }, [courseId, moduleId]);

  function loadGrades(cId: string, mId: string, signal?: AbortSignal) {
    setIsLoading(true);
    Get(getGrades(cId, mId), signal, true).then((res) => {
      if (res?.status < 300 && res.data) {
        setGrades(Array.isArray(res.data) ? res.data : []);
      } else if (res?.status === 401) {
        navigator("/login");
      }
      setIsLoading(false);
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
        navigator("/login");
      } else {
        setAlert({ message: t("errorMessage.genericError"), type: "error" });
      }
      setIsReleasing(false);
    });
  }

  function openEditModal(grade: GradeType) {
    setEditModal({
      open: true,
      grade,
      scores: grade.scores.map((s) => ({ ...s })),
      instructorNotes: grade.instructorNotes ?? "",
      isSaving: false,
    });
  }

  function handleScoreChange(idx: number, field: "score" | "feedback", value: string) {
    setEditModal((prev) => {
      const updated = [...prev.scores];
      if (field === "score") updated[idx] = { ...updated[idx], score: Number(value) };
      else updated[idx] = { ...updated[idx], feedback: value };
      return { ...prev, scores: updated };
    });
  }

  function handleSaveGrade() {
    if (!editModal.grade) return;
    setEditModal((prev) => ({ ...prev, isSaving: true }));

    const parts = editModal.grade!.courseModuleConversationId.split("+");
    const convId = parts[parts.length - 1];

    Put(putUpdateGrade(courseId, moduleId, editModal.grade!.username, convId), {
      scores: editModal.scores,
      instructorNotes: editModal.instructorNotes,
    }, true).then((res) => {
      if (res?.status < 300) {
        setAlert({ message: t("reviewReports.gradeSaved"), type: "success" });
        setEditModal({ open: false, grade: null, scores: [], instructorNotes: "", isSaving: false });
        loadGrades(courseId, moduleId);
      } else if (res?.status === 401) {
        navigator("/login");
      } else {
        setAlert({ message: t("errorMessage.genericError"), type: "error" });
        setEditModal((prev) => ({ ...prev, isSaving: false }));
      }
    });
  }

  function getStudentName(username: string) {
    const s = students.find((st) => st.username === username);
    return s ? `${s.name} ${s.family_name}` : username;
  }

  function getConvId(grade: GradeType) {
    const parts = grade.courseModuleConversationId.split("+");
    return parts[parts.length - 1];
  }

  const pendingCount = grades.filter((g) => !g.released).length;
  const rubric = module?.rubrics?.[0];
  const maxPerCriterion = rubric ? Math.max(...(rubric.columns.map(Number).filter(Number.isFinite))) : undefined;
  const maxTotal = maxPerCriterion !== undefined && rubric ? rubric.criteria.length * maxPerCriterion : undefined;

  if (isLoading) return <PageLoader pageName={t("reviewReports.title")} />;

  return (
    <main className="bg-background text-foreground p-4 space-y-6">
      {/* Release all confirm */}
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

      {/* Edit grade modal */}
      <DialogWrapper
        open={editModal.open}
        onOpenChange={(open) => !open && setEditModal({ open: false, grade: null, scores: [], instructorNotes: "", isSaving: false })}
        title={t("reviewReports.editGrade")}
        contentClassName="sm:max-w-xl max-h-[90vh] overflow-y-auto"
        actions={[
          {
            label: t("common.cancel"),
            onClick: () => setEditModal({ open: false, grade: null, scores: [], instructorNotes: "", isSaving: false }),
            variant: "outline",
          },
          {
            label: editModal.isSaving ? t("common.saving") ?? "Saving…" : t("reviewReports.saveGrade"),
            onClick: handleSaveGrade,
            disabled: editModal.isSaving,
          },
        ]}
      >
        <div className="space-y-4">
          {editModal.scores.map((score, idx) => (
            <div key={idx} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-sm">{score.name}</span>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`score-${idx}`} className="text-xs shrink-0">{t("reviewReports.totalScore")}</Label>
                  <Input
                    id={`score-${idx}`}
                    type="number"
                    value={score.score}
                    onChange={(e) => handleScoreChange(idx, "score", e.target.value)}
                    className="w-20 text-sm"
                    min={0}
                    max={maxPerCriterion}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor={`feedback-${idx}`} className="text-xs">{t("reviewReports.editGrade")}</Label>
                <Textarea
                  id={`feedback-${idx}`}
                  value={score.feedback}
                  onChange={(e) => handleScoreChange(idx, "feedback", e.target.value)}
                  className="text-sm min-h-[60px]"
                />
              </div>
            </div>
          ))}
          <div className="space-y-1">
            <Label htmlFor="instructor-notes" className="text-sm font-medium">{t("reviewReports.instructorNotes")}</Label>
            <Textarea
              id="instructor-notes"
              value={editModal.instructorNotes}
              onChange={(e) => setEditModal((prev) => ({ ...prev, instructorNotes: e.target.value }))}
              className="text-sm min-h-[80px]"
            />
          </div>
        </div>
      </DialogWrapper>

      {/* Page header */}
      <PageHeaderCard
        title={t("reviewReports.title")}
        description={module?.name}
        icon={<ClipboardCheck size={192} />}
      />

      {/* Nav buttons */}
      <nav className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={() => loadGrades(courseId, moduleId)} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          {t("common.refresh")}
        </Button>
        {pendingCount > 0 && (
          <Button size="sm" onClick={() => setOpenReleaseAllModal(true)} disabled={isReleasing} className="gap-2">
            {isReleasing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            {t("reviewReports.releaseAll")} ({pendingCount})
          </Button>
        )}
      </nav>

      {/* Back link */}
      <Link to={`/reports/course/${courseId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground no-underline">
        <ChevronLeft className="h-4 w-4" />
        {t("reviewReports.backToReports")}
      </Link>

      {/* Grades table */}
      {grades.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ClipboardCheck className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>{t("reviewReports.noGrades")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("reviewReports.student")}</TableHead>
                <TableHead>{t("reviewReports.conversationId")}</TableHead>
                <TableHead>{t("reviewReports.submittedAt")}</TableHead>
                <TableHead>{t("reviewReports.totalScore")}</TableHead>
                {rubric?.criteria.map((c) => (
                  <TableHead key={c.name} className="whitespace-nowrap">{c.name}</TableHead>
                ))}
                <TableHead>{t("reviewReports.released")}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grades.map((grade, i) => {
                const convId = getConvId(grade);
                const ts = new Date(parseInt(grade.timestamp, 10)).toLocaleDateString();
                return (
                  <TableRow key={i} className={cn(!grade.released && "bg-muted/30")}>
                    <TableCell className="font-medium">
                      {getStudentName(grade.username)}
                      {grade.instructorEdited && (
                        <Badge variant="outline" className="ml-2 text-xs pointer-events-none">
                          {t("reviewReports.edited")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{convId.substring(0, 8)}…</TableCell>
                    <TableCell className="text-sm">{ts}</TableCell>
                    <TableCell className="font-semibold">
                      {grade.totalScore}{maxTotal !== undefined ? ` / ${maxTotal}` : ""}
                    </TableCell>
                    {rubric?.criteria.map((c) => {
                      const s = grade.scores.find((sc) => sc.name === c.name);
                      return (
                        <TableCell key={c.name}>
                          {s ? `${s.score}${maxPerCriterion !== undefined ? ` / ${maxPerCriterion}` : ""}` : "—"}
                        </TableCell>
                      );
                    })}
                    <TableCell>
                      {grade.released ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-white flex items-center gap-1 pointer-events-none w-fit">
                          <CheckCircle className="h-3 w-3" />
                          {t("reviewReports.released")}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex items-center gap-1 pointer-events-none w-fit">
                          <Clock className="h-3 w-3" />
                          {t("reviewReports.pending")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(grade)} className="gap-1">
                        <Edit className="h-3.5 w-3.5" />
                        {t("reviewReports.editGrade")}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </main>
  );
}
