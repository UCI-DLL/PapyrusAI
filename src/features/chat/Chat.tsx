import React, { useEffect, useState, useCallback, useRef, useContext } from "react";
import { MessageLeft, MessageRight } from "../../components/Message";
import { Box, Alert, Menu, MenuItem, Button, TextField } from "@mui/material";
import IconButton from '@mui/material/IconButton';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import MicIcon from '@mui/icons-material/Mic';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import { useLocation, useNavigate } from "react-router";
import Get from "../../utility/Get";
import { getConversation, postAutoCreateConvoName, postUpdateConversation } from "../../utility/endpoints/ConversationEndpoints";
import LinearProgress from '@mui/material/LinearProgress';
import { getCourse } from "../../utility/endpoints/CourseEndpoints";
import { MessageType, StreamMessageType } from "../../utility/types/ConversationTypes";
import { CourseType, ModuleType } from "../../utility/types/CourseTypes";
import ChatWizard from "./ChatWizard";
import { AlertContext } from "../../utility/context/AlertContext";
// import RepeatingPromptWizard from "./RepeatingPromptWizard";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { UserContext } from "../../utility/context/UserContext";
import { UserType } from "../../utility/types/UserTypes";
import { getUserData } from "../../utility/endpoints/UserEndpoints";
import { Modal } from "../../components/Modal";
import DocumentModal from "./DocumentModal";
import Post from "../../utility/Post";
import { Tooltip } from "@mui/material";
import SpeechToTextModal from "./SpeechToTextModal";
import EssayWizard from "./EssayWizard";
import { removeSpecialCharacters } from "../../utility/Helpers";


