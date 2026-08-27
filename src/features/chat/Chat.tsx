import { useEffect, useState, useCallback, useRef, useContext } from "react";
import { DialogWrapper } from "../../components/ui-wrappers/DialogWrapper";
import { useLocation, useNavigate, useOutletContext, useParams } from "react-router-dom";
import Get from "../../utility/Get";
import {
  getConversation,
  postAutoCreateConvoName,
  postCreateConversation,
} from "../../utility/endpoints/ConversationEndpoints";
import { MessageType, StreamMessageType } from "../../utility/types/ConversationTypes";
import { GradeScore } from "../../utility/types/CourseTypes";
import { AlertContext } from "../../utility/context/AlertContext";
import { UserContext } from "../../utility/context/UserContext";
import DocumentModal from "./DocumentModal";
import Post from "../../utility/Post";
import SpeechToTextModal from "./SpeechToTextModal";
import ChatHeader from "./components/ChatHeader";
import ChatMessages from "./components/ChatMessages";
import ChatInput from "./components/ChatInput";
import ReviewSummaryPanel from "./components/ReviewSummaryPanel";
import OralChatView from "./OralChatView";
import { useTranslation } from "../../hooks/useTranslation";
import { ChatContextType } from "./ChatContext";
import { logEvent } from "../../utility/endpoints/UserEndpoints";
import { downloadConversation } from "../../utility/chat/downloadConversation";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Loader2, Send, FileText, ArrowDown } from "lucide-react";

function num_tokens_from_messages(messages: Array<any>) {
  var num_tokens = 0;
  messages.forEach((message: any) => {
    num_tokens = num_tokens + Math.ceil(message["content"].length / 4);
  });
  return num_tokens;
}

