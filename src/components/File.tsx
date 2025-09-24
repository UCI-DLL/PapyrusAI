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
import { FileType, FolderType } from "../utility/types/CourseTypes";
import { UserContext } from "../utility/context/UserContext";
import Put from "../utility/Put";
import { AlertContext } from "../utility/context/AlertContext";
import {
  postCopyOrgFileToOrgFolder,
  postCopyOrgFileToUserFolder,
  postCopyUserFileToOrgFolder,
  postCopyUserFileToUserFolder,
  postMoveOrgFileToOrgFolder,
  postMoveOrgFileToUserFolder,
  postMoveUserFileToOrgFolder,
  postMoveUserFileToUserFolder,
  putUpdateOrgFile,
  putUpdateUserFile,
} from "../utility/endpoints/FolderEndpoints";
import Post from "../utility/Post";
import {
  postCreateUserFavoritingData,
  putUpdateUserFavoritingData,
} from "../utility/endpoints/UserEndpoints";
import { Star, FileText, MoreHorizontal, Eye, Plus, Trash2 } from "lucide-react";
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
import { useNavigate } from "react-router";
import ListFolders from "../features/library/ListFolders";

interface FileProps {
  file: FileType;
  folder: FolderType;
  keyy: string;
  refreshList: () => void;
  loading: () => void;
  noShowMenu?: boolean;
  onClick?: (
    folderId: string,
    fileId: string,
    isOrgFolder: boolean,
    type: string
  ) => void; //type is "prompt" or "file"
  showRemove?: boolean;
  isStarred?: boolean;
}

