import React from "react";
import { MessageLeft, MessageRight } from "../../components/Message";
import { Box } from "@mui/material";
import MessageOptions from "../../components/MessageOptions";
import IconButton from '@mui/material/IconButton';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import SendIcon from '@mui/icons-material/Send';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';


export default function Chat(): JSX.Element {
  const something = `The question of the meaning of life is one of the oldest and most profound philosophical inquiries, and it does not have a single, universally accepted answer. The meaning of life is a deeply subjective and philosophical concept, and it can vary from person to person based on their beliefs, values, and experiences.

  Ultimately, the meaning of life is a deeply personal and subjective matter. It may also evolve over time as a person's beliefs and experiences change. Some people find meaning in a combination of these perspectives, while others may continue to search for their own understanding of life's purpose. It's a question that has intrigued humanity for centuries and is likely to continue to do so.`

  return (
    <div className="chat">
      <div className="chat__section-header">
        <h5>Assignment #123</h5>
        <div>
          <div>Course 543</div>
          <div>Prof Name</div>
        </div>
      </div>
      <hr />

      <Box className="chat__chat-log">
        <MessageLeft
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
        </FormControl>

        &nbsp;&nbsp;&nbsp;
      </Box>
    </div>
  )
}