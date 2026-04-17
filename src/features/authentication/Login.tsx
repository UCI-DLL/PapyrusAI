import React, { useEffect } from "react";
import { logEvent } from "../../utility/endpoints/UserEndpoints";
import Post from "../../utility/Post";


export default function Login(): JSX.Element {
  useEffect(() => {
    Post(logEvent(), {
      eventType: "view_page",
      metadata: {
        data: "new_token",
        page: "login",
      }
    })
  }, [])

  return (
    <div>
    </div>
  )
}