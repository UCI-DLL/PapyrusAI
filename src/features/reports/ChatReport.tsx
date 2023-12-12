import React, { useEffect, useState, useRef, useContext } from "react";
import { MessageLeft, MessageRight } from "../../components/Message";
import { Box, Menu, MenuItem } from "@mui/material";
import IconButton from '@mui/material/IconButton';
import { useLocation, useNavigate } from "react-router";
import Get from "../../utility/Get";
import { getConversation } from "../../utility/endpoints/ConversationEndpoints";
import LinearProgress from '@mui/material/LinearProgress';
import { getCourse } from "../../utility/endpoints/CourseEndpoints";
import { MessageType } from "../../utility/types/ConversationTypes";
import { CourseType, ModuleType } from "../../utility/types/CourseTypes";
import { AlertContext } from "../../utility/context/AlertContext";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { getUserData } from "../../utility/endpoints/UserEndpoints";
import { UserType } from "../../utility/types/UserTypes";


export default function ChatReport(): JSX.Element {
  const location = useLocation();
  let navigator = useNavigate();
  const [conversationIds, setConversationIds] = useState<{
    courseId: string,
    moduleId: string,
    conversationIndex: string
  }>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [messages, setMessages] = useState<Array<MessageType>>([]);
  const [courseInfo, setCourseInfo] = useState<CourseType>();
  const [moduleInfo, setModuleInfo] = useState<ModuleType>();
  const { setAlert } = useContext(AlertContext);
  //This is for when instructors or researchers are looking up a different student
  const [viewUser, setViewUser] = useState<UserType>();
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
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
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // get convo based on different user
    if (
      location.state &&
      location.state.courseId &&
      location.state.moduleId &&
      location.state.conversationIndex !== undefined &&
      location.pathname &&
      location.pathname.split("/") &&
      location.pathname.split("/")[2]
    ) {
      setConversationIds(location.state);
      setIsLoading(true);
      Get(getCourse(location.state.courseId), controller.signal).then(res => {
        if (res && res.status && res.status < 300) {
          if (res.data) {
            //Get conversation list for this course/module
            setCourseInfo(res.data);
            setModuleInfo(res.data.modules.find((module: ModuleType) => module.id === location.state.moduleId));
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
          location.state.courseId,
          location.state.moduleId,
          location.state.conversationIndex,
          location.pathname.split("/")[2]
        ),
        controller.signal).then(res => {
          if (res && res.status && res.status < 300) {
            if (res.data && res.data.messages) {
              //Get list of messages for the conversation
              //make sure the messages are in timestamp order
              // also label the messages that are in context window for chatgpt
              var sortedMessages = res.data.messages.sort((a: MessageType, b: MessageType) => parseInt(b.timestamp) - parseInt(a.timestamp));
              var contextCounter = 0;
              var reverse = sortedMessages.map((message: MessageType) => {
                contextCounter += num_tokens_from_messages([message]);
                if (contextCounter < 16000) { //16k context window
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

      //get user details
      Get(getUserData(location.pathname.split("/")[2]), controller.signal).then((res) => {
        if (res && res.status && res.status < 300) {
          if (res.data) {
            setViewUser(res.data);
          }
        } else {
          if (res === undefined) {
          } else {
            //handle error
            // setError("Could not find user")
          }
        }
      });
    } else {
      //If we didnt get a state, then redirect to course list
      setAlert({ message: "Could not find conversation", type: "error" });
      navigator("/reports");
    }

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line
  }, [location]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
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
          <h5>{moduleInfo.name + "a super long name for a module"}</h5>
          <div style={{ display: "flex", flexDirection: "row" }}>
            <div>
              <div>{courseInfo.name}</div>
              <div>{courseInfo.instructor.name + " " + courseInfo.instructor.family_name}</div>
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
        <hr />
        <div className="chat__section-header">
          <div>{`${viewUser?.name} ${viewUser?.family_name}`}</div>
        </div>
        <hr />

      </div>

      <Box className="chat__chat-log">
            {/* list of messages  */}
            {messages.length > 0 && messages.map((message, index) => {
              if (message.role === "assistant") {
                return (
                  <div key={index} className={index.toString()}>
                    <MessageLeft
                      message={message.content}
                      displayName={message.sender === "ChatGPT" ? "Paige" : message.sender}
                      messageType={message.messageType}
                      outOfContext={message.inContext ? true : false}
                    />
                  </div>
                )
              } else {
                return (
                  <div key={index} className={index.toString()}>
                    <MessageRight
                      message={message.content}
                      displayName={viewUser?.name}
                      messageType={message.messageType}
                      outOfContext={message.inContext ? true : false}
                    />
                  </div>
                )
              }
            })}

            {/* handles scrolling to the bottom */}
            <div ref={messagesEndRef} />
          </Box>

      &nbsp;&nbsp;&nbsp;



    </div >
  ) : (
    <LinearProgress />
  )
}