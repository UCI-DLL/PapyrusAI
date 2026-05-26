import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Checkbox } from "../../components/ui/checkbox";
import { DialogWrapper } from "../../components/ui-wrappers/DialogWrapper";
import { DropdownWrapper } from "../../components/ui-wrappers/DropdownWrapper";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { ChevronDown, Plus, Trash2, X } from "lucide-react";
import Get from "../../utility/Get";
import { TagType, RubricType, RubricCriterion } from "../../utility/types/CourseTypes";
import { AlertContext } from "../../utility/context/AlertContext";
import { cn } from "../../lib/utils";
import { getTagList } from "../../utility/endpoints/TagsEndpoints";

type RubricFormMode = "create" | "edit";

interface RubricFormProps {
  mode?: RubricFormMode;
  orgFolder?: boolean;
  folderId?: string;
  rubricId?: string;
}

const DEFAULT_COLUMNS = ["0", "1", "2", "3"];

export default function CreateRubric({
  mode = "create",
  orgFolder = false,
  folderId,
  rubricId,
}: RubricFormProps = {}): JSX.Element {
  const location = useLocation();
  const navigator = useNavigate();
  const { setAlert } = useContext(AlertContext);

  const isEditMode = mode === "edit" || !location.pathname.includes("/createrubric");
  const isOrgFolder = orgFolder || location.pathname.split("/")[2] === "org";
  const actualFolderId =
    folderId ||
    (isOrgFolder
      ? location.pathname.split("/")[3]
      : location.pathname.split("/")[2]);
  const actualRubricId = isEditMode
    ? rubricId ||
      (isOrgFolder
        ? location.pathname.split("/")[5]
        : location.pathname.split("/")[4])
    : undefined;

  const [name, setName] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [columns, setColumns] = useState<string[]>([...DEFAULT_COLUMNS]);
  const [columnKeys, setColumnKeys] = useState<string[]>(
    DEFAULT_COLUMNS.map(() => crypto.randomUUID())
  );
  const [criteria, setCriteria] = useState<Array<RubricCriterion & { _key: string }>>([
    { name: "", cells: DEFAULT_COLUMNS.map(() => ""), _key: crypto.randomUUID() },
  ]);
  const [tagList, setTagList] = useState<TagType[]>([]);
  const [openDiscardModal, setOpenDiscardModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    getTags("", controller.signal);
    if (isEditMode && actualRubricId) {
      loadRubric(actualFolderId, actualRubricId);
    }
    return () => controller.abort();
    // eslint-disable-next-line
  }, []);

  function getTags(startKey: string, signal: AbortSignal) {
    const limit = 20;
    Get(getTagList(limit, startKey), signal).then((res) => {
      if (res && res.status && res.status < 300) {
        if (res.data && res.data.tags && res.data.ScannedCount !== undefined) {
          setTagList((prev) => [...prev, ...res.data.tags]);
          if (
            res.data.ScannedCount > 0 &&
            res.data.ScannedCount >= limit &&
            res.data.LastEvaluatedKey &&
            res.data.LastEvaluatedKey.id
          ) {
            getTags(res.data.LastEvaluatedKey.id, signal);
          }
        }
      }
    });
  }

  function loadRubric(folderId: string, rubricId: string) {
    const key = `rubrics_${folderId}`;
    const stored = localStorage.getItem(key);
    if (!stored) return;
    try {
      const rubrics: RubricType[] = JSON.parse(stored);
      const rubric = rubrics.find((r) => r.id === rubricId);
      if (rubric) {
        setName(rubric.name);
        setTags(rubric.tags);
        setColumns(rubric.columns);
        setColumnKeys(rubric.columns.map(() => crypto.randomUUID()));
        setCriteria(rubric.criteria.map((c) => ({ ...c, _key: crypto.randomUUID() })));
      }
    } catch {
      // corrupt localStorage entry — ignore
    }
  }

  // --- Grid mutations ---

  function addColumn() {
    const newLabel = String(columns.length);
    setColumns((prev) => [...prev, newLabel]);
    setColumnKeys((prev) => [...prev, crypto.randomUUID()]);
    setCriteria((prev) =>
      prev.map((c) => ({ ...c, cells: [...c.cells, ""] }))
    );
  }

  function removeColumn(colIndex: number) {
    if (columns.length <= 1) return;
    setColumns((prev) => prev.filter((_, i) => i !== colIndex));
    setColumnKeys((prev) => prev.filter((_, i) => i !== colIndex));
    setCriteria((prev) =>
      prev.map((c) => ({
        ...c,
        cells: c.cells.filter((_, i) => i !== colIndex),
      }))
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
      prev.map((c, i) => (i === rowIndex ? { ...c, name: value } : c))
    );
  }

  function updateCell(rowIndex: number, colIndex: number, value: string) {
    setCriteria((prev) =>
      prev.map((c, i) =>
        i === rowIndex
          ? {
              ...c,
              cells: c.cells.map((cell, j) => (j === colIndex ? value : cell)),
            }
          : c
      )
    );
  }

  function toggleTag(tagId: string) {
    setTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  }

  // --- Persistence ---

  function buildRubric(): RubricType {
    return {
      id:
        isEditMode && actualRubricId
          ? actualRubricId
          : String(Date.now()) +
            String(Math.floor(100000 + Math.random() * 900000)),
      creator: {} as any,
      isDeleted: false,
      name,
      tags,
      isOrganizationRubric: isOrgFolder,
      folderId: actualFolderId,
      columns,
      criteria: criteria.map(({ _key, ...c }) => c),
    };
  }

  function handleSave() {
    if (!name.trim()) {
      setAlert({ message: "Rubric name is required.", type: "error" });
      return;
    }
    const rubric = buildRubric();
    const key = `rubrics_${actualFolderId}`;
    const existing: RubricType[] = JSON.parse(
      localStorage.getItem(key) || "[]"
    );
    const updated = isEditMode
      ? existing.map((r) => (r.id === rubric.id ? rubric : r))
      : [...existing, rubric];
    localStorage.setItem(key, JSON.stringify(updated));
    console.log("Rubric JSON:", JSON.stringify(rubric, null, 2));
    setAlert({ message: "Rubric saved.", type: "success" });
    navigator(
      isOrgFolder ? `/library/org/${actualFolderId}` : `/library/${actualFolderId}`
    );
  }

  function handleDelete() {
    if (!actualRubricId) return;
    const key = `rubrics_${actualFolderId}`;
    const existing: RubricType[] = JSON.parse(
      localStorage.getItem(key) || "[]"
    );
    localStorage.setItem(
      key,
      JSON.stringify(existing.filter((r) => r.id !== actualRubricId))
    );
    setAlert({ message: "Rubric deleted.", type: "success" });
    navigator(
      isOrgFolder ? `/library/org/${actualFolderId}` : `/library/${actualFolderId}`
    );
  }

  // --- Render ---

  return (
    <main className="bg-background text-foreground min-h-screen">
      <div className="mx-auto px-4 sm:px-6 py-8 max-w-6xl">
        {/* Dialogs */}
        <DialogWrapper
          open={openDiscardModal}
          onOpenChange={setOpenDiscardModal}
          title="Discard Changes"
          description="All unsaved changes will be lost."
          contentClassName="sm:max-w-md"
          actions={[
            {
              label: "Keep Editing",
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

        {isEditMode && (
          <DialogWrapper
            open={openDeleteModal}
            onOpenChange={setOpenDeleteModal}
            title="Delete Rubric"
            description={`"${name || "This rubric"}" will be permanently deleted.`}
            contentClassName="sm:max-w-md"
            actions={[
              {
                label: "Cancel",
                onClick: () => setOpenDeleteModal(false),
                variant: "outline",
              },
              {
                label: "Delete",
                onClick: handleDelete,
                variant: "destructive",
              },
            ]}
          />
        )}

        {/* Header card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex-1">
                <input
                  className="text-2xl font-bold bg-transparent border-b-2 border-transparent focus:border-primary outline-none w-full"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Rubric name..."
                  aria-label="Rubric name"
                />
              </CardTitle>
              <div className="flex gap-2 flex-shrink-0">
                {isEditMode && (
                  <Button
                    variant="outline"
                    className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => setOpenDeleteModal(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
                <DropdownWrapper
                  trigger={
                    <Button className="flex items-center gap-2">
                      Save Rubric
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  }
                  actions={[
                    { label: "Save Rubric", onClick: handleSave },
                    {
                      label: "Discard Changes",
                      onClick: () => setOpenDiscardModal(true),
                    },
                  ]}
                  align="end"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Label className="mb-2 block text-sm font-medium">Tags</Label>
            <div className="flex flex-wrap gap-2">
              {tagList.map((tag) => (
                <label
                  key={tag.id}
                  className={cn(
                    "flex items-center gap-1.5 cursor-pointer px-3 py-1 rounded-full border text-sm transition-colors",
                    tags.includes(tag.id)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:bg-muted"
                  )}
                >
                  <Checkbox
                    checked={tags.includes(tag.id)}
                    onCheckedChange={() => toggleTag(tag.id)}
                    className="hidden"
                    aria-hidden="true"
                  />
                  {tag.id}
                </label>
              ))}
              {tagList.length === 0 && (
                <span className="text-sm text-muted-foreground">
                  No tags available
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Grid card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              {/* Scrollable table */}
              <div className="overflow-x-auto flex-1">
                <table className="w-full border-collapse" style={{ minWidth: `${140 + columns.length * 160}px` }}>
                  <thead>
                    <tr>
                      {/* Sticky criterion header */}
                      <th
                        className="border border-border bg-muted px-3 py-2 text-left text-sm font-semibold"
                        style={{ minWidth: 140, position: "sticky", left: 0, zIndex: 10, background: "hsl(var(--muted))" }}
                      >
                        Criterion
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
                              onChange={(e) =>
                                updateColumnLabel(colIdx, e.target.value)
                              }
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
                        {/* Sticky criterion name cell */}
                        <td
                          className="border border-border px-2 py-1 align-top"
                          style={{ position: "sticky", left: 0, zIndex: 10, background: "hsl(var(--muted) / 0.5)", minWidth: 140 }}
                        >
                          <div className="flex items-center gap-1">
                            <input
                              className="bg-transparent font-semibold text-sm outline-none flex-1 focus:bg-accent focus:rounded px-1 py-0.5 min-w-0"
                              value={criterion.name}
                              onChange={(e) =>
                                updateCriterionName(rowIdx, e.target.value)
                              }
                              placeholder="Criterion name…"
                              aria-label={`Criterion ${rowIdx + 1} name`}
                            />
                            {criteria.length > 1 && (
                              <button
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
                          <td
                            key={columnKeys[colIdx]}
                            className="border border-border p-0 align-top"
                          >
                            <textarea
                              className="w-full min-h-[80px] bg-transparent text-sm p-2 outline-none resize-none focus:bg-accent/30 placeholder:text-muted-foreground/50 font-sans"
                              value={cell}
                              onChange={(e) =>
                                updateCell(rowIdx, colIdx, e.target.value)
                              }
                              placeholder={`Describe "${columns[colIdx]}"…`}
                              aria-label={`${criterion.name || `Criterion ${rowIdx + 1}`} score ${columns[colIdx]}`}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add column button — stays outside the scroll area */}
              <Button
                variant="outline"
                size="sm"
                onClick={addColumn}
                className="flex-shrink-0 mt-1"
                aria-label="Add column"
              >
                <Plus className="h-4 w-4 mr-1" />
                Col
              </Button>
            </div>

            <Button
              variant="outline"
              onClick={addCriterion}
              className="mt-4 border-dashed"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Criterion
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
