import React, { useContext, useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { DialogWrapper } from "./ui-wrappers/DialogWrapper";
import { TooltipWrapper } from "./ui-wrappers/TooltipWrapper";
import { DropdownWrapper } from "./ui-wrappers/DropdownWrapper";
import { FolderType, PromptType } from "../utility/types/CourseTypes";
import { UserContext } from "../utility/context/UserContext";
import Put from "../utility/Put";
import { AlertContext } from "../utility/context/AlertContext";
import {
  postCopyOrgPromptToOrgFolder,
  postCopyOrgPromptToUserFolder,
  postCopyUserPromptToOrgFolder,
  postCopyUserPromptToUserFolder,
  postMoveOrgPromptToOrgFolder,
  postMoveOrgPromptToUserFolder,
  postMoveUserPromptToOrgFolder,
  postMoveUserPromptToUserFolder,
  postUpdateOrgPrompt,
  postUpdateUserPrompt,
} from "../utility/endpoints/FolderEndpoints";
import Post from "../utility/Post";
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
} from "lucide-react";
import { cn } from "../lib/utils";
import { useNavigate } from "react-router";
import ListFolders from "../features/library/ListFolders";
import { truncateString } from "../utility/Helpers";

interface PromptProps {
  prompt: PromptType;
  folder: FolderType;
  keyy: string;
  refreshList: () => void;
  loading: () => void;
  noShowMenu?: boolean;
  onClick?: (
    folderId: string,
    promptId: string,
    isOrgFolder: boolean,
    type: string
  ) => void; //type is "prompt" or "file"
  onCardClick?: (
    folderId: string,
    promptId: string,
    isOrgFolder: boolean
  ) => void;
  showRemove?: boolean;
  selected?: boolean;
  noShowDesc?: boolean;
  isStarred?: boolean;
  disableStarring?: boolean;
}

