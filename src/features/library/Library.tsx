import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Button,
  TextField,
} from "@mui/material";
import { TagType } from "../../utility/types/CourseTypes";
import Get from "../../utility/Get";
import LinearProgress from '@mui/material/LinearProgress';
import { Modal } from "../../components/Modal";
import { UserContext } from "../../utility/context/UserContext";
import {
  postCreateUserFolder
} from "../../utility/endpoints/FolderEndpoints";
import {
  getTagList,
  postCreateTag,
  updateTag
} from "../../utility/endpoints/TagsEndpoints";
import Post from "../../utility/Post";
import { AlertContext } from "../../utility/context/AlertContext";
import Put from "../../utility/Put";
import { onlyLettersAndNumbers } from "../../utility/Helpers";
import ListFolders from "./ListFolders";

export enum SortOptions {
  Ascending = "Ascending",
  Descending = "Descending",
  Newest = "Newest",
  Oldest = "Oldest",
}

export enum OwnerTypeOptions {
  Any = "Any",
  "Me" = "Me",
  "Organization" = "Organization"
}

export default function Library(): JSX.Element {
  let navigator = useNavigate();
  const { setAlert } = useContext(AlertContext);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [openCreateFolderModal, setOpenCreateFolderModal] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>("");
  const [openManageTagsModal, setOpenManageTagsModal] = useState<boolean>(false);
  const [tagList, setTagList] = useState<Array<TagType>>([]);
  const [newTag, setNewTag] = useState<string>("");
  const { user } = useContext(UserContext);


  useEffect(() => {
    setAlert({ message: "", type: "info" });

    const controller = new AbortController();
    setIsLoading(true);

    if (tagList.length === 0) {
      getTags("", controller.signal)
    }

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line
  }, []);

  function getTags(startKey: string, signal: AbortSignal) {
    var limit = 20;
    Get(getTagList(limit, startKey), signal).then(res => {
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
          setAlert({ message: "Folder Created", type: "success" })
        }
      } else {
        // set errors
        setAlert({ message: "Folder could not be created. Try again later.", type: "error" })
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
          setAlert({ message: "Tag Created", type: "success" })
        }
      } else {
        // set errors
        setAlert({ message: "Tag could not be created. Try again later.", type: "error" })
      }
      setOpenManageTagsModal(false);
      refreshList();
    });
  }

  function handleUpdateTag(oldTag: string, isDeleted: boolean, newTag?: string) {
    setIsLoading(true);
    const dataToSend = newTag ? {
      name: newTag, id: oldTag, isDeleted: isDeleted
    } : {
      id: oldTag, isDeleted: isDeleted
    }
    Put(updateTag(oldTag), dataToSend).then((res) => {
      if (res.status && res.status < 300) {
        if (res.data && res.data) {
          //pop up notifying user of tag update
          setAlert({ message: isDeleted ? "Tag Deleted" : "Tag Updated", type: "success" })
        }
      } else {
        // set errors
        setAlert({ message: "Tag could not be updated. Try again later.", type: "error" })
      }
      setOpenManageTagsModal(false);
      refreshList();
    });
  }

  return !isLoading ? (
    <div className="library">
      {user?.groups.includes(process.env.REACT_APP_ADMIN ? process.env.REACT_APP_ADMIN : "PapyrusAIAdmin") && (
        <Modal
          isOpen={openManageTagsModal}
          title={"Manage Tags"}
          onRequestClose={() => setOpenManageTagsModal(false)}
          actions={
            <>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => setOpenManageTagsModal(false)}>
                Close
              </Button>
            </>
          }
        >
          <div>
            <div style={{ maxHeight: "20rem", overflowY: "scroll" }}>
              &nbsp;
              {tagList.map((tag, i) => {
                return (
                  <div key={i}>
                    <div style={{ display: "flex", flexDirection: "row", width: "100%" }}>
                      <TextField
                        name={`${i}_tag`}
                        fullWidth
                        size={"small"}
                        value={tag.name ? tag.name : tag.id}
                        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                          setTagList((prev) => {
                            if (onlyLettersAndNumbers(e.target.value)) {
                              var list = [...prev];
                              list[i].name = e.target.value;
                              return list;
                            } else {
                              return prev
                            }
                          })
                        }}
                      />
                      &nbsp;
                      <Button
                        variant="contained"
                        color="primary"
                        type="submit"
                        onClick={() => handleUpdateTag(tag.id, false, tagList[i].name ?? "")}
                        size="small"
                        sx={{ whiteSpace: "nowrap" }}
                      >
                        Update
                      </Button>
                      &nbsp;
                      <Button
                        variant="contained"
                        color="error"
                        onClick={() => handleUpdateTag(tag.id, true)}
                        size="small"
                        sx={{ whiteSpace: "nowrap" }}
                      >
                        Delete
                      </Button>

                    </div>
                    &nbsp;
                  </div>
                )
              })}
            </div>
            &nbsp;
            <hr />
            &nbsp;
            <form onSubmit={handleCreateTag} style={{ display: "flex", flexDirection: "row", width: "100%" }}>
              <TextField
                name="tag"
                label="Create New Tag"
                fullWidth
                size={"small"}
                value={newTag}
                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                  if (onlyLettersAndNumbers(e.target.value)) {
                    setNewTag(e.target.value)
                  }
                }}
              />
              &nbsp;
              <Button
                variant="contained"
                color="primary"
                type="submit"
                onClick={handleCreateTag}
                size="small"
                sx={{ whiteSpace: "nowrap" }}
              >
                Create Tag
              </Button>
            </form>
          </div>
        </Modal>
      )}
      <Modal
        isOpen={openCreateFolderModal}
        title={"New Folder"}
        onRequestClose={() => setOpenCreateFolderModal(false)}
        actions={
          <>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => setOpenCreateFolderModal(false)}>
              Close
            </Button>
          </>
        }
      >
        <div>
          &nbsp;
          <form onSubmit={handleCreateFolder} style={{ display: "flex", flexDirection: "row", width: "100%" }}>
            <TextField
              name="foldername"
              label="New Folder Name"
              fullWidth
              size={"small"}
              value={newFolderName}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                setNewFolderName(e.target.value)
              }}
            />
            &nbsp;
            <Button
              variant="contained"
              color="primary"
              type="submit"
              onClick={handleCreateFolder}
              size="small"
              sx={{ whiteSpace: "nowrap" }}
            >
              Create Folder
            </Button>
          </form>
        </div>
      </Modal>

      <div className="library__section-header">
        <h3>My Library</h3>
        <div>
          {user?.groups.includes(process.env.REACT_APP_ADMIN ? process.env.REACT_APP_ADMIN : "PapyrusAIAdmin") && (
            <Button variant="outlined" onClick={() => setOpenManageTagsModal(true)}>Manage Tags</Button>
          )}
          &nbsp;&nbsp;&nbsp;
          {user?.groups.includes(process.env.REACT_APP_INSTRUCTOR ? process.env.REACT_APP_INSTRUCTOR : "PapyrusAIInstructors") && (
            <Button variant="contained" onClick={() => setOpenCreateFolderModal(true)}>Create Folder</Button>
          )}
        </div>
      </div>
      <ListFolders />
    </div>
  ) : (
    <LinearProgress />
  )
}