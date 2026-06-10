import React, { useContext, useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { DropdownWrapper } from "./ui-wrappers/DropdownWrapper";
import { DialogWrapper } from "./ui-wrappers/DialogWrapper";
import { LibraryItem } from "../utility/types/CourseTypes";
import { LayoutGrid, MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router";
import { AlertContext } from "../utility/context/AlertContext";
import { UserContext } from "../utility/context/UserContext";
import Delete from "../utility/Delete";
import Post from "../utility/Post";
import { deleteItem, postCopyItem, postMoveItem, postPromoteItem, postDemoteItem } from "../utility/endpoints/ItemEndpoints";
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
}

export const Rubric = (props: RubricProps) => {
  const navigator = useNavigate();
  const { setAlert } = useContext(AlertContext);
  const { user } = useContext(UserContext);
  const { t } = useTranslation();
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openCopyDialog, setOpenCopyDialog] = useState(false);
  const [openMoveDialog, setOpenMoveDialog] = useState(false);
  const [openPromoteDialog, setOpenPromoteDialog] = useState(false);
  const [openDemoteDialog, setOpenDemoteDialog] = useState(false);
  const [openShareDialog, setOpenShareDialog] = useState(false);

  const isOrgItem = props.item.ownerId === "ORG";
  const isAdmin = user?.groups.includes(process.env.REACT_APP_ADMIN ?? "PapyrusAIAdmin") ?? false;
  const isOwner = props.item.ownerId === user?.username;
  const canEdit = !props.shared || props.item.userPermission === "editor";

  function edit() {
    props.loading();
    navigator(`/library/rubrics/${props.item.itemId}`);
  }

  function handleCardClick() {
    if (props.onClick) {
      props.onClick(props.item.parentId, props.item.itemId, isOrgItem, "rubric");
    } else {
      edit();
    }
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

  const menuItemsBase =
    isOrgItem && !isAdmin ? [
      { label: t("common.copyTo"), onClick: () => setOpenCopyDialog(true) },
    ] :
    isOrgItem && isAdmin ? [
      { label: t("common.edit"), onClick: edit },
      { label: t("common.share"), onClick: () => setOpenShareDialog(true) },
      { label: t("common.copyTo"), onClick: () => setOpenCopyDialog(true) },
      { label: t("common.moveTo"), onClick: () => setOpenMoveDialog(true) },
      { label: t("common.makePrivate"), onClick: () => setOpenDemoteDialog(true) },
      { label: t("common.delete"), onClick: () => setOpenDeleteDialog(true), className: "text-destructive focus:bg-destructive focus:text-destructive-foreground" },
    ] :
    isAdmin ? [
      { label: t("common.edit"), onClick: edit },
      { label: t("common.share"), onClick: () => setOpenShareDialog(true) },
      { label: t("common.copyTo"), onClick: () => setOpenCopyDialog(true) },
      { label: t("common.moveTo"), onClick: () => setOpenMoveDialog(true) },
      { label: t("common.makePublic"), onClick: () => setOpenPromoteDialog(true) },
      { label: t("common.delete"), onClick: () => setOpenDeleteDialog(true), className: "text-destructive focus:bg-destructive focus:text-destructive-foreground" },
    ] : [
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

      <Card
        className="h-full hover:shadow-md transition-shadow duration-200 group cursor-pointer"
        onClick={handleCardClick}
      >
        <CardContent className="p-4 h-full flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-primary uppercase tracking-wide">
                {t("library.rubric")}
              </span>
            </div>
            {!props.noShowMenu && (
              <DropdownWrapper
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center p-1"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={t("common.moreOptions")}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                }
                actions={menuItems}
                align="end"
              />
            )}
          </div>

          <h3 className="font-semibold text-foreground mb-1 line-clamp-2">
            {props.item.name || "Untitled Rubric"}
          </h3>

          {(criteriaCount > 0 || columnsCount > 0) && (
            <p className="text-xs text-muted-foreground mb-3">
              {criteriaCount} criterion{criteriaCount !== 1 ? "a" : ""} ·{" "}
              {columnsCount} score level{columnsCount !== 1 ? "s" : ""}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
