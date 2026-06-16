import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { DialogWrapper } from "../../components/ui-wrappers/DialogWrapper";
import { DropdownWrapper } from "../../components/ui-wrappers/DropdownWrapper";
import { TooltipWrapper } from "../../components/ui-wrappers/TooltipWrapper";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { ChevronDown, Info, Loader2, MessageSquare, Trash2 } from "lucide-react";
import Get from "../../utility/Get";
import Post from "../../utility/Post";
import Delete from "../../utility/Delete";
import Patch from "../../utility/Patch";
import {
  getItem,
  postCreateItem,
  patchUpdateItem,
  deleteItem,
} from "../../utility/endpoints/ItemEndpoints";
import { AlertContext } from "../../utility/context/AlertContext";
import { UserContext } from "../../utility/context/UserContext";
import { cn } from "../../lib/utils";
import { useTranslation } from "../../hooks/useTranslation";
import { InfoAccordion } from "../../components/ui-wrappers/InfoAccordion";
import { logEvent } from "../../utility/endpoints/UserEndpoints";

type PromptFormType = {
  name: string;
  description: string;
  prompt: string;
};

export default function CreatePrompt(): JSX.Element {
  const location = useLocation();
  const navigator = useNavigate();
  const { t } = useTranslation();
  const { setAlert } = useContext(AlertContext);
  const { user } = useContext(UserContext);

  const options = [t("createPrompt.savePublish"), t("createPrompt.discardChanges")];

  const isEditMode = !location.pathname.includes("/createprompt");
  const promptId = isEditMode ? location.pathname.split("/")[3] : undefined;

  const [folderId, setFolderId] = useState<string>(isEditMode ? "" : location.pathname.split("/")[2]);
  const [prompt, setPrompt] = useState<PromptFormType>({ name: "", description: "", prompt: "" });
  const [errors, setErrors] = useState({ name: "", prompt: "" });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedIndexSave, setSelectedIndexSave] = useState(0);
  const [openDiscardModal, setOpenDiscardModal] = useState<boolean>(false);
  const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
  const [openSaveTop, setOpenSaveTop] = useState(false);
  const [openSaveBottom, setOpenSaveBottom] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState<boolean>(false);

  useEffect(() => {
    Post(logEvent(), {
      eventType: "view_page",
      metadata: { isEditMode, folderId, promptId, page: "create_prompt" },
    });

    if (isEditMode && promptId) {
      const controller = new AbortController();
      Get(getItem(promptId), controller.signal, true).then((res) => {
        if (res && res.status && res.status < 300 && res.data) {
          setPrompt({ name: res.data.name, description: res.data.description ?? "", prompt: res.data.metadata?.prompt ?? "" });
          setFolderId(res.data.parentId ?? "");
          setIsLoading(false);
        } else if (res && res.status === 401) {
          navigator("/login");
        } else if (res !== undefined) {
          setAlert({ message: t("errorMessage.promptNotExist"), type: "error" });
          navigator("/library");
        }
      });
      return () => controller.abort();
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line
  }, [location.pathname]);

  function handleSubmit(_e: any) {
    if (prompt.name === "") {
      setErrors((prev) => ({ ...prev, name: t("errorMessage.nameMissing") }));
      return;
    }
    if (prompt.prompt === "") {
      setErrors((prev) => ({ ...prev, prompt: t("createPrompt.promptName") + " " + t("components.missing") }));
      return;
    }

    setIsLoading(true);

    if (isEditMode && promptId) {
      Patch(patchUpdateItem(promptId), {
        name: prompt.name,
        description: prompt.description,
        metadata: { prompt: prompt.prompt },
      }, true).then((res) => {
        if (res.status && res.status < 300) {
          setAlert({ message: t("createPrompt.promptUpdated"), type: "success" });
        } else if (res?.status === 401) {
          navigator("/login");
        } else if (res?.status === 403) {
          setAlert({ message: res?.data?.message || t("createPrompt.promptCouldNotBeUpdated"), type: "error" });
        } else {
          setAlert({ message: res?.data?.message || t("createPrompt.promptCouldNotBeUpdated"), type: "error" });
        }
        setIsLoading(false);
      });
    } else {
      Post(postCreateItem(), {
        type: "prompt",
        parentId: folderId,
        name: prompt.name,
        description: prompt.description,
        metadata: { prompt: prompt.prompt, createdBy: user?.username },
      }, true).then((res) => {
        if (res.status && res.status < 300) {
          setAlert({ message: t("createPrompt.promptCreated"), type: "success" });
        } else if (res && res.status === 401) {
          navigator("/login");
          return;
        } else {
          setAlert({ message: t("createPrompt.promptCouldNotBeCreated"), type: "error" });
        }
        navigator(`/library/${folderId}`);
      });
    }
  }

  function handleDelete() {
    if (!promptId) return;
    setIsLoading(true);
    Delete(deleteItem(promptId), true).then((res) => {
      if (res.status && res.status < 300) {
        setAlert({ message: t("createPrompt.promptDeleted") || "Prompt deleted.", type: "success" });
      } else if (res && res.status === 401) {
        navigator("/login");
        return;
      } else {
        setAlert({ message: t("createPrompt.promptCouldNotBeDeleted") || "Could not delete prompt.", type: "error" });
      }
      navigator(`/library/${folderId}`);
      setIsLoading(false);
    });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setPrompt((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  const handleMenuItemClick = (index: number) => {
    if (index === 0) {
      handleSubmit(null);
    } else if (index === 1) {
      setOpenDiscardModal(true);
    }
    setSelectedIndexSave(index);
    setOpenSaveTop(false);
    setOpenSaveBottom(false);
  };

  function handleClick(_e: any) {
    if (selectedIndexSave === 0) {
      handleSubmit(_e);
    } else if (selectedIndexSave === 1) {
      setOpenDiscardModal(true);
    }
  }

  return !isLoading ? (
    <main className="bg-background text-foreground p-4 space-y-6">
      {/* Dialogs */}
      <DialogWrapper
        open={showInfoDialog}
        onOpenChange={setShowInfoDialog}
        title={t("library.aboutPromptCreation")}
        contentClassName="sm:max-w-md"
        actions={[{ label: t("components.gotIt"), onClick: () => setShowInfoDialog(false) }]}
      >
        <div className="space-y-3">
          <p>
            {t("createPrompt.promptInfoDescription")}
            <a
              href="https://docs.google.com/document/d/1o3He0CdgV7hJOX65gc3Gpf3_Fr3GYvSm4Q-i-Y5cNHQ/edit?tab=t.0#heading=h.7pexnnplkzu2"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:no-underline text-primary dark:text-gold colorful-dark:text-gold font-medium"
            >
              {t("createPrompt.promptInfoDescriptionLinkText")}
            </a>
            .
          </p>
        </div>
      </DialogWrapper>

      <DialogWrapper
        open={openDiscardModal}
        onOpenChange={setOpenDiscardModal}
        title={t("createPrompt.discardChangesTitle")}
        description={t("createPrompt.discardChangesDescription")}
        contentClassName="sm:max-w-md"
        actions={[
          { label: t("common.cancel"), onClick: () => setOpenDiscardModal(false), variant: "outline", disabled: isLoading },
          { label: t("createPrompt.discardChanges"), onClick: () => navigator(-1), variant: "destructive", disabled: isLoading },
        ]}
      />

      <DialogWrapper
        open={openDeleteModal}
        onOpenChange={setOpenDeleteModal}
        title={t("createPrompt.deletePrompt")}
        description={t("createPrompt.deletePromptMessage")}
        contentClassName="sm:max-w-md"
        actions={[
          { label: t("common.cancel"), onClick: () => setOpenDeleteModal(false), variant: "outline", disabled: isLoading },
          { label: t("common.delete"), onClick: handleDelete, variant: "destructive", disabled: isLoading },
        ]}
      />

      <header className="animate-in slide-in-from-bottom-4 duration-700">
        <div className="relative overflow-hidden bg-card border rounded-xl p-6 shadow-lg">
          <div className="absolute top-0 right-0 w-48 h-48 opacity-10" aria-hidden="true">
            <MessageSquare size={192} className="text-primary" />
          </div>
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
              <h1 className="text-4xl font-bold mb-2 text-foreground leading-tight">
                {isEditMode ? t("createPrompt.editPrompt") : t("createPrompt.createPrompt")}
              </h1>
              <nav
                className="flex flex-col md:flex-row gap-2"
                aria-label={`${t("createPrompt.createPrompt")} ${t("common.actions")}}`}
              >
                {isEditMode && (
                  <TooltipWrapper content={t("common.delete")}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOpenDeleteModal(true)}
                      disabled={isLoading}
                      aria-label={t("common.delete")}
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </TooltipWrapper>
                )}
                <TooltipWrapper content={t("common.info")}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowInfoDialog(true)}
                    aria-label={t("createPrompt.promptInfoLabel")}
                  >
                    <Info className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </TooltipWrapper>
                <div className="flex rounded-lg border">
                  <Button
                    size="sm"
                    onClick={handleClick}
                    className="rounded-none border-0 w-full rounded-l"
                    disabled={isLoading}
                    aria-label={`${options[selectedIndexSave]} ${t("common.prompt")}`}
                  >
                    {options[selectedIndexSave]}
                  </Button>
                  <DropdownWrapper
                    open={openSaveTop}
                    onOpenChange={setOpenSaveTop}
                    trigger={
                      <Button
                        size="sm"
                        className="rounded-none border-0 border-l px-2 rounded-r"
                        variant="default"
                        disabled={isLoading}
                        aria-label={t("library.selectStrategy")}
                      >
                        <ChevronDown className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    }
                    actions={options.map((option, index) => ({
                      label: option,
                      onClick: () => handleMenuItemClick(index),
                      className: cn(
                        index === selectedIndexSave && "bg-primary/30",
                        index === 1 && "text-destructive focus:bg-destructive focus:text-destructive-foreground"
                      ),
                    }))}
                    align="end"
                  />
                </div>
              </nav>
            </div>
            <InfoAccordion>
              <p className="text-muted-foreground max-w-2xl text-base leading-6">
                {t("createPrompt.createPromptDescription")}&nbsp;
                <a
                  href="https://docs.google.com/document/d/1o3He0CdgV7hJOX65gc3Gpf3_Fr3GYvSm4Q-i-Y5cNHQ/edit?tab=t.0#heading=h.9dbj73hbtf5k"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium underline underline-offset-2 hover:no-underline text-primary dark:text-gold colorful-dark:text-gold transition-colors duration-200"
                >
                  {t("createPrompt.createPromptDescriptionLinkText")}
                </a>
                .
              </p>
            </InfoAccordion>
          </div>
        </div>
      </header>

      <section aria-labelledby="actions-heading">
        <Card className="transition-all duration-300 hover:shadow-md" id="actions-heading">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-foreground">
              {t("createPrompt.promptInformation")}
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              {t("createPrompt.enterPromptDetails")}. {t("common.required")}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    {t("createPrompt.promptName")} *
                  </Label>
                  <TooltipWrapper content={t("createPrompt.promptNameTooltip")}>
                    <button type="button" aria-label={t("createPrompt.promptNameTooltip")}>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </TooltipWrapper>
                </div>
                <Input
                  id="name"
                  name="name"
                  placeholder={t("createPrompt.promptNameHelptext")}
                  value={prompt.name}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                  className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
                  aria-describedby={errors.name ? "name-error" : undefined}
                />
                {errors.name && (
                  <p id="name-error" className="text-sm text-destructive" role="alert" aria-live="assertive">
                    {errors.name}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    {t("createPrompt.promptDescription")}
                  </Label>
                  <TooltipWrapper content={t("createPrompt.promptDescriptionTooltip")}>
                    <button type="button" aria-label={t("createPrompt.promptDescriptionTooltip")}>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </TooltipWrapper>
                </div>
                <Input
                  id="description"
                  name="description"
                  placeholder={t("createPrompt.promptDescriptionHelptext")}
                  value={prompt.description}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="prompt" className="text-sm font-medium">
                    {t("common.prompt")} *
                  </Label>
                  <TooltipWrapper content={t("createPrompt.promptTooltip")}>
                    <button type="button" aria-label={t("createPrompt.promptTooltip")}>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </TooltipWrapper>
                </div>
                <Textarea
                  id="prompt"
                  name="prompt"
                  placeholder={t("createPrompt.promptHelptext")}
                  value={prompt.prompt}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                  rows={5}
                  className={errors.prompt ? "border-destructive focus-visible:ring-destructive" : ""}
                  aria-describedby={errors.prompt ? "prompt-error" : undefined}
                />
                {errors.prompt && (
                  <p id="prompt-error" className="text-sm text-destructive" role="alert" aria-live="assertive">
                    {errors.prompt}
                  </p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <section aria-labelledby="bottom-actions-heading" className="pt-4">
          <nav
            className="flex flex-col md:flex-row md:items-center md:justify-end gap-2"
            aria-label={`${t("createPrompt.createPrompt")} ${t("common.actions")}}`}
            id="bottom-actions-heading"
          >
            {isEditMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpenDeleteModal(true)}
                disabled={isLoading}
                aria-label={t("common.delete")}
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                {t("common.delete")}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInfoDialog(true)}
              aria-label={t("createPrompt.promptInfoLabel")}
            >
              <Info className="h-4 w-4" aria-hidden="true" />
              {t("common.info")}
            </Button>
            <div className="flex rounded-lg border">
              <Button
                size="sm"
                onClick={handleClick}
                className="rounded-none border-0 w-full rounded-l"
                disabled={isLoading}
                aria-label={`${options[selectedIndexSave]} ${t("common.prompt")}`}
              >
                {options[selectedIndexSave]}
              </Button>
              <DropdownWrapper
                open={openSaveBottom}
                onOpenChange={setOpenSaveBottom}
                trigger={
                  <Button
                    size="sm"
                    className="rounded-none border-0 border-l px-2 rounded-r"
                    variant="default"
                    disabled={isLoading}
                    aria-label={t("library.selectStrategy")}
                  >
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  </Button>
                }
                actions={options.map((option, index) => ({
                  label: option,
                  onClick: () => handleMenuItemClick(index),
                  className: cn(
                    index === selectedIndexSave && "bg-primary/30",
                    index === 1 && "text-destructive focus:bg-destructive focus:text-destructive-foreground"
                  ),
                }))}
                align="end"
              />
            </div>
          </nav>
        </section>
      </section>
    </main>
  ) : (
    <div className="min-h-screen flex items-center justify-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        <p className="text-muted-foreground">{t("loadingMessage.promptCreationForm")}</p>
      </div>
    </div>
  );
}
