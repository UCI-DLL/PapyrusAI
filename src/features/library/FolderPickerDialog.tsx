import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { DialogWrapper } from "../../components/ui-wrappers/DialogWrapper";
import { TooltipWrapper } from "../../components/ui-wrappers/TooltipWrapper";
import { LibraryItem } from "../../utility/types/CourseTypes";
import Get from "../../utility/Get";
import { getItems } from "../../utility/endpoints/ItemEndpoints";
import { ChevronRight, Folder, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { useTranslation } from "../../hooks/useTranslation";
import { UserContext } from "../../utility/context/UserContext";

interface BreadcrumbEntry {
  id: string;
  name: string;
  isOrg: boolean;
}

interface FolderPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onSelect: (folderId: string, isOrgFolder: boolean) => void;
  disableSelectFolderId?: string;
  allowOrgFolders: boolean;
  requireOrgFolders?: boolean;
}

export function FolderPickerDialog({
  open,
  onOpenChange,
  title,
  description,
  onSelect,
  disableSelectFolderId,
  allowOrgFolders,
  requireOrgFolders = false,
}: FolderPickerDialogProps) {
  const navigator = useNavigate();
  const { t } = useTranslation();
  const { user } = useContext(UserContext);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbEntry[]>([
    { id: "root", name: t("library.library"), isOrg: false },
  ]);
  const [folders, setFolders] = useState<LibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const currentCrumb = breadcrumbs[breadcrumbs.length - 1];
  const currentFolderId = currentCrumb.id;
  const currentIsOrg = currentCrumb.isOrg;

  // Reset to root whenever the dialog opens
  useEffect(() => {
    if (open) {
      setBreadcrumbs([{ id: "root", name: t("library.library"), isOrg: false }]);
    }
    // eslint-disable-next-line
  }, [open]);

  // Fetch folders at the current level (with pagination)
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setIsLoading(true);
    setFolders([]);

    const addFolders = (items: LibraryItem[]) => {
      const newFolders = items.filter((i) => i.type === "folder");
      setFolders((prev) => {
        const seen = new Set(prev.map((f) => f.itemId));
        return [...prev, ...newFolders.filter((f) => !seen.has(f.itemId))];
      });
    };

    function fetchPage(params: Parameters<typeof getItems>[0], onDone: () => void) {
      Get(getItems(params), controller.signal, true).then((res) => {
        if (res && res.status < 300 && res.data?.items) {
          addFolders(res.data.items);
          if (res.data.nextKey) {
            fetchPage({ ...params, nextKey: res.data.nextKey }, onDone);
          } else {
            onDone();
          }
        } else {
          if (res?.status === 401) navigator("/login");
          onDone();
        }
      });
    }

    if (currentFolderId === "root" && user?.username) {
      let pending = 2;
      const done = () => { if (--pending === 0) setIsLoading(false); };
      [user.username, "ORG"].forEach((owner) => {
        fetchPage({ parentId: "root", owner }, done);
      });
    } else {
      fetchPage({ parentId: currentFolderId }, () => setIsLoading(false));
    }

    return () => controller.abort();
    // eslint-disable-next-line
  }, [currentFolderId, open]);

  function navigateInto(folder: LibraryItem) {
    setBreadcrumbs((prev) => [
      ...prev,
      { id: folder.itemId, name: folder.name, isOrg: folder.ownerId === "ORG" },
    ]);
  }

  function navigateToBreadcrumb(index: number) {
    setBreadcrumbs((prev) => prev.slice(0, index + 1));
  }

  function isSelectable(folderId: string, isOrg: boolean): boolean {
    if (folderId === disableSelectFolderId) return false;
    if (!allowOrgFolders && isOrg) return false;
    if (requireOrgFolders && !isOrg && folderId !== "root") return false;
    return true;
  }

  function getDisabledTooltip(folderId: string, isOrg: boolean): string {
    if (folderId === disableSelectFolderId) return t("library.folderIsCurrent");
    if (!allowOrgFolders && isOrg) return t("library.orgFolderAccessDenied");
    if (requireOrgFolders && !isOrg && folderId !== "root") return t("library.orgFolderRequired");
    return "";
  }

  const currentSelectable = isSelectable(currentFolderId, currentIsOrg);

  return (
    <DialogWrapper
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      contentClassName="sm:max-w-2xl"
      actions={[
        {
          label: t("common.cancel"),
          onClick: () => onOpenChange(false),
          variant: "outline",
        },
      ]}
    >
      {/* Breadcrumb navigation */}
      <nav
        aria-label={t("library.folderNavigation")}
        className="flex items-center gap-1 flex-wrap text-sm mb-3 min-h-6"
      >
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={`${crumb.id}-${index}`}>
            {index > 0 && (
              <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" aria-hidden="true" />
            )}
            <button
              type="button"
              onClick={() => navigateToBreadcrumb(index)}
              disabled={index === breadcrumbs.length - 1}
              aria-current={index === breadcrumbs.length - 1 ? "page" : undefined}
              className={cn(
                "px-1 rounded transition-colors",
                index === breadcrumbs.length - 1
                  ? "font-semibold text-foreground cursor-default"
                  : "text-muted-foreground hover:text-foreground hover:underline"
              )}
            >
              {crumb.name}
            </button>
          </React.Fragment>
        ))}
      </nav>

      {/* Current folder row — always visible and selectable */}
      <div className="flex items-center px-3 py-2 mb-2 rounded-lg border bg-muted/30">
        <Folder className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium">{currentCrumb.name}</span>
          <span className="ml-2 text-xs text-muted-foreground">{t("library.currentFolder")}</span>
        </div>
        {currentSelectable ? (
          <Button size="sm" variant="outline" className="h-7 text-xs ml-2" onClick={() => onSelect(currentFolderId, currentIsOrg)}>
            {t("common.select")}
          </Button>
        ) : (
          <TooltipWrapper content={getDisabledTooltip(currentFolderId, currentIsOrg)} side="left">
            <span className="ml-2">
              <Button size="sm" variant="outline" className="h-7 text-xs opacity-40 cursor-not-allowed pointer-events-none" disabled tabIndex={-1}>
                {t("common.select")}
              </Button>
            </span>
          </TooltipWrapper>
        )}
      </div>

      {/* Folder list */}
      <div className="min-h-[220px] max-h-[380px] overflow-y-auto border rounded-lg">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-10">
            <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
            <span className="text-sm text-muted-foreground">{t("loadingMessage.folders")}</span>
          </div>
        ) : folders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
            <Folder className="h-8 w-8 mb-2 opacity-40" aria-hidden="true" />
            <p className="text-sm">{t("errorMessage.noFolders")}</p>
          </div>
        ) : (
          <ul className="divide-y">
            {folders.map((folder) => {
              const isOrg = folder.ownerId === "ORG";
              const selectable = isSelectable(folder.itemId, isOrg);
              const tooltip = getDisabledTooltip(folder.itemId, isOrg);
              return (
                <li key={folder.itemId} className="flex items-center pl-[10px] pr-3 py-2 group border-l-2 border-l-transparent hover:border-l-primary transition-colors">
                  {/* Clicking the row navigates into the folder */}
                  <button
                    type="button"
                    className="flex items-center gap-2 flex-1 min-w-0 text-left"
                    onClick={() => navigateInto(folder)}
                    aria-label={`${t("library.navigateInto")} ${folder.name}`}
                  >
                    <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                    <span className="text-sm font-medium truncate">{folder.name}</span>
                    {isOrg && (
                      <span className="ml-1 text-xs text-muted-foreground border rounded px-1 flex-shrink-0">
                        {t("common.public")}
                      </span>
                    )}
                    <ChevronRight
                      className="h-3 w-3 text-muted-foreground ml-auto flex-shrink-0 opacity-0 group-hover:opacity-60 transition-opacity"
                      aria-hidden="true"
                    />
                  </button>
                  {/* Per-row select button */}
                  {selectable ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 h-7 px-2 text-xs flex-shrink-0"
                      onClick={(e) => { e.stopPropagation(); onSelect(folder.itemId, isOrg); }}
                    >
                      {t("common.select")}
                    </Button>
                  ) : (
                    <TooltipWrapper content={tooltip} side="left">
                      {/* Wrapper span needed — disabled buttons don't fire mouse events for tooltip */}
                      <span className="ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs flex-shrink-0 opacity-40 cursor-not-allowed pointer-events-none"
                          disabled
                          tabIndex={-1}
                          aria-disabled="true"
                        >
                          {t("common.select")}
                        </Button>
                      </span>
                    </TooltipWrapper>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </DialogWrapper>
  );
}
