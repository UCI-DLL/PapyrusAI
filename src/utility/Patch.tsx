import axios from "axios";

export default async function Patch(url: String, formdata: any, second: boolean = false) {
  const user = localStorage.getItem("papyrusai_access_token");
  const API_URL = (second ? (process.env.REACT_APP_API_URL2 ?? "") : (process.env.REACT_APP_API_URL ?? "")) + url;
  let sessionId = localStorage.getItem("sessionId") ?? "unknown";

  const data = await axios
    .patch(API_URL, formdata, {
      headers: {
        Authorization: user,
        "X-Session-Id": sessionId,
      },
    })
    .then((response) => response)
    .catch((error) => {
      if (error.response) return error.response;
      return error;
    });
  return data;
}
