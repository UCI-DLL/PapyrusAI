import React, { useContext, useEffect, useRef, useState } from "react";
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
import { postUserData, logEvent } from "../../utility/endpoints/UserEndpoints";
import {
  applyUserSettings,
  normalizeUserSettings,
} from "../../utility/Themes";
import { AlertContext } from "../../utility/context/AlertContext";
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
  const [session, setSession] = useState<{
    name: string;
    family_name: string;
    theme: string;
    textSize: string;
    language: string;
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
  const { t } = useTranslation();
  const hasInitialized = useRef(false);
  // For Preview:Tracks the last *saved* settings — always reverted to on unmount if no new save occurred.
  const savedSettingsRef = useRef<{
    theme: string;
    textSize: string;
    language: string;
  } | null>(null);

  useEffect(() => {
    //log page
    Post(logEvent(), {
      eventType: "view_page",
      metadata: {
        page: "missing_user_info_form",
      }
    })
  }, [])

  useEffect(() => {
    if (hasInitialized.current) return;
    if (!user) return;

    hasInitialized.current = true;

    if (user.name && user.name !== "" && requireUpdate && user.family_name) {
      closeForm(user);
    } else {
      const settings = normalizeUserSettings(user);
      savedSettingsRef.current = settings;

      setSession((prev) => ({
        ...prev,
        name: user.name ?? prev.name,
        family_name: user.family_name ?? prev.family_name,
        ...settings,
      }));

      setIsLoading(false);
    }
  }, [user, closeForm, requireUpdate]);

  // On unmount, always revert DOM to the last saved settings (preview cleanup).
  useEffect(() => {
    return () => {
      if (!savedSettingsRef.current) return;
      applyUserSettings(savedSettingsRef.current);
    };
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (session.name === "") {
      setErrors((prev) => ({
        ...prev,
        name: `${t("errorMessage.nameMissing")}`,
      }));
      return;
    }

    setIsLoading(true);
    Post(postUserData(), session).then((res) => {
      if (res && res.status && res.status < 300) {
        if (res.data) {
          // Update savedSettingsRef so any subsequent unsaved change reverts to THIS saved state.
          savedSettingsRef.current = {
            theme: session.theme,
            textSize: session.textSize,
            language: session.language,
          };
          const mergedUser: UserType = {
            ...(user as UserType),
            ...res.data,
            "custom:theme": session.theme,
            "custom:textSize": session.textSize,
            "custom:language": session.language,
          };
          closeForm(mergedUser);
          setAlert({ message: t("account.accountUpdated"), type: "success" });
        }
      } else {
        setErrors({
          name: res.data,
          family_name: res.data,
          theme: res.data,
          textSize: res.data,
          language: res.data,
        });
      }
      setIsLoading(false);
    });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSession((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleThemeChange(value: string) {
    setSession((prev) => ({ ...prev, theme: value }));
    applyUserSettings({
      theme: value,
      textSize: session.textSize,
      language: session.language,
    });
  }

  function handleTextSizeChange(value: string) {
    setSession((prev) => ({ ...prev, textSize: value }));
    applyUserSettings({
      theme: session.theme,
      textSize: value,
      language: session.language,
    });
  }

  function handleLanguageChange(value: string) {
    setSession((prev) => ({ ...prev, language: value }));
    applyUserSettings({
      theme: session.theme,
      textSize: session.textSize,
      language: value,
    });
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
              autoComplete="given-name"
            />
            {errors.name && (
              <p
                id="name-error"
                className="text-sm text-destructive"
                role="alert"
                aria-live="assertive"
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
              autoComplete="family-name"
            />
            {errors.family_name && (
              <p
                id="family-name-error"
                className="text-sm text-destructive"
                role="alert"
                aria-live="assertive"
              >
                {errors.family_name}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">
              {t("account.themePreference")}
            </Label>
            <RadioGroup
              value={session.theme}
              onValueChange={handleThemeChange}
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
                aria-live="assertive"
              >
                {errors.theme}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">{t("account.textSize")}</Label>
            <RadioGroup
              value={session.textSize}
              onValueChange={handleTextSizeChange}
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
                aria-live="assertive"
              >
                {errors.textSize}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">{t("account.language")}</Label>
            <RadioGroup
              value={session.language}
              onValueChange={handleLanguageChange}
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
