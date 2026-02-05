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
import { AlertContext } from "../../utility/context/AlertContext";
import { UserContext } from "../../utility/context/UserContext";
import DocumentModal from "./DocumentModal";
import Post from "../../utility/Post";
import SpeechToTextModal from "./SpeechToTextModal";

// Import new components
import ChatHeader from "./components/ChatHeader";
import ChatMessages from "./components/ChatMessages";
import ChatInput from "./components/ChatInput";
import { useTranslation } from "../../hooks/useTranslation";
import { ChatContextType } from "./ChatContext";

function num_tokens_from_messages(messages: Array<any>) {
  var num_tokens = 0;
  messages.forEach((message: any) => {
    num_tokens = num_tokens + Math.ceil(message["content"].length / 4);
  });
  return num_tokens;
}

export default function Chat(): JSX.Element {
  const {
      courseInfo,
      moduleInfo,
      conversationList,
      setConversationList,
      viewUser,
      instructor,
      admin
  } = useOutletContext<ChatContextType>();

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



  useEffect(() => {
    if (moduleInfo && moduleInfo.prompts && moduleInfo.prompts.length < 1) {
      setSelectedPrompt("");
    }
  }, [moduleInfo, repeatingPrompts, selectedPrompt, messages]);

  useEffect(() => {
    if (moduleInfo && moduleInfo.raterEnabled !== undefined && moduleInfo.raterEnabled) {
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
  }, []);

  const onSocketClose = useCallback(() => {
    // Logic for reconnecting is  now handled by dependency on params
  }, []);

  const onSocketMessage = useCallback(
    (dataStr: string) => {
      const returnData = JSON.parse(dataStr);
      setShowTypingIndicator(false);
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
                      index === self.findIndex((t) => t.timestamp === obj.timestamp && t.message === obj.message)
                  );
                  const reconstructed = filteredArray
                    .sort((a, b) => a.timestamp - b.timestamp)
                    .map((m) => m.message)
                    .join("");
                  temp[temp.length - 1] = {
                      ...lastMsg,
                      content: reconstructed || lastMsg.content,
                      stream: stream
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
                  finished: true
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
    [t]
  );

  const onConnect = useCallback(
    (cId: string, mId: string, idx: string) => {
      if (process.env.REACT_APP_WEBSOCKET_URL) {

        if (socket.current && (socket.current.readyState === WebSocket.OPEN || socket.current.readyState === WebSocket.CONNECTING)) {
             closeSocket();
        }

        var URL = process.env.REACT_APP_WEBSOCKET_URL;
        URL = URL + `?token=${localStorage.getItem("papyrusai_access_token")}`;
        URL =
          URL +
          `&courseId=${cId}&moduleId=${mId}&index=${idx}&organization=${process.env.REACT_APP_ORGANIZATION}`;

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
    [onSocketClose, onSocketMessage, onSocketOpen] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const closeSocket = useCallback(() => {
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
        Get(
          getConversation(
            courseId,
            moduleId,
            conversationIndex,
            username
          ),
          controller.signal
        ).then((res: any) => {
          if (res && res.status && res.status < 300) {
            if (res.data && res.data.messages) {
              if (res.data.messages.length > 0) {
                setSelectedPrompt("");
              }
              var sortedMessages = res.data.messages.sort(
                (a: MessageType, b: MessageType) => parseInt(b.timestamp) - parseInt(a.timestamp)
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
            if (location.state && location.state.pendingMessageContent) {
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
  }, [conversationIndex, courseId, moduleId, username, location.state, onConnect, closeSocket, navigator, t, setAlert, setConversationList]);

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

        socket.current?.send(
          JSON.stringify({
            action: "sendMessage",
            messages: messagesToSend,
            organization: process.env.REACT_APP_ORGANIZATION ? process.env.REACT_APP_ORGANIZATION : "UCI",
          })
        );
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
        setOpenErrorModal({
          open: true,
          message: t("errorMessage.genericError"),
        });
      }
    },
    [messages, isConnected, t]
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
          var sendEssay: any = {
            action: "raterEssay",
            essay: essay,
            organization: process.env.REACT_APP_ORGANIZATION ? process.env.REACT_APP_ORGANIZATION : "UCI",
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
    [isConnected, t]
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
             navigator(
                 `/chat/${user?.username}/${courseId}/${moduleId}/${newIndex}`,
                 { state: { pendingMessageContent: message, pendingPromptId: null } }
             );
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
        Post(
          postAutoCreateConvoName(
            courseId,
            moduleId,
            conversationIndex.toString(),
            user?.username
          ),
          { messages: messages }
        ).then((res) => {
          if (res && res.status && res.status < 300) {
            if (res.data) {
              //update conversation list with new convo name
              setConversationList((prev) => {
                if (prev) {
                  var convos = [...prev.conversations];
                  const index = parseInt(conversationIndex);
                  // Ensure we don't crash if index out of bounds, though it shouldn't be
                  if(convos[index]) {
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

          setIsLoading(true);
          Post(postCreateConversation(courseId, moduleId), {}).then((res) => {
            if (res && res.status && res.status < 300) {
              if (res.data && res.data.conversations) {
                const newIndex = res.data.conversations.length - 1;

                // Update Conversation List in Context
                setConversationList(res.data);

                navigator(
                  `/chat/${user?.username}/${courseId}/${moduleId}/${newIndex}`,
                  { state: { pendingMessageContent: promptContent, pendingPromptId: actualPrompt[0].id } }
                );
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

  function handleNewConversation() {

      closeSocket();
      navigator(
        `/chat/${username}/${courseId}/${moduleId}/new`
      );
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
             navigator(
                 `/chat/${user?.username}/${courseId}/${moduleId}/${newIndex}`,
                 { state: { pendingMessageContent: docText, pendingPromptId: null } }
             );
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

  const conversationArchived = conversationIsDeleted;


  const currentConvoName = conversationList && conversationIndex !== "new" && conversationList.conversations[parseInt(conversationIndex)]
      ? conversationList.conversations[parseInt(conversationIndex)].name
      : t("chat.newConversation");


  const isChatInputVisible =
    (isConnected || conversationIndex === "new") &&
    user &&
    viewUser &&
    user.username === viewUser.username &&
    selectedPrompt !== undefined &&
    (moduleInfo?.continuedInteraction ?? true) &&
    !showWizard &&
    !conversationCompleted &&
    !conversationArchived;

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

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0" style={{ height: "calc(100vh - 4rem)" }}>
        {/* Chat Header */}
        {courseInfo && moduleInfo ? (
            <ChatHeader
            conversationName={currentConvoName}
            courseInfo={courseInfo}
            moduleInfo={moduleInfo}
            user={user}
            viewUser={viewUser}
            onToggleSidebar={() => {

                window.dispatchEvent(new CustomEvent('toggleSidebar'));
            }}
            isMobile={window.innerWidth < 1024}
            />
        ) : (
            <div className="h-16 border-b border-border"></div>
        )}

        {/* Chat Messages */}
        {courseInfo && moduleInfo && !isLoading ? (
          <>
            <ChatMessages
              messages={messages}
              moduleInfo={moduleInfo}
              user={user}
              viewUser={viewUser}
              showWizard={showWizard}
              showTypingIndicator={showTypingIndicator}
              messageNote={messageNote}
              conversationCompleted={conversationCompleted}
              instructor={instructor}
              admin={admin}
              conversationArchived={conversationArchived}
              onWizardReturnPrompts={handleWizardReturnPrompts}
              onWizardReturnEssay={handleWizardReturnEssay}
              newConversation={handleNewConversation}
            />

            {/* Chat Input */}
            {isChatInputVisible && (
              <ChatInput
                isConnected={isConnected}
                isLoading={isLoading}
                isNewChat={conversationIndex === "new"}
                chatError={chatError}
                onSubmit={handleSubmit}
                onOpenDocumentModal={() => setOpenDocumentModal(true)}
                onOpenSpeechToTextModal={() => setOpenSpeechToTextModal(true)}
              />
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted-foreground animate-pulse italic">
              {t("loadingMessage.loadingConversation")}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
