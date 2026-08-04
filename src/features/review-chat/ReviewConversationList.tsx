import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import Get from "../../utility/Get";
import Patch from "../../utility/Patch";
import Post from "../../utility/Post";
import {
  getConversationList,
  postCreateConversation,
  patchVoidConversation,
} from "../../utility/endpoints/ConversationEndpoints";
import { getCourse } from "../../utility/endpoints/CourseEndpoints";
import { getGrades } from "../../utility/endpoints/GradeEndpoints";
import { getUserData, logEvent } from "../../utility/endpoints/UserEndpoints";
import { ConversationListType, ConversationType } from "../../utility/types/ConversationTypes";
import { CourseType, GradeType } from "../../utility/types/CourseTypes";
import { UserType } from "../../utility/types/UserTypes";
import { UserContext } from "../../utility/context/UserContext";
import { AlertContext } from "../../utility/context/AlertContext";
import { useTranslation } from "../../hooks/useTranslation";
import { handleCourseTermLanguage } from "../../utility/Helpers";
import { InfoAccordion } from "../../components/ui-wrappers/InfoAccordion";
import {
  Loader2,
  Plus,
  ClipboardCheck,
  Clock,
  CheckCircle,
  MessageSquare,
  User,
  ArrowRight,
  Ban,
} from "lucide-react";

