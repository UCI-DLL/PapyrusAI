import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useContext,
} from "react";
import { MessageLeft, MessageRight } from "../../components/Message";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Alert, AlertDescription } from "../../components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
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
import {
  Send,
  Paperclip,
  Mic,
  MoreVertical,
  AlertCircle,
  MessageCircle,
  Search,
  X,
  PanelRightOpen,
  Loader2,
  Plus,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import Get from "../../utility/Get";
import {
  getConversation,
  getConversationList,
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
import ChatWizard from "./ChatWizard";
import { AlertContext } from "../../utility/context/AlertContext";
// import RepeatingPromptWizard from "./RepeatingPromptWizard";
import { UserContext } from "../../utility/context/UserContext";
import { UserType } from "../../utility/types/UserTypes";
import { getUserData } from "../../utility/endpoints/UserEndpoints";
import DocumentModal from "./DocumentModal";
import Post from "../../utility/Post";
import SpeechToTextModal from "./SpeechToTextModal";
import EssayWizard from "./EssayWizard";
import { removeSpecialCharacters } from "../../utility/Helpers";
import { cn } from "../../lib/utils";

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
  const [courseInfo, setCourseInfo] = useState<CourseType>();
  const [moduleInfo, setModuleInfo] = useState<ModuleType>();
  const [newMessage, setNewMessage] = useState<string>("");
  const [selectedPrompt, setSelectedPrompt] = useState<string | undefined>();
  //After a prompt has been selected, then add it to this list
  const [repeatingPrompts, setRepeatingPrompts] = useState<Array<string>>([]);
  const { setAlert } = useContext(AlertContext);
  const { user } = useContext(UserContext); //current user signed in
  const [viewUser, setViewUser] = useState<UserType>(); //The user that owns the conversation
  const [showTypingIndicator, setShowTypingIndicator] =
    useState<boolean>(false);
  const [showWizard, setShowWizard] = useState(false); //show normal wizard (either under normal conditions or after we get rater essay back)
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const [chatError, setChatError] = useState<string | undefined>();
  const [conversationList, setConversationList] = useState<ConversationListType>();
  const [creatingConvo, setCreatingConvo] = useState<boolean>(false);
  const [messageNote, setMessageNote] = useState<string>(); //Note to users when using a tool
  const [openUpdateConvoModal, setOpenUpdateConvoModal] = useState<{
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
  //Error modal
  const [openErrorModal, setOpenErrorModal] = useState<{
    open: boolean;
    message: string;
  }>({
    open: false,
    message: "",
  });
  // Sidebar state - open by default on desktop, closed on mobile
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  const handleAddClose = () => {
    // Placeholder function for consistency with existing code
  };

  const instructor = process.env.REACT_APP_INSTRUCTOR
    ? process.env.REACT_APP_INSTRUCTOR
    : "PapyrusAIInstructors";
  const admin = process.env.REACT_APP_ADMIN
    ? process.env.REACT_APP_ADMIN
    : "PapyrusAIAdmin";

  useEffect(() => {
    //reset alert
    setAlert({ message: "", type: "info" });
    
    // Set sidebar open/closed based on screen size
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    handleResize(); // Set initial state
    window.addEventListener('resize', handleResize);

    //Disconnect websocket if we leave page
    return () => {
      socket.current?.close();
      setShowTypingIndicator(false);
      window.removeEventListener('resize', handleResize);
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

      //get user data
      Get(getUserData(location.pathname.split("/")[2]), controller.signal).then(
        (res) => {
          if (res && res.status && res.status < 300) {
            if (res.data) {
              setViewUser(res.data);
              //Then connect to the websocket if user is the same as the one currenly logged in
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
              //handle error
              setAlert({ message: "Could not find user", type: "error" });
              navigator("/");
            }
          }
        }
      );

      Get(getCourse(location.pathname.split("/")[3]), controller.signal).then(
        (res) => {
          if (res && res.status && res.status < 300) {
            if (res.data) {
              //Get conversation list for this course/module
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
            // handle error
            if (res) {
              setAlert({ message: "Course not found", type: "error" });
              navigator("/");
            }
          }
        }
      );
      // Load conversation list for sidebar
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
              //Init selected prompt
              //Use temp stuff for now
              setSelectedPrompt("");
            }
            //Get list of messages for the conversation
            //make sure the messages are in timestamp order
            // also label the messages that are in context window for chatgpt
            var sortedMessages = res.data.messages.sort(
              (a: MessageType, b: MessageType) =>
                parseInt(b.timestamp) - parseInt(a.timestamp)
            );
            var contextCounter = 0;
            var reverse = sortedMessages.map((message: MessageType) => {
              contextCounter += num_tokens_from_messages([message]);
              if (contextCounter < 64000) {
                //64k context window
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
          // handle error
          if (res && res.status === 400) {
            //If convo doesn't exist, then return to convo list
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
      //If we didnt get a state, then redirect to course list
      navigator("/courses");
    }

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line
  }, [location]);

  useEffect(() => {
    //if no prompts => aka free chat
    if (moduleInfo && moduleInfo.prompts && moduleInfo.prompts.length < 1) {
      setSelectedPrompt("");
    }
  }, [moduleInfo, repeatingPrompts, selectedPrompt, messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // if rater enabled module, then show the rater essay wizard essay first and then
    // show the normal prompt wizard afterwards
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  //ping every min or so to keep the websocket alive
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
    //Then re-connect to the websocket if user is the same as the one currenly logged in
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
    //turn off typing indicator for chatgpt
    setShowTypingIndicator(false);
    if (returnData.essay && returnData.status < 300 && returnData.rater) {
      //if we get the essay response back, then we need to update the list of messages
      //since the essay has a expandable message
      const tempTimestamp = Date.now();
      const essayTempId = tempTimestamp + "" + Math.floor(100000 + Math.random() * 900000);
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
      if (messages) {
        setMessages((prev) => [...prev, essayMessage, essayResponseMessage]);
      }
      setShowWizard(false);
    } else if (returnData.status < 300) {
      const returnMessage: StreamMessageType = JSON.parse(returnData.data);
      //if there is a note, then display to user
      if (returnMessage.message === null && returnMessage.note) {
        setMessageNote(returnMessage.note);
        setShowTypingIndicator(true);
      }
      //if we are still streaming and not finished
      if (returnMessage.messageType === "streamMessage" && !returnMessage.finished) {
        //if the current message id matches incoming message,
        // then add new message stream to it
        // else create a new message in list
        //Note: use message ref to get current state of messages
        // https://stackoverflow.com/questions/57847594/accessing-up-to-date-state-from-within-a-callback
        if (returnMessage.message !== null && !returnMessage.note) {
          setMessageNote(undefined);
        }
        if (
          messagesRef.current &&
          messagesRef.current.length > 0 &&
          messagesRef.current[messagesRef.current.length - 1].stream &&
          messagesRef.current[messagesRef.current.length - 1].stream?.[0]
            .id === returnMessage.id
        ) {
          setMessages((prev) => {
            if (prev && messagesRef.current) {
              var temp = [...messagesRef.current];
              if (temp[temp.length - 1].stream) {
                //add new stream message to list
                temp[temp.length - 1].stream?.push(returnMessage);
                const stream = temp[temp.length - 1].stream || [];
                //update message based on stream array (timestamps) and index
                //remove duplicates (by timestamp AND message) and then sort by timestamp
                const filteredArray: StreamMessageType[] = stream.filter((obj, index, self) =>
                  index === self.findIndex((t) => t.timestamp === obj.timestamp && t.message === obj.message)
                );
                const reconstructed = filteredArray.sort((a, b) => a.timestamp - b.timestamp)
                  .map(m => m.message)
                  .join('');
                temp[temp.length - 1].content = reconstructed || temp[temp.length - 1].content;
              }
              return temp;
            } else return prev;
          });
        } else {
          if (returnMessage.message !== null && !returnMessage.note) {
            setMessageNote(undefined);
          }
          // make some temp stuff for the message
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
            stream: [returnMessage]
          };
          if (messages) {
            setMessages((prev) => [...prev, responseMessage]);
          }
        }
      } else if (
        returnMessage.finished &&
        returnMessage.messageType === "finalMessage"
      ) {
        console.log("final message", returnMessage);
        setMessages((prev) => {
          if (prev && messagesRef.current) {
            var temp = [...messagesRef.current];
            temp[temp.length - 1].content = returnMessage.message;
            //handle web search sources
            if (returnMessage.sources && returnMessage.sources.sources) {
              console.log("search query: ", returnMessage.sources.searchQuery);
              console.log("final summary: ", returnMessage.sources.content);
              temp[temp.length - 1].sources = returnMessage.sources.sources;
            }
            return temp;
          } else return prev;
        });
      }
    } else {
      //update conversation data and handle errors
      setOpenErrorModal({ open: true, message: returnData.data });
      if (returnData.status === 400) {
        setOpenUpdateConvoModal(prev => ({ ...prev, completed: true }));
      }
    }
  }, [messages]);

  const onConnect = useCallback((courseId: string, moduleId: string, conversationIndex: string) => {
    if (socket.current?.readyState !== WebSocket.OPEN && process.env.REACT_APP_WEBSOCKET_URL) {
      var URL = process.env.REACT_APP_WEBSOCKET_URL;
      URL = URL + `?token=${localStorage.getItem("papyrusai_access_token")}`;
      URL = URL + `&courseId=${courseId}&moduleId=${moduleId}&index=${conversationIndex}&organization=${process.env.REACT_APP_ORGANIZATION}`;
      socket.current = new WebSocket(URL);
      socket.current.addEventListener('open', onSocketOpen);
      socket.current.addEventListener('close', onSocketClose);
      socket.current.addEventListener('message', (event) => {
        onSocketMessage(event.data);
      });
    }
  }, [onSocketClose, onSocketMessage, onSocketOpen]);

  const onSendMessage = useCallback((messageList: Array<MessageType>, autoCreateConvoName: any) => {
    //save message in message array
    setChatError(undefined);
    if (messages && isConnected) {
      //check that message length is less that 100000
      var messagesToSend: Array<{ role: string, content: string }> = [];
      messageList.map(message => {
        if (message.content.length > 100000) {
          setChatError("Message Too Long");
          return "";
        } else {
          //temp convert message to message type
          const tempTimestamp = Date.now();
          const messageTempId = tempTimestamp + "" + Math.floor(100000 + Math.random() * 900000);
          var responseMessage: MessageType = {
            id: tempTimestamp.toString(),
            content: message.content.replace(/\n\n/g, " ").replace(/\n/g, " "), //replace new lines
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

      socket.current?.send(JSON.stringify({
        "action": "sendMessage",
        "messages": messagesToSend,
        "organization": process.env.REACT_APP_ORGANIZATION ? process.env.REACT_APP_ORGANIZATION : "UCI"
      }));
      //Set the typing indicator for chatgpt while we wait for a response
      setShowTypingIndicator(true);
      //one first user message, auto create a name for the conversation
      if (messages.concat(messageList).filter(m => (m.promptId === null || m.promptId === "") && m.role === "user").length === 1) {
        autoCreateConvoName(messagesToSend);
      }

    } else {
      setOpenErrorModal({ open: true, message: "Something went wrong. Please try again" });
    }
  }, [messages, isConnected]);

  const onSendEssay = useCallback((essay: string, message?: string) => {
    //save message in message array
    setChatError(undefined);
    if (isConnected) {
      //check that essay/message length is less that 100000
      if (essay.length > 100000) {
        setChatError("Essay Too Long to Evaluate");
      } else if (essay.length < 750) { //~5 characters in a word * 150 words
        setChatError("Essay Too Short to Evaluate");
      } else {
        var sendEssay: any = {
          "action": "raterEssay",
          "essay": essay,
          "organization": process.env.REACT_APP_ORGANIZATION ? process.env.REACT_APP_ORGANIZATION : "UCI"
        };
        //add optional message/prompt
        if (message) {
          sendEssay["message"] = message;
        }
        socket.current?.send(JSON.stringify(sendEssay));
      }
      //Set the typing indicator for chatgpt while we wait for a response
      setShowTypingIndicator(true);
    } else {
      setOpenErrorModal({ open: true, message: "Something went wrong. Please try again" });
    }
  }, [isConnected]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    //check that message length is less that 100000
    setChatError(undefined);
    if (newMessage.length < 100000 && newMessage.length > 0) {
      const tempTimestamp = Date.now();
      const messageTempId =
        tempTimestamp + "" + Math.floor(100000 + Math.random() * 900000);
      var responseMessage: MessageType = {
        id: tempTimestamp.toString(),
        content: newMessage,
        messageType: newMessage.length < 1000 ? "text" : "file",
        role: "user",
        sender: "username",
        timestamp: messageTempId,
        promptId: null,
      };
      onSendMessage([responseMessage], autoCreateConvoName);
      //Then reset newMessage
      setNewMessage("");
    } else if (newMessage.length < 1) {
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
            //update conversation list with new conversation list
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
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          // handle error
          setOpenErrorModal({
            open: true,
            message: "Something went wrong. Try again later",
          });
        }
      });
    }
  }

  function handleWizardReturnPrompts(selectedPrompt: string) {
    setSelectedPrompt(selectedPrompt);
    setRepeatingPrompts([selectedPrompt]);
    if (courseInfo && moduleInfo) {
      //send prompts to chatgtp
      var messagesToSend = [];
      //sent newly selected prompt to chatgpt
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
      //Send full message objects
      onSendMessage(messagesToSend, autoCreateConvoName);
    }
  }

  function handleWizardReturnEssay(essay: string, message?: string) {
    //right now message is a prompt
    setIsLoading(true);
    //check that message length is less that 100000
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
      //set temp essay message
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
        //only show if module settings show init prompt true
        //set temp prompt message
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

  // function handleRepeatPrompt(selectedPrompt: string) {
  //   if (courseInfo && moduleInfo && selectedPrompt !== "") {
  //     setSelectedPrompt(selectedPrompt);
  //     //Add newly selected prompt to the list of repeating prompts
  //     setRepeatingPrompts((prev) => [...prev, selectedPrompt]);
  //     //sent newly selected prompt to chatgpt
  //     const actualPrompt = moduleInfo.prompts.filter(x => x.id === selectedPrompt);
  //     const tempTimestamp = Date.now();
  //     const messageTempId = tempTimestamp + "" + Math.floor(100000 + Math.random() * 900000);
  //     var responseMessage: MessageType = {
  //       id: tempTimestamp.toString(),
  //       content: actualPrompt && actualPrompt.length > 0 ? actualPrompt[0].prompt : "",
  //       messageType: (actualPrompt && actualPrompt.length > 0 ? actualPrompt[0].prompt : "").length < 1000 ? "text" : "file",
  //       role: "user",
  //       sender: "username",
  //       timestamp: messageTempId,
  //       promptId: actualPrompt[0].id
  //     }
  //     onSendMessage([responseMessage]);
  //   }
  // }

  //Note, you should use the offical token counter: https://platform.openai.com/docs/guides/text-generation/managing-tokens
  //BUT even on their tokenizer: https://platform.openai.com/tokenizer?view=bpe it says that 1 token ~= 4 characters
  function num_tokens_from_messages(messages: Array<any>) {
    var num_tokens = 0;
    messages.forEach((message) => {
      num_tokens = num_tokens + Math.ceil(message["content"].length / 4);
    });
    return num_tokens;
  }

  function handleNewConversation() {
    if (conversationIds) {
      setCreatingConvo(true);
      Post(
        postCreateConversation(conversationIds.courseId, conversationIds.moduleId),
        {}
      ).then((res) => {
        if (res && res.status && res.status < 300) {
          if (res.data) {
            setCreatingConvo(false);
            // Update conversation list
            setConversationList(res.data);
            // Navigate to the new conversation
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
        //If instructor, then download all messages
        // else dont download if module.showInitialPrompt is false OR hidden messages
        if (!moduleInfo.showInitialPrompt && index === 0 && !isInstructor) {
          //if dont showing init prompt and it is the first message and we are not an instructor, then dont add message to text
        } else if (
          message.userVisible !== undefined &&
          !message.userVisible &&
          !isInstructor
        ) {
          //If the message is hidden and we are not an instructor, then dont add the message to text
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
            //update conversation list with new conversation list
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
          // handle error
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
              //update conversation list with new conversation list
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
            // handle error
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

  // Filter conversations based on search term
  const filteredConversations = conversationList?.conversations?.filter((conv) =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => parseInt(b.id) - parseInt(a.id)) || [];

  return !isLoading && courseInfo && conversationIds && moduleInfo ? (
    <div className="h-screen flex bg-background text-foreground relative overflow-hidden">
      <Dialog
        open={openErrorModal.open}
        onOpenChange={(open) =>
          setOpenErrorModal({
            open,
            message: open ? openErrorModal.message : "",
          })
        }
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              We ran into an error!
            </DialogTitle>
            <DialogDescription>{openErrorModal.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setOpenErrorModal({ open: false, message: "" })}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setOpenErrorModal({ open: false, message: "" });
                navigator(`/courses/${courseInfo.id}/modules/${moduleInfo.id}`);
              }}
            >
              Back to Conversation List
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={openDocumentModal} onOpenChange={setOpenDocumentModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Paperclip className="h-5 w-5" />
              Document Upload
            </DialogTitle>
          </DialogHeader>
          <DocumentModal returnDocText={returnDocText} />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenDocumentModal(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={openSpeechToTextModal}
        onOpenChange={setOpenSpeechToTextModal}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Speech to Text
            </DialogTitle>
          </DialogHeader>
          <SpeechToTextModal returnSpeechText={returnSpeakingText} />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenSpeechToTextModal(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={openUpdateConvoModal.deleteOpen}
        onOpenChange={(open) =>
          setOpenUpdateConvoModal((prev) => ({ ...prev, deleteOpen: open }))
        }
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Hide Conversation?
            </DialogTitle>
            <DialogDescription>
              Are you sure you would like to hide this conversation? Instructors
              can still view hidden conversations.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() =>
                setOpenUpdateConvoModal((prev) => ({
                  ...prev,
                  deleteOpen: false,
                }))
              }
            >
              Cancel
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
              Hide Conversation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={openUpdateConvoModal.open}
        onOpenChange={(open) =>
          setOpenUpdateConvoModal((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Conversation</DialogTitle>
          </DialogHeader>
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
                className={
                  openUpdateConvoModal.error ? "border-destructive" : ""
                }
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
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setOpenUpdateConvoModal((prev) => ({ ...prev, open: false }))
              }
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                handleConverstionNameDeleteUpdate(openUpdateConvoModal)
              }
              disabled={isLoading}
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Content - Full Width */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Header */}
        <div className="bg-card border-b border-border px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageCircle className="h-4 w-4" />
                <span className="font-medium">
                  {openUpdateConvoModal.name || "Chat Title Goes Here"}
                </span>
              </div>
              <div className="text-sm text-muted-foreground hidden sm:block">
                {courseInfo.name} - {moduleInfo.name}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() =>
                      setOpenUpdateConvoModal((prev) => ({
                        ...prev,
                        open: true,
                      }))
                    }
                  >
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={downloadChat}>
                    Download
                  </DropdownMenuItem>
                  {user && viewUser && user.username === viewUser.username && (
                    <DropdownMenuItem
                      onClick={() =>
                        setOpenUpdateConvoModal((prev) => ({
                          ...prev,
                          deleteOpen: true,
                        }))
                      }
                    >
                      Hide Conversation
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <PanelRightOpen className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 max-w-4xl mx-auto min-h-full flex flex-col">
            {/* Show wizards first */}
            {user &&
              viewUser &&
              user.username === viewUser.username &&
              messages.length < 1 &&
              moduleInfo &&
              moduleInfo.raterEnabled !== undefined &&
              moduleInfo.raterEnabled && (
                <div className="mb-4">
                  <EssayWizard
                    prompts={
                      moduleInfo.prompts && moduleInfo.prompts.length > 0
                        ? moduleInfo.prompts
                        : undefined
                    }
                    returnEssay={handleWizardReturnEssay}
                  />
                </div>
              )}
            {showWizard && (
              <div className="mb-4">
                <ChatWizard
                  prompts={moduleInfo.prompts}
                  returnPrompt={handleWizardReturnPrompts}
                />
              </div>
            )}

            {/* Empty State or Messages */}
            {messages.length === 0 && !showWizard && (!moduleInfo.raterEnabled || moduleInfo.raterEnabled === undefined) ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="bg-card border border-border rounded-lg p-8 max-w-md text-center">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold mb-2">Start the conversation</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {moduleInfo.moduleDescription}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    For more information on how to converse with the AI, please see
                    the{" "}
                    {user?.groups.includes(
                      process.env.REACT_APP_INSTRUCTOR
                        ? process.env.REACT_APP_INSTRUCTOR
                        : "PapyrusAIInstructors"
                    ) ? (
                      <a
                        href="https://docs.google.com/document/d/1o3He0CdgV7hJOX65gc3Gpf3_Fr3GYvSm4Q-i-Y5cNHQ/edit?tab=t.0#heading=h.7e2lilt0vxyx"
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        "Starting a Conversation" section of our user guide
                      </a>
                    ) : (
                      <a
                        href="https://docs.google.com/document/d/1hVXs5RwWi8Pau1YlhwoF5Y5zO3-1hMZAyUxych7iIDo/edit?tab=t.0#heading=h.ap3bxaogq8pi"
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        "Starting a Conversation" section of our user guide
                      </a>
                    )}
                    .
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 space-y-4">
                {messages.map((message, index) => {
                  const isContextDivider =
                    index ===
                    messages.findIndex(
                      (message: MessageType) => !message.inContext
                    );

                  return (
                    <React.Fragment key={message.id || index}>
                      {isContextDivider && (
                        <div className="relative flex items-center justify-center my-6">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground font-medium">
                              In Context
                            </span>
                          </div>
                        </div>
                      )}

                      {message.role === "assistant" ? (
                        <MessageLeft
                          message={message.content}
                          displayName={
                            message.sender === "ChatGPT"
                              ? "Papyrus"
                              : message.sender
                          }
                          messageType={message.messageType}
                          outOfContext={message.inContext ? true : false}
                          visible={
                            message.userVisible === undefined ||
                            message.userVisible
                              ? true
                              : false
                          }
                          expandableMessage={
                            message.expandableMessage &&
                            message.expandableMessage !== ""
                              ? message.expandableMessage
                              : undefined
                          }
                          isInstructor={
                            user?.groups.includes(instructor) ||
                            user?.groups.includes(admin)
                              ? true
                              : false
                          }
                          sources={message.sources ? (typeof message.sources === 'string' ? JSON.parse(message.sources) : message.sources) : []}
                        />
                      ) : !moduleInfo.showInitialPrompt &&
                        message.promptId ? null : (
                        <MessageRight
                          message={message.content}
                          displayName={viewUser?.name}
                          messageType={message.messageType}
                          outOfContext={message.inContext ? true : false}
                          visible={
                            message.userVisible === undefined ||
                            message.userVisible
                              ? true
                              : false
                          }
                          isInstructor={
                            user?.groups.includes(instructor) ||
                            user?.groups.includes(admin)
                              ? true
                              : false
                          }
                        />
                      )}
                    </React.Fragment>
                  );
                })}

                {showTypingIndicator && (
                  <MessageLeft message={""} displayName={"Papyrus"} typing />
                )}

                {messageNote && (
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-4">
                    <p className="text-sm text-primary/80">{messageNote}</p>
                  </div>
                )}

                {openUpdateConvoModal.completed && (
                  <div className="text-center py-8 border-t border-border mt-6">
                    <div className="pb-4 text-muted-foreground text-sm max-w-md mx-auto">
                      This conversation has been flagged as inappropriate for this
                      setting. Please start a new conversation.
                    </div>
                    <Button
                      onClick={() => {
                        navigator(
                          `/courses/${courseInfo.id}/modules/${moduleInfo.id}`
                        );
                      }}
                      className="mt-2"
                    >
                      Back to Conversation List
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* handles scrolling to the bottom */}
            <div ref={messagesEndRef} className="h-1" />
          </div>
        </div>

        {/* Input Area */}
        {isConnected &&
          user &&
          viewUser &&
          user.username === viewUser.username &&
          selectedPrompt !== undefined &&
          moduleInfo.continuedInteraction &&
          !showWizard &&
          !openUpdateConvoModal.completed && (
            <div className="border-t border-border bg-card flex-shrink-0">
              <div className="p-4 max-w-4xl mx-auto">
                <form onSubmit={handleSubmit} className="w-full">
                  <div className="relative flex items-end gap-3 p-3 border rounded-lg bg-background shadow-sm">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => {
                              handleAddClose();
                              setOpenDocumentModal(true);
                            }}
                            aria-label="add file"
                          >
                            <Paperclip className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Add file</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <Textarea
                      placeholder="Ask me anything about your studies..."
                      value={newMessage}
                      disabled={isLoading}
                      className="flex-1 min-h-[44px] max-h-[120px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm leading-6"
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                        setChatError(undefined);
                        if (e.target.value.length < 100000) {
                          setNewMessage(removeSpecialCharacters(e.target.value));
                        } else {
                          setChatError("Message Too Long");
                        }
                      }}
                      onKeyDown={(e: any) => {
                        if (e.keyCode === 13 && e.shiftKey) {
                          e.preventDefault();
                          setNewMessage((prev) => prev + "\n");
                        } else if (e.keyCode === 13 && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit(e);
                        }
                      }}
                    />

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => {
                              handleAddClose();
                              setOpenSpeechToTextModal(true);
                            }}
                            aria-label="Speech to text"
                          >
                            <Mic className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          Speech to text
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <Button
                      type="submit"
                      size="sm"
                      className="h-8 w-8 p-0 bg-primary hover:bg-primary/90 transition-colors"
                      disabled={isLoading || !newMessage.trim()}
                      aria-label="Send message"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>

                {chatError && (
                  <Alert className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{chatError}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          )}
      </div>

      {/* Desktop Sidebar - Right Column */}
      <div className="hidden lg:flex w-80 border-l border-border bg-card overflow-hidden">
        <div className="flex flex-col h-full w-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Conversations</h2>
              <Button
                size="sm"
                onClick={handleNewConversation}
                disabled={creatingConvo}
                className="h-7 px-2 text-xs"
              >
                {creatingConvo ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Plus className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>

          {/* Module Info */}
          <div className="p-4 border-b border-border">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">{moduleInfo.name}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {moduleInfo.moduleDescription}
              </p>
              <div className="text-xs text-muted-foreground">
                <p><span className="font-medium">Course:</span> {courseInfo.name}</p>
                <p><span className="font-medium">Instructor:</span> {courseInfo.instructor.name + " " + courseInfo.instructor.family_name}</p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-sm h-8"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length > 0 ? (
              <div className="space-y-1 p-2">
                {filteredConversations.map((conversation) => {
                  const conversationIndex = conversationList?.conversations
                    ? conversationList.conversations.length - conversationList.conversations.findIndex(c => c.id === conversation.id) - 1
                    : 0;
                  const isCurrentConversation = conversationIndex.toString() === conversationIds?.conversationIndex;
                  const conversationLink = `/chat/${user?.username}/${conversationIds?.courseId}/${conversationIds?.moduleId}/${conversationIndex}`;
                  
                  return (
                    <div
                      key={conversation.id}
                      className={cn(
                        "rounded-lg p-3 cursor-pointer transition-colors border",
                        isCurrentConversation
                          ? "bg-primary text-primary-foreground border-primary"
                          : "hover:bg-accent border-transparent"
                      )}
                      onClick={() => navigator(conversationLink)}
                    >
                      <div className="space-y-1">
                        <p className={cn(
                          "text-sm font-medium truncate",
                          isCurrentConversation ? "text-primary-foreground" : "text-foreground"
                        )}>
                          {conversation.name}
                        </p>
                        <p className={cn(
                          "text-xs truncate",
                          isCurrentConversation ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}>
                          {new Date(parseInt(conversation.id.substring(0, 13))).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground p-4">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {searchTerm ? "No matching conversations" : "No conversations yet"}
                </p>
                {!searchTerm && (
                  <Button
                    size="sm"
                    onClick={handleNewConversation}
                    disabled={creatingConvo}
                    className="mt-3 text-xs"
                  >
                    {creatingConvo ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Plus className="mr-1 h-3 w-3" />
                    )}
                    Start conversation
                  </Button>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        >
          <div 
            className="fixed right-0 top-0 h-full w-80 bg-card border-l border-border shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full">
              {/* Mobile Sidebar Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Conversations</h2>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={handleNewConversation}
                      disabled={creatingConvo}
                      className="h-7 px-2 text-xs"
                    >
                      {creatingConvo ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Plus className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Module Info */}
              <div className="p-4 border-b border-border">
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">{moduleInfo.name}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {moduleInfo.moduleDescription}
                  </p>
                  <div className="text-xs text-muted-foreground">
                    <p><span className="font-medium">Course:</span> {courseInfo.name}</p>
                    <p><span className="font-medium">Instructor:</span> {courseInfo.instructor.name + " " + courseInfo.instructor.family_name}</p>
                  </div>
                </div>
              </div>

              {/* Search */}
              <div className="p-4 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 text-sm h-8"
                  />
                </div>
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length > 0 ? (
                  <div className="space-y-1 p-2">
                    {filteredConversations.map((conversation) => {
                      const conversationIndex = conversationList?.conversations
                        ? conversationList.conversations.length - conversationList.conversations.findIndex(c => c.id === conversation.id) - 1
                        : 0;
                      const isCurrentConversation = conversationIndex.toString() === conversationIds?.conversationIndex;
                      const conversationLink = `/chat/${user?.username}/${conversationIds?.courseId}/${conversationIds?.moduleId}/${conversationIndex}`;
                      
                      return (
                        <div
                          key={conversation.id}
                          className={cn(
                            "rounded-lg p-3 cursor-pointer transition-colors border",
                            isCurrentConversation
                              ? "bg-primary text-primary-foreground border-primary"
                              : "hover:bg-accent border-transparent"
                          )}
                          onClick={() => {
                            navigator(conversationLink);
                            setSidebarOpen(false);
                          }}
                        >
                          <div className="space-y-1">
                            <p className={cn(
                              "text-sm font-medium truncate",
                              isCurrentConversation ? "text-primary-foreground" : "text-foreground"
                            )}>
                              {conversation.name}
                            </p>
                            <p className={cn(
                              "text-xs truncate",
                              isCurrentConversation ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}>
                              {new Date(parseInt(conversation.id.substring(0, 13))).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground p-4">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      {searchTerm ? "No matching conversations" : "No conversations yet"}
                    </p>
                    {!searchTerm && (
                      <Button
                        size="sm"
                        onClick={() => {
                          handleNewConversation();
                          setSidebarOpen(false);
                        }}
                        disabled={creatingConvo}
                        className="mt-3 text-xs"
                      >
                        {creatingConvo ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <Plus className="mr-1 h-3 w-3" />
                        )}
                        Start conversation
                      </Button>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
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
