import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { DialogWrapper } from "../../components/ui-wrappers/DialogWrapper";
import { DropdownWrapper } from "../../components/ui-wrappers/DropdownWrapper";
import { TooltipWrapper } from "../../components/ui-wrappers/TooltipWrapper";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { ChevronDown, ChevronLeft, ChevronRight, Download, Info, Loader2, Trash2, Upload, X } from "lucide-react";
import Get from "../../utility/Get";
import Post from "../../utility/Post";
import Patch from "../../utility/Patch";
import Delete from "../../utility/Delete";
import {
  getSignedUploadUrl,
  getSignedDownloadFile,
} from "../../utility/endpoints/FolderEndpoints";
import {
  getItem,
  postCreateItem,
  patchUpdateItem,
  deleteItem,
} from "../../utility/endpoints/ItemEndpoints";
import axios from "axios";
import { Document, Page, pdfjs } from "react-pdf";
import DocViewer, { DocViewerRenderers } from "react-doc-viewer";
import CustomFileRender from "../../components/CustomFileRender";
import { AlertContext } from "../../utility/context/AlertContext";
import { UserContext } from "../../utility/context/UserContext";
import { cn } from "../../lib/utils";
import { useTranslation } from "../../hooks/useTranslation";
import { InfoAccordion } from "../../components/ui-wrappers/InfoAccordion";
import { logEvent } from "../../utility/endpoints/UserEndpoints";

