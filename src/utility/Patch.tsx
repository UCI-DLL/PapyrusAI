import axios from "axios";

export default async function Patch(url: String, formdata: any, second: boolean = false) {
  const user = localStorage.getItem("papyrusai_access_token")
  const API_URL = (second ? (process.env.REACT_APP_API_URL2 ?? "") : (process.env.REACT_APP_API_URL ?? "")) + url;
  let sessionId = localStorage.getItem("sessionId") ?? "unknown";

  var data = await axios
    .patch(API_URL, formdata, {
      headers: {
        Authorization: user,
        "X-Session-Id": sessionId,
      },
    })
    .then((response) => {
      return response;
    })
    .catch(function (error) {
      if (error.response) {
        return error.response;
      } else if (error.request) {
      } else {
      }
      return error;
    });
  return await data;
}
