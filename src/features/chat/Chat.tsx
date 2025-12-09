import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useContext,
} from "react";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { DialogWrapper } from "../../components/ui-wrappers/DialogWrapper";
import { useLocation, useNavigate, Link } from "react-router-dom";
import Get from "../../utility/Get";
import {
  getConversation,
  getConversationList,
  getConversationClassification,
  postAutoCreateConvoName,
  postCreateConversation,
  postUpdateConversation,
} from "../../utility/endpoints/ConversationEndpoints";
import { getCourse } from "../../utility/endpoints/CourseEndpoints";
import {
  ConversationListType,
  MessageType,
  StreamMessageType,
} from "../../utility/types/ConversationTypes";
import { CourseType, ModuleType } from "../../utility/types/CourseTypes";
import { AlertContext } from "../../utility/context/AlertContext";
import { UserContext } from "../../utility/context/UserContext";
import { UserType } from "../../utility/types/UserTypes";
import { getUserData } from "../../utility/endpoints/UserEndpoints";
import DocumentModal from "./DocumentModal";
import Post from "../../utility/Post";
import SpeechToTextModal from "./SpeechToTextModal";

// Import new components
import ChatHeader from "./components/ChatHeader";
import ChatMessages from "./components/ChatMessages";
import ChatInput from "./components/ChatInput";
import ChatSidebar from "./components/ChatSidebar";

