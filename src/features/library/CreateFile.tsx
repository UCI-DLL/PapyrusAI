import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
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
import { ChevronDown, Info, Loader2, Upload, X } from "lucide-react";
import Get from "../../utility/Get";
import { TagType } from "../../utility/types/CourseTypes";
import { AlertContext } from "../../utility/context/AlertContext";
import { cn } from "../../lib/utils";
import { getTagList } from "../../utility/endpoints/TagsEndpoints";
import Post from "../../utility/Post";
import {
  getSignedS3BucketUploadOrgFolder,
  getSignedS3BucketUploadUserFolder,
  postCreateOrgFile,
  postCreateUserFile,
} from "../../utility/endpoints/FolderEndpoints";
import axios from "axios";

const options = ["Save & Upload", "Discard Changes"];

export default function CreateFile(): JSX.Element {
  let location = useLocation();
  let navigator = useNavigate();
  const [newFile, setNewFile] = useState<{
    name: string;
    id: string;
    tags: Array<string>;
  }>({
    name: "",
    id: "",
    tags: [],
  });
  const [errors, setErrors] = useState<any>({
    name: "",
    file: "",
    tags: "",
  });
  const [fileInfo, setFileInfo] = useState<{
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
  const fileRef = React.useRef<HTMLInputElement>(null);
  const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB

  const [selectedFiles, setSelectedFiles] = React.useState<any>();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event?.target?.files?.[0];
    if (file) {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", //docx
        "text/plain",
      ];
      //handle file size
      if (file.size > MAX_FILE_SIZE) {
        setErrors((prev: any) => ({
          ...prev,
          file: "File is too large. File must be smaller than 1GB.",
        }));
        setSelectedFiles(null);
      } else {
        //handle file formats
        if (allowedTypes.includes(file.type)) {
          setErrors((prev: any) => ({ ...prev, file: "" }));
          setSelectedFiles(file);
        } else {
          setErrors((prev: any) => ({
            ...prev,
            file: "Invalid file type. Please select a JPEG, PNG, PDF, TXT, DOCX file.",
          }));
          setSelectedFiles(null);
        }
      }
    }
  };

  const onClear = () => {
    setSelectedFiles(undefined);
  };

  const onUpdate = (action: "change" | "clear") => {
    if (action === "change" && fileRef.current) {
      onClear();
      fileRef.current.click();
      return;
    }
    if (action === "clear") {
      onClear();
      return;
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    //get pathname to figure out if we are editing
    if (
      location.pathname &&
      location.pathname.split("/") &&
      location.pathname.split("/")[1] &&
      location.pathname.split("/")[2] === "org" &&
      location.pathname.split("/")[3] &&
      location.pathname.split("/")[4] === "createfile"
    ) {
      //get prev file data
      const folderId = location.pathname.split("/")[3];
      //save the ids
      setFileInfo({ isOrgFolder: true, folderId: folderId });
    } else if (
      location.pathname &&
      location.pathname.split("/") &&
      location.pathname.split("/")[1] &&
      location.pathname.split("/")[2] !== "org" &&
      location.pathname.split("/")[3] === "createfile"
    ) {
      //get prev file data
      const folderId = location.pathname.split("/")[2];
      //save the ids
      setFileInfo({ isOrgFolder: false, folderId: folderId });
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
          //if the data is 20 files, then call for the next page
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
      //Save and upload
      handleUpload();
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
      //Save and upload
      handleUpload(e);
    } else if (selectedIndexSave === 1) {
      //discard changes
      setOpenDiscardModal(true);
    }
  }

  function handleSubmit(id: string) {
    if (fileInfo && fileInfo.isOrgFolder) {
      setIsLoading(true);
      const dataToSend = {
        name: newFile.name,
        isDeleted: false,
        tags: newFile.tags,
        id: id,
      };
      // post data back
      Post(postCreateOrgFile(fileInfo.folderId), dataToSend).then((res) => {
        if (res.status && res.status < 300) {
          if (res.data && res.data) {
            //pop up notifying user of created
            setAlert({ message: "File Created", type: "success" });
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          // handle error
          if (res) {
            setAlert({
              message: "File could not be created. Try again later.",
              type: "error",
            });
          }
        }
        setIsLoading(false);
        navigator(`/library/org/${fileInfo.folderId}`);
      });
    } else if (fileInfo) {
      setIsLoading(true);
      const dataToSend = {
        name: newFile.name,
        isDeleted: false,
        tags: newFile.tags,
        id: id,
      };
      // post data back
      Post(postCreateUserFile(fileInfo.folderId), dataToSend).then((res) => {
        if (res.status && res.status < 300) {
          if (res.data && res.data) {
            //pop up notifying user of Created
            setAlert({ message: "File Created", type: "success" });
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          // set errors
          setAlert({
            message: "File could not be created. Try again later.",
            type: "error",
          });
        }
        setIsLoading(false);
        navigator(`/library/${fileInfo.folderId}`);
      });
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setNewFile((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  const handleTagToggle = (tagId: string) => {
    setNewFile((prev) => {
      const isSelected = prev.tags.includes(tagId);
      return {
        ...prev,
        tags: isSelected
          ? prev.tags.filter((id) => id !== tagId)
          : [...prev.tags, tagId],
      };
    });
  };

  function handleUpload(e?: React.FormEvent) {
    e?.preventDefault();
    if (!selectedFiles) {
      setAlert({ message: "Missing File information", type: "error" });
      return;
    }
    if (newFile.name === "") {
      setErrors((prev: any) => ({ ...prev, name: "Name is too short" }));
    }
    // Handle here
    if (fileInfo) {
      setIsLoading(true);
      const ext = selectedFiles.name.includes(".")
        ? "." + selectedFiles.name.split(".").pop()
        : "";
      const fileId =
        Date.now() + "" + Math.floor(100000 + Math.random() * 900000) + ext;
      //if is org folder, then upload to org folder
      if (fileInfo?.isOrgFolder) {
        Get(getSignedS3BucketUploadOrgFolder(fileInfo.folderId, fileId)).then(
          (res) => {
            if (res && res.status && res.status < 300) {
              //handle upload to s3 -> handleUploadToS3
              if (res.data) {
                handleUploadToS3(res.data.url, res.data.id);
              } else {
                //handle error
                setAlert({
                  message: "Error creating file. Please try again later",
                  type: "error",
                });
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
          }
        );
      } else {
        //else an user folder
        Get(getSignedS3BucketUploadUserFolder(fileInfo.folderId, fileId)).then(
          (res) => {
            if (res && res.status && res.status < 300) {
              //handle upload to s3 -> handleUploadToS3
              if (res.data) {
                handleUploadToS3(res.data.url, fileId);
              } else {
                //handle error
                setAlert({
                  message: "Error creating file. Please try again later",
                  type: "error",
                });
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
          }
        );
      }
    }
  }

  async function handleUploadToS3(url: string, id: string) {
    try {
      // Upload original file directly to s3
      await axios
        .put(url, selectedFiles, {
          headers: {
            "Content-Type": selectedFiles.type,
          },
        })
        .then((res) => {
          if (res && res.status && res.status < 300) {
            handleSubmit(id);
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
    } catch (error) {
      console.error((error as Error).message);
    }
  }

  return fileInfo && !isLoading ? (
    <main className="bg-background text-foreground p-4 space-y-6">
      {/* Dialogs */}
      <DialogWrapper
        open={showSavePublishTooltip}
        onOpenChange={setShowSavePublishTooltip}
        title="About File Upload"
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
            You can upload documents for your course that will factor into
            generated AI output. When you click <strong>"Save & Upload"</strong>
            , your file will be uploaded and saved to your library.
          </p>
          <p className="text-sm">
            For more information on this system, please see the{" "}
            <a
              href="https://docs.google.com/document/d/1o3He0CdgV7hJOX65gc3Gpf3_Fr3GYvSm4Q-i-Y5cNHQ/edit?tab=t.0#heading=h.7pexnnplkzu2"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:no-underline font-medium text-primary"
            >
              "Uploading a Document" section of our instructor guide
            </a>
            .
          </p>
        </div>
      </DialogWrapper>

      <DialogWrapper
        open={openDiscardModal}
        onOpenChange={setOpenDiscardModal}
        title="Discard Changes?"
        description="Are you sure you would like to discard the changes to this file? This action cannot be undone."
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
            <Upload size={192} className="text-primary" />
          </div>
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-2 text-foreground leading-tight">
              Create File
            </h1>
            <p className="text-muted-foreground max-w-2xl text-base leading-6">
              Upload documents that will factor into generated AI output for
              your course. For more information on this system, please see the{" "}
              <a
                href="https://docs.google.com/document/d/1o3He0CdgV7hJOX65gc3Gpf3_Fr3GYvSm4Q-i-Y5cNHQ/edit?tab=t.0#heading=h.7pexnnplkzu2"
                target="_blank"
                rel="noreferrer"
                className="font-medium underline underline-offset-2 hover:no-underline text-primary transition-colors duration-200"
              >
                "Uploading a Document" section of our instructor guide
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
              File Setup
            </h2>
            <p className="text-muted-foreground text-sm">
              Configure your file upload and metadata settings.
            </p>
          </div>
          <nav
            className="flex flex-col md:flex-row gap-2"
            role="toolbar"
            aria-label="File creation actions"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSavePublishTooltip(true)}
              aria-label="Get help with file upload"
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
                aria-label={`${options[selectedIndexSave]} file`}
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
                    aria-label="Select file upload strategy"
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
              File Information
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              Enter the essential details for your file. Fields marked with *
              are required.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    File Name *
                  </Label>
                  <TooltipWrapper content="The name for the document.">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipWrapper>
                </div>
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter file name"
                  value={newFile.name}
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
                  <Label className="text-sm font-medium">File Upload *</Label>
                  <TooltipWrapper content="Select a JPEG, PNG, PDF, TXT, DOCX file.">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipWrapper>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  disabled={isLoading}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.pdf,.docx,.txt"
                />
                {!selectedFiles?.name ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileRef.current?.click()}
                    disabled={isLoading}
                    className="w-full h-32 border-dashed border-2 hover:border-primary hover:bg-primary/10 transition-colors"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        Choose file to upload
                      </span>
                      <span className="text-xs text-muted-foreground">
                        JPEG, PNG, PDF, TXT, DOCX (max 1GB)
                      </span>
                    </div>
                  </Button>
                ) : (
                  <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Upload className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm font-medium truncate">
                        {selectedFiles?.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onUpdate("change")}
                        disabled={isLoading}
                      >
                        Change
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onUpdate("clear")}
                        disabled={isLoading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                {errors.file && (
                  <p className="text-sm text-destructive">{errors.file}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Tags</Label>
                  <TooltipWrapper content="Tags describe a feature of the files and will be used to allow for sorting files by type.">
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
                            checked={newFile.tags.includes(tag.id)}
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
                  {newFile.tags.length > 0 ? newFile.tags.join(", ") : "None"}
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
            aria-label="File creation actions"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSavePublishTooltip(true)}
              aria-label="Get help with file upload"
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
                aria-label={`${options[selectedIndexSave]} file`}
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
                    aria-label="Select file upload strategy"
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
        <p className="text-muted-foreground">Loading file creation form...</p>
      </div>
    </div>
  );
}
