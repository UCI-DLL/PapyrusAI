import React, { useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Checkbox } from "../../components/ui/checkbox";
import { DialogWrapper } from "../../components/ui-wrappers/DialogWrapper";
import { DropdownWrapper } from "../../components/ui-wrappers/DropdownWrapper";
import { TooltipWrapper } from "../../components/ui-wrappers/TooltipWrapper";
import { InfoAccordion } from "../../components/ui-wrappers/InfoAccordion";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileUp,
  LayoutGrid,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { RubricCriterion, RubricRating } from "../../utility/types/CourseTypes";
import { AlertContext } from "../../utility/context/AlertContext";
import { UserContext } from "../../utility/context/UserContext";
import Get from "../../utility/Get";
import Post from "../../utility/Post";
import Patch from "../../utility/Patch";
import Delete from "../../utility/Delete";
import {
  getItem,
  postCreateItem,
  patchUpdateItem,
  deleteItem,
  postParseRubricFile,
} from "../../utility/endpoints/ItemEndpoints";
import { logEvent } from "../../utility/endpoints/UserEndpoints";
import { cn } from "../../lib/utils";
import { useTranslation } from "../../hooks/useTranslation";

// ── Local types (maxPoints nullable so PDF-parsed zeros can be forced empty) ──

type LocalRating = Omit<RubricRating, "maxPoints"> & {
  maxPoints: number | null;
  _key: string;
};

