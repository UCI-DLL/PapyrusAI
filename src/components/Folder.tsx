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
import { useNavigate } from "react-router-dom";
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
            message: "Folder renamed successfully",
            type: "success",
          });
          props.refreshList();
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          setAlert({
            message: "Failed to rename folder",
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
            message: "Folder renamed successfully",
            type: "success",
          });
          props.refreshList();
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          setAlert({
            message: "Failed to rename folder",
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
            message: "Folder duplicated successfully",
            type: "success",
          });
          props.refreshList();
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          setAlert({
            message: "Failed to duplicate folder",
            type: "error",
          });
        }
      });
    } else {
      Post(postCopyUserFolder(props.folder.id), {}).then((res) => {
        if (res.status && res.status < 300) {
          setAlert({
            message: "Folder duplicated successfully",
            type: "success",
          });
          props.refreshList();
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          setAlert({
            message: "Failed to duplicate folder",
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
            message: "Folder deleted successfully",
            type: "success",
          });
          props.refreshList();
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          setAlert({
            message: "Failed to delete folder",
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
            message: "Folder deleted successfully",
            type: "success",
          });
          props.refreshList();
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          setAlert({
            message: "Failed to delete folder",
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
          message: "Folder promoted successfully",
          type: "success",
        });
        props.refreshList();
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        setAlert({
          message: "Failed to promote folder",
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
          message: "Folder demoted successfully",
          type: "success",
        });
        props.refreshList();
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        setAlert({ message: "Failed to demote folder", type: "error" });
      }
      setOpenDemoteDialog(false);
    });
  }

  function createStarredFolder() {
    Post(postCreateUserFavoritingData(), {
      folders: [{ folderId: props.folder.id }],
    }).then((res) => {
      if (res.status && res.status < 300) {
        setStarred(true);
        setAlert({ message: "Folder starred", type: "success" });
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        setAlert({ message: "Failed to star folder", type: "error" });
      }
    });
  }

  function removeStarredFolder() {
    Put(putUpdateUserFavoritingData(), {
      folders: starred ? [{ folderId: props.folder.id }] : [],
    }).then((res) => {
      if (res.status && res.status < 300) {
        setStarred(false);
        setAlert({ message: "Folder unstarred", type: "success" });
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        setAlert({ message: "Failed to unstar folder", type: "error" });
      }
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
    return props.folder.prompts.length + props.folder.files.length;
  };

  const getFolderDescription = () => {
    // Generate a description based on the folder content
    const promptCount = props.folder.prompts.length;
    const fileCount = props.folder.files.length;

    if (promptCount === 0 && fileCount === 0) return "Empty Folder";

    if (promptCount > 0 && fileCount > 0) {
      const promptText =
        promptCount === 1 ? "1 prompt" : `${promptCount} prompts`;
      const fileText = fileCount === 1 ? "1 file" : `${fileCount} files`;
      return `Contains ${promptText} and ${fileText}`;
    }

    if (promptCount > 0) {
      return promptCount === 1
        ? "Contains 1 prompt"
        : `Contains ${promptCount} prompts`;
    }

    return fileCount === 1 ? "Contains 1 file" : `Contains ${fileCount} files`;
  };

  const adminOrgMenu = [
    { label: "View", type: "link" as const, action: getViewUrl() },
    {
      label: starred ? "Unstar" : "Star",
      type: "function" as const,
      action: starred ? removeStarredFolder : createStarredFolder,
    },
    { label: "Rename", type: "function" as const, action: openRename },
    { label: "Duplicate", type: "function" as const, action: duplicate },
    { label: "Make Private", type: "function" as const, action: openDemote },
    { label: "Delete", type: "function" as const, action: openDelete },
  ];
  const instructorOrgMenu = [
    { label: "View", type: "link" as const, action: getViewUrl() },
    {
      label: starred ? "Unstar" : "Star",
      type: "function" as const,
      action: starred ? removeStarredFolder : createStarredFolder,
    },
  ];
  const adminUserMenu = [
    { label: "View", type: "link" as const, action: getViewUrl() },
    {
      label: starred ? "Unstar" : "Star",
      type: "function" as const,
      action: starred ? removeStarredFolder : createStarredFolder,
    },
    { label: "Rename", type: "function" as const, action: openRename },
    { label: "Duplicate", type: "function" as const, action: duplicate },
    { label: "Make Public", type: "function" as const, action: openPromote },
    { label: "Delete", type: "function" as const, action: openDelete },
  ];
  const instructorUserMenu = [
    { label: "View", type: "link" as const, action: getViewUrl() },
    {
      label: starred ? "Unstar" : "Star",
      type: "function" as const,
      action: starred ? removeStarredFolder : createStarredFolder,
    },
    { label: "Rename", type: "function" as const, action: openRename },
    { label: "Duplicate", type: "function" as const, action: duplicate },
    { label: "Delete", type: "function" as const, action: openDelete },
  ];

  return (
    <div key={props.keyy ? props.keyy : "key"}>
      {/* Promote Dialog */}
      <DialogWrapper
        open={openPromoteDialog}
        onOpenChange={setOpenPromoteDialog}
        title="Promote Folder?"
        description="Are you sure you would like to promote this folder into an organization folder along everything in it? This will remove the folder from your personal ownership and transfer it to the organization level. Proceeding will allow all instructors to be able to read and use contains in modules. All admins will be able to edit this folder."
        actions={[
          {
            label: "Cancel",
            onClick: () => setOpenPromoteDialog(false),
            variant: "outline",
          },
          {
            label: "Confirm",
            onClick: promote,
            variant: "default",
          },
        ]}
      />

      {/* Demote Dialog */}
      <DialogWrapper
        open={openDemoteDialog}
        onOpenChange={setOpenDemoteDialog}
        title="Demote Folder?"
        description="Are you sure you would like to demote this organization folder into a personal user folder along everything in it? This will remove the folder from the organization ownership and transfer it to the user level. Proceeding will only let you edit the folder."
        actions={[
          {
            label: "Cancel",
            onClick: () => setOpenDemoteDialog(false),
            variant: "outline",
          },
          {
            label: "Confirm",
            onClick: demote,
            variant: "default",
          },
        ]}
      />

      {/* Delete Dialog */}
      <DialogWrapper
        open={openDeleteDialog}
        onOpenChange={setOpenDeleteDialog}
        title="Delete Folder?"
        description="Are you sure you would like to permanently delete this folder and everything in it?"
        actions={[
          {
            label: "Cancel",
            onClick: () => setOpenDeleteDialog(false),
            variant: "outline",
          },
          {
            label: "Delete",
            onClick: deleteFolder,
            variant: "destructive",
          },
        ]}
      />

      {/* Rename Dialog */}
      <DialogWrapper
        open={openRenameDialog}
        onOpenChange={setOpenRenameDialog}
        title="Rename Folder"
        description="Enter a new name for your folder."
        actions={[
          {
            label: "Cancel",
            onClick: () => setOpenRenameDialog(false),
            variant: "outline",
          },
          {
            label: "Rename",
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
            <Label htmlFor="folder-name">Folder Name</Label>
            <Input
              id="folder-name"
              value={renameFolderText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setRenameFolderText(e.target.value);
              }}
              placeholder="Enter folder name"
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
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Folder className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                FOLDER
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={props.isOrganizationFolder ? "default" : "secondary"}
                className="text-xs"
              >
                {props.isOrganizationFolder ? "public" : "private"}
              </Badge>
              <TooltipWrapper
                content={starred ? "Unstar Folder" : "Star Folder"}
                side="top"
              >
                <button
                  onClick={toggleStar}
                  className={cn(
                    "p-1 rounded-full transition-all duration-300",
                    starred
                      ? "text-gold hover:text-muted"
                      : "text-muted hover:text-gold"
                  )}
                  aria-label={
                    starred ? "Remove from favorites" : "Add to favorites"
                  }
                >
                  <Star
                    size={16}
                    fill={starred ? "currentColor" : "none"}
                    className={cn(
                      starred ? "hover:fill-none" : "hover:fill-current"
                    )}
                    aria-hidden="true"
                  />
                </button>
              </TooltipWrapper>
            </div>
          </div>

          {/* Folder title */}
          <h3 className="font-semibold text-foreground mb-2 text-lg leading-tight">
            {displayName}
          </h3>

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
                className="text-xs bg-green-50 text-green-700 border-green-200"
              >
                {tag}
              </Badge>
            ))}
          </div>

          {/* Footer with item count and view link */}
          <div className="flex items-center justify-between mt-auto">
            <span className="text-xs text-gray-500">
              {getItemCount()} items
            </span>
            <div className="flex items-center gap-2">
              {!props.noShowMenu && (
                <DropdownWrapper
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-3 w-3" />
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
                  }))}
                  align="end"
                  tooltipContent="Folder Options"
                  tooltipSide="top"
                />
              )}
              <Button
                variant="ghost"
                size="icon"
                className="flex items-center gap-1 text-primary text-xs font-medium w-full p-2"
                onClick={props.onClick}
                // disabled={props.noShowMenu}
              >
                {props.noShowMenu ? "Select" : "View"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
