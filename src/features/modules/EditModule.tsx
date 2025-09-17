import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label"; 
import { Textarea } from "../../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../components/ui/dropdown-menu";
import { Checkbox } from "../../components/ui/checkbox";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Separator } from "../../components/ui/separator";
import { Trash2, ChevronDown, Info, Plus, Loader2, FileText, Folder, CheckCircle, XCircle, Edit } from "lucide-react";
import Get from "../../utility/Get";
import {
  getModule,
  putUpdateModule,
} from "../../utility/endpoints/CourseEndpoints";
import Put from "../../utility/Put";
import { AlertContext } from "../../utility/context/AlertContext";
import { cn } from "../../lib/utils";
import ListFolders from "../library/ListFolders";
import ListFolderContents from "../library/ListFolderContents";
import { FileType, PromptType } from "../../utility/types/CourseTypes";
import { Prompt } from "../../components/Prompt";
import {
  getOrgFile,
  getOrgPrompt,
  getUserFile,
  getUserPrompt,
} from "../../utility/endpoints/FolderEndpoints";
import { File } from "../../components/File";

type EditModuleType = {
  id: string;
  isDeleted: boolean;
  isPublished: boolean;
  isRepeating: boolean;
  isTemplate: boolean;
  moduleDescription: string;
  name: string;
  prompts: Array<PromptType>;
  files: Array<FileType>;
  showInitialPrompt: boolean;
  showWizard: boolean;
  raterEnabled: boolean;
};

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

