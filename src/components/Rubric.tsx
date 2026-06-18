import React, { useContext, useEffect, useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { DropdownWrapper } from "./ui-wrappers/DropdownWrapper";
import { DialogWrapper } from "./ui-wrappers/DialogWrapper";
import { LibraryItem } from "../utility/types/CourseTypes";
import { LayoutGrid, MoreHorizontal, Eye, Plus, CheckCircle, Star } from "lucide-react";
import { TooltipWrapper } from "./ui-wrappers/TooltipWrapper";
import { useNavigate } from "react-router";
import { AlertContext } from "../utility/context/AlertContext";
import { UserContext } from "../utility/context/UserContext";
import Delete from "../utility/Delete";
import Post from "../utility/Post";
import Put from "../utility/Put";
import { deleteItem, postCopyItem, postMoveItem, postPromoteItem, postDemoteItem } from "../utility/endpoints/ItemEndpoints";
import { postCreateUserFavoritingData, putUpdateUserFavoritingData } from "../utility/endpoints/UserEndpoints";
import { cn } from "../lib/utils";
import { useTranslation } from "../hooks/useTranslation";
import { FolderPickerDialog } from "../features/library/FolderPickerDialog";
import { ShareItemDialog } from "../features/library/ShareItemDialog";

interface RubricProps {
  item: LibraryItem;
  keyy: string;
  refreshList: () => void;
  loading: (isLoading?: boolean) => void;
  noShowMenu?: boolean;
  shared?: boolean;
  onClick?: (folderId: string, id: string, isOrgFolder: boolean, type: string) => void;
  isSelected?: boolean;
  isStarred?: boolean;
  disableStarring?: boolean;
  onStarChange?: (itemId: string, type: "folder" | "prompt" | "file" | "rubric", parentId: string, isNowStarred: boolean) => void;
}

export const Rubric = (props: RubricProps) => {
  const navigator = useNavigate();
  const { setAlert } = useContext(AlertContext);
  const { user } = useContext(UserContext);
  const { t } = useTranslation();
  const [openPreviewDialog, setOpenPreviewDialog] = useState(false);
  const [starred, setStarred] = useState<boolean>(props.isStarred ?? false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openCopyDialog, setOpenCopyDialog] = useState(false);
  const [openMoveDialog, setOpenMoveDialog] = useState(false);
  const [openPromoteDialog, setOpenPromoteDialog] = useState(false);
  const [openDemoteDialog, setOpenDemoteDialog] = useState(false);
  const [openShareDialog, setOpenShareDialog] = useState(false);

  useEffect(() => {
    setStarred(props.isStarred ?? false);
  }, [props.isStarred]);

  const isOrgItem = props.item.ownerId === "ORG";
  const isAdmin = user?.groups.includes(process.env.REACT_APP_ADMIN ?? "PapyrusAIAdmin") ?? false;
  const isOwner = props.item.ownerId === user?.username;
  const canEdit = !props.shared || props.item.userPermission === "editor";

  function createStarredRubric() {
    Post(postCreateUserFavoritingData(), {
      id: { rubricId: props.item.itemId },
      type: "rubrics",
    }).then((res) => {
      if (res.status && res.status < 300) {
        setAlert({ message: t("components.rubricStarred"), type: "success" });
        props.onStarChange?.(props.item.itemId, "rubric", props.item.parentId, true);
      } else if (res && res.status === 401) {
        setStarred(false);
        navigator("/login");
      } else {
        setStarred(false);
        setAlert({ message: t("components.failedToStarRubric"), type: "error" });
      }
      if (!props.onStarChange) props.refreshList();
    });
  }

  function removeStarredRubric() {
    Put(putUpdateUserFavoritingData(), {
      id: { rubricId: props.item.itemId },
      type: "rubrics",
    }).then((res) => {
      if (res.status && res.status < 300) {
        setAlert({ message: t("components.rubricUnstarred"), type: "success" });
        props.onStarChange?.(props.item.itemId, "rubric", props.item.parentId, false);
      } else if (res && res.status === 401) {
        setStarred(true);
        navigator("/login");
      } else {
        setStarred(true);
        setAlert({ message: t("components.failedToUnstarRubric"), type: "error" });
      }
      if (!props.onStarChange) props.refreshList();
    });
  }

  const toggleStar = (e: React.MouseEvent) => {
    e.stopPropagation();
    const willStar = !starred;
    setStarred(willStar);
    if (willStar) { createStarredRubric(); } else { removeStarredRubric(); }
  };

  function edit() {
    props.loading();
    navigator(`/library/rubrics/${props.item.itemId}`);
  }

  function deleteRubric() {
    props.loading();
    Delete(deleteItem(props.item.itemId), true).then((res) => {
      if (res.status && res.status < 300) {
        setAlert({ message: t("components.rubricDeletedSuccessfully"), type: "success" });
        props.refreshList();
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        props.loading(false);
        setAlert({ message: res.data?.message || t("components.failedToDeleteRubric"), type: "error" });
      }
      setOpenDeleteDialog(false);
    });
  }

  function copyRubric(destinationFolderId: string) {
    setOpenCopyDialog(false);
    props.loading();
    const copyBody = destinationFolderId !== "root" ? { parentId: destinationFolderId } : {};
    Post(postCopyItem(props.item.itemId), copyBody, true).then((res) => {
      if (res.status && res.status < 300) {
        setAlert({ message: t("components.rubricCopiedSuccessfully"), type: "success" });
        props.refreshList();
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        props.loading(false);
        setAlert({ message: res.data?.message || t("components.failedToCopyRubric"), type: "error" });
      }
    });
  }

  function moveRubric(destinationFolderId: string) {
    setOpenMoveDialog(false);
    props.loading();
    const moveBody = destinationFolderId !== "root" ? { parentId: destinationFolderId } : {};
    Post(postMoveItem(props.item.itemId), moveBody, true).then((res) => {
      if (res.status && res.status < 300) {
        setAlert({ message: t("components.rubricMovedSuccessfully"), type: "success" });
        props.refreshList();
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        props.loading(false);
        setAlert({ message: res.data?.message || t("components.failedToMoveRubric"), type: "error" });
      }
    });
  }

  function promote(destinationFolderId: string) {
    setOpenPromoteDialog(false);
    props.loading();
    const body = destinationFolderId !== "root" ? { parentId: destinationFolderId } : {};
    Post(postPromoteItem(props.item.itemId), body, true).then((res) => {
      if (res.status && res.status < 300) {
        setAlert({ message: t("components.rubricPromotedSuccessfully"), type: "success" });
        props.refreshList();
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        props.loading(false);
        setAlert({ message: res.data?.message || t("components.failedToPromoteRubric"), type: "error" });
      }
    });
  }

  function demote(destinationFolderId: string) {
    setOpenDemoteDialog(false);
    props.loading();
    const body = destinationFolderId !== "root" ? { parentId: destinationFolderId } : {};
    Post(postDemoteItem(props.item.itemId), body, true).then((res) => {
      if (res.status && res.status < 300) {
        setAlert({ message: t("components.rubricDemotedSuccessfully"), type: "success" });
        props.refreshList();
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        props.loading(false);
        setAlert({ message: res.data?.message || t("components.failedToDemoteRubric"), type: "error" });
      }
    });
  }

  const criteriaCount = props.item.metadata?.criteria?.length ?? 0;
  const columnsCount = props.item.metadata?.columns?.length ?? 0;

  const starMenuItem = { label: starred ? t("common.unstar") : t("common.star"), onClick: starred ? removeStarredRubric : createStarredRubric };

  const menuItemsBase =
    isOrgItem && !isAdmin ? [
      { label: t("common.view"), onClick: () => setOpenPreviewDialog(true) },
      starMenuItem,
      { label: t("common.copyTo"), onClick: () => setOpenCopyDialog(true) },
    ] :
      isOrgItem && isAdmin ? [
        { label: t("common.view"), onClick: () => setOpenPreviewDialog(true) },
        starMenuItem,
        { label: t("common.edit"), onClick: edit },
        { label: t("common.share"), onClick: () => setOpenShareDialog(true) },
        { label: t("common.copyTo"), onClick: () => setOpenCopyDialog(true) },
        { label: t("common.moveTo"), onClick: () => setOpenMoveDialog(true) },
        { label: t("common.makePrivate"), onClick: () => setOpenDemoteDialog(true) },
        { label: t("common.delete"), onClick: () => setOpenDeleteDialog(true), className: "text-destructive focus:bg-destructive focus:text-destructive-foreground" },
      ] :
        isAdmin ? [
          { label: t("common.view"), onClick: () => setOpenPreviewDialog(true) },
          starMenuItem,
          { label: t("common.edit"), onClick: edit },
          { label: t("common.share"), onClick: () => setOpenShareDialog(true) },
          { label: t("common.copyTo"), onClick: () => setOpenCopyDialog(true) },
          { label: t("common.moveTo"), onClick: () => setOpenMoveDialog(true) },
          { label: t("common.makePublic"), onClick: () => setOpenPromoteDialog(true) },
          { label: t("common.delete"), onClick: () => setOpenDeleteDialog(true), className: "text-destructive focus:bg-destructive focus:text-destructive-foreground" },
        ] : [
          { label: t("common.view"), onClick: () => setOpenPreviewDialog(true) },
          starMenuItem,
          { label: t("common.edit"), onClick: edit },
          ...(isOwner ? [{ label: t("common.share"), onClick: () => setOpenShareDialog(true) }] : []),
          { label: t("common.copyTo"), onClick: () => setOpenCopyDialog(true) },
          { label: t("common.moveTo"), onClick: () => setOpenMoveDialog(true) },
          { label: t("common.delete"), onClick: () => setOpenDeleteDialog(true), className: "text-destructive focus:bg-destructive focus:text-destructive-foreground" },
        ];

  const menuItems = menuItemsBase
    .filter(item => canEdit || item.label !== t("common.edit"))
    .filter(item => !props.shared || item.label !== t("common.moveTo"));

  return (
    <div key={props.keyy}>
      {/* Preview Dialog */}
      <DialogWrapper
        open={openPreviewDialog}
        onOpenChange={setOpenPreviewDialog}
        title={props.item.name || t("createRubric.untitledRubric")}
        description={t("createRubric.rubricPreview")}
        contentClassName="max-w-4xl max-h-[80vh]"
        actions={[{ label: t("common.close"), onClick: () => setOpenPreviewDialog(false), variant: "outline" }]}
      >
        <div className="overflow-auto max-h-[60vh]">
          {(props.item.metadata?.columns?.length ?? 0) > 0 ? (
            <table className="w-full border-collapse text-sm" style={{ minWidth: `${140 + (props.item.metadata?.columns?.length ?? 0) * 160}px` }}>
              <thead>
                <tr>
                  <th className="border border-border px-3 py-2 text-left font-semibold capitalize" style={{ minWidth: 140, position: "sticky", left: 0, zIndex: 10, background: "hsl(var(--muted))" }}>
                    {t("createRubric.criterion")}
                  </th>
                  {(props.item.metadata?.columns ?? []).map((col: string, i: number) => (
                    <th key={i} className="border border-border bg-muted px-3 py-2 text-center font-semibold" style={{ minWidth: 160 }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(props.item.metadata?.criteria ?? []).map((criterion: { name: string; cells: string[] }, rowIdx: number) => (
                  <tr key={rowIdx}>
                    <td className="border border-border px-3 py-2 font-medium align-top" style={{ minWidth: 140, position: "sticky", left: 0, zIndex: 10, background: "hsl(var(--muted))" }}>
                      {criterion.name}
                    </td>
                    {criterion.cells.map((cell: string, colIdx: number) => (
                      <td key={colIdx} className="border border-border px-3 py-2 align-top text-muted-foreground whitespace-pre-wrap" style={{ minWidth: 160 }}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-muted-foreground">{t("createRubric.rubricGrid")}</p>
          )}
        </div>
      </DialogWrapper>

      {/* Share Dialog */}
      <ShareItemDialog
        open={openShareDialog}
        onOpenChange={setOpenShareDialog}
        item={props.item}
      />

      {/* Delete Dialog */}
      <DialogWrapper
        open={openDeleteDialog}
        onOpenChange={setOpenDeleteDialog}
        title={t("components.deleteRubric")}
        description={t("components.deleteRubricMessage")}
        actions={[
          { label: t("common.cancel"), onClick: () => setOpenDeleteDialog(false), variant: "outline" },
          { label: t("common.delete"), onClick: deleteRubric, variant: "destructive" },
        ]}
      />

      {/* Copy To */}
      <FolderPickerDialog
        open={openCopyDialog}
        onOpenChange={setOpenCopyDialog}
        title={t("components.copyRubricTo")}
        description={t("components.copyRubricToDescription")}
        onSelect={(folderId) => copyRubric(folderId)}
        allowOrgFolders={isAdmin}
      />

      {/* Move To */}
      <FolderPickerDialog
        open={openMoveDialog}
        onOpenChange={setOpenMoveDialog}
        title={t("components.moveRubricTo")}
        description={t("components.moveRubricToDescription")}
        onSelect={(folderId) => moveRubric(folderId)}
        disableSelectFolderId={props.item.parentId}
        allowOrgFolders={isAdmin}
      />

      {/* Promote */}
      <FolderPickerDialog
        open={openPromoteDialog}
        onOpenChange={setOpenPromoteDialog}
        title={t("components.promoteRubricTo")}
        description={t("components.promoteRubricToDescription")}
        onSelect={(folderId) => promote(folderId)}
        allowOrgFolders={true}
        requireOrgFolders={true}
      />

      {/* Demote */}
      <FolderPickerDialog
        open={openDemoteDialog}
        onOpenChange={setOpenDemoteDialog}
        title={t("components.demoteRubricTo")}
        description={t("components.demoteRubricToDescription")}
        onSelect={(folderId) => demote(folderId)}
        allowOrgFolders={false}
      />

      <Card className="h-full hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4 h-full flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-bright-purple dark:text-purple-400 colorful-dark:text-purple-400" />
              <span className="text-xs font-medium text-bright-purple dark:text-purple-400 colorful-dark:text-purple-400 uppercase tracking-wide">
                {t("library.rubric")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {!props.disableStarring && (
                <TooltipWrapper
                  content={starred ? t("common.unstar") + " " + t("library.rubric") : t("common.star") + " " + t("library.rubric")}
                  side="top"
                >
                  <button
                    onClick={toggleStar}
                    className={cn(
                      "p-1 rounded-full transition-all duration-300",
                      starred ? "text-gold hover:text-muted text-lg" : "text-muted hover:text-gold text-lg"
                    )}
                    aria-label={starred ? t("common.removeFromFavorites") : t("common.addToFavorites")}
                  >
                    <Star
                      size={16}
                      fill={starred ? "currentColor" : "none"}
                      className={cn(starred ? "hover:fill-none h-[1em] w-[1em]" : "hover:fill-current h-[1em] w-[1em]")}
                      aria-hidden="true"
                    />
                  </button>
                </TooltipWrapper>
              )}
              {!props.noShowMenu && (
                <DropdownWrapper
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex text-lg items-center p-1"
                      onClick={(e) => e.stopPropagation()}
                      aria-label={t("common.moreOptions")}
                    >
                      <MoreHorizontal className="h-[1em] w-[1em]" />
                    </Button>
                  }
                  actions={menuItems}
                  align="end"
                />
              )}
            </div>
          </div>

          <h2 className="font-semibold text-foreground mb-2 text-lg leading-tight">
            {props.item.name || t("createRubric.untitledRubric")}
          </h2>

          {props.item.description && (
            <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
              {props.item.description}
            </p>
          )}

          {(criteriaCount > 0 || columnsCount > 0) && (
            <p className="text-xs text-muted-foreground mb-3">
              {criteriaCount} {criteriaCount !== 1 ? t("createRubric.criteria") : t("createRubric.criterion")} ·{" "}
              {columnsCount} {columnsCount !== 1 ? t("createRubric.scoreLevels") : t("createRubric.scoreLevel")}
            </p>
          )}

          <div className="flex items-center justify-between mt-auto">
            <div />
            {props.noShowMenu ? (
              props.isSelected ? (
                <TooltipWrapper content={t("components.thisRubricAlreadyAdded")} side="top">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled
                    className="flex items-center gap-1 text-xs font-medium text-muted-foreground opacity-50 cursor-not-allowed"
                  >
                    <CheckCircle className="h-3 w-3" />
                    {t("common.added")}
                  </Button>
                </TooltipWrapper>
              ) : (
                <TooltipWrapper content={t("components.addRubricToModule")} side="top">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:bg-primary hover:text-primary-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      props.onClick?.(props.item.parentId, props.item.itemId, isOrgItem, "rubric");
                    }}
                  >
                    <Plus className="h-3 w-3" />
                    {t("common.add")}
                  </Button>
                </TooltipWrapper>
              )
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex items-center gap-1 text-xs font-medium"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenPreviewDialog(true);
                }}
                aria-label={t("common.view")}
              >
                <Eye className="h-3 w-3" />
                {t("common.view")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
