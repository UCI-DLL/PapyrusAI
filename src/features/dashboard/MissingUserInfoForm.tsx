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
    textSize: string; //"xs" | "sm" | "md" | "lg" | "xl"
  }>({
    name: "",
    family_name: "",
    theme: "light",
    textSize: "md",
  });
  const [errors, setErrors] = useState<{
    name: string;
    family_name: string;
    theme: string;
    textSize: string;
  }>({
    name: "",
    family_name: "",
    theme: "",
    textSize: "",
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
        // Keep all theme options including both colorful variants
        const normalizedTheme = [
          "dark",
          "colorful-light",
          "colorful-dark",
        ].includes(user["custom:theme"])
          ? user["custom:theme"]
          : "light";
        setSession((prev) => ({ ...prev, theme: normalizedTheme }));
      }
      if (user && user["custom:textSize"] && user["custom:textSize"] !== "") {
        // Keep all text size options
        const normalizedTextSize = ["xs", "sm", "md", "lg", "xl"].includes(
          user["custom:textSize"]
        )
          ? user["custom:textSize"]
          : "md";
        setSession((prev) => ({ ...prev, textSize: normalizedTextSize }));
        // Apply current text size to document
        document.documentElement.setAttribute(
          "data-text-size",
          normalizedTextSize
        );
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
          setErrors({
            name: res.data,
            family_name: res.data,
            theme: res.data,
            textSize: res.data,
          });
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
    // Apply theme change - supports light, dark, colorful-light, and colorful-dark themes
    changeTheme(root, e.target.value);
  }

  function handleTextSizeChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSession((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    const root = document.documentElement;
    if (user) {
      setUser({ ...user, "custom:textSize": e.target.value });
      localStorage.setItem(
        "papyrusai_user",
        JSON.stringify({ ...user, "custom:textSize": e.target.value })
      );
    }
    // Apply text size change
    root.setAttribute("data-text-size", e.target.value);
  }

  return (
    <Card className="transition-all duration-300 hover:shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-foreground">
          Profile Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Name *
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="Enter your first name"
              value={session.name}
              onChange={handleChange}
              disabled={isLoading}
              required
              className={
                errors.name
                  ? "border-destructive focus-visible:ring-destructive"
                  : ""
              }
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && (
              <p
                id="name-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {errors.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="family_name" className="text-sm font-medium">
              Last Name
            </Label>
            <Input
              id="family_name"
              name="family_name"
              placeholder="Enter your last name"
              value={session.family_name}
              onChange={handleChange}
              disabled={isLoading}
              className={
                errors.family_name
                  ? "border-destructive focus-visible:ring-destructive"
                  : ""
              }
              aria-describedby={
                errors.family_name ? "family-name-error" : undefined
              }
            />
            {errors.family_name && (
              <p
                id="family-name-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {errors.family_name}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Theme Preference</Label>
            <RadioGroup
              value={session.theme}
              onValueChange={(value) => {
                const event = {
                  target: { name: "theme", value },
                } as React.ChangeEvent<HTMLInputElement>;
                handleThemeChange(event);
              }}
              className="flex flex-col space-y-3"
              aria-describedby={errors.theme ? "theme-error" : undefined}
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="light" id="light" />
                <Label
                  htmlFor="light"
                  className="text-sm font-normal cursor-pointer"
                >
                  Light theme
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="dark" id="dark" />
                <Label
                  htmlFor="dark"
                  className="text-sm font-normal cursor-pointer"
                >
                  Dark theme
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="colorful-light" id="colorful-light" />
                <Label
                  htmlFor="colorful-light"
                  className="text-sm font-normal cursor-pointer"
                >
                  Colorful light theme
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="colorful-dark" id="colorful-dark" />
                <Label
                  htmlFor="colorful-dark"
                  className="text-sm font-normal cursor-pointer"
                >
                  Colorful dark theme
                </Label>
              </div>
            </RadioGroup>
            {errors.theme && (
              <p
                id="theme-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {errors.theme}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Text Size</Label>
            <RadioGroup
              value={session.textSize}
              onValueChange={(value) => {
                const event = {
                  target: { name: "textSize", value },
                } as React.ChangeEvent<HTMLInputElement>;
                handleTextSizeChange(event);
              }}
              className="flex flex-col space-y-3"
              aria-describedby={errors.textSize ? "text-size-error" : undefined}
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="xs" id="text-xs" />
                <Label
                  htmlFor="text-xs"
                  className="text-sm font-normal cursor-pointer"
                >
                  Extra Small
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="sm" id="text-sm" />
                <Label
                  htmlFor="text-sm"
                  className="text-sm font-normal cursor-pointer"
                >
                  Small
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="md" id="text-md" />
                <Label
                  htmlFor="text-md"
                  className="text-sm font-normal cursor-pointer"
                >
                  Medium (Default)
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="lg" id="text-lg" />
                <Label
                  htmlFor="text-lg"
                  className="text-sm font-normal cursor-pointer"
                >
                  Large
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="xl" id="text-xl" />
                <Label
                  htmlFor="text-xl"
                  className="text-sm font-normal cursor-pointer"
                >
                  Extra Large
                </Label>
              </div>
            </RadioGroup>
            {errors.textSize && (
              <p
                id="text-size-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {errors.textSize}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
            aria-label={
              isLoading
                ? "Saving profile information"
                : "Save profile information"
            }
          >
            {isLoading ? "Saving..." : "Save Profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