export default function EditModule(): JSX.Element {
  let location = useLocation();
  let navigator = useNavigate();
  const [session, setSession] = useState<EditModuleType>({
    name: "",
    moduleDescription: "",
    isRepeating: false,
    isPublished: false,
    showInitialPrompt: true,
    prompts: [],
    files: [],
    showWizard: true,
    isDeleted: false, //prev
    isTemplate: false,
    id: "",
    raterEnabled: false,
  });
  const [errors, setErrors] = useState<any>({
    name: "",
    moduleDescription: "",
    prompts: "",
    files: "",
  });
  const [moduleIds, setModuleIds] = useState<{
    courseId: string;
    moduleId: string;
  }>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { setAlert } = useContext(AlertContext);
  const [openSelectFolderModal, setOpenSelectFolderModal] =
    useState<boolean>(false);
  const [openSelectPromptModal, setOpenSelectPromptModal] = useState<{
    folderId: string;
    isOrgFolder: boolean;
  }>({ folderId: "", isOrgFolder: false });
  const [openSave, setOpenSave] = useState(false);
  const [selectedIndexSave, setSelectedIndexSave] = useState(0);
  const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
  const [openDiscardModal, setOpenDiscardModal] = useState<boolean>(false);
  const [openActiveModal, setOpenActiveModal] = useState<boolean>(false);
  const [showSavePublishTooltip, setShowSavePublishTooltip] =
    useState<boolean>(false);
  const [openConfirmationModal, setOpenConfirmationModal] = useState<{
    id: string;
    type: string;
  }>({
    id: "",
    type: "",
  });

  useEffect(() => {
    //When the page changes, reset the alert
    setAlert({ message: "", type: "info" });

    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const controller = new AbortController();
    //get pathname to figure out if we are editing
    if (
      location.pathname &&
      location.pathname.split("/") &&
      location.pathname.split("/")[1] &&
      location.pathname.split("/")[2] &&
      location.pathname.split("/")[4]
    ) {
      //get prev course data
      const courseId = location.pathname.split("/")[2];
      const moduleId = location.pathname.split("/")[4];
      //save the ids
      setModuleIds({ courseId: courseId, moduleId: moduleId });
      Get(getModule(courseId, moduleId), controller.signal).then((res) => {
        if (res && res.status && res.status < 300) {
          if (res.data && res.data.prompts) {
            // assign prompts to be prompt ids
            //also set session
            var tempSession = res.data;
            if (!tempSession.files) {
              tempSession.files = [];
            }
            setSession(tempSession); //, prompts: res.data.prompts.map((p: PromptType) => p.id)
            setIsLoading(false);
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          if (res === undefined) {
          } else {
            //handle error
            navigator("/courses");
            setAlert({ message: "Module does not exist", type: "error" });
            setIsLoading(false);
          }
        }
      });
    }

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line
  }, [location.pathname]);


  const handleMenuItemClick = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    index: number
  ) => {
    if (index === 0) {
      //Save and publish
      handleSubmit(e, true, false);
    } else if (index === 1) {
      //save and not publish
      if (session.isPublished) {
        //handle case that module is already active and they are switching it
        setOpenActiveModal(true);
      } else {
        handleSubmit(e, false, false);
      }
    } else if (index === 2) {
      //discard changes
      setOpenDiscardModal(true);
    }
    setSelectedIndexSave(index);
    setOpenSave(false);
  };



  function handleSubmit(e: any, isPublished = false, isDeleted = false) {
    e.preventDefault();
    if (session.name === "") {
      setErrors((prev: any) => ({ ...prev, name: "Name missing" }));
    } else if (session.moduleDescription === "") {
      setErrors((prev: any) => ({
        ...prev,
        moduleDescription: "Module description missing",
      }));
    } else {
      //Update course
      if (moduleIds) {
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
          showWizard: session.showWizard,
          isDeleted: isDeleted,
          isTemplate: session.isTemplate,
          id: session.id,
          raterEnabled: session.raterEnabled ? true : false,
        };
        // post data back
        Put(
          putUpdateModule(moduleIds.courseId, moduleIds.moduleId),
          dataToSend
        ).then((res) => {
          if (res.status && res.status < 300) {
            if (res.data && res.data) {
              //redirect to course list
              navigator(`/courses/${moduleIds.courseId}/modules`);
              //pop up notifying user of creation
              setAlert({ message: "Module updated", type: "success" });
            }
          } else if (res && res.status === 401) {
            navigator("/login");
          } else {
            // set errors
            setErrors({
              name: res.data,
              signUpCode: res.data,
              isDeleted: res.data,
              isPublished: res.data,
            });
          }
          // set is loading back
          setIsLoading(false);
        });
      }
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
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

  return moduleIds && session.name !== "" ? (
    <main className="bg-background text-foreground p-4 space-y-6">
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
      <Dialog open={openDeleteModal} onOpenChange={setOpenDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Module?</DialogTitle>
            <DialogDescription>
              Are you sure you would like to permanently delete this module?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpenDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={(e) => handleSubmit(e, false, true)}>
              Delete
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
      <Dialog open={openActiveModal} onOpenChange={setOpenActiveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unpublish Module?</DialogTitle>
            <DialogDescription>
              This module is current published and available to the public.
              Continuing will make the module unavailable to students.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpenActiveModal(false)}>
              Cancel
            </Button>
            <Button onClick={(e) => handleSubmit(e, false, false)}>
              Continue
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
      {/* Standard Page Header Pattern */}
      <header className="animate-in slide-in-from-bottom-4 duration-700">
        <div className="relative overflow-hidden bg-card border rounded-xl p-6 shadow-lg">
          <div
            className="absolute top-0 right-0 w-48 h-48 opacity-10"
            aria-hidden="true"
          >
            <Edit size={192} className="text-primary" />
          </div>

          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-2 text-foreground leading-tight">
              Edit <span className="text-primary">{session.name}</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl text-base leading-6">
              Modify your module settings, assets, and configuration options.
            </p>
          </div>
        </div>
      </header>

      {/* Actions Section */}
      <section aria-labelledby="actions-heading">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 id="actions-heading" className="text-2xl font-bold text-foreground mb-1">
              Module Management
            </h2>
            <p className="text-muted-foreground text-sm">
              Update your module settings and publish options.
            </p>
          </div>
          <nav
            className="flex flex-col md:flex-row gap-2"
            role="toolbar"
            aria-label="Module management actions"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenDeleteModal(true)}
              className="text-destructive hover:text-destructive"
              aria-label="Delete module"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSavePublishTooltip(true)}
              aria-label="Get help with Save & Publish options"
            >
              <Info className="h-4 w-4" aria-hidden="true" />
              Help
            </Button>
            <DropdownMenu open={openSave} onOpenChange={setOpenSave}>
              <DropdownMenuTrigger asChild>
                <Button className="gap-2" aria-label={`${options[selectedIndexSave]} module`}>
                  {options[selectedIndexSave]}
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {options.map((option, index) => (
                  <DropdownMenuItem
                    key={option}
                    onClick={(event) => handleMenuItemClick(event, index)}
                    className={cn(
                      index === selectedIndexSave && "bg-accent",
                      index === 2 && "text-destructive hover:text-destructive"
                    )}
                  >
                    {option}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </header>
      </section>
      
      {/* Info Section */}
      <Card className="border-primary/20 bg-primary/5 transition-all duration-300 hover:shadow-md">
        <CardContent className="pt-6">
          <p className="text-primary/80 text-sm leading-relaxed">
            Modules provide users access to conversations with the AI. Modules can
            be customized to allow or restrict access to specific assets, including
            conversation prompts (AI instructions) and documents. For more
            information on editing a module, please see the{" "}
            <a
              href="https://docs.google.com/document/d/1o3He0CdgV7hJOX65gc3Gpf3_Fr3GYvSm4Q-i-Y5cNHQ/edit?tab=t.0#heading=h.cabsr1px9wcb"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-2 hover:no-underline text-primary transition-colors duration-200"
            >
              "Editing a Module" section of our instructor guide
            </a>
            .
          </p>
        </CardContent>
      </Card>
      
      <div className="flex items-center justify-between py-4">
        <span className="text-sm text-muted-foreground">* indicates a required field</span>
        <div className="flex items-center gap-2">
          {session.isPublished ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
              <span className="text-green-600 font-medium">Published</span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-muted-foreground font-medium">Unpublished</span>
            </>
          )}
        </div>
      </div>
      <Card className="transition-all duration-300 hover:shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-foreground">
            Module Information
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Update the essential details for your module. Fields marked with * are required.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={(e) => handleSubmit(e, true, false)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Module Name *
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Argumentative Essay Writing Module"
                value={session.name}
                onChange={handleChange}
                disabled={isLoading}
                required
                className={cn(
                  errors.name && "border-destructive focus-visible:ring-destructive"
                )}
                aria-describedby={errors.name ? "name-error" : undefined}
              />
              {errors.name && (
                <p id="name-error" className="text-sm text-destructive" role="alert">
                  {errors.name}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="moduleDescription" className="text-sm font-medium">
                Module Description *
              </Label>
              <Textarea
                id="moduleDescription"
                name="moduleDescription"
                placeholder="Describe the purpose and instructional goals for this module..."
                value={session.moduleDescription}
                onChange={(e) => setSession(prev => ({ ...prev, moduleDescription: e.target.value }))}
                disabled={isLoading}
                required
                className={cn(
                  errors.moduleDescription && "border-destructive focus-visible:ring-destructive",
                  "min-h-[100px]"
                )}
                aria-describedby={errors.moduleDescription ? "description-error" : undefined}
              />
              {errors.moduleDescription && (
                <p id="description-error" className="text-sm text-destructive" role="alert">
                  {errors.moduleDescription}
                </p>
              )}
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Module Assets</Label>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenSelectFolderModal(true)}
                className="gap-2"
                aria-label="Add asset to module"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add Asset
              </Button>
            </div>
            {session.prompts.length < 1 && session.files.length < 1 ? (
              <div 
                className="text-center py-12 text-muted-foreground bg-card border rounded-lg"
                role="status"
              >
                <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No assets added</p>
                <p className="text-sm">To add an asset (including prompts and documents), click "Add Asset" above.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4">
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

                <div className="grid gap-4">
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

            <div className="space-y-2">
              <Label className="text-base font-medium flex items-center gap-2" title="You can customize your module to allow or restrict certain functions.">
                Module Settings
                <Info className="h-4 w-4 text-muted-foreground" />
              </Label>
            </div>
          {/* <Checkbox
            onClick={() => {
              setSession((prev) => ({
                ...prev,
                isRepeating: !session.isRepeating
              }))
            }}
            checked={session.isRepeating}
            disabled={isLoading}
          >
            <span>
              Allow starter prompts to be re-selected during the conversation
            </span>
          </Checkbox> */}

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
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
                <Label htmlFor="showInitialPrompt" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Show Embedded Prompt
                </Label>
              </div>
              <p className="text-sm text-muted-foreground ml-6">
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
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
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
                <Label htmlFor="raterEnabled" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  RATER Enabled
                </Label>
              </div>
              <p className="text-sm text-muted-foreground ml-6">
                Provide students with more tailored feedback on their argumentative
                essays. Should only be used with essay drafts longer than 150 words.
                Checking this will also provide analytics on students' essays with
                the "View" button.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
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
        <p className="text-muted-foreground">Loading module...</p>
      </div>
    </div>
  );
}
