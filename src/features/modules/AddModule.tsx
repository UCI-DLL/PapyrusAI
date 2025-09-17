import React, { useState, useContext, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../components/ui/dropdown-menu";
import { Checkbox } from "../../components/ui/checkbox";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Separator } from "../../components/ui/separator";
import { ChevronDown, Info, Plus, Loader2, FileText, MessageSquare, Save, Folder } from "lucide-react";
import Put from "../../utility/Put";
import { putCreateModule } from "../../utility/endpoints/CourseEndpoints";
import { AlertContext } from "../../utility/context/AlertContext";
import { cn } from "../../lib/utils";
import ListFolderContents from "../library/ListFolderContents";
import ListFolders from "../library/ListFolders";
import Get from "../../utility/Get";
import {
  getOrgFile,
  getOrgPrompt,
  getUserFile,
  getUserPrompt,
} from "../../utility/endpoints/FolderEndpoints";
import { Prompt } from "../../components/Prompt";
import { FileType, PromptType } from "../../utility/types/CourseTypes";
import { File } from "../../components/File";

type AddModuleType = {
  name: string;
  moduleDescription: string;
  isRepeating: boolean;
  isPublished: boolean;
  showInitialPrompt: boolean;
  prompts: Array<PromptType>;
  files: Array<FileType>;
  raterEnabled: boolean;
};
//Note: ^ missing showWizard. Need to add later

export enum SortOptions {
  Ascending = "Ascending",
  Descending = "Descending",
  Newest = "Newest",
  Oldest = "Oldest",
}

const options = [
  "Save & Publish",
  "Save without Publishing",
  "Discard Changes",
];

