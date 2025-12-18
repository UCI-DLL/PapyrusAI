import React, { useContext, useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { DialogWrapper } from "./ui-wrappers/DialogWrapper";
import { TooltipWrapper } from "./ui-wrappers/TooltipWrapper";
import { DropdownWrapper } from "./ui-wrappers/DropdownWrapper";
import { FolderType } from "../utility/types/CourseTypes";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../utility/context/UserContext";
import Put from "../utility/Put";
import { AlertContext } from "../utility/context/AlertContext";
import {
  postCopyOrgFolder,
  postCopyUserFolder,
  postDemoteOrgFolder,
  postPromoteUserFolder,
  postUpdateOrgFolder,
  postUpdateUserFolder,
} from "../utility/endpoints/FolderEndpoints";
import Post from "../utility/Post";
import {
  postCreateUserFavoritingData,
  putUpdateUserFavoritingData,
} from "../utility/endpoints/UserEndpoints";
import { Star, Folder, MoreHorizontal } from "lucide-react";
import { cn } from "../lib/utils";
import { useTranslation } from "../hooks/useTranslation";

interface FolderProps {
  displayName: string;
  isOrganizationFolder?: boolean;
  onClick: any;
  folder: FolderType;
  keyy: string;
  refreshList: () => void;
  loading: () => void;
  noShowMenu?: boolean;
  isStarred?: boolean;
}

export const FolderComponent = (props: FolderProps) => {
  let navigator = useNavigate();
  const { user } = useContext(UserContext);
  const { setAlert } = useContext(AlertContext);
  const { t } = useTranslation();
  const displayName = props.displayName ? props.displayName : "Displayname";
  const [renameFolderText, setRenameFolderText] = useState<string>(
    props.folder.name
  );
  const [openRenameDialog, setOpenRenameDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [openPromoteDialog, setOpenPromoteDialog] = useState<boolean>(false);
  const [openDemoteDialog, setOpenDemoteDialog] = useState<boolean>(false);
  const [starred, setStarred] = useState<boolean>(
    props.isStarred ? props.isStarred : false
  );

  useEffect(() => {
    setStarred(props.isStarred ? props.isStarred : false);
  }, [props.isStarred]);

  useEffect(() => {
    setRenameFolderText(props.folder.name);
  }, [props.folder.name]);

  const getViewUrl = () => {
    if (props.isOrganizationFolder) {
      return `/library/org/${props.folder.id}`;
    } else {
      return `/library/${props.folder.id}`;
    }
  };

  const openRename = () => {
    setOpenRenameDialog(true);
  };

  const openDelete = () => {
    setOpenDeleteDialog(true);
  };

  const openPromote = () => {
    setOpenPromoteDialog(true);
  };

  const openDemote = () => {
    setOpenDemoteDialog(true);
  };

  function rename() {
    props.loading();
    if (props.isOrganizationFolder) {
      const dataToSend = {
        name: renameFolderText,
        isDeleted: props.folder.isDeleted,
      };
      Put(postUpdateOrgFolder(props.folder.id), dataToSend).then((res) => {
        if (res.status && res.status < 300) {
          setAlert({
            message: t("components.folderRenamedSuccessfully"),
            type: "success",
          });
          props.refreshList();
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          setAlert({
            message: t("components.failedToRenameFolder"),
            type: "error",
          });
        }
        setOpenRenameDialog(false);
      });
    } else {
      const dataToSend = {
        name: renameFolderText,
        isDeleted: props.folder.isDeleted,
      };
      Put(postUpdateUserFolder(props.folder.id), dataToSend).then((res) => {
        if (res.status && res.status < 300) {
          setAlert({
            message: t("components.folderRenamedSuccessfully"),
            type: "success",
          });
          props.refreshList();
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          setAlert({
            message: t("components.failedToRenameFolder"),
            type: "error",
          });
        }
        setOpenRenameDialog(false);
      });
    }
  }

  function duplicate() {
    props.loading();
    if (props.isOrganizationFolder) {
      Post(postCopyOrgFolder(props.folder.id), {}).then((res) => {
        if (res.status && res.status < 300) {
          setAlert({
            message: t("components.folderDuplicatedSuccessfully"),
            type: "success",
          });
          props.refreshList();
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          setAlert({
            message: t("components.failedToDuplicateFolder"),
            type: "error",
          });
        }
      });
    } else {
      Post(postCopyUserFolder(props.folder.id), {}).then((res) => {
        if (res.status && res.status < 300) {
          setAlert({
            message: t("components.folderDuplicatedSuccessfully"),
            type: "success",
          });
          props.refreshList();
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          setAlert({
            message: t("components.failedToDuplicateFolder"),
            type: "error",
          });
        }
      });
    }
  }

  function deleteFolder() {
    props.loading();
    if (props.isOrganizationFolder) {
      const dataToSend = {
        name: props.folder.name,
        isDeleted: true,
      };
      Put(postUpdateOrgFolder(props.folder.id), dataToSend).then((res) => {
        if (res.status && res.status < 300) {
          setAlert({
            message: t("components.folderDeletedSuccessfully"),
            type: "success",
          });
          props.refreshList();
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          setAlert({
            message: t("components.failedToDeleteFolder"),
            type: "error",
          });
        }
        setOpenDeleteDialog(false);
      });
    } else {
      const dataToSend = {
        name: props.folder.name,
        isDeleted: true,
      };
      Put(postUpdateUserFolder(props.folder.id), dataToSend).then((res) => {
        if (res.status && res.status < 300) {
          setAlert({
            message: t("components.folderDeletedSuccessfully"),
            type: "success",
          });
          props.refreshList();
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          setAlert({
            message: t("components.failedToDeleteFolder"),
            type: "error",
          });
        }
        setOpenDeleteDialog(false);
      });
    }
  }

  function promote() {
    props.loading();
    Post(postPromoteUserFolder(props.folder.id), {}).then((res) => {
      if (res.status && res.status < 300) {
        setAlert({
          message: t("components.folderPromotedSuccessfully"),
          type: "success",
        });
        props.refreshList();
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        setAlert({
          message: t("components.failedToPromoteFolder"),
          type: "error",
        });
      }
      setOpenPromoteDialog(false);
    });
  }

  function demote() {
    props.loading();
    Post(postDemoteOrgFolder(props.folder.id), {}).then((res) => {
      if (res.status && res.status < 300) {
        setAlert({
          message: t("components.folderDemotedSuccessfully"),
          type: "success",
        });
        props.refreshList();
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        setAlert({ message: t("components.failedToDemoteFolder"), type: "error" });
      }
      setOpenDemoteDialog(false);
    });
  }

  function createStarredFolder() {
    props.loading();
    Post(postCreateUserFavoritingData(), {
      id: { folderId: props.folder.id },
      type: "folders",
    }).then((res) => {
      if (res.status && res.status < 300) {
        if (res.data && res.data.folders) {
          //update foler lists as needed
          setStarred(res.data.folders);
          setAlert({ message: t("components.folderAddedToFavorites"), type: "info" });
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        // set errors
        setAlert({ message: res.data, type: "error" });
      }
      props.refreshList();
    });
  }

  function removeStarredFolder() {
    props.loading();
    Put(putUpdateUserFavoritingData(), {
      id: { folderId: props.folder.id },
      type: "folders",
    }).then((res) => {
      if (res.status && res.status < 300) {
        if (res.data && res.data.folders) {
          //update folder lists as needed
          setStarred(res.data.folders);
          setAlert({ message: t("components.folderRemovedFromFavorites"), type: "info" });
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        // set errors
        setAlert({ message: res.data, type: "error" });
      }
      props.refreshList();
    });
  }

  const toggleStar = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (starred) {
      removeStarredFolder();
    } else {
      createStarredFolder();
    }
  };

  // Get unique tags from all prompts in the folder
  const getFolderTags = () => {
    const allTags = props.folder.prompts.flatMap((prompt) => prompt.tags || []);
    return Array.from(new Set(allTags)).slice(0, 3); // Limit to 3 tags
  };

  const getItemCount = () => {
    return props.folder.prompts.filter(x => !x.isDeleted).length + props.folder.files.filter(x => !x.isDeleted).length;
  };

  const getFolderDescription = () => {
    // Generate a description based on the folder content
    const promptCount = props.folder.prompts.filter(x => !x.isDeleted).length;
    const fileCount = props.folder.files.filter(x => !x.isDeleted).length;

    if (promptCount === 0 && fileCount === 0) return t("components.emptyFolder");

    if (promptCount > 0 && fileCount > 0) {
      return t("components.containsPromptsAndFiles", { promptCount, fileCount });
    }

    if (promptCount > 0) {
      return promptCount === 1
        ? t("components.containsPrompt", { count: 1 })
        : t("components.containsPrompts", { count: promptCount });
    }

    return fileCount === 1 ? t("components.containsFile", { count: 1 }) : t("components.containsFiles", { count: fileCount });
  };

  const adminOrgMenu = [
    { label: t("common.view"), type: "link" as const, action: getViewUrl() },
    {
      label: starred ? t("common.unstar") : t("common.star"),
      type: "function" as const,
      action: starred ? removeStarredFolder : createStarredFolder,
    },
    { label: t("common.rename"), type: "function" as const, action: openRename },
    { label: t("common.duplicate"), type: "function" as const, action: duplicate },
    { label: t("common.makePrivate"), type: "function" as const, action: openDemote },
    { label: t("common.delete"), type: "function" as const, action: openDelete },
  ];
  const instructorOrgMenu = [
    { label: t("common.view"), type: "link" as const, action: getViewUrl() },
    {
      label: starred ? t("common.unstar") : t("common.star"),
      type: "function" as const,
      action: starred ? removeStarredFolder : createStarredFolder,
    },
  ];
  const adminUserMenu = [
    { label: t("common.view"), type: "link" as const, action: getViewUrl() },
    {
      label: starred ? t("common.unstar") : t("common.star"),
      type: "function" as const,
      action: starred ? removeStarredFolder : createStarredFolder,
    },
    { label: t("common.rename"), type: "function" as const, action: openRename },
    { label: t("common.duplicate"), type: "function" as const, action: duplicate },
    { label: t("common.makePublic"), type: "function" as const, action: openPromote },
    { label: t("common.delete"), type: "function" as const, action: openDelete },
  ];
  const instructorUserMenu = [
    { label: t("common.view"), type: "link" as const, action: getViewUrl() },
    {
      label: starred ? t("common.unstar") : t("common.star"),
      type: "function" as const,
      action: starred ? removeStarredFolder : createStarredFolder,
    },
    { label: t("common.rename"), type: "function" as const, action: openRename },
    { label: t("common.duplicate"), type: "function" as const, action: duplicate },
    { label: t("common.delete"), type: "function" as const, action: openDelete },
  ];

  return (
    <div key={props.keyy ? props.keyy : "key"}>
      {/* Promote Dialog */}
      <DialogWrapper
        open={openPromoteDialog}
        onOpenChange={setOpenPromoteDialog}
        title={t("components.promoteFolder")}
        description={t("components.promoteFolderDescription")}
        actions={[
          {
            label: t("common.cancel"),
            onClick: () => setOpenPromoteDialog(false),
            variant: "outline",
          },
          {
            label: t("common.confirm"),
            onClick: promote,
            variant: "default",
          },
        ]}
      />

      {/* Demote Dialog */}
      <DialogWrapper
        open={openDemoteDialog}
        onOpenChange={setOpenDemoteDialog}
        title={t("components.demoteFolder")}
        description={t("components.demoteFolderDescription")}
        actions={[
          {
            label: t("common.cancel"),
            onClick: () => setOpenDemoteDialog(false),
            variant: "outline",
          },
          {
            label: t("common.confirm"),
            onClick: demote,
            variant: "default",
          },
        ]}
      />

      {/* Delete Dialog */}
      <DialogWrapper
        open={openDeleteDialog}
        onOpenChange={setOpenDeleteDialog}
        title={t("components.deleteFolder")}
        description={t("components.deleteFolderMessage")}
        actions={[
          {
            label: t("common.cancel"),
            onClick: () => setOpenDeleteDialog(false),
            variant: "outline",
          },
          {
            label: t("common.delete"),
            onClick: deleteFolder,
            variant: "destructive",
          },
        ]}
      />

      {/* Rename Dialog */}
      <DialogWrapper
        open={openRenameDialog}
        onOpenChange={setOpenRenameDialog}
        title={t("components.renameFolder")}
        description={t("components.renameFolderDescription")}
        actions={[
          {
            label: t("common.cancel"),
            onClick: () => setOpenRenameDialog(false),
            variant: "outline",
          },
          {
            label: t("common.rename"),
            onClick: () => {
              setOpenRenameDialog(false);
              rename();
            },
            variant: "default",
          },
        ]}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="folder-name">{t("common.folder")} {t("common.name")}</Label>
            <Input
              id="folder-name"
              value={renameFolderText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setRenameFolderText(e.target.value);
              }}
              placeholder={t("components.enterFolderName")}
            />
          </div>
        </div>
      </DialogWrapper>

      <Card
        className="h-full hover:shadow-md transition-shadow duration-200 group"
      // onClick={props.onClick}
      >
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
                variant={props.isOrganizationFolder ? "default" : "outline"}
                className="text-xs pointer-events-none"
              >
                {props.isOrganizationFolder ? t("common.public") : t("common.private")}
              </Badge>
              <TooltipWrapper
                content={starred ? t("common.unstar") + " " + t("common.folder") : t("common.star") + " " + t("common.folder")}
                side="top"
              >
                <button
                  onClick={toggleStar}
                  className={cn(
                    "p-1 text-lg rounded-full transition-all duration-300",
                    starred
                      ? "text-gold hover:text-muted"
                      : "text-muted hover:text-gold"
                  )}
                  aria-label={
                    starred ? t("common.removeFromFavorites") : t("common.addToFavorites")
                  }
                >
                  <Star
                    size={16}
                    fill={starred ? "currentColor" : "none"}
                    className={cn(
                      starred ? "hover:fill-none h-[1em] w-[1em]" : "hover:fill-current h-[1em] w-[1em]"
                    )}
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
                  actions={(props.isOrganizationFolder
                    ? user?.groups.includes(
                      process.env.REACT_APP_ADMIN
                        ? process.env.REACT_APP_ADMIN
                        : "PapyrusAIAdmin"
                    )
                      ? adminOrgMenu
                      : instructorOrgMenu
                    : user?.groups.includes(
                      process.env.REACT_APP_ADMIN
                        ? process.env.REACT_APP_ADMIN
                        : "PapyrusAIAdmin"
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
                    type: item.type === "link" ? "link" : "button",
                    href: item.type === "link" ? item.action : undefined,
                    className: item.label === t("common.delete") ? "text-destructive focus:bg-destructive focus:text-destructive-foreground" : ""
                  }))}
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
          <p className="text-sm text-muted-foreground mb-4 flex-grow leading-relaxed">
            {getFolderDescription()}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-4">
            {getFolderTags().map((tag, index) => (
              <Badge
                key={index}
                variant="outline"
                className="text-xs bg-green-50 text-green-700 border-green-200 pointer-events-none"
              >
                {tag}
              </Badge>
            ))}
          </div>

          {/* Footer with item count and view link */}
          <div className="flex items-center justify-between mt-auto">
            <span className="text-xs text-gray-700 dark:text-gray-300 colorful-dark:text-gray-300">
              {getItemCount()} {t("common.items")}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="flex items-center gap-1 text-muted-foreground text-xs font-medium w-full p-2 hover:bg-primary hover:text-primary-foreground"
                onClick={props.onClick}
                // disabled={props.noShowMenu}
                aria-label={props.noShowMenu ? t("common.select") : t("common.view")}
              >
                {props.noShowMenu ? t("common.select") :
                  <Link to={getViewUrl()} className="no-underline">
                    {t("common.view")}
                  </Link>}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
