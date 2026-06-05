import React, { useContext, useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { DialogWrapper } from "./ui-wrappers/DialogWrapper";
import { TooltipWrapper } from "./ui-wrappers/TooltipWrapper";
import { DropdownWrapper } from "./ui-wrappers/DropdownWrapper";
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
} from "../utility/endpoints/ItemEndpoints";
import {
  postCreateUserFavoritingData,
  putUpdateUserFavoritingData,
} from "../utility/endpoints/UserEndpoints";
import {
  Star,
  MessageSquare,
  MoreHorizontal,
  Eye,
  Plus,
  Trash2,
  CheckCircle,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useNavigate } from "react-router";
import { FolderPickerDialog } from "../features/library/FolderPickerDialog";
import { truncateString } from "../utility/Helpers";
import { useTranslation } from "../hooks/useTranslation";

interface PromptProps {
  item: LibraryItem;
  keyy: string;
  refreshList: () => void;
  loading: (isLoading?: boolean) => void;
  noShowMenu?: boolean;
  onClick?: (folderId: string, promptId: string, isOrgFolder: boolean, type: string) => void;
  showRemove?: boolean;
  isStarred?: boolean;
  disableStarring?: boolean;
  isSelected?: boolean;
  onStarChange?: (itemId: string, type: "folder" | "prompt" | "file", parentId: string, isNowStarred: boolean) => void;
}