export default function Chat(): JSX.Element {
  const location = useLocation();
  let navigator = useNavigate();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [conversationIds, setConversationIds] = useState<{
    courseId: string,
    moduleId: string,
    conversationIndex: string
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
  const [showTypingIndicator, setShowTypingIndicator] = useState<boolean>(false);
  const [showWizard, setShowWizard] = useState(false); //show normal wizard (either under normal conditions or after we get rater essay back)
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const [chatError, setChatError] = useState<string | undefined>();
  const [openUpdateConvoModal, setOpenUpdateConvoModal] = useState<{
    open: boolean,
    deleteOpen: boolean,
    courseId: string,
    moduleId: string,
    index: string,
    name: string,
    isDeleted: boolean,
    completed: boolean,
    error: string
  }>({
    open: false,
    deleteOpen: false,
    courseId: "",
    moduleId: "",
    index: "",
    name: "",
    isDeleted: false,
    completed: false,
    error: ""
  });
  const [openDocumentModal, setOpenDocumentModal] = useState<boolean>(false);
  const [openSpeechToTextModal, setOpenSpeechToTextModal] = useState<boolean>(false);
  //Error modal
  const [openErrorModal, setOpenErrorModal] = useState<{
    open: boolean,
    message: string
  }>({
    open: false,
    message: ""
  });
  //download menu in chat
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  //add file menu
  const [addAnchorEl, setAddAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const addOpen = Boolean(addAnchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAddClose = () => {
    setAddAnchorEl(null);
  };

  const instructor = process.env.REACT_APP_INSTRUCTOR ? process.env.REACT_APP_INSTRUCTOR : "PapyrusAIInstructors";
  const admin = process.env.REACT_APP_ADMIN ? process.env.REACT_APP_ADMIN : "PapyrusAIAdmin";

  //create a use effect to get updated window size when user resizes window
  useEffect(() => {
    function handleResize() {
      setWindowWidth(window.innerWidth)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, []);

  useEffect(() => {
    //reset alert
    setAlert({ message: "", type: "info" });
    //Disconnect websocket if we leave page
    return () => {
      socket.current?.close();
      setShowTypingIndicator(false);
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
        conversationIndex: location.pathname.split("/")[5]
      });
      setIsLoading(true);

      //get user data
      Get(getUserData(location.pathname.split("/")[2]), controller.signal).then((res) => {
        if (res && res.status && res.status < 300) {
          if (res.data) {
            setViewUser(res.data);
            //Then connect to the websocket if user is the same as the one currenly logged in
            if (user && user.username === res.data.username) {
              onConnect(location.pathname.split("/")[3], location.pathname.split("/")[4], location.pathname.split("/")[5]);
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
      });

      Get(getCourse(location.pathname.split("/")[3]), controller.signal).then(res => {
        if (res && res.status && res.status < 300) {
          if (res.data) {
            //Get conversation list for this course/module
            setCourseInfo(res.data);
            setModuleInfo(res.data.modules.find((module: ModuleType) => module.id === location.pathname.split("/")[4]));
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
      });
      Get(
        getConversation(
          location.pathname.split("/")[3],
          location.pathname.split("/")[4],
          location.pathname.split("/")[5],
          location.pathname.split("/")[2]
        ),
        controller.signal).then((res: any) => {
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
              var sortedMessages = res.data.messages.sort((a: MessageType, b: MessageType) => parseInt(b.timestamp) - parseInt(a.timestamp));
              var contextCounter = 0;
              var reverse = sortedMessages.map((message: MessageType) => {
                contextCounter += num_tokens_from_messages([message]);
                if (contextCounter < 64000) { //64k context window
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
                error: ""
              })
            }
          } else if (res && res.status === 401) {
            navigator("/login");
          } else {
            // handle error
            if (res && res.status === 400) {
              //If convo doesn't exist, then return to convo list
              setAlert({ message: "Conversation not found", type: "error" });
              navigator(`/courses/${location.pathname.split("/")[3]}/modules/${location.pathname.split("/")[4]}`);
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
    if (moduleInfo && moduleInfo.raterEnabled !== undefined && moduleInfo.raterEnabled) {
      setShowWizard(false)
    } else {
      var visibleMessages = messages.filter(m => m.userVisible !== undefined && m.userVisible)
      if (viewUser &&
        user &&
        user.username === viewUser.username &&
        moduleInfo &&
        (moduleInfo.raterEnabled === undefined || !moduleInfo.raterEnabled) &&
        visibleMessages.length < 1 &&
        moduleInfo.prompts.length !== 0
      ) {
        setShowWizard(true)
      } else {
        setShowWizard(false)
      }
    }
  }, [viewUser, user, moduleInfo, messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  //ping every min or so to keep the websocket alive
  function ping() {
    if (isConnected) {
      setTimeout(() => {
        socket.current?.send(JSON.stringify({ "action": "pong" }));
        ping()
      }, 120000);
    }
  }
  useEffect(() => {
    if (isConnected) {
      ping()
    }
    // eslint-disable-next-line
  }, [isConnected])


  const onSocketOpen = useCallback(() => {
    setIsConnected(true);
  }, []);

  const onSocketClose = useCallback(() => {
    setIsConnected(false);
    //Then re-connect to the websocket if user is the same as the one currenly logged in
    if (user && viewUser && user.username === viewUser.username) {
      onConnect(location.pathname.split("/")[3], location.pathname.split("/")[4], location.pathname.split("/")[5]);
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
      }
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
      }
      if (messages) {
        setMessages((prev) => [...prev, essayMessage, essayResponseMessage]);
      }
      setShowWizard(false)
    } else if (returnData.status < 300) {
      const returnMessage: StreamMessageType = JSON.parse(returnData.data)
      //if we are still streaming and not finished
      if (returnMessage.messageType === "streamMessage" && !returnMessage.finished) {
        //if the current message id matches incoming message,
        // then add new message stream to it
        // else create a new message in list
        //Note: use message ref to get current state of messages
        // https://stackoverflow.com/questions/57847594/accessing-up-to-date-state-from-within-a-callback
        if (
          messagesRef.current &&
          messagesRef.current.length > 0 &&
          messagesRef.current[messagesRef.current.length - 1].stream &&
          messagesRef.current[messagesRef.current.length - 1].stream?.[0].id === returnMessage.id
        ) {
          setMessages((prev) => {
            if (prev && messagesRef.current) {
              var temp = [...messagesRef.current];
              if (temp[temp.length - 1].stream) {
                //add new stream message to list
                temp[temp.length - 1].stream?.push(returnMessage)
                const stream = temp[temp.length - 1].stream || []
                //remove duplicates (by timestamp AND message) and then sort by timestamp
                const filteredArray: StreamMessageType[] = stream.filter((obj, index, self) =>
                  index === self.findIndex((t) => t.timestamp === obj.timestamp && t.message === obj.message)
                )
                const reconstructed = filteredArray.sort((a, b) => a.timestamp - b.timestamp)
                  .map(m => m.message)
                  .join('');
                temp[temp.length - 1].content = reconstructed || temp[temp.length - 1].content;
              }
              return temp;
            } else return prev;
          })
        } else {
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
          }
          if (messages) {
            setMessages((prev) => [...prev, responseMessage]);
          }
        }
      } else if (returnMessage.finished && returnMessage.messageType === "finalMessage") {
        //if final message, update the message matching the id so that we know the words/stream is in order
        // Note: this section is overkill but always nice to have just in case since we take out duplcates
        // if stream id matches id it messages list
        if (
          messagesRef.current &&
          messagesRef.current.length > 0 &&
          messagesRef.current[messagesRef.current.length - 1].stream &&
          messagesRef.current[messagesRef.current.length - 1].stream?.[0].id === returnMessage.id
        ) {
          console.log("final message", returnMessage)
          setMessages((prev) => {
            if (prev && messagesRef.current) {
              var temp = [...messagesRef.current];
              temp[temp.length - 1].content = returnMessage.message;
              return temp;
            } else return prev;
          })
        }
      }

    } else {
      //update conversation data and handle errors
      setOpenErrorModal({ open: true, message: returnData.data });
      if (returnData.status === 400) {
        setOpenUpdateConvoModal(prev => ({ ...prev, completed: true }))
      }
    }
  }, [messages]);

  const onConnect = useCallback((courseId: string, moduleId: string, conversationIndex: string) => {
    if (socket.current?.readyState !== WebSocket.OPEN && process.env.REACT_APP_WEBSOCKET_URL) {
      var URL = process.env.REACT_APP_WEBSOCKET_URL;
      URL = URL + `?token=${localStorage.getItem("papyrusai_access_token")}`;
      URL = URL + `&courseId=${courseId}&moduleId=${moduleId}&index=${conversationIndex}&organization=${process.env.REACT_APP_ORGANIZATION}`
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
      var messagesToSend: Array<{ role: string, content: string }> = []
      messageList.map(message => {
        if (message.content.length > 100000) {
          setChatError("Message Too Long");
          return ""
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
          }
          setMessages((prev) => [...prev, responseMessage]);
          messagesToSend.push({
            "role": "user", "content": message.content
          })
          return ""
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
        autoCreateConvoName(messagesToSend)
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
        }
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
      const messageTempId = tempTimestamp + "" + Math.floor(100000 + Math.random() * 900000);
      var responseMessage: MessageType = {
        id: tempTimestamp.toString(),
        content: newMessage,
        messageType: newMessage.length < 1000 ? "text" : "file",
        role: "user",
        sender: "username",
        timestamp: messageTempId,
        promptId: null
      }
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

  function autoCreateConvoName(messages: Array<{ role: string, content: string }>) {
    if (user) {
      Post(postAutoCreateConvoName(
        openUpdateConvoModal.courseId,
        openUpdateConvoModal.moduleId,
        openUpdateConvoModal.index.toString(),
        user?.username
      ), { messages: messages }).then(res => {
        if (res && res.status && res.status < 300) {
          if (res.data) {
            //update conversation list with new conversation list
            setOpenUpdateConvoModal({
              open: false,
              deleteOpen: false,
              courseId: location.pathname.split("/")[3],
              moduleId: location.pathname.split("/")[4],
              index: location.pathname.split("/")[5],
              name: res.data.conversations[location.pathname.split("/")[5]].name,
              isDeleted: res.data.conversations[location.pathname.split("/")[5]].isDeleted,
              completed: res.data.conversations[location.pathname.split("/")[5]].completed ? res.data.conversations[location.pathname.split("/")[5]].completed : false,
              error: ""
            });
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          // handle error
          setOpenErrorModal({ open: true, message: "Something went wrong. Try again later" });
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
        const actualPrompt = moduleInfo.prompts.filter(x => x.id === selectedPrompt);
        const tempTimestamp = Date.now();
        const messageTempId = tempTimestamp + "" + Math.floor(100000 + Math.random() * 900000);
        var responseMessage: MessageType = {
          id: tempTimestamp.toString(),
          content: actualPrompt && actualPrompt.length > 0 ? actualPrompt[0].prompt : "",
          messageType: (actualPrompt && actualPrompt.length > 0 ? actualPrompt[0].prompt : "").length < 1000 ? "text" : "file",
          role: "user",
          sender: "username",
          timestamp: messageTempId,
          promptId: actualPrompt[0].id
        }
        messagesToSend.unshift(responseMessage);
      }
      //Send full message objects
      onSendMessage(messagesToSend, autoCreateConvoName);
    }
  }

  function handleWizardReturnEssay(essay: string, message?: string) { //right now message is a prompt
    setIsLoading(true);
    //check that message length is less that 100000
    setChatError(undefined);
    var actualPrompt;
    if (message && moduleInfo) {
      actualPrompt = moduleInfo.prompts.filter(x => x.id === message);
    }
    if (essay.length < 100000 && essay.length > 150) {
      onSendEssay(essay, actualPrompt && actualPrompt.length > 0 ? actualPrompt[0].prompt : "");
      //set temp essay message
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
        expandableMessage: "Loading...",
      }
      if (messages && message && moduleInfo && moduleInfo.showInitialPrompt) {
        //only show if module settings show init prompt true
        //set temp prompt message
        const tempTimestamp2 = Date.now();
        const messageTempId2 = tempTimestamp + "" + Math.floor(100000 + Math.random() * 900000);
        var responseMessage2: MessageType = {
          id: tempTimestamp2.toString(),
          content: actualPrompt && actualPrompt.length > 0 ? actualPrompt[0].prompt : "",
          messageType: (actualPrompt && actualPrompt.length > 0 ? actualPrompt[0].prompt : "").length < 1000 ? "text" : "file",
          role: "user",
          sender: user ? user.name : "You",
          timestamp: messageTempId2,
          promptId: actualPrompt ? actualPrompt[0].id : null,
          userVisible: moduleInfo?.showInitialPrompt ? true : false,
          raterReference: "",
          expandableMessage: "",
        }
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
    messages.forEach(message => {
      num_tokens = num_tokens + Math.ceil(message["content"].length / 4);
    });
    return num_tokens;
  }

  function downloadChat() {
    if (courseInfo && moduleInfo && messages && viewUser && conversationIds) {
      setIsLoading(true);
      var fileData = courseInfo.name + "\n" +
        moduleInfo.name + "\n" + courseInfo.instructor.name + " " +
        courseInfo.instructor.family_name + "\n";
      if (user) {
        fileData += "User: " + user.email + "\n";
      }
      const isInstructor = user && (user.groups.includes(admin) || user.groups.includes(instructor))
      messages.forEach((message, index) => {
        //If instructor, then download all messages
        // else dont download if module.showInitialPrompt is false OR hidden messages
        if (!moduleInfo.showInitialPrompt && index === 0 && !isInstructor) {
          //if dont showing init prompt and it is the first message and we are not an instructor, then dont add message to text
        } else if (message.userVisible !== undefined && !message.userVisible && !isInstructor) {
          //If the message is hidden and we are not an instructor, then dont add the message to text
        } else {
          var dateTime = new Date(parseInt(message.id.substring(0, 13), 10)).toLocaleString();
          var sender = message.sender === "ChatGPT" ? "Papyrus" : viewUser.name + " " + viewUser.family_name;
          fileData += sender + " - " + dateTime + "\n" + message.content + "\n\n";
        }
      })
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
      const messageTempId = tempTimestamp + "" + Math.floor(100000 + Math.random() * 900000);
      var responseMessage: MessageType = {
        id: tempTimestamp.toString(),
        content: docText,
        messageType: docText.length < 1000 ? "text" : "file",
        role: "user",
        sender: "username",
        timestamp: messageTempId,
        promptId: null
      }
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
      const messageTempId = tempTimestamp + "" + Math.floor(100000 + Math.random() * 900000);
      var responseMessage: MessageType = {
        id: tempTimestamp.toString(),
        content: text,
        messageType: text.length < 1000 ? "text" : "file",
        role: "user",
        sender: "username",
        timestamp: messageTempId,
        promptId: null
      }
      onSendMessage([responseMessage], autoCreateConvoName);
    } else if (text.length < 1) {
      setChatError("Message Too Short");
    } else {
      setChatError("Message Too Long");
    }
  }

  function handleConverstionNameDeleteUpdate(
    convoUpdateObject: {
      open: boolean,
      courseId: string,
      moduleId: string,
      index: string,
      name: string,
      isDeleted: boolean,
      error: string
    }
  ) {
    if (convoUpdateObject.isDeleted) {
      setIsLoading(true);
      Post(postUpdateConversation(
        convoUpdateObject.courseId,
        convoUpdateObject.moduleId,
        convoUpdateObject.index.toString()
      ), { isDeleted: convoUpdateObject.isDeleted }).then(res => {
        if (res && res.status && res.status < 300) {
          if (res.data) {
            //update conversation list with new conversation list
            setOpenUpdateConvoModal({
              open: false,
              deleteOpen: false,
              courseId: location.pathname.split("/")[3],
              moduleId: location.pathname.split("/")[4],
              index: location.pathname.split("/")[5],
              name: res.data.conversations[location.pathname.split("/")[5]].name,
              isDeleted: res.data.conversations[location.pathname.split("/")[5]].isDeleted,
              completed: res.data.conversations[location.pathname.split("/")[5]].completed ? res.data.conversations[location.pathname.split("/")[5]].completed : false,
              error: ""
            });
            navigator(`/courses/${location.pathname.split("/")[3]}/modules/${location.pathname.split("/")[4]}`)
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          // handle error
          setOpenErrorModal({ open: true, message: "Something went wrong. Try again later" });
        }
        setIsLoading(false);
      });
    } else {
      if (convoUpdateObject.name.length > 260) {
        setOpenUpdateConvoModal(prev => ({ ...prev, error: "Name is too long" }))
      } else if (convoUpdateObject.name.length === 0) {
        setOpenUpdateConvoModal(prev => ({ ...prev, error: "Name cannot be empty" }))
      } else {
        setIsLoading(true);
        Post(postUpdateConversation(
          convoUpdateObject.courseId,
          convoUpdateObject.moduleId,
          convoUpdateObject.index.toString()
        ), { name: convoUpdateObject.name }).then(res => {
          if (res && res.status && res.status < 300) {
            if (res.data) {
              //update conversation list with new conversation list
              setOpenUpdateConvoModal({
                open: false,
                deleteOpen: false,
                courseId: location.pathname.split("/")[3],
                moduleId: location.pathname.split("/")[4],
                index: location.pathname.split("/")[5],
                name: res.data.conversations[location.pathname.split("/")[5]].name,
                isDeleted: res.data.conversations[location.pathname.split("/")[5]].isDeleted,
                completed: res.data.conversations[location.pathname.split("/")[5]].completed ? res.data.conversations[location.pathname.split("/")[5]].completed : false,
                error: ""
              });
            }
          } else if (res && res.status === 401) {
            navigator("/login");
          } else {
            // handle error
            setOpenErrorModal({ open: true, message: "Something went wrong. Try again later" });
          }
          setIsLoading(false);
        });
      }
    }
  }

  return !isLoading && courseInfo && conversationIds && moduleInfo ? (
    <div className="chat">
      <Modal
        isOpen={openErrorModal.open}
        title={"We ran into an error!"}
        onRequestClose={() => setOpenErrorModal({ open: false, message: "" })}
        actions={
          <>
            <Button
              variant="contained"
              color="primary"
              onClick={(e) => {
                setOpenErrorModal({ open: false, message: "" })
                navigator(`/courses/${courseInfo.id}/modules/${moduleInfo.id}`)
              }}
            >
              Back to Conversation List
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => setOpenErrorModal({ open: false, message: "" })}>
              Close
            </Button>
          </>
        }
      >
        <div>{openErrorModal.message}</div>
      </Modal>
      <Modal
        isOpen={openDocumentModal}
        title={"Document Upload"}
        onRequestClose={() => setOpenDocumentModal(false)}
        actions={
          <Button sx={{ width: "100%" }} variant="contained" color="secondary" onClick={() => setOpenDocumentModal(false)}>
            Cancel
          </Button>
        }
      >
        <DocumentModal returnDocText={returnDocText} />
      </Modal>
      <Modal
        isOpen={openSpeechToTextModal}
        title={"Speech to Text"}
        onRequestClose={() => setOpenSpeechToTextModal(false)}
        actions={
          <Button sx={{ width: "100%" }} variant="contained" color="secondary" onClick={() => setOpenSpeechToTextModal(false)}>
            Cancel
          </Button>
        }
      >
        <SpeechToTextModal returnSpeechText={returnSpeakingText} />
      </Modal>
      <Modal
        isOpen={openUpdateConvoModal.deleteOpen}
        title={"Hide Conversation?"}
        onRequestClose={() => setOpenUpdateConvoModal(prev => ({ ...prev, deleteOpen: false }))}
        actions={
          <>
            <Button variant="contained" color="primary" onClick={(e) => handleConverstionNameDeleteUpdate({ ...openUpdateConvoModal, isDeleted: true })}>
              Submit
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => setOpenUpdateConvoModal(prev => ({ ...prev, deleteOpen: false }))}>
              Cancel
            </Button>
          </>
        }
      >
        <div>Are you sure you would like to hide this conversation? Instructors can still view hidden conversations.</div>
      </Modal>
      <Modal
        isOpen={openUpdateConvoModal.open}
        onRequestClose={() => setOpenUpdateConvoModal(prev => ({ ...prev, open: false }))}
        title="Rename Conversation"
        actions={
          <Button
            sx={{ width: "100%" }}
            variant="contained"
            onClick={() => handleConverstionNameDeleteUpdate(openUpdateConvoModal)}
          >
            Submit
          </Button>
        }
      >
        <div>
          <TextField
            name="name"
            label="Conversation Name"
            autoFocus
            fullWidth
            sx={{ margin: ".5rem 0" }}
            value={openUpdateConvoModal.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
              setOpenUpdateConvoModal(prev => ({ ...prev, name: e.target.value }))
            }}
            error={openUpdateConvoModal.error !== ""}
            helperText={openUpdateConvoModal.error}
            disabled={isLoading}
          />
        </div>
      </Modal>
      <div className="chat__fixed-top">
        <div className="chat__section-header">
          <div className="chat__section-header__title">
            <Tooltip title={"Back to Conversations"}>
              <IconButton
                onClick={() => (user && viewUser && user.username !== viewUser.username) ?
                  navigator(`/courses/${courseInfo.id}/modules/${moduleInfo.id}/username/${viewUser.username}`) :
                  navigator(`/courses/${courseInfo.id}/modules/${moduleInfo.id}`)
                }
                aria-label="Back to conversations"
              >
                <ArrowBackIosIcon />
              </IconButton>
            </Tooltip>
            <div style={windowWidth < 1024 ? { textAlign: "center" } : { textAlign: "left" }}>
              <h5>{openUpdateConvoModal.name}</h5>
              <div>{viewUser ? viewUser.name + " " + viewUser.family_name : ""}</div>
            </div>
            {windowWidth < 1024 && (
              <div>
                <IconButton
                  id="chat-button"
                  aria-controls={open ? 'chat-menu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={open ? 'true' : undefined}
                  onClick={handleClick}
                  aria-label="settings"
                >
                  <MoreVertIcon />
                </IconButton>
              </div>
            )}
          </div>
          <Menu
            id="chat-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            MenuListProps={{
              'aria-labelledby': 'chat-menu-button',
            }}
          >
            <MenuItem onClick={() => {
              handleClose()
              setOpenUpdateConvoModal(prev => ({ ...prev, open: true }))
            }}>
              Rename
            </MenuItem>
            <MenuItem onClick={downloadChat}>Download</MenuItem>
            {user &&
              viewUser &&
              user.username === viewUser.username && (
                <MenuItem onClick={() => {
                  handleClose()
                  setOpenUpdateConvoModal(prev => ({ ...prev, deleteOpen: true }))
                }}>
                  Hide Conversation
                </MenuItem>
              )}
          </Menu>
          {windowWidth > 1024 && (
            <div style={{ display: "flex", flexDirection: "row" }}>
              <div>
                <div>{courseInfo.name} &nbsp; {moduleInfo.name}</div>
                <div>{courseInfo.instructor.name + " " + courseInfo.instructor.family_name}&nbsp;</div>
              </div>
              <div>
                <IconButton
                  id="chat-button"
                  aria-controls={open ? 'chat-menu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={open ? 'true' : undefined}
                  onClick={handleClick}
                  aria-label="settings"
                >
                  <MoreVertIcon />
                </IconButton>
              </div>
            </div>
          )}
        </div>
        <div style={{ padding: "0.4rem", paddingTop: "1.8rem" }}>{moduleInfo.moduleDescription}</div>
        <div style={{ margin: "0.5rem 0" }}>
          For more information on how to converse with the AI, please see the&nbsp;
          {user?.groups.includes(process.env.REACT_APP_INSTRUCTOR ? process.env.REACT_APP_INSTRUCTOR : "PapyrusAIInstructors") ? <a
            href="https://docs.google.com/document/d/1o3He0CdgV7hJOX65gc3Gpf3_Fr3GYvSm4Q-i-Y5cNHQ/edit?tab=t.0#heading=h.7e2lilt0vxyx"
            target="_blank" rel="noreferrer">“Starting a Conversation” section of our user guide
          </a> : (
            <a
              href="https://docs.google.com/document/d/1hVXs5RwWi8Pau1YlhwoF5Y5zO3-1hMZAyUxych7iIDo/edit?tab=t.0#heading=h.ap3bxaogq8pi"
              target="_blank" rel="noreferrer">“Starting a Conversation” section of our user guide
            </a>
          )}
          .
        </div>
        {/* Show the rater essay wizard if rater enabled and we have no prev messages. Show normal prompt wizard afterwards.  */}
        {/* Only show the chat wizard if we don't have selected prompt and if there are no previous messages  */}
        {user &&
          viewUser &&
          user.username === viewUser.username &&
          (messages.length < 1) &&
          moduleInfo && moduleInfo.raterEnabled !== undefined && moduleInfo.raterEnabled && (
            <EssayWizard
              prompts={moduleInfo.prompts && moduleInfo.prompts.length > 0 ? moduleInfo.prompts : undefined}
              returnEssay={handleWizardReturnEssay}
            />
          )}
        {showWizard && (
          <ChatWizard
            prompts={moduleInfo.prompts}
            returnPrompt={handleWizardReturnPrompts}
          />
        )}
      </div>

      &nbsp;&nbsp;&nbsp;

      <Box className="chat__chat-log">
        {/* list of messages  */}
        {/* handle hidden messages  */}
        {/* handle messages that can be clicked on and have more information */}
        {messages.length > 0 && messages.map((message, index) => {
          if (message.role === "assistant") {
            return (
              <div key={index} >
                {index === messages.findIndex((message: MessageType) => !message.inContext) ? (
                  <div className="chat__chat-log__in-context">
                    <span>
                      In Context
                    </span>
                  </div>
                ) : null}
                <div key={index} className={index.toString()}>
                  <MessageLeft
                    message={message.content}
                    displayName={message.sender === "ChatGPT" ? "Papyrus" : message.sender}
                    messageType={message.messageType}
                    outOfContext={message.inContext ? true : false}
                    visible={(message.userVisible === undefined || message.userVisible) ? true : false}
                    expandableMessage={message.expandableMessage && message.expandableMessage !== "" ? message.expandableMessage : undefined}
                    isInstructor={(user?.groups.includes(instructor) || user?.groups.includes(admin)) ? true : false}
                  />
                </div>
              </div>
            )
          } else {
            return (
              <div key={index} >
                {index === messages.findIndex((message: MessageType) => !message.inContext) ? (
                  <div className="chat__chat-log__in-context">
                    <span>
                      In Context
                    </span>
                  </div>
                ) : null}
                {(!moduleInfo.showInitialPrompt && message.promptId) ? (
                  //dont show message if module doesn't want prompts shown
                  <></>
                ) : (
                  <div key={index} className={index.toString()}>
                    <MessageRight
                      message={message.content}
                      displayName={viewUser?.name}
                      messageType={message.messageType}
                      outOfContext={message.inContext ? true : false}
                      visible={(message.userVisible === undefined || message.userVisible) ? true : false}
                      isInstructor={(user?.groups.includes(instructor) || user?.groups.includes(admin)) ? true : false}
                    />
                  </div>
                )}
              </div>
            )
          }
        })}

        {showTypingIndicator && (
          <MessageLeft
            message={""}
            displayName={"Papyrus"}
            typing
          />
        )}

        {/* handles scrolling to the bottom */}
        <div ref={messagesEndRef} />

        {openUpdateConvoModal.completed && (
          <div style={{ textAlign: "center" }}>
            <hr />
            <div style={{ paddingBottom: "0.8rem" }}>This conversation has been flagged as inappropriate for this setting. Please start a new conversation.</div>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                navigator(`/courses/${courseInfo.id}/modules/${moduleInfo.id}`)
              }}
            >Back to Conversation List</Button>
          </div>
        )}
        {/* continuedInteraction input (if there are no more repeating prompts) */}
        {isConnected &&
          user &&
          viewUser &&
          user.username === viewUser.username &&
          selectedPrompt !== undefined &&
          moduleInfo.continuedInteraction && //continuedInteraction deprecated
          !showWizard &&
          !openUpdateConvoModal.completed &&
          (
            <div className="chat__input-form">
              <form onSubmit={handleSubmit}>
                <FormControl sx={{ m: 1, width: '100%', margin: "0" }} variant="outlined">
                  <InputLabel htmlFor="outlined-adornment-message">Send a message</InputLabel>
                  <OutlinedInput
                    id="outlined-adornment-message"
                    label="Send a message"
                    sx={{ width: "100%" }}
                    value={newMessage}
                    disabled={isLoading}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      //check that message length is less that 100000
                      setChatError(undefined);
                      if (e.target.value.length < 100000) {
                        setNewMessage(removeSpecialCharacters(e.target.value))
                      } else {
                        setChatError("Message Too Long");
                      }
                    }}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="Speech to text"
                          edge="end"
                          onClick={() => {
                            handleAddClose()
                            setOpenSpeechToTextModal(true)
                          }}
                        >
                          {<MicIcon />}
                        </IconButton>
                        &nbsp;&nbsp;&nbsp;
                        <IconButton
                          aria-label="sumbit new message"
                          edge="end"
                          type="submit"
                        >
                          {<SendIcon />}
                        </IconButton>
                      </InputAdornment>
                    }
                    startAdornment={
                      <>
                        <InputAdornment position="start">
                          <IconButton
                            aria-label="add file"
                            edge="start"
                            type="button"
                            id="add-button"
                            aria-controls={addOpen ? 'add-menu' : undefined}
                            aria-haspopup="true"
                            aria-expanded={addOpen ? 'true' : undefined}
                            onClick={() => {
                              handleAddClose()
                              setOpenDocumentModal(true)
                            }}
                          >
                            {<AttachFileIcon />}
                          </IconButton>
                        </InputAdornment>
                      </>
                    }
                    multiline
                    maxRows={6}
                    onKeyDown={(e: any) => {
                      if (e.keyCode === 13 && e.shiftKey) {
                        e.preventDefault();
                        setNewMessage(prev => prev + "\n");
                      } else if (e.keyCode === 13 && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />
                </FormControl>
              </form>
              {/* handle repeating prompts (Note: take out for now)  */}
              {/* {isConnected &&
                selectedPrompt !== undefined &&
                messages.length > 0 &&
                moduleInfo.isRepeating &&
                moduleInfo.prompts.filter(x => !repeatingPrompts.includes(x.id)).length > 0 && (
                  <div>
                    <RepeatingPromptWizard
                      // filtering the repeating prompts from this list
                      prompts={moduleInfo.prompts.filter(x => !repeatingPrompts.includes(x.id))}
                      onlyPrompts={handleRepeatPrompt}
                    />
                  </div>
                )} */}
              {chatError ? (
                <Alert severity={"error"}>{chatError}</Alert>
              ) : null}
            </div>
          )}
        &nbsp;&nbsp;&nbsp;
      </Box>
    </div >
  ) : (
    <LinearProgress />
  )
}