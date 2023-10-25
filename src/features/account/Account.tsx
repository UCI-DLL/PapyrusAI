import { useContext, useEffect } from "react";
import MissingUserInfoForm from "../dashboard/MissingUserInfoForm";
import { UserContext } from "../../utility/context/UserContext";
import { UserType } from "../../utility/types/UserTypes";
import Get from "../../utility/Get";
import { getUserData } from "../../utility/endpoints/UserEndpoints";


export default function Account(): JSX.Element {
  const { user, setUser } = useContext(UserContext);

  useEffect(() => {
    Get(getUserData()).then((res) => {
      if (res.status && res.status < 300) {
        if (res.data) {
          //update our version of user
          setUser(res.data);
          localStorage.setItem("papyrusai_user", JSON.stringify(res.data));
        }
      } else {
        //remove user data
        localStorage.removeItem("papyrusai_user");
        setUser(null);
      }
    });
  }, [setUser])

  return (
    <div className="account">
      <MissingUserInfoForm
        user={user ? user : undefined}
        closeForm={(newuser: UserType) => {
          //Set user with new information
          // setUser(() => user ? user : null);
          // localStorage.setItem("papyrusai_user", JSON.stringify(user));
        }}
        requireUpdate={false}
      />
    </div>
  )
}