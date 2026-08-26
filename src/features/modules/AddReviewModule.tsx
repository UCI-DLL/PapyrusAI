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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import {
  ChevronDown,
  Info,
  Plus,
  Loader2,
  FileText,
  ClipboardCheck,
  Save,
  Trash2,
  CheckCircle,
  XCircle,
  Lock,
  BookOpen,
  Eye,
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
import ListFolders from "../library/ListFolderItems";
import { Prompt } from "../../components/Prompt";
import { FileType, LibraryItem, PromptType, RubricType } from "../../utility/types/CourseTypes";
import { File } from "../../components/File";
import { useTranslation } from "../../hooks/useTranslation";
import { InfoAccordion } from "../../components/ui-wrappers/InfoAccordion";
import { TooltipWrapper } from "../../components/ui-wrappers/TooltipWrapper";
import Post from "../../utility/Post";
import { logEvent } from "../../utility/endpoints/UserEndpoints";

type ReviewModuleFormType = {
  name: string;
  moduleDescription: string;
  isRepeating: boolean;
  isPublished: boolean;
  showInitialPrompt: boolean;
  prompts: Array<PromptType>;
  files: Array<FileType>;
  webSearch: boolean;
  essaySubmission: boolean;
  moduleType: "review";
  assessmentType: "formative" | "summative";
  gradingType: "ma6";
  converseAfterComplete: boolean;
  maxDrafts: number;
  rubrics: Array<RubricType>;
  showRubric: boolean;
  id?: string;
  isDeleted?: boolean;
  isTemplate?: boolean;
  showWizard?: boolean;
  isOralModule?: boolean;
};

type ModuleFormMode = "create" | "edit";

interface AddReviewModuleProps {
  mode?: ModuleFormMode;
  courseId?: string;
  moduleId?: string;
}

export default function AddReviewModule({
  mode = "create",
  courseId,
  moduleId,
}: AddReviewModuleProps = {}): JSX.Element {
  const location = useLocation();
  const navigator = useNavigate();
  const { t } = useTranslation();

  const saveOptions = [
    t("createModule.savePublish"),
    t("createModule.saveNoPublish"),
    t("createModule.discardChanges"),
  ];

  const isEditMode =
    mode === "edit" || location.pathname.includes("/editreviewmodule/");
  const actualCourseId =
    courseId || location.pathname.split("/")[2];
  const actualModuleId =
    moduleId || (isEditMode ? location.pathname.split("/")[4] : undefined);

  const [session, setSession] = useState<ReviewModuleFormType>({
    name: "",
    moduleDescription: "",
    isRepeating: false,
    isPublished: false,
    showInitialPrompt: true,
    prompts: [],
    files: [],
    webSearch: false,
    essaySubmission: true,
    moduleType: "review",
    assessmentType: "formative",
    gradingType: "ma6",
    converseAfterComplete: false,
    maxDrafts: 999,
    rubrics: [],
    showRubric: false,
    id: "",
    isDeleted: false,
    isTemplate: false,
    showWizard: true,
    isOralModule: false,
  });

  const [isLoading, setIsLoading] = useState<boolean>(isEditMode);
  const { setAlert } = useContext(AlertContext);

  const [openAssetModal, setOpenAssetModal] = useState<boolean>(false);
  const [openRubricModal, setOpenRubricModal] = useState<boolean>(false);
  const [libraryFolderId, setLibraryFolderId] = useState<string>("root");
  const [libraryTab, setLibraryTab] = useState<"my" | "shared">("my");
  const [rubricFolderId, setRubricFolderId] = useState<string>("root");
  const [rubricTab, setRubricTab] = useState<"my" | "shared">("my");

  const [openSaveTop, setOpenSaveTop] = useState(false);
  const [openSaveBottom, setOpenSaveBottom] = useState(false);
  const [selectedIndexSave, setSelectedIndexSave] = useState(0);

  const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
  const [openDiscardModal, setOpenDiscardModal] = useState<boolean>(false);
  const [pendingAssessmentType, setPendingAssessmentType] = useState<"formative" | "summative" | null>(null);

  function handleAssessmentTypeClick(newType: "formative" | "summative") {
    if (isEditMode && session.assessmentType !== newType) {
      setPendingAssessmentType(newType);
    } else {
      setSession((prev) => ({ ...prev, assessmentType: newType }));
    }
  }
  const [openActiveModal, setOpenActiveModal] = useState<boolean>(false);
  const [showSavePublishTooltip, setShowSavePublishTooltip] = useState<boolean>(false);
  const [openConfirmationModal, setOpenConfirmationModal] = useState<{ id: string; type: string }>({ id: "", type: "" });
  const [openViewRubricModal, setOpenViewRubricModal] = useState<boolean>(false);

  const [errors, setErrors] = useState<any>({
    name: "",
    moduleDescription: "",
    rubrics: "",
  });

  // Whether assets/rubric are locked (once published in edit mode)
  const assetsLocked = isEditMode && session.isPublished;

  useEffect(() => {
    setAlert({ message: "", type: "info" });
    const metadata: any = { isEditMode, courseId: actualCourseId, page: "add_review_module" };
    if (isEditMode && actualModuleId) metadata.moduleId = actualModuleId;
    Post(logEvent(), { eventType: "view_page", metadata });
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (isEditMode && actualCourseId && actualModuleId) {
      const controller = new AbortController();
      Get(getModule(actualCourseId, actualModuleId), controller.signal).then((res) => {
        if (res && res.status && res.status < 300) {
          if (res.data) {
            const data = res.data;
            setSession({
              name: data.name ?? "",
              moduleDescription: data.moduleDescription ?? "",
              isRepeating: data.isRepeating ?? false,
              isPublished: data.isPublished ?? false,
              showInitialPrompt: data.showInitialPrompt ?? true,
              prompts: data.prompts ?? [],
              files: data.files ?? [],
              webSearch: data.webSearch ?? false,
              essaySubmission: data.essaySubmission ?? true,
              moduleType: "review",
              assessmentType: data.assessmentType ?? "formative",
              gradingType: data.gradingType ?? "ma6",
              converseAfterComplete: data.converseAfterComplete ?? false,
              maxDrafts: data.maxDrafts ?? 999,
              rubrics: data.rubrics ?? [],
              showRubric: data.showRubric ?? false,
              id: data.id,
              isDeleted: data.isDeleted ?? false,
              isTemplate: data.isTemplate ?? false,
              showWizard: data.showWizard ?? true,
              isOralModule: data.isOralMOdule ?? false,
            });
            setIsLoading(false);
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          if (res !== undefined) {
            navigator("/courses");
            setAlert({ message: t("errorMessage.moduleNotExist"), type: "error" });
            setIsLoading(false);
          }
        }
      });
      return () => controller.abort();
    } else if (!isEditMode) {
      setIsLoading(false);
    }
    // eslint-disable-next-line
  }, [isEditMode, actualCourseId, actualModuleId]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setSession((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function selectAsset(item: LibraryItem) {
    if (item.type === "prompt") {
      setSession((prev) => {
        if (prev.prompts.some((p) => p.id === item.itemId)) return prev;
        return {
          ...prev,
          prompts: [...prev.prompts, { id: item.itemId, isDeleted: false, name: item.name, prompt: item.metadata?.prompt ?? "" }],
        };
      });
    } else if (item.type === "file") {
      setSession((prev) => {
        if (prev.files.some((f) => f.id === item.itemId)) return prev;
        return {
          ...prev,
          files: [...prev.files, { id: item.itemId, isDeleted: false, name: item.name, hiddenMessageId: item.metadata?.hiddenMessageId ?? "", fileReference: item.metadata?.fileReference ?? "" }],
        };
      });
    }
  }

  function selectRubric(item: LibraryItem) {
    if (item.type === "rubric") {
      const rubric: RubricType = {
        id: item.itemId,
        creator: { username: "", name: "", family_name: "", email: "", sub: "" },
        isDeleted: false,
        name: item.name,
        isOrganizationRubric: item.ownerId === "ORG",
        folderId: item.parentId,
        columns: item.metadata?.columns ?? [],
        criteria: item.metadata?.criteria ?? [],
      };
      setSession((prev) => ({ ...prev, rubrics: [rubric] }));
      setOpenRubricModal(false);
      setErrors((prev: any) => ({ ...prev, rubrics: "" }));
    } else if (item.type !== "folder") {
      // File or prompt selected in the rubric picker — redirect it to module assets
      selectAsset(item);
      setOpenRubricModal(false);
    }
  }

  function removeRubric() {
    setSession((prev) => ({ ...prev, rubrics: [] }));
  }

  function removeAsset(id: string, type: string) {
    if (type === "file") {
      setSession((prev) => ({ ...prev, files: prev.files.filter((f) => f.id !== id) }));
      setOpenConfirmationModal({ id: "", type: "" });
    } else if (type === "prompt") {
      setSession((prev) => ({ ...prev, prompts: prev.prompts.filter((p) => p.id !== id) }));
      setOpenConfirmationModal({ id: "", type: "" });
    }
  }

  function promptToLibraryItem(p: PromptType): LibraryItem {
    return { itemId: p.id, name: p.name, type: "prompt", parentId: "", ownerId: "", organization: "", createdAt: 0, updatedAt: 0, metadata: { prompt: p.prompt } };
  }

  function fileToLibraryItem(f: FileType): LibraryItem {
    return { itemId: f.id, name: f.name, type: "file", parentId: "", ownerId: "", organization: "", createdAt: 0, updatedAt: 0, metadata: { hiddenMessageId: f.hiddenMessageId, fileReference: f.fileReference } };
  }

  function refreshList() { }

  const handleMenuItemClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>, index: number) => {
    if (index === 0) {
      handleSubmit(e, true, false);
    } else if (index === 1) {
      if (isEditMode && session.isPublished) {
        setOpenActiveModal(true);
      } else {
        handleSubmit(e, false, false);
      }
    } else if (index === 2) {
      setOpenDiscardModal(true);
    }
    setSelectedIndexSave(index);
    setOpenSaveTop(false);
    setOpenSaveBottom(false);
  };

  function handleSubmit(e: any, isPublished = false, isDeleted = false) {
    let hasError = false;
    if (!session.name) {
      setErrors((prev: any) => ({ ...prev, name: t("errorMessage.nameMissing") }));
      hasError = true;
    }
    if (!session.moduleDescription) {
      setErrors((prev: any) => ({ ...prev, moduleDescription: t("common.description") + " " + t("components.missing") }));
      hasError = true;
    }
    if (session.rubrics.length === 0) {
      setErrors((prev: any) => ({ ...prev, rubrics: t("reviewModule.rubricRequired") }));
      hasError = true;
    }
    if (hasError) return;

    setIsLoading(true);

    const dataToSend = {
      name: session.name,
      moduleDescription: session.moduleDescription,
      isRepeating: session.isRepeating,
      isPublished,
      showInitialPrompt: session.showInitialPrompt,
      prompts: session.prompts,
      files: session.files,
      showWizard: session.showWizard,
      isDeleted,
      isTemplate: session.isTemplate,
      id: session.id,
      webSearch: session.webSearch ? true : false,
      essaySubmission: session.essaySubmission ? true : false,
      moduleType: "review",
      assessmentType: session.assessmentType,
      gradingType: session.gradingType,
      converseAfterComplete: session.converseAfterComplete,
      maxDrafts: session.maxDrafts,
      rubrics: session.rubrics,
      showRubric: session.showRubric,
      isOralModule: session.isOralModule ? true : false,
    };

    if (isEditMode && actualModuleId) {
      Put(putUpdateModule(actualCourseId, actualModuleId), dataToSend).then((res) => {
        if (res.status && res.status < 300) {
          navigator(`/courses/${actualCourseId}/modules`);
          setAlert({ message: t("reviewModule.moduleUpdated"), type: "success" });
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          setErrors({ name: res.data, moduleDescription: res.data });
        }
        setIsLoading(false);
      });
    } else {
      Put(putCreateModule(actualCourseId), dataToSend).then((res) => {
        if (res && res.status && res.status < 300) {
          navigator(`/courses/${actualCourseId}/modules`);
          setAlert({ message: t("reviewModule.moduleCreated"), type: "success" });
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          setErrors({ name: res.data, moduleDescription: res.data });
        }
        setIsLoading(false);
      });
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
          <p className="text-muted-foreground">
            {isEditMode ? t("loadingMessage.reviewModule") : t("loadingMessage.reviewModuleCreationForm")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-background text-foreground p-4 space-y-6">
      {/* Assessment type change warning */}
      <DialogWrapper
        open={pendingAssessmentType !== null}
        onOpenChange={(open) => { if (!open) setPendingAssessmentType(null); }}
        title={t("reviewModule.assessmentTypeChangeTitle")}
        contentClassName="sm:max-w-lg"
        actions={[
          { label: t("common.cancel"), onClick: () => setPendingAssessmentType(null), variant: "outline" },
          {
            label: t("reviewModule.assessmentTypeConfirm"),
            onClick: () => {
              if (pendingAssessmentType) setSession((prev) => ({ ...prev, assessmentType: pendingAssessmentType }));
              setPendingAssessmentType(null);
            },
          },
        ]}
      >
        <div className="space-y-3 text-sm">
          {pendingAssessmentType === "summative" ? (
            <>
              <p className="font-semibold">{t("reviewModule.formativeToSummativeTitle")}</p>
              <p className="text-muted-foreground">{t("reviewModule.assessmentTypeChangeWarningIntro")}</p>
              <ul className="space-y-2 list-none">
                <li className="flex gap-2"><span className="text-green-600 shrink-0">✓</span><span>{t("reviewModule.formativeToSummativePoint1")}</span></li>
                <li className="flex gap-2"><span className="text-amber-600 shrink-0">⚠</span><span>{t("reviewModule.formativeToSummativePoint2")}</span></li>
                <li className="flex gap-2"><span className="text-amber-600 shrink-0">⚠</span><span>{t("reviewModule.formativeToSummativePoint3")}</span></li>
              </ul>
            </>
          ) : (
            <>
              <p className="font-semibold">{t("reviewModule.summativeToFormativeTitle")}</p>
              <p className="text-muted-foreground">{t("reviewModule.assessmentTypeChangeWarningIntro")}</p>
              <ul className="space-y-2 list-none">
                <li className="flex gap-2"><span className="text-amber-600 shrink-0">⚠</span><span>{t("reviewModule.summativeToFormativePoint1")}</span></li>
                <li className="flex gap-2"><span className="text-green-600 shrink-0">✓</span><span>{t("reviewModule.summativeToFormativePoint2")}</span></li>
                <li className="flex gap-2"><span className="text-green-600 shrink-0">✓</span><span>{t("reviewModule.summativeToFormativePoint3")}</span></li>
              </ul>
            </>
          )}
        </div>
      </DialogWrapper>

      {/* Discard modal */}
      <DialogWrapper
        open={openDiscardModal}
        onOpenChange={setOpenDiscardModal}
        title={t("createModule.discardChangesTitle")}
        description={t("createModule.discardChangesDescription")}
        actions={[
          { label: t("common.cancel"), onClick: () => setOpenDiscardModal(false), variant: "outline" },
          { label: t("components.discard"), onClick: () => navigator(-1), variant: "destructive" },
        ]}
      />

      {/* Info modal */}
      <DialogWrapper
        open={showSavePublishTooltip}
        onOpenChange={setShowSavePublishTooltip}
        title={t("createModule.whatIsSavePublish")}
        contentClassName="sm:max-w-md"
        actions={[{ label: t("components.gotIt"), onClick: () => setShowSavePublishTooltip(false) }]}
      >
        <p className="text-sm leading-6">{t("createModule.savePublishDescription")}</p>
      </DialogWrapper>

      {/* Edit-specific modals */}
      {isEditMode && (
        <>
          <DialogWrapper
            open={openDeleteModal}
            onOpenChange={setOpenDeleteModal}
            title={t("reviewModule.deleteModule")}
            description={t("reviewModule.deleteModuleDescription")}
            actions={[
              { label: t("common.cancel"), onClick: () => setOpenDeleteModal(false), variant: "outline" },
              { label: t("common.delete"), onClick: () => handleSubmit(null, false, true), variant: "destructive" },
            ]}
          />
          <DialogWrapper
            open={openActiveModal}
            onOpenChange={setOpenActiveModal}
            title={t("reviewModule.unpublishModule")}
            description={t("reviewModule.unpublishModuleDescription")}
            actions={[
              { label: t("common.cancel"), onClick: () => setOpenActiveModal(false), variant: "outline" },
              { label: t("common.continue"), onClick: () => handleSubmit(null, false, false) },
            ]}
          />
        </>
      )}

      {/* Asset library modal */}
      <DialogWrapper
        open={openAssetModal}
        onOpenChange={(open) => {
          if (!open) { setOpenAssetModal(false); setLibraryFolderId("root"); setLibraryTab("my"); }
        }}
        title={t("createModule.selectAsset")}
        contentClassName="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        actions={[{
          label: t("common.cancel"),
          onClick: () => { setOpenAssetModal(false); setLibraryFolderId("root"); setLibraryTab("my"); },
          variant: "outline",
        }]}
      >
        <div className="flex gap-1 border-b mb-4">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${libraryTab === "my" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            onClick={() => { setLibraryTab("my"); setLibraryFolderId("root"); }}
          >
            {t("library.myLibrary")}
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${libraryTab === "shared" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            onClick={() => { setLibraryTab("shared"); setLibraryFolderId("root"); }}
          >
            {t("library.sharedWithMe")}
          </button>
        </div>
        <ListFolders
          key={libraryTab}
          folderId={libraryFolderId}
          noShowMenu
          compactGrid
          onSelectItem={selectAsset}
          selectedItemIds={[...session.prompts.map((p) => p.id), ...session.files.map((f) => f.id)]}
          onFolderNavigate={libraryTab === "my" ? (folderId) => setLibraryFolderId(folderId) : undefined}
          shared={libraryTab === "shared"}
          excludeTypes={["rubric"]}
        />
      </DialogWrapper>

      {/* Rubric picker modal */}
      <DialogWrapper
        open={openRubricModal}
        onOpenChange={(open) => {
          if (!open) { setOpenRubricModal(false); setRubricFolderId("root"); setRubricTab("my"); }
        }}
        title={t("reviewModule.selectRubric")}
        contentClassName="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        actions={[{
          label: t("common.cancel"),
          onClick: () => { setOpenRubricModal(false); setRubricFolderId("root"); setRubricTab("my"); },
          variant: "outline",
        }]}
      >
        <div className="flex gap-1 border-b mb-4">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${rubricTab === "my" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            onClick={() => { setRubricTab("my"); setRubricFolderId("root"); }}
          >
            {t("library.myLibrary")}
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${rubricTab === "shared" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            onClick={() => { setRubricTab("shared"); setRubricFolderId("root"); }}
          >
            {t("library.sharedWithMe")}
          </button>
        </div>
        <ListFolders
          key={rubricTab}
          folderId={rubricFolderId}
          noShowMenu
          compactGrid
          onSelectItem={selectRubric}
          selectedItemIds={session.rubrics.map((r) => r.id)}
          onFolderNavigate={rubricTab === "my" ? (folderId) => setRubricFolderId(folderId) : undefined}
          shared={rubricTab === "shared"}
        />
      </DialogWrapper>

      {/* Remove asset confirmation */}
      <DialogWrapper
        open={openConfirmationModal.id !== ""}
        onOpenChange={(open) => !open && setOpenConfirmationModal({ id: "", type: "" })}
        title={t("createModule.removeAsset")}
        description={t("createModule.removeAssetDescription")}
        actions={[
          { label: t("common.cancel"), onClick: () => setOpenConfirmationModal({ id: "", type: "" }), variant: "outline" },
          { label: t("common.remove"), onClick: () => removeAsset(openConfirmationModal.id, openConfirmationModal.type), variant: "destructive" },
        ]}
      />

      {/* View rubric modal */}
      {session.rubrics[0] && (
        <DialogWrapper
          open={openViewRubricModal}
          onOpenChange={setOpenViewRubricModal}
          title={session.rubrics[0].name}
          contentClassName="sm:max-w-3xl max-h-[90vh] overflow-y-auto"
          actions={[{ label: t("common.close"), onClick: () => setOpenViewRubricModal(false), variant: "outline" }]}
        >
          {session.rubrics[0].criteria.length > 0 && session.rubrics[0].columns.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="text-left p-2 border bg-muted font-semibold">{t("reviewModule.criterion")}</th>
                    {session.rubrics[0].columns.map((col, i) => (
                      <th key={i} className="p-2 border bg-muted font-semibold text-center">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {session.rubrics[0].criteria.map((criterion, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                      <td className="p-2 border font-medium">{criterion.name}</td>
                      {criterion.cells.map((cell, j) => (
                        <td key={j} className="p-2 border text-muted-foreground text-xs align-top">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">{t("reviewModule.noRubricSelected")}</p>
          )}
        </DialogWrapper>
      )}

      {/* Header */}
      <header className="animate-in slide-in-from-bottom-4 duration-700">
        <div className="relative overflow-hidden bg-card border rounded-xl p-6 shadow-lg">
          <div className="absolute top-0 right-0 w-48 h-48 opacity-10" aria-hidden="true">
            <ClipboardCheck size={192} className="text-primary" />
          </div>
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-foreground leading-tight">
                  {isEditMode
                    ? t("reviewModule.editReviewModule", { moduleName: session.name || t("common.module") })
                    : t("reviewModule.createReviewModule")}
                </h1>
                {isEditMode && (
                  <div className="flex items-center gap-2">
                    {session.isPublished ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-white pointer-events-none">
                          {t("components.published")}
                        </Badge>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-gray-500" />
                        <Badge className="pointer-events-none" variant="secondary">{t("components.unpublished")}</Badge>
                      </>
                    )}
                  </div>
                )}
              </div>
              <nav className="flex flex-col md:flex-row gap-2">
                {isEditMode && (
                  <TooltipWrapper content={t("common.delete")}>
                    <Button variant="outline" size="sm" onClick={() => setOpenDeleteModal(true)} className="text-destructive hover:bg-destructive hover:text-destructive-foreground">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipWrapper>
                )}
                <TooltipWrapper content={t("common.info")}>
                  <Button variant="outline" size="sm" onClick={() => setShowSavePublishTooltip(true)}>
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipWrapper>
                <div className="flex rounded-lg border">
                  <Button
                    size="sm"
                    onClick={(e) => {
                      if (selectedIndexSave === 0) handleSubmit(e, true, false);
                      else if (selectedIndexSave === 1) {
                        if (isEditMode && session.isPublished) setOpenActiveModal(true);
                        else handleSubmit(e, false, false);
                      } else if (selectedIndexSave === 2) setOpenDiscardModal(true);
                    }}
                    className="rounded-none border-0 w-full rounded-l"
                    disabled={isLoading}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saveOptions[selectedIndexSave]}
                  </Button>
                  <DropdownWrapper
                    open={openSaveTop}
                    onOpenChange={setOpenSaveTop}
                    trigger={
                      <Button size="sm" className="rounded-none border-0 border-l px-2 rounded-r" variant="default" disabled={isLoading}>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    }
                    actions={saveOptions.map((option, index) => ({
                      label: option,
                      onClick: () => handleMenuItemClick({} as React.MouseEvent<HTMLDivElement, MouseEvent>, index),
                      className: cn(index === selectedIndexSave && "bg-primary/30", index === 2 && "text-destructive focus:bg-destructive focus:text-destructive-foreground"),
                    }))}
                    align="end"
                  />
                </div>
              </nav>
            </div>
            <InfoAccordion>
              <p className="text-muted-foreground max-w-2xl text-base leading-6">
                {t("reviewModule.reviewModuleDescription")}
              </p>
            </InfoAccordion>
          </div>
        </div>
      </header>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            {t("reviewModule.moduleInformation")}
          </CardTitle>
          <p className="text-muted-foreground text-sm">{t("createModule.enterModuleInfo")}. {t("common.required")}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">{t("createModule.moduleName")} *</Label>
            <Input
              id="name"
              name="name"
              placeholder={t("createModule.moduleNameHelptext")}
              value={session.name}
              onChange={handleChange}
              disabled={isLoading}
              className={cn(errors.name && "border-destructive")}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="moduleDescription">{t("createModule.moduleDescription")} *</Label>
            <Textarea
              id="moduleDescription"
              name="moduleDescription"
              placeholder={t("createModule.moduleDescriptionHelptext")}
              value={session.moduleDescription}
              onChange={handleChange}
              disabled={isLoading}
              className={cn(errors.moduleDescription && "border-destructive", "min-h-[100px]")}
            />
            {errors.moduleDescription && <p className="text-sm text-destructive">{errors.moduleDescription}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Rubric */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              {t("reviewModule.rubric")} *
            </CardTitle>
            {assetsLocked ? (
              <TooltipWrapper content={t("reviewModule.rubricLockedAfterPublish")}>
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  <Lock className="h-4 w-4" />
                  {t("reviewModule.rubricLockedAfterPublish")}
                </div>
              </TooltipWrapper>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenRubricModal(true)}
                className="gap-2"
              >
                {session.rubrics.length > 0 ? (
                  <>{t("reviewModule.changeRubric")}</>
                ) : (
                  <><Plus className="h-4 w-4" />{t("reviewModule.selectRubric")}</>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {errors.rubrics && <p className="text-sm text-destructive mb-2">{errors.rubrics}</p>}
          {session.rubrics.length === 0 ? (
            <div
              className={cn(
                "text-center py-10 text-muted-foreground bg-card border rounded-lg",
                !assetsLocked && "cursor-pointer hover:bg-muted/50 transition-colors"
              )}
              role={assetsLocked ? undefined : "button"}
              tabIndex={assetsLocked ? undefined : 0}
              onClick={assetsLocked ? undefined : () => setOpenRubricModal(true)}
              onKeyDown={assetsLocked ? undefined : (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpenRubricModal(true); } }}
            >
              <BookOpen className="mx-auto h-10 w-10 mb-3 opacity-50" />
              <p className="font-medium mb-1">{t("reviewModule.noRubricSelected")}</p>
              <p className="text-sm">{t("reviewModule.noRubricSelectedDescription")}</p>
            </div>
          ) : (
            <div
              className="border rounded-lg p-4 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setOpenViewRubricModal(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpenViewRubricModal(true); } }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span className="font-medium">{session.rubrics[0].name}</span>
                  {session.rubrics[0].criteria?.length > 0 && (
                    <Badge variant="secondary">{session.rubrics[0].criteria.length} {t("reviewModule.criterion")}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setOpenViewRubricModal(true); }} className="gap-1 text-xs">
                    <Eye className="h-4 w-4" />
                    {t("reviewModule.viewRubric")}
                  </Button>
                  {!assetsLocked && (
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); removeRubric(); }} className="text-destructive hover:bg-destructive hover:text-destructive-foreground">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assets (prompts + files) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {t("createModule.moduleAssets")}
            </CardTitle>
            {assetsLocked ? (
              <TooltipWrapper content={t("reviewModule.assetsLockedAfterPublish")}>
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  <Lock className="h-4 w-4" />
                  {t("reviewModule.assetsLockedAfterPublish")}
                </div>
              </TooltipWrapper>
            ) : (
              <Button type="button" variant="outline" onClick={() => setOpenAssetModal(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                {t("createModule.addAsset")}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {session.prompts.length < 1 && session.files.length < 1 ? (
            <div
              className={cn(
                "text-center py-10 text-muted-foreground bg-card border rounded-lg",
                !assetsLocked && "cursor-pointer hover:bg-muted/50 transition-colors"
              )}
              role={assetsLocked ? undefined : "button"}
              tabIndex={assetsLocked ? undefined : 0}
              onClick={assetsLocked ? undefined : () => setOpenAssetModal(true)}
              onKeyDown={assetsLocked ? undefined : (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpenAssetModal(true); } }}
            >
              <FileText className="mx-auto h-10 w-10 mb-3 opacity-50" />
              <p className="font-medium mb-1">{t("createModule.noAssetsAdded")}</p>
              <p className="text-sm">{t("createModule.noAssetsAddedDescription")}</p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {session.prompts.map((prompt, i) => (
                <Prompt
                  key={prompt.id}
                  item={promptToLibraryItem(prompt)}
                  keyy={`${i}`}
                  refreshList={refreshList}
                  loading={() => setIsLoading(true)}
                  noShowMenu
                  showRemove={!assetsLocked}
                  hideActions={assetsLocked}
                  onClick={(id, type) => !assetsLocked && setOpenConfirmationModal({ id, type })}
                  disableStarring
                />
              ))}
              {session.files.map((file, i) => (
                <File
                  key={file.id}
                  item={fileToLibraryItem(file)}
                  keyy={`${i}`}
                  refreshList={refreshList}
                  loading={() => setIsLoading(true)}
                  noShowMenu
                  showRemove={!assetsLocked}
                  hideActions={assetsLocked}
                  onClick={(id, type) => !assetsLocked && setOpenConfirmationModal({ id, type })}
                  disableStarring
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">{t("reviewModule.moduleSettings")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Assessment type */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">{t("reviewModule.assessmentType")}</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleAssessmentTypeClick("formative")}
                className={cn(
                  "border rounded-lg p-4 text-left transition-colors",
                  session.assessmentType === "formative" ? "border-primary bg-primary/10" : "border-border hover:bg-muted/50"
                )}
              >
                <p className="font-semibold">{t("reviewModule.formative")}</p>
                <p className="text-sm text-muted-foreground mt-1">{t("reviewModule.formativeHeader")}</p>
                <div className="mt-2 space-y-1">
                  <p className="text-xs"><span className="font-semibold">{t("reviewModule.immediateFeedback")}</span> — {t("reviewModule.immediateFeedbackDesc")}</p>
                  <p className="text-xs"><span className="font-semibold">{t("reviewModule.immediateScoring")}</span> — {t("reviewModule.immediateScoringDesc")}</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleAssessmentTypeClick("summative")}
                className={cn(
                  "border rounded-lg p-4 text-left transition-colors",
                  session.assessmentType === "summative" ? "border-primary bg-primary/10" : "border-border hover:bg-muted/50"
                )}
              >
                <p className="font-semibold">{t("reviewModule.summative")}</p>
                <p className="text-sm text-muted-foreground mt-1">{t("reviewModule.summativeHeader")}</p>
                <div className="mt-2 space-y-1">
                  <p className="text-xs"><span className="font-semibold">{t("reviewModule.reviewFeedback")}</span> — {t("reviewModule.reviewFeedbackDesc")}</p>
                  <p className="text-xs"><span className="font-semibold">{t("reviewModule.reviewScoring")}</span> — {t("reviewModule.reviewScoringDesc")}</p>
                </div>
              </button>
            </div>
          </div>

          {/* Limit attempts (formative only) */}
          {session.assessmentType === "formative" && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="limitAttempts"
                      checked={session.maxDrafts !== 999}
                      onCheckedChange={(checked) => setSession((prev) => ({ ...prev, maxDrafts: checked ? 3 : 999 }))}
                    />
                    <Label htmlFor="limitAttempts" className="text-md font-bold">{t("reviewModule.limitAttempts")}</Label>
                  </div>
                  <p className="text-sm text-muted-foreground ml-6">{t("reviewModule.limitAttemptsDescription")}</p>
                </div>
                {session.maxDrafts !== 999 && (
                  <div className="ml-6 flex items-center gap-3">
                    <Label htmlFor="maxDrafts" className="text-sm shrink-0">{t("reviewModule.maxDrafts")}</Label>
                    <Select
                      value={String(session.maxDrafts)}
                      onValueChange={(val) => setSession((prev) => ({ ...prev, maxDrafts: Number(val) }))}
                    >
                      <SelectTrigger id="maxDrafts" className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                          <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </>
          )}

          <Separator />

          {/* Essay submission toggle */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="essaySubmission"
                checked={session.essaySubmission}
                onCheckedChange={(checked) => setSession((prev) => ({ ...prev, essaySubmission: checked as boolean }))}
              />
              <Label htmlFor="essaySubmission" className="text-md font-bold">
                {t("reviewModule.essaySubmission")}
              </Label>
            </div>
            <p className="text-sm text-muted-foreground ml-6">{t("reviewModule.essaySubmissionDescription")}</p>
          </div>

          {/* Show embedded prompt */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showInitialPrompt"
                checked={session.showInitialPrompt}
                onCheckedChange={(checked) => setSession((prev) => ({ ...prev, showInitialPrompt: checked as boolean }))}
              />
              <Label htmlFor="showInitialPrompt" className="text-md font-bold">
                {t("createModule.showEmbeddedPrompt")}
              </Label>
            </div>
            <p className="text-sm text-muted-foreground ml-6">
              {t("createModule.showEmbeddedPromptDescription")}{" "}
              <a
                href="https://docs.google.com/document/d/1o3He0CdgV7hJOX65gc3Gpf3_Fr3GYvSm4Q-i-Y5cNHQ/edit?tab=t.0#heading=h.9og8mgqg1ofk"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2 hover:no-underline text-primary dark:text-gold colorful-dark:text-gold font-medium"
              >
                {t("createModule.showEmbeddedPromptDescriptionLinkText")}
              </a>
              .
            </p>
          </div>

          {/* Converse after complete */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="converseAfterComplete"
                checked={session.converseAfterComplete}
                onCheckedChange={(checked) => setSession((prev) => ({ ...prev, converseAfterComplete: checked as boolean }))}
              />
              <Label htmlFor="converseAfterComplete" className="text-md font-bold">
                {t("reviewModule.converseAfterComplete")}
              </Label>
            </div>
            <p className="text-sm text-muted-foreground ml-6">{t("reviewModule.converseAfterCompleteDescription")}</p>
          </div>

          {/* Show rubric to students */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showRubric"
                checked={session.showRubric}
                onCheckedChange={(checked) => setSession((prev) => ({ ...prev, showRubric: checked as boolean }))}
              />
              <Label htmlFor="showRubric" className="text-md font-bold">{t("reviewModule.showRubric")}</Label>
            </div>
            <p className="text-sm text-muted-foreground ml-6">{t("reviewModule.showRubricDescription")}</p>
          </div>

          {/* Web search */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="webSearch"
                checked={session.webSearch}
                onCheckedChange={(checked) => setSession((prev) => ({ ...prev, webSearch: checked as boolean }))}
              />
              <Label htmlFor="webSearch" className="text-md font-bold">{t("createModule.allowWebSearch")}</Label>
            </div>
            <p className="text-sm text-muted-foreground ml-6">{t("createModule.allowWebSearchDescription")}</p>
          </div>

          {/* Oral Module */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isOralModule"
                checked={session.isOralModule}
                onCheckedChange={(checked) => setSession((prev) => ({ ...prev, isOralModule: checked as boolean }))}
                disabled={isLoading}
              />
              <Label htmlFor="isOralModule" className="text-md font-bold">
                {t("createModule.enableOralModule")}
              </Label>
            </div>
            <p className="text-sm text-muted-foreground ml-6">
              {t("createModule.oralModuleDescription")}
            </p>
          </div>
        </CardContent>
      </Card>



      {/* Bottom actions */}
      <section className="pt-4">
        <nav className="flex flex-col md:flex-row md:items-center md:justify-end gap-2">
          {isEditMode && (
            <Button type="button" variant="outline" size="sm" onClick={() => setOpenDeleteModal(true)} className="text-destructive hover:bg-destructive hover:text-destructive-foreground">
              <Trash2 className="h-4 w-4 mr-1" />
              {t("common.delete")}
            </Button>
          )}
          <Button type="button" variant="outline" size="sm" onClick={() => setShowSavePublishTooltip(true)}>
            <Info className="h-4 w-4 mr-1" />
            {t("common.info")}
          </Button>
          <div className="flex rounded-lg border">
            <Button
              type="button"
              size="sm"
              onClick={(e) => {
                if (selectedIndexSave === 0) handleSubmit(e, true, false);
                else if (selectedIndexSave === 1) {
                  if (isEditMode && session.isPublished) setOpenActiveModal(true);
                  else handleSubmit(e, false, false);
                } else if (selectedIndexSave === 2) setOpenDiscardModal(true);
              }}
              className="rounded-none border-0 w-full rounded-l"
              disabled={isLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              {saveOptions[selectedIndexSave]}
            </Button>
            <DropdownWrapper
              open={openSaveBottom}
              onOpenChange={setOpenSaveBottom}
              trigger={
                <Button type="button" size="sm" className="rounded-none border-0 border-l px-2 rounded-r" variant="default" disabled={isLoading}>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              }
              actions={saveOptions.map((option, index) => ({
                label: option,
                onClick: () => handleMenuItemClick({} as React.MouseEvent<HTMLDivElement, MouseEvent>, index),
                className: cn(index === selectedIndexSave && "bg-primary/30", index === 2 && "text-destructive focus:bg-destructive focus:text-destructive-foreground"),
              }))}
              align="end"
            />
          </div>
        </nav>
      </section>
    </main>
  );
}
