import axios from "axios";

export default async function Get(url: String, signal?: AbortSignal | undefined) {
  const user = localStorage.getItem("sessionid")
  const API_URL = (process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL : "") + url;

  var data = await axios
    .get(API_URL, {
      headers: {
        Authorization: "sessionid " + user,
      },
      signal
    })
    .then((response) => {
      return response;
    })
    .catch(function (error) {
      if (error.code === "ERR_CANCELED") return;
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        // showMsg(Object.values(error.response.data), "error");
        if (error.response.status === 401) {
          localStorage.removeItem("sessionid");
        }
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