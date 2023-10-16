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
import { CourseType, ModuleType, DocumentType } from "../../utility/types/CourseTypes";
import ChatWizard from "./ChatWizard";


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
  const [promptsCompleted, setPromptsCompleted] = useState<boolean>(false);

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
            //Get conversation list for this course/module
            setCourseInfo(res.data);
            setModuleInfo(res.data.modules.find((module: ModuleType) => module.id === location.state.moduleId));
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
            if (res.data.messages.length > 0) {
              //Init user docs and selected prompt
              //Use temp stuff for now
              setUserDocuments([]);
              setSelectedPrompt("");
            }
            //Get list of messages for the conversation
            //make sure the messages are in timestamp order
            setMessages(res.data.messages.sort((a: MessageType, b: MessageType) => parseInt(a.timestamp) - parseInt(b.timestamp)));
            //Then connect to the websocket
            onConnect(location.state.courseId, location.state.moduleId, location.state.conversationIndex)
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

  useEffect(() => {
    //check to see if the repeating prompts are completed
    if (
      moduleInfo &&
      moduleInfo.isRepeating &&
      moduleInfo.prompts.length === repeatingPrompts.length
      //TODO figure out if past messages has completed the all repeating prompts
      // so we dont get the repeating prompt wizard on reload
    ) {
      setPromptsCompleted(true);
    } else if ( //set as true if we are not repeating
      moduleInfo &&
      !moduleInfo.isRepeating
    ) {
      setPromptsCompleted(true);
    } else {
      setPromptsCompleted(false);
    }
  }, [moduleInfo, repeatingPrompts, selectedPrompt, messages]);

  const onSocketOpen = useCallback(() => {
    // console.log("connected")
    setIsConnected(true);
  }, []);

  const onSocketClose = useCallback(() => {
    setIsConnected(false);
  }, []);

  const onSocketMessage = useCallback((dataStr: string) => {
    //Only the message as a string comes back so make some temp stuff for the message
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

  const onSendMessage = useCallback((messageList: Array<string>) => {
    //save message in message array
    if (messages) {
      var messagesToSend: Array<{role: string, content: string}> = []
      messageList.map(message => {
        //temp convert message to message type
        const tempTimestamp = Date.now();
        const messageTempId = tempTimestamp + "" + Math.floor(100000 + Math.random() * 900000);
        var responseMessage: MessageType = {
          id: tempTimestamp.toString(),
          content: message,
          messageType: "text",
          role: "user",
          sender: "username",
          timestamp: messageTempId
        }
        setMessages((prev) => [...prev, responseMessage]);
        messagesToSend.push({
          "role": "user", "content": message
        })
        return ""
      });

      socket.current?.send(JSON.stringify({
        "action": "sendMessage",
        "messages": messagesToSend
      }));
    }
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSendMessage([newMessage]);
    //Then reset newMessage
    setNewMessage("");
  }

  function handleWizardReturnDocsPrompts(userDocs: Array<DocumentType & { document: string }>, selectedPrompt: string) {
    setSelectedPrompt(selectedPrompt);
    setUserDocuments(userDocs);
    setRepeatingPrompts([selectedPrompt]);
    if (courseInfo && moduleInfo) {
      //send prompts and docs to chatgtp
      var messagesToSend = userDocs.map(doc => {
        return `Reference the following ${doc.documentType}: ${doc.document}`
      });
      //sent newly selected prompt to chatgpt
      const actualPrompt = moduleInfo.prompts.filter(x => x.id === selectedPrompt);
      messagesToSend.push(actualPrompt && actualPrompt.length > 0 ? actualPrompt[0].prompt : "")
      onSendMessage(messagesToSend);
    }
  }

  function handleRepeatPrompt(selectedPrompt: string) {
    if (courseInfo && moduleInfo) {
      setSelectedPrompt(selectedPrompt);
      //Add newly selected prompt to the list of repeating prompts
      setRepeatingPrompts((prev) => [...prev, selectedPrompt]);
      //sent newly selected prompt to chatgpt
      const actualPrompt = moduleInfo.prompts.filter(x => x.id === selectedPrompt);
      onSendMessage([actualPrompt && actualPrompt.length > 0 ? actualPrompt[0].prompt : ""]);
    }
  }


  return !isLoading && courseInfo && conversationIds && moduleInfo ? (
    <div className="chat">
      <div className="chat__section-header">
        <h5>{moduleInfo.name}</h5>
        <div>
          <div>{courseInfo.name}</div>
          <div>{courseInfo.instructor.name + " " + courseInfo.instructor.familyName}</div>
        </div>
      </div>
      <hr />
      <div className="chat__section-header">
        <div>{moduleInfo.moduleDescription}</div>
      </div>
      <hr />
      {/* Only show the chat wizard if we don't have user documents, selected prompt, and if there are no previous messages  */}
      {(userDocuments === undefined && selectedPrompt === undefined && messages.length < 1) && (
        <ChatWizard
          documents={moduleInfo.documents}
          prompts={moduleInfo.prompts}
          returnDocsPrompt={handleWizardReturnDocsPrompts}
        />
      )}

      &nbsp;&nbsp;&nbsp;

      <Box className="chat__chat-log">
        {/* list of messages  */}
        {messages.length > 0 && messages.map((message, index) => {
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

        {/* handle repeating prompts  */}
        {isConnected &&
          userDocuments !== undefined &&
          selectedPrompt !== undefined &&
          messages.length > 0 &&
          moduleInfo.isRepeating &&
          moduleInfo.prompts.filter(x => !repeatingPrompts.includes(x.id)) && (
            <div>
              <ChatWizard
                // filtering the repeating prompts from this list
                documents={moduleInfo.documents}
                prompts={moduleInfo.prompts.filter(x => !repeatingPrompts.includes(x.id))}
                returnDocsPrompt={handleWizardReturnDocsPrompts}
                onlyPrompts={handleRepeatPrompt}
              />
            </div>
          )}

        {/* continuedInteraction input (if there are no more repeating prompts) */}
        {isConnected &&
          userDocuments !== undefined &&
          selectedPrompt !== undefined &&
          moduleInfo.continuedInteraction &&
          promptsCompleted && (
            <form onSubmit={handleSubmit}>
              <FormControl sx={{ m: 1, width: '100%', margin: "0" }} variant="outlined">
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
          )}

        &nbsp;&nbsp;&nbsp;
      </Box>
    </div >
  ) : (
    <LinearProgress />
  )
}