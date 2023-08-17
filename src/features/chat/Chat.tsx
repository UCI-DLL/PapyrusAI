import React from "react";
import { MessageLeft, MessageRight } from "../../components/Message";


export default function Chat(): JSX.Element {

  return (
    <div style={{
      maxWidth: "1024px",
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start",
      flexDirection: "column",
      margin: "0 auto",
      padding: "0.4rem"
    }}>
      <h4>ENG 123 Module 2</h4>
      <div>Assignment: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam quis placerat dolor. Quisque vel pharetra erat. Maecenas suscipit enim nec velit malesuada accumsan. Nam posuere libero non malesuada aliquet. Praesent id enim scelerisque, condimentum magna id, suscipit eros. Sed vel risus tempus, sodales urna et, vulputate ante. Maecenas aliquet nec nibh et vehicula. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nullam pharetra justo vel orci iaculis, in mattis quam mattis. Praesent accumsan quam eu enim fringilla, vel scelerisque ante ultrices. Morbi mauris diam, congue placerat nibh vitae, egestas malesuada magna. Vivamus pellentesque sem ac lectus pellentesque venenatis. Nulla fringilla tellus eu mauris posuere, a posuere quam porttitor."</div>

      &nbsp;&nbsp;&nbsp;
      <hr />
      &nbsp;&nbsp;&nbsp;

      <div>
        <MessageLeft
          message={"this is a test message. sjdnf sdfm sldkfn klsjdnf iuweh rijsndkmfjbn kdfjgkdjfngk jdnfgkj dfkg kejr kejrn kjnrfg kjnfdgkjnsdfi ksofg hisdfjng k,sjdnf ksjdnf ksjdnf ksjdnf kushduofw kejrnowu0rk"}
          displayName="Kristi"
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
      </div>
    </div>
  )
}