export default function AddModule(): JSX.Element {
  let location = useLocation();
  let navigator = useNavigate();
  const [session, setSession] = useState<AddModuleType>({
    name: "",
    moduleDescription: "",
    isRepeating: false,
    isPublished: false,
    showInitialPrompt: true,
    prompts: [],
    files: [],
    raterEnabled: false,
  });
  const [errors, setErrors] = useState<any>({
    name: "",
    moduleDescription: "",
    isRepeating: "",
    isPublished: "",
    showInitialPrompt: "",
    prompts: "",
    files: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { setAlert } = useContext(AlertContext);
  const [openSelectFolderModal, setOpenSelectFolderModal] =
    useState<boolean>(false);
  const [openSelectPromptModal, setOpenSelectPromptModal] = useState<{
    folderId: string;
    isOrgFolder: boolean;
  }>({ folderId: "", isOrgFolder: false });
  const [openSave, setOpenSave] = useState(false);
  const [selectedIndexSave, setSelectedIndexSave] = useState(0);
  const [openDiscardModal, setOpenDiscardModal] = useState<boolean>(false);
  const [showSavePublishTooltip, setShowSavePublishTooltip] =
    useState<boolean>(false);
  const [openConfirmationModal, setOpenConfirmationModal] = useState<{
    id: string;
    type: string;
  }>({
    id: "",
    type: "",
  });

  function handleSaveClick(e: any) {
    if (selectedIndexSave === 0) {
      //Save and publish
      handleSubmit(e, true);
    } else if (selectedIndexSave === 1) {
      //save and not publish
      handleSubmit(e, false);
    } else if (selectedIndexSave === 2) {
      //discard changes
      setOpenDiscardModal(true);
    }
  }

  const handleMenuItemClick = (index: number) => {
    if (index === 0) {
      //Save and publish
      const fakeEvent = { preventDefault: () => {} } as any;
      handleSubmit(fakeEvent, true);
    } else if (index === 1) {
      //save and not publish
      const fakeEvent = { preventDefault: () => {} } as any;
      handleSubmit(fakeEvent, false);
    } else if (index === 2) {
      //discard changes
      setOpenDiscardModal(true);
    }
    setSelectedIndexSave(index);
    setOpenSave(false);
  };

  const handleToggle = () => {
    setOpenSave((prevOpen) => !prevOpen);
  };

  function handleSubmit(e: any, isPublished = false) {
    e.preventDefault();
    if (session.name === "") {
      setErrors((prev: any) => ({ ...prev, name: "Name missing" }));
    } else if (session.moduleDescription === "") {
      setErrors((prev: any) => ({
        ...prev,
        moduleDescription: "Module description missing",
      }));
    } else {
      //create module
      const courseId = location.pathname.split("/")[2];
      // set is loading
      setIsLoading(true);
      const dataToSend = {
        name: session.name,
        moduleDescription: session.moduleDescription,
        isRepeating: session.isRepeating,
        isPublished: isPublished,
        showInitialPrompt: session.showInitialPrompt,
        prompts: session.prompts, //Send prompts with all information + folderId
        files: session.files, //send files with all information + folderid
        isDeleted: false,
        raterEnabled: session.raterEnabled,
      };
      // post data back
      Put(putCreateModule(courseId), dataToSend).then((res) => {
        if (res && res.status && res.status < 300) {
          if (res.data && res.data) {
            //redirect to module list of that course
            navigator(`/courses/${courseId}/modules`);
            //pop up notifying user of creation
            setAlert({ message: "Module Created", type: "success" });
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          // set errors
          setErrors({ name: res.data, moduleDescription: res.data });
        }
        // set is loading back
        setIsLoading(false);
      });
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setSession((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function selectFolder(folderId: string, isOrgFolder: boolean) {
    setOpenSelectPromptModal({
      folderId: folderId,
      isOrgFolder: isOrgFolder,
    });
    setOpenSelectFolderModal(false);
  }

  function selectAsset(
    folderId: string,
    id: string,
    isOrgFolder: boolean,
    type: string
  ) {
    //type is "prompt" or "file"
    setOpenSelectPromptModal({
      folderId: "",
      isOrgFolder: false,
    });
    setIsLoading(true);
    const controller = new AbortController();
    //check if asset is prompt or file
    if (type === "prompt") {
      // get prompt and add it to list of prompts
      if (isOrgFolder) {
        Get(getOrgPrompt(folderId, id), controller.signal).then((res) => {
          if (res && res.status && res.status < 300) {
            if (res.data) {
              //also set session
              if (
                session.prompts.filter((x) => x.id === res.data.id).length === 0
              ) {
                setSession((prev) => ({
                  ...prev,
                  prompts: [
                    ...prev.prompts,
                    { ...res.data, isOrgFolder: true, folderId: folderId },
                  ],
                }));
              }
              setIsLoading(false);
            }
          } else if (res && res.status === 401) {
            navigator("/login");
          } else {
            if (res === undefined) {
            } else {
              //handle error
              setAlert({ message: "Prompt Does Not Exist", type: "error" });
              setIsLoading(false);
            }
          }
        });
      } else {
        Get(getUserPrompt(folderId, id), controller.signal).then((res) => {
          if (res && res.status && res.status < 300) {
            if (res.data) {
              //also set session
              if (
                session.prompts.filter((x) => x.id === res.data.id).length === 0
              ) {
                setSession((prev) => ({
                  ...prev,
                  prompts: [
                    ...prev.prompts,
                    { ...res.data, isOrgFolder: false, folderId: folderId },
                  ],
                }));
              }
              setIsLoading(false);
            }
          } else if (res && res.status === 401) {
            navigator("/login");
          } else {
            if (res === undefined) {
            } else {
              //handle error
              setAlert({ message: "Prompt Does Not Exist", type: "error" });
              setIsLoading(false);
            }
          }
        });
      }
    } else if (type === "file") {
      // get file and add it to list of files
      if (isOrgFolder) {
        Get(getOrgFile(folderId, id), controller.signal).then((res) => {
          if (res && res.status && res.status < 300) {
            if (res.data) {
              //also set session
              setSession((prev) => ({
                ...prev,
                files: [
                  ...prev.files,
                  { ...res.data, isOrgFolder: true, folderId: folderId },
                ],
              }));
              setIsLoading(false);
            }
          } else if (res && res.status === 401) {
            navigator("/login");
          } else {
            if (res === undefined) {
            } else {
              //handle error
              setAlert({ message: "File Does Not Exist", type: "error" });
              setIsLoading(false);
            }
          }
        });
      } else {
        Get(getUserFile(folderId, id), controller.signal).then((res) => {
          if (res && res.status && res.status < 300) {
            if (res.data) {
              //also set session
              setSession((prev) => ({
                ...prev,
                files: [
                  ...prev.files,
                  { ...res.data, isOrgFolder: false, folderId: folderId },
                ],
              }));
              setIsLoading(false);
            }
          } else if (res && res.status === 401) {
            navigator("/login");
          } else {
            if (res === undefined) {
            } else {
              //handle error
              setAlert({ message: "File Does Not Exist", type: "error" });
              setIsLoading(false);
            }
          }
        });
      }
    }
  }

  function refreshList() {} //empty

  function removeAsset(id: string, type: string) {
    if (type === "file") {
      // remove file from list
      setSession((prev) => {
        var fileList = prev.files;
        fileList = fileList.filter((p) => p.id !== id);
        return { ...prev, files: fileList };
      });
      setOpenConfirmationModal({ id: "", type: "" });
    } else if (type === "prompt") {
      // remove prompt from list
      setSession((prev) => {
        var promptList = prev.prompts;
        promptList = promptList.filter((p) => p.id !== id);
        return { ...prev, prompts: promptList };
      });
      setOpenConfirmationModal({ id: "", type: "" });
    } else {
      setAlert({
        message: "Something went wrong. Try again later",
        type: "error",
      });
    }
  }

  function setConfirmationModal(
    folderId: string,
    id: string,
    isOrgFolder: boolean,
    type: string
  ) {
    setOpenConfirmationModal({ id: id, type: type });
  }

  return !isLoading ? (
    <div className="space-y-6 p-6">
      <Dialog open={showSavePublishTooltip} onOpenChange={setShowSavePublishTooltip}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              What is Save & Publish?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p>
              To save and publish (i.e., make visible to students) your module,
              select "Save & Publish". If you want to save your module without
              publishing it, select "Save without Publishing".
            </p>
            <p className="text-sm text-muted-foreground italic">
              Note: Choosing this option after the module has already been
              published will unpublish the module.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSavePublishTooltip(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={openDiscardModal} onOpenChange={setOpenDiscardModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard Changes?</DialogTitle>
            <DialogDescription>
              Are you sure you would like to discard the changes to this module?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpenDiscardModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => navigator(-1)}>
              Discard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={openSelectFolderModal} onOpenChange={setOpenSelectFolderModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5" />
              Select Folder
            </DialogTitle>
          </DialogHeader>
          <div>
            <ListFolders noShowMenu onClick={selectFolder} compactGrid />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenSelectFolderModal(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog 
        open={openSelectPromptModal.folderId !== ""} 
        onOpenChange={(open) => !open && setOpenSelectPromptModal({ folderId: "", isOrgFolder: false })}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Select Asset
            </DialogTitle>
          </DialogHeader>
          <div>
            <ListFolderContents
              folderId={openSelectPromptModal.folderId}
              isOrgFolder={openSelectPromptModal.isOrgFolder}
              noShowMenu
              onClick={selectAsset}
              compactGrid
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setOpenSelectPromptModal({ folderId: "", isOrgFolder: false });
                setOpenSelectFolderModal(true);
              }}
            >
              Back
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                setOpenSelectPromptModal({ folderId: "", isOrgFolder: false })
              }
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog 
        open={openConfirmationModal.id !== ""} 
        onOpenChange={(open) => !open && setOpenConfirmationModal({ id: "", type: "" })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Asset?</DialogTitle>
            <DialogDescription>
              Are you sure you would like to remove this asset from the module?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setOpenConfirmationModal({ id: "", type: "" })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                removeAsset(
                  openConfirmationModal.id,
                  openConfirmationModal.type
                )
              }
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <header className="flex items-center justify-between pb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create Module</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSavePublishTooltip(true)}
          >
            <Info className="h-4 w-4" />
          </Button>
          <DropdownMenu open={openSave} onOpenChange={setOpenSave}>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2">
                <Save className="h-4 w-4" />
                {options[selectedIndexSave]}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {options.map((option, index) => (
                <DropdownMenuItem
                  key={option}
                  onClick={() => handleMenuItemClick(index)}
                  className={cn(
                    index === selectedIndexSave && "bg-accent",
                    index === 2 && "text-destructive focus:text-destructive"
                  )}
                >
                  {option}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Modules provide users access to conversations with the AI. Modules can
          be customized to allow or restrict access to specific assets, including
          conversation prompts (AI instructions) and documents. For more
          information on creating a module, please see the{" "}
          <a
            href="https://docs.google.com/document/d/1o3He0CdgV7hJOX65gc3Gpf3_Fr3GYvSm4Q-i-Y5cNHQ/edit?tab=t.0#heading=h.9og8mgqg1ofk"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:no-underline text-primary font-medium"
          >
            "Creating a Module" section of our instructor guide
          </a>
          .
        </AlertDescription>
      </Alert>
      
      <Separator className="my-6" />
      <p className="text-sm text-muted-foreground mb-6">* indicates a required field</p>
      
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Enter Module Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-6">
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="name">Module Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={session.name}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                  className={cn(errors.name && "border-destructive")}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-6"
                title="The name for your module that users will see."
              >
                <Info className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="moduleDescription">Module Description *</Label>
                <Textarea
                  id="moduleDescription"
                  name="moduleDescription"
                  value={session.moduleDescription}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                  className={cn(errors.moduleDescription && "border-destructive", "min-h-[100px]")}
                />
                {errors.moduleDescription && (
                  <p className="text-sm text-destructive">{errors.moduleDescription}</p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-6"
                title="The description for your module to help users understand the purpose or instructional goals for the module."
              >
                <Info className="h-4 w-4" />
              </Button>
            </div>
            
            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label className="text-base font-medium">Module Assets</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  title="You can customize your module to allow or restrict certain functions."
                >
                  <Info className="h-4 w-4" />
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenSelectFolderModal(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Asset
              </Button>
            </div>

            {session.prompts.length < 1 && session.files.length < 1 ? (
              <div className="text-center py-8 text-muted-foreground border border-dashed border-muted-foreground/25 rounded-lg">
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-8 w-8 opacity-50" />
                  <p>No assets added</p>
                  <p className="text-sm">
                    To add an asset (including prompts and documents), click "Add Asset" above.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                {session.prompts.map((prompt: PromptType, i) => {
                  return (
                    <div key={i}>
                      <Prompt
                        prompt={prompt}
                        folder={{
                          //pass in temp folder
                          id: prompt.folderId ? prompt.folderId : "",
                          creator: {
                            email: "",
                            sub: "",
                            name: "",
                            family_name: "",
                            username: "",
                          },
                          isDeleted: false,
                          name: "",
                          prompts: [],
                          organization: "",
                          timestamp: "",
                          files: [],
                        }}
                        keyy={`${i}`}
                        refreshList={() => refreshList()}
                        loading={() => setIsLoading(true)}
                        noShowMenu={true}
                        showRemove
                        onClick={setConfirmationModal}
                      />
                    </div>
                  );
                })}
                </div>

                <div className="space-y-3">
                {session.files &&
                  session.files.map((file: FileType, i) => {
                    return (
                      <div key={i}>
                        <File
                          file={file}
                          folder={{
                            //pass in temp folder
                            id: file.folderId ? file.folderId : "",
                            creator: {
                              email: "",
                              sub: "",
                              name: "",
                              family_name: "",
                              username: "",
                            },
                            isDeleted: false,
                            name: "",
                            prompts: [],
                            organization: "",
                            timestamp: "",
                            files: [],
                          }}
                          keyy={`${i}`}
                          refreshList={() => refreshList()}
                          loading={() => setIsLoading(true)}
                          noShowMenu={true}
                          showRemove
                          onClick={setConfirmationModal}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <Separator />

            <div className="flex items-center gap-2">
              <Label className="text-base font-medium">Module Settings</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                title="You can customize your module to allow or restrict certain functions."
              >
                <Info className="h-4 w-4" />
              </Button>
            </div>

          {/* <Checkbox
            onClick={() => {
              setSession((prev) => ({
                ...prev,
                isRepeating: !session.isRepeating
              }))
            }}
            checked={session.isRepeating}
            isDisabled={isLoading}
          >
            <span>
              Allow starter prompts to be re-selected during the conversation
            </span>
          </Checkbox> */}

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="showInitialPrompt"
                  checked={session.showInitialPrompt}
                  onCheckedChange={(checked) => {
                    setSession((prev) => ({
                      ...prev,
                      showInitialPrompt: checked as boolean,
                    }));
                  }}
                  disabled={isLoading}
                />
                <div className="space-y-2">
                  <Label htmlFor="showInitialPrompt" className="font-medium">
                    Show Embedded Prompt
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Allows users to see the full text of the embedded prompt with which
                    they begin their chat with the AI. Unchecking this will mean that
                    the user will not be able to see the initial text of the prompt sent
                    initially to the AI. For more information on why you might choose
                    one or the other, see the{" "}
                    <a
                      href="https://docs.google.com/document/d/1o3He0CdgV7hJOX65gc3Gpf3_Fr3GYvSm4Q-i-Y5cNHQ/edit?tab=t.0#heading=h.9og8mgqg1ofk"
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-2 hover:no-underline text-primary font-medium"
                    >
                      "Creating a Module" section of our instructor guide
                    </a>
                    .
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="raterEnabled"
                  checked={session.raterEnabled}
                  onCheckedChange={(checked) => {
                    setSession((prev) => ({
                      ...prev,
                      raterEnabled: checked as boolean,
                    }));
                  }}
                  disabled={isLoading}
                />
                <div className="space-y-2">
                  <Label htmlFor="raterEnabled" className="font-medium">
                    RATER Enabled
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Provide students with more tailored feedback on their argumentative
                    essays. Should only be used with essay drafts longer than 150 words.
                    Checking this will also provide analytics on students' essays with
                    the "View" button.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  ) : (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}
