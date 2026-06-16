import React, { useContext, useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { DialogWrapper } from "./ui-wrappers/DialogWrapper";
import { TooltipWrapper } from "./ui-wrappers/TooltipWrapper";
import { DropdownWrapper } from "./ui-wrappers/DropdownWrapper";
import { LibraryItem } from "../utility/types/CourseTypes";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../utility/context/UserContext";
import Patch from "../utility/Patch";
import Put from "../utility/Put";
import Delete from "../utility/Delete";
import Post from "../utility/Post";
import { AlertContext } from "../utility/context/AlertContext";
import {
  patchUpdateItem,
  deleteItem,
  postCopyItem,
  postMoveItem,
  postPromoteItem,
  postDemoteItem,
} from "../utility/endpoints/ItemEndpoints";
import { FolderPickerDialog } from "../features/library/FolderPickerDialog";
import {
  postCreateUserFavoritingData,
  putUpdateUserFavoritingData,
} from "../utility/endpoints/UserEndpoints";
import { Star, Folder, MoreHorizontal } from "lucide-react";
import { ShareItemDialog } from "../features/library/ShareItemDialog";
import { cn } from "../lib/utils";
import { useTranslation } from "../hooks/useTranslation";

interface FolderProps {
  displayName: string;
  onClick: any;
  item: LibraryItem;
  keyy: string;
  refreshList: () => void;
  loading: (isLoading?: boolean) => void;
  noShowMenu?: boolean;
  isStarred?: boolean;
  onStarChange?: (itemId: string, type: "folder" | "prompt" | "file", parentId: string, isNowStarred: boolean) => void;
  shared?: boolean;
}

export const FolderComponent = (props: FolderProps) => {
  let navigator = useNavigate();
  const { user } = useContext(UserContext);
  const { setAlert } = useContext(AlertContext);
  const { t } = useTranslation();
  const isOrganizationFolder = props.item.ownerId === "ORG";
  const displayName = props.displayName ? props.displayName : "Displayname";
  const [editFolderForm, setEditFolderForm] = useState<{ name: string; description: string }>({ name: props.item.name, description: props.item.description ?? "" });
  const [openRenameDialog, setOpenRenameDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [openPromoteDialog, setOpenPromoteDialog] = useState<boolean>(false);
  const [openDemoteDialog, setOpenDemoteDialog] = useState<boolean>(false);
  const [openCopyDialog, setOpenCopyDialog] = useState<boolean>(false);
  const [openMoveDialog, setOpenMoveDialog] = useState<boolean>(false);
  const [openShareDialog, setOpenShareDialog] = useState<boolean>(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [starred, setStarred] = useState<boolean>(props.isStarred ? props.isStarred : false);
  const isAdmin = user?.groups.includes(process.env.REACT_APP_ADMIN ?? "PapyrusAIAdmin") ?? false;
  const isOwner = props.item.ownerId === user?.username;
  const canEdit = !props.shared || props.item.userPermission === "editor";

  useEffect(() => {
    setStarred(props.isStarred ? props.isStarred : false);
  }, [props.isStarred]);

  useEffect(() => {
    setEditFolderForm({ name: props.item.name, description: props.item.description ?? "" });
  }, [props.item.name, props.item.description]);

  const getViewUrl = () => `/library/${props.item.itemId}`;

  const openRename = () => setOpenRenameDialog(true);
  const openDelete = () => setOpenDeleteDialog(true);
  const openPromote = () => setOpenPromoteDialog(true);
  const openDemote = () => setOpenDemoteDialog(true);

  function rename(e?: React.FormEvent) {
    e?.preventDefault();
    setIsRenaming(true);
    props.loading();
    Patch(patchUpdateItem(props.item.itemId), { name: editFolderForm.name, description: editFolderForm.description }, true).then((res) => {
      if (res.status && res.status < 300) {
        setAlert({ message: t("components.folderRenamedSuccessfully"), type: "success" });
        props.refreshList();
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        props.loading(false);
        setAlert({ message: res.data?.message || t("components.failedToRenameFolder"), type: "error" });
      }
      setIsRenaming(false);
      setOpenRenameDialog(false);
    });
  }

  function copyFolder(destinationFolderId: string) {
    setOpenCopyDialog(false);
    props.loading();
    const copyBody = destinationFolderId !== "root" ? { parentId: destinationFolderId } : {};
    Post(postCopyItem(props.item.itemId), copyBody, true).then((res) => {
      if (res.status && res.status < 300) {
        setAlert({ message: t("components.folderCopiedSuccessfully"), type: "success" });
        props.refreshList();
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        props.loading(false);
        setAlert({ message: res.data?.message || t("components.failedToCopyFolder"), type: "error" });
      }
    });
  }

  function moveFolder(destinationFolderId: string) {
    setOpenMoveDialog(false);
    props.loading();
    const moveBody = destinationFolderId !== "root" ? { parentId: destinationFolderId } : {};
    Post(postMoveItem(props.item.itemId), moveBody, true).then((res) => {
      if (res.status && res.status < 300) {
        setAlert({ message: t("components.folderMovedSuccessfully"), type: "success" });
        props.refreshList();
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        props.loading(false);
        setAlert({ message: res.data?.message || t("components.failedToMoveFolder"), type: "error" });
      }
    });
  }

  function deleteFolder() {
    props.loading();
    Delete(deleteItem(props.item.itemId), true).then((res) => {
      if (res.status && res.status < 300) {
        setAlert({ message: t("components.folderDeletedSuccessfully"), type: "success" });
        props.refreshList();
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        props.loading(false);
        setAlert({ message: res.data?.message || t("components.failedToDeleteFolder"), type: "error" });
      }
      setOpenDeleteDialog(false);
    });
  }

  function promote(destinationFolderId: string) {
    setOpenPromoteDialog(false);
    props.loading();
    const body = destinationFolderId !== "root" ? { parentId: destinationFolderId } : {};
    Post(postPromoteItem(props.item.itemId), body, true).then((res) => {
      if (res.status && res.status < 300) {
        setAlert({ message: t("components.folderPromotedSuccessfully"), type: "success" });
        props.refreshList();
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        props.loading(false);
        setAlert({ message: res.data?.message || t("components.failedToPromoteFolder"), type: "error" });
      }
    });
  }

  function demote(destinationFolderId: string) {
    setOpenDemoteDialog(false);
    props.loading();
    const body = destinationFolderId !== "root" ? { parentId: destinationFolderId } : {};
    Post(postDemoteItem(props.item.itemId), body, true).then((res) => {
      if (res.status && res.status < 300) {
        setAlert({ message: t("components.folderDemotedSuccessfully"), type: "success" });
        props.refreshList();
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        props.loading(false);
        setAlert({ message: res.data?.message || t("components.failedToDemoteFolder"), type: "error" });
      }
    });
  }

  function createStarredFolder() {
    if (!props.onStarChange) props.loading();
    Post(postCreateUserFavoritingData(), {
      id: { folderId: props.item.itemId },
      type: "folders",
    }).then((res) => {
      if (res.status && res.status < 300) {
        setAlert({ message: t("components.folderAddedToFavorites"), type: "info" });
        props.onStarChange?.(props.item.itemId, "folder", props.item.parentId, true);
      } else if (res && res.status === 401) {
        setStarred(false);
        navigator("/login");
      } else {
        setStarred(false);
        setAlert({ message: res.data?.message || t("components.failedToStarFolder"), type: "error" });
      }
      if (!props.onStarChange) props.refreshList();
    });
  }

  function removeStarredFolder() {
    if (!props.onStarChange) props.loading();
    Put(putUpdateUserFavoritingData(), {
      id: { folderId: props.item.itemId },
      type: "folders",
    }).then((res) => {
      if (res.status && res.status < 300) {
        setAlert({ message: t("components.folderRemovedFromFavorites"), type: "info" });
        props.onStarChange?.(props.item.itemId, "folder", props.item.parentId, false);
      } else if (res && res.status === 401) {
        setStarred(true);
        navigator("/login");
      } else {
        setStarred(true);
        setAlert({ message: res.data?.message || t("components.failedToUnstarFolder"), type: "error" });
      }
      if (!props.onStarChange) props.refreshList();
    });
  }

  const toggleStar = (e: React.MouseEvent) => {
    e.stopPropagation();
    const willStar = !starred;
    setStarred(willStar);
    if (willStar) {
      createStarredFolder();
    } else {
      removeStarredFolder();
    }
  };

  const getFolderDescription = () => props.item.description || "";

  const adminOrgMenu = [
    { label: t("common.view"), type: "link" as const, action: getViewUrl() },
    { label: starred ? t("common.unstar") : t("common.star"), type: "function" as const, action: starred ? removeStarredFolder : createStarredFolder },
    { label: t("common.edit"), type: "function" as const, action: openRename },
    { label: t("common.share"), type: "function" as const, action: () => setOpenShareDialog(true) },
    { label: t("common.copyTo"), type: "function" as const, action: () => setOpenCopyDialog(true) },
    { label: t("common.moveTo"), type: "function" as const, action: () => setOpenMoveDialog(true) },
    { label: t("common.makePrivate"), type: "function" as const, action: openDemote },
    { label: t("common.delete"), type: "function" as const, action: openDelete },
  ];
  const instructorOrgMenu = [
    { label: t("common.view"), type: "link" as const, action: getViewUrl() },
    { label: starred ? t("common.unstar") : t("common.star"), type: "function" as const, action: starred ? removeStarredFolder : createStarredFolder },
    { label: t("common.copyTo"), type: "function" as const, action: () => setOpenCopyDialog(true) },
  ];
  const adminUserMenu = [
    { label: t("common.view"), type: "link" as const, action: getViewUrl() },
    { label: starred ? t("common.unstar") : t("common.star"), type: "function" as const, action: starred ? removeStarredFolder : createStarredFolder },
    { label: t("common.edit"), type: "function" as const, action: openRename },
    { label: t("common.share"), type: "function" as const, action: () => setOpenShareDialog(true) },
    { label: t("common.copyTo"), type: "function" as const, action: () => setOpenCopyDialog(true) },
    { label: t("common.moveTo"), type: "function" as const, action: () => setOpenMoveDialog(true) },
    { label: t("common.makePublic"), type: "function" as const, action: openPromote },
    { label: t("common.delete"), type: "function" as const, action: openDelete },
  ];
  const instructorUserMenu = [
    { label: t("common.view"), type: "link" as const, action: getViewUrl() },
    { label: starred ? t("common.unstar") : t("common.star"), type: "function" as const, action: starred ? removeStarredFolder : createStarredFolder },
    { label: t("common.edit"), type: "function" as const, action: openRename },
    ...(isOwner ? [{ label: t("common.share"), type: "function" as const, action: () => setOpenShareDialog(true) }] : []),
    { label: t("common.copyTo"), type: "function" as const, action: () => setOpenCopyDialog(true) },
    { label: t("common.moveTo"), type: "function" as const, action: () => setOpenMoveDialog(true) },
    { label: t("common.delete"), type: "function" as const, action: openDelete },
  ];

  return (
    <div key={props.keyy ? props.keyy : "key"}>
      {/* Share Dialog */}
      <ShareItemDialog
        open={openShareDialog}
        onOpenChange={setOpenShareDialog}
        item={props.item}
      />

      {/* Promote Dialog */}
      <FolderPickerDialog
        open={openPromoteDialog}
        onOpenChange={setOpenPromoteDialog}
        title={t("components.promoteFolder")}
        description={t("components.promoteFolderDescription")}
        onSelect={(folderId) => promote(folderId)}
        allowOrgFolders={true}
        requireOrgFolders={true}
      />

      {/* Demote Dialog */}
      <FolderPickerDialog
        open={openDemoteDialog}
        onOpenChange={setOpenDemoteDialog}
        title={t("components.demoteFolder")}
        description={t("components.demoteFolderDescription")}
        onSelect={(folderId) => demote(folderId)}
        allowOrgFolders={false}
      />

      {/* Copy Dialog */}
      <FolderPickerDialog
        open={openCopyDialog}
        onOpenChange={setOpenCopyDialog}
        title={t("components.copyFolderTo")}
        description={t("components.copyFolderToDescription")}
        onSelect={(folderId) => copyFolder(folderId)}
        allowOrgFolders={isAdmin}
      />

      {/* Move Dialog */}
      <FolderPickerDialog
        open={openMoveDialog}
        onOpenChange={setOpenMoveDialog}
        title={t("components.moveFolderTo")}
        description={t("components.moveFolderToDescription")}
        onSelect={(folderId) => moveFolder(folderId)}
        disableSelectFolderId={props.item.parentId}
        allowOrgFolders={isAdmin}
      />

      {/* Delete Dialog */}
      <DialogWrapper
        open={openDeleteDialog}
        onOpenChange={setOpenDeleteDialog}
        title={t("components.deleteFolder")}
        description={t("components.deleteFolderMessage")}
        actions={[
          { label: t("common.cancel"), onClick: () => setOpenDeleteDialog(false), variant: "outline" },
          { label: t("common.delete"), onClick: deleteFolder, variant: "destructive" },
        ]}
      />

      {/* Edit Dialog */}
      <DialogWrapper
        open={openRenameDialog}
        onOpenChange={setOpenRenameDialog}
        title={t("library.editFolder")}
        description={t("library.editFolderDescription")}
        actions={[
          { label: t("common.cancel"), onClick: () => setOpenRenameDialog(false), variant: "outline" },
          {
            label: t("common.save"),
            onClick: rename,
            variant: "default",
            type: "submit",
            form: "edit-folder-form",
            disabled: isRenaming,
          },
        ]}
      >
        <form id="edit-folder-form" onSubmit={rename} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="folder-name">{t("common.folder")} {t("common.name")}</Label>
            <Input
              id="folder-name"
              value={editFolderForm.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditFolderForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder={t("components.enterFolderName")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="folder-description">{t("library.folderDescription")}</Label>
            <Input
              id="folder-description"
              value={editFolderForm.description}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditFolderForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder={t("library.enterFolderDescription")}
            />
          </div>
        </form>
      </DialogWrapper>

      <Card className="h-full hover:shadow-md transition-shadow duration-200 group">
        <CardContent className="p-4 h-full flex flex-col">
          {/* Header with folder icon, visibility, and star */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Folder className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t("common.folder")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={isOrganizationFolder ? "default" : "outline"}
                className="text-xs pointer-events-none"
              >
                {isOrganizationFolder ? t("common.public") : t("common.private")}
              </Badge>
              <TooltipWrapper
                content={starred ? t("common.unstar") + " " + t("common.folder") : t("common.star") + " " + t("common.folder")}
                side="top"
              >
                <button
                  onClick={toggleStar}
                  className={cn(
                    "p-1 text-lg rounded-full transition-all duration-300",
                    starred ? "text-gold hover:text-muted" : "text-muted hover:text-gold"
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
                  actions={(isOrganizationFolder
                    ? user?.groups.includes(
                      process.env.REACT_APP_ADMIN ? process.env.REACT_APP_ADMIN : "PapyrusAIAdmin"
                    )
                      ? adminOrgMenu
                      : instructorOrgMenu
                    : user?.groups.includes(
                      process.env.REACT_APP_ADMIN ? process.env.REACT_APP_ADMIN : "PapyrusAIAdmin"
                    )
                      ? adminUserMenu
                      : instructorUserMenu
                  ).map((item) => ({
                    label: item.label,
                    onClick: () => {
                      if (item.type === "link") {
                        navigator(item.action);
                      } else {
                        item.action();
                      }
                    },
                    type: item.type === "link" ? "link" as const : "button" as const,
                    href: item.type === "link" ? item.action : undefined,
                    className:
                      item.label === t("common.delete")
                        ? "text-destructive focus:bg-destructive focus:text-destructive-foreground"
                        : "",
                  })).filter(item => canEdit || item.label !== t("common.rename"))
                    .filter(item => !props.shared || item.label !== t("common.moveTo"))}
                  align="end"
                  tooltipContent={t("common.folderOptions")}
                  tooltipSide="top"
                />
              )}
            </div>
          </div>

          {/* Folder title */}
          <h2 className="font-semibold text-foreground mb-2 text-lg leading-tight">
            {displayName}
          </h2>

          {/* Description */}
          {props.item.description && (
            <p className="text-sm text-muted-foreground mb-4 flex-grow leading-relaxed">
              {getFolderDescription()}
            </p>
          )}

          {/* Footer with view link */}
          <div className="flex items-center justify-end mt-auto">
            <Button
              variant="ghost"
              size="icon"
              className="flex items-center gap-1 text-muted-foreground text-xs font-medium w-full p-2 hover:bg-primary hover:text-primary-foreground"
              onClick={props.onClick}
              aria-label={props.noShowMenu ? t("common.select") : t("common.view")}
            >
              {props.noShowMenu ? t("common.select") : (
                <Link to={getViewUrl()} className="no-underline">
                  {t("common.view")}
                </Link>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
