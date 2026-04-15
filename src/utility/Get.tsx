import axios from "axios";

export default async function Get(url: String, signal?: AbortSignal | undefined, reports: Boolean = false) {
  const user = localStorage.getItem("papyrusai_access_token")
  const API_URL = (process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL : "") + url;
  let sessionId = localStorage.getItem("sessionId") ?? "unknown";

  var data = await axios
    .get(API_URL, {
      headers: {
        Authorization: user,
        "X-Session-Id": sessionId,
      },
      signal
    })
    .then((response) => {
      return response;
    })
    .catch((error) => {
      if (error.code === "ERR_CANCELED") return;

      // if (error.code === "ERR_NETWORK") {
      //   console.log("You got a 502 error that needs to be handled by the function that called this.", error)

      // }
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        // showMsg(Object.values(error.response.data), "error");
        // if (error.response.status === 401) {
        //   localStorage.removeItem("papyrusai_access_token");
        // }
        return error.response;
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
      } else {
        // Something happened in setting up the request that triggered an Error
      }
      return error;
    });
  return await data;
}