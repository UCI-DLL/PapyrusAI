import React, { useState, useContext, useEffect } from "react";
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
import { DialogWrapper } from "../../components/ui-wrappers/DialogWrapper";
import { DropdownWrapper } from "../../components/ui-wrappers/DropdownWrapper";
import { Checkbox } from "../../components/ui/checkbox";
import { Separator } from "../../components/ui/separator";
import {
  ChevronDown,
  Info,
  Plus,
  Loader2,
  FileText,
  MessageSquare,
  Save,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Put from "../../utility/Put";
import Get from "../../utility/Get";
import {
  putCreateModule,
  getModule,
  putUpdateModule,
} from "../../utility/endpoints/CourseEndpoints";
import { AlertContext } from "../../utility/context/AlertContext";
import { cn } from "../../lib/utils";
import ListFolderContents from "../library/ListFolderContents";
import ListFolders from "../library/ListFolders";
import {
  getOrgFile,
  getOrgPrompt,
  getUserFile,
  getUserPrompt,
} from "../../utility/endpoints/FolderEndpoints";
import { Prompt } from "../../components/Prompt";
import { FileType, PromptType } from "../../utility/types/CourseTypes";
import { File } from "../../components/File";
import { Badge } from "../../components/ui/badge";

type ModuleFormType = {
  name: string;
  moduleDescription: string;
  isRepeating: boolean;
  isPublished: boolean;
  showInitialPrompt: boolean;
  prompts: Array<PromptType>;
  files: Array<FileType>;
  webSearch: boolean;
  id?: string;
  isDeleted?: boolean;
  isTemplate?: boolean;
  showWizard?: boolean;
  raterEnabled?: boolean;
};

type ModuleFormMode = "create" | "edit";

interface ModuleFormProps {
  mode?: ModuleFormMode;
  courseId?: string;
  moduleId?: string;
}

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

export default function AddModule({
  mode = "create",
  courseId,
  moduleId,
}: ModuleFormProps = {}): JSX.Element {
  let location = useLocation();
  let navigator = useNavigate();

  // Determine if we're in edit mode based on URL or props
  const isEditMode =
    mode === "edit" || location.pathname.includes("/editmodule/");
  const actualCourseId =
    courseId ||
    (isEditMode
      ? location.pathname.split("/")[2]
      : location.pathname.split("/")[2]);
  const actualModuleId =
    moduleId || (isEditMode ? location.pathname.split("/")[4] : undefined);

  const [session, setSession] = useState<ModuleFormType>({
    name: "",
    moduleDescription: "",
    isRepeating: false,
    isPublished: false,
    showInitialPrompt: true,
    prompts: [],
    files: [],
    webSearch: false,
    id: "",
    isDeleted: false,
    isTemplate: false,
    showWizard: true,
    raterEnabled: false,
  });
  const [moduleIds, setModuleIds] = useState<{
    courseId: string;
    moduleId: string;
  }>();
  const [errors, setErrors] = useState<any>({
    name: "",
    moduleDescription: "",
    isRepeating: "",
    isPublished: "",
    showInitialPrompt: "",
    prompts: "",
    files: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(isEditMode);
  const { setAlert } = useContext(AlertContext);
  const [openSelectFolderModal, setOpenSelectFolderModal] =
    useState<boolean>(false);
  const [openSelectPromptModal, setOpenSelectPromptModal] = useState<{
    folderId: string;
    isOrgFolder: boolean;
  }>({ folderId: "", isOrgFolder: false });
  const [openSaveTop, setOpenSaveTop] = useState(false);
  const [openSaveBottom, setOpenSaveBottom] = useState(false);
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
    if (isEditMode && actualCourseId && actualModuleId) {
      // Load existing module data for edit mode
      const controller = new AbortController();
      setModuleIds({ courseId: actualCourseId, moduleId: actualModuleId });

      Get(getModule(actualCourseId, actualModuleId), controller.signal).then(
        (res) => {
          if (res && res.status && res.status < 300) {
            if (res.data && res.data.prompts) {
              var tempSession = res.data;
              if (!tempSession.files) {
                tempSession.files = [];
              }
              setSession(tempSession);
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
        }
      );

      return () => {
        controller.abort();
      };
    } else if (!isEditMode) {
      // For create mode, just set loading to false
      setIsLoading(false);
    }
    // eslint-disable-next-line
  }, [isEditMode, actualCourseId, actualModuleId]);

  // function handleSaveClick(e: any) {
  //   if (selectedIndexSave === 0) {
  //     //Save and publish
  //     handleSubmit(e, true);
  //   } else if (selectedIndexSave === 1) {
  //     //save and not publish
  //     handleSubmit(e, false);
  //   } else if (selectedIndexSave === 2) {
  //     //discard changes
  //     setOpenDiscardModal(true);
  //   }
  // }

  const handleMenuItemClick = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    index: number
  ) => {
    if (index === 0) {
      //Save and publish
      handleSubmit(e, true, false);
    } else if (index === 1) {
      //save and not publish
      if (isEditMode && session.isPublished) {
        //handle case that module is already published and they are switching it
        setOpenActiveModal(true);
      } else {
        handleSubmit(e, false, false);
      }
    } else if (index === 2) {
      //discard changes
      setOpenDiscardModal(true);
    }
    setSelectedIndexSave(index);
    setOpenSaveTop(false);
    setOpenSaveBottom(false);
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
      // set is loading
      setIsLoading(true);

      if (isEditMode && moduleIds) {
        // Update module
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
          webSearch: session.webSearch ? true : false,
        };
        // put data back
        Put(
          putUpdateModule(moduleIds.courseId, moduleIds.moduleId),
          dataToSend
        ).then((res) => {
          if (res.status && res.status < 300) {
            if (res.data && res.data) {
              //redirect to module list
              navigator(`/courses/${moduleIds.courseId}/modules`);
              //pop up notifying user of update
              setAlert({ message: "Module updated", type: "success" });
            }
          } else if (res && res.status === 401) {
            navigator("/login");
          } else {
            // set errors
            setErrors({
              name: res.data,
              moduleDescription: res.data,
              isDeleted: res.data,
              isPublished: res.data,
            });
          }
          // set is loading back
          setIsLoading(false);
        });
      } else {
        // Create module
        const dataToSend = {
          name: session.name,
          moduleDescription: session.moduleDescription,
          isRepeating: session.isRepeating,
          isPublished: isPublished,
          showInitialPrompt: session.showInitialPrompt,
          prompts: session.prompts, //Send prompts with all information + folderId
          files: session.files, //send files with all information + folderid
          isDeleted: false,
          webSearch: session.webSearch,
        };
        // post data back
        Put(putCreateModule(actualCourseId), dataToSend).then((res) => {
          if (res && res.status && res.status < 300) {
            if (res.data && res.data) {
              //redirect to module list of that course
              navigator(`/courses/${actualCourseId}/modules`);
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
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
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
              if (
                session.files.filter((x) => x.id === res.data.id).length === 0
              ) {
                setSession((prev) => ({
                  ...prev,
                  files: [
                    ...prev.files,
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
              if (
                session.files.filter((x) => x.id === res.data.id).length === 0
              ) {
                setSession((prev) => ({
                  ...prev,
                  files: [
                    ...prev.files,
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
              setAlert({ message: "File Does Not Exist", type: "error" });
              setIsLoading(false);
            }
          }
        });
      }
    }
  }

  function refreshList() { } //empty

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

  if (isLoading) {
    return (
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
          <p className="text-muted-foreground">
            {isEditMode
              ? "Loading module..."
              : "Loading module creation form..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-background text-foreground p-4 space-y-6">
      <DialogWrapper
        open={showSavePublishTooltip}
        onOpenChange={setShowSavePublishTooltip}
        title="What is Save & Publish?"
        contentClassName="sm:max-w-md"
        actions={[
          {
            label: "Got it",
            onClick: () => setShowSavePublishTooltip(false),
          },
        ]}
      >
        <div className="space-y-3">
          <p className="text-sm leading-6">
            To save and publish (i.e., make visible to students) your module,
            select "Save & Publish". If you want to save your module without
            publishing it, select "Save without Publishing".
          </p>
          <p className="text-sm text-muted-foreground italic">
            Note: Choosing this option after the module has already been
            published will unpublish the module.
          </p>
        </div>
      </DialogWrapper>

      <DialogWrapper
        open={openDiscardModal}
        onOpenChange={setOpenDiscardModal}
        title="Discard Changes?"
        description="Are you sure you would like to discard the changes to this module?"
        actions={[
          {
            label: "Cancel",
            onClick: () => setOpenDiscardModal(false),
            variant: "outline",
          },
          {
            label: "Discard",
            onClick: () => navigator(-1),
            variant: "destructive",
          },
        ]}
      />

      {/* Edit-specific dialogs */}
      {isEditMode && (
        <>
          <DialogWrapper
            open={openDeleteModal}
            onOpenChange={setOpenDeleteModal}
            title="Delete Module?"
            description="Are you sure you would like to permanently delete this module?"
            actions={[
              {
                label: "Cancel",
                onClick: () => setOpenDeleteModal(false),
                variant: "outline",
              },
              {
                label: "Delete",
                onClick: () => handleSubmit(null, false, true),
                variant: "destructive",
              },
            ]}
          />

          <DialogWrapper
            open={openActiveModal}
            onOpenChange={setOpenActiveModal}
            title="Unpublish Module?"
            description="This module is current published and available to the public. Continuing will make the module unavailable to students."
            actions={[
              {
                label: "Cancel",
                onClick: () => setOpenActiveModal(false),
                variant: "outline",
              },
              {
                label: "Continue",
                onClick: () => handleSubmit(null, false, false),
              },
            ]}
          />
        </>
      )}
      <DialogWrapper
        open={openSelectFolderModal}
        onOpenChange={setOpenSelectFolderModal}
        title="Select Folder"
        contentClassName="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        actions={[
          {
            label: "Cancel",
            onClick: () => setOpenSelectFolderModal(false),
            variant: "outline",
          },
        ]}
      >
        <div>
          <ListFolders noShowMenu onClick={selectFolder} compactGrid />
        </div>
      </DialogWrapper>

      <DialogWrapper
        open={openSelectPromptModal.folderId !== ""}
        onOpenChange={(open) =>
          !open &&
          setOpenSelectPromptModal({ folderId: "", isOrgFolder: false })
        }
        title="Select Asset"
        contentClassName="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        actions={[
          {
            label: "Back",
            onClick: () => {
              setOpenSelectPromptModal({ folderId: "", isOrgFolder: false });
              setOpenSelectFolderModal(true);
            },
            variant: "outline",
          },
          {
            label: "Cancel",
            onClick: () =>
              setOpenSelectPromptModal({ folderId: "", isOrgFolder: false }),
            variant: "outline",
          },
        ]}
      >
        <div>
          <ListFolderContents
            folderId={openSelectPromptModal.folderId}
            isOrgFolder={openSelectPromptModal.isOrgFolder}
            noShowMenu
            onClick={selectAsset}
            compactGrid
          />
        </div>
      </DialogWrapper>

      <DialogWrapper
        open={openConfirmationModal.id !== ""}
        onOpenChange={(open) =>
          !open && setOpenConfirmationModal({ id: "", type: "" })
        }
        title="Remove Asset?"
        description="Are you sure you would like to remove this asset from the module?"
        actions={[
          {
            label: "Cancel",
            onClick: () => setOpenConfirmationModal({ id: "", type: "" }),
            variant: "outline",
          },
          {
            label: "Remove",
            onClick: () =>
              removeAsset(openConfirmationModal.id, openConfirmationModal.type),
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
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-foreground leading-tight">
                  {isEditMode
                    ? `Edit ${session.name || "Module"}`
                    : "Create Module"}
                </h1>
                {isEditMode && (
                  <div className="flex items-center gap-2">
                    {session.isPublished ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <Badge
                          variant="default"
                          className="bg-green-100 text-green-800 dark:bg-green-900 pointer-events-none"
                        >
                          Published
                        </Badge>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-gray-500 pointer-events-none" />
                        <Badge variant="secondary">Unpublished</Badge>
                      </>
                    )}
                  </div>
                )}
              </div>
              <nav
                className="flex flex-col md:flex-row gap-2"
                role="toolbar"
                aria-label={
                  isEditMode
                    ? "Module management actions"
                    : "Module creation actions"
                }
              >
                {isEditMode && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOpenDeleteModal(true)}
                    className="text-destructive hover:text-destructive"
                    aria-label="Delete module"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSavePublishTooltip(true)}
                  aria-label="Get help with Save & Publish options"
                >
                  <Info className="h-4 w-4" aria-hidden="true" />
                </Button>
                <div className="flex rounded-lg border overflow-hidden">
                  <Button
                    size="sm"
                    onClick={(e) => {
                      if (selectedIndexSave === 0) {
                        handleSubmit(e, true, false);
                      } else if (selectedIndexSave === 1) {
                        if (isEditMode && session.isPublished) {
                          setOpenActiveModal(true);
                        } else {
                          handleSubmit(e, false, false);
                        }
                      } else if (selectedIndexSave === 2) {
                        setOpenDiscardModal(true);
                      }
                    }}
                    className="rounded-none border-0 w-full"
                    disabled={isLoading}
                    aria-label={`${options[selectedIndexSave]} module`}
                  >
                    <Save className="h-4 w-4 mr-2" aria-hidden="true" />
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
                        aria-label="Select save and publish strategy"
                      >
                        <ChevronDown className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    }
                    actions={options.map((option, index) => ({
                      label: option,
                      onClick: () => {
                        const fakeEvent = {} as React.MouseEvent<
                          HTMLDivElement,
                          MouseEvent
                        >;
                        handleMenuItemClick(fakeEvent, index);
                      },
                      className: cn(
                        index === selectedIndexSave && "bg-accent",
                        index === 2 && "text-destructive focus:text-destructive"
                      ),
                    }))}
                    align="end"
                  />
                </div>
              </nav>
            </div>

            <p className="text-muted-foreground max-w-2xl text-base leading-6">
              Modules provide users access to conversations with the AI. Modules
              can be customized to allow or restrict access to specific assets,
              including conversation prompts (AI instructions) and documents.
              For more information on {isEditMode ? "editing" : "creating"} a
              module, please see the{" "}
              <a
                href={
                  isEditMode
                    ? "https://docs.google.com/document/d/1o3He0CdgV7hJOX65gc3Gpf3_Fr3GYvSm4Q-i-Y5cNHQ/edit?tab=t.0#heading=h.cabsr1px9wcb"
                    : "https://docs.google.com/document/d/1o3He0CdgV7hJOX65gc3Gpf3_Fr3GYvSm4Q-i-Y5cNHQ/edit?tab=t.0#heading=h.9og8mgqg1ofk"
                }
                target="_blank"
                rel="noreferrer"
                className="font-medium underline underline-offset-2 hover:no-underline text-primary transition-colors duration-200"
              >
                {isEditMode ? "Editing a Module" : "Creating a Module"} section
                of our instructor guide
              </a>
              .
            </p>
          </div>
        </div>
      </header>

      <Card className="transition-all duration-300 hover:shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare
              className="h-5 w-5 text-primary"
              aria-hidden="true"
            />
            Module Information
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Enter the essential details for your module. Fields marked with *
            are required.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-6">
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
                  errors.name &&
                  "border-destructive focus-visible:ring-destructive"
                )}
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
              <Label
                htmlFor="moduleDescription"
                className="text-sm font-medium"
              >
                Module Description *
              </Label>
              <Textarea
                id="moduleDescription"
                name="moduleDescription"
                placeholder="Describe the purpose and instructional goals for this module..."
                value={session.moduleDescription}
                onChange={handleChange}
                disabled={isLoading}
                required
                className={cn(
                  errors.moduleDescription &&
                  "border-destructive focus-visible:ring-destructive",
                  "min-h-[100px]"
                )}
                aria-describedby={
                  errors.moduleDescription ? "description-error" : undefined
                }
              />
              {errors.moduleDescription && (
                <p
                  id="description-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
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
                className="text-center py-12 cursor-pointer text-muted-foreground bg-card border rounded-lg hover:bg-muted/50 transition-colors duration-200"
                role="button"
                tabIndex={0}
                onClick={() => setOpenSelectFolderModal(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setOpenSelectFolderModal(true);
                  }
                }}
                aria-label="Click here to add an asset (including prompts and documents) to the module"
                title="Click here to add an asset (including prompts and documents) to the module"
              >
                <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No assets added</p>
                <p className="text-sm">
                  Click here to add an asset (including prompts and documents)
                  to the module.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 grid-flow-row grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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
                        disableStarring={true}
                      />
                    </div>
                  );
                })}

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
                          disableStarring={true}
                        />
                      </div>
                    );
                  })}
              </div>
            )}

            <Separator />

            <div className="space-y-2">
              <Label className="text-lg font-medium">Module Settings</Label>

              <div className="space-y-4">
                <div className="space-y-1">
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
                    <Label
                      htmlFor="showInitialPrompt"
                      className="text-md font-bold"
                    >
                      Show Embedded Prompt
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground ml-6">
                    Allows users to see the full text of the embedded prompt
                    with which they begin their chat with the AI. Unchecking
                    this will mean that the user will not be able to see the
                    initial text of the prompt sent initially to the AI.
                    <br />
                    For more information on why you might choose one or the
                    other, see the{" "}
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

                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="webSearch"
                      checked={session.webSearch}
                      onCheckedChange={(checked) => {
                        setSession((prev) => ({
                          ...prev,
                          webSearch: checked as boolean,
                        }));
                      }}
                      disabled={isLoading}
                    />
                    <Label htmlFor="webSearch" className="text-md font-bold">
                      Allow Web Search
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground ml-6">
                    Allows PapyrusAI to search the internet in response to a
                    query or question. Students can prompt the AI to search the
                    web by using phrases like “Look up this topic. ”
                    <br />
                    In generating the web search output, PapyrusAI will collect
                    sources from the internet, give a list of those sources to
                    the students, and reference the content from each source in
                    the conversation with the student.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Bottom Actions */}
      <section aria-labelledby="bottom-actions-heading" className="pt-4">
        <nav
          className="flex flex-col md:flex-row md:items-center md:justify-end gap-2"
          role="toolbar"
          aria-label={
            isEditMode ? "Module management actions" : "Module creation actions"
          }
        >
          {isEditMode && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpenDeleteModal(true)}
              className="text-destructive hover:text-destructive"
              aria-label="Delete module"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowSavePublishTooltip(true)}
            aria-label="Get help with Save & Publish options"
          >
            <Info className="h-4 w-4" aria-hidden="true" />
            Info
          </Button>
          <div className="flex rounded-lg border overflow-hidden">
            <Button
              type="button"
              size="sm"
              onClick={(e) => {
                if (selectedIndexSave === 0) {
                  handleSubmit(e, true, false);
                } else if (selectedIndexSave === 1) {
                  if (isEditMode && session.isPublished) {
                    setOpenActiveModal(true);
                  } else {
                    handleSubmit(e, false, false);
                  }
                } else if (selectedIndexSave === 2) {
                  setOpenDiscardModal(true);
                }
              }}
              className="rounded-none border-0 w-full"
              disabled={isLoading}
              aria-label={`${options[selectedIndexSave]} module`}
            >
              <Save className="h-4 w-4 mr-2" aria-hidden="true" />
              {options[selectedIndexSave]}
            </Button>
            <DropdownWrapper
              open={openSaveBottom}
              onOpenChange={setOpenSaveBottom}
              trigger={
                <Button
                  type="button"
                  size="sm"
                  className="rounded-none border-0 border-l px-2"
                  variant="default"
                  disabled={isLoading}
                  aria-label="Select save and publish strategy"
                >
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                </Button>
              }
              actions={options.map((option, index) => ({
                label: option,
                onClick: () => {
                  const fakeEvent = {} as React.MouseEvent<
                    HTMLDivElement,
                    MouseEvent
                  >;
                  handleMenuItemClick(fakeEvent, index);
                },
                className: cn(
                  index === selectedIndexSave && "bg-accent",
                  index === 2 && "text-destructive focus:text-destructive"
                ),
              }))}
              align="end"
            />
          </div>
        </nav>
      </section>
    </main>
  );
}
