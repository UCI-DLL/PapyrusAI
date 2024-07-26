
import React, { useContext, useState } from "react";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Chip,
  IconButton,
  IconButtonProps,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
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
  postUpdateUserPrompt
} from "../utility/endpoints/FolderEndpoints";
import { Modal } from "./Modal";
import { styled } from '@mui/material/styles';
import { truncateString } from "../utility/Helpers";
import { useNavigate } from "react-router";
import ListFolders from "../features/library/ListFolders";
import Post from "../utility/Post";


interface ExpandMoreProps extends IconButtonProps {
  expand: boolean;
}

const ExpandMore = styled((props: ExpandMoreProps) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}));

interface PromptProps {
  prompt: PromptType;
  folder: FolderType;
  keyy: string;
  refreshList: () => void;
  loading: () => void;
  noShowMenu?: boolean;
  onClick?: (folderId: string, promptId: string, isOrgFolder: boolean) => void;
  showRemove?: boolean;
}

export const Prompt = (props: PromptProps) => {
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
  const [expanded, setExpanded] = React.useState(false);
  const handleExpandClick = () => {
    setExpanded(!expanded);
  };
  const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);

  const openDelete = () => {
    handleAddClose()
    setOpenDeleteModal(true)
  }

  function edit() {
    if (props.folder) {
      props.loading();
      if (props.prompt.isOrganizationPrompt) {
        navigator(`/library/org/${props.folder.id}/prompts/${props.prompt.id}`)
      } else {
        navigator(`/library/${props.folder.id}/prompts/${props.prompt.id}`)
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
      if (props.prompt.isOrganizationPrompt) {
        if (isOrgFolder) { //copy from org folder to org foler
          Post(postCopyOrgPromptToOrgFolder(props.folder.id, props.prompt.id, folderId), {}).then((res) => {
            if (res.status && res.status < 300) {
              if (res.data && res.data) {
                //pop up notifying user of Duplicated
                setAlert({ message: "Folder Copied", type: "success" })
              }
            } else {
              // set errors
              setAlert({ message: "Folder could not be Copied. Try again later.", type: "error" })
            }
            props.refreshList();
          });
        } else { //copy from org folder to user folder
          Post(postCopyOrgPromptToUserFolder(props.folder.id, props.prompt.id, folderId), {}).then((res) => {
            if (res.status && res.status < 300) {
              if (res.data && res.data) {
                //pop up notifying user of Duplicated
                setAlert({ message: "Folder Copied", type: "success" })
              }
            } else {
              // set errors
              setAlert({ message: "Folder could not be Copied. Try again later.", type: "error" })
            }
            props.refreshList();
          });
        }
      } else {
        if (isOrgFolder) { //copy from user folder to org foler
          Post(postCopyUserPromptToOrgFolder(props.folder.id, props.prompt.id, folderId), {}).then((res) => {
            if (res.status && res.status < 300) {
              if (res.data && res.data) {
                //pop up notifying user of Duplicated
                setAlert({ message: "Folder Copied", type: "success" })
              }
            } else {
              // set errors
              setAlert({ message: "Folder could not be Copied. Try again later.", type: "error" })
            }
            props.refreshList();
          });
        } else { //copy from user folder to user folder
          Post(postCopyUserPromptToUserFolder(props.folder.id, props.prompt.id, folderId), {}).then((res) => {
            if (res.status && res.status < 300) {
              if (res.data && res.data) {
                //pop up notifying user of Duplicated
                setAlert({ message: "Folder Copied", type: "success" })
              }
            } else {
              // set errors
              setAlert({ message: "Folder could not be Copied. Try again later.", type: "error" })
            }
            props.refreshList();
          });
        }
      }
    }
  }

  function deletePrompt() {
    if (props.folder) {
      props.loading()
      if (props.prompt.isOrganizationPrompt) {
        const dataToSend = {
          name: props.prompt.name,
          isDeleted: true,
          tags: props.prompt.tags,
          prompt: props.prompt.prompt
        }
        // post data back
        Put(postUpdateOrgPrompt(props.folder.id, props.prompt.id), dataToSend).then((res) => {
          if (res.status && res.status < 300) {
            if (res.data && res.data) {
              //pop up notifying user of delete
              setAlert({ message: "Prompt Deleted", type: "success" })
            }
          } else {
            // set errors
            setAlert({ message: "Prompt could not be deleted. Try again later.", type: "error" })
          }
          props.refreshList();
        });
      } else {
        const dataToSend = {
          name: props.prompt.name,
          isDeleted: true,
          tags: props.prompt.tags,
          prompt: props.prompt.prompt
        }
        // post data back
        Put(postUpdateUserPrompt(props.folder.id, props.prompt.id), dataToSend).then((res) => {
          if (res.status && res.status < 300) {
            if (res.data && res.data) {
              //pop up notifying user of delete
              setAlert({ message: "Prompt Deleted", type: "success" })
            }
          } else {
            // set errors
            setAlert({ message: "Prompt could not be deleted. Try again later.", type: "error" })
          }
          props.refreshList();
        });
      }
    }
  }

  function openMovePrompt() {
    handleAddClose();
    setOpenMoveModal(true);
  }

  function moveTo(folderId: string, isOrgFolder: boolean) {
    handleAddClose();
    if (props.folder) {
      props.loading();
      if (props.prompt.isOrganizationPrompt) {
        if (isOrgFolder) { //move from org folder to org foler
          Post(postMoveOrgPromptToOrgFolder(props.folder.id, props.prompt.id, folderId), {}).then((res) => {
            if (res.status && res.status < 300) {
              if (res.data && res.data) {
                //pop up notifying user of Moved
                setAlert({ message: "Folder Moved", type: "success" })
              }
            } else {
              // set errors
              setAlert({ message: "Folder could not be moved. Try again later.", type: "error" })
            }
            props.refreshList();
          });
        } else { //move from org folder to user folder
          Post(postMoveOrgPromptToUserFolder(props.folder.id, props.prompt.id, folderId), {}).then((res) => {
            if (res.status && res.status < 300) {
              if (res.data && res.data) {
                //pop up notifying user of Moved
                setAlert({ message: "Folder Moved", type: "success" })
              }
            } else {
              // set errors
              setAlert({ message: "Folder could not be moved. Try again later.", type: "error" })
            }
            props.refreshList();
          });
        }
      } else {
        if (isOrgFolder) { //move from user folder to org foler
          Post(postMoveUserPromptToOrgFolder(props.folder.id, props.prompt.id, folderId), {}).then((res) => {
            if (res.status && res.status < 300) {
              if (res.data && res.data) {
                //pop up notifying user of Moved
                setAlert({ message: "Folder Moved", type: "success" })
              }
            } else {
              // set errors
              setAlert({ message: "Folder could not be moved. Try again later.", type: "error" })
            }
            props.refreshList();
          });
        } else { //move from user folder to user folder
          Post(postMoveUserPromptToUserFolder(props.folder.id, props.prompt.id, folderId), {}).then((res) => {
            if (res.status && res.status < 300) {
              if (res.data && res.data) {
                //pop up notifying user of Moved
                setAlert({ message: "Folder Moved", type: "success" })
              }
            } else {
              // set errors
              setAlert({ message: "Folder could not be moved. Try again later.", type: "error" })
            }
            props.refreshList();
          });
        }
      }
    }
  }

  const instructorUserMenu = ["Edit", "Copy To", "Move", "Delete"]
  const instructorUserMenuFunctions = [edit, openCopyTo, openMovePrompt, openDelete]
  const adminUserMenu = ["Edit", "Copy To", "Move", "Delete"]
  const adminUserMenuFunctions = [edit, openCopyTo, openMovePrompt, openDelete]
  const instructorOrgMenu = ["Copy To"]
  const instructorOrgMenuFunctions = [openCopyTo]
  const adminOrgMenu = ["Edit", "Copy To", "Move", "Delete"]
  const adminOrgMenuFunctions = [edit, openCopyTo, openMovePrompt, openDelete]

  return (
    <div key={props.keyy ? props.keyy : "key"} className="c-Prompt">
      <Modal
        isOpen={openDeleteModal}
        title={"Delete Prompt?"}
        onRequestClose={() => setOpenDeleteModal(false)}
        actions={
          <>
            <Button variant="contained" color="error" onClick={(e) => deletePrompt()}>
              Delete
            </Button>
            <Button variant="contained" color="secondary" onClick={() => setOpenDeleteModal(false)}>
              Cancel
            </Button>
          </>
        }
      >
        <div>Are you sure you would like to permanently delete this prompt?</div>
      </Modal>
      <Modal
        isOpen={openCopyToModal}
        title={"Copy Prompt To?"}
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
        title={"Move Prompt To?"}
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
          <ListFolders noShowMenu onClick={moveTo} />
        </div>
      </Modal>
      <Card>
        <CardHeader
          action={
            props.noShowMenu ? props.showRemove ? (
              <Tooltip title={"Remove Prompt"}>
                <IconButton
                  className="c-prompt__button__menu-btn"
                  aria-label="prompt menu"
                  id={`${props.keyy ? props.keyy : "key"}${props.prompt.isOrganizationPrompt ? "org" : ""}-button`}
                  aria-controls={addOpen ? `${props.keyy ? props.keyy : "key"}${props.prompt.isOrganizationPrompt ? "org" : ""}-menu` : ""}
                  aria-haspopup="true"
                  aria-expanded={addOpen ? 'true' : undefined}
                  onClick={(e: any) => {
                    e.stopPropagation()
                    if (props.onClick) props.onClick(props.folder.id, props.prompt.id, props.prompt.isOrganizationPrompt)
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title={"Add Prompt"}>
                <IconButton
                  className="c-prompt__button__menu-btn"
                  aria-label="prompt menu"
                  id={`${props.keyy ? props.keyy : "key"}${props.prompt.isOrganizationPrompt ? "org" : ""}-button`}
                  aria-controls={addOpen ? `${props.keyy ? props.keyy : "key"}${props.prompt.isOrganizationPrompt ? "org" : ""}-menu` : ""}
                  aria-haspopup="true"
                  aria-expanded={addOpen ? 'true' : undefined}
                  onClick={(e: any) => {
                    e.stopPropagation()
                    if (props.onClick && props.folder) props.onClick(props.folder.id, props.prompt.id, props.prompt.isOrganizationPrompt ?? false)
                  }}
                >
                  <AddIcon />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title={"Prompt Options"}>
                <IconButton
                  className="c-prompt__button__menu-btn"
                  aria-label="prompt menu"
                  id={`${props.keyy ? props.keyy : "key"}${props.prompt.isOrganizationPrompt ? "org" : ""}-button`}
                  aria-controls={addOpen ? `${props.keyy ? props.keyy : "key"}${props.prompt.isOrganizationPrompt ? "org" : ""}-menu` : ""}
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
          title={props.prompt.name}
          subheader={
            <>
              {
                props.prompt.tags && props.prompt.tags.map((tag: string, i: number) => {
                  return (
                    <Chip sx={{ marginRight: "0.4rem" }} key={i} label={tag} variant="outlined" size="small" />
                  )
                })
              }
            </>
          }
        />
        {expanded ? (
          <CardContent>
            <Typography color="text.secondary">
              {props.prompt.prompt}
            </Typography>
          </CardContent>
        ) : (
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              {truncateString(props.prompt.prompt, 130)}
            </Typography>
          </CardContent>
        )}
        <CardActions disableSpacing>
          <ExpandMore
            expand={expanded}
            onClick={handleExpandClick}
            aria-expanded={expanded}
            aria-label="show more"
          >
            <ExpandMoreIcon />
          </ExpandMore>
        </CardActions>
      </Card>
      <Menu
        id={`${props.keyy ? props.keyy : "key"}${props.prompt.isOrganizationPrompt ? "org" : ""}-menu`}
        anchorEl={addAnchorEl}
        open={addOpen}
        onClose={handleAddClose}
        MenuListProps={{
          'aria-labelledby': 'prompt-menu-button',
        }}
      >
        {props.prompt.isOrganizationPrompt ? (
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


