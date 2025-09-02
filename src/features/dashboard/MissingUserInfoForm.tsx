import React, { useContext, useEffect, useState } from "react";
import { UserType } from "../../utility/types/UserTypes";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import Post from "../../utility/Post";
import { postUserData } from "../../utility/endpoints/UserEndpoints";
import { changeTheme } from "../../utility/Themes";
import { UserContext } from "../../utility/context/UserContext";
import { AlertContext } from "../../utility/context/AlertContext";

/**
 * This form is to update user's missing data
 * Note: This is hard coded with only name and family_name
 */

interface MissingUserInfoFormProps {
  user: UserType | undefined;
  closeForm: (user: UserType) => void;
  requireUpdate?: boolean;
}

export default function MissingUserInfoForm({
  user,
  closeForm,
  requireUpdate = true,
}: MissingUserInfoFormProps): JSX.Element {
  const { setAlert } = useContext(AlertContext);
  //New user information
  const [session, setSession] = useState<{
    name: string;
    family_name: string;
    theme: string; //"light" | "dark",
  }>({
    name: "",
    family_name: "",
    theme: "light",
  });
  const [errors, setErrors] = useState<{
    name: string;
    family_name: string;
    theme: string;
  }>({
    name: "",
    family_name: "",
    theme: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { setUser } = useContext(UserContext);

  useEffect(() => {
    //Check if any data is missing, if nothing, then close
    if (
      user &&
      user.name &&
      user.name !== "" &&
      requireUpdate &&
      user.family_name
    ) {
      //if the user has both name, then close modal
      //NOTE: family name optional
      closeForm(user);
    } else {
      //set new user data based on old data
      if (user && user.name && user.name !== "") {
        setSession((prev) => ({ ...prev, name: user.name }));
      }
      if (user && user.family_name && user.family_name !== "") {
        setSession((prev) => ({ ...prev, family_name: user.family_name }));
      }
      if (user && user["custom:theme"] && user["custom:theme"] !== "") {
        // Map colorful themes to light theme
        const normalizedTheme =
          user["custom:theme"] === "dark" ? "dark" : "light";
        setSession((prev) => ({ ...prev, theme: normalizedTheme }));
      }
      setIsLoading(false);
    }
  }, [user, closeForm, requireUpdate]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (session.name === "") {
      setErrors((prev) => ({ ...prev, name: "Name missing" }));
    }
    // else if(session.family_name === "") {
    //   setErrors((prev) => ({...prev, family_name: "Family name missing"}))
    // }
    else {
      // set is loading
      setIsLoading(true);
      // post data back
      Post(postUserData(), session).then((res) => {
        if (res && res.status && res.status < 300) {
          if (res.data && res.data) {
            //close modal if user data was updated
            closeForm(res.data);
            // localStorage.setItem("papyrusai_user", JSON.stringify(res.data));
            setAlert({ message: "Account Updated!", type: "success" });
          }
        } else {
          // set errors
          setErrors({ name: res.data, family_name: res.data, theme: res.data });
        }
        // set is loading back
        setIsLoading(false);
      });
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSession((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleThemeChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSession((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    const root = document.documentElement;
    if (user) {
      setUser({ ...user, "custom:theme": e.target.value });
      localStorage.setItem(
        "papyrusai_user",
        JSON.stringify({ ...user, "custom:theme": e.target.value })
      );
    }
    // Apply theme change - colorful themes will fallback to light in changeTheme function
    changeTheme(root, e.target.value);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enter User Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={session.name}
              onChange={handleChange}
              disabled={isLoading}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="family_name">Family Name</Label>
            <Input
              id="family_name"
              name="family_name"
              value={session.family_name}
              onChange={handleChange}
              disabled={isLoading}
              className={errors.family_name ? "border-red-500" : ""}
            />
            {errors.family_name && (
              <p className="text-sm text-red-500">{errors.family_name}</p>
            )}
          </div>

          <div className="space-y-3">
            <Label>Theme</Label>
            <RadioGroup
              value={session.theme}
              onValueChange={(value) => {
                const event = {
                  target: { name: "theme", value },
                } as React.ChangeEvent<HTMLInputElement>;
                handleThemeChange(event);
              }}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="light" />
                <Label htmlFor="light">Light</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="dark" />
                <Label htmlFor="dark">Dark</Label>
              </div>
            </RadioGroup>
            {errors.theme && (
              <p className="text-sm text-red-500">{errors.theme}</p>
            )}
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            Save
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
