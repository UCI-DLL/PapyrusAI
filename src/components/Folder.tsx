
import React, { useContext } from "react";
import { Button, IconButton, Menu, MenuItem } from "@mui/material";
import FolderIcon from '@mui/icons-material/Folder';
import PushPinIcon from '@mui/icons-material/PushPin';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { FolderType } from "../utility/types/CourseTypes";
import { useNavigate } from "react-router";
import { UserContext } from "../utility/context/UserContext";

interface FolderProps {
  displayName: string;
  isOrganizationFolder?: boolean;
  onClick: any;
  folder: FolderType;
  key: number;
  refreshList: () => void;
}

export const Folder = (props: FolderProps) => {
  let navigator = useNavigate();
  const { user } = useContext(UserContext);
  const displayName = props.displayName ? props.displayName : "Displayname";
  const [addAnchorEl, setAddAnchorEl] = React.useState<null | HTMLElement>(null);
  const addOpen = Boolean(addAnchorEl);
  const handleAddClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAddAnchorEl(event.currentTarget);
  };
  const handleAddClose = () => {
    setAddAnchorEl(null);
  };


  function view() {
    if (props.isOrganizationFolder) {
      navigator(`/library/org/${props.folder.id}`)
    } else {
      navigator(`/library/${props.folder.id}`)
    }
  }

  function rename() {
    console.log("TODO rename")
  }
  function duplicate() {
    console.log("TODO duplicate")
  }

  function deleteFolder() {
    console.log("TODO delete")
  }

  function promote() {

  }
  function demote() {

  }

  const instructorUserMenu = ["View", "Rename", "Duplicate", "Delete"]
  const instructorUserMenuFunctions = [view, rename, duplicate, deleteFolder]
  const adminUserMenu = ["View", "Rename", "Duplicate", "Promote", "Delete"]
  const adminUserMenuFunctions = [view, rename, duplicate, promote, deleteFolder]
  const instructorOrgMenu = ["View", "Duplicate"]
  const instructorOrgMenuFunctions = [view, duplicate]
  const adminOrgMenu = ["View", "Rename", "Duplicate", "Demote", "Delete"]
  const adminOrgMenuFunctions = [view, rename, duplicate, demote, deleteFolder]

  return (
    <div key={props.key} className="c-folder">
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