export const Prompt = (props: PromptProps) => {
  let navigator = useNavigate();
  const { user } = useContext(UserContext);
  const { setAlert } = useContext(AlertContext);
  const { t } = useTranslation();
  const [openCopyToDialog, setOpenCopyToDialog] = useState<boolean>(false);
  const [openMoveDialog, setOpenMoveDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [openPreviewDialog, setOpenPreviewDialog] = useState<boolean>(false);
  const [starred, setStarred] = useState<boolean>(props.isStarred ?? false);

  useEffect(() => {
    setStarred(props.isStarred ?? false);
  }, [props.isStarred]);

  const isOrgItem = props.item.ownerId === "ORG";

  function edit() {
    props.loading();
    navigator(`/library/${props.item.parentId}/prompts/${props.item.itemId}`);
  }

  function copyTo(folderId: string) {
    setOpenCopyToDialog(false);
    props.loading();
    const copyBody = folderId !== "root" ? { parentId: folderId } : {};
    Post(postCopyItem(props.item.itemId), copyBody, true).then((res) => {
      if (res.status && res.status < 300) {
        setAlert({ message: t("components.promptCopiedSuccessfully"), type: "success" });
        props.refreshList();
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        props.loading(false);
        setAlert({ message: res.data?.message || t("components.failedToCopyPrompt"), type: "error" });
      }
    });
  }

  function moveTo(folderId: string) {
    setOpenMoveDialog(false);
    props.loading();
    const moveBody = folderId !== "root" ? { parentId: folderId } : {};
    Post(postMoveItem(props.item.itemId), moveBody, true).then((res) => {
      if (res.status && res.status < 300) {
        setAlert({ message: t("components.promptMovedSuccessfully"), type: "success" });
        props.refreshList();
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        props.loading(false);
        setAlert({ message: res.data?.message || t("components.failedToMovePrompt"), type: "error" });
      }
    });
  }

  function deletePrompt() {
    props.loading();
    Delete(deleteItem(props.item.itemId), true).then((res) => {
      if (res.status && res.status < 300) {
        setAlert({ message: t("components.promptDeletedSuccessfully"), type: "success" });
        props.refreshList();
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        props.loading(false);
        setAlert({ message: res.data?.message || t("components.failedToDeletePrompt"), type: "error" });
      }
      setOpenDeleteDialog(false);
    });
  }

  function createStarredPrompt() {
    Post(postCreateUserFavoritingData(), {
      id: { folderId: props.item.parentId, promptId: props.item.itemId },
      type: "prompts",
    }).then((res) => {
      if (res.status && res.status < 300) {
        setAlert({ message: t("components.promptStarred"), type: "success" });
        props.onStarChange?.(props.item.itemId, "prompt", props.item.parentId, true);
      } else if (res && res.status === 401) {
        setStarred(false);
        navigator("/login");
      } else {
        setStarred(false);
        setAlert({ message: t("components.failedToStarPrompt"), type: "error" });
      }
      if (!props.onStarChange) props.refreshList();
    });
  }

  function removeStarredPrompt() {
    Put(putUpdateUserFavoritingData(), {
      id: { folderId: props.item.parentId, promptId: props.item.itemId },
      type: "prompts",
    }).then((res) => {
      if (res.status && res.status < 300) {
        setAlert({ message: t("components.promptUnstarred"), type: "success" });
        props.onStarChange?.(props.item.itemId, "prompt", props.item.parentId, false);
      } else if (res && res.status === 401) {
        setStarred(true);
        navigator("/login");
      } else {
        setStarred(true);
        setAlert({ message: t("components.failedToUnstarPrompt"), type: "error" });
      }
      if (!props.onStarChange) props.refreshList();
    });
  }

  const toggleStar = (e: React.MouseEvent) => {
    e.stopPropagation();
    const willStar = !starred;
    setStarred(willStar);
    if (willStar) { createStarredPrompt(); } else { removeStarredPrompt(); }
  };

  const getPromptPreview = () => truncateString(props.item.metadata?.prompt ?? "", 150);

  const adminOrgMenu = [
    t("common.view"),
    starred ? t("common.unstar") : t("common.star"),
    t("common.edit"),
    t("common.copyTo"),
    t("common.moveTo"),
    t("common.delete"),
  ];
  const instructorOrgMenu = [t("common.view"), starred ? t("common.unstar") : t("common.star"), t("common.copyTo")];
  const adminUserMenu = [
    t("common.view"),
    starred ? t("common.unstar") : t("common.star"),
    t("common.edit"),
    t("common.copyTo"),
    t("common.moveTo"),
    t("common.delete"),
  ];
  const instructorUserMenu = [
    t("common.view"),
    starred ? t("common.unstar") : t("common.star"),
    t("common.edit"),
    t("common.copyTo"),
    t("common.moveTo"),
    t("common.delete"),
  ];

  const adminOrgMenuFunctions = [
    () => setOpenPreviewDialog(true),
    starred ? removeStarredPrompt : createStarredPrompt,
    edit,
    () => setOpenCopyToDialog(true),
    () => setOpenMoveDialog(true),
    () => setOpenDeleteDialog(true),
  ];
  const instructorOrgMenuFunctions = [
    () => setOpenPreviewDialog(true),
    starred ? removeStarredPrompt : createStarredPrompt,
    () => setOpenCopyToDialog(true),
  ];
  const adminUserMenuFunctions = [
    () => setOpenPreviewDialog(true),
    starred ? removeStarredPrompt : createStarredPrompt,
    edit,
    () => setOpenCopyToDialog(true),
    () => setOpenMoveDialog(true),
    () => setOpenDeleteDialog(true),
  ];
  const instructorUserMenuFunctions = [
    () => setOpenPreviewDialog(true),
    starred ? removeStarredPrompt : createStarredPrompt,
    edit,
    () => setOpenCopyToDialog(true),
    () => setOpenMoveDialog(true),
    () => setOpenDeleteDialog(true),
  ];

  return (
    <div key={props.keyy ? props.keyy : "key"}>
      {/* Preview Dialog */}
      <DialogWrapper
        open={openPreviewDialog}
        onOpenChange={setOpenPreviewDialog}
        title={props.item.name}
        description={t("common.fullPromptContent")}
        contentClassName="max-w-4xl max-h-[80vh]"
        actions={[{ label: t("common.close"), onClick: () => setOpenPreviewDialog(false), variant: "outline" }]}
      >
        <div className="max-h-96 overflow-y-auto">
          <div className="bg-muted/50 border rounded-lg p-4">
            <pre className="text-sm text-muted-foreground font-mono whitespace-pre-wrap break-words">
              {props.item.metadata?.prompt ?? ""}
            </pre>
          </div>
        </div>
      </DialogWrapper>

      {/* Delete Dialog */}
      <DialogWrapper
        open={openDeleteDialog}
        onOpenChange={setOpenDeleteDialog}
        title={t("components.deletePrompt")}
        description={t("components.deletePromptMessage")}
        actions={[
          { label: t("common.cancel"), onClick: () => setOpenDeleteDialog(false), variant: "outline" },
          { label: t("common.delete"), onClick: deletePrompt, variant: "destructive" },
        ]}
      />

      {/* Copy To */}
      <FolderPickerDialog
        open={openCopyToDialog}
        onOpenChange={setOpenCopyToDialog}
        title={t("components.copyPromptTo")}
        description={t("components.copyPromptToDescription")}
        onSelect={(folderId) => copyTo(folderId)}
        allowOrgFolders={user?.groups.includes(process.env.REACT_APP_ADMIN ?? "PapyrusAIAdmin") ?? false}
      />

      {/* Move To */}
      <FolderPickerDialog
        open={openMoveDialog}
        onOpenChange={setOpenMoveDialog}
        title={t("components.movePromptTo")}
        description={t("components.movePromptToDescription")}
        onSelect={(folderId) => moveTo(folderId)}
        disableSelectFolderId={props.item.parentId}
        allowOrgFolders={user?.groups.includes(process.env.REACT_APP_ADMIN ?? "PapyrusAIAdmin") ?? false}
      />

      <Card className="h-full hover:shadow-md transition-shadow duration-200 group">
        <CardContent className="p-4 h-full flex flex-col">
          {/* Header with icon and star */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary dark:text-blue-400 colorful-dark:text-blue-400" />
              <span className="text-xs font-medium text-primary dark:text-blue-400 colorful-dark:text-blue-400 uppercase tracking-wide">
                {t("common.prompt").toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {!props.disableStarring && (
                <TooltipWrapper
                  content={starred ? t("common.unstar") + " " + t("common.prompt") : t("common.star") + " " + t("common.prompt")}
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
                  actions={
                    isOrgItem
                      ? user?.groups.includes(process.env.REACT_APP_ADMIN ?? "PapyrusAIAdmin")
                        ? adminOrgMenu.map((label, i) => ({
                          label,
                          onClick: () => adminOrgMenuFunctions[i](),
                          type: "button" as const,
                          className: label === t("common.delete") ? "text-destructive focus:bg-destructive focus:text-destructive-foreground" : "",
                        }))
                        : instructorOrgMenu.map((label, i) => ({
                          label,
                          onClick: () => instructorOrgMenuFunctions[i](),
                          type: "button" as const,
                          className: "",
                        }))
                      : user?.groups.includes(process.env.REACT_APP_ADMIN ?? "PapyrusAIAdmin")
                        ? adminUserMenu.map((label, i) => ({
                          label,
                          onClick: () => adminUserMenuFunctions[i](),
                          type: "button" as const,
                          className: label === t("common.delete") ? "text-destructive focus:bg-destructive focus:text-destructive-foreground" : "",
                        }))
                        : instructorUserMenu.map((label, i) => ({
                          label,
                          onClick: () => instructorUserMenuFunctions[i](),
                          type: "button" as const,
                          className: label === t("common.delete") ? "text-destructive focus:bg-destructive focus:text-destructive-foreground" : "",
                        }))
                  }
                  align="end"
                  tooltipContent={t("common.promptOptions")}
                  tooltipSide="top"
                />
              )}
            </div>
          </div>

          {/* Prompt title */}
          <h2 className="font-semibold text-foreground mb-2 text-lg leading-tight">
            {props.item.name}
          </h2>

          {/* Prompt preview box */}
          <div
            className="bg-muted/50 border rounded-lg p-3 mb-4 mt-auto cursor-pointer hover:bg-muted/70 transition-colors"
            onClick={() => setOpenPreviewDialog(true)}
          >
            <p className="text-sm text-muted-foreground font-mono">
              {getPromptPreview()}
            </p>
          </div>

          {/* Footer with actions */}
          <div className="flex items-center justify-between mt-auto">
            <div />
            {props.noShowMenu ? (
              props.showRemove ? (
                <TooltipWrapper content={t("components.removePromptFromModule")} side="top">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 text-xs font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      props.onClick?.(props.item.parentId, props.item.itemId, isOrgItem, "prompt");
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                    {t("common.remove")}
                  </Button>
                </TooltipWrapper>
              ) : props.isSelected ? (
                <TooltipWrapper content={t("components.thisPromptAlreadyAdded")} side="top">
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
                <TooltipWrapper content={t("components.addPromptToModule")} side="top">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:bg-primary hover:text-primary-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      props.onClick?.(props.item.parentId, props.item.itemId, isOrgItem, "prompt");
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
                className="flex items-center gap-1 text-muted-foreground text-xs font-medium hover:bg-primary hover:text-primary-foreground"
                onClick={() => setOpenPreviewDialog(true)}
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
