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
import { ChevronDown, Info, Loader2, MessageSquare } from "lucide-react";
import Get from "../../utility/Get";
import { TagType } from "../../utility/types/CourseTypes";
import { AlertContext } from "../../utility/context/AlertContext";
import { cn } from "../../lib/utils";
import { getTagList } from "../../utility/endpoints/TagsEndpoints";
import Post from "../../utility/Post";
import {
  postCreateOrgPrompt,
  postCreateUserPrompt,
} from "../../utility/endpoints/FolderEndpoints";

const options = ["Save & Publish", "Discard Changes"];

export default function CreatePrompt(): JSX.Element {
  let location = useLocation();
  let navigator = useNavigate();
  const [newPrompt, setNewPrompt] = useState<{
    name: string;
    prompt: string;
    tags: Array<string>;
  }>({
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
  }>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { setAlert } = useContext(AlertContext);

  const [selectedIndexSave, setSelectedIndexSave] = useState(0);
  const [openDiscardModal, setOpenDiscardModal] = useState<boolean>(false);
  const [openSaveTop, setOpenSaveTop] = useState(false);
  const [openSaveBottom, setOpenSaveBottom] = useState(false);
  const [showSavePublishTooltip, setShowSavePublishTooltip] =
    useState<boolean>(false);
  const [tagList, setTagList] = useState<Array<TagType>>([]);

  useEffect(() => {
    const controller = new AbortController();
    //get pathname to figure out if we are editing
    if (
      location.pathname &&
      location.pathname.split("/") &&
      location.pathname.split("/")[1] &&
      location.pathname.split("/")[2] === "org" &&
      location.pathname.split("/")[3] &&
      location.pathname.split("/")[4] === "createprompt"
    ) {
      //get prev prompt data
      const folderId = location.pathname.split("/")[3];
      //save the ids
      setPromptInfo({ isOrgFolder: true, folderId: folderId });
    } else if (
      location.pathname &&
      location.pathname.split("/") &&
      location.pathname.split("/")[1] &&
      location.pathname.split("/")[2] !== "org" &&
      location.pathname.split("/")[3] === "createprompt"
    ) {
      //get prev prompt data
      const folderId = location.pathname.split("/")[2];
      //save the ids
      setPromptInfo({ isOrgFolder: false, folderId: folderId });
    }

    if (tagList.length === 0) {
      getTags("", controller.signal);
    }

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line
  }, [location.pathname]);

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
      handleSubmit();
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

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (newPrompt.name === "") {
      setErrors((prev: any) => ({ ...prev, name: "Name is too short" }));
    } else if (newPrompt.prompt === "") {
      setErrors((prev: any) => ({ ...prev, prompt: "Prompt is too short" }));
    } else if (promptInfo?.isOrgFolder) {
      setIsLoading(true);
      const dataToSend = {
        name: newPrompt.name,
        prompt: newPrompt.prompt,
        isDeleted: false,
        tags: newPrompt.tags,
      };
      // post data back
      Post(postCreateOrgPrompt(promptInfo.folderId), dataToSend).then((res) => {
        if (res.status && res.status < 300) {
          if (res.data && res.data) {
            //pop up notifying user of created
            setAlert({ message: "Prompt Created", type: "success" });
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          // handle error
          if (res) {
            setAlert({
              message: "Prompt could not be created. Try again later.",
              type: "error",
            });
          }
        }
        navigator(`/library/org/${promptInfo.folderId}`);
      });
    } else if (promptInfo) {
      setIsLoading(true);
      const dataToSend = {
        name: newPrompt.name,
        prompt: newPrompt.prompt,
        isDeleted: false,
        tags: newPrompt.tags,
      };
      // post data back
      Post(postCreateUserPrompt(promptInfo.folderId), dataToSend).then(
        (res) => {
          if (res.status && res.status < 300) {
            if (res.data && res.data) {
              //pop up notifying user of Created
              setAlert({ message: "Prompt Created", type: "success" });
            }
          } else if (res && res.status === 401) {
            navigator("/login");
          } else {
            // set errors
            setAlert({
              message: "Prompt could not be created. Try again later.",
              type: "error",
            });
          }
          navigator(`/library/${promptInfo.folderId}`);
        }
      );
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setNewPrompt((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  const handleTagToggle = (tagId: string) => {
    setNewPrompt((prev) => {
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
              className="underline underline-offset-2 hover:no-underline font-medium text-primary"
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
        title="Discard Changes?"
        description="Are you sure you would like to discard the changes to this prompt? This action cannot be undone."
        contentClassName="sm:max-w-md"
        actions={[
          {
            label: "Cancel",
            onClick: () => setOpenDiscardModal(false),
            variant: "outline",
          },
          {
            label: "Discard Changes",
            onClick: () => navigator(-1),
            variant: "destructive",
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
            <h1 className="text-4xl font-bold mb-2 text-foreground leading-tight">
              Create Prompt
            </h1>
            <p className="text-muted-foreground max-w-2xl text-base leading-6">
              Create AI instructions that will guide student interactions with
              the system. For more information on creating a prompt, please see
              the{" "}
              <a
                href="https://docs.google.com/document/d/1o3He0CdgV7hJOX65gc3Gpf3_Fr3GYvSm4Q-i-Y5cNHQ/edit?tab=t.0#heading=h.9dbj73hbtf5k"
                target="_blank"
                rel="noreferrer"
                className="font-medium underline underline-offset-2 hover:no-underline text-primary transition-colors duration-200"
              >
                "Creating a Prompt" section of our instructor guide
              </a>
              .
            </p>
          </div>
        </div>
      </header>

      {/* Actions Section */}
      <section aria-labelledby="actions-heading">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2
              id="actions-heading"
              className="text-2xl font-bold text-foreground mb-1"
            >
              Prompt Setup
            </h2>
            <p className="text-muted-foreground text-sm">
              Configure your prompt content and metadata settings.
            </p>
          </div>
          <nav
            className="flex flex-col md:flex-row gap-2"
            role="toolbar"
            aria-label="Prompt creation actions"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSavePublishTooltip(true)}
              aria-label="Get help with prompt creation"
            >
              <Info className="h-4 w-4" aria-hidden="true" />
              Info
            </Button>
            <div className="flex rounded-lg border overflow-hidden">
              <Button
                size="sm"
                onClick={handleClick}
                className="rounded-none border-0"
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
                    className="rounded-none border-0 border-l px-2"
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
                    index === selectedIndexSave && "bg-accent",
                    index === 1 && "text-destructive focus:text-destructive"
                  ),
                }))}
                align="end"
              />
            </div>
          </nav>
        </header>

        <Card className="transition-all duration-300 hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-foreground">
              Prompt Information
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              Enter the essential details for your prompt. Fields marked with *
              are required.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Prompt Name *
                  </Label>
                  <TooltipWrapper content="The name for the prompt that users will see. We recommend choosing a name that makes it easy for students to understand what the prompt will do or help them with.">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipWrapper>
                </div>
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter prompt name"
                  value={newPrompt.name}
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
                <div className="flex items-center gap-2">
                  <Label htmlFor="prompt" className="text-sm font-medium">
                    Prompt *
                  </Label>
                  <TooltipWrapper content="The instructions that will be sent to the AI (i.e., the first message sent to the AI that will guide the interaction).">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipWrapper>
                </div>
                <Textarea
                  id="prompt"
                  name="prompt"
                  placeholder="Enter your prompt instructions here..."
                  value={newPrompt.prompt}
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
                  >
                    {errors.prompt}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Tags</Label>
                  <TooltipWrapper content="Tags describe a feature of the prompts and will be used to allow for sorting prompts by type.">
                    <Info className="h-4 w-4 text-muted-foreground" />
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
                            checked={newPrompt.tags.includes(tag.id)}
                            onCheckedChange={() => handleTagToggle(tag.id)}
                            disabled={isLoading}
                          />
                          <Label
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
                  {newPrompt.tags.length > 0
                    ? newPrompt.tags.join(", ")
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
            role="toolbar"
            aria-label="Prompt creation actions"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSavePublishTooltip(true)}
              aria-label="Get help with prompt creation"
            >
              <Info className="h-4 w-4" aria-hidden="true" />
              Info
            </Button>
            <div className="flex rounded-lg border overflow-hidden">
              <Button
                size="sm"
                onClick={handleClick}
                className="rounded-none border-0"
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
                    className="rounded-none border-0 border-l px-2"
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
                    index === selectedIndexSave && "bg-accent",
                    index === 1 && "text-destructive focus:text-destructive"
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
