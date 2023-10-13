import React, { useEffect, useState } from "react";
import { MessageLeft, MessageRight } from "../../components/Message";
import { Box } from "@mui/material";
import MessageOptions from "../../components/MessageOptions";
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
  const [messages, setMessages] = useState<Array<MessageType>>();
  const [courseInfo, setCourseInfo] = useState<CourseType>();


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
            setMessages(res.data.messages);
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
  }, [location])

  return !isLoading && courseInfo && messages && conversationIds ? (
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


        &nbsp;&nbsp;&nbsp;
      </Box>
    </div>
  ) : (
    <LinearProgress />
  )
}



//Old template chat
// const something = `The question of the meaning of life is one of the oldest and most profound philosophical inquiries, and it does not have a single, universally accepted answer. The meaning of life is a deeply subjective and philosophical concept, and it can vary from person to person based on their beliefs, values, and experiences.

//   Ultimately, the meaning of life is a deeply personal and subjective matter. It may also evolve over time as a person's beliefs and experiences change. Some people find meaning in a combination of these perspectives, while others may continue to search for their own understanding of life's purpose. It's a question that has intrigued humanity for centuries and is likely to continue to do so.`
{/* <MessageLeft
          message={"This is the module description. You will ask our AI for feedback on your most recent essay."}
          displayName="Prof Name"
        />
        <MessageLeft
          message={"Please select the type of feedback you would like to receive."}
          displayName="Prof Name"
        />
        <MessageOptions 
          message={"Select an option."}
          options={[
            {title: "Option 1", message: "This is the actual message that will be sent to the AI chatbot"}, 
            {title: "Option 2", message: "This is the actual message that will be sent to the AI chatbot"},
            {title: "Option 3", message: "This is the actual message that will be sent to the AI chatbot"}
          ]}
        />
        <MessageRight
          message={"This is the actual message that will be sent to the AI chatbot. This will be determined by the selected option above."}
        />
        <MessageLeft
          message={"This is the message returned from the AI chatbot. Here is an example:  I think this is an accurate and appropriate claim, but what evidence best supports this claim? Next time, try integrating evidence from a source that best supports your claim."}
          displayName="AI Chatbot"
        />
        <MessageLeft
          message={"You can now ask AI any questions you like."}
          displayName="Prof Name"
        />
        <MessageRight
          message={"What is the meaning of life?"}
        />
        <MessageLeft
          message={something}
          displayName="AI Chatbot"
        />
        <FormControl sx={{ m: 1, width: '100%' }} variant="outlined">
          <InputLabel htmlFor="outlined-adornment-password">Send a message</InputLabel>
          <OutlinedInput
            id="outlined-adornment-password"
            label="Send a message"
            sx={{width: "100%", color: "black"}}
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  edge="end"
                >
                  {<SendIcon />}
                </IconButton>
              </InputAdornment>
            }
          />
        </FormControl> */}