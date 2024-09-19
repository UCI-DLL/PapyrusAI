
import React, { useContext, useState } from "react";
import {
  Button,
  Card,
  CardHeader,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
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
  postUpdateOrgFile,
  postUpdateUserFile,
} from "../utility/endpoints/FolderEndpoints";
import { Modal } from "./Modal";
import { useNavigate } from "react-router";
import ListFolders from "../features/library/ListFolders";
import Post from "../utility/Post";


interface FileProps {
  file: FileType;
  folder: FolderType;
  keyy: string;
  refreshList: () => void;
  loading: () => void;
  noShowMenu?: boolean;
  onClick?: (folderId: string, fileId: string, isOrgFolder: boolean, type: string) => void; //type is "prompt" or "file"
  showRemove?: boolean;
}

export const File = (props: FileProps) => {
  let navigator = useNavigate();
  const { user } = useContext(UserContext);
  const { setAlert } = useContext(AlertContext);
  const [openCopyToModal, setOpenCopyToModal] = useState<boolean>(false);
  const [openMoveModal, setOpenMoveModal] = useState<boolean>(false);
  const [addAnchorEl, setAddAnchorEl] = React.useState<null | HTMLElement>(null);
  const addOpen = Boolean(addAnchorEl);
  const handleAddClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAddAnchorEl(event.currentTarget);
  };
  const handleAddClose = () => {
    setAddAnchorEl(null);
  };
  const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);

  const openDelete = () => {
    handleAddClose()
    setOpenDeleteModal(true)
  }

  function edit() {
    if (props.folder) {
      props.loading();
      if (props.file.isOrganizationFile) {
        navigator(`/library/org/${props.folder.id}/files/${props.file.id}`)
      } else {
        navigator(`/library/${props.folder.id}/files/${props.file.id}`)
      }
    }

  }

  function openCopyTo() {
    handleAddClose();
    setOpenCopyToModal(true);
  }

  function copyTo(folderId: string, isOrgFolder: boolean) {
    handleAddClose();
    if (props.folder) {
      props.loading();
      if (props.file.isOrganizationFile) {
        if (isOrgFolder) { //copy from org folder to org foler
          Post(postCopyOrgFileToOrgFolder(props.folder.id, props.file.id, folderId), {}).then((res) => {
            if (res.status && res.status < 300) {
              if (res.data && res.data) {
                //pop up notifying user of Duplicated
                setAlert({ message: "File Copied", type: "success" })
              }
            } else {
              // set errors
              setAlert({ message: "File could not be Copied. Try again later.", type: "error" })
            }
            props.refreshList();
          });
        } else { //copy from org folder to user folder
          Post(postCopyOrgFileToUserFolder(props.folder.id, props.file.id, folderId), {}).then((res) => {
            if (res.status && res.status < 300) {
              if (res.data && res.data) {
                //pop up notifying user of Duplicated
                setAlert({ message: "File Copied", type: "success" })
              }
            } else {
              // set errors
              setAlert({ message: "File could not be Copied. Try again later.", type: "error" })
            }
            props.refreshList();
          });
        }
      } else {
        if (isOrgFolder) { //copy from user folder to org foler
          Post(postCopyUserFileToOrgFolder(props.folder.id, props.file.id, folderId), {}).then((res) => {
            if (res.status && res.status < 300) {
              if (res.data && res.data) {
                //pop up notifying user of Duplicated
                setAlert({ message: "File Copied", type: "success" })
              }
            } else {
              // set errors
              setAlert({ message: "File could not be Copied. Try again later.", type: "error" })
            }
            props.refreshList();
          });
        } else { //copy from user folder to user folder
          Post(postCopyUserFileToUserFolder(props.folder.id, props.file.id, folderId), {}).then((res) => {
            if (res.status && res.status < 300) {
              if (res.data && res.data) {
                //pop up notifying user of Duplicated
                setAlert({ message: "File Copied", type: "success" })
              }
            } else {
              // set errors
              setAlert({ message: "File could not be Copied. Try again later.", type: "error" })
            }
            props.refreshList();
          });
        }
      }
    }
  }

  function deleteFile() {
    if (props.folder) {
      props.loading()
      if (props.file.isOrganizationFile) {
        const dataToSend = {
          name: props.file.name,
          isDeleted: true,
          tags: props.file.tags,
        }
        // post data back
        Put(postUpdateOrgFile(props.folder.id, props.file.id), dataToSend).then((res) => {
          if (res.status && res.status < 300) {
            if (res.data && res.data) {
              //pop up notifying user of delete
              setAlert({ message: "file Deleted", type: "success" })
            }
          } else {
            // set errors
            setAlert({ message: "file could not be deleted. Try again later.", type: "error" })
          }
          props.refreshList();
        });
      } else {
        const dataToSend = {
          name: props.file.name,
          isDeleted: true,
          tags: props.file.tags,
        }
        // post data back
        Put(postUpdateUserFile(props.folder.id, props.file.id), dataToSend).then((res) => {
          if (res.status && res.status < 300) {
            if (res.data && res.data) {
              //pop up notifying user of delete
              setAlert({ message: "file Deleted", type: "success" })
            }
          } else {
            // set errors
            setAlert({ message: "file could not be deleted. Try again later.", type: "error" })
          }
          props.refreshList();
        });
      }
    }
  }

  function openMoveFile() {
    handleAddClose();
    setOpenMoveModal(true);
  }

  function moveTo(folderId: string, isOrgFolder: boolean) {
    handleAddClose();
    if (props.folder) {
      props.loading();
      if (props.file.isOrganizationFile) {
        if (isOrgFolder) { //move from org folder to org foler
          Post(postMoveOrgFileToOrgFolder(props.folder.id, props.file.id, folderId), {}).then((res) => {
            if (res.status && res.status < 300) {
              if (res.data && res.data) {
                //pop up notifying user of Moved
                setAlert({ message: "File Moved", type: "success" })
              }
            } else {
              // set errors
              setAlert({ message: "File could not be moved. Try again later.", type: "error" })
            }
            props.refreshList();
          });
        } else { //move from org folder to user folder
          Post(postMoveOrgFileToUserFolder(props.folder.id, props.file.id, folderId), {}).then((res) => {
            if (res.status && res.status < 300) {
              if (res.data && res.data) {
                //pop up notifying user of Moved
                setAlert({ message: "file Moved", type: "success" })
              }
            } else {
              // set errors
              setAlert({ message: "file could not be moved. Try again later.", type: "error" })
            }
            props.refreshList();
          });
        }
      } else {
        if (isOrgFolder) { //move from user folder to org foler
          Post(postMoveUserFileToOrgFolder(props.folder.id, props.file.id, folderId), {}).then((res) => {
            if (res.status && res.status < 300) {
              if (res.data && res.data) {
                //pop up notifying user of Moved
                setAlert({ message: "file Moved", type: "success" })
              }
            } else {
              // set errors
              setAlert({ message: "file could not be moved. Try again later.", type: "error" })
            }
            props.refreshList();
          });
        } else { //move from user folder to user folder
          Post(postMoveUserFileToUserFolder(props.folder.id, props.file.id, folderId), {}).then((res) => {
            if (res.status && res.status < 300) {
              if (res.data && res.data) {
                //pop up notifying user of Moved
                setAlert({ message: "file Moved", type: "success" })
              }
            } else {
              // set errors
              setAlert({ message: "file could not be moved. Try again later.", type: "error" })
            }
            props.refreshList();
          });
        }
      }
    }
  }

  const instructorUserMenu = ["Edit", "Copy To", "Move", "Delete"]
  const instructorUserMenuFunctions = [edit, openCopyTo, openMoveFile, openDelete]
  const adminUserMenu = ["Edit", "Copy To", "Move", "Delete"]
  const adminUserMenuFunctions = [edit, openCopyTo, openMoveFile, openDelete]
  const instructorOrgMenu = ["Copy To"]
  const instructorOrgMenuFunctions = [openCopyTo]
  const adminOrgMenu = ["Edit", "Copy To", "Move", "Delete"]
  const adminOrgMenuFunctions = [edit, openCopyTo, openMoveFile, openDelete]

  return (
    <div key={props.keyy ? props.keyy : "key"} className="c-file">
      <Modal
        isOpen={openDeleteModal}
        title={"Delete File?"}
        onRequestClose={() => setOpenDeleteModal(false)}
        actions={
          <>
            <Button variant="contained" color="error" onClick={(e) => deleteFile()}>
              Delete
            </Button>
            <Button variant="contained" color="secondary" onClick={() => setOpenDeleteModal(false)}>
              Cancel
            </Button>
          </>
        }
      >
        <div>Are you sure you would like to permanently delete this file?</div>
      </Modal>
      <Modal
        isOpen={openCopyToModal}
        title={"Copy File To?"}
        onRequestClose={() => setOpenCopyToModal(false)}
        actions={
          <>
            <Button variant="contained" color="secondary" onClick={() => setOpenCopyToModal(false)}>
              Cancel
            </Button>
          </>
        }
      >
        <div>
          <ListFolders noShowMenu onClick={copyTo} />
        </div>
      </Modal>
      <Modal
        isOpen={openMoveModal}
        title={"Move File To?"}
        onRequestClose={() => setOpenMoveModal(false)}
        actions={
          <>
            <Button variant="contained" color="secondary" onClick={() => setOpenMoveModal(false)}>
              Cancel
            </Button>
          </>
        }
      >
        <div>
          <ListFolders noShowMenu onClick={moveTo} disableFolderId={props.folder.id} />
        </div>
      </Modal>
      <Card>
        <CardHeader
          action={
            props.noShowMenu ? props.showRemove ? (
              <Tooltip title={"Remove File"}>
                <IconButton
                  className="c-file__button__menu-btn"
                  aria-label="file menu"
                  id={`${props.keyy ? props.keyy : "key"}${props.file.isOrganizationFile ? "org" : ""}-button`}
                  aria-controls={addOpen ? `${props.keyy ? props.keyy : "key"}${props.file.isOrganizationFile ? "org" : ""}-menu` : ""}
                  aria-haspopup="true"
                  aria-expanded={addOpen ? 'true' : undefined}
                  onClick={(e: any) => {
                    e.stopPropagation()
                    if (props.onClick) props.onClick(props.folder.id, props.file.id, props.file.isOrganizationFile, "file")
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title={"Add File"}>
                <IconButton
                  className="c-file__button__menu-btn"
                  aria-label="file menu"
                  id={`${props.keyy ? props.keyy : "key"}${props.file.isOrganizationFile ? "org" : ""}-button`}
                  aria-controls={addOpen ? `${props.keyy ? props.keyy : "key"}${props.file.isOrganizationFile ? "org" : ""}-menu` : ""}
                  aria-haspopup="true"
                  aria-expanded={addOpen ? 'true' : undefined}
                  onClick={(e: any) => {
                    e.stopPropagation()
                    if (props.onClick && props.folder) props.onClick(props.folder.id, props.file.id, props.file.isOrganizationFile ?? false, "file")
                  }}
                >
                  <AddIcon />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title={"File Options"}>
                <IconButton
                  className="c-file__button__menu-btn"
                  aria-label="file menu"
                  id={`${props.keyy ? props.keyy : "key"}${props.file.isOrganizationFile ? "org" : ""}-button`}
                  aria-controls={addOpen ? `${props.keyy ? props.keyy : "key"}${props.file.isOrganizationFile ? "org" : ""}-menu` : ""}
                  aria-haspopup="true"
                  aria-expanded={addOpen ? 'true' : undefined}
                  onClick={(e: any) => {
                    e.stopPropagation()
                    handleAddClick(e)
                  }}
                >
                  <MoreVertIcon />
                </IconButton>
              </Tooltip>
            )
          }
          title={props.file.name}
          subheader={
            <>
              {
                props.file.tags && props.file.tags.map((tag: string, i: number) => {
                  return (
                    <Chip sx={{ marginRight: "0.4rem" }} key={i} label={tag} variant="outlined" size="small" />
                  )
                })
              }
            </>
          }
        />

        {/* Nothing in the card? TODO on click of card, popup view file */}
      </Card>
      <Menu
        id={`${props.keyy ? props.keyy : "key"}${props.file.isOrganizationFile ? "org" : ""}-menu`}
        anchorEl={addAnchorEl}
        open={addOpen}
        onClose={handleAddClose}
        MenuListProps={{
          'aria-labelledby': 'file-menu-button',
        }}
      >
        {props.file.isOrganizationFile ? (
          //if org folder
          <div>
            {user?.groups.includes(process.env.REACT_APP_ADMIN ? process.env.REACT_APP_ADMIN : "PapyrusAIAdmin") ? (
              //if admin
              <>
                {adminOrgMenu.map((item: string, index: number) => {
                  return (
                    <MenuItem key={index} onClick={(e: any) => {
                      adminOrgMenuFunctions[index]()
                    }}>
                      {item}
                    </MenuItem>
                  )
                })}
              </>
            ) : (
              //else if instructor
              <>
                {instructorOrgMenu.map((item: string, index: number) => {
                  return (
                    <MenuItem key={index} onClick={(e: any) => {
                      instructorOrgMenuFunctions[index]()
                    }}>
                      {item}
                    </MenuItem>
                  )
                })}
              </>
            )}
          </div>
        ) : (
          //if user folder
          <div>
            {user?.groups.includes(process.env.REACT_APP_ADMIN ? process.env.REACT_APP_ADMIN : "PapyrusAIAdmin") ? (
              //if admin
              <>
                {adminUserMenu.map((item: string, index: number) => {
                  return (
                    <MenuItem key={index} onClick={(e: any) => {
                      adminUserMenuFunctions[index]()
                    }}>
                      {item}
                    </MenuItem>
                  )
                })}
              </>
            ) : (
              //else if instructor
              <>
                {instructorUserMenu.map((item: string, index: number) => {
                  return (
                    <MenuItem key={index} onClick={(e: any) => {
                      instructorUserMenuFunctions[index]()
                    }}>
                      {item}
                    </MenuItem>
                  )
                })}
              </>
            )}
          </div>
        )}
      </Menu>
    </div>
  );
};