export default function CreateEditFile(): JSX.Element {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const location = useLocation();
  const navigator = useNavigate();
  const { t } = useTranslation();
  const { setAlert } = useContext(AlertContext);
  const { user } = useContext(UserContext);

  const isEditMode = !location.pathname.includes("/createfile");
  const folderId = location.pathname.split("/")[2];
  const fileId = isEditMode ? location.pathname.split("/")[4] : undefined;

  const options = [
    isEditMode ? t("createFile.saveChanges") : t("createFile.saveUpload"),
    t("createFile.discardChanges"),
  ];

  const [fileName, setFileName] = useState("");
  const [fileDescription, setFileDescription] = useState("");
  const [fileReference, setFileReference] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [rawDownloadUrl, setRawDownloadUrl] = useState("");
  const [errors, setErrors] = useState({ name: "", file: "" });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedIndexSave, setSelectedIndexSave] = useState(0);
  const [openDiscardModal, setOpenDiscardModal] = useState<boolean>(false);
  const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
  const [openSaveTop, setOpenSaveTop] = useState(false);
  const [openSaveBottom, setOpenSaveBottom] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState<boolean>(false);
  const [selectedFiles, setSelectedFiles] = React.useState<File | undefined>();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB

  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);

  document.addEventListener("contextmenu", (event) => { event.preventDefault(); });

  function onDocumentLoadSuccess({ numPages: n }: any) {
    setNumPages(n);
    setPageNumber(1);
  }

  useEffect(() => {
    Post(logEvent(), {
      eventType: "view_page",
      metadata: { isEditMode, folderId, fileId, page: "create_file" },
    });

    const controller = new AbortController();

    if (isEditMode && fileId) {
      Get(getItem(fileId), controller.signal, true).then((res) => {
        if (res && res.status && res.status < 300 && res.data) {
          const item = res.data;
          setFileName(item.name);
          setFileDescription(item.description ?? "");
          const ref = item.metadata?.fileReference ?? "";
          setFileReference(ref);
          setIsLoading(false);

          if (ref) {
            Get(getSignedDownloadFile(fileId)).then(async (res1) => {
              if (res1 && res1.status && res1.status < 300 && res1.data) {
                const url = res1.data.url;
                setRawDownloadUrl(url);
                const ext = ref.split(".").pop()?.toLowerCase();
                if (ext === "txt") {
                  const text = await fetch(url).then((r) => r.text());
                  setPreviewUrl(text);
                } else {
                  setPreviewUrl(url);
                }
              } else if (res1 && res1.status === 401) {
                navigator("/login");
              }
            });
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else if (res !== undefined) {
          setAlert({ message: t("errorMessage.fileNotExist"), type: "error" });
          navigator("/library");
        }
      });
    } else {
      Get(getItem(folderId), controller.signal, true).then((res) => {
        if (res && res.status && res.status < 300 && res.data) {
          setIsLoading(false);
        } else if (res && res.status === 401) {
          navigator("/login");
        } else if (res !== undefined) {
          setAlert({ message: t("library.folderDoesNotExist"), type: "error" });
          navigator("/library");
        }
      });
    }

    return () => controller.abort();
    // eslint-disable-next-line
  }, [location.pathname]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event?.target?.files?.[0];
    if (!file) return;
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    if (file.size > MAX_FILE_SIZE) {
      setErrors((prev) => ({ ...prev, file: t("createFile.fileTooLarge") }));
      setSelectedFiles(undefined);
    } else if (allowedTypes.includes(file.type)) {
      setErrors((prev) => ({ ...prev, file: "" }));
      setSelectedFiles(file);
    } else {
      setErrors((prev) => ({ ...prev, file: t("createFile.invalidFileType") }));
      setSelectedFiles(undefined);
    }
  };

  const handleMenuItemClick = (index: number) => {
    if (index === 0) { handleSubmit(); }
    else if (index === 1) { setOpenDiscardModal(true); }
    setSelectedIndexSave(index);
    setOpenSaveTop(false);
    setOpenSaveBottom(false);
  };

  function handleClick(_e: any) {
    if (selectedIndexSave === 0) { handleSubmit(); }
    else if (selectedIndexSave === 1) { setOpenDiscardModal(true); }
  }

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (fileName === "") {
      setErrors((prev) => ({ ...prev, name: t("errorMessage.nameMissing") }));
      return;
    }
    if (!isEditMode && !selectedFiles) {
      setAlert({ message: t("errorMessage.missingFileInfo"), type: "error" });
      return;
    }
    setIsLoading(true);

    if (selectedFiles) {
      const ext = selectedFiles.name.includes(".") ? "." + selectedFiles.name.split(".").pop() : "";
      const tempFileId = Date.now() + "" + Math.floor(100000 + Math.random() * 900000) + ext;
      Get(getSignedUploadUrl(folderId, tempFileId)).then((res) => {
        if (res && res.status && res.status < 300 && res.data) {
          handleUploadToS3(res.data.url, res.data.fileId);
        } else if (res && res.status === 401) {
          navigator("/login");
        } else if (res !== undefined) {
          setAlert({ message: t("errorMessage.createFileError"), type: "error" });
          setIsLoading(false);
        }
      });
    } else {
      saveFileItem(fileReference);
    }
  }

  async function handleUploadToS3(url: string, id: string) {
    try {
      const res = await axios.put(url, selectedFiles, {
        headers: { "Content-Type": selectedFiles!.type },
      });
      if (res && res.status && res.status < 300) {
        saveFileItem(id);
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error((error as Error).message);
      setIsLoading(false);
    }
  }

  function saveFileItem(newFileReference: string) {
    if (isEditMode && fileId) {
      Patch(patchUpdateItem(fileId), {
        name: fileName,
        description: fileDescription,
        metadata: { fileReference: newFileReference },
      }, true).then((res) => {
        if (res.status && res.status < 300) {
          setAlert({ message: t("createFile.fileUpdated"), type: "success" });
        } else if (res && res.status === 401) {
          navigator("/login");
          return;
        } else {
          setAlert({ message: t("createFile.fileCouldNotBeCreated"), type: "error" });
        }
        navigator(`/library/${folderId}`);
        setIsLoading(false);
      });
    } else {
      Post(postCreateItem(), {
        type: "file",
        parentId: folderId,
        name: fileName,
        description: fileDescription,
        metadata: { fileReference: newFileReference, createdBy: user?.username },
      }, true).then((res) => {
        if (res.status && res.status < 300) {
          setAlert({ message: t("createFile.fileCreated"), type: "success" });
        } else if (res && res.status === 401) {
          navigator("/login");
          return;
        } else {
          setAlert({ message: t("createFile.fileCouldNotBeCreated"), type: "error" });
        }
        setIsLoading(false);
        navigator(`/library/${folderId}`);
      });
    }
  }

  function handleDelete() {
    if (!fileId) return;
    setIsLoading(true);
    Delete(deleteItem(fileId), true).then((res) => {
      if (res.status && res.status < 300) {
        setAlert({ message: t("createFile.fileDeleted"), type: "success" });
      } else if (res && res.status === 401) {
        navigator("/login");
        return;
      } else {
        setAlert({ message: t("createFile.fileCouldNotBeDeleted"), type: "error" });
      }
      navigator(`/library/${folderId}`);
      setIsLoading(false);
    });
  }

  function renderFile(): React.JSX.Element {
    if (!fileReference || !previewUrl) return <></>;
    const ext = fileReference.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "txt":
        return (
          <div className="p-4 bg-muted/30 rounded-md">
            <pre className="whitespace-pre-wrap text-sm">{previewUrl}</pre>
          </div>
        );
      case "pdf":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium">{`${t("createFile.pdf")} ${t("createFile.preview")}`}</h4>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" disabled={pageNumber <= 1} onClick={() => setPageNumber((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {t("createFile.page")} {pageNumber || (numPages ? 1 : "--")} / {numPages || "--"}
                </span>
                <Button type="button" variant="outline" size="sm" disabled={pageNumber >= numPages} onClick={() => setPageNumber((p) => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="border rounded-md overflow-hidden">
              <Document file={previewUrl} onLoadSuccess={onDocumentLoadSuccess}>
                <Page pageNumber={pageNumber} renderTextLayer={false} renderAnnotationLayer={false} />
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
              <img className="w-full h-auto max-h-96 object-contain" src={previewUrl} alt="File preview" />
            </div>
          </div>
        );
      case "docx": {
        const doc = [{ uri: previewUrl, fileType: "docx" }];
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{`${t("createFile.document")} ${t("createFile.preview")}`}</h3>
            <div className="border rounded-md overflow-hidden">
              <DocViewer
                pluginRenderers={[CustomFileRender, ...DocViewerRenderers]}
                documents={doc}
                style={{ width: "100%", height: 500 }}
                config={{ header: { disableHeader: false, disableFileName: true, retainURLParams: false } }}
              />
            </div>
          </div>
        );
      }
      default:
        return <></>;
    }
  }

  return !isLoading ? (
    <main className="bg-background text-foreground p-4 space-y-6">
      {/* Info dialog */}
      <DialogWrapper
        open={showInfoDialog}
        onOpenChange={setShowInfoDialog}
        title={isEditMode ? t("createFile.editingFilesTitle") : t("library.aboutFileUpload")}
        contentClassName="sm:max-w-md"
        actions={[{ label: t("components.gotIt"), onClick: () => setShowInfoDialog(false) }]}
      >
        <div className="space-y-3">
          {isEditMode ? (
            <>
              <p className="text-sm leading-6">{t("createFile.editingFilesDescription")}</p>
              <p className="text-sm text-muted-foreground italic">{t("createFile.editingFileDescriptionNote")}</p>
            </>
          ) : (
            <p>
              {t("createFile.fileInfoDescription")}
              <a
                href="https://docs.google.com/document/d/1o3He0CdgV7hJOX65gc3Gpf3_Fr3GYvSm4Q-i-Y5cNHQ/edit?tab=t.0#heading=h.7pexnnplkzu2"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2 hover:no-underline text-primary dark:text-gold colorful-dark:text-gold font-medium"
              >
                {t("createFile.fileInfoDescriptionLinkText")}
              </a>
              .
            </p>
          )}
        </div>
      </DialogWrapper>

      {/* Discard dialog */}
      <DialogWrapper
        open={openDiscardModal}
        onOpenChange={setOpenDiscardModal}
        title={t("createFile.discardChanges")}
        description={t("createFile.discardChangesDescription")}
        contentClassName="sm:max-w-md"
        actions={[
          { label: t("common.cancel"), onClick: () => setOpenDiscardModal(false), variant: "outline" },
          { label: t("createFile.discardChanges"), onClick: () => navigator(-1), variant: "destructive" },
        ]}
      />

      {/* Delete dialog (edit mode only) */}
      {isEditMode && (
        <DialogWrapper
          open={openDeleteModal}
          onOpenChange={setOpenDeleteModal}
          title={t("createFile.deleteFile")}
          description={t("createFile.deleteFileMessage")}
          contentClassName="sm:max-w-md"
          actions={[
            { label: t("common.cancel"), onClick: () => setOpenDeleteModal(false), variant: "outline" },
            { label: t("common.delete"), onClick: handleDelete, variant: "destructive" },
          ]}
        />
      )}

      <header className="animate-in slide-in-from-bottom-4 duration-700">
        <div className="relative overflow-hidden bg-card border rounded-xl p-6 shadow-lg">
          <div className="absolute top-0 right-0 w-48 h-48 opacity-10" aria-hidden="true">
            <Upload size={192} className="text-primary" />
          </div>
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
              <h1 className="text-4xl font-bold mb-2 text-foreground leading-tight">
                {isEditMode ? `${t("common.edit")} ${fileName}` : t("createFile.createFile")}
              </h1>
              <nav
                className="flex flex-col md:flex-row gap-2"
                aria-label={`${t("createFile.createFile")} ${t("common.actions")}`}
              >
                {isEditMode && (
                  <TooltipWrapper content={t("common.delete")}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOpenDeleteModal(true)}
                      disabled={isLoading}
                      aria-label={t("common.delete")}
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </TooltipWrapper>
                )}
                <TooltipWrapper content={t("common.info")}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowInfoDialog(true)}
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

      {/* Current file preview (edit mode only) */}
      {isEditMode && previewUrl && (
        <Card className="transition-all duration-300 hover:shadow-md">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  {`${t("createFile.current")} ${t("common.file")} ${t("createFile.preview")}`}
                </CardTitle>
                <p className="text-muted-foreground text-sm mt-1">{t("createFile.currentPreviewDescription")}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(rawDownloadUrl, "_blank")}
                aria-label={t("common.download")}
              >
                <Download className="h-4 w-4 mr-1" aria-hidden="true" />
                {t("common.download")}
              </Button>
            </div>
          </CardHeader>
          <CardContent>{renderFile()}</CardContent>
        </Card>
      )}

      <section aria-labelledby="actions-heading">
        <Card className="transition-all duration-300 hover:shadow-md" id="actions-heading">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-foreground">
              {t("createFile.fileInformation")}
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              {t("createFile.enterFileDetails")}. {t("common.required")}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    {t("createFile.fileName")} *
                  </Label>
                  <TooltipWrapper content={t("createFile.fileNameTooltip")}>
                    <button type="button" aria-label={t("createFile.fileNameTooltip")}>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </TooltipWrapper>
                </div>
                <Input
                  id="name"
                  name="name"
                  placeholder={t("createFile.fileNameHelptext")}
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  disabled={isLoading}
                  required
                  className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
                  aria-describedby={errors.name ? "name-error" : undefined}
                />
                {errors.name && (
                  <p id="name-error" className="text-sm text-destructive" role="alert" aria-live="assertive">
                    {errors.name}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    {t("createFile.fileItemDescription")}
                  </Label>
                  <TooltipWrapper content={t("createFile.fileItemDescriptionTooltip")}>
                    <button type="button" aria-label={t("createFile.fileItemDescriptionTooltip")}>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </TooltipWrapper>
                </div>
                <Textarea
                  id="description"
                  name="description"
                  placeholder={t("createFile.fileItemDescriptionHelptext")}
                  value={fileDescription}
                  onChange={(e) => setFileDescription(e.target.value)}
                  disabled={isLoading}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">
                    {t("createFile.fileUpload")}{!isEditMode && " *"}
                  </Label>
                  <TooltipWrapper content={t("createFile.fileTooltip")}>
                    <button type="button" aria-label={t("createFile.fileTooltip")}>
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
                        {isEditMode ? t("createFile.chooseNewFile") : t("createFile.chooseFile")}
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
                        {selectedFiles.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => { setSelectedFiles(undefined); fileRef.current?.click(); }}
                        disabled={isLoading}
                      >
                        {t("components.change")}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFiles(undefined)}
                        disabled={isLoading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                {errors.file && (
                  <p className="text-sm text-destructive" role="alert" aria-live="assertive">
                    {errors.file}
                  </p>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <section aria-labelledby="bottom-actions-heading" className="pt-4">
          <nav
            className="flex flex-col md:flex-row md:items-center md:justify-end gap-2"
            aria-label={`${t("createFile.createFile")} ${t("common.actions")}`}
            id="bottom-actions-heading"
          >
            {isEditMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpenDeleteModal(true)}
                disabled={isLoading}
                aria-label={t("common.delete")}
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                {t("common.delete")}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInfoDialog(true)}
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
      </section>
    </main>
  ) : (
    <div className="min-h-screen flex items-center justify-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        <p className="text-muted-foreground">
          {isEditMode ? t("loadingMessage.fileEditForm") : t("loadingMessage.fileCreationForm")}
        </p>
      </div>
    </div>
  );
}