export default function Chat(): JSX.Element {
  const location = useLocation();
  let navigator = useNavigate();
  const [conversationIds, setConversationIds] = useState<{
    courseId: string;
    moduleId: string;
    conversationIndex: string;
  }>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const socket = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Array<MessageType>>([]);
  const messagesRef = useRef<Array<MessageType>>();
  messagesRef.current = messages;
  const currentStreamIdRef = useRef<string | null>(null);
  const [courseInfo, setCourseInfo] = useState<CourseType>();
  const [moduleInfo, setModuleInfo] = useState<ModuleType>();
  const [selectedPrompt, setSelectedPrompt] = useState<string | undefined>();
  const [repeatingPrompts, setRepeatingPrompts] = useState<Array<string>>([]);
  const { setAlert } = useContext(AlertContext);
  const { user } = useContext(UserContext);
  const [viewUser, setViewUser] = useState<UserType>();
  const [showTypingIndicator, setShowTypingIndicator] =
    useState<boolean>(false);
  const [showWizard, setShowWizard] = useState(false);
  const [chatError, setChatError] = useState<string | undefined>();
  const [conversationList, setConversationList] =
    useState<ConversationListType>();
  const [creatingConvo, setCreatingConvo] = useState<boolean>(false);
  const [messageNote, setMessageNote] = useState<string>();
  const [openUpdateConvoModal, setOpenUpdateConvoModal] = useState<{
    //used for autonaming also
    open: boolean;
    deleteOpen: boolean;
    courseId: string;
    moduleId: string;
    index: string;
    name: string;
    isDeleted: boolean;
    completed: boolean;
    error: string;
  }>({
    open: false,
    deleteOpen: false,
    courseId: "",
    moduleId: "",
    index: "",
    name: "",
    isDeleted: false,
    completed: false,
    error: "",
  });
  const [openDocumentModal, setOpenDocumentModal] = useState<boolean>(false);
  const [openSpeechToTextModal, setOpenSpeechToTextModal] =
    useState<boolean>(false);
  const [openErrorModal, setOpenErrorModal] = useState<{
    open: boolean;
    message: string;
  }>({
    open: false,
    message: "",
  });
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const instructor = process.env.REACT_APP_INSTRUCTOR
    ? process.env.REACT_APP_INSTRUCTOR
    : "PapyrusAIInstructors";
  const admin = process.env.REACT_APP_ADMIN
    ? process.env.REACT_APP_ADMIN
    : "PapyrusAIAdmin";

  useEffect(() => {
    setAlert({ message: "", type: "info" });

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      socket.current?.close();
      setShowTypingIndicator(false);
      window.removeEventListener("resize", handleResize);
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    if (
      location.pathname.split("/") &&
      location.pathname.split("/")[2] &&
      location.pathname.split("/")[3] &&
      location.pathname.split("/")[4] &&
      location.pathname.split("/")[5]
    ) {
      setConversationIds({
        courseId: location.pathname.split("/")[3],
        moduleId: location.pathname.split("/")[4],
        conversationIndex: location.pathname.split("/")[5],
      });
      setIsLoading(true);

      // Load user data
      Get(getUserData(location.pathname.split("/")[2]), controller.signal).then(
        (res) => {
          if (res && res.status && res.status < 300) {
            if (res.data) {
              setViewUser(res.data);
              if (user && user.username === res.data.username) {
                onConnect(
                  location.pathname.split("/")[3],
                  location.pathname.split("/")[4],
                  location.pathname.split("/")[5]
                );
              }
            }
          } else if (res && res.status === 401) {
            navigator("/login");
          } else {
            if (res === undefined) {
            } else {
              setAlert({ message: "Could not find user", type: "error" });
              navigator("/");
            }
          }
        }
      );

      // Load course data
      Get(getCourse(location.pathname.split("/")[3]), controller.signal).then(
        (res) => {
          if (res && res.status && res.status < 300) {
            if (res.data) {
              setCourseInfo(res.data);
              setModuleInfo(
                res.data.modules.find(
                  (module: ModuleType) =>
                    module.id === location.pathname.split("/")[4]
                )
              );
            }
          } else if (res && res.status === 401) {
            navigator("/login");
          } else {
            if (res) {
              setAlert({ message: "Course not found", type: "error" });
              navigator("/");
            }
          }
        }
      );

      // Load conversation list
      Get(
        getConversationList(
          location.pathname.split("/")[3],
          location.pathname.split("/")[4]
        ),
        controller.signal
      ).then((res) => {
        if (res && res.status && res.status < 300) {
          if (res.data) {
            setConversationList(res.data);
          }
        }
      });

      // Load conversation
      Get(
        getConversation(
          location.pathname.split("/")[3],
          location.pathname.split("/")[4],
          location.pathname.split("/")[5],
          location.pathname.split("/")[2]
        ),
        controller.signal
      ).then((res: any) => {
        if (res && res.status && res.status < 300) {
          if (res.data && res.data.messages) {
            if (res.data.messages.length > 0) {
              setSelectedPrompt("");
            }
            var sortedMessages = res.data.messages.sort(
              (a: MessageType, b: MessageType) =>
                parseInt(b.timestamp) - parseInt(a.timestamp)
            );
            var contextCounter = 0;
            var reverse = sortedMessages.map((message: MessageType) => {
              contextCounter += num_tokens_from_messages([message]);
              if (contextCounter < 64000) {
                message["inContext"] = false;
              } else {
                message["inContext"] = true;
              }
              return message;
            });
            setMessages(reverse.reverse());
          }
          if (res.data && res.data.name) {
            setOpenUpdateConvoModal({
              open: false,
              deleteOpen: false,
              courseId: location.pathname.split("/")[3],
              moduleId: location.pathname.split("/")[4],
              index: location.pathname.split("/")[5],
              name: res.data.name,
              isDeleted: res.data.isDeleted,
              completed: res.data.completed ? res.data.completed : false,
              error: "",
            });
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          if (res && res.status === 400) {
            setAlert({ message: "Conversation not found", type: "error" });
            navigator(
              `/courses/${location.pathname.split("/")[3]}/modules/${
                location.pathname.split("/")[4]
              }`
            );
          }
        }
        setIsLoading(false);
      });
    } else {
      navigator("/courses");
    }

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line
  }, [location]);

  useEffect(() => {
    if (moduleInfo && moduleInfo.prompts && moduleInfo.prompts.length < 1) {
      setSelectedPrompt("");
    }
  }, [moduleInfo, repeatingPrompts, selectedPrompt, messages]);

  useEffect(() => {
    if (
      moduleInfo &&
      moduleInfo.raterEnabled !== undefined &&
      moduleInfo.raterEnabled
    ) {
      setShowWizard(false);
    } else {
      var visibleMessages = messages.filter(
        (m) => m.userVisible !== undefined && m.userVisible
      );
      if (
        viewUser &&
        user &&
        user.username === viewUser.username &&
        moduleInfo &&
        (moduleInfo.raterEnabled === undefined || !moduleInfo.raterEnabled) &&
        visibleMessages.length < 1 &&
        moduleInfo.prompts.length !== 0
      ) {
        setShowWizard(true);
      } else {
        setShowWizard(false);
      }
    }
  }, [viewUser, user, moduleInfo, messages]);

  // WebSocket functions
  function ping() {
    if (isConnected) {
      setTimeout(() => {
        socket.current?.send(JSON.stringify({ action: "pong" }));
        ping();
      }, 120000);
    }
  }

  useEffect(() => {
    if (isConnected) {
      ping();
    }
    // eslint-disable-next-line
  }, [isConnected]);

  const onSocketOpen = useCallback(() => {
    setIsConnected(true);
  }, []);

  const onSocketClose = useCallback(() => {
    setIsConnected(false);
    if (user && viewUser && user.username === viewUser.username) {
      onConnect(
        location.pathname.split("/")[3],
        location.pathname.split("/")[4],
        location.pathname.split("/")[5]
      );
    }
    // eslint-disable-next-line
  }, [location.pathname, user, viewUser]);

  const onSocketMessage = useCallback((dataStr: string) => {
    const returnData = JSON.parse(dataStr);
    setShowTypingIndicator(false);
    if (returnData.essay && returnData.status < 300 && returnData.rater) {
      const tempTimestamp = Date.now();
      const essayTempId =
        tempTimestamp + "" + Math.floor(100000 + Math.random() * 900000);
      const messageTempId = (Number(essayTempId) + 1).toString();
      var essayMessage: MessageType = {
        id: essayTempId,
        content: "View your essay feedback by clicking on this message.",
        messageType: "text",
        role: "assistant",
        sender: "ChatGPT",
        timestamp: tempTimestamp.toString(),
        promptId: null,
        userVisible: true,
        raterReference: "",
        expandableMessage: JSON.stringify(returnData.rater),
      };
      var essayResponseMessage: MessageType = {
        id: messageTempId,
        content: returnData.data,
        messageType: "text",
        role: "assistant",
        sender: "ChatGPT",
        timestamp: tempTimestamp.toString(),
        promptId: null,
        userVisible: true,
        raterReference: "",
        expandableMessage: "",
      };
      setMessages((prev) => [...prev, essayMessage, essayResponseMessage]);
      setShowWizard(false);
    } else if (returnData.status < 300) {
      const returnMessage: StreamMessageType = JSON.parse(returnData.data);
      if (returnMessage.message === null && returnMessage.note) {
        setMessageNote(returnMessage.note);
        setShowTypingIndicator(true);
      }
      if (
        returnMessage.messageType === "streamMessage" &&
        !returnMessage.finished
      ) {
        if (returnMessage.message !== null && !returnMessage.note) {
          setMessageNote(undefined);
        }

        // Check if this stream message belongs to the current streaming message
        const shouldAppendToExisting =
          currentStreamIdRef.current === returnMessage.id ||
          (messagesRef.current &&
            messagesRef.current.length > 0 &&
            messagesRef.current[messagesRef.current.length - 1].role ===
              "assistant" &&
            messagesRef.current[messagesRef.current.length - 1].stream &&
            messagesRef.current[messagesRef.current.length - 1].stream?.[0]
              .id === returnMessage.id);

        if (shouldAppendToExisting) {
          setMessages((prev) => {
            if (prev && messagesRef.current) {
              var temp = [...messagesRef.current];
              if (temp[temp.length - 1].stream) {
                temp[temp.length - 1].stream?.push(returnMessage);
                const stream = temp[temp.length - 1].stream || [];
                const filteredArray: StreamMessageType[] = stream.filter(
                  (obj, index, self) =>
                    index ===
                    self.findIndex(
                      (t) =>
                        t.timestamp === obj.timestamp &&
                        t.message === obj.message
                    )
                );
                const reconstructed = filteredArray
                  .sort((a, b) => a.timestamp - b.timestamp)
                  .map((m) => m.message)
                  .join("");
                temp[temp.length - 1].content =
                  reconstructed || temp[temp.length - 1].content;
              }
              return temp;
            } else return prev;
          });
        } else {
          if (returnMessage.message !== null && !returnMessage.note) {
            setMessageNote(undefined);
          }
          const tempTimestamp = Date.now();
          const messageTempId =
            tempTimestamp + "" + Math.floor(100000 + Math.random() * 900000);
          var responseMessage: MessageType = {
            id: messageTempId,
            content: returnMessage.message,
            messageType: "text",
            role: "assistant",
            sender: "ChatGPT",
            timestamp: tempTimestamp.toString(),
            promptId: null,
            userVisible: true,
            raterReference: "",
            expandableMessage: "",
            stream: [returnMessage],
          };
          // Track this stream ID to prevent duplicates
          currentStreamIdRef.current = returnMessage.id;
          setMessages((prev) => [...prev, responseMessage]);
        }
      } else if (
        returnMessage.finished &&
        returnMessage.messageType === "finalMessage"
      ) {
        // Clear the stream ID when finished
        currentStreamIdRef.current = null;
        setMessages((prev) => {
          if (prev && messagesRef.current) {
            var temp = [...messagesRef.current];
            temp[temp.length - 1].content = returnMessage.message;
            if (returnMessage.sources && returnMessage.sources.sources) {
              temp[temp.length - 1].sources = returnMessage.sources.sources;
            }
            return temp;
          } else return prev;
        });
      }
    } else {
      setOpenErrorModal({ open: true, message: returnData.data });
      if (returnData.status === 400) {
        setOpenUpdateConvoModal((prev) => ({ ...prev, completed: true }));
      }
    }
  }, []);

  const onConnect = useCallback(
    (courseId: string, moduleId: string, conversationIndex: string) => {
      if (
        socket.current?.readyState !== WebSocket.OPEN &&
        process.env.REACT_APP_WEBSOCKET_URL
      ) {
        var URL = process.env.REACT_APP_WEBSOCKET_URL;
        URL = URL + `?token=${localStorage.getItem("papyrusai_access_token")}`;
        URL =
          URL +
          `&courseId=${courseId}&moduleId=${moduleId}&index=${conversationIndex}&organization=${process.env.REACT_APP_ORGANIZATION}`;
        socket.current = new WebSocket(URL);
        socket.current.addEventListener("open", onSocketOpen);
        socket.current.addEventListener("close", onSocketClose);
        socket.current.addEventListener("message", (event) => {
          onSocketMessage(event.data);
        });
      }
    },
    [onSocketClose, onSocketMessage, onSocketOpen]
  );

  const onSendMessage = useCallback(
    (messageList: Array<MessageType>, autoCreateConvoName: any) => {
      setChatError(undefined);
      if (messages && isConnected) {
        var messagesToSend: Array<{ role: string; content: string }> = [];
        messageList.map((message) => {
          if (message.content.length > 100000) {
            setChatError("Message Too Long");
            return "";
          } else {
            const tempTimestamp = Date.now();
            const messageTempId =
              tempTimestamp + "" + Math.floor(100000 + Math.random() * 900000);
            var responseMessage: MessageType = {
              id: tempTimestamp.toString(),
              content: message.content,
              messageType: message.content.length < 1000 ? "text" : "file",
              role: "user",
              sender: "username",
              timestamp: messageTempId,
              promptId: message.promptId,
            };
            setMessages((prev) => [...prev, responseMessage]);
            messagesToSend.push({
              role: "user",
              content: message.content,
            });
            return "";
          }
        });

        socket.current?.send(
          JSON.stringify({
            action: "sendMessage",
            messages: messagesToSend,
            organization: process.env.REACT_APP_ORGANIZATION
              ? process.env.REACT_APP_ORGANIZATION
              : "UCI",
          })
        );
        setShowTypingIndicator(true);
        if (
          messages
            .concat(messageList)
            .filter(
              (m) =>
                (m.promptId === null || m.promptId === "") &&
                m.role === "user" &&
                m.userVisible
            ).length === 1
        ) {
          autoCreateConvoName(messagesToSend);
        }
      } else {
        setOpenErrorModal({
          open: true,
          message: "Something went wrong. Please try again",
        });
      }
    },
    [messages, isConnected]
  );

  const onSendEssay = useCallback(
    (essay: string, message?: string) => {
      setChatError(undefined);
      if (isConnected) {
        if (essay.length > 100000) {
          setChatError("Essay Too Long to Evaluate");
        } else if (essay.length < 750) {
          setChatError("Essay Too Short to Evaluate");
        } else {
          var sendEssay: any = {
            action: "raterEssay",
            essay: essay,
            organization: process.env.REACT_APP_ORGANIZATION
              ? process.env.REACT_APP_ORGANIZATION
              : "UCI",
          };
          if (message) {
            sendEssay["message"] = message;
          }
          socket.current?.send(JSON.stringify(sendEssay));
        }
        setShowTypingIndicator(true);
      } else {
        setOpenErrorModal({
          open: true,
          message: "Something went wrong. Please try again",
        });
      }
    },
    [isConnected]
  );

  function num_tokens_from_messages(messages: Array<any>) {
    var num_tokens = 0;
    messages.forEach((message) => {
      num_tokens = num_tokens + Math.ceil(message["content"].length / 4);
    });
    return num_tokens;
  }

  // Event handlers
  function handleSubmit(message: string) {
    setIsLoading(true);
    setChatError(undefined);
    if (message.length < 100000 && message.length > 0) {
      const tempTimestamp = Date.now();
      const messageTempId =
        tempTimestamp + "" + Math.floor(100000 + Math.random() * 900000);
      var responseMessage: MessageType = {
        id: tempTimestamp.toString(),
        content: message,
        messageType: message.length < 1000 ? "text" : "file",
        role: "user",
        sender: "username",
        timestamp: messageTempId,
        promptId: null,
        userVisible: true,
      };
      onSendMessage([responseMessage], autoCreateConvoName);
    } else if (message.length < 1) {
      setChatError("Message Too Short");
    } else {
      setChatError("Message Too Long");
    }
    setIsLoading(false);
  }

  function autoCreateConvoName(
    messages: Array<{ role: string; content: string }>
  ) {
    if (user) {
      //set a timeout so that we aren't updating the same conversation
      // on the backend at the same time and overwritting
      setTimeout(() => {
        Post(
          postAutoCreateConvoName(
            openUpdateConvoModal.courseId,
            openUpdateConvoModal.moduleId,
            openUpdateConvoModal.index.toString(),
            user?.username
          ),
          { messages: messages }
        ).then((res) => {
          if (res && res.status && res.status < 300) {
            if (res.data) {
              //update conversation list with new convo name
              setConversationList((prev) => {
                if (prev) {
                  var convos = prev.conversations;
                  const index = parseInt(
                    conversationIds ? conversationIds.conversationIndex : ""
                  );
                  convos[index].name = res.data.conversations[index].name;
                  return { ...prev, conversations: convos };
                } else return prev;
              });
              setOpenUpdateConvoModal({
                open: false,
                deleteOpen: false,
                courseId: location.pathname.split("/")[3],
                moduleId: location.pathname.split("/")[4],
                index: location.pathname.split("/")[5],
                name: res.data.conversations[location.pathname.split("/")[5]]
                  .name,
                isDeleted:
                  res.data.conversations[location.pathname.split("/")[5]]
                    .isDeleted,
                completed: res.data.conversations[
                  location.pathname.split("/")[5]
                ].completed
                  ? res.data.conversations[location.pathname.split("/")[5]]
                      .completed
                  : false,
                error: "",
              });
            }
          } else if (res && res.status === 401) {
            navigator("/login");
          } else {
            setOpenErrorModal({
              open: true,
              message: "Something went wrong. Try again later",
            });
          }
        });
      }, 15000);
    }
  }

  function handleWizardReturnPrompts(selectedPrompt: string) {
    setSelectedPrompt(selectedPrompt);
    setRepeatingPrompts([selectedPrompt]);
    if (courseInfo && moduleInfo) {
      var messagesToSend = [];
      if (moduleInfo.prompts.length !== 0) {
        const actualPrompt = moduleInfo.prompts.filter(
          (x) => x.id === selectedPrompt
        );
        const tempTimestamp = Date.now();
        const messageTempId =
          tempTimestamp + "" + Math.floor(100000 + Math.random() * 900000);
        var responseMessage: MessageType = {
          id: tempTimestamp.toString(),
          content:
            actualPrompt && actualPrompt.length > 0
              ? actualPrompt[0].prompt
              : "",
          messageType:
            (actualPrompt && actualPrompt.length > 0
              ? actualPrompt[0].prompt
              : ""
            ).length < 1000
              ? "text"
              : "file",
          role: "user",
          sender: "username",
          timestamp: messageTempId,
          promptId: actualPrompt[0].id,
        };
        messagesToSend.unshift(responseMessage);
      }
      onSendMessage(messagesToSend, autoCreateConvoName);
    }
  }

  function handleWizardReturnEssay(essay: string, message?: string) {
    setIsLoading(true);
    setChatError(undefined);
    var actualPrompt;
    if (message && moduleInfo) {
      actualPrompt = moduleInfo.prompts.filter((x) => x.id === message);
    }
    if (essay.length < 100000 && essay.length > 150) {
      onSendEssay(
        essay,
        actualPrompt && actualPrompt.length > 0 ? actualPrompt[0].prompt : ""
      );
      const tempTimestamp = Date.now();
      const messageTempId =
        tempTimestamp + "" + Math.floor(100000 + Math.random() * 900000);
      var responseMessage: MessageType = {
        id: tempTimestamp.toString(),
        content: essay,
        messageType: "file",
        role: "user",
        sender: user ? user.name : "You",
        timestamp: messageTempId,
        promptId: null,
        userVisible: true,
        raterReference: "",
        expandableMessage: "Loading...",
      };
      if (messages && message && moduleInfo && moduleInfo.showInitialPrompt) {
        const tempTimestamp2 = Date.now();
        const messageTempId2 =
          tempTimestamp + "" + Math.floor(100000 + Math.random() * 900000);
        var responseMessage2: MessageType = {
          id: tempTimestamp2.toString(),
          content:
            actualPrompt && actualPrompt.length > 0
              ? actualPrompt[0].prompt
              : "",
          messageType:
            (actualPrompt && actualPrompt.length > 0
              ? actualPrompt[0].prompt
              : ""
            ).length < 1000
              ? "text"
              : "file",
          role: "user",
          sender: user ? user.name : "You",
          timestamp: messageTempId2,
          promptId: actualPrompt ? actualPrompt[0].id : null,
          userVisible: moduleInfo?.showInitialPrompt ? true : false,
          raterReference: "",
          expandableMessage: "",
        };
        setMessages((prev) => [...prev, responseMessage2]);
      }
      if (messages) {
        setMessages((prev) => [...prev, responseMessage]);
      }
    } else if (essay.length <= 150) {
      setChatError("Message Too Short");
    } else {
      setChatError("Message Too Long");
    }
    setIsLoading(false);
  }

  function handleNewConversation() {
    if (conversationIds) {
      setCreatingConvo(true);
      Post(
        postCreateConversation(
          conversationIds.courseId,
          conversationIds.moduleId
        ),
        {}
      ).then((res) => {
        if (res && res.status && res.status < 300) {
          if (res.data) {
            setCreatingConvo(false);
            setConversationList(res.data);
            if (res.data.conversations) {
              navigator(
                `/chat/${user?.username}/${conversationIds.courseId}/${
                  conversationIds.moduleId
                }/${res.data.conversations.length - 1}`
              );
            }
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          setAlert({
            message: "Something went wrong. Try again later",
            type: "error",
          });
        }
        setCreatingConvo(false);
      });
    }
  }

  function downloadChat() {
    if (courseInfo && moduleInfo && messages && viewUser && conversationIds) {
      setIsLoading(true);
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
      messages.forEach((message, index) => {
        if (!moduleInfo.showInitialPrompt && index === 0 && !isInstructor) {
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
      link.download = `${courseInfo.name}_${moduleInfo.name}_${user?.email}_conversation${conversationIds.conversationIndex}.txt`;
      link.href = url;
      link.click();
      setIsLoading(false);
    }
  }

  function handleClassification() {
    // Frontend check: ensure user is admin
    if (
      !user?.groups.includes(process.env.REACT_APP_ADMIN ?? "PapyrusAIAdmin")
    ) {
      setAlert({
        message: "Only administrators can classify conversations.",
        type: "error",
      });
      return;
    }

    // Extract parameters directly from URL
    const pathParts = location.pathname.split("/");
    if (pathParts[3] && pathParts[4] && pathParts[5]) {
      const username = pathParts[2];
      const courseId = pathParts[3];
      const moduleId = pathParts[4];
      const conversationIndex = pathParts[5];

      setIsLoading(true);
      Get(
        getConversationClassification(
          courseId,
          moduleId,
          conversationIndex,
          username
        )
      ).then((res) => {
        if (res && res.status && res.status < 300) {
          if (res.data) {
            setAlert({
              message: "Classification completed successfully",
              type: "success",
            });
            // You can handle the classification data here if needed
            console.log("Classification result:", res.data);
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          setAlert({
            message: "Failed to classify conversation. Please try again later.",
            type: "error",
          });
        }
        setIsLoading(false);
      });
    }
  }

  function returnDocText(docText: string) {
    setOpenDocumentModal(false);
    if (docText.length < 100000 && docText.length > 0) {
      const tempTimestamp = Date.now();
      const messageTempId =
        tempTimestamp + "" + Math.floor(100000 + Math.random() * 900000);
      var responseMessage: MessageType = {
        id: tempTimestamp.toString(),
        content: docText,
        messageType: docText.length < 1000 ? "text" : "file",
        role: "user",
        sender: "username",
        timestamp: messageTempId,
        promptId: null,
      };
      onSendMessage([responseMessage], autoCreateConvoName);
    } else if (docText.length < 1) {
      setChatError("Document Too Short");
    } else {
      setChatError("Document Too Long");
    }
  }

  function returnSpeakingText(text: string) {
    setOpenSpeechToTextModal(false);
    if (text.length < 100000 && text.length > 0) {
      const tempTimestamp = Date.now();
      const messageTempId =
        tempTimestamp + "" + Math.floor(100000 + Math.random() * 900000);
      var responseMessage: MessageType = {
        id: tempTimestamp.toString(),
        content: text,
        messageType: text.length < 1000 ? "text" : "file",
        role: "user",
        sender: "username",
        timestamp: messageTempId,
        promptId: null,
      };
      onSendMessage([responseMessage], autoCreateConvoName);
    } else if (text.length < 1) {
      setChatError("Message Too Short");
    } else {
      setChatError("Message Too Long");
    }
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
            setOpenUpdateConvoModal({
              open: false,
              deleteOpen: false,
              courseId: location.pathname.split("/")[3],
              moduleId: location.pathname.split("/")[4],
              index: location.pathname.split("/")[5],
              name: res.data.conversations[location.pathname.split("/")[5]]
                .name,
              isDeleted:
                res.data.conversations[location.pathname.split("/")[5]]
                  .isDeleted,
              completed: res.data.conversations[location.pathname.split("/")[5]]
                .completed
                ? res.data.conversations[location.pathname.split("/")[5]]
                    .completed
                : false,
              error: "",
            });
            navigator(
              `/courses/${location.pathname.split("/")[3]}/modules/${
                location.pathname.split("/")[4]
              }`
            );
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          setOpenErrorModal({
            open: true,
            message: "Something went wrong. Try again later",
          });
        }
        setIsLoading(false);
      });
    } else {
      if (convoUpdateObject.name.length > 260) {
        setOpenUpdateConvoModal((prev) => ({
          ...prev,
          error: "Name is too long",
        }));
      } else if (convoUpdateObject.name.length === 0) {
        setOpenUpdateConvoModal((prev) => ({
          ...prev,
          error: "Name cannot be empty",
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
              setOpenUpdateConvoModal({
                open: false,
                deleteOpen: false,
                courseId: location.pathname.split("/")[3],
                moduleId: location.pathname.split("/")[4],
                index: location.pathname.split("/")[5],
                name: res.data.conversations[location.pathname.split("/")[5]]
                  .name,
                isDeleted:
                  res.data.conversations[location.pathname.split("/")[5]]
                    .isDeleted,
                completed: res.data.conversations[
                  location.pathname.split("/")[5]
                ].completed
                  ? res.data.conversations[location.pathname.split("/")[5]]
                      .completed
                  : false,
                error: "",
              });
            }
          } else if (res && res.status === 401) {
            navigator("/login");
          } else {
            setOpenErrorModal({
              open: true,
              message: "Something went wrong. Try again later",
            });
          }
          setIsLoading(false);
        });
      }
    }
  }

  const isChatInputVisible =
    isConnected &&
    user &&
    viewUser &&
    user.username === viewUser.username &&
    selectedPrompt !== undefined &&
    moduleInfo?.continuedInteraction &&
    !showWizard &&
    !openUpdateConvoModal.completed;

  return !isLoading && courseInfo && conversationIds && moduleInfo ? (
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
        title="We ran into an error!"
        description={openErrorModal.message}
        contentClassName="sm:max-w-md"
        footerClassName="flex-col gap-2 sm:flex-row"
        actions={[
          {
            label: "Close",
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
            to={`/courses/${courseInfo.id}/modules/${moduleInfo.id}`}
            className="no-underline"
          >
            Back to Conversation List
          </Link>
        </Button>
      </DialogWrapper>

      {/* Document Modal */}
      <DialogWrapper
        open={openDocumentModal}
        onOpenChange={setOpenDocumentModal}
        title="Document Upload"
        contentClassName="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        actions={[
          {
            label: "Cancel",
            onClick: () => setOpenDocumentModal(false),
            variant: "outline",
          },
        ]}
      >
        <DocumentModal returnDocText={returnDocText} />
      </DialogWrapper>

      {/* Speech to Text Modal */}
      <DialogWrapper
        open={openSpeechToTextModal}
        onOpenChange={setOpenSpeechToTextModal}
        title="Speech to Text"
        contentClassName="sm:max-w-md"
        actions={[
          {
            label: "Cancel",
            onClick: () => setOpenSpeechToTextModal(false),
            variant: "outline",
          },
        ]}
      >
        <SpeechToTextModal returnSpeechText={returnSpeakingText} />
      </DialogWrapper>

      {/* Delete Conversation Modal */}
      <DialogWrapper
        open={openUpdateConvoModal.deleteOpen}
        onOpenChange={(open) =>
          setOpenUpdateConvoModal((prev) => ({ ...prev, deleteOpen: open }))
        }
        title="Archive Conversation?"
        description="Are you sure you would like to archive this conversation? This conversation will no longer be visible in your conversation list. Instructors can still view archived conversations."
        contentClassName="sm:max-w-md"
        footerClassName="flex-col gap-2 sm:flex-row"
        actions={[
          {
            label: "Cancel",
            onClick: () =>
              setOpenUpdateConvoModal((prev) => ({
                ...prev,
                deleteOpen: false,
              })),
            variant: "outline",
          },
          {
            label: "Archive Conversation",
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
        onOpenChange={(open) =>
          setOpenUpdateConvoModal((prev) => ({ ...prev, open }))
        }
        title="Rename Conversation"
        contentClassName="sm:max-w-md"
        actions={[
          {
            label: "Cancel",
            onClick: () =>
              setOpenUpdateConvoModal((prev) => ({ ...prev, open: false })),
            variant: "outline",
          },
          {
            label: "Submit",
            onClick: () =>
              handleConverstionNameDeleteUpdate(openUpdateConvoModal),
            disabled: isLoading,
          },
        ]}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="conversation-name">Conversation Name</Label>
            <Input
              id="conversation-name"
              name="name"
              value={openUpdateConvoModal.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setOpenUpdateConvoModal((prev) => ({
                  ...prev,
                  name: e.target.value,
                }));
              }}
              className={openUpdateConvoModal.error ? "border-destructive" : ""}
              disabled={isLoading}
              autoFocus
            />
            {openUpdateConvoModal.error && (
              <p className="text-sm text-destructive">
                {openUpdateConvoModal.error}
              </p>
            )}
          </div>
        </div>
      </DialogWrapper>

      {/* Main Chat Area */}
      <div
        className="flex-1 flex flex-col min-w-0"
        style={sidebarOpen ? { height: "calc(100vh - 4rem)" } : {}}
      >
        {/* Chat Header */}
        <ChatHeader
          conversationName={openUpdateConvoModal.name || "Chat Title"}
          courseInfo={courseInfo}
          moduleInfo={moduleInfo}
          user={user}
          viewUser={viewUser}
          onRename={() =>
            setOpenUpdateConvoModal((prev) => ({
              ...prev,
              open: true,
            }))
          }
          onDownload={downloadChat}
          onClassification={handleClassification}
          onHide={() =>
            setOpenUpdateConvoModal((prev) => ({
              ...prev,
              deleteOpen: true,
            }))
          }
          onToggleSidebar={() => setSidebarOpen(true)}
          isMobile={window.innerWidth < 1024}
        />

        {/* Chat Messages */}
        <ChatMessages
          messages={messages}
          moduleInfo={moduleInfo}
          user={user}
          viewUser={viewUser}
          showWizard={showWizard}
          showTypingIndicator={showTypingIndicator}
          messageNote={messageNote}
          conversationCompleted={openUpdateConvoModal.completed}
          instructor={instructor}
          admin={admin}
          onWizardReturnPrompts={handleWizardReturnPrompts}
          onWizardReturnEssay={handleWizardReturnEssay}
          onBackToConversationList={() =>
            navigator(`/courses/${courseInfo.id}/modules/${moduleInfo.id}`)
          }
        />

        {/* Chat Input */}
        {isChatInputVisible && (
          <ChatInput
            isConnected={isConnected}
            isLoading={isLoading}
            chatError={chatError}
            onSubmit={handleSubmit}
            onOpenDocumentModal={() => setOpenDocumentModal(true)}
            onOpenSpeechToTextModal={() => setOpenSpeechToTextModal(true)}
          />
        )}
      </div>

      {/* Chat Sidebar */}
      <ChatSidebar
        courseInfo={courseInfo}
        moduleInfo={moduleInfo}
        user={user}
        conversationList={conversationList}
        currentConversationIndex={conversationIds?.conversationIndex}
        searchTerm={searchTerm}
        creatingConvo={creatingConvo}
        isOpen={sidebarOpen}
        isMobile={window.innerWidth < 1024}
        onSearchChange={setSearchTerm}
        onNewConversation={handleNewConversation}
        onConversationClick={(link) => {
          navigator(link);
          if (window.innerWidth < 1024) setSidebarOpen(false);
        }}
        onClose={() => setSidebarOpen(false)}
      />
    </div>
  ) : (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground">Loading conversation...</p>
      </div>
    </div>
  );
}
