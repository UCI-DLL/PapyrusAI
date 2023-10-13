import React, { useEffect, useState, useCallback, useRef } from "react";
import { MessageLeft, MessageRight } from "../../components/Message";
import { Box } from "@mui/material";
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
import { CourseType } from "../../utility/types/CourseTypes";


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
  const [newMessage, setNewMessage] = useState<string>("");

  useEffect(() => {
    //Disconnect websocket if we leave page
    return () => {
      socket.current?.close();
    };
  }, []);

  useEffect(() => {
    if (location.state && location.state.courseId && location.state.moduleId && location.state.conversationIndex !== undefined) {
      setConversationIds(location.state);
      const controller = new AbortController();
      setIsLoading(true);
      Get(getCourse(location.state.courseId), controller.signal).then(res => {
        if (res.status && res.status < 300) {
          if (res.data) {
            console.log(res.data);
            //Get conversation list for this course/module
            setCourseInfo(res.data);
          }
        } else if (res.status === 401) {
          navigator("/login");
        } else {
          // handle error
          // setError("No Conversations Found");
        }
      });
      Get(getConversation(location.state.courseId, location.state.moduleId, location.state.conversationIndex), controller.signal).then(res => {
        if (res.status && res.status < 300) {
          if (res.data && res.data.messages) {
            console.log(res.data);
            //Get list of messages for the conversation
            //make sure the messages are in timestamp order
            setMessages(res.data.messages.sort((a: MessageType, b: MessageType) => parseInt(a.timestamp) - parseInt(b.timestamp)));
            //Then connect to the websocket
            onConnect()
          }
        } else if (res.status === 401) {
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
    // eslint-disable-next-line
  }, [location]);

  const onSocketOpen = useCallback(() => {
    console.log("connected")
    setIsConnected(true);
  }, []);

  const onSocketClose = useCallback(() => {
    setIsConnected(false);
  }, []);

  const onSocketMessage = useCallback((dataStr: string) => {
    //Only the message as a string comes back so make some temp stuff for the message
    if(isConnected) {
      console.log(dataStr);
      const tempTimestamp = Date.now();
      const messageTempId = tempTimestamp + "" + Math.floor(100000 + Math.random() * 900000);
      var responseMessage: MessageType = {
        id: tempTimestamp.toString(),
        content: dataStr,
        messageType: "text",
        role: "assistant",
        sender: "ChatGPT",
        timestamp: messageTempId
      }
      if (messages) {
        setMessages((prev) => [...prev, responseMessage]);
      }
    }
    
  }, [messages, isConnected]);

  const onConnect = useCallback(() => {
    if (socket.current?.readyState !== WebSocket.OPEN) {
      var URL = process.env.REACT_APP_WEBSOCKET_URL ? process.env.REACT_APP_WEBSOCKET_URL : "wss://ymaqouopq4.execute-api.us-east-2.amazonaws.com/production";
      URL = URL + `/?token=${localStorage.getItem("papyrusai_access_token")}`;
      URL = URL + `&courseId=${conversationIds?.courseId}&moduleId=${conversationIds?.moduleId}&index=${conversationIds?.conversationIndex}`
      socket.current = new WebSocket(URL);
      socket.current.addEventListener('open', onSocketOpen);
      socket.current.addEventListener('close', onSocketClose);
      socket.current.addEventListener('message', (event) => {
        onSocketMessage(event.data);
      });
    }
  }, [conversationIds, onSocketClose, onSocketMessage, onSocketOpen]);

  const onSendMessage = useCallback(() => {
    console.log("Sending message", newMessage);
    //save message in message array
    if (messages) {
      //temp convert message to message type
      const tempTimestamp = Date.now();
      const messageTempId = tempTimestamp + "" + Math.floor(100000 + Math.random() * 900000);
      var responseMessage: MessageType = {
        id: tempTimestamp.toString(),
        content: newMessage,
        messageType: "text",
        role: "user",
        sender: "username",
        timestamp: messageTempId
      }
      setMessages((prev) => [...prev, responseMessage]);
      socket.current?.send(JSON.stringify({
        "action": "sendMessage",
        "messages": [{
          "role": "user", "content": newMessage
        }]
      }));
      //Then reset newMessage
      setNewMessage("");
    }
  }, [messages, newMessage]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSendMessage();
  }

  return !isLoading && courseInfo && conversationIds ? (
    <div className="chat">
      <div className="chat__section-header">
        <h5>{courseInfo.modules.find(module => module.id === conversationIds?.moduleId)?.name}</h5>
        <div>
          <div>{courseInfo.name}</div>
          <div>{courseInfo.instructor.name + " " + courseInfo.instructor.familyName}</div>
        </div>
      </div>
      <hr />

      <Box className="chat__chat-log">
        {messages.map((message, index) => {
          if (message.role === "assistant") {
            return (
              <div key={index}>
                <MessageLeft
                  message={message.content}
                  displayName={message.sender}
                />
              </div>
            )
          } else {
            return (
              <div key={index}>
                <MessageRight
                  message={message.content}
                />
              </div>
            )
          }
        })}
        <form onSubmit={handleSubmit}>
          <FormControl sx={{ m: 1, width: '100%' }} variant="outlined">
            <InputLabel htmlFor="outlined-adornment-message">Send a message</InputLabel>
            <OutlinedInput
              id="outlined-adornment-message"
              label="Send a message"
              sx={{ width: "100%", color: "black" }}
              value={newMessage}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
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



        &nbsp;&nbsp;&nbsp;
      </Box>
    </div>
  ) : (
    <LinearProgress />
  )
}