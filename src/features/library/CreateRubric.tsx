import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { DialogWrapper } from "../../components/ui-wrappers/DialogWrapper";
import { DropdownWrapper } from "../../components/ui-wrappers/DropdownWrapper";
import { TooltipWrapper } from "../../components/ui-wrappers/TooltipWrapper";
import { InfoAccordion } from "../../components/ui-wrappers/InfoAccordion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { ChevronDown, LayoutGrid, Loader2, Plus, Trash2, X } from "lucide-react";
import { RubricCriterion } from "../../utility/types/CourseTypes";
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
} from "../../utility/endpoints/ItemEndpoints";
import { logEvent } from "../../utility/endpoints/UserEndpoints";
import { cn } from "../../lib/utils";
import { useTranslation } from "../../hooks/useTranslation";

const DEFAULT_COLUMNS = ["0", "1", "2", "3"];

export default function CreateRubric(): JSX.Element {
  const location = useLocation();
  const navigator = useNavigate();
  const { setAlert } = useContext(AlertContext);
  const { user } = useContext(UserContext);
  const { t } = useTranslation();

  const isEditMode = !location.pathname.includes("/createrubric");
  const rubricId = isEditMode ? location.pathname.split("/")[3] : undefined;

  const [folderId, setFolderId] = useState<string>(isEditMode ? "" : location.pathname.split("/")[2]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [columns, setColumns] = useState<string[]>([...DEFAULT_COLUMNS]);
  const [columnKeys, setColumnKeys] = useState<string[]>(
    DEFAULT_COLUMNS.map(() => crypto.randomUUID()),
  );
  const [criteria, setCriteria] = useState<Array<RubricCriterion & { _key: string }>>([
    { name: "", cells: DEFAULT_COLUMNS.map(() => ""), _key: crypto.randomUUID() },
  ]);
  const [nameError, setNameError] = useState("");
  const [isLoading, setIsLoading] = useState<boolean>(isEditMode);
  const [selectedIndexSave, setSelectedIndexSave] = useState(0);
  const [openDiscardModal, setOpenDiscardModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openSaveTop, setOpenSaveTop] = useState(false);
  const [openSaveBottom, setOpenSaveBottom] = useState(false);

  const saveOptions = [
    t("createPrompt.savePublish"),
    t("createPrompt.discardChanges"),
  ];

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
          setName(res.data.name);
          setDescription(res.data.description ?? "");
          setFolderId(res.data.parentId ?? "");
          if (meta.columns?.length) {
            setColumns(meta.columns);
            setColumnKeys(meta.columns.map(() => crypto.randomUUID()));
          }
          if (meta.criteria?.length) {
            setCriteria(meta.criteria.map((c: RubricCriterion) => ({ ...c, _key: crypto.randomUUID() })));
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

  // --- Grid mutations ---

  function addColumn() {
    const newLabel = String(columns.length);
    setColumns((prev) => [...prev, newLabel]);
    setColumnKeys((prev) => [...prev, crypto.randomUUID()]);
    setCriteria((prev) => prev.map((c) => ({ ...c, cells: [...c.cells, ""] })));
  }

  function removeColumn(colIndex: number) {
    if (columns.length <= 1) return;
    setColumns((prev) => prev.filter((_, i) => i !== colIndex));
    setColumnKeys((prev) => prev.filter((_, i) => i !== colIndex));
    setCriteria((prev) =>
      prev.map((c) => ({ ...c, cells: c.cells.filter((_, i) => i !== colIndex) })),
    );
  }

  function updateColumnLabel(colIndex: number, value: string) {
    setColumns((prev) => prev.map((col, i) => (i === colIndex ? value : col)));
  }

  function addCriterion() {
    setCriteria((prev) => [
      ...prev,
      { name: "", cells: columns.map(() => ""), _key: crypto.randomUUID() },
    ]);
  }

  function removeCriterion(rowIndex: number) {
    if (criteria.length <= 1) return;
    setCriteria((prev) => prev.filter((_, i) => i !== rowIndex));
  }

  function updateCriterionName(rowIndex: number, value: string) {
    setCriteria((prev) =>
      prev.map((c, i) => (i === rowIndex ? { ...c, name: value } : c)),
    );
  }

  function updateCell(rowIndex: number, colIndex: number, value: string) {
    setCriteria((prev) =>
      prev.map((c, i) =>
        i === rowIndex
          ? { ...c, cells: c.cells.map((cell, j) => (j === colIndex ? value : cell)) }
          : c,
      ),
    );
  }

  // --- Persistence ---

  function handleSave() {
    if (!name.trim()) {
      setNameError(t("errorMessage.nameMissing"));
      return;
    }
    setNameError("");
    setIsLoading(true);
    const cleanCriteria = criteria.map(({ _key, ...c }) => c);
    const metadata = { columns, criteria: cleanCriteria, createdBy: user?.username };

    if (isEditMode && rubricId) {
      Patch(patchUpdateItem(rubricId), { name, description, metadata }, true).then((res) => {
        if (res.status && res.status < 300) {
          setAlert({ message: t("createRubric.rubricSaved"), type: "success" });
          navigator(`/library/${folderId}`);
        } else if (res?.status === 401) {
          navigator("/login");
        } else {
          setAlert({ message: res?.data?.message || t("createRubric.rubricCouldNotBeSaved"), type: "error" });
        }
        setIsLoading(false);
      });
    } else {
      Post(postCreateItem(), {
        type: "rubric",
        parentId: folderId,
        name,
        description,
        metadata,
      }, true).then((res) => {
        if (res.status && res.status < 300) {
          setAlert({ message: t("createRubric.rubricSaved"), type: "success" });
        } else if (res && res.status === 401) {
          navigator("/login");
          return;
        } else {
          setAlert({ message: t("createRubric.rubricCouldNotBeSaved"), type: "error" });
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
        setAlert({ message: t("createRubric.rubricCouldNotBeDeleted"), type: "error" });
      }
      navigator(`/library/${folderId}`);
      setIsLoading(false);
    });
  }

  const handleMenuItemClick = (index: number) => {
    if (index === 0) {
      handleSave();
    } else if (index === 1) {
      setOpenDiscardModal(true);
    }
    setSelectedIndexSave(index);
    setOpenSaveTop(false);
    setOpenSaveBottom(false);
  };

  function handleSaveClick() {
    if (selectedIndexSave === 0) {
      handleSave();
    } else if (selectedIndexSave === 1) {
      setOpenDiscardModal(true);
    }
  }

  // --- Render ---

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
          <p className="text-muted-foreground">{t("loadingMessage.rubricCreationForm")}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-background text-foreground p-4 space-y-6">
      {/* Dialogs */}
      <DialogWrapper
        open={openDiscardModal}
        onOpenChange={setOpenDiscardModal}
        title={t("createPrompt.discardChangesTitle")}
        description={t("createPrompt.discardChangesDescription")}
        contentClassName="sm:max-w-md"
        actions={[
          { label: t("common.cancel"), onClick: () => setOpenDiscardModal(false), variant: "outline", disabled: isLoading },
          { label: t("createPrompt.discardChanges"), onClick: () => navigator(-1), variant: "destructive", disabled: isLoading },
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
            { label: t("common.cancel"), onClick: () => setOpenDeleteModal(false), variant: "outline", disabled: isLoading },
            { label: t("common.delete"), onClick: handleDelete, variant: "destructive", disabled: isLoading },
          ]}
        />
      )}

      {/* Page header */}
      <header className="animate-in slide-in-from-bottom-4 duration-700">
        <div className="relative overflow-hidden bg-card border rounded-xl p-6 shadow-lg">
          <div className="absolute top-0 right-0 w-48 h-48 opacity-10" aria-hidden="true">
            <LayoutGrid size={192} className="text-primary" />
          </div>
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
              <h1 className="text-4xl font-bold mb-2 text-foreground leading-tight">
                {isEditMode ? t("createRubric.editRubric") : t("createRubric.createRubric")}
              </h1>
              <nav className="flex flex-col md:flex-row gap-2" aria-label="Rubric actions">
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
                <div className="flex rounded-lg border">
                  <Button
                    size="sm"
                    onClick={handleSaveClick}
                    className="rounded-none border-0 w-full rounded-l"
                    disabled={isLoading}
                  >
                    {saveOptions[selectedIndexSave]}
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
                    actions={saveOptions.map((option, index) => ({
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
                {t("createRubric.createRubricDescription")}
              </p>
            </InfoAccordion>
          </div>
        </div>
      </header>

      <section aria-labelledby="rubric-info-heading">
        {/* Name & description card */}
        <Card className="transition-all duration-300 hover:shadow-md mb-6" id="rubric-info-heading">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-foreground">
              {t("createRubric.rubricInformation")}
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              {t("createRubric.enterRubricDetails")}. {t("common.required")}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
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
                  className={nameError ? "border-destructive focus-visible:ring-destructive" : ""}
                  aria-describedby={nameError ? "name-error" : undefined}
                />
                {nameError && (
                  <p id="name-error" className="text-sm text-destructive" role="alert" aria-live="assertive">
                    {nameError}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="rubric-description" className="text-sm font-medium">
                  {t("createRubric.rubricDescription")}
                </Label>
                <Input
                  id="rubric-description"
                  placeholder={t("createRubric.rubricDescriptionHelptext")}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rubric grid card */}
        <Card className="transition-all duration-300 hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-foreground">
              {t("createRubric.rubricGrid")}
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              {t("createRubric.rubricGridDescription")}
            </p>
          </CardHeader>
          <CardContent>
            {/* Mobile layout: stacked cards per criterion */}
            <div className="md:hidden space-y-4">
              {criteria.map((criterion, rowIdx) => (
                <div key={criterion._key} className="border border-border rounded-lg p-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      className="bg-transparent font-semibold text-sm outline-none flex-1 min-w-0 border-b border-border focus:border-primary px-1 py-0.5"
                      value={criterion.name}
                      onChange={(e) => updateCriterionName(rowIdx, e.target.value)}
                      placeholder={t("createRubric.criterionNamePlaceholder")}
                      aria-label={`Criterion ${rowIdx + 1} name`}
                    />
                    {criteria.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCriterion(rowIdx)}
                        className="text-muted-foreground hover:text-destructive rounded p-0.5 flex-shrink-0"
                        aria-label={`Remove criterion row ${rowIdx + 1}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {criterion.cells.map((cell, colIdx) => (
                      <div key={columnKeys[colIdx]}>
                        <div className="flex items-center gap-1 mb-1">
                          <input
                            className="bg-transparent text-xs font-semibold outline-none w-20 focus:bg-accent focus:rounded px-1 text-muted-foreground"
                            value={columns[colIdx]}
                            onChange={(e) => updateColumnLabel(colIdx, e.target.value)}
                            aria-label={`Column ${colIdx + 1} label`}
                          />
                          {columns.length > 1 && rowIdx === 0 && (
                            <button
                              onClick={() => removeColumn(colIdx)}
                              className="text-muted-foreground hover:text-destructive rounded p-0.5"
                              aria-label={`Remove column ${columns[colIdx]}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                        <textarea
                          className="w-full min-h-[64px] bg-muted/30 border border-border rounded text-sm p-2 outline-none resize-none focus:bg-accent/30 placeholder:text-muted-foreground/50 font-sans"
                          value={cell}
                          onChange={(e) => updateCell(rowIdx, colIdx, e.target.value)}
                          placeholder={`${t("createRubric.describe")} "${columns[colIdx]}"…`}
                          aria-label={`${criterion.name || `Criterion ${rowIdx + 1}`} score ${columns[colIdx]}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" onClick={addCriterion}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("createRubric.addCriterion")}
                </Button>
                <Button variant="outline" size="sm" onClick={addColumn}>
                  <Plus className="h-4 w-4 mr-1" />
                  {t("createRubric.addScoreLevel")}
                </Button>
              </div>
            </div>

            {/* Desktop layout: scrollable table */}
            <div className="hidden md:block">
              <div className="flex items-start gap-3">
                <div className="overflow-x-auto flex-1">
                  <table
                    className="w-full border-collapse"
                    style={{ minWidth: `${140 + columns.length * 160}px` }}
                  >
                    <thead>
                      <tr>
                        <th
                          className="border border-border bg-muted px-3 py-2 text-left text-sm font-semibold capitalize"
                          style={{ minWidth: 140, position: "sticky", left: 0, zIndex: 10, background: "hsl(var(--muted))" }}
                        >
                          {t("createRubric.criterion")}
                        </th>
                        {columns.map((col, colIdx) => (
                          <th
                            key={columnKeys[colIdx]}
                            className="border border-border bg-muted px-2 py-2 text-center text-sm"
                            style={{ minWidth: 160 }}
                          >
                            <div className="flex items-center justify-center gap-1">
                              <input
                                className="bg-transparent text-center font-semibold outline-none w-16 focus:bg-accent focus:rounded px-1"
                                value={col}
                                onChange={(e) => updateColumnLabel(colIdx, e.target.value)}
                                aria-label={`Column ${colIdx + 1} label`}
                              />
                              {columns.length > 1 && (
                                <button
                                  onClick={() => removeColumn(colIdx)}
                                  className="text-muted-foreground hover:text-destructive rounded p-0.5"
                                  aria-label={`Remove column ${col}`}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {criteria.map((criterion, rowIdx) => (
                        <tr key={criterion._key}>
                          <td
                            className="border border-border px-2 py-1 align-top"
                            style={{ position: "sticky", left: 0, zIndex: 10, background: "hsl(var(--muted))", minWidth: 140 }}
                          >
                            <div className="flex items-center gap-1">
                              <input
                                className="bg-transparent font-semibold text-sm outline-none flex-1 px-1 py-0.5 min-w-0"
                                value={criterion.name}
                                onChange={(e) => updateCriterionName(rowIdx, e.target.value)}
                                placeholder={t("createRubric.criterionNamePlaceholder")}
                                aria-label={`Criterion ${rowIdx + 1} name`}
                              />
                              {criteria.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeCriterion(rowIdx)}
                                  className="text-muted-foreground hover:text-destructive rounded p-0.5 flex-shrink-0"
                                  aria-label={`Remove criterion row ${rowIdx + 1}`}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </td>
                          {criterion.cells.map((cell, colIdx) => (
                            <td key={columnKeys[colIdx]} className="border border-border p-0 align-top">
                              <textarea
                                className="w-full min-h-[80px] bg-transparent text-sm p-2 outline-none resize-none focus:bg-accent/30 placeholder:text-muted-foreground/50 font-sans"
                                value={cell}
                                onChange={(e) => updateCell(rowIdx, colIdx, e.target.value)}
                                placeholder={`${t("createRubric.describe")} "${columns[colIdx]}"…`}
                                aria-label={`${criterion.name || `Criterion ${rowIdx + 1}`} score ${columns[colIdx]}`}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={addColumn}
                  className="flex-shrink-0 mt-1"
                  aria-label="Add column"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t("createRubric.addColumn")}
                </Button>
              </div>

              <Button variant="outline" onClick={addCriterion} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                {t("createRubric.addCriterion")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bottom actions */}
        <section aria-label="Rubric bottom actions" className="pt-4">
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
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                {t("common.delete")}
              </Button>
            )}
            <div className="flex rounded-lg border">
              <Button
                size="sm"
                onClick={handleSaveClick}
                className="rounded-none border-0 w-full rounded-l"
                disabled={isLoading}
              >
                {saveOptions[selectedIndexSave]}
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
                actions={saveOptions.map((option, index) => ({
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
  );
}
