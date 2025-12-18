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
import { useTranslation } from "../../hooks/useTranslation";
import { InfoAccordion } from "../../components/ui-wrappers/InfoAccordion";


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
  const { t } = useTranslation();
  const options = [t("createFile.saveUpload"), t("createFile.discardChanges")];

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
          file: t("createFile.fileTooLarge"),
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
            file: t("createFile.invalidFileType"),
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
                    setAlert({ message: `${t("errorMessage.fileNotExist")}`, type: "error" });
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
            setAlert({ message: `${t("errorMessage.fileNotExist")}`, type: "error" });
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
                    setAlert({ message: `${t("errorMessage.fileNotExist")}`, type: "error" });
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
            setAlert({ message: `${t("errorMessage.fileNotExist")}`, type: "error" });
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
              message: t("createFile.fileCouldNotBeCreated"),
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
            message: t("createFile.fileCouldNotBeCreated"),
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
      setErrors((prev: any) => ({ ...prev, name: t("common.name") + " " + t("common.missing") }));
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
                    message: t("errorMessage.createFileError"),
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
                  message: t("errorMessage.createFileError"),
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
                <h4 className="text-lg font-medium">{`${t("createFile.pdf")} ${t("createFile.preview")}`}</h4>
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
                    {t("createFile.page")} {" "} {pageNumber || (numPages ? 1 : "--")} /{" "}
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
              <h4 className="text-lg font-medium">{`${t("createFile.image")} ${t("createFile.preview")}`}</h4>
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
              <h3 className="text-lg font-medium">{`${t("createFile.document")} ${t("createFile.preview")}`}</h3>
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
            title={t("createFile.deleteFile")}
            description={t("createFile.deleteFileMessage")}
            contentClassName="sm:max-w-md"
            actions={[
              {
                label: `${t("common.cancel")}`,
                onClick: () => setOpenDeleteModal(false),
                variant: "outline",
              },
              {
                label: t("common.delete"),
                onClick: () => handleUpload(undefined, true),
                variant: "destructive",
              },
            ]}
          />

          <DialogWrapper
            open={openDiscardModal}
            onOpenChange={setOpenDiscardModal}
            title={t("createFile.discardChanges")}
            description={t("createFile.discardChangesDescription")}
            contentClassName="sm:max-w-md"
            actions={[
              {
                label: `${t("common.cancel")}`,
                onClick: () => setOpenDiscardModal(false),
                variant: "outline",
              },
              {
                label: t("createFile.discardChanges"),
                onClick: () => navigator(-1),
                variant: "destructive",
              },
            ]}
          />

          <DialogWrapper
            open={showInfoTooltip}
            onOpenChange={setShowInfoTooltip}
            title={t("createFile.editingFilesTitle")}
            contentClassName="sm:max-w-md"
            actions={[
              {
                label: t("components.gotIt"),
                onClick: () => setShowInfoTooltip(false),
              },
            ]}
          >
            <div className="space-y-3">
              <p className="text-sm leading-6">
                {t("createFile.editingFilesDescription")}
              </p>
              <p className="text-sm text-muted-foreground italic">
                {t("createFile.editingFileDescriptionNote")}
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
                    {t("common.edit")} {file?.name}
                  </h1>
                  <nav
                    className="flex flex-col md:flex-row gap-2"
                    aria-label={`${t("createFile.createFile")} ${t("common.actions")}`}
                  >
                    <TooltipWrapper content={t("createFile.deleteFile")}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOpenDeleteModal(true)}
                        disabled={isLoading}
                        aria-label={t("createFile.deleteFile")}
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </TooltipWrapper>
                    <TooltipWrapper content={t("common.info")}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowInfoTooltip(true)}
                        aria-label={t("createFile.fileInfoLabel")}
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
                        aria-label={`${options[selectedIndexSave]} ${t("common.file")}`}
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
                    {t("createFile.createFileDescription")}&nbsp;
                    <a
                      href="https://docs.google.com/document/d/1o3He0CdgV7hJOX65gc3Gpf3_Fr3GYvSm4Q-i-Y5cNHQ/edit?tab=t.0#heading=h.7pexnnplkzu2"
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium underline underline-offset-2 hover:no-underline text-primary dark:text-gold colorful-dark:text-gold transition-colors duration-200"
                    >
                      {t("createFile.createFileDescriptionLinkText")}
                    </a>
                    .
                  </p>
                </InfoAccordion>
              </div>
            </div>
          </header>

          {/* File preview section */}
          {newFile && newFile.name && newFile.url && (
            <Card className="mt-6 transition-all duration-300 hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-foreground">
                  {`${t("createFile.current")} ${t("common.file")} ${t("createFile.preview")}`}
                </CardTitle>
                <p className="text-muted-foreground text-sm">
                  {t("createFile.currentPreviewDescription")}
                </p>
              </CardHeader>
              <CardContent>{renderFile()}</CardContent>
            </Card>
          )}

          <Card className="transition-all duration-300 hover:shadow-md pt-4">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-foreground">
                {t("createFile.fileInformation")}
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                {t("createFile.enterFileDetails")}. {t("common.required")}
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
                      {t("createFile.fileName")} *
                    </Label>
                    <TooltipWrapper content={t("createFile.fileNameTooltip")}>
                      <button aria-label={t("createFile.fileNameTooltip")}>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </TooltipWrapper>
                  </div>
                  <Input
                    id="name"
                    name="name"
                    placeholder={t("createFile.fileNameHelptext")}
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
                      aria-live="assertive"
                    >
                      {errors.name}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">{t("createFile.fileUpload")}</Label>
                    <TooltipWrapper content={t("createFile.fileTooltip")}>
                      <button aria-label={t("createFile.fileTooltip")}>
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
                          {t("createFile.chooseFile")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {t("createFile.fileDescription")}
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
                          {t("components.change")}
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
                    <p
                      className="text-sm text-destructive"
                      role="alert"
                      aria-live="assertive"
                    >{errors.file}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">{t("library.tags")}</Label>
                    <TooltipWrapper content={t("library.tagsDescription")}>
                      <button aria-label={t("library.tagsDescription")}>
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
                              checked={newFile.tags.includes(tag.id)}
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
                        {t("library.noTags")}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("common.selected")}:{" "}
                    {newFile.tags.length > 0 ? newFile.tags.join(", ") : t("common.none")}
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Bottom Actions */}
          <section aria-labelledby="bottom-actions-heading" className="pt-4">
            <nav
              className="flex flex-col md:flex-row md:items-center md:justify-end gap-2"
              aria-label={`${t("createFile.createFile")} ${t("common.actions")}}`}
              id="bottom-actions-heading"
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpenDeleteModal(true)}
                disabled={isLoading}
                aria-label={t("createFile.deleteFile")}
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                {t("createFile.deleteFile")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInfoTooltip(true)}
                aria-label={t("createFile.fileInfoLabel")}
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
                  aria-label={`${options[selectedIndexSave]} ${t("common.file")}`}
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
        </>
      ) : (
        <div
          className="text-center py-12 text-muted-foreground bg-card border rounded-lg"
          role="status"
        >
          <Upload className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">{t("errorMessage.fileNotFound")}</p>
          <p className="text-sm">
            {t("errorMessage.fileNotFoundMessage")}
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
        <p className="text-muted-foreground">{t("loadingMessage.fileEditForm")}</p>
      </div>
    </div>
  );
}
