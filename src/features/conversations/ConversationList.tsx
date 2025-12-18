import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";
import Get from "../../utility/Get";
import {
  Loader2,
  Trash2,
  EyeOff,
  MessageSquare,
  Edit,
  Plus,
  User,
  Clock,
  Eye,
} from "lucide-react";
import {
  getConversationList,
  postCreateConversation,
  postUpdateConversation,
} from "../../utility/endpoints/ConversationEndpoints";
import Post from "../../utility/Post";
import { ConversationListType } from "../../utility/types/ConversationTypes";
import { CourseType } from "../../utility/types/CourseTypes";
import { getCourse } from "../../utility/endpoints/CourseEndpoints";
import { getUserData } from "../../utility/endpoints/UserEndpoints";
import { UserType } from "../../utility/types/UserTypes";
import { UserContext } from "../../utility/context/UserContext";
import { AlertContext } from "../../utility/context/AlertContext";
import { cn } from "../../lib/utils";
import { useTranslation } from "../../hooks/useTranslation";
import { handleCourseTermLanguage } from "../../utility/Helpers";
import { InfoAccordion } from "../../components/ui-wrappers/InfoAccordion";

export default function ConversationList(): JSX.Element {
  let location = useLocation();
  let navigator = useNavigate();
  const { t } = useTranslation();
  const [moduleIds, setModuleIds] = useState<{
    courseId: string;
    moduleId: string;
  }>();
  const { user } = useContext(UserContext);
  const [conversationList, setConversationList] =
    useState<ConversationListType>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [creatingConvo, setCreatingConvo] = useState<boolean>(false); //disable button after clicking
  const [error, setError] = useState<string>();
  const [course, setCourse] = useState<CourseType>();
  //This is for when instructors or admins are looking up a different student
  const [viewUser, setViewUser] = useState<UserType>();
  const { setAlert } = useContext(AlertContext);
  const [openUpdateConvoModal, setOpenUpdateConvoModal] = useState<{
    open: boolean;
    deleteOpen: boolean;
    courseId: string;
    moduleId: string;
    index: number;
    name: string;
    isDeleted: boolean;
    error: string;
  }>({
    open: false,
    deleteOpen: false,
    courseId: "",
    moduleId: "",
    index: 0,
    name: "",
    isDeleted: false,
    error: "",
  });

  useEffect(() => {
    const controller = new AbortController();
    if (
      location.pathname &&
      location.pathname.split("/") &&
      location.pathname.split("/")[1] &&
      location.pathname.split("/")[2] &&
      location.pathname.split("/")[4]
    ) {
      //get prev course data
      const courseId = location.pathname.split("/")[2];
      const moduleId = location.pathname.split("/")[4];
      //instructors or admins can view other user's conversation lists
      var username;
      if (location.pathname.split("/")[6]) {
        username = location.pathname.split("/")[6];
      }
      setModuleIds({ courseId: courseId, moduleId: moduleId });
      setIsLoading(true);
      //get conversation list based on course and module
      Get(
        getConversationList(courseId, moduleId, username),
        controller.signal
      ).then((res) => {
        if (res && res.status && res.status < 300) {
          if (res.data) {
            //Get conversation list for this course/module
            setConversationList(res.data);
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          if (res === undefined) {
          } else {
            // handle error
            setError(t("errorMessage.convoNotFound"));
          }
        }
        setIsLoading(false);
      });

      Get(getCourse(courseId), controller.signal).then((res) => {
        if (res && res.status && res.status < 300) {
          if (res.data) {
            //Get the course and save the modules
            setCourse(res.data);
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          if (res === undefined) {
          } else {
            //handle error
            setError(t("errorMessage.courseNotFound"));
          }
        }
      });

      if (username) {
        //get user details
        Get(getUserData(username), controller.signal).then((res) => {
          if (res && res.status && res.status < 300) {
            if (res.data) {
              setViewUser(res.data);
            }
          } else if (res && res.status === 401) {
            navigator("/login");
          } else {
            if (res === undefined) {
            } else {
              //handle error
              setError(t("errorMessage.userNotFound"));
            }
          }
        });
      }
    }
    return () => {
      controller.abort();
    };
    // eslint-disable-next-line
  }, []);

  function handleNewConversation(
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) {
    e.preventDefault();
    if (moduleIds) {
      setCreatingConvo(true);
      Post(
        postCreateConversation(moduleIds?.courseId, moduleIds?.moduleId),
        {}
      ).then((res) => {
        if (res && res.status && res.status < 300) {
          if (res.data) {
            setCreatingConvo(false);
            //update conversation list with new conversation list
            setConversationList(res.data);
            //then go right into chat
            if (res.data.conversations) {
              navigator(
                `/chat/${user?.username}/${moduleIds.courseId}/${moduleIds.moduleId
                }/${res.data.conversations.length - 1}`
              );
            }
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          // handle error
          setAlert({
            message: `${t("errorMessage.genericError")}`,
            type: "error",
          });
        }
        setIsLoading(false);
      });
    }
  }

  function handleConverstionNameDeleteUpdate(convoUpdateObject: {
    open: boolean;
    courseId: string;
    moduleId: string;
    index: number;
    name: string;
    isDeleted: boolean;
    error: string;
  }) {
    if (convoUpdateObject.isDeleted) {
      setIsLoading(true);
      Post(
        postUpdateConversation(
          convoUpdateObject.courseId,
          convoUpdateObject.moduleId,
          convoUpdateObject.index.toString()
        ),
        { isDeleted: convoUpdateObject.isDeleted }
      ).then((res) => {
        if (res && res.status && res.status < 300) {
          if (res.data) {
            //update conversation list with new conversation list
            setConversationList(res.data);
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          // handle error
          setAlert({
            message: `${t("errorMessage.genericError")}`,
            type: "error",
          });
        }
        //then close modal
        setOpenUpdateConvoModal({
          open: false,
          deleteOpen: false,
          courseId: "",
          moduleId: "",
          index: 0,
          name: "",
          isDeleted: false,
          error: "",
        });
        setIsLoading(false);
      });
    } else {
      if (convoUpdateObject.name.length > 260) {
        setOpenUpdateConvoModal((prev) => ({
          ...prev,
          error: t("errorMessage.nameTooLong"),
        }));
      } else if (convoUpdateObject.name.length === 0) {
        setOpenUpdateConvoModal((prev) => ({
          ...prev,
          error: t("errorMessage.nameMissing"),
        }));
      } else {
        setIsLoading(true);
        Post(
          postUpdateConversation(
            convoUpdateObject.courseId,
            convoUpdateObject.moduleId,
            convoUpdateObject.index.toString()
          ),
          { name: convoUpdateObject.name }
        ).then((res) => {
          if (res && res.status && res.status < 300) {
            if (res.data) {
              //update conversation list with new conversation list
              setConversationList(res.data);
            }
          } else if (res && res.status === 401) {
            navigator("/login");
          } else {
            // handle error
            setAlert({
              message: `${t("errorMessage.genericError")}`,
              type: "error",
            });
          }
          //then close modal
          setOpenUpdateConvoModal({
            open: false,
            deleteOpen: false,
            courseId: "",
            moduleId: "",
            index: 0,
            name: "",
            isDeleted: false,
            error: "",
          });
          setIsLoading(false);
        });
      }
    }
  }

  return !isLoading && course ? (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 space-y-6">
      {error ? (
        <div className="text-center py-12 text-muted-foreground">
          <MessageSquare className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg mb-2">{error}</p>
        </div>
      ) : (
        <>
          <Dialog
            open={openUpdateConvoModal.deleteOpen}
            onOpenChange={(isOpen) => {
              if (!isOpen) {
                setOpenUpdateConvoModal({
                  open: false,
                  deleteOpen: false,
                  courseId: "",
                  moduleId: "",
                  index: 0,
                  name: "",
                  isDeleted: false,
                  error: "",
                });
              }
            }}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <EyeOff className="h-5 w-5" />
                  {t("chat.archiveConversationQuestion")}
                </DialogTitle>
                <DialogDescription>
                  {t("chat.archiveConversationDescription")}
                </DialogDescription>
              </DialogHeader>

              <DialogFooter className="flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  onClick={() =>
                    setOpenUpdateConvoModal({
                      open: false,
                      deleteOpen: false,
                      courseId: "",
                      moduleId: "",
                      index: 0,
                      name: "",
                      isDeleted: false,
                      error: "",
                    })
                  }
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() =>
                    handleConverstionNameDeleteUpdate({
                      ...openUpdateConvoModal,
                      isDeleted: true,
                    })
                  }
                >
                  {t("chat.archiveConversation")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={openUpdateConvoModal.open}
            onOpenChange={(isOpen) => {
              if (!isOpen) {
                setOpenUpdateConvoModal({
                  open: false,
                  deleteOpen: false,
                  courseId: "",
                  moduleId: "",
                  index: 0,
                  name: "",
                  isDeleted: false,
                  error: "",
                });
              }
            }}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  {t("chat.renameConversation")}
                </DialogTitle>
                <DialogDescription>
                  {t("chat.renameConversationDescription")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Input
                    name="name"
                    placeholder={t("chat.conversationName")}
                    value={openUpdateConvoModal.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setOpenUpdateConvoModal((prev) => ({
                        ...prev,
                        name: e.target.value,
                        error: "", // Clear error when user types
                      }));
                    }}
                    disabled={isLoading}
                    className={cn(
                      openUpdateConvoModal.error && "border-destructive"
                    )}
                  />
                  {openUpdateConvoModal.error && (
                    <p className="text-sm text-destructive">
                      {openUpdateConvoModal.error}
                    </p>
                  )}
                </div>
              </div>

              <DialogFooter className="flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  onClick={() =>
                    setOpenUpdateConvoModal({
                      open: false,
                      deleteOpen: false,
                      courseId: "",
                      moduleId: "",
                      index: 0,
                      name: "",
                      isDeleted: false,
                      error: "",
                    })
                  }
                  disabled={isLoading}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  onClick={() =>
                    handleConverstionNameDeleteUpdate(openUpdateConvoModal)
                  }
                  disabled={isLoading || !openUpdateConvoModal.name.trim()}
                  className="w-full sm:w-auto"
                >
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t("chat.updateName")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-2">
                {viewUser ? (
                  <h1 className="text-2xl font-bold text-foreground">
                    <User className="inline-block w-5 h-5 mr-2" />
                    {viewUser.name} {viewUser.family_name} {t("chat.conversations")}
                  </h1>
                ) : (
                  <h1 className="text-2xl font-bold text-foreground">
                    <MessageSquare className="inline-block w-5 h-5 mr-2" />
                    {t("chat.myConversations")}
                  </h1>
                )}
                {course && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground capitalize">
                      {course.section
                        ? `${user && course.term ? handleCourseTermLanguage(user["custom:language"], course.term) : ""} ${course.year ? course.year : ""
                        } - ${course.section}`
                        : `${user && course.term ? handleCourseTermLanguage(user["custom:language"], course.term) : ""} ${course.year ? course.year : ""
                        }`}
                    </p>
                    <h2 className="text-lg font-semibold text-foreground">
                      {
                        course.modules.find((x) => x.id === moduleIds?.moduleId)
                          ?.name
                      }{" "}
                      - {course.name}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {t("common.instructor")}: {course.instructor.name}{" "}
                      {course.instructor.family_name}
                    </p>
                  </div>
                )}
              </div>

              <div>
                {!viewUser && (
                  <Button
                    onClick={handleNewConversation}
                    disabled={creatingConvo}
                    className="flex items-center gap-2"
                  >
                    {creatingConvo ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    {t("chat.newConversation")}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <InfoAccordion>
            <p className="text-sm text-muted-foreground">
              {t("chat.conversationListDescription")}
              {user?.groups.includes(
                process.env.REACT_APP_INSTRUCTOR
                  ? process.env.REACT_APP_INSTRUCTOR
                  : "PapyrusAIInstructors"
              ) ? (
                <a
                  href="https://docs.google.com/document/d/1o3He0CdgV7hJOX65gc3Gpf3_Fr3GYvSm4Q-i-Y5cNHQ/edit?tab=t.0#heading=h.7e2lilt0vxyx"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2 hover:no-underline text-primary dark:text-gold colorful-dark:text-gold font-medium"
                >
                  {t("chat.conversationListDescriptionLinkText")}
                </a>
              ) : (
                <a
                  href="https://docs.google.com/document/d/1hVXs5RwWi8Pau1YlhwoF5Y5zO3-1hMZAyUxych7iIDo/edit?tab=t.0#heading=h.ap3bxaogq8pi"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2 hover:no-underline text-primary dark:text-gold colorful-dark:text-gold font-medium"
                >
                  {t("chat.conversationListDescriptionLinkText")}
                </a>
              )}
              .
            </p>
            <p className="text-sm text-muted-foreground">
              {t("chat.conversationListNewConvoDescription")}
            </p>
          </InfoAccordion>
          <div className="space-y-2" aria-label={t("chat.conversationList")}>
            {conversationList ? (
              <>
                {moduleIds &&
                  user &&
                  conversationList.conversations &&
                  conversationList.conversations.length > 0 ? (
                  conversationList.conversations
                    .sort((a: any, b: any) =>
                      b.id > a.id ? 1 : a.id > b.id ? -1 : 0
                    )
                    .map((conversation, index) => {
                      const time = new Date(
                        parseInt(conversation.id.substring(0, 13), 10)
                      ).toLocaleString();
                      const link = viewUser
                        ? `/chat/${viewUser.username}/${moduleIds.courseId}/${moduleIds.moduleId
                        }/${conversationList.conversations.length - index - 1
                        }`
                        : `/chat/${user.username}/${moduleIds.courseId}/${moduleIds.moduleId
                        }/${conversationList.conversations.length - index - 1
                        }`;
                      return conversation.isDeleted && !viewUser ? (
                        <div key={index}></div>
                      ) : (
                        <TooltipProvider key={index}>
                          <Card className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between gap-4">
                                {/* Conversation Info */}
                                <Link
                                  to={link}
                                  className="flex-1 min-w-0 no-underline group"
                                >
                                  <div className="space-y-1">
                                    <p className="text-2xl font-semibold text-foreground 
                                    group-hover:text-primary dark:group-hover:text-gold 
                                    colorful-dark:group-hover:text-gold transition-colors truncate-text no-underline">
                                      {conversation.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1 no-underline">
                                      <Clock className="h-3 w-3" />
                                      {t("chat.created")}: {time}
                                    </p>
                                  </div>
                                </Link>

                                {/* Actions */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {viewUser ? (
                                    <>
                                      {conversation.isDeleted && (
                                        <Badge
                                          variant="destructive"
                                          className="flex items-center gap-1 pointer-events-none"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                          {t("chat.deleted")}
                                        </Badge>
                                      )}
                                      <Button
                                        size="sm"
                                        asChild
                                        variant="ghost"
                                        className="flex items-center gap-1 text-muted-foreground text-xs font-medium w-full p-2 hover:bg-primary hover:text-primary-foreground"
                                      >
                                        <Link
                                          to={link}
                                          className="flex items-center gap-1 no-underline"
                                        >
                                          <Eye className="h-3 w-3" />
                                          {t("chat.view")}
                                        </Link>
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                              setOpenUpdateConvoModal({
                                                open: false,
                                                deleteOpen: true,
                                                courseId: moduleIds.courseId,
                                                moduleId: moduleIds.moduleId,
                                                index:
                                                  conversationList.conversations
                                                    .length -
                                                  index -
                                                  1,
                                                name: conversation.name,
                                                isDeleted:
                                                  conversation.isDeleted,
                                                error: "",
                                              });
                                            }}
                                            className="h-6 w-6 p-0 text-muted-foreground hover:bg-destructive hover:text-primary-foreground"
                                            aria-label={t("chat.archiveConversation")}
                                          >
                                            <EyeOff className="h-3 w-3" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                          {t("chat.archiveConversationTooltip")}
                                        </TooltipContent>
                                      </Tooltip>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                              setOpenUpdateConvoModal({
                                                open: true,
                                                deleteOpen: false,
                                                courseId: moduleIds.courseId,
                                                moduleId: moduleIds.moduleId,
                                                index:
                                                  conversationList.conversations
                                                    .length -
                                                  index -
                                                  1,
                                                name: conversation.name,
                                                isDeleted:
                                                  conversation.isDeleted,
                                                error: "",
                                              });
                                            }}
                                            className="h-6 w-6 p-0 text-muted-foreground hover:text-primary hover:bg-primary hover:text-primary-foreground"
                                            aria-label={t("chat.renameConversation")}
                                          >
                                            <Edit className="h-3 w-3" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                          {t("chat.renameConversation")}
                                        </TooltipContent>
                                      </Tooltip>
                                      <Button
                                        size="sm"
                                        asChild
                                        className="text-xs font-medium"
                                      >
                                        <Link
                                          to={link}
                                          className="flex items-center gap-1 no-underline hover:bg-primary hover:text-primary-foreground"
                                        >
                                          <MessageSquare className="h-3 w-3" />
                                          {t("chat.chat")}
                                        </Link>
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </TooltipProvider>
                      );
                    })
                ) : (
                  <div className="text-center py-12">
                    {viewUser ? (
                      <div className="text-muted-foreground">
                        <MessageSquare className="mx-auto h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg mb-2">{t("errorMessage.noConversationsYet")}</p>
                        <p className="text-sm">
                          {t("errorMessage.noConversationsDescription")}
                        </p>
                      </div>
                    ) : (
                      <div className="text-muted-foreground">
                        <MessageSquare className="mx-auto h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg mb-4">{t("errorMessage.noConversationsYet")}</p>
                        <Button
                          onClick={handleNewConversation}
                          disabled={creatingConvo}
                          className="flex items-center gap-2"
                        >
                          {creatingConvo ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                          {t("chat.startConversation")}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <></>
            )}
          </div>
        </>
      )}
    </div>
  ) : (
    <div
      className="min-h-screen flex items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4">
        <Loader2
          className="h-8 w-8 animate-spin text-primary"
          aria-hidden="true"
        />
        <p className="text-muted-foreground">{t("loadingMessage.conversations")}</p>
      </div>
    </div>
  );
}
