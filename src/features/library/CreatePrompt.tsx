import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";

import { Checkbox } from "../../components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";
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
  };

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
      <AlertDialog open={openDiscardModal} onOpenChange={setOpenDiscardModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you would like to discard the changes to this prompt?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigator(-1)}>
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
              Create AI instructions that will guide student interactions with the system.
            </p>
          </div>
        </div>
      </header>

      <section aria-labelledby="prompt-setup-heading">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 id="prompt-setup-heading" className="text-2xl font-bold text-foreground mb-1">
              Prompt Setup
            </h2>
            <p className="text-muted-foreground text-sm">
              Configure your prompt content and metadata settings.
            </p>
          </div>
          <nav className="flex flex-col md:flex-row gap-2" role="toolbar" aria-label="Prompt creation actions">
            <Button
              size="sm"
              onClick={() => {
                if (selectedIndexSave === 0) {
                  handleSubmit();
                } else {
                  setOpenDiscardModal(true);
                }
              }}
              aria-label={isLoading ? "Saving prompt..." : `${options[selectedIndexSave]} prompt`}
            >
              {options[selectedIndexSave]}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" aria-label="Select save and publish strategy">
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {options.map((option, index) => (
                  <DropdownMenuItem
                    key={option}
                    onClick={() => handleMenuItemClick(index)}
                  >
                    {option}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </header>

        <div className="border-primary/20 bg-primary/5 rounded-lg p-4 mb-6">
          <p className="text-primary/80 mb-4">
            Prompts function in PapyrusAI as the first set of instructions sent
            to the AI that will guide students' interactions with the AI. For
            more information on creating a prompt, please see the{" "}
            <a
              href="https://docs.google.com/document/d/1o3He0CdgV7hJOX65gc3Gpf3_Fr3GYvSm4Q-i-Y5cNHQ/edit?tab=t.0#heading=h.9dbj73hbtf5k"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:no-underline font-medium"
            >
              "Creating a Prompt" section of our instructor guide
            </a>
            .
          </p>
          <p className="text-sm text-primary/70">
            * indicates a required field
          </p>
        </div>

        <Card className="transition-all duration-300 hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-foreground">
              Prompt Information
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              Enter the essential details for your prompt. Fields marked with * are required.
            </p>
          </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Prompt Name *
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        The name for the prompt that users will see. We
                        recommend choosing a name that makes it easy for
                        students to understand what the prompt will do or help
                        them with.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="name"
                name="name"
                placeholder="Enter prompt name"
                value={newPrompt.name}
                onChange={handleChange}
                disabled={isLoading}
                required
                className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
                aria-describedby={errors.name ? "name-error" : undefined}
              />
              {errors.name && (
                <p id="name-error" className="text-sm text-destructive" role="alert">
                  {errors.name}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="prompt" className="text-sm font-medium">
                  Prompt *
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        The instructions that will be sent to the AI (i.e., the
                        first message sent to the AI that will guide the
                        interaction).
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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
                className={errors.prompt ? "border-destructive focus-visible:ring-destructive" : ""}
                aria-describedby={errors.prompt ? "prompt-error" : undefined}
              />
              {errors.prompt && (
                <p id="prompt-error" className="text-sm text-destructive" role="alert">
                  {errors.prompt}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Tags</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Tags describe a feature of the prompts and will be used
                        to allow for sorting prompts by type.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                {tagList.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2">
                    {tagList.map((tag) => (
                      <div key={tag.id} className="flex items-center space-x-2">
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
                {newPrompt.tags.length > 0 ? newPrompt.tags.join(", ") : "None"}
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
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
