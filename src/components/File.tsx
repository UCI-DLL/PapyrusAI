import React, { useContext, useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { DialogWrapper } from "./ui-wrappers/DialogWrapper";
import { LibraryItem } from "../utility/types/CourseTypes";
import { UserContext } from "../utility/context/UserContext";
import Put from "../utility/Put";
import Delete from "../utility/Delete";
import Post from "../utility/Post";
import { AlertContext } from "../utility/context/AlertContext";
import {
  postCopyItem,
  postMoveItem,
  deleteItem,
  postPromoteItem,
  postDemoteItem,
} from "../utility/endpoints/ItemEndpoints";
import {
  postCreateUserFavoritingData,
  putUpdateUserFavoritingData,
} from "../utility/endpoints/UserEndpoints";
import {
  Star,
  FileText,
  MoreHorizontal,
  Eye,
  Plus,
  Trash2,
  CheckCircle,
} from "lucide-react";
import { DropdownWrapper } from "./ui-wrappers/DropdownWrapper";
import { TooltipWrapper } from "./ui-wrappers/TooltipWrapper";
import { cn } from "../lib/utils";
import { useNavigate, Link } from "react-router-dom";
import { FolderPickerDialog } from "../features/library/FolderPickerDialog";
import { useTranslation } from "../hooks/useTranslation";

interface FileProps {
  item: LibraryItem;
  keyy: string;
  refreshList: () => void;
  loading: (isLoading?: boolean) => void;
  noShowMenu?: boolean;
  onClick?: (fileId: string, type: string) => void;
  showRemove?: boolean;
  isStarred?: boolean;
  disableStarring?: boolean;
  isSelected?: boolean;
  onStarChange?: (itemId: string, type: "folder" | "prompt" | "file", parentId: string, isNowStarred: boolean) => void;
}

export const File = (props: FileProps) => {
  let navigator = useNavigate();
  const { user } = useContext(UserContext);
  const { setAlert } = useContext(AlertContext);
  const { t } = useTranslation();
  const [openCopyToDialog, setOpenCopyToDialog] = useState<boolean>(false);
  const [openMoveDialog, setOpenMoveDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [openPromoteDialog, setOpenPromoteDialog] = useState<boolean>(false);
  const [openDemoteDialog, setOpenDemoteDialog] = useState<boolean>(false);
  const [starred, setStarred] = useState<boolean>(props.isStarred ?? false);

  useEffect(() => {
    setStarred(props.isStarred ?? false);
  }, [props.isStarred]);

  const isOrgItem = props.item.ownerId === "ORG";
  const isAdmin = user?.groups.includes(process.env.REACT_APP_ADMIN ?? "PapyrusAIAdmin") ?? false;

  const getEditUrl = () => `/library/${props.item.parentId}/files/${props.item.itemId}`;

  function copyTo(folderId: string) {
    setOpenCopyToDialog(false);
    props.loading();
    const copyBody = folderId !== "root" ? { parentId: folderId } : {};
    Post(postCopyItem(props.item.itemId), copyBody, true).then((res) => {
      if (res.status && res.status < 300) {
        setAlert({ message: t("components.fileCopiedSuccessfully"), type: "success" });
        props.refreshList();
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        props.loading(false);
        setAlert({ message: res.data?.message || t("components.failedToCopyFile"), type: "error" });
      }
    });
  }

  function moveTo(folderId: string) {
    setOpenMoveDialog(false);
    props.loading();
    const moveBody = folderId !== "root" ? { parentId: folderId } : {};
    Post(postMoveItem(props.item.itemId), moveBody, true).then((res) => {
      if (res.status && res.status < 300) {
        setAlert({ message: t("components.fileMovedSuccessfully"), type: "success" });
        props.refreshList();
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        props.loading(false);
        setAlert({ message: res.data?.message || t("components.failedToMoveFile"), type: "error" });
      }
    });
  }

  function deleteFile() {
    props.loading();
    Delete(deleteItem(props.item.itemId), true).then((res) => {
      if (res.status && res.status < 300) {
        setAlert({ message: t("components.fileDeletedSuccessfully"), type: "success" });
        props.refreshList();
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        props.loading(false);
        setAlert({ message: res.data?.message || t("components.failedToDeleteFile"), type: "error" });
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
        setAlert({ message: t("components.filePromotedSuccessfully"), type: "success" });
        props.refreshList();
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        props.loading(false);
        setAlert({ message: res.data?.message || t("components.failedToPromoteFile"), type: "error" });
      }
    });
  }

  function demote(destinationFolderId: string) {
    setOpenDemoteDialog(false);
    props.loading();
    const body = destinationFolderId !== "root" ? { parentId: destinationFolderId } : {};
    Post(postDemoteItem(props.item.itemId), body, true).then((res) => {
      if (res.status && res.status < 300) {
        setAlert({ message: t("components.fileDemotedSuccessfully"), type: "success" });
        props.refreshList();
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        props.loading(false);
        setAlert({ message: res.data?.message || t("components.failedToDemoteFile"), type: "error" });
      }
    });
  }

  function createStarredFile() {
    Post(postCreateUserFavoritingData(), {
      id: { folderId: props.item.parentId, fileId: props.item.itemId },
      type: "files",
    }).then((res) => {
      if (res.status && res.status < 300) {
        setAlert({ message: t("components.fileStarred"), type: "success" });
        props.onStarChange?.(props.item.itemId, "file", props.item.parentId, true);
      } else if (res && res.status === 401) {
        setStarred(false);
        navigator("/login");
      } else {
        setStarred(false);
        setAlert({ message: t("components.failedToStarFile"), type: "error" });
      }
    });
  }

  function removeStarredFile() {
    Put(putUpdateUserFavoritingData(), {
      id: { folderId: props.item.parentId, fileId: props.item.itemId },
      type: "files",
    }).then((res) => {
      if (res.status && res.status < 300) {
        setAlert({ message: t("components.fileUnstarred"), type: "success" });
        props.onStarChange?.(props.item.itemId, "file", props.item.parentId, false);
      } else if (res && res.status === 401) {
        setStarred(true);
        navigator("/login");
      } else {
        setStarred(true);
        setAlert({ message: t("components.failedToUnstarFile"), type: "error" });
      }
    });
  }

  const toggleStar = (e: React.MouseEvent) => {
    e.stopPropagation();
    const willStar = !starred;
    setStarred(willStar);
    if (willStar) { createStarredFile(); } else { removeStarredFile(); }
  };

  const getFileType = () => {
    const ext = props.item.name.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "pdf": return "PDF";
      case "doc": case "docx": return "DOC";
      case "txt": return "TXT";
      case "jpg": case "jpeg": case "png": return "IMG";
      default: return t("common.file").toUpperCase();
    }
  };

  const adminOrgMenu = [
    { label: t("common.view"), type: "link" as const, action: getEditUrl() },
    { label: starred ? t("common.unstar") : t("common.star"), type: "function" as const, action: starred ? removeStarredFile : createStarredFile },
    { label: t("common.edit"), type: "link" as const, action: getEditUrl() },
    { label: t("common.copyTo"), type: "function" as const, action: () => setOpenCopyToDialog(true) },
    { label: t("common.moveTo"), type: "function" as const, action: () => setOpenMoveDialog(true) },
    { label: t("common.makePrivate"), type: "function" as const, action: () => setOpenDemoteDialog(true) },
    { label: t("common.delete"), type: "function" as const, action: () => setOpenDeleteDialog(true) },
  ];
  const instructorOrgMenu = [
    { label: t("common.view"), type: "link" as const, action: getEditUrl() },
    { label: starred ? t("common.unstar") : t("common.star"), type: "function" as const, action: starred ? removeStarredFile : createStarredFile },
    { label: t("common.copyTo"), type: "function" as const, action: () => setOpenCopyToDialog(true) },
  ];
  const adminUserMenu = [
    { label: t("common.view"), type: "link" as const, action: getEditUrl() },
    { label: starred ? t("common.unstar") : t("common.star"), type: "function" as const, action: starred ? removeStarredFile : createStarredFile },
    { label: t("common.edit"), type: "link" as const, action: getEditUrl() },
    { label: t("common.copyTo"), type: "function" as const, action: () => setOpenCopyToDialog(true) },
    { label: t("common.moveTo"), type: "function" as const, action: () => setOpenMoveDialog(true) },
    { label: t("common.makePublic"), type: "function" as const, action: () => setOpenPromoteDialog(true) },
    { label: t("common.delete"), type: "function" as const, action: () => setOpenDeleteDialog(true) },
  ];
  const instructorUserMenu = [
    { label: t("common.view"), type: "link" as const, action: getEditUrl() },
    { label: starred ? t("common.unstar") : t("common.star"), type: "function" as const, action: starred ? removeStarredFile : createStarredFile },
    { label: t("common.edit"), type: "link" as const, action: getEditUrl() },
    { label: t("common.copyTo"), type: "function" as const, action: () => setOpenCopyToDialog(true) },
    { label: t("common.moveTo"), type: "function" as const, action: () => setOpenMoveDialog(true) },
    { label: t("common.delete"), type: "function" as const, action: () => setOpenDeleteDialog(true) },
  ];

  return (
    <div key={props.keyy ? props.keyy : "key"}>
      {/* Delete Dialog */}
      <DialogWrapper
        open={openDeleteDialog}
        onOpenChange={setOpenDeleteDialog}
        title={t("components.deleteFile")}
        description={t("components.deleteFileMessage")}
        actions={[
          { label: t("common.cancel"), onClick: () => setOpenDeleteDialog(false), variant: "outline" },
          { label: t("common.delete"), onClick: deleteFile, variant: "destructive" },
        ]}
      />

      {/* Copy To */}
      <FolderPickerDialog
        open={openCopyToDialog}
        onOpenChange={setOpenCopyToDialog}
        title={t("components.copyFileTo")}
        description={t("components.copyFileToDescription")}
        onSelect={(folderId) => copyTo(folderId)}
        allowOrgFolders={isAdmin}
      />

      {/* Move To */}
      <FolderPickerDialog
        open={openMoveDialog}
        onOpenChange={setOpenMoveDialog}
        title={t("components.moveFileTo")}
        description={t("components.moveFileToDescription")}
        onSelect={(folderId) => moveTo(folderId)}
        disableSelectFolderId={props.item.parentId}
        allowOrgFolders={isAdmin}
      />

      {/* Promote */}
      <FolderPickerDialog
        open={openPromoteDialog}
        onOpenChange={setOpenPromoteDialog}
        title={t("components.promoteFileTo")}
        description={t("components.promoteFileToDescription")}
        onSelect={(folderId) => promote(folderId)}
        allowOrgFolders={true}
        requireOrgFolders={true}
      />

      {/* Demote */}
      <FolderPickerDialog
        open={openDemoteDialog}
        onOpenChange={setOpenDemoteDialog}
        title={t("components.demoteFileTo")}
        description={t("components.demoteFileToDescription")}
        onSelect={(folderId) => demote(folderId)}
        allowOrgFolders={false}
      />

      <Card className="h-full">
        <CardContent className="p-4 h-full flex flex-col">
          {/* Header with icon, file type, and star */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-orange-800 dark:text-orange-400 colorful-dark:text-orange-400" />
              <span className="text-xs font-medium text-orange-800 dark:text-orange-400 colorful-dark:text-orange-400 uppercase tracking-wide">
                {getFileType()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {!props.disableStarring && (
                <TooltipWrapper
                  content={starred ? t("common.unstar") + " " + t("common.file") : t("common.star") + " " + t("common.file")}
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
                  actions={(isOrgItem
                    ? isAdmin ? adminOrgMenu : instructorOrgMenu
                    : isAdmin ? adminUserMenu : instructorUserMenu
                  ).map((item) => ({
                    label: item.label,
                    onClick: () => {
                      if (item.type === "link") { props.loading(); }
                      else { item.action(); }
                    },
                    type: item.type,
                    href: item.type === "link" ? item.action : undefined,
                    className: item.label === t("common.delete") ? "text-destructive focus:bg-destructive focus:text-destructive-foreground" : "",
                  }))}
                  align="end"
                />
              )}
            </div>
          </div>

          {/* File title */}
          <h2 className="font-semibold text-foreground mb-2 text-lg leading-tight">
            {props.item.name}
          </h2>

          {/* Description */}
          {props.item.description && (
            <p className="text-sm text-muted-foreground mb-2 leading-relaxed">{props.item.description}</p>
          )}

          <div className="flex w-full items-center justify-between">
            <div />
            {props.noShowMenu ? (
              props.showRemove ? (
                <TooltipWrapper content={t("components.removeFileFromModule")} side="top">
                  <Button
                    variant="ghost"
                    type="button"
                    size="sm"
                    className="flex items-center gap-1 text-xs font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      props.onClick?.(props.item.itemId, "file");
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                    {t("common.remove")}
                  </Button>
                </TooltipWrapper>
              ) : props.isSelected ? (
                <TooltipWrapper content={t("components.thisFileAlreadyAdded")} side="top">
                  <Button
                    variant="ghost"
                    type="button"
                    size="sm"
                    disabled
                    className="flex items-center gap-1 text-xs font-medium text-muted-foreground opacity-50 cursor-not-allowed"
                  >
                    <CheckCircle className="h-3 w-3" />
                    {t("common.added")}
                  </Button>
                </TooltipWrapper>
              ) : (
                <TooltipWrapper content={t("components.addFileToModule")} side="top">
                  <Button
                    variant="ghost"
                    type="button"
                    size="sm"
                    className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:bg-primary hover:text-primary-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      props.onClick?.(props.item.itemId, "file");
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
                variant="ghost"
                size="sm"
                className="text-xs font-medium text-muted-foreground hover:bg-primary hover:text-primary-foreground"
                asChild
                onClick={() => props.loading()}
                aria-label={t("common.view")}
              >
                <Link to={getEditUrl()} className="flex items-center gap-1 no-underline">
                  <Eye className="h-3 w-3" />
                  {t("common.view")}
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
