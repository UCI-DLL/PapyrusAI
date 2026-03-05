import { useContext, useEffect } from "react";
import MissingUserInfoForm from "../dashboard/MissingUserInfoForm";
import { UserContext } from "../../utility/context/UserContext";
import { UserType } from "../../utility/types/UserTypes";
import Get from "../../utility/Get";
import { getUserData, logEvent } from "../../utility/endpoints/UserEndpoints";
import { User } from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";
import Post from "../../utility/Post";

export default function Account(): JSX.Element {
  const { user, setUser } = useContext(UserContext);
  const { t } = useTranslation();

  useEffect(() => {
    //log page
    Post(logEvent(), {
      eventType: "view_page",
      metadata: {
        page: "acount",
      }
    })
  }, [])

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
  }, [setUser]);

  return (
    <main className="bg-background text-foreground p-4 space-y-6">
      {/* Standard Page Header Pattern */}
      <header className="animate-in slide-in-from-bottom-4 duration-700">
        <div className="relative overflow-hidden bg-card border rounded-xl p-6 shadow-lg">
          <div
            className="absolute top-0 right-0 w-48 h-48 opacity-10"
            aria-hidden="true"
          >
            <User size={192} className="text-primary" />
          </div>

          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-2 text-foreground leading-tight">
              {t("account.accountSettings")}
            </h1>
            <p className="text-muted-foreground max-w-2xl text-base leading-6">
              {t("account.accountSettingsDescription")}
            </p>
          </div>
        </div>
      </header>

      {/* Content Section */}
      <section aria-labelledby="account-content">
        <div className="w-full" id="account-content">
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
  );
}
