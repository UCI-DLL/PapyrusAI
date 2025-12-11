import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Checkbox } from "../../components/ui/checkbox";
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
import { TagType } from "../../utility/types/CourseTypes";
import { AlertContext } from "../../utility/context/AlertContext";
import { cn } from "../../lib/utils";
import { getTagList } from "../../utility/endpoints/TagsEndpoints";
import Post from "../../utility/Post";
import {
  getOrgPrompt,
  getUserPrompt,
  postCreateOrgPrompt,
  postCreateUserPrompt,
  postUpdateOrgPrompt,
  postUpdateUserPrompt,
} from "../../utility/endpoints/FolderEndpoints";
import Put from "../../utility/Put";
import { useTranslation } from "../../hooks/useTranslation";

type PromptFormMode = "create" | "edit";

type PromptFormType = {
  name: string;
  prompt: string;
  tags: Array<string>;
};

interface PromptFormProps {
  mode?: PromptFormMode;
  orgFolder?: boolean;
  folderId?: string;
  promptId?: string;
}

export default function CreatePrompt({
  mode = "create",
  orgFolder = false,
  folderId,
  promptId,
}: PromptFormProps = {}): JSX.Element {
  let location = useLocation();
  let navigator = useNavigate();
  const { t } = useTranslation();
  
  // Translated options
  const options = [t("createPrompt.savePublish"), t("createPrompt.discardChanges")];
  
  // Determine if we're in edit mode based on URL or props
  const isEditMode =
    mode === "edit" || !location.pathname.includes("/createprompt")
  const isOrgFolder = orgFolder || location.pathname.split("/")[2] === "org";
  const actualFolderId =
    folderId ||
    (isOrgFolder
      ? location.pathname.split("/")[3]
      : location.pathname.split("/")[2]);
  const actualPromptId = isEditMode ?
    (promptId || (isOrgFolder ? location.pathname.split("/")[5] : location.pathname.split("/")[4])) : undefined;
  const [prompt, setPrompt] = useState<PromptFormType>({
    name: "",
    prompt: "",
    tags: [],
  });
  const [errors, setErrors] = useState<any>({
    name: "",
    prompt: "",
    tags: "",
  });
  const [promptInfo, setPromptInfo] = useState<{
    isOrgFolder: boolean;
    folderId: string;
    promptId: string | undefined;
  }>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { setAlert } = useContext(AlertContext);
  const [selectedIndexSave, setSelectedIndexSave] = useState(0);
  const [openDiscardModal, setOpenDiscardModal] = useState<boolean>(false);
  const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
  const [openSaveTop, setOpenSaveTop] = useState(false);
  const [openSaveBottom, setOpenSaveBottom] = useState(false);
  const [showSavePublishTooltip, setShowSavePublishTooltip] =
    useState<boolean>(false);
  const [tagList, setTagList] = useState<Array<TagType>>([]);

  useEffect(() => {
    const controller = new AbortController();
    if (tagList.length === 0) {
      getTags("", controller.signal);
    }

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line
  }, [location.pathname]);

  useEffect(() => {
    if (isEditMode && actualFolderId && actualPromptId) {
      // Load existing module data for edit mode
      const controller = new AbortController();
      setPromptInfo({ isOrgFolder: isOrgFolder, folderId: actualFolderId, promptId: actualPromptId });

      getPrompt(isOrgFolder, actualFolderId, actualPromptId, controller.signal)

      return () => {
        controller.abort();
      };
    } else if (!isEditMode) {
      // For create mode, just set loading to false
      setIsLoading(false);
      setPromptInfo({ isOrgFolder: isOrgFolder, folderId: actualFolderId, promptId: undefined });
    }
    // eslint-disable-next-line
  }, [isEditMode, actualFolderId, actualPromptId, isOrgFolder])

  function getPrompt(
    isOrg: boolean,
    folderId: string,
    promptId: string,
    signal: AbortSignal
  ) {
    if (!isOrg) {
      Get(getUserPrompt(folderId, promptId), signal).then((res) => {
        if (res && res.status && res.status < 300) {
          if (res.data) {
            //also set session
            setPrompt(res.data);
            setIsLoading(false);
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          if (res === undefined) {
          } else {
            //handle error
            //redirect to prompt list
            navigator("/library");
            setAlert({ message: "Prompt Does Not Exist", type: "error" });
            setIsLoading(false);
          }
        }
      });
    } else {
      Get(getOrgPrompt(folderId, promptId), signal).then((res) => {
        if (res && res.status && res.status < 300) {
          if (res.data) {
            //also set session
            setPrompt(res.data);
            setIsLoading(false);
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          if (res === undefined) {
          } else {
            //handle error
            //redirect to prompt list
            navigator("/library");
            setAlert({ message: "Prompt Does Not Exist", type: "error" });
            setIsLoading(false);
          }
        }
      });
    }
  }


  function getTags(startKey: string, signal: AbortSignal) {
    var limit = 20;
    Get(getTagList(limit, startKey), signal).then((res) => {
      if (res && res.status && res.status < 300) {
        if (res.data && res.data.tags && res.data.ScannedCount !== undefined) {
          //Get the list of all folders
          setTagList((prev) => [...prev, ...res.data.tags]);
          //if the data is 20 prompts, then call for the next page
          //handle pages
          if (
            res.data.ScannedCount > 0 &&
            res.data.ScannedCount >= limit &&
            res.data.LastEvaluatedKey &&
            res.data.LastEvaluatedKey.id
          ) {
            getTags(res.data.LastEvaluatedKey.id, signal);
          } else {
            setIsLoading(false);
          }
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        if (res === undefined) {
        } else {
          // handle error
          setIsLoading(false);
        }
      }
    });
  }

  const handleMenuItemClick = (index: number) => {
    if (index === 0) {
      //Save and publish
      handleSubmit(null);
    } else if (index === 1) {
      //discard changes
      setOpenDiscardModal(true);
    }
    setSelectedIndexSave(index);
    setOpenSaveTop(false);
    setOpenSaveBottom(false);
  };

  function handleClick(e: any) {
    if (selectedIndexSave === 0) {
      //Save and publish
      handleSubmit(e);
    } else if (selectedIndexSave === 1) {
      //discard changes
      setOpenDiscardModal(true);
    }
  }

  function handleSubmit(e: any, isDeleted = false) {
    setIsLoading(true);
    if (prompt.name === "") {
      setErrors((prev: any) => ({ ...prev, name: t("common.name") + " " + t("common.missing") }));
    } else if (prompt.prompt === "") {
      setErrors((prev: any) => ({ ...prev, prompt: t("createPrompt.promptName") + " " + t("common.missing") }));
    } else {
      if (isEditMode && promptInfo && promptInfo.promptId) { //editing prompt
        const dataToSend = {
          name: prompt.name,
          prompt: prompt.prompt,
          isDeleted: isDeleted,
          tags: prompt.tags,
        };
        if (promptInfo && promptInfo.isOrgFolder) {
          //       // post data back
          Put(
            postUpdateOrgPrompt(promptInfo.folderId, promptInfo.promptId),
            dataToSend
          ).then((res) => {
            if (res.status && res.status < 300) {
              if (res.data && res.data) {
                //pop up notifying user of update
                setAlert({ message: t("createPrompt.promptUpdated"), type: "success" });
              }
            } else if (res && res.status === 401) {
              navigator("/login");
            } else {
              // handle error
              if (res) {
                setAlert({
                  message: t("createPrompt.promptCouldNotBeUpdated"),
                  type: "error",
                });
              }
            }
            navigator(`/library/org/${promptInfo.folderId}`);
            setIsLoading(false);
          });
        } else if (promptInfo) {
          // post data back
          Put(
            postUpdateUserPrompt(promptInfo.folderId, promptInfo.promptId),
            dataToSend
          ).then((res) => {
            if (res.status && res.status < 300) {
              if (res.data && res.data) {
                //pop up notifying user of updated
                setAlert({ message: "Prompt updated", type: "success" });
              }
            } else if (res && res.status === 401) {
              navigator("/login");
            } else {
              // set errors
              setAlert({
                message: "Prompt could not be updated. Try again later.",
                type: "error",
              });
            }
            navigator(`/library/${promptInfo.folderId}`);
            setIsLoading(false);
          });
        }
      } else { //creating new prompt
        if (promptInfo?.isOrgFolder) {
          setIsLoading(true);
          const dataToSend = {
            name: prompt.name,
            prompt: prompt.prompt,
            isDeleted: false,
            tags: prompt.tags,
          };
          // post data back
          Post(postCreateOrgPrompt(promptInfo.folderId), dataToSend).then((res) => {
            if (res.status && res.status < 300) {
              if (res.data && res.data) {
                //pop up notifying user of created
                setAlert({ message: t("createPrompt.promptCreated"), type: "success" });
              }
            } else if (res && res.status === 401) {
              navigator("/login");
            } else {
              // handle error
              if (res) {
                setAlert({
                  message: t("createPrompt.promptCouldNotBeCreated"),
                  type: "error",
                });
              }
            }
            navigator(`/library/org/${promptInfo.folderId}`);
          });
        } else if (promptInfo) {
          setIsLoading(true);
          const dataToSend = {
            name: prompt.name,
            prompt: prompt.prompt,
            isDeleted: false,
            tags: prompt.tags,
          };
          // post data back
          Post(postCreateUserPrompt(promptInfo.folderId), dataToSend).then(
            (res) => {
              if (res.status && res.status < 300) {
                if (res.data && res.data) {
                  //pop up notifying user of Created
                  setAlert({ message: t("createPrompt.promptCreated"), type: "success" });
                }
              } else if (res && res.status === 401) {
                navigator("/login");
              } else {
                // set errors
                setAlert({
                  message: t("createPrompt.promptCouldNotBeCreated"),
                  type: "error",
                });
              }
              navigator(`/library/${promptInfo.folderId}`);
            }
          );
        }
      }

    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setPrompt((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  const handleTagToggle = (tagId: string) => {
    setPrompt((prev) => {
      const isSelected = prev.tags.includes(tagId);
      return {
        ...prev,
        tags: isSelected
          ? prev.tags.filter((id) => id !== tagId)
          : [...prev.tags, tagId],
      };
    });
  };

  return promptInfo && !isLoading ? (
    <main className="bg-background text-foreground p-4 space-y-6">
      {/* Dialogs */}
      <DialogWrapper
        open={showSavePublishTooltip}
        onOpenChange={setShowSavePublishTooltip}
        title="About Prompts"
        contentClassName="sm:max-w-md"
        actions={[
          {
            label: "Got it",
            onClick: () => setShowSavePublishTooltip(false),
          },
        ]}
      >
        <div className="space-y-3">
          <p>
            Prompts function in PapyrusAI as the first set of instructions sent
            to the AI that will guide students' interactions with the AI. When
            you click <strong>"Save & Publish"</strong>, your prompt will be
            saved to your library.
          </p>
          <p className="text-sm">
            For more information on creating a prompt, please see the{" "}
            <a
              href="https://docs.google.com/document/d/1o3He0CdgV7hJOX65gc3Gpf3_Fr3GYvSm4Q-i-Y5cNHQ/edit?tab=t.0#heading=h.9dbj73hbtf5k"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:no-underline text-primary dark:text-gold colorful-dark:text-gold font-medium"
            >
              "Creating a Prompt" section of our instructor guide
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
          {
            label: t("common.cancel"),
            onClick: () => setOpenDiscardModal(false),
            variant: "outline",
            disabled: isLoading
          },
          {
            label: t("createPrompt.discardChanges"),
            onClick: () => navigator(-1),
            variant: "destructive",
            disabled: isLoading
          },
        ]}
      />

      <DialogWrapper
        open={openDeleteModal}
        onOpenChange={setOpenDeleteModal}
        title={t("createPrompt.deletePrompt")}
        description={t("createPrompt.deletePromptMessage")}
        contentClassName="sm:max-w-md"
        actions={[
          {
            label: t("common.cancel"),
            onClick: () => setOpenDeleteModal(false),
            variant: "outline",
            disabled: isLoading
          },
          {
            label: t("common.delete"),
            onClick: () => handleSubmit(null, true),
            variant: "destructive",
            disabled: isLoading
          },
        ]}
      />

      {/* Standard Page Header Pattern */}
      <header className="animate-in slide-in-from-bottom-4 duration-700">
        <div className="relative overflow-hidden bg-card border rounded-xl p-6 shadow-lg">
          <div
            className="absolute top-0 right-0 w-48 h-48 opacity-10"
            aria-hidden="true"
          >
            <MessageSquare size={192} className="text-primary" />
          </div>
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
              <h1 className="text-4xl font-bold mb-2 text-foreground leading-tight">
                {isEditMode
                  ? t("createPrompt.editPrompt")
                  : t("createPrompt.createPrompt")}
              </h1>
              <nav
                className="flex flex-col md:flex-row gap-2"
                aria-label="Prompt creation actions"
              >
                {isEditMode && (
                  <TooltipWrapper content={t("createPrompt.deletePrompt")}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOpenDeleteModal(true)}
                      disabled={isLoading}
                      aria-label="Delete prompt permanently"
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </TooltipWrapper>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSavePublishTooltip(true)}
                  aria-label="Get help with prompt creation"
                >
                  <Info className="h-4 w-4" aria-hidden="true" />
                </Button>
                <div className="flex rounded-lg border">
                  <Button
                    size="sm"
                    onClick={handleClick}
                    className="rounded-none border-0 w-full rounded-l"
                    disabled={isLoading}
                    aria-label={`${options[selectedIndexSave]} prompt`}
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
                        aria-label="Select prompt save strategy"
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

            <p className="text-muted-foreground max-w-2xl text-base leading-6">
              {t("createPrompt.createPromptDescription")}
            </p>
          </div>
        </div>
      </header>

      {/* Actions Section */}
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
                    <button aria-label={t("createPrompt.promptNameTooltip")}>
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
                    aria-live="assertive"
                  >
                    {errors.name}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="prompt" className="text-sm font-medium">
                    {t("common.prompt")} *
                  </Label>
                  <TooltipWrapper content={t("createPrompt.promptTooltip")}>
                    <button aria-label={t("createPrompt.promptTooltip")}>
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
                  className={
                    errors.prompt
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
                  aria-describedby={errors.prompt ? "prompt-error" : undefined}
                />
                {errors.prompt && (
                  <p
                    id="prompt-error"
                    className="text-sm text-destructive"
                    role="alert"
                    aria-live="assertive"
                  >
                    {errors.prompt}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Tags</Label>
                  <TooltipWrapper content="Tags describe a feature of the prompts and will be used to allow for sorting prompts by type.">
                    <button aria-label="Tags describe a feature of the prompts and will be used to allow for sorting prompts by type.">
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </TooltipWrapper>
                </div>
                <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                  {tagList.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2">
                      {tagList.map((tag) => (
                        <div
                          key={tag.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`tag-${tag.id}`}
                            aria-labelledby={`tag-${tag.id}label`}
                            checked={prompt.tags.includes(tag.id)}
                            onCheckedChange={() => handleTagToggle(tag.id)}
                            disabled={isLoading}
                          />
                          <Label
                            id={`tag-${tag.id}label`}
                            htmlFor={`tag-${tag.id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {tag.id}
                          </Label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No tags available
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Selected:{" "}
                  {prompt.tags.length > 0
                    ? prompt.tags.join(", ")
                    : "None"}
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Bottom Actions */}
        <section aria-labelledby="bottom-actions-heading" className="pt-4">
          <nav
            className="flex flex-col md:flex-row md:items-center md:justify-end gap-2"
            aria-label="Prompt creation actions"
            id="bottom-actions-heading"
          >
            {isEditMode && (
              <TooltipWrapper content="Delete Prompt">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenDeleteModal(true)}
                  disabled={isLoading}
                  aria-label="Delete prompt permanently"
                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Delete
                </Button>
              </TooltipWrapper>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSavePublishTooltip(true)}
              aria-label="Get help with prompt creation"
            >
              <Info className="h-4 w-4" aria-hidden="true" />
              Info
            </Button>
            <div className="flex rounded-lg border">
              <Button
                size="sm"
                onClick={handleClick}
                className="rounded-none border-0 w-full rounded-l"
                disabled={isLoading}
                aria-label={`${options[selectedIndexSave]} prompt`}
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
                    aria-label="Select prompt save strategy"
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
    <div
      className="min-h-screen flex items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4">
        <Loader2
          className="h-8 w-8 animate-spin text-primary"
          aria-hidden="true"
        />
        <p className="text-muted-foreground">Loading prompt creation form...</p>
      </div>
    </div>
  );
}