export default function Chat(): JSX.Element {
  const { courseInfo, moduleInfo, conversationList, setConversationList, viewUser, instructor, admin, grades, gradesLoaded, refreshGrades } =
    useOutletContext<ChatContextType>();

  const { t } = useTranslation();
  const location = useLocation();
  const navigator = useNavigate();
  const params = useParams(); // { username, courseId, moduleId, conversationIndex }

  // Fallback if params are missing (shouldn't happen with new routing)
  const courseId = params.courseId || "";
  const moduleId = params.moduleId || "";
  const conversationIndex = params.conversationIndex || "";
  const username = params.username || "";

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const socket = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Array<MessageType>>([]);
  const messagesRef = useRef<Array<MessageType>>();
  messagesRef.current = messages;
  const currentStreamIdRef = useRef<string | null>(null);

  const [selectedPrompt, setSelectedPrompt] = useState<string | undefined>();
  const [repeatingPrompts, setRepeatingPrompts] = useState<Array<string>>([]);
  const { setAlert } = useContext(AlertContext);
  const { user } = useContext(UserContext);

  const [showTypingIndicator, setShowTypingIndicator] = useState<boolean>(false);
  const [showWizard, setShowWizard] = useState(false);
  const [chatError, setChatError] = useState<string | undefined>();
  const [messageNote, setMessageNote] = useState<string>();

  const [conversationCompleted, setConversationCompleted] = useState<boolean>(false);
  const [conversationIsDeleted, setConversationIsDeleted] = useState<boolean>(false);

  const [openDocumentModal, setOpenDocumentModal] = useState<boolean>(false);
  const [openSpeechToTextModal, setOpenSpeechToTextModal] = useState<boolean>(false);
  const [openErrorModal, setOpenErrorModal] = useState<{
    open: boolean;
    message: string;
  }>({
    open: false,
    message: "",
  });

  const [pendingMessageContent, setPendingMessageContent] = useState<string | null>(null);
  const [pendingPromptId, setPendingPromptId] = useState<string | null>(null);

  // Fix: Store the current event listener function to properly remove it
  const socketListenerRef = useRef<((event: MessageEvent) => void) | null>(null);

  // WebSocket retry state
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectParamsRef = useRef<{ cId: string; mId: string; idx: string } | null>(null);
  const onConnectRef = useRef<(cId: string, mId: string, idx: string) => void>(() => {});

  // Review module state
  const [gradeResult, setGradeResult] = useState<{ scores: GradeScore[]; totalScore: number; instructorNotes?: string } | null>(null);
  const [gradePending, setGradePending] = useState(false);
  const [chatScrolledUp, setChatScrolledUp] = useState(false);
  const scrollToBottomRef = useRef<(() => void) | null>(null);
  const [gradeError, setGradeError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openCompleteModal, setOpenCompleteModal] = useState(false);
  const [openViewRubricModal, setOpenViewRubricModal] = useState(false);
  const [essayText, setEssayText] = useState("");
  const [pendingEssay, setPendingEssay] = useState<string | null>(null);
  const [essayError, setEssayError] = useState("");

  // Derived values
  const isReviewModule = moduleInfo?.moduleType === "review";
  const chatPrefix = isReviewModule ? "review-chat" : "chat";
  const isEssayMode = isReviewModule && moduleInfo?.essaySubmission === true;
  const converseAfterComplete = moduleInfo?.converseAfterComplete === true;
  const showEssayWizard = isEssayMode && !messages.some(m => m.userVisible !== false) && !conversationCompleted && !isSubmitting;
  const chatBlocked = conversationCompleted && !converseAfterComplete;

  // Ref to avoid stale closure in onSendMessage
  const isReviewModuleRef = useRef(false);
  isReviewModuleRef.current = isReviewModule ?? false;


  useEffect(() => {
    //log page
    Post(logEvent(), {
      eventType: "view_page",
      metadata: {
        courseId: courseId,
        moduleId: moduleId,
        conversationIndex: conversationIndex,
        page: isReviewModule ? "review_chat" : "chat",
      },
    });
    // eslint-disable-next-line
  }, [conversationIndex]);

  useEffect(() => {
    if (moduleInfo && (
      moduleInfo.prompts.length < 1 ||
      (moduleInfo.moduleType === "review" && isEssayMode) ||
      (moduleInfo.moduleType === "review" && !isEssayMode && messages.some(m => m.userVisible !== false && m.role === "user"))
    )) {
      setSelectedPrompt("");
    }
  }, [moduleInfo, repeatingPrompts, selectedPrompt, messages, isEssayMode]);

  useEffect(() => {
    if (isEssayMode || (moduleInfo && moduleInfo.raterEnabled !== undefined && moduleInfo.raterEnabled)) {
      setShowWizard(false);
    } else {
      var visibleMessages = messages.filter((m) => m.userVisible !== undefined && m.userVisible);
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
  const ping = useCallback(() => {
    if (isConnected) {
      setTimeout(() => {
        socket.current?.send(JSON.stringify({ action: "pong" }));
        ping();
      }, 120000);
    }
  }, [isConnected]);

  useEffect(() => {
    if (isConnected) {
      ping();
    }
  }, [isConnected, ping]);

  const onSocketOpen = useCallback(() => {
    setIsConnected(true);
    retryCountRef.current = 0;
  }, []);

  const onSocketClose = useCallback(() => {
    setIsConnected(false);
    if (!connectParamsRef.current) return;
    const MAX_RETRIES = 5;
    if (retryCountRef.current >= MAX_RETRIES) return;
    const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
    retryCountRef.current += 1;
    retryTimeoutRef.current = setTimeout(() => {
      if (connectParamsRef.current) {
        const { cId, mId, idx } = connectParamsRef.current;
        onConnectRef.current(cId, mId, idx);
      }
    }, delay);
  }, []);

  const onSocketMessage = useCallback(
    (dataStr: string) => {
      const returnData = JSON.parse(dataStr);
      setShowTypingIndicator(false);

      // Review module: grade results and submission responses
      if (returnData.messageType === "gradeResult") {
        setGradeResult({ scores: returnData.data, totalScore: returnData.totalScore, instructorNotes: returnData.instructorNotes });
        setConversationCompleted(true);
        setConversationList((prev) => {
          if (!prev) return prev;
          const idx = prev.conversations.length - 1 - parseInt(conversationIndex);
          if (idx < 0) return prev;
          const convs = [...prev.conversations];
          convs[idx] = { ...convs[idx], completed: true };
          return { ...prev, conversations: convs };
        });
        setIsSubmitting(false);
        refreshGrades();
        return;
      }
      if (returnData.messageType === "submitted") {
        setGradePending(true);
        setConversationCompleted(true);
        setConversationList((prev) => {
          if (!prev) return prev;
          const idx = prev.conversations.length - 1 - parseInt(conversationIndex);
          if (idx < 0) return prev;
          const convs = [...prev.conversations];
          convs[idx] = { ...convs[idx], completed: true };
          return { ...prev, conversations: convs };
        });
        setIsSubmitting(false);
        return;
      }
      if (returnData.messageType === "gradeError") {
        setGradeError(t("reviewChat.gradingError"));
        setIsSubmitting(false);
        return;
      }

      if (returnData.essay && returnData.status < 300 && returnData.rater) {
        const tempTimestamp = Date.now();
        const essayTempId = tempTimestamp + "" + Math.floor(100000 + Math.random() * 900000);
        const messageTempId = (Number(essayTempId) + 1).toString();
        var essayMessage: MessageType = {
          id: essayTempId,
          content: t("chat.viewEssay"),
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
        if (returnMessage.messageType === "streamMessage" && !returnMessage.finished) {
          if (returnMessage.message !== null && !returnMessage.note) {
            setMessageNote(undefined);
          }

          // Check if this stream message belongs to the current streaming message
          const shouldAppendToExisting =
            currentStreamIdRef.current === returnMessage.id ||
            (messagesRef.current &&
              messagesRef.current.length > 0 &&
              messagesRef.current[messagesRef.current.length - 1].role === "assistant" &&
              messagesRef.current[messagesRef.current.length - 1].stream &&
              messagesRef.current[messagesRef.current.length - 1].stream?.[0].id === returnMessage.id);

          if (shouldAppendToExisting) {
            setMessages((prev) => {
              if (prev.length > 0) {
                var temp = [...prev];
                const lastMsg = temp[temp.length - 1];
                if (lastMsg.stream) {
                  lastMsg.stream.push(returnMessage);
                  const stream = lastMsg.stream || [];
                  const filteredArray: StreamMessageType[] = stream.filter(
                    (obj, index, self) =>
                      index === self.findIndex((t) => t.timestamp === obj.timestamp && t.message === obj.message),
                  );
                  const reconstructed = filteredArray
                    .sort((a, b) => a.timestamp - b.timestamp)
                    .map((m) => m.message)
                    .join("");
                  temp[temp.length - 1] = {
                    ...lastMsg,
                    content: reconstructed || lastMsg.content,
                    stream: stream,
                  };
                }
                return temp;
              } else return prev;
            });
          } else {
            if (returnMessage.message !== null && !returnMessage.note) {
              setMessageNote(undefined);
            }
            const tempTimestamp = Date.now();
            const messageTempId = tempTimestamp + "" + Math.floor(100000 + Math.random() * 900000);
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
        } else if (returnMessage.finished && returnMessage.messageType === "finalMessage") {
          // Clear the stream ID when finished
          currentStreamIdRef.current = null;
          setMessages((prev) => {
            if (prev.length > 0) {
              var temp = [...prev];
              const lastIndex = temp.length - 1;
              const lastMsg = temp[lastIndex];

              var newMsgSource = lastMsg.sources;
              if (returnMessage.sources && returnMessage.sources.sources) {
                newMsgSource = returnMessage.sources.sources;
              }

              temp[lastIndex] = {
                ...lastMsg,
                content: returnMessage.message,
                sources: newMsgSource,
                finished: true,
              };
              return temp;
            } else return prev;
          });
        }
      } else {
        setOpenErrorModal({ open: true, message: returnData.data });
        if (returnData.status === 400) {
          setConversationCompleted(true);
        }
      }
    },
    [t, refreshGrades],
  );

  const onConnect = useCallback(
    (cId: string, mId: string, idx: string) => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      if (process.env.REACT_APP_WEBSOCKET_URL) {
        if (
          socket.current &&
          (socket.current.readyState === WebSocket.OPEN || socket.current.readyState === WebSocket.CONNECTING)
        ) {
          closeSocket();
        }
        connectParamsRef.current = { cId, mId, idx };
        let sessionId = localStorage.getItem("sessionId") ?? "unknown";

        var URL = process.env.REACT_APP_WEBSOCKET_URL;
        URL = URL + `?token=${localStorage.getItem("papyrusai_access_token")}`;
        URL =
          URL +
          `&courseId=${cId}&moduleId=${mId}&index=${idx}&organization=${process.env.REACT_APP_ORGANIZATION}&sessionId=${sessionId}`;

        socket.current = new WebSocket(URL);
        socket.current.addEventListener("open", onSocketOpen);
        socket.current.addEventListener("close", onSocketClose);

        // Define the listener wrapper and store it ref
        const messageListener = (event: MessageEvent) => {
          onSocketMessage(event.data);
        };
        socketListenerRef.current = messageListener;
        socket.current.addEventListener("message", messageListener);
      }
    },
    [onSocketClose, onSocketMessage, onSocketOpen], // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    onConnectRef.current = onConnect;
  }, [onConnect]);

  const closeSocket = useCallback(() => {
    connectParamsRef.current = null;
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (socket.current) {
      socket.current.removeEventListener("open", onSocketOpen);
      socket.current.removeEventListener("close", onSocketClose);

      // Use the stored ref to remove the exact listener function
      if (socketListenerRef.current) {
        socket.current.removeEventListener("message", socketListenerRef.current);
        socketListenerRef.current = null;
      }

      if (socket.current.readyState === WebSocket.OPEN || socket.current.readyState === WebSocket.CONNECTING) {
        socket.current.close(1000, "Reconnecting with new port");
      }

      socket.current = null;
      setIsConnected(false);
    }
  }, [onSocketOpen, onSocketClose]);

  useEffect(() => {
    setAlert({ message: "", type: "info" });
    return () => {
      // Ensure socket is closed on unmount
      closeSocket();
      setShowTypingIndicator(false);
    };
    // eslint-disable-next-line
  }, [closeSocket, setAlert]);

  useEffect(() => {
    const controller = new AbortController();

    if (username && courseId && moduleId && conversationIndex) {
      setIsLoading(true);
      // Reset review state on conversation change
      setGradeResult(null);
      setGradePending(false);
      setGradeError(undefined);
      setIsSubmitting(false);
      setEssayText("");
      setEssayError("");
      setPendingEssay(null);

      if (user && user.username === username) {
        onConnect(courseId, moduleId, conversationIndex);
      }

      if (conversationIndex === "new") {
        setMessages([]);
        setSelectedPrompt("");
        setIsLoading(false);
        setConversationCompleted(false);
        setConversationIsDeleted(false);
      } else {
        Get(getConversation(courseId, moduleId, conversationIndex, username), controller.signal).then((res: any) => {
          if (res && res.status && res.status < 300) {
            if (res.data && res.data.messages) {
              if (res.data.messages.length > 0) {
                setSelectedPrompt("");
              }
              var sortedMessages = res.data.messages.sort(
                (a: MessageType, b: MessageType) => parseInt(b.timestamp) - parseInt(a.timestamp),
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
            if (res.data) {
              setConversationCompleted(res.data.completed ? res.data.completed : false);
              setConversationIsDeleted(res.data.isDeleted ? res.data.isDeleted : false);
            }
            if (location.state?.pendingEssay) {
              setPendingEssay(location.state.pendingEssay);
              window.history.replaceState({}, "");
            }
            if (location.state?.pendingMessageContent) {
              setPendingMessageContent(location.state.pendingMessageContent);
              setPendingPromptId(location.state.pendingPromptId || null);
              window.history.replaceState({}, "");
            }
          } else if (res && res.status === 401) {
            navigator("/login");
          } else {
            if (res && res.status === 400) {
              setAlert({ message: t("errorMessage.convoNotFound"), type: "error" });
              navigator(`/courses/${courseId}/modules/${moduleId}`);
            }
          }
          setIsLoading(false);
        });
      }
    }
    return () => {
      controller.abort();
      closeSocket();
    };
    // eslint-disable-next-line
  }, [
    conversationIndex,
    courseId,
    moduleId,
    username,
    location.state,
    onConnect,
    closeSocket,
    navigator,
    t,
    setAlert,
    setConversationList,
  ]);

  const onSendMessage = useCallback(
    (messageList: Array<MessageType>, autoCreateConvoName: any) => {
      setChatError(undefined);
      if (messages && isConnected) {
        var messagesToSend: Array<{ role: string; content: string }> = [];
        messageList.map((message) => {
          if (message.content.length > 100000) {
            setChatError(t("chat.messageTooLong"));
            return "";
          } else {
            const tempTimestamp = Date.now();
            const messageTempId = tempTimestamp + "" + Math.floor(100000 + Math.random() * 900000);
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

        let sessionId = localStorage.getItem("sessionId") ?? "unknown";

        if (isReviewModuleRef.current) {
          socket.current?.send(
            JSON.stringify({
              action: "reviewChat",
              messageType: "chat",
              messages: messagesToSend,
              organization: process.env.REACT_APP_ORGANIZATION ?? "",
              sessionId,
            }),
          );
        } else {
          socket.current?.send(
            JSON.stringify({
              action: "sendMessage",
              messages: messagesToSend,
              organization: process.env.REACT_APP_ORGANIZATION ? process.env.REACT_APP_ORGANIZATION : "UCI",
              sessionId: sessionId,
            }),
          );
        }

        setShowTypingIndicator(true);
        if (
          messages
            .concat(messageList)
            .filter((m) => (m.promptId === null || m.promptId === "") && m.role === "user" && m.userVisible).length ===
          1
        ) {
          autoCreateConvoName(messagesToSend);
        }
      } else {
        // Not connected yet — queue the first message; pendingMessageContent effect will send it once connected
        const firstMessage = messageList[0];
        if (firstMessage) {
          setPendingMessageContent(firstMessage.content);
          setPendingPromptId(firstMessage.promptId ?? null);
        }
      }
    },
    [messages, isConnected, t],
  );

  const onSendEssay = useCallback(
    (essay: string, message?: string) => {
      setChatError(undefined);
      if (isConnected) {
        if (essay.length > 100000) {
          setChatError(t("chat.messageTooLong"));
        } else if (essay.length < 750) {
          setChatError(t("chat.messageTooShort"));
        } else {
          let sessionId = localStorage.getItem("sessionId") ?? "unknown";
          var sendEssay: any = {
            action: "raterEssay",
            essay: essay,
            organization: process.env.REACT_APP_ORGANIZATION ? process.env.REACT_APP_ORGANIZATION : "UCI",
            sessionId: sessionId,
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
          message: t("errorMessage.genericError"),
        });
      }
    },
    [isConnected, t],
  );

  useEffect(() => {
    if (isConnected && pendingMessageContent && conversationIndex !== "new") {
      const tempTimestamp = Date.now();
      const messageTempId = tempTimestamp + "" + Math.floor(100000 + Math.random() * 900000);
      var responseMessage: MessageType = {
        id: tempTimestamp.toString(),
        content: pendingMessageContent,
        messageType: pendingMessageContent.length < 1000 ? "text" : "file",
        role: "user",
        sender: "username",
        timestamp: messageTempId,
        promptId: pendingPromptId,
        userVisible: true,
      };
      onSendMessage([responseMessage], autoCreateConvoName);
      setPendingMessageContent(null);
      setPendingPromptId(null);
    }
  }, [isConnected, pendingMessageContent, conversationIndex, pendingPromptId, onSendMessage]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isConnected || !pendingEssay || conversationIndex === "new") return;
    setIsSubmitting(true);
    markConversationCompleted();
    setEssayError("");
    const capturedEssayText = pendingEssay;
    const sessionId = localStorage.getItem("sessionId") ?? "unknown";
    const promptMessages = (moduleInfo?.prompts ?? [])
      .filter((p) => !p.isDeleted)
      .map((p) => ({ role: "user" as const, content: p.prompt }));
    socket.current?.send(JSON.stringify({
      action: "reviewChat",
      messageType: "essayDraft",
      essayContent: capturedEssayText,
      messages: promptMessages,
      organization: process.env.REACT_APP_ORGANIZATION ?? "",
      sessionId,
    }));
    const tempId = `${Date.now()}${Math.floor(Math.random() * 900000 + 100000)}`;
    setMessages(prev => [...prev, {
      id: tempId,
      content: capturedEssayText,
      messageType: "essayDraft",
      role: "user",
      sender: user?.username ?? "",
      timestamp: Date.now().toString(),
      promptId: null,
      userVisible: true,
    }]);
    setShowTypingIndicator(true);
    setPendingEssay(null);
  }, [isConnected, pendingEssay, conversationIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Event handlers
  function handleSubmit(message: string) {
    setIsLoading(true);
    setChatError(undefined);

    if (conversationIndex === "new") {
      if (message.length < 1 && message.length > 0) {
        setChatError(t("chat.messageTooShort"));
        setIsLoading(false);
        return;
      }
      // Create new conversation
      Post(postCreateConversation(courseId, moduleId), {}).then((res) => {
        if (res && res.status && res.status < 300) {
          if (res.data && res.data.conversations) {
            const newIndex = res.data.conversations.length - 1;

            // Update conversation list in Context
            setConversationList(res.data);

            // Navigate to the new conversation and pass the message in state
            navigator(`/${chatPrefix}/${user?.username}/${courseId}/${moduleId}/${newIndex}`, {
              state: { pendingMessageContent: message, pendingPromptId: null },
            });
          }
        } else {
          setAlert({ message: `${t("errorMessage.genericError")}`, type: "error" });
          setIsLoading(false);
        }
      });
    } else {
      if (message.length < 100000 && message.length > 0) {
        const tempTimestamp = Date.now();
        const messageTempId = tempTimestamp + "" + Math.floor(100000 + Math.random() * 900000);
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
        setChatError(t("chat.messageTooShort"));
      } else {
        setChatError(t("chat.messageTooLong"));
      }
      setIsLoading(false);
    }
  }

  function autoCreateConvoName(messages: Array<{ role: string; content: string }>) {
    if (user) {
      //set a timeout so that we aren't updating the same conversation
      // on the backend at the same time and overwritting
      setTimeout(() => {
        Post(postAutoCreateConvoName(courseId, moduleId, conversationIndex.toString(), user?.username), {
          messages: messages,
        }).then((res) => {
          if (res && res.status && res.status < 300) {
            if (res.data) {
              //update conversation list with new convo name
              setConversationList((prev) => {
                if (prev) {
                  var convos = [...prev.conversations];
                  const index = parseInt(conversationIndex);
                  // Ensure we don't crash if index out of bounds, though it shouldn't be
                  if (
                    convos[index] &&
                    res.data.conversations[index] &&
                    /^Conversation \d+$/i.test(convos[index].name)
                  ) {
                    convos[index].name = res.data.conversations[index].name;
                  }
                  return { ...prev, conversations: convos };
                } else return prev;
              });
            }
          } else if (res && res.status === 401) {
            navigator("/login");
          } else {
            setOpenErrorModal({
              open: true,
              message: `${t("errorMessage.genericError")}`,
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
      if (moduleInfo.prompts.length !== 0) {
        const actualPrompt = moduleInfo.prompts.filter((x) => x.id === selectedPrompt);

        if (conversationIndex === "new") {
          const promptContent = actualPrompt && actualPrompt.length > 0 ? actualPrompt[0].prompt : "";
          if (!promptContent) return;

          if (isReviewModule) {
            const maxDrafts = moduleInfo?.maxDrafts ?? 999;
            if (maxDrafts < 999 && conversationList && moduleInfo?.assessmentType !== "summative") {
              const completedCount = conversationList.conversations.filter(c => c.completed && !c.voidedByInstructor).length;
              if (completedCount >= maxDrafts) {
                setAlert({ message: t("errorMessage.maxDraftsReached"), type: "error" });
                navigator(`/courses/${courseId}/modules/${moduleId}/review`);
                return;
              }
            }
          }

          setIsLoading(true);
          Post(postCreateConversation(courseId, moduleId), {}).then((res) => {
            if (res && res.status && res.status < 300) {
              if (res.data && res.data.conversations) {
                const newIndex = res.data.conversations.length - 1;

                // Update Conversation List in Context
                setConversationList(res.data);

                navigator(`/${chatPrefix}/${user?.username}/${courseId}/${moduleId}/${newIndex}`, {
                  state: { pendingMessageContent: promptContent, pendingPromptId: actualPrompt[0].id },
                });
              }
            } else {
              setAlert({ message: `${t("errorMessage.genericError")}`, type: "error" });
              setIsLoading(false);
            }
          });
          return;
        }

        var messagesToSend = [];
        const tempTimestamp = Date.now();
        const messageTempId = tempTimestamp + "" + Math.floor(100000 + Math.random() * 900000);
        var responseMessage: MessageType = {
          id: tempTimestamp.toString(),
          content: actualPrompt && actualPrompt.length > 0 ? actualPrompt[0].prompt : "",
          messageType:
            (actualPrompt && actualPrompt.length > 0 ? actualPrompt[0].prompt : "").length < 1000 ? "text" : "file",
          role: "user",
          sender: "username",
          timestamp: messageTempId,
          promptId: actualPrompt[0].id,
        };
        messagesToSend.unshift(responseMessage);
        onSendMessage(messagesToSend, autoCreateConvoName);
      }
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
      onSendEssay(essay, actualPrompt && actualPrompt.length > 0 ? actualPrompt[0].prompt : "");
      const tempTimestamp = Date.now();
      const messageTempId = tempTimestamp + "" + Math.floor(100000 + Math.random() * 900000);
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
        expandableMessage: t("loadingMessage.loading"),
      };
      if (messages && message && moduleInfo && moduleInfo.showInitialPrompt) {
        const tempTimestamp2 = Date.now();
        const messageTempId2 = tempTimestamp + "" + Math.floor(100000 + Math.random() * 900000);
        var responseMessage2: MessageType = {
          id: tempTimestamp2.toString(),
          content: actualPrompt && actualPrompt.length > 0 ? actualPrompt[0].prompt : "",
          messageType:
            (actualPrompt && actualPrompt.length > 0 ? actualPrompt[0].prompt : "").length < 1000 ? "text" : "file",
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
      setChatError(t("chat.messageTooShort"));
    } else {
      setChatError(t("chat.messageTooLong"));
    }
    setIsLoading(false);
  }

  function handleDownloadConversation() {
    if (
      !courseInfo ||
      !moduleInfo ||
      !viewUser ||
      !user ||
      !courseId ||
      !moduleId ||
      !conversationIndex ||
      conversationIndex === "new"
    ) {
      return;
    }

    const controller = new AbortController();

    Get(getConversation(courseId, moduleId, conversationIndex, viewUser.username), controller.signal).then(
      (res: any) => {
        if (res && res.status && res.status < 300) {
          if (res.data && res.data.messages) {
            const isInstructor = user.groups.includes(instructor) || user.groups.includes(admin);
            downloadConversation({
              courseInfo,
              moduleInfo,
              user,
              viewUser,
              messages: res.data.messages,
              conversationIndex,
              isInstructor,
            });
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          setOpenErrorModal({
            open: true,
            message: t("errorMessage.downloadConversation"),
          });
        }
      },
    );
  }

  function handleNewConversation() {
    if (isReviewModule && moduleInfo?.assessmentType !== "summative") {
      const maxDrafts = moduleInfo?.maxDrafts ?? 999;
      if (maxDrafts < 999 && conversationList) {
        const completedCount = conversationList.conversations.filter(c => c.completed && !c.voidedByInstructor).length;
        if (completedCount >= maxDrafts) {
          setAlert({ message: t("errorMessage.maxDraftsReached"), type: "error" });
          return;
        }
      }
    }
    closeSocket();
    navigator(`/${chatPrefix}/${username}/${courseId}/${moduleId}/new`);
  }

  function returnDocText(docText: string) {
    setOpenDocumentModal(false);

    if (conversationIndex === "new") {
      if (docText.length < 1 && docText.length > 0) {
        setChatError(t("chat.messageTooShort"));
        return;
      }
      setIsLoading(true);
      // Create new conversation
      Post(postCreateConversation(courseId, moduleId), {}).then((res) => {
        if (res && res.status && res.status < 300) {
          if (res.data && res.data.conversations) {
            const newIndex = res.data.conversations.length - 1;

            setConversationList(res.data);

            // Navigate to the new conversation and pass the message in state
            navigator(`/${chatPrefix}/${user?.username}/${courseId}/${moduleId}/${newIndex}`, {
              state: { pendingMessageContent: docText, pendingPromptId: null },
            });
          }
        } else {
          setAlert({ message: `${t("errorMessage.genericError")}`, type: "error" });
          setIsLoading(false);
        }
      });
      return;
    }

    if (docText.length < 100000 && docText.length > 0) {
      const tempTimestamp = Date.now();
      const messageTempId = tempTimestamp + "" + Math.floor(100000 + Math.random() * 900000);
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
      setChatError(t("chat.messageTooShort"));
    } else {
      setChatError(t("chat.messageTooLong"));
    }
  }

  function returnSpeakingText(text: string) {
    setOpenSpeechToTextModal(false);
    if (text.length < 100000 && text.length > 0) {
      const tempTimestamp = Date.now();
      const messageTempId = tempTimestamp + "" + Math.floor(100000 + Math.random() * 900000);
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
      setChatError(t("chat.messageTooShort"));
    } else {
      setChatError(t("chat.messageTooLong"));
    }
  }

  function markConversationCompleted() {
    if (conversationIndex === "new") return;
    setConversationList((prev) => {
      if (!prev) return prev;
      const idx = prev.conversations.length - 1 - parseInt(conversationIndex);
      if (idx < 0) return prev;
      const convs = [...prev.conversations];
      convs[idx] = { ...convs[idx], completed: true };
      return { ...prev, conversations: convs };
    });
  }

  // Review module: complete conversation
  function onCompleteConversation() {
    if (!isConnected) return;
    setIsSubmitting(true);
    markConversationCompleted();
    setOpenCompleteModal(false);
    const sessionId = localStorage.getItem("sessionId") ?? "unknown";
    socket.current?.send(
      JSON.stringify({
        action: "reviewChat",
        messageType: "completeConversation",
        messages: [],
        organization: process.env.REACT_APP_ORGANIZATION ?? "",
        sessionId,
      }),
    );
  }

  // Review module: send chat message (chat mode)
  function onSendReviewMessage(messageText: string) {
    if (!messageText.trim()) return;

    if (conversationIndex === "new") {
      const maxDrafts = moduleInfo?.maxDrafts ?? 999;
      if (maxDrafts < 999 && conversationList && moduleInfo?.assessmentType !== "summative") {
        const completedCount = conversationList.conversations.filter(c => c.completed && !c.voidedByInstructor).length;
        if (completedCount >= maxDrafts) {
          setAlert({ message: t("errorMessage.maxDraftsReached"), type: "error" });
          navigator(`/courses/${courseId}/modules/${moduleId}/review`);
          return;
        }
      }
      setIsLoading(true);
      Post(postCreateConversation(courseId, moduleId), {}).then((res) => {
        if (res?.status < 300 && res.data?.conversations) {
          setConversationList(res.data);
          const newIndex = res.data.conversations.length - 1;
          navigator(`/${chatPrefix}/${user?.username}/${courseId}/${moduleId}/${newIndex}`, {
            replace: true,
            state: { pendingMessageContent: messageText, pendingPromptId: null },
          });
        } else if (res?.status === 401) {
          navigator("/login");
        } else if (res?.status === 400) {
          setAlert({ message: t("errorMessage.maxDraftsReached"), type: "error" });
          navigator(`/courses/${courseId}/modules/${moduleId}/review`);
          setIsLoading(false);
        } else {
          setAlert({ message: t("errorMessage.genericError"), type: "error" });
          setIsLoading(false);
        }
      });
      return;
    }

    if (!isConnected) { setPendingMessageContent(messageText); return; }
    const sessionId = localStorage.getItem("sessionId") ?? "unknown";
    const tempId = Date.now().toString();
    const userMsg: MessageType = {
      id: tempId,
      content: messageText,
      messageType: "text",
      role: "user",
      sender: username,
      timestamp: tempId,
      promptId: null,
      userVisible: true,
    };
    setMessages((prev) => [...prev, userMsg]);
    socket.current?.send(
      JSON.stringify({
        action: "reviewChat",
        messageType: "chat",
        messages: [{ role: "user", content: messageText }],
        organization: process.env.REACT_APP_ORGANIZATION ?? "",
        sessionId,
      }),
    );
    setShowTypingIndicator(true);
    setChatError(undefined);
  }

  // Review module: submit essay
  function onSubmitEssay() {
    if (essayText.length < 150) {
      setEssayError(t("reviewChat.essayMinLength"));
      return;
    }

    if (conversationIndex === "new") {
      const maxDrafts = moduleInfo?.maxDrafts ?? 999;
      if (maxDrafts < 999 && conversationList && moduleInfo?.assessmentType !== "summative") {
        const completedCount = conversationList.conversations.filter(c => c.completed && !c.voidedByInstructor).length;
        if (completedCount >= maxDrafts) {
          setAlert({ message: t("errorMessage.maxDraftsReached"), type: "error" });
          navigator(`/courses/${courseId}/modules/${moduleId}/review`);
          return;
        }
      }
      setIsSubmitting(true);
      const capturedEssayText = essayText;
      Post(postCreateConversation(courseId, moduleId), {}).then((res) => {
        if (res?.status < 300 && res.data?.conversations) {
          setConversationList(res.data);
          const newIndex = res.data.conversations.length - 1;
          setEssayText("");
          navigator(`/${chatPrefix}/${user?.username}/${courseId}/${moduleId}/${newIndex}`, {
            replace: true,
            state: { pendingEssay: capturedEssayText },
          });
        } else if (res?.status === 401) {
          navigator("/login");
        } else if (res?.status === 400) {
          setAlert({ message: t("errorMessage.maxDraftsReached"), type: "error" });
          navigator(`/courses/${courseId}/modules/${moduleId}/review`);
          setIsSubmitting(false);
        } else {
          setAlert({ message: t("errorMessage.genericError"), type: "error" });
          setIsSubmitting(false);
        }
      });
      return;
    }

    if (!isConnected) return;
    setIsSubmitting(true);
    markConversationCompleted();
    setEssayError("");
    const sessionId = localStorage.getItem("sessionId") ?? "unknown";
    const promptMessages = (moduleInfo?.prompts ?? [])
      .filter((p) => !p.isDeleted)
      .map((p) => ({ role: "user" as const, content: p.prompt }));
    const capturedEssayText = essayText;
    socket.current?.send(
      JSON.stringify({
        action: "reviewChat",
        messageType: "essayDraft",
        essayContent: capturedEssayText,
        messages: promptMessages,
        organization: process.env.REACT_APP_ORGANIZATION ?? "",
        sessionId,
      }),
    );
    const tempId = `${Date.now()}${Math.floor(Math.random() * 900000 + 100000)}`;
    setMessages(prev => [...prev, {
      id: tempId,
      content: capturedEssayText,
      messageType: "essayDraft",
      role: "user",
      sender: user?.username ?? "",
      timestamp: Date.now().toString(),
      promptId: null,
      userVisible: true,
    }]);
    setEssayText("");
  }

  const conversationArchived = conversationIsDeleted;

  const currentConvoName = conversationList?.conversations?.[parseInt(conversationIndex)]?.name ?? t("chat.newConversation");

  const isViewingOwnConvo = user && viewUser && user.username === viewUser.username;

  // Sync grade display from loaded grades when viewing a completed conversation (e.g. page refresh)
  useEffect(() => {
    if (!isReviewModule || !gradesLoaded || conversationIndex === "new" || !conversationCompleted) return;
    if (gradeResult !== null) return; // already set from WebSocket this session

    const convId = conversationList?.conversations[parseInt(conversationIndex)]?.id;
    if (!convId) return;

    const grade = grades.find((g) => g.courseModuleConversationId.endsWith(`+${convId}`));
    if (grade?.released) {
      setGradeResult({ scores: grade.scores, totalScore: grade.totalScore, instructorNotes: grade.instructorNotes });
      setGradePending(false);
    } else {
      setGradePending(true);
    }
  }, [grades, gradesLoaded, conversationList, conversationIndex, conversationCompleted, isReviewModule, gradeResult]); // eslint-disable-line

  const [canStartNewConversation, setCanStartNewConversation] = useState(true);
  useEffect(() => {
    if (!isViewingOwnConvo) { setCanStartNewConversation(false); return; }
    if (moduleInfo?.assessmentType === "summative") {
      if (!gradesLoaded) { setCanStartNewConversation(false); return; }
      const nonVoidedCompleted = conversationList?.conversations.filter(c => c.completed && !c.voidedByInstructor) ?? [];
      const hasUnreleasedSubmission = nonVoidedCompleted.some(c => {
        const grade = grades.find(g => g.courseModuleConversationId.endsWith(`+${c.id}`));
        return !grade?.released;
      });
      if (hasUnreleasedSubmission) { setCanStartNewConversation(false); return; }
      const maxDrafts = moduleInfo?.maxDrafts ?? 999;
      if (maxDrafts >= 999) { setCanStartNewConversation(true); return; }
      const releasedCount = nonVoidedCompleted.filter(c =>
        grades.find(g => g.courseModuleConversationId.endsWith(`+${c.id}`))?.released
      ).length;
      setCanStartNewConversation(releasedCount < maxDrafts);
      return;
    }
    const maxDrafts = moduleInfo?.maxDrafts ?? 999;
    if (maxDrafts >= 999) { setCanStartNewConversation(true); return; }
    if (!conversationList) { setCanStartNewConversation(false); return; }
    const completedCount = conversationList.conversations.filter(c => c.completed && !c.voidedByInstructor).length;
    setCanStartNewConversation(completedCount < maxDrafts);
  }, [conversationList, conversationCompleted, isViewingOwnConvo, moduleInfo, grades, gradesLoaded]);

  const isChatInputVisible =
    user &&
    viewUser &&
    user.username === viewUser.username &&
    selectedPrompt !== undefined &&
    (moduleInfo?.continuedInteraction ?? true) &&
    !showWizard &&
    !conversationCompleted &&
    !conversationArchived;

  const isReviewChatInputVisible =
    isReviewModule &&
    !chatBlocked &&
    !!isViewingOwnConvo &&
    !conversationArchived &&
    !showEssayWizard &&
    conversationIndex !== "new";

  const isNonEssayReviewInputVisible =
    isReviewModule &&
    !isEssayMode &&
    !chatBlocked &&
    !!isViewingOwnConvo &&
    !conversationArchived &&
    selectedPrompt !== undefined &&
    !showWizard;

  return (
    <>
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
        <div />
      </DialogWrapper>

      <DialogWrapper
        open={openDocumentModal}
        onOpenChange={setOpenDocumentModal}
        title={t("chat.uploadDocument")}
        contentClassName="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        actions={[
          {
            label: `${t("common.cancel")}`,
            onClick: () => setOpenDocumentModal(false),
            variant: "outline",
          },
        ]}
      >
        <DocumentModal returnDocText={returnDocText} />
      </DialogWrapper>

      <DialogWrapper
        open={openSpeechToTextModal}
        onOpenChange={setOpenSpeechToTextModal}
        title={t("chat.speechToText")}
        contentClassName="sm:max-w-md"
        actions={[
          {
            label: `${t("common.cancel")}`,
            onClick: () => setOpenSpeechToTextModal(false),
            variant: "outline",
          },
        ]}
      >
        <SpeechToTextModal returnSpeechText={returnSpeakingText} />
      </DialogWrapper>

      {/* Review: Complete conversation confirm */}
      {isReviewModule && (
        <DialogWrapper
          open={openCompleteModal}
          onOpenChange={setOpenCompleteModal}
          title={t("reviewChat.completeConversationTitle")}
          description={t("reviewChat.completeConversationDescription")}
          actions={[
            { label: t("common.cancel"), onClick: () => setOpenCompleteModal(false), variant: "outline" },
            { label: t("reviewChat.completeConversation"), onClick: onCompleteConversation },
          ]}
        />
      )}

      {/* Review: View rubric modal */}
      {isReviewModule && moduleInfo?.showRubric && moduleInfo?.rubrics?.[0] && (
        <DialogWrapper
          open={openViewRubricModal}
          onOpenChange={setOpenViewRubricModal}
          title={moduleInfo.rubrics[0].name}
          contentClassName="sm:max-w-3xl max-h-[90vh] overflow-y-auto"
          actions={[{ label: t("common.close"), onClick: () => setOpenViewRubricModal(false), variant: "outline" }]}
        >
          {moduleInfo.rubrics[0].criteria.length > 0 && moduleInfo.rubrics[0].columns.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="text-left p-2 border bg-muted font-semibold">{t("reviewModule.criterion")}</th>
                    {moduleInfo.rubrics[0].columns.map((col, i) => (
                      <th key={i} className="p-2 border bg-muted font-semibold text-center">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {moduleInfo.rubrics[0].criteria.map((criterion, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                      <td className="p-2 border font-medium">{criterion.name}</td>
                      {criterion.cells.map((cell, j) => (
                        <td key={j} className="p-2 border text-muted-foreground text-xs align-top">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">{t("reviewModule.noRubricSelected")}</p>
          )}
        </DialogWrapper>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0" style={{ height: "calc(100vh - 4rem)" }}>
        {/* Chat Header */}
        {courseInfo && moduleInfo ? (
          <ChatHeader
            conversationName={currentConvoName}
            courseInfo={courseInfo}
            moduleInfo={moduleInfo}
            onToggleSidebar={() => {
              window.dispatchEvent(new CustomEvent("toggleSidebar"));
            }}
            isMobile={window.innerWidth < 1024}
            onDownloadConversation={handleDownloadConversation}
            canDownload={conversationIndex !== "new"}
            reviewBadge={
              isReviewModule && conversationCompleted
                ? gradeResult ? "available" : "pending"
                : null
            }
            onViewRubric={
              isReviewModule && moduleInfo?.showRubric && moduleInfo?.rubrics?.[0]
                ? () => setOpenViewRubricModal(true)
                : undefined
            }
            attemptsLabel={(() => {
              if (!isReviewModule || !isViewingOwnConvo) return undefined;
              if (moduleInfo?.assessmentType === "summative") return undefined;
              const used = conversationList?.conversations.filter(c => c.completed && !c.voidedByInstructor).length ?? 0;
              const max = moduleInfo?.maxDrafts;
              if (!max || max >= 999) return t("reviewChat.unlimitedAttempts");
              const remaining = Math.max(0, max - used);
              return t("reviewChat.attemptsLeft", { remaining, max });
            })()}
            showComplete={!!(isReviewModule && isViewingOwnConvo && !conversationCompleted && !isEssayMode && messages.some((m) => m.role === "user"))}
            onComplete={() => setOpenCompleteModal(true)}
          />
        ) : (
          <div className="h-16 border-b border-border"></div>
        )}

        {/* Chat Messages and Input */}
        {courseInfo && moduleInfo && !isLoading ? (
          <>
            {/* Messages / Essay Wizard / Submitting Spinner / Oral Module */}
            {moduleInfo?.isOralModule && !isReviewModule ? (
              <OralChatView 
                onSubmit={(text) => onSendReviewMessage(text)} 
                onComplete={() => setOpenCompleteModal(true)}
                chatMessages={messages} 
              />
            ) : isReviewModule && showEssayWizard ? (
              <div className="flex-1 overflow-y-auto">
                <div className="flex items-center justify-center min-h-full p-6">
                  <div className="w-full max-w-2xl space-y-4 border rounded-xl bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="h-6 w-6 text-primary shrink-0" />
                      <div>
                        <h2 className="font-semibold text-lg">{t("reviewChat.essayUploadTitle")}</h2>
                        <p className="text-sm text-muted-foreground">{t("reviewChat.essayUploadDescription")}</p>
                      </div>
                    </div>

                    <DocumentModal inline returnDocText={(text) => setEssayText(text)} />

                    <div className="space-y-1">
                      <Label htmlFor="essay-text" className="text-xs">
                        {t("reviewChat.essayLabel")}
                      </Label>
                      <Textarea
                        id="essay-text"
                        placeholder={t("reviewChat.essayPlaceholder")}
                        value={essayText}
                        onChange={(e) => setEssayText(e.target.value)}
                        className="min-h-[200px] text-sm"
                      />
                      <p className="text-xs text-muted-foreground text-right">{essayText.length} chars</p>
                    </div>

                    {essayError && <p className="text-sm text-destructive">{essayError}</p>}

                    <Button
                      onClick={onSubmitEssay}
                      disabled={essayText.length < 150}
                      className="w-full gap-2"
                    >
                      <Send className="h-4 w-4" />
                      {t("reviewChat.submitEssay")}
                    </Button>
                  </div>
                </div>
              </div>
            ) : isReviewModule && isSubmitting && isEssayMode ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-muted-foreground">{t("reviewChat.submittingEssay")}</p>
                </div>
              </div>
            ) : (
              <ChatMessages
                messages={messages}
                moduleInfo={moduleInfo}
                user={user}
                viewUser={viewUser}
                showWizard={showWizard}
                showTypingIndicator={showTypingIndicator || (isReviewModule && isSubmitting)}
                messageNote={messageNote}
                conversationCompleted={conversationCompleted}
                instructor={instructor}
                admin={admin}
                conversationArchived={conversationArchived}
                canStartNewConversation={canStartNewConversation}
                onWizardReturnPrompts={handleWizardReturnPrompts}
                onWizardReturnEssay={handleWizardReturnEssay}
                newConversation={handleNewConversation}
                gradeResult={gradeResult}
                gradePending={gradePending}
                gradeError={gradeError}
                isEssayMode={isEssayMode}
                onScrolledUpChange={setChatScrolledUp}
                scrollToBottomRef={scrollToBottomRef}
              />
            )}

            {/* Input area wrapper — floating buttons anchor above this */}
            {(() => {
              const panelEssayMessage = messages.find(m => m.role === "user" && m.messageType === "essayDraft");
              const rubric = moduleInfo?.rubrics?.[0];
              const maxPerCriterion = rubric
                ? Math.max(...rubric.columns.map(Number).filter(Number.isFinite))
                : undefined;
              const maxTotal = maxPerCriterion !== undefined
                ? (rubric?.criteria.length ?? 0) * maxPerCriterion
                : undefined;
              const hasGradeContent = !!(gradeResult || gradePending || gradeError);
              const showPanel = isReviewModule && (hasGradeContent || !!panelEssayMessage);

              return (
                <div className="sticky bottom-0 z-20 shrink-0">
                  {/* Floating buttons — sit just above the input */}
                  <div className="absolute bottom-full right-4 mb-2 z-20 flex flex-row items-end gap-2 pointer-events-none">
                    {chatScrolledUp && (
                      <div className="pointer-events-auto">
                        <button
                          aria-label="Scroll to bottom"
                          onClick={() => scrollToBottomRef.current?.()}
                          className="flex items-center gap-1.5 border rounded-full bg-card shadow-md px-3 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
                        >
                          <ArrowDown className="h-4 w-4 text-primary" />
                        </button>
                      </div>
                    )}
                    {showPanel && (
                      <div className="pointer-events-auto">
                        <ReviewSummaryPanel
                          essayMessage={panelEssayMessage}
                          gradeResult={gradeResult}
                          gradePending={gradePending}
                          gradeError={gradeError}
                          maxPerCriterion={maxPerCriterion}
                          maxTotal={maxTotal}
                        />
                      </div>
                    )}
                  </div>

                  {moduleInfo?.isOralModule && !isReviewModule ? null : isReviewModule ? (
                    (isEssayMode ? isReviewChatInputVisible : isNonEssayReviewInputVisible) ? (
                      <ChatInput
                        isConnected={isConnected}
                        isLoading={isSubmitting}
                        isNewChat={false}
                        chatError={chatError}
                        onSubmit={onSendReviewMessage}
                        onOpenDocumentModal={() => setOpenDocumentModal(true)}
                        onOpenSpeechToTextModal={() => setOpenSpeechToTextModal(true)}
                        disabled={isSubmitting}
                      />
                    ) : null
                  ) : (
                    isChatInputVisible && (
                      <ChatInput
                        isConnected={isConnected}
                        isLoading={isLoading}
                        isNewChat={conversationIndex === "new"}
                        chatError={chatError}
                        onSubmit={handleSubmit}
                        onOpenDocumentModal={() => setOpenDocumentModal(true)}
                        onOpenSpeechToTextModal={() => setOpenSpeechToTextModal(true)}
                      />
                    )
                  )}
                </div>
              );
            })()}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted-foreground animate-pulse italic">{t("loadingMessage.loadingConversation")}</p>
          </div>
        )}
      </div>
    </>
  );
}
