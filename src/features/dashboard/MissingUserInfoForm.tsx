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
import { changeLanguage } from "../../i18n";
import { useTranslation } from "../../hooks/useTranslation";

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
    language: string; //"english" | "spanish"
  }>({
    name: "",
    family_name: "",
    theme: "light",
    textSize: "md",
    language: "english",
  });
  const [errors, setErrors] = useState<{
    name: string;
    family_name: string;
    theme: string;
    textSize: string;
    language: string;
  }>({
    name: "",
    family_name: "",
    theme: "",
    textSize: "",
    language: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { setUser } = useContext(UserContext);
  const { t } = useTranslation();

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
      if (user && user["custom:language"] && user["custom:language"] !== "") {
        // Keep valid language options
        const normalizedLanguage = ["english", "spanish"].includes(
          user["custom:language"]
        )
          ? user["custom:language"]
          : "english";
        setSession((prev) => ({ ...prev, language: normalizedLanguage }));
        // Apply current language to document
        const languageCode = normalizedLanguage === "spanish" ? "es" : "en";
        document.documentElement.setAttribute("lang", languageCode);
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
            setAlert({ message: t("account.accountUpdated"), type: "success" });
          }
        } else {
          // set errors
          setErrors({
            name: res.data,
            family_name: res.data,
            theme: res.data,
            textSize: res.data,
            language: res.data,
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

  function handleLanguageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedLanguage = e.target.value;
    setSession((prev) => ({ ...prev, [e.target.name]: selectedLanguage }));
    
    // Update i18n language
    const languageCode = selectedLanguage === "spanish" ? "es" : "en";
    changeLanguage(languageCode as "en" | "es");
    
    // Update HTML lang attribute
    document.documentElement.setAttribute("lang", languageCode);
    
    if (user) {
      setUser({ ...user, "custom:language": selectedLanguage });
      localStorage.setItem(
        "papyrusai_user",
        JSON.stringify({ ...user, "custom:language": selectedLanguage })
      );
    }
  }

  return (
    <Card className="transition-all duration-300 hover:shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-foreground">
          {t("account.profileInformation")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              {t("common.name")} *
            </Label>
            <Input
              id="name"
              name="name"
              placeholder={t("account.enterFirstName")}
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
              {t("account.lastName")}
            </Label>
            <Input
              id="family_name"
              name="family_name"
              placeholder={t("account.enterLastName")}
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
            <Label className="text-sm font-medium">{t("account.themePreference")}</Label>
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
                  {t("account.lightTheme")}
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="dark" id="dark" />
                <Label
                  htmlFor="dark"
                  className="text-sm font-normal cursor-pointer"
                >
                  {t("account.darkTheme")}
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="colorful-light" id="colorful-light" />
                <Label
                  htmlFor="colorful-light"
                  className="text-sm font-normal cursor-pointer"
                >
                  {t("account.colorfulLightTheme")}
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="colorful-dark" id="colorful-dark" />
                <Label
                  htmlFor="colorful-dark"
                  className="text-sm font-normal cursor-pointer"
                >
                  {t("account.colorfulDarkTheme")}
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
            <Label className="text-sm font-medium">{t("account.textSize")}</Label>
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
                  {t("account.extraSmall")}
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="sm" id="text-sm" />
                <Label
                  htmlFor="text-sm"
                  className="text-sm font-normal cursor-pointer"
                >
                  {t("account.small")}
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="md" id="text-md" />
                <Label
                  htmlFor="text-md"
                  className="text-sm font-normal cursor-pointer"
                >
                  {t("account.medium")}
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="lg" id="text-lg" />
                <Label
                  htmlFor="text-lg"
                  className="text-sm font-normal cursor-pointer"
                >
                  {t("account.large")}
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="xl" id="text-xl" />
                <Label
                  htmlFor="text-xl"
                  className="text-sm font-normal cursor-pointer"
                >
                  {t("account.extraLarge")}
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

          <div className="space-y-3">
            <Label className="text-sm font-medium">{t("account.language")}</Label>
            <RadioGroup
              value={session.language}
              onValueChange={(value) => {
                const event = {
                  target: { name: "language", value },
                } as React.ChangeEvent<HTMLInputElement>;
                handleLanguageChange(event);
              }}
              className="flex flex-col space-y-3"
              aria-describedby={errors.language ? "language-error" : undefined}
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="english" id="language-english" />
                <Label
                  htmlFor="language-english"
                  className="text-sm font-normal cursor-pointer"
                >
                  {t("account.english")}
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="spanish" id="language-spanish" />
                <Label
                  htmlFor="language-spanish"
                  className="text-sm font-normal cursor-pointer"
                >
                  {t("account.spanish")}
                </Label>
              </div>
            </RadioGroup>
            {errors.language && (
              <p
                id="language-error"
                className="text-sm text-destructive"
                role="alert"
              >
                {errors.language}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
            aria-label={
              isLoading
                ? t("account.saving")
                : t("account.saveProfile")
            }
          >
            {isLoading ? t("account.saving") : t("account.saveProfile")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
