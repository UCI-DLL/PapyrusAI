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
    StarOff as StarBorder,
    MessageSquare,
    MoreHorizontal,
    ExternalLink,
    Eye,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
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
}

export const Prompt = (props: PromptProps) => {
    let navigator = useNavigate();
    const { user } = useContext(UserContext);
    const { setAlert } = useContext(AlertContext);
    const [openCopyToDialog, setOpenCopyToDialog] = useState<boolean>(false);
    const [openMoveDialog, setOpenMoveDialog] = useState<boolean>(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
    const [openEditDialog, setOpenEditDialog] = useState<boolean>(false);
    const [editPromptText, setEditPromptText] = useState<string>(
        props.prompt.prompt
    );
    const [editNameText, setEditNameText] = useState<string>(props.prompt.name);
    const [starred, setStarred] = useState<boolean>(
        props.isStarred ? props.isStarred : false
    );

    useEffect(() => {
        setStarred(props.isStarred ? props.isStarred : false);
    }, [props.isStarred]);

    function edit() {
        props.loading();
        if (props.prompt.isOrganizationPrompt) {
            const dataToSend = {
                name: editNameText,
                prompt: editPromptText,
                isDeleted: props.prompt.isDeleted,
            };
            Put(
                postUpdateOrgPrompt(props.prompt.id, props.folder.id),
                dataToSend
            ).then((res) => {
                if (res.status && res.status < 300) {
                    setAlert({
                        message: "Prompt updated successfully",
                        type: "success",
                    });
                    props.refreshList();
                } else if (res && res.status === 401) {
                    navigator("/login");
                } else {
                    setAlert({
                        message: "Failed to update prompt",
                        type: "error",
                    });
                }
                setOpenEditDialog(false);
            });
        } else {
            const dataToSend = {
                name: editNameText,
                prompt: editPromptText,
                isDeleted: props.prompt.isDeleted,
            };
            Put(
                postUpdateUserPrompt(props.prompt.id, props.folder.id),
                dataToSend
            ).then((res) => {
                if (res.status && res.status < 300) {
                    setAlert({
                        message: "Prompt updated successfully",
                        type: "success",
                    });
                    props.refreshList();
                } else if (res && res.status === 401) {
                    navigator("/login");
                } else {
                    setAlert({
                        message: "Failed to update prompt",
                        type: "error",
                    });
                }
                setOpenEditDialog(false);
            });
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
                        props.prompt.id,
                        folderId,
                        props.folder.id
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
                        props.prompt.id,
                        folderId,
                        props.folder.id
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
                        props.prompt.id,
                        folderId,
                        props.folder.id
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
                        props.prompt.id,
                        folderId,
                        props.folder.id
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
            };
            Put(
                postUpdateOrgPrompt(props.prompt.id, props.folder.id),
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
            };
            Put(
                postUpdateUserPrompt(props.prompt.id, props.folder.id),
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
                        props.prompt.id,
                        folderId,
                        props.folder.id
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
                        props.prompt.id,
                        folderId,
                        props.folder.id
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
                        props.prompt.id,
                        folderId,
                        props.folder.id
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
                        props.prompt.id,
                        folderId,
                        props.folder.id
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
            prompts: [{ promptId: props.prompt.id, folderId: props.folder.id }],
        }).then((res) => {
            if (res.status && res.status < 300) {
                setStarred(true);
                setAlert({ message: "Prompt starred", type: "success" });
            } else if (res && res.status === 401) {
                navigator("/login");
            } else {
                setAlert({ message: "Failed to star prompt", type: "error" });
            }
        });
    }

    function removeStarredPrompt() {
        Put(putUpdateUserFavoritingData(), {
            prompts: starred
                ? [{ promptId: props.prompt.id, folderId: props.folder.id }]
                : [],
        }).then((res) => {
            if (res.status && res.status < 300) {
                setStarred(false);
                setAlert({ message: "Prompt unstarred", type: "success" });
            } else if (res && res.status === 401) {
                navigator("/login");
            } else {
                setAlert({ message: "Failed to unstar prompt", type: "error" });
            }
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
            if (firstTag.toLowerCase().includes("technical"))
                return "TECHNICAL";
            if (firstTag.toLowerCase().includes("business")) return "BUSINESS";
            if (firstTag.toLowerCase().includes("academic")) return "ACADEMIC";
        }
        return "PROMPT";
    };

    const getPromptPreview = () => {
        // Extract a preview from the prompt content
        const preview = truncateString(props.prompt.prompt, 100);
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
        () => {},
        starred ? removeStarredPrompt : createStarredPrompt,
        () => setOpenEditDialog(true),
        openCopyTo,
        openMovePrompt,
        () => setOpenDeleteDialog(true),
    ];
    const instructorOrgMenuFunctions = [
        () => {},
        starred ? removeStarredPrompt : createStarredPrompt,
        openCopyTo,
    ];
    const adminUserMenuFunctions = [
        () => {},
        starred ? removeStarredPrompt : createStarredPrompt,
        () => setOpenEditDialog(true),
        openCopyTo,
        openMovePrompt,
        () => setOpenDeleteDialog(true),
    ];
    const instructorUserMenuFunctions = [
        () => {},
        starred ? removeStarredPrompt : createStarredPrompt,
        () => setOpenEditDialog(true),
        openCopyTo,
        openMovePrompt,
        () => setOpenDeleteDialog(true),
    ];

    return (
        <div key={props.keyy ? props.keyy : "key"}>
            {/* Delete Dialog */}
            <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Prompt?</DialogTitle>
                        <DialogDescription>
                            Are you sure you would like to permanently delete
                            this prompt?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setOpenDeleteDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={deletePrompt}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Copy To Dialog */}
            <Dialog open={openCopyToDialog} onOpenChange={setOpenCopyToDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Copy Prompt To?</DialogTitle>
                        <DialogDescription>
                            Select a folder to copy this prompt to.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-96 overflow-y-auto">
                        <ListFolders noShowMenu onClick={copyTo} />
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
                        <DialogTitle>Move Prompt To?</DialogTitle>
                        <DialogDescription>
                            Select a folder to move this prompt to.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-96 overflow-y-auto">
                        <ListFolders
                            noShowMenu
                            onClick={moveTo}
                            disableFolderId={props.folder.id}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setOpenMoveDialog(false)}
                        >
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Prompt</DialogTitle>
                        <DialogDescription>
                            Update the prompt name and content.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="prompt-name">Prompt Name</Label>
                            <Input
                                id="prompt-name"
                                value={editNameText}
                                onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>
                                ) => {
                                    setEditNameText(e.target.value);
                                }}
                                placeholder="Enter prompt name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="prompt-content">
                                Prompt Content
                            </Label>
                            <textarea
                                id="prompt-content"
                                value={editPromptText}
                                onChange={(
                                    e: React.ChangeEvent<HTMLTextAreaElement>
                                ) => {
                                    setEditPromptText(e.target.value);
                                }}
                                placeholder="Enter prompt content"
                                className="w-full min-h-[200px] p-3 border border-gray-300 rounded-md resize-none"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setOpenEditDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                setOpenEditDialog(false);
                                edit();
                            }}
                        >
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Card className="h-full hover:shadow-md transition-shadow duration-200 cursor-pointer group">
                <CardContent className="p-4 h-full flex flex-col">
                    {/* Header with icon, category, and star */}
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-blue-600" />
                            <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                                {getPromptCategory()}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={toggleStar}
                                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                {starred ? (
                                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                ) : (
                                    <StarBorder className="h-4 w-4 text-gray-400" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Prompt title */}
                    <h3 className="font-semibold text-gray-900 mb-2 text-lg leading-tight">
                        {props.prompt.name}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-4 flex-grow leading-relaxed">
                        {props.prompt.prompt.length > 100
                            ? truncateString(props.prompt.prompt, 100) + "..."
                            : props.prompt.prompt}
                    </p>

                    {/* Prompt preview box */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-gray-700 font-mono">
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
                                    className="text-xs bg-green-50 text-green-700 border-green-200"
                                >
                                    {tag}
                                </Badge>
                            ))}
                    </div>

                    {/* Footer with actions */}
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                            {!props.noShowMenu && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <MoreHorizontal className="h-3 w-3" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {props.prompt.isOrganizationPrompt
                                            ? user?.groups.includes(
                                                  process.env.REACT_APP_ADMIN
                                                      ? process.env
                                                            .REACT_APP_ADMIN
                                                      : "PapyrusAIAdmin"
                                              )
                                                ? adminOrgMenu.map(
                                                      (
                                                          item: string,
                                                          index: number
                                                      ) => (
                                                          <DropdownMenuItem
                                                              key={index}
                                                              onClick={(e) => {
                                                                  e.stopPropagation();
                                                                  adminOrgMenuFunctions[
                                                                      index
                                                                  ]();
                                                              }}
                                                          >
                                                              {item}
                                                          </DropdownMenuItem>
                                                      )
                                                  )
                                                : instructorOrgMenu.map(
                                                      (
                                                          item: string,
                                                          index: number
                                                      ) => (
                                                          <DropdownMenuItem
                                                              key={index}
                                                              onClick={(e) => {
                                                                  e.stopPropagation();
                                                                  instructorOrgMenuFunctions[
                                                                      index
                                                                  ]();
                                                              }}
                                                          >
                                                              {item}
                                                          </DropdownMenuItem>
                                                      )
                                                  )
                                            : user?.groups.includes(
                                                  process.env.REACT_APP_ADMIN
                                                      ? process.env
                                                            .REACT_APP_ADMIN
                                                      : "PapyrusAIAdmin"
                                              )
                                            ? adminUserMenu.map(
                                                  (
                                                      item: string,
                                                      index: number
                                                  ) => (
                                                      <DropdownMenuItem
                                                          key={index}
                                                          onClick={(e) => {
                                                              e.stopPropagation();
                                                              adminUserMenuFunctions[
                                                                  index
                                                              ]();
                                                          }}
                                                      >
                                                          {item}
                                                      </DropdownMenuItem>
                                                  )
                                              )
                                            : instructorUserMenu.map(
                                                  (
                                                      item: string,
                                                      index: number
                                                  ) => (
                                                      <DropdownMenuItem
                                                          key={index}
                                                          onClick={(e) => {
                                                              e.stopPropagation();
                                                              instructorUserMenuFunctions[
                                                                  index
                                                              ]();
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
                        <div className="flex items-center gap-1 text-blue-600 text-xs font-medium">
                            <Eye className="h-3 w-3" />
                            View
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
