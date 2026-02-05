import React, { useEffect, useState, useContext } from "react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import ChatSidebar from "./components/ChatSidebar";
import Get from "../../utility/Get";
import Post from "../../utility/Post";
import {
  getConversationList,
  postUpdateConversation,
  getConversation,
} from "../../utility/endpoints/ConversationEndpoints";
import { getCourse } from "../../utility/endpoints/CourseEndpoints";
import { getUserData } from "../../utility/endpoints/UserEndpoints";
import { UserContext } from "../../utility/context/UserContext";
import { AlertContext } from "../../utility/context/AlertContext";
import { CourseType, ModuleType } from "../../utility/types/CourseTypes";
import {
  ConversationListType,
  MessageType,
} from "../../utility/types/ConversationTypes";
import { UserType } from "../../utility/types/UserTypes";
import { useTranslation } from "../../hooks/useTranslation";
import { ChatContextType } from "./ChatContext";
import { DialogWrapper } from "../../components/ui-wrappers/DialogWrapper";
import { Button } from "../../components/ui/button";
import { Link } from "react-router-dom";

export default function ChatLayout(): JSX.Element {
  const { t } = useTranslation();
  const { user } = useContext(UserContext);
  const { setAlert } = useContext(AlertContext);
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams(); // { username, courseId, moduleId, conversationIndex }

  // Fallback for params if older routing is hit or params missing (though routing checks should prevent this)
  const username = params.username || location.pathname.split("/")[2];
  const courseId = params.courseId || location.pathname.split("/")[3];
  const moduleId = params.moduleId || location.pathname.split("/")[4];
  const conversationIndex =
    params.conversationIndex || location.pathname.split("/")[5];

  const [courseInfo, setCourseInfo] = useState<CourseType>();
  const [moduleInfo, setModuleInfo] = useState<ModuleType>();
  const [viewUser, setViewUser] = useState<UserType>();
  const [conversationList, setConversationList] =
    useState<ConversationListType>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [openUpdateConvoModal, setOpenUpdateConvoModal] = useState<{
    open: boolean;
    deleteOpen: boolean;
    courseId: string;
    moduleId: string;
    index: string;
    name: string;
    isDeleted: boolean;
    error: string;
  }>({
    open: false,
    deleteOpen: false,
    courseId: "",
    moduleId: "",
    index: "",
    name: "",
    isDeleted: false,
    error: "",
  });

  const [openErrorModal, setOpenErrorModal] = useState<{
    open: boolean;
    message: string;
  }>({
    open: false,
    message: "",
  });

  const instructor = process.env.REACT_APP_INSTRUCTOR
    ? process.env.REACT_APP_INSTRUCTOR
    : "PapyrusAIInstructors";
  const admin = process.env.REACT_APP_ADMIN
    ? process.env.REACT_APP_ADMIN
    : "PapyrusAIAdmin";

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const handleToggleSidebar = () => {
        setSidebarOpen(prev => !prev);
    };
    window.addEventListener("toggleSidebar", handleToggleSidebar);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("toggleSidebar", handleToggleSidebar);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    if (username && courseId && moduleId) {
      setIsLoading(true);

      // Load user data
      Get(getUserData(username), controller.signal).then((res) => {
        if (res?.status && res.status < 300) {
          if (res.data) {
            setViewUser(res.data);
          }
        } else if (res?.status === 401) {
          navigate("/login");
        } else {
          if (res === undefined) {
          } else {
            setAlert({
              message: t("errorMessage.userNotFound"),
              type: "error",
            });
            navigate("/");
          }
        }
      });


      // Load course data
      Get(getCourse(courseId), controller.signal).then((res) => {
        if (res && res.status && res.status < 300) {
          if (res.data) {
            setCourseInfo(res.data);
            setModuleInfo(
              res.data.modules.find((module: ModuleType) => module.id === moduleId)
            );
          }
        } else if (res && res.status === 401) {
          navigate("/login");
        } else {
          if (res) {
            setAlert({
              message: t("errorMessage.courseNotFound"),
              type: "error",
            });
            navigate("/");
          }
        }
      });

      // Load conversation list
      Get(
        getConversationList(courseId, moduleId),
        controller.signal
      ).then((res) => {
        if (res && res.status && res.status < 300) {
          if (res.data) {
            setConversationList(res.data);
          }
        }
        setIsLoading(false);
      });
    }

    return () => {
      controller.abort();
    };
  }, [username, courseId, moduleId, navigate, setAlert, t]);

  // Handlers for sidebar conversation actions
  function handleRenameConversation(
    cId: string,
    mId: string,
    index: string,
    name: string
  ) {
    setOpenUpdateConvoModal({
      open: true,
      deleteOpen: false,
      courseId: cId,
      moduleId: mId,
      index,
      name,
      isDeleted: false,
      error: "",
    });
  }

  function handleArchiveConversation(cId: string, mId: string, index: string) {
    setOpenUpdateConvoModal((prev) => ({
      ...prev,
      deleteOpen: true,
      courseId: cId,
      moduleId: mId,
      index: index,
      name: "", // Not needed for delete
    }));
  }

  function handleDownloadConversation(
    cId: string,
    mId: string,
    index: string
  ) {
    if (!courseInfo || !moduleInfo || !viewUser || !user) return;

    const controller = new AbortController();

    Get(
      getConversation(cId, mId, index, viewUser.username),
      controller.signal
    ).then((res: any) => {
      if (res && res.status && res.status < 300) {
        if (res.data && res.data.messages) {
          const conversationMessages = res.data.messages.sort(
            (a: MessageType, b: MessageType) =>
              parseInt(b.timestamp) - parseInt(a.timestamp)
          );
          const sortedMessages = conversationMessages.reverse();

          var fileData =
            courseInfo.name +
            "\n" +
            moduleInfo.name +
            "\n" +
            courseInfo.instructor.name +
            " " +
            courseInfo.instructor.family_name +
            "\n";
          if (user) {
            fileData += "User: " + user.email + "\n";
          }
          const isInstructor =
            user &&
            (user.groups.includes(admin) || user.groups.includes(instructor));
          sortedMessages.forEach((message: MessageType, idx: number) => {
            if (
              !moduleInfo.showInitialPrompt &&
              idx === 0 &&
              !isInstructor
            ) {
            } else if (
              message.userVisible !== undefined &&
              !message.userVisible &&
              !isInstructor
            ) {
            } else {
              var dateTime = new Date(
                parseInt(message.id.substring(0, 13), 10)
              ).toLocaleString();
              var sender =
                message.sender === "ChatGPT"
                  ? "Papyrus"
                  : viewUser.name + " " + viewUser.family_name;
              fileData +=
                sender + " - " + dateTime + "\n" + message.content + "\n\n";
            }
          });
          const blob = new Blob([fileData], { type: "text/plain" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.download = `${courseInfo.name}_${moduleInfo.name}_${user?.email}_conversation${index}.txt`;
          link.href = url;
          link.click();
        }
      } else if (res && res.status === 401) {
        navigate("/login");
      } else {
        setOpenErrorModal({
          open: true,
          message: t("errorMessage.downloadConversation"),
        });
      }
    });
  }

  function handleConverstionNameDeleteUpdate(convoUpdateObject: {
    open: boolean;
    courseId: string;
    moduleId: string;
    index: string;
    name: string;
    isDeleted: boolean;
    error: string;
  }) {
    if (convoUpdateObject.isDeleted) {
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
             // If the current conversation was deleted, navigate away or something
            //  But since we are in layout, we just update the list.
            // Check if we are currently viewing the deleted conversation
            if (conversationIndex === convoUpdateObject.index){
               navigate(`/chat/${username}/${courseId}/${moduleId}/new`);
            }

            setOpenUpdateConvoModal({
              open: false,
              deleteOpen: false,
              courseId: "",
              moduleId: "",
              index: "",
              name: "",
              isDeleted: false,
              error: "",
            });
             // Update conversation list
             setConversationList(prev => {
                if(!prev) return prev;
                 const newConvos = [...prev.conversations];
                 if(newConvos[parseInt(convoUpdateObject.index)]){
                    newConvos[parseInt(convoUpdateObject.index)].isDeleted = true;
                 }
                 return {...prev, conversations: newConvos}
             })


              Get(getConversationList(convoUpdateObject.courseId, convoUpdateObject.moduleId)).then(resList => {
                 if(resList?.data) setConversationList(resList.data);
              });
          }
        } else if (res && res.status === 401) {
          navigate("/login");
        } else {
          setOpenErrorModal({
            open: true,
            message: `${t("errorMessage.genericError")}`,
          });
        }
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
              setConversationList(res.data);
              setOpenUpdateConvoModal({
                open: false,
                deleteOpen: false,
                courseId: "",
                moduleId: "",
                index: "",
                name: "",
                isDeleted: false,
                error: "",
              });
            }
          } else if (res && res.status === 401) {
            navigate("/login");
          } else {
            setOpenErrorModal({
              open: true,
              message: `${t("errorMessage.genericError")}`,
            });
          }
        });
      }
    }
  }

   function handleNewConversation() {
      if (username && courseId && moduleId) {
        navigate(
          `/chat/${username}/${courseId}/${moduleId}/new`
        );
        if (window.innerWidth < 1024) setSidebarOpen(false);
      }
    }

  const contextValue: ChatContextType = {
    courseInfo,
    moduleInfo,
    conversationList,
    setConversationList,
    viewUser,
    user,
    instructor,
    admin,
  };

  return (
    <div className="flex bg-background text-foreground">
      {/* Error Modal */}
      <DialogWrapper
        open={openErrorModal.open}
        onOpenChange={(open) =>
          setOpenErrorModal({
            open,
            message: open ? openErrorModal.message : "",
          })
        }
        title={t("errorMessage.ranIntoError")}
        description={openErrorModal.message}
        contentClassName="sm:max-w-md"
        footerClassName="flex-col gap-2 sm:flex-row"
        actions={[
          {
            label: t("common.close"),
            onClick: () => setOpenErrorModal({ open: false, message: "" }),
            variant: "outline",
          },
        ]}
      >
        <Button
          asChild
          onClick={() => setOpenErrorModal({ open: false, message: "" })}
        >
          <Link
            to={`/courses/${courseId}/modules/${moduleId}`}
            className="no-underline"
          >
            {t("chat.backToConvoList")}
          </Link>
        </Button>
      </DialogWrapper>

       {/* Delete Conversation Modal */}
       <DialogWrapper
        open={openUpdateConvoModal.deleteOpen}
        onOpenChange={(open) => setOpenUpdateConvoModal((prev) => ({ ...prev, deleteOpen: open }))}
        title={t("chat.archiveConversationQuestion")}
        description={t("chat.archiveConversationDescription")}
        contentClassName="sm:max-w-md"
        footerClassName="flex-col gap-2 sm:flex-row"
        actions={[
          {
            label: `${t("common.cancel")}`,
            onClick: () =>
              setOpenUpdateConvoModal((prev) => ({
                ...prev,
                deleteOpen: false,
              })),
            variant: "outline",
          },
          {
            label: t("chat.archiveConversation"),
            onClick: () =>
              handleConverstionNameDeleteUpdate({
                ...openUpdateConvoModal,
                isDeleted: true,
              }),
            variant: "destructive",
          },
        ]}
      />

      {/* Rename Conversation Modal */}
      <DialogWrapper
        open={openUpdateConvoModal.open}
        onOpenChange={(open) => setOpenUpdateConvoModal((prev) => ({ ...prev, open }))}
        title={t("chat.renameConversation")}
        contentClassName="sm:max-w-md"
        actions={[
          {
            label: `${t("common.cancel")}`,
            onClick: () => setOpenUpdateConvoModal((prev) => ({ ...prev, open: false })),
            variant: "outline",
          },
          {
            label: t("chat.submit"),
            onClick: () => handleConverstionNameDeleteUpdate(openUpdateConvoModal),
          },
        ]}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <React.Fragment>
            <label htmlFor="conversation-name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{t("chat.conversationName")}</label>
            <input
              id="conversation-name"
              name="name"
              value={openUpdateConvoModal.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setOpenUpdateConvoModal((prev) => ({
                  ...prev,
                  name: e.target.value,
                }));
              }}
              className={`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${openUpdateConvoModal.error ? "border-destructive" : ""}`}
              disabled={isLoading}
              autoFocus
            />
            {openUpdateConvoModal.error && <p className="text-sm text-destructive">{openUpdateConvoModal.error}</p>}
            </React.Fragment>
          </div>
        </div>
      </DialogWrapper>


      {/* Main Content Area */}
      <Outlet context={contextValue} />

      {courseInfo && moduleInfo ? (
        <ChatSidebar
          courseInfo={courseInfo}
          moduleInfo={moduleInfo}
          user={user}
          viewUser={viewUser}
          conversationList={conversationList}
          currentConversationIndex={conversationIndex}
          searchTerm={searchTerm}
          isOpen={sidebarOpen}
          isMobile={window.innerWidth < 1024}
          onSearchChange={setSearchTerm}
          onNewConversation={handleNewConversation}
          onConversationClick={(link) => {
            navigate(link);
            if (window.innerWidth < 1024) setSidebarOpen(false);
          }}
          onRenameConversation={handleRenameConversation}
          onArchiveConversation={handleArchiveConversation}
          onDownloadConversation={handleDownloadConversation}
          onClose={() => setSidebarOpen(false)}
        />
      ) : (
          <div className="hidden lg:flex w-80 border-l border-border bg-card" style={{ height: "calc(100vh - 4rem)" }}></div>
      )}

    </div>
  );
}
