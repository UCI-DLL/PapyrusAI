import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { DialogWrapper } from "../../components/ui-wrappers/DialogWrapper";
import { TooltipWrapper } from "../../components/ui-wrappers/TooltipWrapper";
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
import { Loader2, Tag, Folder, Trash2, Save } from "lucide-react";

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
        <DialogWrapper
          open={openManageTagsModal}
          onOpenChange={setOpenManageTagsModal}
          title="Manage Tags"
          description="Create, edit, and delete tags for organizing content."
          contentClassName="sm:max-w-2xl"
          actions={[
            {
              label: "Close",
              onClick: () => setOpenManageTagsModal(false),
              variant: "outline",
            },
          ]}
        >
          <div className="space-y-6">
            {/* Existing Tags */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Existing Tags</h3>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {tagList.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">
                    No tags found. Create your first tag below.
                  </p>
                ) : (
                  tagList.map((tag, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-3 rounded-md border"
                    >
                      <Input
                        name={`${i}_tag`}
                        className="flex-1"
                        value={tag.name ? tag.name : tag.id}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
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
                      <TooltipWrapper content="Save changes to this tag">
                        <Button
                          variant="ghost"
                          onClick={() =>
                            handleUpdateTag(
                              tag.id,
                              false,
                              tagList[i].name ?? ""
                            )
                          }
                          size="sm"
                          aria-label="Save tag changes"
                        >
                          <Save className="h-4 w-4 mr-1.5" />
                          Save
                        </Button>
                      </TooltipWrapper>
                      <TooltipWrapper content="Permanently delete this tag">
                        <Button
                          variant="ghost"
                          onClick={() => handleUpdateTag(tag.id, true)}
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          aria-label="Delete tag"
                        >
                          <Trash2 className="h-4 w-4 mr-1.5" />
                          Delete
                        </Button>
                      </TooltipWrapper>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Create New Tag */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Create New Tag</h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter tag name"
                  value={newTag}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    if (onlyLettersAndNumbers(e.target.value)) {
                      setNewTag(e.target.value);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newTag.trim()) {
                      handleCreateTag();
                    }
                  }}
                />
                <Button onClick={handleCreateTag} disabled={!newTag.trim()}>
                  <Tag className="h-4 w-4 mr-2" />
                  Create
                </Button>
              </div>
            </div>
          </div>
        </DialogWrapper>
      )}
      <DialogWrapper
        open={openCreateFolderModal}
        onOpenChange={setOpenCreateFolderModal}
        title="New Folder"
        description="Enter a name for your personal folder, then click 'Create Folder'. Your folder and its contents will only be visible to you."
        contentClassName="sm:max-w-md"
        actions={[
          {
            label: "Cancel",
            onClick: () => setOpenCreateFolderModal(false),
            variant: "outline",
          },
          {
            label: "Create Folder",
            onClick: handleCreateFolder,
            disabled: !newFolderName.trim(),
          },
        ]}
      >
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
            onKeyDown={(e) => {
              if (e.key === "Enter" && newFolderName.trim()) {
                handleCreateFolder();
              }
            }}
          />
        </div>
      </DialogWrapper>

      <div className="mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <header className="animate-in slide-in-from-bottom-4 duration-700">
          <div className="relative overflow-hidden bg-card border rounded-xl p-6 shadow-lg mb-8">
            <div
              className="absolute top-0 right-0 w-48 h-48 opacity-10"
              aria-hidden="true"
            >
              <Folder size={192} className="text-primary" />
            </div>
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-4xl font-bold mb-2 text-foreground leading-tight">
                    Library
                  </h1>
                </div>
                <nav
                  className="flex flex-col sm:flex-row gap-2"
                  role="toolbar"
                  aria-label="Library management actions"
                >
                  {user?.groups.includes(
                    process.env.REACT_APP_ADMIN
                      ? process.env.REACT_APP_ADMIN
                      : "PapyrusAIAdmin"
                  ) && (
                    <Button
                      variant="outline"
                      onClick={() => setOpenManageTagsModal(true)}
                      className="flex items-center gap-2"
                      aria-label="Manage content tags"
                    >
                      <Tag className="h-4 w-4" aria-hidden="true" />
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
                      aria-label="Create new folder"
                    >
                      <Folder className="h-4 w-4" aria-hidden="true" />
                      New Folder
                    </Button>
                  )}
                </nav>
              </div>
              <p className="text-muted-foreground max-w-2xl text-base leading-6 mb-4">
                The library contains all of the conversation prompts and
                documents hosted within PapyrusAI. By default, you have access
                to all prompts designed and tested by the PapyrusAI research
                team.
              </p>
              <p className="text-muted-foreground max-w-2xl text-base leading-6">
                You can click through the folders to browse our
                researcher-created prompts. If you would like to use your own
                assets (including your own prompts and documents) in your
                course, you will need to host these within your own folder. For
                more information on navigating the library, please see the&nbsp;
                <a
                  href="https://docs.google.com/document/d/1o3He0CdgV7hJOX65gc3Gpf3_Fr3GYvSm4Q-i-Y5cNHQ/edit?tab=t.0#heading=h.i0aofs3p0aio"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2 hover:no-underline text-primary font-medium"
                >
                  "Library" section of our instructor guide.
                </a>
              </p>
            </div>
          </div>
        </header>

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
