import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import { TagType } from "../../utility/types/CourseTypes";
import Get from "../../utility/Get";
import { UserContext } from "../../utility/context/UserContext";
import { postCreateUserFolder } from "../../utility/endpoints/FolderEndpoints";
import {
  getTagList,
  postCreateTag,
  updateTag,
} from "../../utility/endpoints/TagsEndpoints";
import Post from "../../utility/Post";
import { AlertContext } from "../../utility/context/AlertContext";
import Put from "../../utility/Put";
import { onlyLettersAndNumbers } from "../../utility/Helpers";
import ListFolders from "./ListFolders";
import { Loader2, Tag, Folder, Trash2, Edit3 } from "lucide-react";

export enum SortOptions {
  Ascending = "Ascending",
  Descending = "Descending",
  Newest = "Newest",
  Oldest = "Oldest",
}

export enum OwnerTypeOptions {
  Any = "Any",
  "Me" = "Me",
  "Organization" = "Organization",
}

export default function Library(): JSX.Element {
  let navigator = useNavigate();
  const { setAlert } = useContext(AlertContext);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [openCreateFolderModal, setOpenCreateFolderModal] =
    useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>("");
  const [openManageTagsModal, setOpenManageTagsModal] =
    useState<boolean>(false);
  const [tagList, setTagList] = useState<Array<TagType>>([]);
  const [newTag, setNewTag] = useState<string>("");
  const { user } = useContext(UserContext);

  useEffect(() => {
    setAlert({ message: "", type: "info" });

    const controller = new AbortController();
    setIsLoading(true);

    if (tagList.length === 0) {
      getTags("", controller.signal);
    }

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line
  }, []);

  function getTags(startKey: string, signal: AbortSignal) {
    var limit = 20;
    Get(getTagList(limit, startKey), signal).then((res) => {
      if (res && res.status && res.status < 300) {
        if (res.data && res.data.tags && res.data.ScannedCount !== undefined) {
          //Get the list of all folders
          setTagList((prev) => [...prev, ...res.data.tags]);
          //if the data is 20 prompts, then call for the next page
          //handle pages
          if (
            res.data.ScannedCount > 0 &&
            res.data.ScannedCount >= limit &&
            res.data.LastEvaluatedKey &&
            res.data.LastEvaluatedKey.id
          ) {
            getTags(res.data.LastEvaluatedKey.id, signal);
          } else {
            setIsLoading(false);
          }
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        if (res === undefined) {
        } else {
          // handle error
          setIsLoading(false);
        }
      }
    });
  }

  function refreshList() {
    setIsLoading(true);
    setTagList([]);
    const controller = new AbortController();
    getTags("", controller.signal);
    setNewTag("");
  }

  function handleCreateFolder() {
    setIsLoading(true);
    Post(postCreateUserFolder(), { name: newFolderName }).then((res) => {
      if (res.status && res.status < 300) {
        if (res.data && res.data) {
          //pop up notifying user of folder
          setAlert({ message: "Folder Created", type: "success" });
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        // set errors
        setAlert({
          message: "Folder could not be created. Try again later.",
          type: "error",
        });
      }
      setOpenCreateFolderModal(false);
      setNewFolderName("");
      refreshList();
    });
  }

  function handleCreateTag() {
    setIsLoading(true);
    Post(postCreateTag(), { name: newTag }).then((res) => {
      if (res.status && res.status < 300) {
        if (res.data && res.data) {
          //pop up notifying user of tag
          setAlert({ message: "Tag Created", type: "success" });
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        // set errors
        setAlert({
          message: "Tag could not be created. Try again later.",
          type: "error",
        });
      }
      setOpenManageTagsModal(false);
      refreshList();
    });
  }

  function handleUpdateTag(
    oldTag: string,
    isDeleted: boolean,
    newTag?: string
  ) {
    setIsLoading(true);
    const dataToSend = newTag
      ? {
          name: newTag,
          id: oldTag,
          isDeleted: isDeleted,
        }
      : {
          id: oldTag,
          isDeleted: isDeleted,
        };
    Put(updateTag(oldTag), dataToSend).then((res) => {
      if (res.status && res.status < 300) {
        if (res.data && res.data) {
          //pop up notifying user of tag update
          setAlert({
            message: isDeleted ? "Tag Deleted" : "Tag Updated",
            type: "success",
          });
        }
      } else if (res && res.status === 401) {
        navigator("/login");
      } else {
        // set errors
        setAlert({
          message: "Tag could not be updated. Try again later.",
          type: "error",
        });
      }
      setOpenManageTagsModal(false);
      refreshList();
    });
  }

  return !isLoading ? (
    <div className="min-h-screen">
      {user?.groups.includes(
        process.env.REACT_APP_ADMIN
          ? process.env.REACT_APP_ADMIN
          : "PapyrusAIAdmin"
      ) && (
        <Dialog
          open={openManageTagsModal}
          onOpenChange={setOpenManageTagsModal}
        >
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Manage Tags
              </DialogTitle>
              <DialogDescription>
                Create, edit, and delete tags for organizing content in your
                library.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col h-full space-y-4">
              {/* Existing Tags Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Existing Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-64 overflow-y-auto space-y-3">
                    {tagList.length === 0 ? (
                      <p className="text-muted-foreground text-sm text-center py-4">
                        No tags found. Create your first tag below.
                      </p>
                    ) : (
                      tagList.map((tag, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <Input
                            name={`${i}_tag`}
                            className="flex-1"
                            value={tag.name ? tag.name : tag.id}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) => {
                              setTagList((prev) => {
                                if (onlyLettersAndNumbers(e.target.value)) {
                                  var list = [...prev];
                                  list[i].name = e.target.value;
                                  return list;
                                } else {
                                  return prev;
                                }
                              });
                            }}
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              onClick={() =>
                                handleUpdateTag(
                                  tag.id,
                                  false,
                                  tagList[i].name ?? ""
                                )
                              }
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              <Edit3 className="h-3 w-3" />
                              Update
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleUpdateTag(tag.id, true)}
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Separator />

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Create New Tag</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateTag} className="space-y-2">
                    <Label htmlFor="new-tag">Tag Name</Label>
                    <Input
                      id="new-tag"
                      name="tag"
                      placeholder="Enter tag name (letters and numbers only)"
                      value={newTag}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        if (onlyLettersAndNumbers(e.target.value)) {
                          setNewTag(e.target.value);
                        }
                      }}
                    />
                    <Button
                      variant="default"
                      type="submit"
                      onClick={handleCreateTag}
                      className="w-full sm:w-auto flex items-center gap-2"
                      disabled={!newTag.trim()}
                    >
                      <Tag className="h-4 w-4" />
                      Create Tag
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpenManageTagsModal(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      <Dialog
        open={openCreateFolderModal}
        onOpenChange={setOpenCreateFolderModal}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5" />
              New Folder
            </DialogTitle>
            <DialogDescription>
              Enter a name for your personal folder, then click "Create Folder".
              Your folder and its contents will only be visible to you.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateFolder} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                name="foldername"
                placeholder="Enter folder name"
                value={newFolderName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setNewFolderName(e.target.value);
                }}
                required
              />
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpenCreateFolderModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                type="submit"
                onClick={handleCreateFolder}
                className="flex items-center gap-2"
                disabled={!newFolderName.trim()}
              >
                <Folder className="h-4 w-4" />
                Create Folder
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                Library
              </h1>
              <p className="text-muted-foreground text-base sm:text-lg">
                Organize your prompts and documents
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {user?.groups.includes(
                process.env.REACT_APP_ADMIN
                  ? process.env.REACT_APP_ADMIN
                  : "PapyrusAIAdmin"
              ) && (
                <Button
                  variant="outline"
                  onClick={() => setOpenManageTagsModal(true)}
                  className="flex items-center gap-2"
                >
                  <Tag className="h-4 w-4" />
                  Manage Tags
                </Button>
              )}
              {user?.groups.includes(
                process.env.REACT_APP_INSTRUCTOR
                  ? process.env.REACT_APP_INSTRUCTOR
                  : "PapyrusAIInstructors"
              ) && (
                <Button
                  variant="default"
                  onClick={() => setOpenCreateFolderModal(true)}
                  className="flex items-center gap-2"
                >
                  <Folder className="h-4 w-4" /> New Folder
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <ListFolders />
      </div>
    </div>
  ) : (
    <div
      className="min-h-screen flex items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4">
        <Loader2
          className="h-8 w-8 animate-spin text-primary"
          aria-hidden="true"
        />
        <p className="text-muted-foreground">Loading Library</p>
      </div>
    </div>
  );
}
