import React, { useEffect, useState, useCallback, useRef, useContext } from "react";
import { MessageLeft, MessageRight } from "../../components/Message";
import { Box, Alert, Menu, MenuItem } from "@mui/material";
import IconButton from '@mui/material/IconButton';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import SendIcon from '@mui/icons-material/Send';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import { useLocation, useNavigate } from "react-router";
import Get from "../../utility/Get";
import { getConversation } from "../../utility/endpoints/ConversationEndpoints";
import LinearProgress from '@mui/material/LinearProgress';
import { getCourse } from "../../utility/endpoints/CourseEndpoints";
import { MessageType } from "../../utility/types/ConversationTypes";
import { CourseType, ModuleType, DocumentType } from "../../utility/types/CourseTypes";
import ChatWizard from "./ChatWizard";
import { AlertContext } from "../../utility/context/AlertContext";
import RepeatingPromptWizard from "./RepeatingPromptWizard";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { UserContext } from "../../utility/context/UserContext";
import { UserType } from "../../utility/types/UserTypes";
import { getUserData } from "../../utility/endpoints/UserEndpoints";


export default function Chat(): JSX.Element {
  const location = useLocation();
  let navigator = useNavigate();
  const [conversationIds, setConversationIds] = useState<{
    courseId: string,
    moduleId: string,
    conversationIndex: string
  }>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const socket = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Array<MessageType>>([]);
  const [courseInfo, setCourseInfo] = useState<CourseType>();
  const [moduleInfo, setModuleInfo] = useState<ModuleType>();
  const [newMessage, setNewMessage] = useState<string>("");
  const [userDocuments, setUserDocuments] = useState<Array<DocumentType & { document: string }> | undefined>();
  const [selectedPrompt, setSelectedPrompt] = useState<string | undefined>();
  //After a prompt has been selected, then add it to this list
  const [repeatingPrompts, setRepeatingPrompts] = useState<Array<string>>([]);
  const { setAlert } = useContext(AlertContext);
  const { user } = useContext(UserContext);
  const [viewUser, setViewUser] = useState<UserType>();
  const [showTypingIndicator, setShowTypingIndicator] = useState<boolean>(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const [chatError, setChatError] = useState<string | undefined>();
  //download menu in chat
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

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
            if (user && user.sub === res.data.sub) {
              onConnect(location.pathname.split("/")[3], location.pathname.split("/")[4], location.pathname.split("/")[5]);
            }
          }
        } else {
          if (res === undefined) {
          } else {
            //handle error
            setAlert({ message: "Could not find user", type: "error" });
            navigator("/dashboard");
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
          // setError("No Conversations Found");
        }
      });
      Get(
        getConversation(
          location.pathname.split("/")[3],
          location.pathname.split("/")[4],
          location.pathname.split("/")[5],
          location.pathname.split("/")[2]
        ),
        controller.signal).then(res => {
          if (res && res.status && res.status < 300) {
            if (res.data && res.data.messages) {
              if (res.data.messages.length > 0) {
                //Init user docs and selected prompt
                //Use temp stuff for now
                setUserDocuments([]);
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
          } else if (res && res.status === 401) {
            navigator("/login");
          } else {
            // handle error
            // setError("No Conversations Found");
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
    //if no documents are needed
    if (moduleInfo && moduleInfo.documents && moduleInfo.documents.length < 1) {
      setUserDocuments([])
    }
    //if no prompts => aka free chat
    if (moduleInfo && moduleInfo.prompts && moduleInfo.prompts.length < 1) {
      setUserDocuments([]);
      setSelectedPrompt("");
    }
  }, [moduleInfo, repeatingPrompts, selectedPrompt, messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    if (user && viewUser && user.sub === viewUser.sub) {
      onConnect(location.pathname.split("/")[3], location.pathname.split("/")[4], location.pathname.split("/")[5]);
    }
    // eslint-disable-next-line
  }, [location.pathname, user, viewUser]);

  const onSocketMessage = useCallback((dataStr: string) => {
    //turn off typing indicator for chatgpt
    setShowTypingIndicator(false);
    //Only the message as a string comes back so make some temp stuff for the message
    const tempTimestamp = Date.now();
    const messageTempId = tempTimestamp + "" + Math.floor(100000 + Math.random() * 900000);
    var responseMessage: MessageType = {
      id: tempTimestamp.toString(),
      content: dataStr,
      messageType: "text",
      role: "assistant",
      sender: "ChatGPT",
      timestamp: messageTempId,
      promptId: null,
    }
    if (messages) {
      setMessages((prev) => [...prev, responseMessage]);
    }
  }, [messages]);

  const onConnect = useCallback((courseId: string, moduleId: string, conversationIndex: string) => {
    if (socket.current?.readyState !== WebSocket.OPEN) {
      var URL = process.env.REACT_APP_WEBSOCKET_URL ? process.env.REACT_APP_WEBSOCKET_URL : "wss://ymaqouopq4.execute-api.us-east-2.amazonaws.com/production";
      URL = URL + `/?token=${localStorage.getItem("papyrusai_access_token")}`;
      URL = URL + `&courseId=${courseId}&moduleId=${moduleId}&index=${conversationIndex}`
      socket.current = new WebSocket(URL);
      socket.current.addEventListener('open', onSocketOpen);
      socket.current.addEventListener('close', onSocketClose);
      socket.current.addEventListener('message', (event) => {
        onSocketMessage(event.data);
      });
    }
  }, [onSocketClose, onSocketMessage, onSocketOpen]);



  const onSendMessage = useCallback((messageList: Array<MessageType>) => {
    //save message in message array
    setChatError(undefined);
    if (messages && isConnected) {
      //check that message length is less that 50000
      var messagesToSend: Array<{ role: string, content: string }> = []
      messageList.map(message => {
        if (message.content.length > 50000) {
          setChatError("Message Too Long");
          return ""
        } else {
          //temp convert message to message type
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
        "messages": messagesToSend
      }));
      //Set the typing indicator for chatgpt while we wait for a response
      setShowTypingIndicator(true);
    } else {
      setAlert({ message: "Something went wrong. Please try again", type: "error" });
    }
  }, [messages, isConnected, setAlert]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    //check that message length is less that 50000
    setChatError(undefined);
    if (newMessage.length < 50000 && newMessage.length > 0) {
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
      onSendMessage([responseMessage]);
      //Then reset newMessage
      setNewMessage("");
    } else if (newMessage.length < 1) {
      setChatError("Message Too Short");
    } else {
      setChatError("Message Too Long");
    }
  }

  function handleWizardReturnDocsPrompts(userDocs: Array<DocumentType & { document: string }>, selectedPrompt: string) {
    setSelectedPrompt(selectedPrompt);
    setUserDocuments(userDocs);
    setRepeatingPrompts([selectedPrompt]);
    if (courseInfo && moduleInfo) {
      //send prompts and docs to chatgtp
      var messagesToSend = userDocs.map(doc => {
        const tempTimestamp = Date.now();
        const messageTempId = tempTimestamp + "" + Math.floor(100000 + Math.random() * 900000);
        var responseMessage: MessageType = {
          id: tempTimestamp.toString(),
          content: `Reference the following ${doc.documentType}: ${doc.document}`,
          messageType: `Reference the following ${doc.documentType}: ${doc.document}`.length < 1000 ? "text" : "file",
          role: "user",
          sender: "username",
          timestamp: messageTempId,
          promptId: null
        }
        return responseMessage
      });
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
      onSendMessage(messagesToSend);
    }
  }

  function handleRepeatPrompt(selectedPrompt: string) {
    if (courseInfo && moduleInfo && selectedPrompt !== "") {
      setSelectedPrompt(selectedPrompt);
      //Add newly selected prompt to the list of repeating prompts
      setRepeatingPrompts((prev) => [...prev, selectedPrompt]);
      //sent newly selected prompt to chatgpt
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
      onSendMessage([responseMessage]);
    }
  }

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
      messages.forEach(message => {
        var dateTime = new Date(parseInt(message.id.substring(0, 13), 10)).toLocaleString();
        var sender = message.sender === "ChatGPT" ? "Papyrus" : viewUser.name + " " + viewUser.family_name;
        fileData += sender + " - " + dateTime + "\n" + message.content + "\n";
      })
      const blob = new Blob([fileData], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `${courseInfo.name}_${moduleInfo.name}_conversation${conversationIds.conversationIndex}.txt`;
      link.href = url;
      link.click();
      setIsLoading(false);
    }
  }

  return !isLoading && courseInfo && conversationIds && moduleInfo ? (
    <div className="chat">
      <div className="chat__fixed-top">
        <div className="chat__section-header">
          <div className="chat__section-header__title">
            <h5>{moduleInfo.name}</h5>
            <div>{viewUser ? viewUser.name + " " + viewUser.family_name : ""}</div>
          </div>

          <div style={{ display: "flex", flexDirection: "row" }}>
            <div>
              <div>{courseInfo.name} &nbsp;</div>
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
              <Menu
                id="chat-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                  'aria-labelledby': 'chat-menu-button',
                }}
              >
                <MenuItem onClick={downloadChat}>Download</MenuItem>
              </Menu>
            </div>
          </div>
        </div>

        <div style={{ padding: "0.4rem", paddingTop: "1.8rem" }}>{moduleInfo.moduleDescription}</div>
        {/* Only show the chat wizard if we don't have user documents, selected prompt, and if there are no previous messages  */}
        {user &&
          viewUser &&
          user.sub === viewUser.sub &&
          (messages.length < 1) && (moduleInfo.prompts.length !== 0 || moduleInfo.documents.length !== 0) && (
            <ChatWizard
              documents={moduleInfo.documents}
              prompts={moduleInfo.prompts}
              returnDocsPrompt={handleWizardReturnDocsPrompts}
            />
          )}
      </div>

      &nbsp;&nbsp;&nbsp;

      <Box className="chat__chat-log">
        {/* list of messages  */}
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

        {/* continuedInteraction input (if there are no more repeating prompts) */}
        {isConnected &&
          user &&
          viewUser &&
          user.sub === viewUser.sub &&
          userDocuments !== undefined &&
          selectedPrompt !== undefined &&
          moduleInfo.continuedInteraction &&
          (
            <div className="chat__input-form">
              <form onSubmit={handleSubmit}>
                <FormControl sx={{ m: 1, width: '100%', margin: "0", backgroundColor: "#FFF" }} variant="outlined">
                  <InputLabel htmlFor="outlined-adornment-message">Send a message</InputLabel>
                  <OutlinedInput
                    id="outlined-adornment-message"
                    label="Send a message"
                    sx={{ width: "100%", color: "black" }}
                    value={newMessage}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      //check that message length is less that 50000
                      setChatError(undefined);
                      if (e.target.value.length < 50000) {
                        setNewMessage(e.target.value)
                      } else {
                        setChatError("Message Too Long");
                      }
                    }}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="sumbit new message"
                          edge="end"
                          type="submit"
                        >
                          {<SendIcon />}
                        </IconButton>
                      </InputAdornment>
                    }
                  />
                </FormControl>
              </form>
              {/* handle repeating prompts  */}
              {isConnected &&
                userDocuments !== undefined &&
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
                )}
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