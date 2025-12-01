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
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
  Loader2,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import Get from "../../utility/Get";
import { FileType, TagType } from "../../utility/types/CourseTypes";
import { AlertContext } from "../../utility/context/AlertContext";
import { getTagList } from "../../utility/endpoints/TagsEndpoints";
import {
  getOrgFile,
  getSignedS3BucketDownloadFile,
  getSignedS3BucketUploadOrgFolder,
  getSignedS3BucketUploadUserFolder,
  getUserFile,
  putUpdateOrgFile,
  putUpdateUserFile,
} from "../../utility/endpoints/FolderEndpoints";
import axios from "axios";
import { Document, Page, pdfjs } from "react-pdf";
import Put from "../../utility/Put";
import DocViewer, { DocViewerRenderers } from "react-doc-viewer";
import CustomFileRender from "../../components/CustomFileRender";
import { cn } from "../../lib/utils";

const options = ["Save & Publish", "Discard Changes"];

export default function EditFile(): JSX.Element {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  let location = useLocation();
  let navigator = useNavigate();
  const [file, setFile] = useState<FileType>();
  const [newFile, setNewFile] = useState<{
    name: string;
    id: string;
    tags: Array<string>;
    url: string;
  }>({
    name: "",
    id: "",
    tags: [],
    url: "",
  });
  const [errors, setErrors] = useState<any>({
    name: "",
    file: "",
    tags: "",
  });
  const [fileInfo, setFileInfo] = useState<{
    isOrgFolder: boolean;
    folderId: string;
    fileId: string;
  }>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { setAlert } = useContext(AlertContext);
  const [selectedIndexSave, setSelectedIndexSave] = useState(0);
  const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
  const [openDiscardModal, setOpenDiscardModal] = useState<boolean>(false);
  const [showInfoTooltip, setShowInfoTooltip] = useState<boolean>(false);
  const [openSaveTop, setOpenSaveTop] = useState(false);
  const [openSaveBottom, setOpenSaveBottom] = useState(false);
  const [tagList, setTagList] = useState<Array<TagType>>([]);

  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB

  /*To Prevent right click on screen*/
  document.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });

  /*When document gets loaded successfully*/
  function onDocumentLoadSuccess({ numPages }: any) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  function changePage(offset: number) {
    setPageNumber((prevPageNumber) => prevPageNumber + offset);
  }

  function previousPage() {
    changePage(-1);
  }

  function nextPage() {
    changePage(1);
  }

  const fileRef = React.useRef<any>();

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
      location.pathname.split("/")[4] === "files" &&
      location.pathname.split("/")[5]
    ) {
      //get prev file data
      const folderId = location.pathname.split("/")[3];
      const fileId = location.pathname.split("/")[5];
      //save the ids
      setFileInfo({ isOrgFolder: true, folderId: folderId, fileId: fileId });
      getFile(true, folderId, fileId, controller.signal);
    } else if (
      location.pathname &&
      location.pathname.split("/") &&
      location.pathname.split("/")[1] &&
      location.pathname.split("/")[2] !== "org" &&
      location.pathname.split("/")[3] === "files" &&
      location.pathname.split("/")[4]
    ) {
      //get prev file data
      const folderId = location.pathname.split("/")[2];
      const fileId = location.pathname.split("/")[4];
      //save the ids
      setFileInfo({ isOrgFolder: false, folderId: folderId, fileId: fileId });
      getFile(false, folderId, fileId, controller.signal);
    }

    if (tagList.length === 0) {
      getTags("", controller.signal);
    }

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line
  }, [location.pathname]);

  function getFile(
    isOrg: boolean,
    folderId: string,
    fileId: string,
    signal: AbortSignal
  ) {
    if (!isOrg) {
      Get(getUserFile(folderId, fileId), signal).then((res) => {
        if (res && res.status && res.status < 300) {
          if (res.data) {
            //also set session
            setFile(res.data);
            if (res.data.fileReference) {
              //pass fileReference
              Get(
                getSignedS3BucketDownloadFile(res.data.fileReference),
                signal
              ).then(async (res1) => {
                if (res1 && res1.status && res1.status < 300) {
                  if (res1.data) {
                    //also set session
                    //if txt file, get txt to replace url
                    if (res.data.fileReference.split(".")[1] === "txt") {
                      const temp = await fetch(res1.data.url).then((r) => {
                        return r.text();
                      });
                      setNewFile({
                        name: res.data.name,
                        id: res.data.id,
                        tags: res.data.tags,
                        url: temp,
                      });
                    } else {
                      setNewFile({
                        name: res.data.name,
                        id: res.data.id,
                        tags: res.data.tags,
                        url: res1.data.url,
                      });
                    }
                  }
                } else if (res1 && res1.status === 401) {
                  navigator("/login");
                } else {
                  if (res1 === undefined) {
                  } else {
                    //handle error
                    //redirect to file list
                    navigator("/library");
                    setAlert({ message: "File Does Not Exist", type: "error" });
                  }
                }
                setIsLoading(false);
              });
            } else {
              setNewFile({
                name: res.data.name,
                id: res.data.id,
                tags: res.data.tags,
                url: "",
              });
              setIsLoading(false);
            }
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          if (res === undefined) {
          } else {
            //handle error
            //redirect to file list
            navigator("/library");
            setAlert({ message: "File Does Not Exist", type: "error" });
            setIsLoading(false);
          }
        }
      });
    } else {
      Get(getOrgFile(folderId, fileId), signal).then((res) => {
        if (res && res.status && res.status < 300) {
          if (res.data) {
            //also set session
            setFile(res.data);
            if (res.data.fileReference) {
              //pass fileReference
              Get(
                getSignedS3BucketDownloadFile(res.data.fileReference),
                signal
              ).then(async (res1) => {
                if (res1 && res1.status && res1.status < 300) {
                  if (res1.data) {
                    //also set session
                    //if txt file, get txt to replace url
                    if (res.data.fileReference.split(".")[1] === "txt") {
                      const temp = await fetch(res1.data.url).then((r) => {
                        return r.text();
                      });
                      setNewFile({
                        name: res.data.name,
                        id: res.data.id,
                        tags: res.data.tags,
                        url: temp,
                      });
                    } else {
                      setNewFile({
                        name: res.data.name,
                        id: res.data.id,
                        tags: res.data.tags,
                        url: res1.data.url,
                      });
                    }
                  }
                } else if (res1 && res1.status === 401) {
                  navigator("/login");
                } else {
                  if (res1 === undefined) {
                  } else {
                    //handle error
                    //redirect to file list
                    navigator("/library");
                    setAlert({ message: "File Does Not Exist", type: "error" });
                  }
                }
                setIsLoading(false);
              });
            } else {
              setNewFile({
                name: res.data.name,
                id: res.data.id,
                tags: res.data.tags,
                url: "",
              });
              setIsLoading(false);
            }
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          if (res === undefined) {
          } else {
            //handle error
            //redirect to file list
            navigator("/library");
            setAlert({ message: "File Does Not Exist", type: "error" });
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
      //Save and publish
      handleUpload(undefined, false);
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
      handleUpload(e, false);
    } else if (selectedIndexSave === 1) {
      //discard changes
      setOpenDiscardModal(true);
    }
  }

  function handleSubmit(id: string, isDeleted = false) {
    setIsLoading(true);
    const dataToSend = {
      name: newFile.name,
      isDeleted: isDeleted,
      tags: newFile.tags,
      id: id,
    };
    if (fileInfo && fileInfo.isOrgFolder) {
      // put data back
      Put(
        putUpdateOrgFile(fileInfo.folderId, fileInfo.fileId),
        dataToSend
      ).then((res) => {
        if (res.status && res.status < 300) {
          if (res.data && res.data) {
            //pop up notifying user of update
            setAlert({ message: "File Updated", type: "success" });
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          // handle error
          if (res) {
            setAlert({
              message: "File could not be updated. Try again later.",
              type: "error",
            });
          }
        }
        navigator(`/library/org/${fileInfo.folderId}`);
        setIsLoading(false);
      });
    } else if (fileInfo) {
      // put data back
      Put(
        putUpdateUserFile(fileInfo.folderId, fileInfo.fileId),
        dataToSend
      ).then((res) => {
        if (res.status && res.status < 300) {
          if (res.data && res.data) {
            //pop up notifying user of updated
            setAlert({ message: "File updated", type: "success" });
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          // set errors
          setAlert({
            message: "File could not be updated. Try again later.",
            type: "error",
          });
        }
        navigator(`/library/${fileInfo.folderId}`);
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
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

  function handleUpload(e?: React.FormEvent, isDeleted = false) {
    e?.preventDefault();
    setIsLoading(true);
    if (newFile.name === "") {
      setErrors((prev: any) => ({ ...prev, name: "Name is too short" }));
    }
    //if new file selected, then get the signed upload url
    //else just update the file information
    if (selectedFiles) {
      // Handle here
      if (fileInfo) {
        var fileId = fileInfo.fileId;
        if (selectedFiles) {
          const ext = selectedFiles.name.includes(".")
            ? "." + selectedFiles.name.split(".").pop()
            : "";
          fileId =
            Date.now() + "" + Math.floor(100000 + Math.random() * 900000) + ext;
        }
        //if is org folder, then upload to org folder
        if (fileInfo?.isOrgFolder) {
          Get(getSignedS3BucketUploadOrgFolder(fileInfo.folderId, fileId)).then(
            (res) => {
              if (res && res.status && res.status < 300) {
                if (res.data) {
                  handleUploadToS3(res.data.url, res.data.id);
                } else {
                  //handle error
                  setAlert({
                    message: "Error updating file. Please try again later",
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
          Get(
            getSignedS3BucketUploadUserFolder(fileInfo.folderId, fileId)
          ).then((res) => {
            if (res && res.status && res.status < 300) {
              if (res.data) {
                handleUploadToS3(res.data.url, res.data.id);
              } else {
                //handle error
                setAlert({
                  message: "Error updating file. Please try again later",
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
          });
        }
      }
    } else if (file && file.id) {
      handleSubmit(file.id, isDeleted);
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

  function renderFile(): React.JSX.Element {
    if (file && file.fileReference && file.fileReference.split(".")[1]) {
      switch (file.fileReference.split(".")[1].toLocaleLowerCase()) {
        case "txt": {
          return (
            <div className="p-4 bg-muted/30 rounded-md">
              <pre className="whitespace-pre-wrap text-sm">
                {newFile && newFile.url ? newFile.url : ""}
              </pre>
            </div>
          );
        }
        case "pdf":
          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium">PDF Preview</h4>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pageNumber <= 1}
                    onClick={previousPage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {pageNumber || (numPages ? 1 : "--")} of{" "}
                    {numPages || "--"}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pageNumber >= numPages}
                    onClick={nextPage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="border rounded-md overflow-hidden">
                <Document
                  file={newFile.url}
                  onLoadSuccess={onDocumentLoadSuccess}
                >
                  <Page
                    pageNumber={pageNumber}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                </Document>
              </div>
            </div>
          );
        case "png":
        case "jpg":
        case "jpeg":
          return (
            <div className="space-y-4">
              <h4 className="text-lg font-medium">Image Preview</h4>
              <div className="border rounded-md overflow-hidden">
                <img
                  className="w-full h-auto max-h-96 object-contain"
                  src={newFile && newFile.url ? newFile.url : ""}
                  alt="File preview"
                />
              </div>
            </div>
          );
        case "docx":
          const doc = [
            {
              uri: newFile && newFile.url ? newFile.url : "",
              fileType: "docx",
            },
          ];
          return (
            <div className="space-y-4">
              <h4 className="text-lg font-medium">Document Preview</h4>
              <div className="border rounded-md overflow-hidden">
                <DocViewer
                  pluginRenderers={[CustomFileRender, ...DocViewerRenderers]}
                  documents={doc}
                  style={{ width: "100%", height: 500 }}
                  config={{
                    header: {
                      disableHeader: false,
                      disableFileName: true,
                      retainURLParams: false,
                    },
                  }}
                />
              </div>
            </div>
          );
        default:
          return <></>;
      }
    } else {
      return <></>;
    }
  }

  return !isLoading ? (
    <main className="bg-background text-foreground p-4 space-y-6">
      {fileInfo ? (
        <>
          {/* Dialogs */}
          <DialogWrapper
            open={openDeleteModal}
            onOpenChange={setOpenDeleteModal}
            title="Delete File?"
            description="Are you sure you would like to permanently delete this file? This action cannot be undone."
            contentClassName="sm:max-w-md"
            actions={[
              {
                label: "Cancel",
                onClick: () => setOpenDeleteModal(false),
                variant: "outline",
              },
              {
                label: "Delete",
                onClick: () => handleUpload(undefined, true),
                variant: "destructive",
              },
            ]}
          />

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

          <DialogWrapper
            open={showInfoTooltip}
            onOpenChange={setShowInfoTooltip}
            title="Editing Files"
            contentClassName="sm:max-w-md"
            actions={[
              {
                label: "Got it",
                onClick: () => setShowInfoTooltip(false),
              },
            ]}
          >
            <div className="space-y-3">
              <p className="text-sm leading-6">
                Update your file name, replace the file content, or modify tags
                as needed. Click "Save & Publish" to save your changes.
              </p>
              <p className="text-sm text-muted-foreground italic">
                Note: Choosing "Discard Changes" will return you to the previous
                page without saving any modifications.
              </p>
            </div>
          </DialogWrapper>

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
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                  <h1 className="text-4xl font-bold mb-2 text-foreground leading-tight">
                    Edit {file?.name}
                  </h1>
                  <nav
                    className="flex flex-col md:flex-row gap-2"
                    aria-label="File editing actions"
                  >
                    <TooltipWrapper content="Delete File">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOpenDeleteModal(true)}
                        disabled={isLoading}
                        aria-label="Delete file permanently"
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </TooltipWrapper>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowInfoTooltip(true)}
                      aria-label="Get help with file editing"
                    >
                      <Info className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <div className="flex rounded-lg border overflow-hidden">
                      <Button
                        size="sm"
                        onClick={handleClick}
                        className="rounded-none border-0 w-full"
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
                            aria-label="Select file save strategy"
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
                  Upload documents that will factor into generated AI output for
                  your course. For more information on this system, please see the{" "}
                  <a
                    href="https://docs.google.com/document/d/1o3He0CdgV7hJOX65gc3Gpf3_Fr3GYvSm4Q-i-Y5cNHQ/edit?tab=t.0#heading=h.7pexnnplkzu2"
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2 hover:no-underline text-primary dark:text-gold colorful-dark:text-gold font-medium"
                  >
                    "Uploading a Document" section of our instructor guide
                  </a>
                  .
                </p>
              </div>
            </div>
          </header>

          {/* File preview section */}
          {newFile && newFile.name && newFile.url && (
            <Card className="mt-6 transition-all duration-300 hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-foreground">
                  Current File Preview
                </CardTitle>
                <p className="text-muted-foreground text-sm">
                  Preview of your current file content.
                </p>
              </CardHeader>
              <CardContent>{renderFile()}</CardContent>
            </Card>
          )}

          <Card className="transition-all duration-300 hover:shadow-md pt-4">
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
              <form
                onSubmit={(e) => handleUpload(e, false)}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="name" className="text-sm font-medium">
                      File Name *
                    </Label>
                    <TooltipWrapper content="The name for the document.">
                      <button aria-label="The name for the document.">
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </button>
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
                    <Label className="text-sm font-medium">File Upload</Label>
                    <TooltipWrapper content="Select a JPEG, PNG, PDF, TXT, DOCX file to replace the current file.">
                      <button aria-label="Select a JPEG, PNG, PDF, TXT, DOCX file to replace the current file.">
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </button>
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
                        <span className="text-sm font-medium text-muted-foreground">
                          Choose new file to upload
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
                        <span className="text-sm font-medium truncate-text">
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
                      <button aria-label="Tags describe a feature of the files and will be used to allow for sorting files by type.">
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
              aria-label="File editing actions"
            >
              <TooltipWrapper content="Delete File">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenDeleteModal(true)}
                  disabled={isLoading}
                  aria-label="Delete file permanently"
                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Delete
                </Button>
              </TooltipWrapper>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInfoTooltip(true)}
                aria-label="Get help with file editing"
              >
                <Info className="h-4 w-4" aria-hidden="true" />
                Info
              </Button>
              <div className="flex rounded-lg border overflow-hidden">
                <Button
                  size="sm"
                  onClick={handleClick}
                  className="rounded-none border-0 w-full"
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
                      aria-label="Select file save strategy"
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
        </>
      ) : (
        <div
          className="text-center py-12 text-muted-foreground bg-card border rounded-lg"
          role="status"
        >
          <Upload className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">File not found</p>
          <p className="text-sm">
            The file you're looking for doesn't exist or has been deleted.
          </p>
        </div>
      )}
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
        <p className="text-muted-foreground">Loading File Editor</p>
      </div>
    </div>
  );
}
