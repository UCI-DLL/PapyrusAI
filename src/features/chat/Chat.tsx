import React from "react";
import { MessageLeft, MessageRight } from "../../components/Message";
import { Box } from "@mui/material";
import MessageOptions from "../../components/MessageOptions";


export default function Chat(): JSX.Element {


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
          message={"This is the module description. This will explain to students the assignment"}
          displayName="Kristi"
        />
        <MessageOptions 
          message={"Select an option"}
          options={["Option1", "option2"]}
        />
        <MessageRight
          message={"alksmdl asldkm alskdm  juerhnitguenrgkj ndkfjgbn ksjdnfkajnsd kjn kjansk jsndkfjn soeuirhj ojdnfkls ndflksn dlfk sldkhj f"}
        />
        <MessageLeft
          message={"this is a test message. sjdnf sdfm sldkfn klsjdnf iuweh rijsndkmfjbn kdfjgkdjfngk jdnfgkj dfkg kejr kejrn kjnrfg kjnfdgkjnsdfi ksofg hisdfjng k,sjdnf ksjdnf ksjdnf ksjdnf kushduofw kejrnowu0rk"}
          displayName="Kristi"
        />
        <MessageRight
          message={"alksmdl asldkm alskdm  juerhnitg lskjdnf lskdfnm lskdmf lskdmf lskmdfl skdmflk smdlkfm lskdm flsdmfklm sdlkmf lsdkmuenrgkj ndkfjgbn ksjdnfkajnsd kjn kjansk jsndkfjn soeuirhj ojdnfkls ndflksn dlfk sldkhj f"}
        />
      </Box>
    </div>
  )
}