import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
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
import Patch from "../../utility/Patch";
import Delete from "../../utility/Delete";
import Post from "../../utility/Post";
import axios from "axios";
import {
  getSignedS3BucketDownloadFile,
  getSignedS3BucketUploadOrgFolder,
  getSignedS3BucketUploadUserFolder,
} from "../../utility/endpoints/FolderEndpoints";
import {
  getItem,
  patchUpdateItem,
  deleteItem,
} from "../../utility/endpoints/ItemEndpoints";
import { Document, Page, pdfjs } from "react-pdf";
import DocViewer, { DocViewerRenderers } from "react-doc-viewer";
import CustomFileRender from "../../components/CustomFileRender";
import { AlertContext } from "../../utility/context/AlertContext";
import { cn } from "../../lib/utils";
import { useTranslation } from "../../hooks/useTranslation";
import { InfoAccordion } from "../../components/ui-wrappers/InfoAccordion";
import { logEvent } from "../../utility/endpoints/UserEndpoints";

export default function EditFile(): JSX.Element {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  const location = useLocation();
  const navigator = useNavigate();
  const { t } = useTranslation();
  const { setAlert } = useContext(AlertContext);

  const options = [t("createFile.saveUpload"), t("createFile.discardChanges")];

  const folderId = location.pathname.split("/")[2];
  const fileId = location.pathname.split("/")[4];

  const [fileName, setFileName] = useState("");
  const [fileReference, setFileReference] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [isOrgFolder, setIsOrgFolder] = useState(false);
  const [errors, setErrors] = useState({ name: "", file: "" });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedIndexSave, setSelectedIndexSave] = useState(0);
  const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
  const [openDiscardModal, setOpenDiscardModal] = useState<boolean>(false);
  const [showInfoTooltip, setShowInfoTooltip] = useState<boolean>(false);
  const [openSaveTop, setOpenSaveTop] = useState(false);
  const [openSaveBottom, setOpenSaveBottom] = useState(false);
  const [selectedFiles, setSelectedFiles] = React.useState<File | undefined>();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB

  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);

  document.addEventListener("contextmenu", (event) => { event.preventDefault(); });

  function onDocumentLoadSuccess({ numPages }: any) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  useEffect(() => {
    Post(logEvent(), {
      eventType: "view_page",
      metadata: { folderId, fileId, page: "edit_file" },
    });

    const controller = new AbortController();
    Get(getItem(fileId), controller.signal).then((res) => {
      if (res && res.status && res.status < 300 && res.data) {
        const item = res.data;
        setFileName(item.name);
        setIsOrgFolder(item.ownerId === "ORG");
        const ref = item.metadata?.fileReference ?? "";
        setFileReference(ref);

        if (ref) {
          Get(getSignedS3BucketDownloadFile(ref), controller.signal).then(async (res1) => {
            if (res1 && res1.status && res1.status < 300 && res1.data) {
              const ext = ref.split(".")[1];
              if (ext === "txt") {
                const text = await fetch(res1.data.url).then((r) => r.text());
                setPreviewUrl(text);
              } else {
                setPreviewUrl(res1.data.url);
              }
            } else if (res1 && res1.status === 401) {
              navigator("/login");
            }
            setIsLoading(false);
          });
        } else {
          setIsLoading(false);
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else if (res !== undefined) {
        setAlert({ message: t("errorMessage.fileNotExist"), type: "error" });
        navigator("/library");
      }
    });

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
    if (index === 0) { handleUpload(); }
    else if (index === 1) { setOpenDiscardModal(true); }
    setSelectedIndexSave(index);
    setOpenSaveTop(false);
    setOpenSaveBottom(false);
  };

  function handleClick(_e: any) {
    if (selectedIndexSave === 0) { handleUpload(); }
    else if (selectedIndexSave === 1) { setOpenDiscardModal(true); }
  }

  function handleUpload(e?: React.FormEvent) {
    e?.preventDefault();
    if (fileName === "") {
      setErrors((prev) => ({ ...prev, name: t("errorMessage.nameMissing") }));
      return;
    }
    setIsLoading(true);

    if (selectedFiles) {
      const ext = selectedFiles.name.includes(".") ? "." + selectedFiles.name.split(".").pop() : "";
      const newFileId = Date.now() + "" + Math.floor(100000 + Math.random() * 900000) + ext;

      const signedUrlEndpoint = isOrgFolder
        ? getSignedS3BucketUploadOrgFolder(folderId, newFileId)
        : getSignedS3BucketUploadUserFolder(folderId, newFileId);

      Get(signedUrlEndpoint).then((res) => {
        if (res && res.status && res.status < 300 && res.data) {
          handleUploadToS3(res.data.url, isOrgFolder ? res.data.id : newFileId);
        } else if (res && res.status === 401) {
          navigator("/login");
        } else if (res !== undefined) {
          setAlert({ message: t("errorMessage.createFileError"), type: "error" });
          setIsLoading(false);
        }
      });
    } else {
      updateFileItem(fileReference);
    }
  }

  async function handleUploadToS3(url: string, id: string) {
    try {
      const res = await axios.put(url, selectedFiles, {
        headers: { "Content-Type": selectedFiles!.type },
      });
      if (res && res.status && res.status < 300) {
        updateFileItem(id);
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

  function updateFileItem(newFileReference: string) {
    Patch(patchUpdateItem(fileId), {
      name: fileName,
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
  }

  function handleDelete() {
    setIsLoading(true);
    Delete(deleteItem(fileId), true).then((res) => {
      if (res.status && res.status < 300) {
        setAlert({ message: t("createFile.fileDeleted") || "File deleted.", type: "success" });
      } else if (res && res.status === 401) {
        navigator("/login");
        return;
      } else {
        setAlert({ message: t("createFile.fileCouldNotBeDeleted") || "Could not delete file.", type: "error" });
      }
      navigator(`/library/${folderId}`);
      setIsLoading(false);
    });
  }

  function renderFile(): React.JSX.Element {
    if (!fileReference) return <></>;
    const ext = fileReference.split(".")[1]?.toLowerCase();
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

      <DialogWrapper
        open={showInfoTooltip}
        onOpenChange={setShowInfoTooltip}
        title={t("createFile.editingFilesTitle")}
        contentClassName="sm:max-w-md"
        actions={[{ label: t("components.gotIt"), onClick: () => setShowInfoTooltip(false) }]}
      >
        <div className="space-y-3">
          <p className="text-sm leading-6">{t("createFile.editingFilesDescription")}</p>
          <p className="text-sm text-muted-foreground italic">{t("createFile.editingFileDescriptionNote")}</p>
        </div>
      </DialogWrapper>

      <header className="animate-in slide-in-from-bottom-4 duration-700">
        <div className="relative overflow-hidden bg-card border rounded-xl p-6 shadow-lg">
          <div className="absolute top-0 right-0 w-48 h-48 opacity-10" aria-hidden="true">
            <Upload size={192} className="text-primary" />
          </div>
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
              <h1 className="text-4xl font-bold mb-2 text-foreground leading-tight">
                {t("common.edit")} {fileName}
              </h1>
              <nav className="flex flex-col md:flex-row gap-2" aria-label={`${t("createFile.createFile")} ${t("common.actions")}`}>
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

      {previewUrl && (
        <Card className="mt-6 transition-all duration-300 hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-foreground">
              {`${t("createFile.current")} ${t("common.file")} ${t("createFile.preview")}`}
            </CardTitle>
            <p className="text-muted-foreground text-sm">{t("createFile.currentPreviewDescription")}</p>
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
          <form onSubmit={handleUpload} className="space-y-6">
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
                <Label className="text-sm font-medium">{t("createFile.fileUpload")}</Label>
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
                    <span className="text-sm font-medium text-muted-foreground">{t("createFile.chooseFile")}</span>
                    <span className="text-xs text-muted-foreground">{t("createFile.fileDescription")}</span>
                  </div>
                </Button>
              ) : (
                <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Upload className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm font-medium truncate-text">{selectedFiles.name}</span>
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
                <p className="text-sm text-destructive" role="alert" aria-live="assertive">{errors.file}</p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

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
    </main>
  ) : (
    <div className="min-h-screen flex items-center justify-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        <p className="text-muted-foreground">{t("loadingMessage.fileEditForm")}</p>
      </div>
    </div>
  );
}
