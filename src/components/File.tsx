import React, { useContext, useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { DialogWrapper } from "./ui-wrappers/DialogWrapper";
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
import {
  Star,
  FileText,
  MoreHorizontal,
  Eye,
  Plus,
  Trash2,
} from "lucide-react";
import { DropdownWrapper } from "./ui-wrappers/DropdownWrapper";
import { TooltipWrapper } from "./ui-wrappers/TooltipWrapper";
import { cn } from "../lib/utils";
import { useNavigate, Link } from "react-router-dom";
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
  disableStarring?: boolean;
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

  const getEditUrl = () => {
    if (props.file.isOrganizationFile) {
      return `/library/org/${props.folder.id}/files/${props.file.id}`;
    } else {
      return `/library/${props.folder.id}/files/${props.file.id}`;
    }
  };

  function openCopyTo() {
    setOpenCopyToDialog(true);
  }

  function copyTo(folderId: string, isOrgFolder: boolean) {
    props.loading();
    if (props.file.isOrganizationFile) {
      if (isOrgFolder) {
        Post(
          postCopyOrgFileToOrgFolder(props.folder.id, props.file.id, folderId),
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
          postCopyOrgFileToUserFolder(props.folder.id, props.file.id, folderId),
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
          postCopyUserFileToOrgFolder(props.folder.id, props.file.id, folderId),
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
            props.folder.id, props.file.id, folderId
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
        tags: props.file.tags,
        id: props.file.id,
      };
      Put(putUpdateOrgFile(props.folder.id, props.file.id), dataToSend).then(
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
        tags: props.file.tags,
        id: props.file.id,
      };
      Put(putUpdateUserFile(props.folder.id, props.file.id), dataToSend).then(
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
          postMoveOrgFileToOrgFolder(props.folder.id, props.file.id, folderId),
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
          postMoveOrgFileToUserFolder(props.folder.id, props.file.id, folderId),
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
          postMoveUserFileToOrgFolder(props.folder.id, props.file.id, folderId),
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
            props.folder.id, props.file.id, folderId
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
      id: { folderId: props.folder.id, fileId: props.file.id },
      type: "files",
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
      id: { folderId: props.folder.id, fileId: props.file.id },
      type: "files",
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
    { label: "View", type: "link" as const, action: getEditUrl() },
    {
      label: starred ? "Unstar" : "Star",
      type: "function" as const,
      action: starred ? removeStarredFile : createStarredFile,
    },
    { label: "Edit", type: "link" as const, action: getEditUrl() },
    { label: "Copy To", type: "function" as const, action: openCopyTo },
    { label: "Move To", type: "function" as const, action: openMoveFile },
    {
      label: "Delete",
      type: "function" as const,
      action: () => setOpenDeleteDialog(true),
    },
  ];
  const instructorOrgMenu = [
    { label: "View", type: "link" as const, action: getEditUrl() },
    {
      label: starred ? "Unstar" : "Star",
      type: "function" as const,
      action: starred ? removeStarredFile : createStarredFile,
    },
    { label: "Copy To", type: "function" as const, action: openCopyTo },
  ];
  const adminUserMenu = [
    { label: "View", type: "link" as const, action: getEditUrl() },
    {
      label: starred ? "Unstar" : "Star",
      type: "function" as const,
      action: starred ? removeStarredFile : createStarredFile,
    },
    { label: "Edit", type: "link" as const, action: getEditUrl() },
    { label: "Copy To", type: "function" as const, action: openCopyTo },
    { label: "Move To", type: "function" as const, action: openMoveFile },
    {
      label: "Delete",
      type: "function" as const,
      action: () => setOpenDeleteDialog(true),
    },
  ];
  const instructorUserMenu = [
    { label: "View", type: "link" as const, action: getEditUrl() },
    {
      label: starred ? "Unstar" : "Star",
      type: "function" as const,
      action: starred ? removeStarredFile : createStarredFile,
    },
    { label: "Edit", type: "link" as const, action: getEditUrl() },
    { label: "Copy To", type: "function" as const, action: openCopyTo },
    { label: "Move To", type: "function" as const, action: openMoveFile },
    {
      label: "Delete",
      type: "function" as const,
      action: () => setOpenDeleteDialog(true),
    },
  ];

  return (
    <div key={props.keyy ? props.keyy : "key"}>
      {/* Delete Dialog */}
      <DialogWrapper
        open={openDeleteDialog}
        onOpenChange={setOpenDeleteDialog}
        title="Delete File?"
        description="Are you sure you would like to permanently delete this file?"
        actions={[
          {
            label: "Cancel",
            onClick: () => setOpenDeleteDialog(false),
            variant: "outline",
          },
          {
            label: "Delete",
            onClick: deleteFile,
            variant: "destructive",
          },
        ]}
      />

      {/* Copy To Dialog */}
      <DialogWrapper
        open={openCopyToDialog}
        onOpenChange={setOpenCopyToDialog}
        title="Copy File To?"
        description="Select a folder to copy this file to."
        contentClassName="max-w-2xl"
        actions={[
          {
            label: "Cancel",
            onClick: () => setOpenCopyToDialog(false),
            variant: "outline",
          },
        ]}
      >
        <div className="max-h-96 overflow-y-auto">
          <ListFolders noShowMenu onClick={copyTo} compactGrid />
        </div>
      </DialogWrapper>

      {/* Move To Dialog */}
      <DialogWrapper
        open={openMoveDialog}
        onOpenChange={setOpenMoveDialog}
        title="Move File To?"
        description="Select a folder to move this file to."
        contentClassName="max-w-2xl"
        actions={[
          {
            label: "Cancel",
            onClick: () => setOpenMoveDialog(false),
            variant: "outline",
          },
        ]}
      >
        <div className="max-h-96 w-90vw overflow-y-auto">
          <ListFolders
            noShowMenu
            onClick={moveTo}
            disableFolderId={props.folder.id}
            compactGrid
          />
        </div>
      </DialogWrapper>

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
                  content={starred ? "Unstar File" : "Star File"}
                  side="top"
                >
                  <button
                    onClick={toggleStar}
                    className={cn(
                      "p-1 rounded-full transition-all duration-300",
                      starred
                        ? "text-gold hover:text-muted text-lg"
                        : "text-muted hover:text-gold text-lg"
                    )}
                    aria-label={
                      starred ? "Remove from favorites" : "Add to favorites"
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
              )}
              {!props.noShowMenu && (
                <DropdownWrapper
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex text-lg items-center p-1"
                      onClick={(e) => e.stopPropagation()}
                      aria-label="More Options"
                    >
                      <MoreHorizontal className="h-[1em] w-[1em]" />
                    </Button>
                  }
                  actions={(props.file.isOrganizationFile
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
                        props.loading();
                      } else {
                        item.action();
                      }
                    },
                    type: item.type,
                    href: item.type === "link" ? item.action : undefined,
                    className: item.label === "Delete" ? "text-destructive focus:bg-destructive focus:text-destructive-foreground" : ""
                  }))}
                  align="end"
                />
              )}
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
                  className="text-xs bg-green-50 text-green-700 border-green-200 pointer-events-none"
                >
                  {tag}
                </Badge>
              ))}
          </div>
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">

            </div>
            {props.noShowMenu ? (
              props.showRemove ? (
                <TooltipWrapper content="Remove file from module" side="top">
                  <Button
                    variant="ghost"
                    type="button"
                    size="sm"
                    className="flex items-center gap-1 text-xs font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground"
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
                </TooltipWrapper>
              ) : (
                <TooltipWrapper content="Add file to module" side="top">
                  <Button
                    variant="ghost"
                    type="button"
                    size="sm"
                    className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:bg-primary hover:text-primary-foreground"
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
                aria-label="View"
              >
                <Link
                  to={getEditUrl()}
                  className="flex items-center gap-1 no-underline"
                >
                  <Eye className="h-3 w-3" />
                  View
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
