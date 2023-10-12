import axios from "axios";

export default async function Put(url: String, formdata: any) {
  const user = localStorage.getItem("papyrusai_access_token")
  const API_URL = (process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL : "") + url;

  var data = await axios
    .put(API_URL, formdata, {
      headers: {
        Authorization: user,
      },
    })
    .then((response) => {
      return response;
    })
    .catch(function (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        // showMsg(Object.values(error.response.data), "error");
        if (error.response.status === 401) {
          localStorage.removeItem("papyrusai_access_token");
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