export const File = (props: FileProps) => {
  let navigator = useNavigate();
  const { user } = useContext(UserContext);
  const { setAlert } = useContext(AlertContext);
  const [openCopyToDialog, setOpenCopyToDialog] = useState<boolean>(false);
  const [openMoveDialog, setOpenMoveDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [starred, setStarred] = useState<boolean>(
    props.isStarred ? props.isStarred : false
  );

  useEffect(() => {
    setStarred(props.isStarred ? props.isStarred : false);
  }, [props.isStarred]);

  function edit() {
    if (props.folder) {
      props.loading();
      if (props.file.isOrganizationFile) {
        navigator(`/library/org/${props.folder.id}/files/${props.file.id}`);
      } else {
        navigator(`/library/${props.folder.id}/files/${props.file.id}`);
      }
    }
  }

  function openCopyTo() {
    setOpenCopyToDialog(true);
  }

  function copyTo(folderId: string, isOrgFolder: boolean) {
    props.loading();
    if (props.file.isOrganizationFile) {
      if (isOrgFolder) {
        Post(
          postCopyOrgFileToOrgFolder(props.file.id, folderId, props.folder.id),
          {}
        ).then((res) => {
          if (res.status && res.status < 300) {
            setAlert({
              message: "File copied successfully",
              type: "success",
            });
            props.refreshList();
          } else if (res && res.status === 401) {
            navigator("/login");
          } else {
            setAlert({
              message: "Failed to copy file",
              type: "error",
            });
          }
          setOpenCopyToDialog(false);
        });
      } else {
        Post(
          postCopyOrgFileToUserFolder(props.file.id, folderId, props.folder.id),
          {}
        ).then((res) => {
          if (res.status && res.status < 300) {
            setAlert({
              message: "File copied successfully",
              type: "success",
            });
            props.refreshList();
          } else if (res && res.status === 401) {
            navigator("/login");
          } else {
            setAlert({
              message: "Failed to copy file",
              type: "error",
            });
          }
          setOpenCopyToDialog(false);
        });
      }
    } else {
      if (isOrgFolder) {
        Post(
          postCopyUserFileToOrgFolder(props.file.id, folderId, props.folder.id),
          {}
        ).then((res) => {
          if (res.status && res.status < 300) {
            setAlert({
              message: "File copied successfully",
              type: "success",
            });
            props.refreshList();
          } else if (res && res.status === 401) {
            navigator("/login");
          } else {
            setAlert({
              message: "Failed to copy file",
              type: "error",
            });
          }
          setOpenCopyToDialog(false);
        });
      } else {
        Post(
          postCopyUserFileToUserFolder(
            props.file.id,
            folderId,
            props.folder.id
          ),
          {}
        ).then((res) => {
          if (res.status && res.status < 300) {
            setAlert({
              message: "File copied successfully",
              type: "success",
            });
            props.refreshList();
          } else if (res && res.status === 401) {
            navigator("/login");
          } else {
            setAlert({
              message: "Failed to copy file",
              type: "error",
            });
          }
          setOpenCopyToDialog(false);
        });
      }
    }
  }

  function deleteFile() {
    props.loading();
    if (props.file.isOrganizationFile) {
      const dataToSend = {
        name: props.file.name,
        isDeleted: true,
      };
      Put(putUpdateOrgFile(props.file.id, props.folder.id), dataToSend).then(
        (res) => {
          if (res.status && res.status < 300) {
            setAlert({
              message: "File deleted successfully",
              type: "success",
            });
            props.refreshList();
          } else if (res && res.status === 401) {
            navigator("/login");
          } else {
            setAlert({
              message: "Failed to delete file",
              type: "error",
            });
          }
          setOpenDeleteDialog(false);
        }
      );
    } else {
      const dataToSend = {
        name: props.file.name,
        isDeleted: true,
      };
      Put(putUpdateUserFile(props.file.id, props.folder.id), dataToSend).then(
        (res) => {
          if (res.status && res.status < 300) {
            setAlert({
              message: "File deleted successfully",
              type: "success",
            });
            props.refreshList();
          } else if (res && res.status === 401) {
            navigator("/login");
          } else {
            setAlert({
              message: "Failed to delete file",
              type: "error",
            });
          }
          setOpenDeleteDialog(false);
        }
      );
    }
  }

  function openMoveFile() {
    setOpenMoveDialog(true);
  }

  function moveTo(folderId: string, isOrgFolder: boolean) {
    props.loading();
    if (props.file.isOrganizationFile) {
      if (isOrgFolder) {
        Post(
          postMoveOrgFileToOrgFolder(props.file.id, folderId, props.folder.id),
          {}
        ).then((res) => {
          if (res.status && res.status < 300) {
            setAlert({
              message: "File moved successfully",
              type: "success",
            });
            props.refreshList();
          } else if (res && res.status === 401) {
            navigator("/login");
          } else {
            setAlert({
              message: "Failed to move file",
              type: "error",
            });
          }
          setOpenMoveDialog(false);
        });
      } else {
        Post(
          postMoveOrgFileToUserFolder(props.file.id, folderId, props.folder.id),
          {}
        ).then((res) => {
          if (res.status && res.status < 300) {
            setAlert({
              message: "File moved successfully",
              type: "success",
            });
            props.refreshList();
          } else if (res && res.status === 401) {
            navigator("/login");
          } else {
            setAlert({
              message: "Failed to move file",
              type: "error",
            });
          }
          setOpenMoveDialog(false);
        });
      }
    } else {
      if (isOrgFolder) {
        Post(
          postMoveUserFileToOrgFolder(props.file.id, folderId, props.folder.id),
          {}
        ).then((res) => {
          if (res.status && res.status < 300) {
            setAlert({
              message: "File moved successfully",
              type: "success",
            });
            props.refreshList();
          } else if (res && res.status === 401) {
            navigator("/login");
          } else {
            setAlert({
              message: "Failed to move file",
              type: "error",
            });
          }
          setOpenMoveDialog(false);
        });
      } else {
        Post(
          postMoveUserFileToUserFolder(
            props.file.id,
            folderId,
            props.folder.id
          ),
          {}
        ).then((res) => {
          if (res.status && res.status < 300) {
            setAlert({
              message: "File moved successfully",
              type: "success",
            });
            props.refreshList();
          } else if (res && res.status === 401) {
            navigator("/login");
          } else {
            setAlert({
              message: "Failed to move file",
              type: "error",
            });
          }
          setOpenMoveDialog(false);
        });
      }
    }
  }

  function createStarredFile() {
    Post(postCreateUserFavoritingData(), {
      files: [{ fileId: props.file.id, folderId: props.folder.id }],
    }).then((res) => {
      if (res.status && res.status < 300) {
        setStarred(true);
        setAlert({ message: "File starred", type: "success" });
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        setAlert({ message: "Failed to star file", type: "error" });
      }
    });
  }

  function removeStarredFile() {
    Put(putUpdateUserFavoritingData(), {
      files: starred
        ? [{ fileId: props.file.id, folderId: props.folder.id }]
        : [],
    }).then((res) => {
      if (res.status && res.status < 300) {
        setStarred(false);
        setAlert({ message: "File unstarred", type: "success" });
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        setAlert({ message: "Failed to unstar file", type: "error" });
      }
    });
  }

  const toggleStar = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (starred) {
      removeStarredFile();
    } else {
      createStarredFile();
    }
  };

  const getFileType = () => {
    const extension = props.file.name.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "pdf":
        return "PDF";
      case "doc":
      case "docx":
        return "DOC";
      case "txt":
        return "TXT";
      case "jpg":
      case "jpeg":
      case "png":
        return "IMG";
      default:
        return "FILE";
    }
  };

  const getFileDescription = () => {
    // Generate a description based on the file name and type
    const fileName = props.file.name;
    if (fileName.toLowerCase().includes("guidelines"))
      return "Comprehensive guide on development and implementation";
    if (fileName.toLowerCase().includes("style"))
      return "Design guidelines and brand standards";
    if (fileName.toLowerCase().includes("manual"))
      return "User manual and documentation";
    return "Document file for reference and use";
  };

  const adminOrgMenu = [
    "View",
    starred ? "Unstar" : "Star",
    "Edit",
    "Copy To",
    "Move To",
    "Delete",
  ];
  const instructorOrgMenu = ["View", starred ? "Unstar" : "Star", "Copy To"];
  const adminUserMenu = [
    "View",
    starred ? "Unstar" : "Star",
    "Edit",
    "Copy To",
    "Move To",
    "Delete",
  ];
  const instructorUserMenu = [
    "View",
    starred ? "Unstar" : "Star",
    "Edit",
    "Copy To",
    "Move To",
    "Delete",
  ];

  const adminOrgMenuFunctions = [
    () => {},
    starred ? removeStarredFile : createStarredFile,
    edit,
    openCopyTo,
    openMoveFile,
    () => setOpenDeleteDialog(true),
  ];
  const instructorOrgMenuFunctions = [
    () => {},
    starred ? removeStarredFile : createStarredFile,
    openCopyTo,
  ];
  const adminUserMenuFunctions = [
    () => {},
    starred ? removeStarredFile : createStarredFile,
    edit,
    openCopyTo,
    openMoveFile,
    () => setOpenDeleteDialog(true),
  ];
  const instructorUserMenuFunctions = [
    () => {},
    starred ? removeStarredFile : createStarredFile,
    edit,
    openCopyTo,
    openMoveFile,
    () => setOpenDeleteDialog(true),
  ];

  return (
    <div key={props.keyy ? props.keyy : "key"}>
      {/* Delete Dialog */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete File?</DialogTitle>
            <DialogDescription>
              Are you sure you would like to permanently delete this file?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteFile}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Copy To Dialog */}
      <Dialog open={openCopyToDialog} onOpenChange={setOpenCopyToDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Copy File To?</DialogTitle>
            <DialogDescription>
              Select a folder to copy this file to.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <ListFolders noShowMenu onClick={copyTo} compactGrid />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpenCopyToDialog(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move To Dialog */}
      <Dialog open={openMoveDialog} onOpenChange={setOpenMoveDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Move File To?</DialogTitle>
            <DialogDescription>
              Select a folder to move this file to.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 w-90vw overflow-y-auto">
            <ListFolders
              noShowMenu
              onClick={moveTo}
              disableFolderId={props.folder.id}
              compactGrid
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenMoveDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="h-full cursor-pointer" onClick={edit}>
        <CardContent className="p-4 h-full flex flex-col">
          {/* Header with icon, file type, and star */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-orange-600" />
              <span className="text-xs font-medium text-orange-600 uppercase tracking-wide">
                {getFileType()}
              </span>
            </div>
            <div className="flex items-center gap-2">
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
                    {starred ? "Unstar File" : "Star File"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* File title */}
          <h3 className="font-semibold text-foreground mb-2 text-lg leading-tight">
            {props.file.name}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-4 flex-grow leading-relaxed">
            {getFileDescription()}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-4">
            {props.file.tags &&
              props.file.tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs bg-green-50 text-green-700 border-green-200"
                >
                  {tag}
                </Badge>
              ))}
          </div>
          <div className="flex w-full items-center justify-between">
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
                    {props.file.isOrganizationFile
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
            </div>
            {props.noShowMenu ? (
              props.showRemove ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-1 text-xs font-medium text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (props.onClick) {
                            props.onClick(
                              props.folder.id,
                              props.file.id,
                              props.file.isOrganizationFile ?? false,
                              "file"
                            );
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                        Remove
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      Remove file from module
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (props.onClick) {
                            props.onClick(
                              props.folder.id,
                              props.file.id,
                              props.file.isOrganizationFile ?? false,
                              "file"
                            );
                          }
                        }}
                      >
                        <Plus className="h-3 w-3" />
                        Add
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      Add file to module
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1 text-xs font-medium text-primary"
              >
                <Eye className="h-3 w-3" />
                View
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