export default function ReviewConversationList(): JSX.Element {
  const location = useLocation();
  const navigator = useNavigate();
  const { user } = useContext(UserContext);
  const { setAlert } = useContext(AlertContext);
  const { t } = useTranslation();

  const [moduleIds, setModuleIds] = useState<{ courseId: string; moduleId: string }>();
  const [conversationList, setConversationList] = useState<ConversationListType>();
  const [course, setCourse] = useState<CourseType>();
  const [viewUser, setViewUser] = useState<UserType>();
  const [grades, setGrades] = useState<Array<GradeType>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [creatingConvo, setCreatingConvo] = useState(false);
  const [error, setError] = useState<string>();

  const instructor = process.env.REACT_APP_INSTRUCTOR ?? "PapyrusAIInstructors";
  const admin = process.env.REACT_APP_ADMIN ?? "PapyrusAIAdmin";
  const isInstructor = user?.groups.includes(instructor) || user?.groups.includes(admin) || (moduleIds && user?.groups.includes(moduleIds.courseId + "-TA"));

  useEffect(() => {
    const controller = new AbortController();
    const parts = location.pathname.split("/");
    // Path: /courses/:courseId/modules/:moduleId/review  OR
    //       /courses/:courseId/modules/:moduleId/review/username/:username
    if (parts[1] === "courses" && parts[2] && parts[4]) {
      const courseId = parts[2];
      const moduleId = parts[4];
      const username = parts[6] || undefined;

      setModuleIds({ courseId, moduleId });

      Post(logEvent(), { eventType: "view_page", metadata: { courseId, moduleId, page: "review_conversation_list" } });

      Get(getCourse(courseId), controller.signal).then((res) => {
        if (res?.status < 300 && res.data) setCourse(res.data);
        else if (res?.status === 401) navigator("/login");
        else if (res !== undefined) setError(t("errorMessage.courseNotFound"));
      });

      Get(getConversationList(courseId, moduleId, username), controller.signal).then((res) => {
        if (res?.status < 300 && res.data) setConversationList(res.data);
        else if (res?.status === 401) navigator("/login");
        else if (res !== undefined) setError(t("errorMessage.convoNotFound"));
      });

      // Load grades to show score/pending status per conversation
      Get(getGrades(courseId, moduleId), controller.signal, true).then((res) => {
        if (res?.status < 300 && res.data) setGrades(Array.isArray(res.data) ? res.data : []);
      });

      if (username) {
        Get(getUserData(username), controller.signal).then((res) => {
          if (res?.status < 300 && res.data) setViewUser(res.data);
          else if (res?.status === 401) navigator("/login");
          else if (res !== undefined) setError(t("errorMessage.userNotFound"));
        });
      }

      setIsLoading(false);
    }
    return () => controller.abort();
    // eslint-disable-next-line
  }, []);

  function handleNewSubmission() {
    if (!moduleIds || !user) return;
    setCreatingConvo(true);
    Post(postCreateConversation(moduleIds.courseId, moduleIds.moduleId), {}).then((res) => {
      if (res?.status < 300 && res.data?.conversations) {
        setConversationList(res.data);
        const newIdx = res.data.conversations.length - 1;
        navigator(`/review-chat/${user.username}/${moduleIds.courseId}/${moduleIds.moduleId}/${newIdx}`);
      } else if (res?.status === 401) {
        navigator("/login");
      } else if (res?.status === 400) {
        setAlert({ message: t("errorMessage.maxDraftsReached"), type: "error" });
      } else {
        setAlert({ message: t("errorMessage.genericError"), type: "error" });
      }
      setCreatingConvo(false);
    });
  }

  function handleVoidConversation(index: number, voided: boolean) {
    if (!moduleIds || !viewUser) return;
    Patch(patchVoidConversation(moduleIds.courseId, moduleIds.moduleId, index.toString(), viewUser.username), { voidedByInstructor: voided }).then((res) => {
      if (res?.status < 300) {
        setConversationList((prev) => {
          if (!prev) return prev;
          const convs = [...prev.conversations];
          const idx = prev.conversations.findIndex((_, i) => prev.conversations.length - 1 - i === index);
          if (convs[idx]) convs[idx] = { ...convs[idx], voidedByInstructor: voided };
          return { ...prev, conversations: convs };
        });
        Get(getConversationList(moduleIds.courseId, moduleIds.moduleId, viewUser.username)).then((res) => {
          if (res?.status < 300 && res.data) setConversationList(res.data);
        });
      } else if (res?.status === 401) {
        navigator("/login");
      } else {
        setAlert({ message: t("errorMessage.voidConversationError"), type: "error" });
      }
    });
  }

  function getGradeForConversation(conversationId: string): GradeType | undefined {
    return grades.find((g) => g.courseModuleConversationId.endsWith(`+${conversationId}`));
  }

  function renderStatusBadge(conversation: ConversationType) {
    const grade = getGradeForConversation(conversation.id);

    if (conversation.completed) {
      if (grade?.released) {
        return (
          <Badge className="flex items-center gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-white pointer-events-none">
            <CheckCircle className="h-3 w-3" />
            {t("reviewConversation.scored")}: {grade.totalScore}
          </Badge>
        );
      }
      if (grade && !grade.released) {
        return (
          <Badge variant="secondary" className="flex items-center gap-1 pointer-events-none">
            <Clock className="h-3 w-3" />
            {t("reviewConversation.pendingReview")}
          </Badge>
        );
      }
      return (
        <Badge variant="secondary" className="flex items-center gap-1 pointer-events-none">
          <ClipboardCheck className="h-3 w-3" />
          {t("reviewConversation.submitted")}
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="flex items-center gap-1 pointer-events-none">
        <MessageSquare className="h-3 w-3" />
        {t("reviewConversation.inProgress")}
      </Badge>
    );
  }

  const module = course?.modules.find((m) => m.id === moduleIds?.moduleId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{t("loadingMessage.conversations")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <ClipboardCheck className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <p>{error}</p>
      </div>
    );
  }

  const conversations = conversationList?.conversations ?? [];
  const maxDrafts = module?.maxDrafts ?? 999;
  const isSummative = module?.assessmentType === "summative";
  const nonVoidedCompleted = conversations.filter(c => c.completed && !c.voidedByInstructor);
  const canCreate = (() => {
    if (viewUser || isInstructor) return false;
    if (!isSummative) {
      return maxDrafts >= 999 || nonVoidedCompleted.length < maxDrafts;
    }
    // Summative: hide if any non-voided completed submission is still awaiting a released grade
    const hasUnreleasedSubmission = nonVoidedCompleted.some(c => {
      const grade = grades.find(g => g.courseModuleConversationId.endsWith(`+${c.id}`));
      return !grade?.released;
    });
    if (hasUnreleasedSubmission) return false;
    const releasedCount = nonVoidedCompleted.filter(c =>
      grades.find(g => g.courseModuleConversationId.endsWith(`+${c.id}`))?.released
    ).length;
    return maxDrafts >= 999 || releasedCount < maxDrafts;
  })();
  const viewUsername = viewUser?.username ?? user?.username ?? "";

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          {viewUser ? (
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <User className="h-5 w-5" />
              {viewUser.name} {viewUser.family_name} — {t("reviewConversation.submissions")}
            </h1>
          ) : (
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              {t("reviewConversation.mySubmissions")}
            </h1>
          )}
          {course && (
            <div className="space-y-0.5">
              <p className="text-sm text-muted-foreground capitalize">
                {course.section
                  ? `${user && course.term ? handleCourseTermLanguage(user["custom:language"], course.term) : ""} ${course.year ?? ""} - ${course.section}`
                  : `${user && course.term ? handleCourseTermLanguage(user["custom:language"], course.term) : ""} ${course.year ?? ""}`}
              </p>
              <h2 className="text-lg font-semibold">
                {module?.name ?? ""} — {course.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("common.instructor")}: {course.instructor.name} {course.instructor.family_name}
              </p>
            </div>
          )}
        </div>

        {canCreate && (
          <Button onClick={handleNewSubmission} disabled={creatingConvo} className="flex items-center gap-2">
            {creatingConvo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {t("reviewConversation.newSubmission")}
          </Button>
        )}
      </div>

      <InfoAccordion>
        <p className="text-sm text-muted-foreground">{t("reviewConversation.conversationListDescription")}</p>
      </InfoAccordion>

      {/* Conversation list */}
      <div className="space-y-2">
        {conversations.filter((c) => !c.isDeleted || viewUser).length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ClipboardCheck className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg mb-4">{t("reviewConversation.noSubmissionsYet")}</p>
            {canCreate && (
              <Button onClick={handleNewSubmission} disabled={creatingConvo} className="gap-2">
                {creatingConvo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {t("reviewConversation.startSubmission")}
              </Button>
            )}
          </div>
        ) : (
          conversations
            .filter((c) => !c.isDeleted || viewUser)
            .sort((a, b) => (b.id > a.id ? 1 : -1))
            .map((conversation, index) => {
              const revIdx = conversations.length - conversations.findIndex((c) => c.id === conversation.id) - 1;
              const time = new Date(parseInt(conversation.id.substring(0, 13), 10)).toLocaleString();
              const link = `/review-chat/${viewUsername}/${moduleIds?.courseId}/${moduleIds?.moduleId}/${revIdx}`;
              const grade = getGradeForConversation(conversation.id);

              return (
                <Card key={index} className={`hover:shadow-md transition-shadow${conversation.voidedByInstructor ? " border-amber-300 dark:border-amber-700" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <Link to={link} className="flex-1 min-w-0 no-underline group">
                        <div className="space-y-1">
                          <p className="text-lg font-semibold text-foreground group-hover:text-primary dark:group-hover:text-gold colorful-dark:group-hover:text-gold transition-colors truncate-text">
                            {conversation.name}
                          </p>
                          <p className="text-xs text-muted-foreground">{time}</p>
                          {conversation.voidedByInstructor && (
                            <p className="text-xs text-amber-600 dark:text-amber-400">{t("chat.voided")}</p>
                          )}
                          {/* Show score if released */}
                          {grade?.released && grade.scores.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {t("reviewReports.totalScore")}: <span className="font-semibold text-foreground">{grade.totalScore}</span>
                            </p>
                          )}
                        </div>
                      </Link>

                      <div className="flex items-center gap-2 shrink-0">
                        {renderStatusBadge(conversation)}
                        {viewUser && isInstructor && conversation.completed && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleVoidConversation(revIdx, !conversation.voidedByInstructor)}
                            className={`gap-1 text-xs ${conversation.voidedByInstructor ? "text-muted-foreground" : "text-amber-600 dark:text-amber-400 hover:text-amber-700"}`}
                            title={conversation.voidedByInstructor ? t("chat.unvoidSubmission") : t("chat.voidSubmission")}
                          >
                            <Ban className="h-3 w-3" />
                            {conversation.voidedByInstructor ? t("chat.unvoidSubmission") : t("chat.voidSubmission")}
                          </Button>
                        )}
                        <Button size="sm" asChild className="gap-1 text-xs">
                          <Link to={link} className="no-underline flex items-center gap-1">
                            {conversation.completed ? t("reviewConversation.viewSubmission") : t("reviewConversation.continueSubmission")}
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
        )}
      </div>
    </div>
  );
}
