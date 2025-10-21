import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import { Checkbox } from "../../components/ui/checkbox";
import Get from "../../utility/Get";
import Put from "../../utility/Put";
import { PromptType, TagType } from "../../utility/types/CourseTypes";
import { AlertContext } from "../../utility/context/AlertContext";
import { getTagList } from "../../utility/endpoints/TagsEndpoints";
import {
  getOrgPrompt,
  getUserPrompt,
  postUpdateOrgPrompt,
  postUpdateUserPrompt,
} from "../../utility/endpoints/FolderEndpoints";
import { cn } from "../../lib/utils";
import {
  Trash2,
  ChevronDown,
  Loader2,
  Info,
  MessageSquare,
} from "lucide-react";

const options = ["Save & Publish", "Discard Changes"];

export default function EditPrompt(): JSX.Element {
  let location = useLocation();
  let navigator = useNavigate();
  const [prompt, setPrompt] = useState<PromptType>();
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
    promptId: string;
  }>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { setAlert } = useContext(AlertContext);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(0);
  const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
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
      location.pathname.split("/")[4] === "prompts" &&
      location.pathname.split("/")[5]
    ) {
      //get prev prompt data
      const folderId = location.pathname.split("/")[3];
      const promptId = location.pathname.split("/")[5];
      //save the ids
      setPromptInfo({
        isOrgFolder: true,
        folderId: folderId,
        promptId: promptId,
      });
      getPrompt(true, folderId, promptId, controller.signal);
    } else if (
      location.pathname &&
      location.pathname.split("/") &&
      location.pathname.split("/")[1] &&
      location.pathname.split("/")[2] !== "org" &&
      location.pathname.split("/")[3] === "prompts" &&
      location.pathname.split("/")[4]
    ) {
      //get prev prompt data
      const folderId = location.pathname.split("/")[2];
      const promptId = location.pathname.split("/")[4];
      //save the ids
      setPromptInfo({
        isOrgFolder: false,
        folderId: folderId,
        promptId: promptId,
      });
      getPrompt(false, folderId, promptId, controller.signal);
    }

    if (tagList.length === 0) {
      getTags("", controller.signal);
    }

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line
  }, [location.pathname]);

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
            setNewPrompt(res.data);
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
            setNewPrompt(res.data);
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

  // function handleSaveClick(e: any) {
  //   if (selectedOption === 0) { //Save and publish
  //     handleSubmit(e, false);
  //   } else if (selectedOption === 1) { //discard changes
  //     setOpenDiscardModal(true);
  //   }
  // };

  const handleMenuItemClick = (index: number) => {
    if (index === 0) {
      //Save and publish
      handleSubmit(null, false);
    } else if (index === 1) {
      //discard changes
      setOpenDiscardModal(true);
    }
    setSelectedOption(index);
    setDropdownOpen(false);
    setOpenSaveTop(false);
    setOpenSaveBottom(false);
  };

  function handleClick(e: any) {
    if (selectedOption === 0) {
      //Save and publish
      handleSubmit(e, false);
    } else if (selectedOption === 1) {
      //discard changes
      setOpenDiscardModal(true);
    }
  }

  function handleSubmit(e: any, isDeleted = false) {
    e.preventDefault();
    setIsLoading(true);
    const dataToSend = {
      name: newPrompt.name,
      prompt: newPrompt.prompt,
      isDeleted: isDeleted,
      tags: newPrompt.tags,
    };
    if (!isDeleted && newPrompt.name === "") {
      setErrors((prev: any) => ({ ...prev, name: "Name is too short" }));
      setIsLoading(false);
    } else if (!isDeleted && newPrompt.prompt === "") {
      setErrors((prev: any) => ({ ...prev, prompt: "Prompt is too short" }));
      setIsLoading(false);
    } else if (promptInfo && promptInfo.isOrgFolder) {
      // post data back
      Put(
        postUpdateOrgPrompt(promptInfo.folderId, promptInfo.promptId),
        dataToSend
      ).then((res) => {
        if (res.status && res.status < 300) {
          if (res.data && res.data) {
            //pop up notifying user of update
            setAlert({ message: "Prompt Updated", type: "success" });
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          // handle error
          if (res) {
            setAlert({
              message: "Prompt could not be updated. Try again later.",
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
    } else {
      setIsLoading(false);
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setNewPrompt((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  const handleTagToggle = (tagId: string) => {
    setNewPrompt((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter((id) => id !== tagId)
        : [...prev.tags, tagId],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading prompt...</span>
      </div>
    );
  }

  if (!promptInfo || !newPrompt.name) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Prompt does not exist</p>
      </div>
    );
  }

  return (
    <main className="bg-background text-foreground p-4 space-y-6">
      {/* Dialogs */}
      <Dialog
        open={showSavePublishTooltip}
        onOpenChange={setShowSavePublishTooltip}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Editing Prompts
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm leading-6">
              Update your prompt name, content, or tags as needed. Click{" "}
              <strong>"Save & Publish"</strong> to save your changes.
            </p>
            <p className="text-sm text-muted-foreground italic">
              Note: Choosing <strong>"Discard Changes"</strong> will return you
              to the previous page without saving any modifications.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSavePublishTooltip(false)}>
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openDeleteModal} onOpenChange={setOpenDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Delete Prompt?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Are you sure you would like to permanently delete this prompt?
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpenDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={(e) => handleSubmit(e, true)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openDiscardModal} onOpenChange={setOpenDiscardModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Discard Changes?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Are you sure you would like to discard the changes to this prompt?
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setOpenDiscardModal(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => navigator(-1)}>
              Discard Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              Edit <span className="text-primary">{prompt?.name}</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl text-base leading-6">
              Update your AI prompt instructions and configuration.
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
              Prompt Management
            </h2>
            <p className="text-muted-foreground text-sm">
              Update prompt content, settings, and metadata as needed.
            </p>
          </div>
          <nav
            className="flex flex-col md:flex-row gap-2"
            role="toolbar"
            aria-label="Prompt editing actions"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSavePublishTooltip(true)}
              aria-label="Get help with prompt editing"
            >
              <Info className="h-4 w-4" aria-hidden="true" />
              Info
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setOpenDeleteModal(true)}
                    disabled={isLoading}
                    aria-label="Delete prompt permanently"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Delete
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete Prompt</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="flex rounded-lg border overflow-hidden">
              <Button
                size="sm"
                onClick={handleClick}
                className="rounded-none border-0"
                disabled={isLoading}
                aria-label={`${options[selectedOption]} prompt`}
              >
                {options[selectedOption]}
              </Button>
              <DropdownMenu open={openSaveTop} onOpenChange={setOpenSaveTop}>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    className="rounded-none border-0 border-l px-2"
                    variant="default"
                    disabled={isLoading}
                    aria-label="Select prompt save strategy"
                  >
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {options.map((option, index) => (
                    <DropdownMenuItem
                      key={option}
                      onClick={() => handleMenuItemClick(index)}
                      className={cn(
                        index === selectedOption && "bg-accent",
                        index === 1 && "text-destructive focus:text-destructive"
                      )}
                    >
                      {option}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </nav>
        </header>

        <Card className="transition-all duration-300 hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-foreground">
              Prompt Information
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              Update the essential details for your prompt. Fields marked with *
              are required.
            </p>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => handleSubmit(e, false)}
              className="space-y-6"
            >
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
                          The name for the prompt that users will see.
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
                  className={cn(
                    "transition-colors",
                    errors.name &&
                      "border-destructive focus-visible:ring-destructive"
                  )}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="prompt" className="text-sm font-medium">
                  Prompt *
                </Label>
                <Textarea
                  id="prompt"
                  name="prompt"
                  placeholder="Enter your prompt text here..."
                  value={newPrompt.prompt}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                  rows={5}
                  className={cn(
                    "transition-colors resize-none",
                    errors.prompt &&
                      "border-destructive focus-visible:ring-destructive"
                  )}
                />
                {errors.prompt && (
                  <p className="text-sm text-destructive">{errors.prompt}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Tags</Label>
                <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                  {tagList.length > 0 ? (
                    tagList.map((tag, index) => (
                      <div key={index} className="flex items-center space-x-2">
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
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No tags available
                    </p>
                  )}
                </div>
                {newPrompt.tags.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Selected: {newPrompt.tags.join(", ")}
                  </div>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Bottom Actions */}
        <section aria-labelledby="bottom-actions-heading" className="pt-4">
          <nav
            className="flex flex-col md:flex-row md:items-center md:justify-end gap-2"
            role="toolbar"
            aria-label="Prompt editing actions"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSavePublishTooltip(true)}
              aria-label="Get help with prompt editing"
            >
              <Info className="h-4 w-4" aria-hidden="true" />
              Info
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setOpenDeleteModal(true)}
                    disabled={isLoading}
                    aria-label="Delete prompt permanently"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Delete
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete Prompt</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="flex rounded-lg border overflow-hidden">
              <Button
                size="sm"
                onClick={handleClick}
                className="rounded-none border-0"
                disabled={isLoading}
                aria-label={`${options[selectedOption]} prompt`}
              >
                {options[selectedOption]}
              </Button>
              <DropdownMenu
                open={openSaveBottom}
                onOpenChange={setOpenSaveBottom}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    className="rounded-none border-0 border-l px-2"
                    variant="default"
                    disabled={isLoading}
                    aria-label="Select prompt save strategy"
                  >
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {options.map((option, index) => (
                    <DropdownMenuItem
                      key={option}
                      onClick={() => handleMenuItemClick(index)}
                      className={cn(
                        index === selectedOption && "bg-accent",
                        index === 1 && "text-destructive focus:text-destructive"
                      )}
                    >
                      {option}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </nav>
        </section>
      </section>
    </main>
  );
}
