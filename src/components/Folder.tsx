
import React, { useContext, useState } from "react";
import { Button, IconButton, Menu, MenuItem, TextField } from "@mui/material";
import FolderIcon from '@mui/icons-material/Folder';
import PushPinIcon from '@mui/icons-material/PushPin';
import MoreVertIcon from '@mui/icons-material/MoreVert';
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
  postUpdateUserFolder
} from "../utility/endpoints/FolderEndpoints";
import { Modal } from "./Modal";
import Post from "../utility/Post";

interface FolderProps {
  displayName: string;
  isOrganizationFolder?: boolean;
  onClick: any;
  folder: FolderType;
  key: number;
  refreshList: () => void;
  loading: () => void;
}

export const Folder = (props: FolderProps) => {
  let navigator = useNavigate();
  const { user } = useContext(UserContext);
  const { setAlert } = useContext(AlertContext);
  const displayName = props.displayName ? props.displayName : "Displayname";
  const [addAnchorEl, setAddAnchorEl] = React.useState<null | HTMLElement>(null);
  const addOpen = Boolean(addAnchorEl);
  const handleAddClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAddAnchorEl(event.currentTarget);
  };
  const handleAddClose = () => {
    setAddAnchorEl(null);
  };
  const [renameFolderText, setRenameFolderText] = useState<string>(props.folder.name);
  const [openRenameModal, setOpenRenameModal] = useState<boolean>(false);
  const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
  const [openPromoteModal, setOpenPromoteModal] = useState<boolean>(false);
  const [openDemoteModal, setOpenDemoteModal] = useState<boolean>(false);


  function view() {
    handleAddClose()
    if (props.isOrganizationFolder) {
      navigator(`/library/org/${props.folder.id}`)
    } else {
      navigator(`/library/${props.folder.id}`)
    }
  }

  const openRename = () => {
    handleAddClose()
    setOpenRenameModal(true)
  }

  const openDelete = () => {
    handleAddClose()
    setOpenDeleteModal(true)
  }

  const openPromote = () => {
    handleAddClose()
    setOpenPromoteModal(true)
  }

  const openDemote = () => {
    handleAddClose()
    setOpenDemoteModal(true)
  }

  function rename() {
    props.loading()
    if (props.isOrganizationFolder) {
      const dataToSend = {
        name: renameFolderText,
        isDeleted: props.folder.isDeleted,
      }
      // post data back
      Put(postUpdateOrgFolder(props.folder.id), dataToSend).then((res) => {
        if (res.status && res.status < 300) {
          if (res.data && res.data) {
            //pop up notifying user of update
            setAlert({ message: "Folder Name Updated", type: "success" })
          }
        } else {
          // set errors
          setAlert({ message: "Folder name could not be updated. Try again later.", type: "error" })
        }
        props.refreshList();
      });
    } else {
      const dataToSend = {
        name: renameFolderText,
        isDeleted: props.folder.isDeleted,
      }
      // post data back
      Put(postUpdateUserFolder(props.folder.id), dataToSend).then((res) => {
        if (res.status && res.status < 300) {
          if (res.data && res.data) {
            //pop up notifying user of update
            setAlert({ message: "Folder Name Updated", type: "success" })
          }
        } else {
          // set errors
          setAlert({ message: "Folder name could not be updated. Try again later.", type: "error" })
        }
        props.refreshList();
      });
    }
  }

  function duplicate() {
    handleAddClose();
    if (props.isOrganizationFolder) {
      // post data back
      Post(postCopyOrgFolder(props.folder.id), {}).then((res) => {
        if (res.status && res.status < 300) {
          if (res.data && res.data) {
            //pop up notifying user of Duplicated
            setAlert({ message: "Folder Duplicated", type: "success" })
          }
        } else {
          // set errors
          setAlert({ message: "Folder could not be duplicated. Try again later.", type: "error" })
        }
        props.refreshList();
      });
    } else {
      // post data back
      Post(postCopyUserFolder(props.folder.id), {}).then((res) => {
        if (res.status && res.status < 300) {
          if (res.data && res.data) {
            //pop up notifying user of Duplicated
            setAlert({ message: "Folder Duplicated", type: "success" })
          }
        } else {
          // set errors
          setAlert({ message: "Folder could not be duplicated. Try again later.", type: "error" })
        }
        props.refreshList();
      });
    }
  }

  function deleteFolder() {
    props.loading()
    if (props.isOrganizationFolder) {
      const dataToSend = {
        name: props.folder.name,
        isDeleted: true,
      }
      // post data back
      Put(postUpdateOrgFolder(props.folder.id), dataToSend).then((res) => {
        if (res.status && res.status < 300) {
          if (res.data && res.data) {
            //pop up notifying user of delete
            setAlert({ message: "Folder Deleted", type: "success" })
          }
        } else {
          // set errors
          setAlert({ message: "Folder could not be updated. Try again later.", type: "error" })
        }
        props.refreshList();
      });
    } else {
      const dataToSend = {
        name: props.folder.name,
        isDeleted: true,
      }
      // post data back
      Put(postUpdateUserFolder(props.folder.id), dataToSend).then((res) => {
        if (res.status && res.status < 300) {
          if (res.data && res.data) {
            //pop up notifying user of delete
            setAlert({ message: "Folder Deleted", type: "success" })
          }
        } else {
          // set errors
          setAlert({ message: "Folder could not be updated. Try again later.", type: "error" })
        }
        props.refreshList();
      });
    }
  }

  function promote() {
    props.loading()
    // post data back
    Post(postPromoteUserFolder(props.folder.id), {}).then((res) => {
      if (res.status && res.status < 300) {
        if (res.data && res.data) {
          //pop up notifying user of promoted
          setAlert({ message: "Folder Promoted", type: "success" })
        }
      } else {
        // set errors
        setAlert({ message: "Folder could not be updated. Try again later.", type: "error" })
      }
      props.refreshList();
    });
  }
  function demote() {
    props.loading()
    // post data back
    Post(postDemoteOrgFolder(props.folder.id), {}).then((res) => {
      if (res.status && res.status < 300) {
        if (res.data && res.data) {
          //pop up notifying user of demoted
          setAlert({ message: "Folder Demoted", type: "success" })
        }
      } else {
        // set errors
        setAlert({ message: "Folder could not be updated. Try again later.", type: "error" })
      }
      props.refreshList();
    });
  }

  const instructorUserMenu = ["View", "Rename", "Duplicate", "Delete"]
  const instructorUserMenuFunctions = [view, openRename, duplicate, openDelete]
  const adminUserMenu = ["View", "Rename", "Duplicate", "Promote", "Delete"]
  const adminUserMenuFunctions = [view, openRename, duplicate, openPromote, openDelete]
  const instructorOrgMenu = ["View", "Duplicate"]
  const instructorOrgMenuFunctions = [view, duplicate]
  const adminOrgMenu = ["View", "Rename", "Duplicate", "Demote", "Delete"]
  const adminOrgMenuFunctions = [view, openRename, duplicate, openDemote, openDelete]

  return (
    <div key={props.key} className="c-folder">
      <Modal
        isOpen={openPromoteModal}
        title={"Promote Folder?"}
        onRequestClose={() => setOpenPromoteModal(false)}
        actions={
          <>
            <Button variant="contained" color="primary" onClick={(e) => promote()}>
              Promote
            </Button>
            <Button variant="contained" color="secondary" onClick={() => setOpenPromoteModal(false)}>
              Cancel
            </Button>
          </>
        }
      >
        <div>
          Are you sure you would like to promote this folder into an organization folder along everything in it?
          This will remove the folder from your personal ownership and transfer it to the organization level.
          Proceeding will allow all instructors to be able to read and use contains in modules.
          All admins will be able to edit this folder.
        </div>
      </Modal>
      <Modal
        isOpen={openDemoteModal}
        title={"Demote Folder?"}
        onRequestClose={() => setOpenDemoteModal(false)}
        actions={
          <>
            <Button variant="contained" color="primary" onClick={(e) => demote()}>
              Demote
            </Button>
            <Button variant="contained" color="secondary" onClick={() => setOpenDemoteModal(false)}>
              Cancel
            </Button>
          </>
        }
      >
        <div>
          Are you sure you would like to demote this organization folder into a personal user folder along everything in it?
          This will remove the folder from the organization ownership and transfer it to the user level.
          Proceeding will only let you edit the folder.
        </div>
      </Modal>
      <Modal
        isOpen={openDeleteModal}
        title={"Delete Folder?"}
        onRequestClose={() => setOpenDeleteModal(false)}
        actions={
          <>
            <Button variant="contained" color="error" onClick={(e) => deleteFolder()}>
              Delete
            </Button>
            <Button variant="contained" color="secondary" onClick={() => setOpenDeleteModal(false)}>
              Cancel
            </Button>
          </>
        }
      >
        <div>Are you sure you would like to permanently delete this folder and everything in it?</div>
      </Modal>
      <Modal
        isOpen={openRenameModal}
        title={"Rename Folder"}
        onRequestClose={() => setOpenRenameModal(false)}
        actions={
          <>
            <Button
              variant="contained"
              color="primary"
              onClick={(e) => {
                setOpenRenameModal(false)
                rename()
              }}
            >
              Rename
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => setOpenRenameModal(false)}>
              Close
            </Button>
          </>
        }
      >
        <div>
          <TextField
            name="name"
            label="Folder Name"
            fullWidth
            sx={{ margin: ".5rem 0" }}
            value={renameFolderText}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
              setRenameFolderText(e.target.value)
            }}
            autoFocus
          />
        </div>
      </Modal>
      <Button
        variant="contained"
        color='white'
        className="folder"
        size='large'
        sx={{ display: "flex", justifyContent: "space-between", width: "100%" }}
        onClick={props.onClick}
      >
        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          {props.isOrganizationFolder ? (
            <PushPinIcon />
          ) : <></>}
          <FolderIcon />
          &nbsp;
          <div className="truncated" style={{ textAlign: "left" }}>
            {displayName}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <IconButton
            aria-label="folder menu"
            edge="start"
            type="button"
            id={`${props.key}-button`}
            aria-controls={addOpen ? `${props.key}-menu` : undefined}
            aria-haspopup="true"
            aria-expanded={addOpen ? 'true' : undefined}
            onClick={(e: any) => {
              e.stopPropagation()
              handleAddClick(e)
            }}
          >
            {<MoreVertIcon />}
          </IconButton>
        </div>
      </Button>
      <Menu
        id={`${props.key}-menu`}
        anchorEl={addAnchorEl}
        open={addOpen}
        onClose={handleAddClose}
        MenuListProps={{
          'aria-labelledby': 'folder-menu-button',
        }}
      >
        {props.isOrganizationFolder ? (
          //if org folder
          <>
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
          </>
        ) : (
          //if user folder
          <>
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
          </>
        )}
      </Menu>
    </div>
  );
};


