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
    <main className="bg-background text-foreground p-4 space-y-6">
      <header className="slide-in-up">
        <div className="relative overflow-hidden bg-card border rounded-xl p-6 shadow-lg">
          <div className="relative z-10">
            <h1 className="text-2xl font-bold mb-1 text-foreground">
              Account Settings
            </h1>
            <p className="text-muted-foreground max-w-2xl text-sm">
              Manage your profile information and preferences.
            </p>
          </div>
        </div>
      </header>

      <section aria-labelledby="account-heading">
        <div className="w-full">
          <MissingUserInfoForm
            user={user ? user : undefined}
            closeForm={(_newuser: UserType) => {
              //Set user with new information
              // setUser(() => user ? user : null);
              // localStorage.setItem("papyrusai_user", JSON.stringify(user));
            }}
            requireUpdate={false}
          />
        </div>
      </section>
    </main>
  )
}