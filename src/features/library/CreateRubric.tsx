import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { DialogWrapper } from "../../components/ui-wrappers/DialogWrapper";
import { DropdownWrapper } from "../../components/ui-wrappers/DropdownWrapper";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { ChevronDown, Loader2, Plus, Trash2, X } from "lucide-react";
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

const DEFAULT_COLUMNS = ["0", "1", "2", "3"];

export default function CreateRubric(): JSX.Element {
  const location = useLocation();
  const navigator = useNavigate();
  const { setAlert } = useContext(AlertContext);
  const { user } = useContext(UserContext);

  const isEditMode = !location.pathname.includes("/createrubric");
  const folderId = location.pathname.split("/")[2];
  const rubricId = isEditMode ? location.pathname.split("/")[4] : undefined;

  const [name, setName] = useState("");
  const [columns, setColumns] = useState<string[]>([...DEFAULT_COLUMNS]);
  const [columnKeys, setColumnKeys] = useState<string[]>(
    DEFAULT_COLUMNS.map(() => crypto.randomUUID()),
  );
  const [criteria, setCriteria] = useState<Array<RubricCriterion & { _key: string }>>([
    { name: "", cells: DEFAULT_COLUMNS.map(() => ""), _key: crypto.randomUUID() },
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(isEditMode);
  const [openDiscardModal, setOpenDiscardModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

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
          setAlert({ message: "Rubric not found.", type: "error" });
          navigator(`/library/${folderId}`);
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
      setAlert({ message: "Rubric name is required.", type: "error" });
      return;
    }
    setIsLoading(true);
    const cleanCriteria = criteria.map(({ _key, ...c }) => c);
    const metadata = { columns, criteria: cleanCriteria, createdBy: user?.username };

    if (isEditMode && rubricId) {
      Patch(patchUpdateItem(rubricId), { name, metadata }, true).then((res) => {
        if (res.status && res.status < 300) {
          setAlert({ message: "Rubric saved.", type: "success" });
        } else if (res && res.status === 401) {
          navigator("/login");
          return;
        } else {
          setAlert({ message: "Could not save rubric.", type: "error" });
        }
        navigator(`/library/${folderId}`);
        setIsLoading(false);
      });
    } else {
      Post(postCreateItem(), {
        type: "rubric",
        parentId: folderId,
        name,
        metadata,
      }, true).then((res) => {
        if (res.status && res.status < 300) {
          setAlert({ message: "Rubric saved.", type: "success" });
        } else if (res && res.status === 401) {
          navigator("/login");
          return;
        } else {
          setAlert({ message: "Could not save rubric.", type: "error" });
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
        setAlert({ message: "Rubric deleted.", type: "success" });
      } else if (res && res.status === 401) {
        navigator("/login");
        return;
      } else {
        setAlert({ message: "Could not delete rubric.", type: "error" });
      }
      navigator(`/library/${folderId}`);
      setIsLoading(false);
    });
  }

  // --- Render ---

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
          <p className="text-muted-foreground">Loading rubric…</p>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-background text-foreground min-h-screen">
      <div className="mx-auto px-4 sm:px-6 py-8 max-w-6xl">
        <DialogWrapper
          open={openDiscardModal}
          onOpenChange={setOpenDiscardModal}
          title="Discard Changes"
          description="All unsaved changes will be lost."
          contentClassName="sm:max-w-md"
          actions={[
            { label: "Keep Editing", onClick: () => setOpenDiscardModal(false), variant: "outline" },
            { label: "Discard", onClick: () => navigator(-1), variant: "destructive" },
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
              { label: "Cancel", onClick: () => setOpenDeleteModal(false), variant: "outline" },
              { label: "Delete", onClick: handleDelete, variant: "destructive" },
            ]}
          />
        )}

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
                    { label: "Discard Changes", onClick: () => setOpenDiscardModal(true) },
                  ]}
                  align="end"
                />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="overflow-x-auto flex-1">
                <table
                  className="w-full border-collapse"
                  style={{ minWidth: `${140 + columns.length * 160}px` }}
                >
                  <thead>
                    <tr>
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
                          style={{ position: "sticky", left: 0, zIndex: 10, background: "hsl(var(--muted) / 0.5)", minWidth: 140 }}
                        >
                          <div className="flex items-center gap-1">
                            <input
                              className="bg-transparent font-semibold text-sm outline-none flex-1 px-1 py-0.5 min-w-0"
                              value={criterion.name}
                              onChange={(e) => updateCriterionName(rowIdx, e.target.value)}
                              placeholder="Criterion name…"
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

            <Button variant="outline" onClick={addCriterion} className="mt-4 border-dashed">
              <Plus className="h-4 w-4 mr-2" />
              Add Criterion
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