export const Prompt = (props: PromptProps) => {
  let navigator = useNavigate();
  const { user } = useContext(UserContext);
  const { setAlert } = useContext(AlertContext);
  const [openCopyToDialog, setOpenCopyToDialog] = useState<boolean>(false);
  const [openMoveDialog, setOpenMoveDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [openPreviewDialog, setOpenPreviewDialog] = useState<boolean>(false);
  const [starred, setStarred] = useState<boolean>(
    props.isStarred ? props.isStarred : false
  );

  useEffect(() => {
    setStarred(props.isStarred ? props.isStarred : false);
  }, [props.isStarred]);

  function edit() {
    props.loading();
    if (props.prompt.isOrganizationPrompt) {
      navigator(`/library/org/${props.folder.id}/prompts/${props.prompt.id}`)
    } else {
      navigator(`/library/${props.folder.id}/prompts/${props.prompt.id}`)
    }
  }

  function openCopyTo() {
    setOpenCopyToDialog(true);
  }

  function copyTo(folderId: string, isOrgFolder: boolean) {
    props.loading();
    if (props.prompt.isOrganizationPrompt) {
      if (isOrgFolder) {
        Post(
          postCopyOrgPromptToOrgFolder(
            props.folder.id,
            props.prompt.id,
            folderId
          ),
          {}
        ).then((res) => {
          if (res.status && res.status < 300) {
            setAlert({
              message: "Prompt copied successfully",
              type: "success",
            });
            props.refreshList();
          } else if (res && res.status === 401) {
            navigator("/login");
          } else {
            setAlert({
              message: "Failed to copy prompt",
              type: "error",
            });
          }
          setOpenCopyToDialog(false);
        });
      } else {
        Post(
          postCopyOrgPromptToUserFolder(
            props.folder.id,
            props.prompt.id,
            folderId
          ),
          {}
        ).then((res) => {
          if (res.status && res.status < 300) {
            setAlert({
              message: "Prompt copied successfully",
              type: "success",
            });
            props.refreshList();
          } else if (res && res.status === 401) {
            navigator("/login");
          } else {
            setAlert({
              message: "Failed to copy prompt",
              type: "error",
            });
          }
          setOpenCopyToDialog(false);
        });
      }
    } else {
      if (isOrgFolder) {
        Post(
          postCopyUserPromptToOrgFolder(
            props.folder.id,
            props.prompt.id,
            folderId
          ),
          {}
        ).then((res) => {
          if (res.status && res.status < 300) {
            setAlert({
              message: "Prompt copied successfully",
              type: "success",
            });
            props.refreshList();
          } else if (res && res.status === 401) {
            navigator("/login");
          } else {
            setAlert({
              message: "Failed to copy prompt",
              type: "error",
            });
          }
          setOpenCopyToDialog(false);
        });
      } else {
        Post(
          postCopyUserPromptToUserFolder(
            props.folder.id,
            props.prompt.id,
            folderId
          ),
          {}
        ).then((res) => {
          if (res.status && res.status < 300) {
            setAlert({
              message: "Prompt copied successfully",
              type: "success",
            });
            props.refreshList();
          } else if (res && res.status === 401) {
            navigator("/login");
          } else {
            setAlert({
              message: "Failed to copy prompt",
              type: "error",
            });
          }
          setOpenCopyToDialog(false);
        });
      }
    }
  }

  function deletePrompt() {
    props.loading();
    if (props.prompt.isOrganizationPrompt) {
      const dataToSend = {
        name: props.prompt.name,
        prompt: props.prompt.prompt,
        isDeleted: true,
        tags: props.prompt.tags
      };
      Put(
        postUpdateOrgPrompt(props.folder.id, props.prompt.id),
        dataToSend
      ).then((res) => {
        if (res.status && res.status < 300) {
          setAlert({
            message: "Prompt deleted successfully",
            type: "success",
          });
          props.refreshList();
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          setAlert({
            message: "Failed to delete prompt",
            type: "error",
          });
        }
        setOpenDeleteDialog(false);
      });
    } else {
      const dataToSend = {
        name: props.prompt.name,
        prompt: props.prompt.prompt,
        isDeleted: true,
        tags: props.prompt.tags
      };
      Put(
        postUpdateUserPrompt(props.folder.id, props.prompt.id),
        dataToSend
      ).then((res) => {
        if (res.status && res.status < 300) {
          setAlert({
            message: "Prompt deleted successfully",
            type: "success",
          });
          props.refreshList();
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          setAlert({
            message: "Failed to delete prompt",
            type: "error",
          });
        }
        setOpenDeleteDialog(false);
      });
    }
  }

  function openMovePrompt() {
    setOpenMoveDialog(true);
  }

  function moveTo(folderId: string, isOrgFolder: boolean) {
    props.loading();
    if (props.prompt.isOrganizationPrompt) {
      if (isOrgFolder) {
        Post(
          postMoveOrgPromptToOrgFolder(
            props.folder.id,
            props.prompt.id,
            folderId
          ),
          {}
        ).then((res) => {
          if (res.status && res.status < 300) {
            setAlert({
              message: "Prompt moved successfully",
              type: "success",
            });
            props.refreshList();
          } else if (res && res.status === 401) {
            navigator("/login");
          } else {
            setAlert({
              message: "Failed to move prompt",
              type: "error",
            });
          }
          setOpenMoveDialog(false);
        });
      } else {
        Post(
          postMoveOrgPromptToUserFolder(
            props.folder.id,
            props.prompt.id,
            folderId
          ),
          {}
        ).then((res) => {
          if (res.status && res.status < 300) {
            setAlert({
              message: "Prompt moved successfully",
              type: "success",
            });
            props.refreshList();
          } else if (res && res.status === 401) {
            navigator("/login");
          } else {
            setAlert({
              message: "Failed to move prompt",
              type: "error",
            });
          }
          setOpenMoveDialog(false);
        });
      }
    } else {
      if (isOrgFolder) {
        Post(
          postMoveUserPromptToOrgFolder(
            props.folder.id,
            props.prompt.id,
            folderId
          ),
          {}
        ).then((res) => {
          if (res.status && res.status < 300) {
            setAlert({
              message: "Prompt moved successfully",
              type: "success",
            });
            props.refreshList();
          } else if (res && res.status === 401) {
            navigator("/login");
          } else {
            setAlert({
              message: "Failed to move prompt",
              type: "error",
            });
          }
          setOpenMoveDialog(false);
        });
      } else {
        Post(
          postMoveUserPromptToUserFolder(
            props.folder.id,
            props.prompt.id,
            folderId
          ),
          {}
        ).then((res) => {
          if (res.status && res.status < 300) {
            setAlert({
              message: "Prompt moved successfully",
              type: "success",
            });
            props.refreshList();
          } else if (res && res.status === 401) {
            navigator("/login");
          } else {
            setAlert({
              message: "Failed to move prompt",
              type: "error",
            });
          }
          setOpenMoveDialog(false);
        });
      }
    }
  }

  function createStarredPrompt() {
    Post(postCreateUserFavoritingData(), {
      id: { folderId: props.folder.id, promptId: props.prompt.id },
      type: "prompts",
    }).then((res) => {
      if (res.status && res.status < 300) {
        setStarred(true);
        setAlert({ message: "Prompt starred", type: "success" });
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        setAlert({ message: "Failed to star prompt", type: "error" });
      }
      props.refreshList();
    });
  }

  function removeStarredPrompt() {
    Put(putUpdateUserFavoritingData(), {
      id: { folderId: props.folder.id, promptId: props.prompt.id },
      type: "prompts",
    }).then((res) => {
      if (res.status && res.status < 300) {
        setStarred(false);
        setAlert({ message: "Prompt unstarred", type: "success" });
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        setAlert({ message: "Failed to unstar prompt", type: "error" });
      }
      props.refreshList();
    });
  }

  const toggleStar = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (starred) {
      removeStarredPrompt();
    } else {
      createStarredPrompt();
    }
  };

  const getPromptCategory = () => {
    // Determine category based on prompt content or tags
    if (props.prompt.tags && props.prompt.tags.length > 0) {
      const firstTag = props.prompt.tags[0];
      if (firstTag.toLowerCase().includes("creative")) return "CREATIVE";
      if (firstTag.toLowerCase().includes("technical")) return "TECHNICAL";
      if (firstTag.toLowerCase().includes("business")) return "BUSINESS";
      if (firstTag.toLowerCase().includes("academic")) return "ACADEMIC";
    }
    return "PROMPT";
  };

  const getPromptPreview = () => {
    // Extract a preview from the prompt content
    const preview = truncateString(props.prompt.prompt, 150);
    return preview;
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
    () => setOpenPreviewDialog(true),
    starred ? removeStarredPrompt : createStarredPrompt,
    edit,
    openCopyTo,
    openMovePrompt,
    () => setOpenDeleteDialog(true),
  ];
  const instructorOrgMenuFunctions = [
    () => setOpenPreviewDialog(true),
    starred ? removeStarredPrompt : createStarredPrompt,
    openCopyTo,
  ];
  const adminUserMenuFunctions = [
    () => setOpenPreviewDialog(true),
    starred ? removeStarredPrompt : createStarredPrompt,
    edit,
    openCopyTo,
    openMovePrompt,
    () => setOpenDeleteDialog(true),
  ];
  const instructorUserMenuFunctions = [
    () => setOpenPreviewDialog(true),
    starred ? removeStarredPrompt : createStarredPrompt,
    edit,
    openCopyTo,
    openMovePrompt,
    () => setOpenDeleteDialog(true),
  ];

  return (
    <div key={props.keyy ? props.keyy : "key"}>
      {/* Preview Dialog */}
      <DialogWrapper
        open={openPreviewDialog}
        onOpenChange={setOpenPreviewDialog}
        title={props.prompt.name}
        description="Full prompt content"
        contentClassName="max-w-4xl max-h-[80vh]"
        actions={[
          {
            label: "Close",
            onClick: () => setOpenPreviewDialog(false),
            variant: "outline",
          },
        ]}
      >
        <div className="max-h-96 overflow-y-auto">
          <div className="bg-muted/50 border rounded-lg p-4">
            <pre className="text-sm text-muted-foreground font-mono whitespace-pre-wrap break-words">
              {props.prompt.prompt}
            </pre>
          </div>
        </div>
      </DialogWrapper>

      {/* Delete Dialog */}
      <DialogWrapper
        open={openDeleteDialog}
        onOpenChange={setOpenDeleteDialog}
        title="Delete Prompt?"
        description="Are you sure you would like to permanently delete this prompt?"
        actions={[
          {
            label: "Cancel",
            onClick: () => setOpenDeleteDialog(false),
            variant: "outline",
          },
          {
            label: "Delete",
            onClick: deletePrompt,
            variant: "destructive",
          },
        ]}
      />

      {/* Copy To Dialog */}
      <DialogWrapper
        open={openCopyToDialog}
        onOpenChange={setOpenCopyToDialog}
        title="Copy Prompt To?"
        description="Select a folder to copy this prompt to."
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
        title="Move Prompt To?"
        description="Select a folder to move this prompt to."
        contentClassName="max-w-2xl"
        actions={[
          {
            label: "Cancel",
            onClick: () => setOpenMoveDialog(false),
            variant: "outline",
          },
        ]}
      >
        <div className="max-h-96 overflow-y-auto">
          <ListFolders
            noShowMenu
            onClick={moveTo}
            disableFolderId={props.folder.id}
            compactGrid
          />
        </div>
      </DialogWrapper>

      <Card className="h-full hover:shadow-md transition-shadow duration-200 group">
        <CardContent className="p-4 h-full flex flex-col">
          {/* Header with icon, category, and star */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-primary uppercase tracking-wide">
                {getPromptCategory()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {!props.disableStarring && (
                <TooltipWrapper
                  content={starred ? "Unstar Prompt" : "Star Prompt"}
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
                    >
                      <MoreHorizontal className="h-[1em] w-[1em]" />
                    </Button>
                  }
                  actions={
                    props.prompt.isOrganizationPrompt
                      ? user?.groups.includes(
                        process.env.REACT_APP_ADMIN
                          ? process.env.REACT_APP_ADMIN
                          : "PapyrusAIAdmin"
                      )
                        ? adminOrgMenu.map((item: string, index: number) => ({
                          label: item,
                          onClick: () => {
                            adminOrgMenuFunctions[index]();
                          },
                          type: "button" as const,
                        }))
                        : instructorOrgMenu.map(
                          (item: string, index: number) => ({
                            label: item,
                            onClick: () => {
                              instructorOrgMenuFunctions[index]();
                            },
                            type: "button" as const,
                          })
                        )
                      : user?.groups.includes(
                        process.env.REACT_APP_ADMIN
                          ? process.env.REACT_APP_ADMIN
                          : "PapyrusAIAdmin"
                      )
                        ? adminUserMenu.map((item: string, index: number) => ({
                          label: item,
                          onClick: () => {
                            adminUserMenuFunctions[index]();
                          },
                          type: "button" as const,
                        }))
                        : instructorUserMenu.map(
                          (item: string, index: number) => ({
                            label: item,
                            onClick: () => {
                              instructorUserMenuFunctions[index]();
                            },
                            type: "button" as const,
                          })
                        )
                  }
                  align="end"
                  tooltipContent="Prompt Options"
                  tooltipSide="top"
                />
              )}
            </div>
          </div>

          {/* Prompt title */}
          <h3 className="font-semibold text-foreground mb-2 text-lg leading-tight">
            {props.prompt.name}
          </h3>

          {/* Prompt preview box */}
          <div
            className="bg-muted/50 border rounded-lg p-3 mb-4 mt-auto cursor-pointer hover:bg-muted/70 transition-colors"
            onClick={() => setOpenPreviewDialog(true)}
          >
            <p className="text-sm text-muted-foreground font-mono">
              {getPromptPreview()}
            </p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-4">
            {props.prompt.tags &&
              props.prompt.tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs bg-green-50 text-green-700 border-green-200 pointer-events-none"
                >
                  {tag}
                </Badge>
              ))}
          </div>

          {/* Footer with actions */}
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-2">

            </div>
            {props.noShowMenu ? (
              props.showRemove ? (
                <TooltipWrapper content="Remove prompt from module" side="top">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 text-xs font-medium text-destructive hover:bg-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (props.onClick) {
                        props.onClick(
                          props.folder.id,
                          props.prompt.id,
                          props.prompt.isOrganizationPrompt ?? false,
                          "prompt"
                        );
                      }
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                    Remove
                  </Button>
                </TooltipWrapper>
              ) : (
                <TooltipWrapper content="Add prompt to module" side="top">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (props.onClick) {
                        props.onClick(
                          props.folder.id,
                          props.prompt.id,
                          props.prompt.isOrganizationPrompt ?? false,
                          "prompt"
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
                className="flex items-center gap-1 text-primary text-xs font-medium"
                onClick={() => setOpenPreviewDialog(true)}
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