type LocalCriterion = Omit<RubricCriterion, "ratings" | "maxPoints"> & {
  maxPoints: number | null;
  ratings: LocalRating[];
  _key: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRating(
  name = "",
  description = "",
  maxPoints: number | null = 0,
): LocalRating {
  return {
    id: crypto.randomUUID(),
    name,
    description,
    maxPoints,
    _key: crypto.randomUUID(),
  };
}

function makeCriterion(): LocalCriterion {
  return {
    id: crypto.randomUUID(),
    name: "",
    description: "",
    maxPoints: 10,
    useRange: false,
    ratings: [makeRating("Full Marks", "", 10), makeRating("No Marks", "", 0)],
    _key: crypto.randomUUID(),
  };
}

/** Max of all non-null rating points; null when all are null. */
function deriveMax(ratings: LocalRating[]): number | null {
  const nonNull = ratings
    .map((r) => r.maxPoints)
    .filter((p): p is number => p !== null);
  return nonNull.length > 0 ? Math.max(...nonNull) : null;
}


function migrateOldCriteria(meta: Record<string, any>): LocalCriterion[] {
  const cols: string[] = meta.columns ?? [];
  return (meta.criteria ?? []).map((c: any) => {
    const ratings: LocalRating[] = cols
      .map((col, i) => makeRating(col, c.cells?.[i] ?? "", Number(col) || 0))
      .sort((a, b) => (b.maxPoints ?? 0) - (a.maxPoints ?? 0));
    return {
      id: crypto.randomUUID(),
      name: c.name ?? "",
      description: "",
      maxPoints: deriveMax(ratings),
      useRange: false,
      ratings,
      _key: crypto.randomUUID(),
    };
  });
}

function loadCriteria(
  criteriaData: any[],
  treatZeroAsEmpty = false,
): LocalCriterion[] {
  const parsePoints = (v: any): number | null => {
    const n = Number(v);
    if (isNaN(n)) return null;
    if (treatZeroAsEmpty && n === 0) return null;
    return n;
  };

  return criteriaData.map((c: any) => {
    const ratings: LocalRating[] = (c.ratings ?? []).map((r: any) => ({
      id: r.id ?? crypto.randomUUID(),
      name: r.name ?? "",
      description: r.description ?? "",
      maxPoints: parsePoints(r.maxPoints),
      _key: crypto.randomUUID(),
    }));
    const maxPoints = parsePoints(c.maxPoints) ?? deriveMax(ratings);
    return {
      id: c.id ?? crypto.randomUUID(),
      name: c.name ?? "",
      description: c.description ?? "",
      maxPoints,
      useRange: c.useRange ?? false,
      ratings,
      _key: crypto.randomUUID(),
    };
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CreateRubric(): JSX.Element {
  const location = useLocation();
  const navigator = useNavigate();
  const { setAlert } = useContext(AlertContext);
  const { user } = useContext(UserContext);
  const { t } = useTranslation();

  const isEditMode = !location.pathname.includes("/createrubric");
  const rubricId = isEditMode ? location.pathname.split("/")[3] : undefined;

  const [folderId, setFolderId] = useState<string>(
    isEditMode ? "" : location.pathname.split("/")[2],
  );
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [criteria, setCriteria] = useState<LocalCriterion[]>([makeCriterion()]);

  const [nameError, setNameError] = useState("");
  const [isLoading, setIsLoading] = useState<boolean>(isEditMode);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [selectedIndexSave, setSelectedIndexSave] = useState(0);
  const [openDiscardModal, setOpenDiscardModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteCriterionIdx, setDeleteCriterionIdx] = useState<number | null>(null);
  const [openSaveTop, setOpenSaveTop] = useState(false);
  const [openSaveBottom, setOpenSaveBottom] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalPoints = criteria.reduce((sum, c) => sum + (c.maxPoints ?? 0), 0);

  // Derived validation — reactive: clears automatically as user fixes issues
  const emptyCriterionNameKeys = showValidation
    ? new Set(criteria.filter((c) => !c.name.trim()).map((c) => c._key))
    : new Set<string>();
  const outOfOrderRatingKeys = showValidation
    ? new Set(
      criteria.flatMap((c) =>
        c.ratings
          .filter((r, i) => i > 0 && (r.maxPoints ?? 0) > (c.ratings[i - 1].maxPoints ?? 0))
          .map((r) => r._key),
      ),
    )
    : new Set<string>();
  const criterionHasError = (c: LocalCriterion) =>
    emptyCriterionNameKeys.has(c._key) ||
    c.ratings.some((r) => outOfOrderRatingKeys.has(r._key));
  const saveOptions = [
    t("createPrompt.savePublish"),
    t("createPrompt.discardChanges"),
  ];

  // ── Load ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    Post(logEvent(), {
      eventType: "view_page",
      metadata: { isEditMode, folderId, rubricId, page: "create_rubric" },
    });

    if (isEditMode && rubricId) {
      const controller = new AbortController();
      Get(getItem(rubricId), controller.signal, true).then((res) => {
        if (res && res.status && res.status < 300 && res.data) {
          const meta = res.data.metadata ?? {};
          setName(res.data.name ?? "");
          setDescription(res.data.description ?? meta.description ?? "");
          setFolderId(res.data.parentId ?? "");
          if (meta.columns?.length && !meta.criteria?.[0]?.ratings) {
            setCriteria(migrateOldCriteria(meta));
          } else if (meta.criteria?.length) {
            setCriteria(loadCriteria(meta.criteria));
          }
          setIsLoading(false);
        } else if (res && res.status === 401) {
          navigator("/login");
        } else if (res !== undefined) {
          setAlert({ message: t("createRubric.rubricNotFound"), type: "error" });
        }
      });
      return () => controller.abort();
    }
    // eslint-disable-next-line
  }, [location.pathname]);

  // ── Criteria mutations ────────────────────────────────────────────────────

  function addCriterion() {
    setCriteria((prev) => [...prev, makeCriterion()]);
  }

  function removeCriterion(idx: number) {
    if (criteria.length <= 1) return;
    setCriteria((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateCriterionField<K extends keyof LocalCriterion>(
    idx: number,
    field: K,
    value: LocalCriterion[K],
  ) {
    setCriteria((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)),
    );
  }

  /**
   * Bidirectional sync: editing the criterion's total pts also pushes the new
   * value to ratings[0] (which should always be the highest-valued rating).
   */
  function handleCriterionMaxPointsChange(
    criterionIdx: number,
    value: number | null,
  ) {
    setCriteria((prev) =>
      prev.map((c, i) => {
        if (i !== criterionIdx) return c;
        if (value === null) return { ...c, maxPoints: null };
        const ratings =
          c.ratings.length > 0
            ? [{ ...c.ratings[0], maxPoints: value }, ...c.ratings.slice(1)]
            : c.ratings;
        return { ...c, maxPoints: value, ratings };
      }),
    );
  }

  // ── Rating mutations ──────────────────────────────────────────────────────

  function addRating(criterionIdx: number) {
    setCriteria((prev) =>
      prev.map((c, i) =>
        i === criterionIdx
          ? { ...c, ratings: [...c.ratings, makeRating()] }
          : c,
      ),
    );
  }

  function removeRating(criterionIdx: number, ratingIdx: number) {
    setCriteria((prev) =>
      prev.map((c, i) => {
        if (i !== criterionIdx) return c;
        const ratings = c.ratings.filter((_, j) => j !== ratingIdx);
        return { ...c, ratings, maxPoints: deriveMax(ratings) };
      }),
    );
  }

  function updateRatingField<K extends keyof LocalRating>(
    criterionIdx: number,
    ratingIdx: number,
    field: K,
    value: LocalRating[K],
  ) {
    setCriteria((prev) =>
      prev.map((c, i) => {
        if (i !== criterionIdx) return c;
        const ratings = c.ratings.map((r, j) =>
          j === ratingIdx ? { ...r, [field]: value } : r,
        );
        // Bidirectional: editing any rating's pts recalculates criterion max
        const maxPoints =
          field === "maxPoints" ? deriveMax(ratings) : c.maxPoints;
        return { ...c, ratings, maxPoints };
      }),
    );
  }

  function moveRating(
    criterionIdx: number,
    ratingIdx: number,
    direction: "left" | "right",
  ) {
    setCriteria((prev) =>
      prev.map((c, i) => {
        if (i !== criterionIdx) return c;
        const ratings = [...c.ratings];
        const target =
          direction === "left" ? ratingIdx - 1 : ratingIdx + 1;
        if (target < 0 || target >= ratings.length) return c;
        [ratings[ratingIdx], ratings[target]] = [
          ratings[target],
          ratings[ratingIdx],
        ];
        return { ...c, ratings };
      }),
    );
  }

  // ── PDF import ────────────────────────────────────────────────────────────

  async function handlePdfImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfLoading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) =>
          resolve((ev.target?.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await Post(
        postParseRubricFile(),
        { fileData: base64, fileName: file.name },
        true,
      );

      if (res && res.status && res.status < 300 && res.data) {
        const rubric = res.data;
        if (rubric.name) setName(rubric.name);
        if (rubric.description) setDescription(rubric.description);
        if (rubric.criteria?.length)
          // treatZeroAsEmpty=true: force instructor to confirm any 0-pt values
          setCriteria(loadCriteria(rubric.criteria, true));
        setAlert({ message: t("createRubric.pdfImportSuccess"), type: "success" });
      } else if (res?.status === 403) {
        setAlert({ message: t("createRubric.pdfImportUnauthorized"), type: "error" });
      } else {
        setAlert({
          message: res?.data?.message || t("createRubric.pdfImportFailed"),
          type: "error",
        });
      }
    } catch {
      setAlert({ message: t("createRubric.pdfImportFailed"), type: "error" });
    } finally {
      setPdfLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // ── Save / delete ─────────────────────────────────────────────────────────

  function handleSave() {
    setShowValidation(true);

    const missingName = !name.trim();
    const missingCriterionName = criteria.some((c) => !c.name.trim());
    const missingPoints = criteria.some(
      (c) => c.maxPoints === null || c.ratings.some((r) => r.maxPoints === null),
    );
    const hasOutOfOrder = criteria.some((c) =>
      c.ratings.some(
        (r, i) => i > 0 && (r.maxPoints ?? 0) > (c.ratings[i - 1].maxPoints ?? 0),
      ),
    );

    if (missingName) setNameError(t("errorMessage.nameMissing"));
    else setNameError("");

    if (missingName || missingCriterionName || missingPoints || hasOutOfOrder) {
      const parts: string[] = [];
      if (missingName || missingCriterionName) parts.push(t("createRubric.errorNames"));
      if (missingPoints) parts.push(t("createRubric.missingPointValues"));
      if (hasOutOfOrder) parts.push(t("createRubric.ratingsOutOfOrder"));
      setAlert({ message: parts.join(" "), type: "error" });
      return;
    }

    setIsLoading(true);

    const cleanCriteria = criteria.map(({ _key, ratings, ...c }) => ({
      ...c,
      maxPoints: c.maxPoints as number,
      ratings: ratings.map(({ _key: _rk, ...r }) => ({
        ...r,
        maxPoints: r.maxPoints as number,
      })),
    }));
    const metadata = { criteria: cleanCriteria };

    if (isEditMode && rubricId) {
      Patch(
        patchUpdateItem(rubricId),
        { name, description, metadata },
        true,
      ).then((res) => {
        if (res.status && res.status < 300) {
          setAlert({ message: t("createRubric.rubricSaved"), type: "success" });
          navigator(`/library/${folderId}`);
        } else if (res?.status === 401) {
          navigator("/login");
        } else {
          setAlert({
            message:
              res?.data?.message || t("createRubric.rubricCouldNotBeSaved"),
            type: "error",
          });
        }
        setIsLoading(false);
      });
    } else {
      Post(
        postCreateItem(),
        { type: "rubric", parentId: folderId, name, description, metadata },
        true,
      ).then((res) => {
        if (res.status && res.status < 300) {
          setAlert({ message: t("createRubric.rubricSaved"), type: "success" });
        } else if (res && res.status === 401) {
          navigator("/login");
          return;
        } else {
          setAlert({
            message: t("createRubric.rubricCouldNotBeSaved"),
            type: "error",
          });
        }
        navigator(`/library/${folderId}`);
      });
    }
  }

  function handleDelete() {
    if (!rubricId) return;
    setIsLoading(true);
    Delete(deleteItem(rubricId), true).then((res) => {
      if (res.status && res.status < 300) {
        setAlert({ message: t("createRubric.rubricDeleted"), type: "success" });
      } else if (res && res.status === 401) {
        navigator("/login");
        return;
      } else {
        setAlert({
          message: t("createRubric.rubricCouldNotBeDeleted"),
          type: "error",
        });
      }
      navigator(`/library/${folderId}`);
      setIsLoading(false);
    });
  }

  function handleMenuItemClick(index: number) {
    if (index === 0) handleSave();
    else if (index === 1) setOpenDiscardModal(true);
    setSelectedIndexSave(index);
    setOpenSaveTop(false);
    setOpenSaveBottom(false);
  }

  function handleSaveClick() {
    if (selectedIndexSave === 0) handleSave();
    else if (selectedIndexSave === 1) setOpenDiscardModal(true);
  }

  // ── Shared save button group ──────────────────────────────────────────────

  function SaveButtonGroup({
    open,
    onOpenChange,
  }: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
  }) {
    return (
      <div className="flex rounded-lg border">
        <Button
          size="sm"
          onClick={handleSaveClick}
          className="rounded-none border-0 w-full rounded-l"
          disabled={isLoading || pdfLoading}
        >
          {saveOptions[selectedIndexSave]}
        </Button>
        <DropdownWrapper
          open={open}
          onOpenChange={onOpenChange}
          trigger={
            <Button
              size="sm"
              className="rounded-none border-0 border-l px-2 rounded-r"
              variant="default"
              disabled={isLoading || pdfLoading}
              aria-label={t("library.selectStrategy")}
            >
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </Button>
          }
          actions={saveOptions.map((option, index) => ({
            label: option,
            onClick: () => handleMenuItemClick(index),
            className: cn(
              index === selectedIndexSave && "bg-primary/30",
              index === 1 &&
              "text-destructive focus:bg-destructive focus:text-destructive-foreground",
            ),
          }))}
          align="end"
        />
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────

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
            {t("loadingMessage.rubricCreationForm")}
          </p>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="bg-background text-foreground p-4 space-y-6">
      {/* Hidden PDF file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={handlePdfImport}
        aria-label={t("createRubric.importFromPdf")}
      />

      {/* Dialogs */}
      <DialogWrapper
        open={openDiscardModal}
        onOpenChange={setOpenDiscardModal}
        title={t("createPrompt.discardChangesTitle")}
        description={t("createPrompt.discardChangesDescription")}
        contentClassName="sm:max-w-md"
        actions={[
          {
            label: t("common.cancel"),
            onClick: () => setOpenDiscardModal(false),
            variant: "outline",
            disabled: isLoading,
          },
          {
            label: t("createPrompt.discardChanges"),
            onClick: () => navigator(-1),
            variant: "destructive",
            disabled: isLoading,
          },
        ]}
      />

      {/* Criterion delete confirmation */}
      <DialogWrapper
        open={deleteCriterionIdx !== null}
        onOpenChange={(open) => { if (!open) setDeleteCriterionIdx(null); }}
        title={t("createRubric.deleteCriterionTitle")}
        description={
          deleteCriterionIdx !== null
            ? `"${criteria[deleteCriterionIdx]?.name || t("createRubric.unnamedCriterion")}" ${t("createRubric.deleteCriterionMessage")}`
            : ""
        }
        contentClassName="sm:max-w-md"
        actions={[
          { label: t("common.cancel"), onClick: () => setDeleteCriterionIdx(null), variant: "outline" },
          {
            label: t("common.delete"),
            onClick: () => {
              if (deleteCriterionIdx !== null) removeCriterion(deleteCriterionIdx);
              setDeleteCriterionIdx(null);
            },
            variant: "destructive",
          },
        ]}
      />

      {isEditMode && (
        <DialogWrapper
          open={openDeleteModal}
          onOpenChange={setOpenDeleteModal}
          title={t("createRubric.deleteRubric")}
          description={`"${name || "This rubric"}" ${t("createRubric.deleteRubricMessage")}`}
          contentClassName="sm:max-w-md"
          actions={[
            {
              label: t("common.cancel"),
              onClick: () => setOpenDeleteModal(false),
              variant: "outline",
              disabled: isLoading,
            },
            {
              label: t("common.delete"),
              onClick: handleDelete,
              variant: "destructive",
              disabled: isLoading,
            },
          ]}
        />
      )}

      {/* Page header */}
      <header className="animate-in slide-in-from-bottom-4 duration-700">
        <div className="relative overflow-hidden bg-card border rounded-xl p-6 shadow-lg">
          <div
            className="absolute top-0 right-0 w-48 h-48 opacity-10"
            aria-hidden="true"
          >
            <LayoutGrid size={192} className="text-primary" />
          </div>
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-foreground leading-tight">
                  {isEditMode
                    ? t("createRubric.editRubric")
                    : t("createRubric.createRubric")}
                </h1>
                <span className="inline-flex items-center rounded-full bg-primary/10 text-primary text-sm font-medium px-3 py-1">
                  {totalPoints} {t("createRubric.totalPoints")}
                </span>
              </div>
              <nav
                className="flex flex-col md:flex-row gap-2"
                aria-label="Rubric actions"
              >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={pdfLoading || isLoading}
                  className="gap-2"
                >
                  {pdfLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileUp className="h-4 w-4" />
                  )}
                  {t("createRubric.importFromPdf")}
                </Button>
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
                <SaveButtonGroup
                  open={openSaveTop}
                  onOpenChange={setOpenSaveTop}
                />
              </nav>
            </div>
            <InfoAccordion>
              <p className="text-muted-foreground max-w-2xl text-base leading-6">
                {t("createRubric.createRubricDescription")}
              </p>
            </InfoAccordion>
          </div>
        </div>
      </header>

      <section aria-labelledby="rubric-info-heading">
        {/* Rubric name & description */}
        <Card
          className="transition-all duration-300 hover:shadow-md mb-6"
          id="rubric-info-heading"
        >
          <CardHeader>
            <h2 className="text-2xl font-bold text-foreground">
              {t("createRubric.rubricInformation")}
            </h2>
            <p className="text-muted-foreground text-sm">
              {t("createRubric.enterRubricDetails")}. {t("common.required")}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rubric-name" className="text-sm font-medium">
                {t("createRubric.rubricName")} *
              </Label>
              <Input
                id="rubric-name"
                placeholder={t("createRubric.rubricNameHelptext")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                required
                className={
                  nameError
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }
                aria-describedby={nameError ? "name-error" : undefined}
              />
              {nameError && (
                <p
                  id="name-error"
                  className="text-sm text-destructive"
                  role="alert"
                  aria-live="assertive"
                >
                  {nameError}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="rubric-description"
                className="text-sm font-medium"
              >
                {t("createRubric.rubricDescription")}
              </Label>
              <Textarea
                id="rubric-description"
                placeholder={t("createRubric.rubricDescriptionHelptext")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                rows={2}
                className="resize-y"
              />
            </div>
          </CardContent>
        </Card>

        {/* Criteria list */}
        <div
          className="space-y-4"
          role="list"
          aria-label={t("createRubric.criterion")}
        >
          {criteria.map((criterion, criterionIdx) => (
            <Card
              key={criterion._key}
              className={cn(
                "transition-all duration-300 hover:shadow-md border-l-4",
                criterionHasError(criterion)
                  ? "border-l-destructive border-destructive"
                  : "border-l-primary",
              )}
              role="listitem"
            >
              {/* ── Criterion header ── */}
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-3">
                  {/* Numbered label */}
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                      {criterionIdx + 1}
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {t("createRubric.criterion")} {criterionIdx + 1}
                    </span>
                  </div>
                  {/* Row 1: name + description + pts + delete */}
                  <div className="flex flex-col md:flex-row md:items-end gap-3">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                          {t("createRubric.criterion")}
                        </Label>
                        <Input
                          value={criterion.name}
                          onChange={(e) =>
                            updateCriterionField(
                              criterionIdx,
                              "name",
                              e.target.value,
                            )
                          }
                          placeholder={t(
                            "createRubric.criterionNamePlaceholder",
                          )}
                          disabled={isLoading}
                          className={cn(
                            emptyCriterionNameKeys.has(criterion._key) &&
                            "border-destructive focus-visible:ring-destructive",
                          )}
                          aria-label={`Criterion ${criterionIdx + 1} name`}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                          {t("createRubric.rubricDescription")}
                        </Label>
                        <Input
                          value={criterion.description}
                          onChange={(e) =>
                            updateCriterionField(
                              criterionIdx,
                              "description",
                              e.target.value,
                            )
                          }
                          placeholder={t(
                            "createRubric.criterionDescriptionPlaceholder",
                          )}
                          disabled={isLoading}
                          aria-label={`Criterion ${criterionIdx + 1} description`}
                        />
                      </div>
                    </div>

                    {/* Pts input (editable, bidirectional with ratings[0]) */}
                    <div className="flex items-end gap-2 flex-shrink-0">
                      <div className="flex flex-col items-center gap-1">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                          {t("createRubric.pts")}
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          value={
                            criterion.maxPoints === null
                              ? ""
                              : criterion.maxPoints
                          }
                          onChange={(e) =>
                            handleCriterionMaxPointsChange(
                              criterionIdx,
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                            )
                          }
                          disabled={isLoading}
                          className={cn(
                            "h-9 w-20 text-center text-sm font-semibold",
                            criterion.maxPoints === null &&
                            "border-destructive focus-visible:ring-destructive",
                          )}
                          aria-label={`Criterion ${criterionIdx + 1} total points`}
                        />
                      </div>

                      {criteria.length > 1 && (
                        <TooltipWrapper
                          content={t("createRubric.removeCriterion")}
                        >
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteCriterionIdx(criterionIdx)}
                            disabled={isLoading}
                            aria-label={`Remove criterion ${criterionIdx + 1}`}
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipWrapper>
                      )}
                    </div>
                  </div>

                  {/* Row 2: useRange toggle */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`useRange-${criterion._key}`}
                      checked={criterion.useRange}
                      onCheckedChange={(checked) =>
                        updateCriterionField(
                          criterionIdx,
                          "useRange",
                          !!checked,
                        )
                      }
                      disabled={isLoading}
                    />
                    <Label
                      htmlFor={`useRange-${criterion._key}`}
                      className="text-sm text-muted-foreground cursor-pointer select-none"
                    >
                      {t("createRubric.useRange")}
                    </Label>
                  </div>
                </div>
              </CardHeader>

              {/* ── Ratings grid ── */}
              <CardContent>
                <div
                  className="grid gap-3"
                  style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}
                >
                  {criterion.ratings.map((rating, ratingIdx) => (
                    <div
                      key={rating._key}
                      className="border border-border rounded-lg p-3 space-y-2 bg-muted/20 hover:bg-muted/30 transition-colors"
                    >
                      {/* Rating name */}
                      <Input
                        value={rating.name}
                        onChange={(e) =>
                          updateRatingField(
                            criterionIdx,
                            ratingIdx,
                            "name",
                            e.target.value,
                          )
                        }
                        placeholder={t("createRubric.ratingNamePlaceholder")}
                        disabled={isLoading}
                        className="h-8 text-sm font-semibold"
                        aria-label={`Criterion ${criterionIdx + 1} rating ${ratingIdx + 1} name`}
                      />

                      {/* Points — single input or X – Y range display */}
                      {criterion.useRange ? (
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="number"
                            min={0}
                            value={rating.maxPoints === null ? "" : rating.maxPoints}
                            onChange={(e) =>
                              updateRatingField(
                                criterionIdx,
                                ratingIdx,
                                "maxPoints",
                                e.target.value === "" ? null : Number(e.target.value),
                              )
                            }
                            disabled={isLoading}
                            placeholder="—"
                            className={cn(
                              "h-8 text-sm text-center",
                              (rating.maxPoints === null || outOfOrderRatingKeys.has(rating._key)) &&
                              "border-destructive focus-visible:ring-destructive",
                            )}
                            aria-label={`Criterion ${criterionIdx + 1} rating ${ratingIdx + 1} upper bound`}
                          />
                          <span className="text-muted-foreground text-sm font-medium shrink-0">–</span>
                          <div className={cn(
                            "h-8 flex items-center justify-center px-2 rounded-md border bg-muted text-sm text-muted-foreground shrink-0 min-w-[2.5rem]",
                          )}>
                            {ratingIdx < criterion.ratings.length - 1
                              ? (criterion.ratings[ratingIdx + 1].maxPoints ?? 0) + 1
                              : 0}
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">pts</span>
                        </div>
                      ) : (
                        <Input
                          type="number"
                          min={0}
                          value={rating.maxPoints === null ? "" : rating.maxPoints}
                          onChange={(e) =>
                            updateRatingField(
                              criterionIdx,
                              ratingIdx,
                              "maxPoints",
                              e.target.value === "" ? null : Number(e.target.value),
                            )
                          }
                          disabled={isLoading}
                          placeholder={t("createRubric.ptsPlaceholder")}
                          className={cn(
                            "h-8 text-sm",
                            (rating.maxPoints === null || outOfOrderRatingKeys.has(rating._key)) &&
                            "border-destructive focus-visible:ring-destructive",
                          )}
                          aria-label={`Criterion ${criterionIdx + 1} rating ${ratingIdx + 1} points`}
                        />
                      )}

                      {/* Description */}
                      <Textarea
                        value={rating.description}
                        onChange={(e) =>
                          updateRatingField(
                            criterionIdx,
                            ratingIdx,
                            "description",
                            e.target.value,
                          )
                        }
                        placeholder={t(
                          "createRubric.ratingDescriptionPlaceholder",
                        )}
                        disabled={isLoading}
                        rows={3}
                        className="text-xs resize-y"
                        aria-label={`Criterion ${criterionIdx + 1} rating ${ratingIdx + 1} description`}
                      />

                      {/* Rating actions: move left/right + delete */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex gap-1">
                          <TooltipWrapper content={t("common.moveLeft")}>
                            <button
                              type="button"
                              onClick={() =>
                                moveRating(criterionIdx, ratingIdx, "left")
                              }
                              disabled={ratingIdx === 0 || isLoading}
                              className="text-muted-foreground hover:text-foreground disabled:opacity-30 rounded p-0.5"
                              aria-label={`Move rating ${ratingIdx + 1} left`}
                            >
                              <ChevronLeft className="h-3.5 w-3.5" />
                            </button>
                          </TooltipWrapper>
                          <TooltipWrapper content={t("common.moveRight")}>
                            <button
                              type="button"
                              onClick={() =>
                                moveRating(criterionIdx, ratingIdx, "right")
                              }
                              disabled={
                                ratingIdx === criterion.ratings.length - 1 ||
                                isLoading
                              }
                              className="text-muted-foreground hover:text-foreground disabled:opacity-30 rounded p-0.5"
                              aria-label={`Move rating ${ratingIdx + 1} right`}
                            >
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          </TooltipWrapper>
                        </div>
                        {criterion.ratings.length > 1 && (
                          <TooltipWrapper content={t("common.delete")}>
                            <button
                              type="button"
                              onClick={() =>
                                removeRating(criterionIdx, ratingIdx)
                              }
                              disabled={isLoading}
                              className="text-muted-foreground hover:text-destructive rounded p-0.5"
                              aria-label={`Remove rating ${ratingIdx + 1} from criterion ${criterionIdx + 1}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </TooltipWrapper>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add rating */}
                <button
                  type="button"
                  onClick={() => addRating(criterionIdx)}
                  disabled={isLoading}
                  className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/40 py-2.5 text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label={t("createRubric.addRating")}
                >
                  <Plus className="h-4 w-4" />
                  {t("createRubric.addRating")}
                </button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add criterion */}
        <button
          type="button"
          onClick={addCriterion}
          disabled={isLoading}
          className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 py-4 text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label={t("createRubric.addCriterion")}
        >
          <Plus className="h-5 w-5" />
          {t("createRubric.addCriterion")}
        </button>

        {/* Bottom save actions */}
        <section aria-label="Rubric bottom actions" className="pt-6">
          <nav className="flex flex-col md:flex-row md:items-center md:justify-end gap-2">
            {isEditMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpenDeleteModal(true)}
                disabled={isLoading}
                aria-label={t("common.delete")}
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="h-4 w-4 mr-1" aria-hidden="true" />
                {t("common.delete")}
              </Button>
            )}
            <SaveButtonGroup
              open={openSaveBottom}
              onOpenChange={setOpenSaveBottom}
            />
          </nav>
        </section>
      </section>
    </main>
  );
}
