import React, { useContext, useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { FolderType } from "../utility/types/CourseTypes";
import { useNavigate } from "react-router";
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
import { Star, Folder, MoreHorizontal, ExternalLink } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "./ui/tooltip";
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

  function view() {
    if (props.isOrganizationFolder) {
      navigator(`/library/org/${props.folder.id}`);
    } else {
      navigator(`/library/${props.folder.id}`);
    }
  }

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
    if (promptCount === 0) return "Empty folder";
    if (promptCount === 1) return "Contains 1 prompt";
    return `Contains ${promptCount} prompts and resources`;
  };

  const adminOrgMenu = [
    "View",
    starred ? "Unstar" : "Star",
    "Rename",
    "Duplicate",
    "Demote",
    "Delete",
  ];
  const instructorOrgMenu = ["View", starred ? "Unstar" : "Star"];
  const adminUserMenu = [
    "View",
    starred ? "Unstar" : "Star",
    "Rename",
    "Duplicate",
    "Promote",
    "Delete",
  ];
  const instructorUserMenu = [
    "View",
    starred ? "Unstar" : "Star",
    "Rename",
    "Duplicate",
    "Delete",
  ];

  const adminOrgMenuFunctions = [
    view,
    starred ? removeStarredFolder : createStarredFolder,
    openRename,
    duplicate,
    openDemote,
    openDelete,
  ];
  const instructorOrgMenuFunctions = [
    view,
    starred ? removeStarredFolder : createStarredFolder,
  ];
  const adminUserMenuFunctions = [
    view,
    starred ? removeStarredFolder : createStarredFolder,
    openRename,
    duplicate,
    openPromote,
    openDelete,
  ];
  const instructorUserMenuFunctions = [
    view,
    starred ? removeStarredFolder : createStarredFolder,
    openRename,
    duplicate,
    openDelete,
  ];

  return (
    <div key={props.keyy ? props.keyy : "key"}>
      {/* Promote Dialog */}
      <Dialog open={openPromoteDialog} onOpenChange={setOpenPromoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promote Folder?</DialogTitle>
            <DialogDescription>
              Are you sure you would like to promote this folder into an
              organization folder along everything in it? This will remove the
              folder from your personal ownership and transfer it to the
              organization level. Proceeding will allow all instructors to be
              able to read and use contains in modules. All admins will be able
              to edit this folder.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenPromoteDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={promote}>Promote</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Demote Dialog */}
      <Dialog open={openDemoteDialog} onOpenChange={setOpenDemoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Demote Folder?</DialogTitle>
            <DialogDescription>
              Are you sure you would like to demote this organization folder
              into a personal user folder along everything in it? This will
              remove the folder from the organization ownership and transfer it
              to the user level. Proceeding will only let you edit the folder.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenDemoteDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={demote}>Demote</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Folder?</DialogTitle>
            <DialogDescription>
              Are you sure you would like to permanently delete this folder and
              everything in it?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteFolder}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={openRenameDialog} onOpenChange={setOpenRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
            <DialogDescription>
              Enter a new name for your folder.
            </DialogDescription>
          </DialogHeader>
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
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenRenameDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setOpenRenameDialog(false);
                rename();
              }}
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card
        className="h-full hover:shadow-md transition-shadow duration-200 cursor-pointer group"
        onClick={props.onClick}
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
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
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
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {starred ? "Unstar Folder" : "Star Folder"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {props.isOrganizationFolder
                      ? user?.groups.includes(
                          process.env.REACT_APP_ADMIN
                            ? process.env.REACT_APP_ADMIN
                            : "PapyrusAIAdmin"
                        )
                        ? adminOrgMenu.map((item: string, index: number) => (
                            <DropdownMenuItem
                              key={index}
                              onClick={(e) => {
                                e.stopPropagation();
                                adminOrgMenuFunctions[index]();
                              }}
                            >
                              {item}
                            </DropdownMenuItem>
                          ))
                        : instructorOrgMenu.map(
                            (item: string, index: number) => (
                              <DropdownMenuItem
                                key={index}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  instructorOrgMenuFunctions[index]();
                                }}
                              >
                                {item}
                              </DropdownMenuItem>
                            )
                          )
                      : user?.groups.includes(
                          process.env.REACT_APP_ADMIN
                            ? process.env.REACT_APP_ADMIN
                            : "PapyrusAIAdmin"
                        )
                      ? adminUserMenu.map((item: string, index: number) => (
                          <DropdownMenuItem
                            key={index}
                            onClick={(e) => {
                              e.stopPropagation();
                              adminUserMenuFunctions[index]();
                            }}
                          >
                            {item}
                          </DropdownMenuItem>
                        ))
                      : instructorUserMenu.map(
                          (item: string, index: number) => (
                            <DropdownMenuItem
                              key={index}
                              onClick={(e) => {
                                e.stopPropagation();
                                instructorUserMenuFunctions[index]();
                              }}
                            >
                              {item}
                            </DropdownMenuItem>
                          )
                        )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="flex items-center gap-1 text-primary text-xs font-medium"
              >
                <ExternalLink className="h-3 w-3" />
                View
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
