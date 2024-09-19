import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Button,
  Menu,
  MenuItem,
} from "@mui/material";
import { FolderType } from "../../utility/types/CourseTypes";
import Get from "../../utility/Get";
import LinearProgress from '@mui/material/LinearProgress';
import { UserContext } from "../../utility/context/UserContext";
import { getOrgFolder, getUserFolder } from "../../utility/endpoints/FolderEndpoints";
import { AlertContext } from "../../utility/context/AlertContext";
import AddIcon from '@mui/icons-material/Add';
import ListFolderContents from "./ListFolderContents";


export enum SortOptions {
  Ascending = "Ascending",
  Descending = "Descending",
  Newest = "Newest",
  Oldest = "Oldest",
}

export default function ViewFolder(): JSX.Element {
  let location = useLocation();
  let navigator = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [folder, setFolder] = useState<FolderType>();
  const { user } = useContext(UserContext);
  const { setAlert } = useContext(AlertContext);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    const controller = new AbortController();
    //get pathname to figure out if we are editing 
    if (
      location.pathname &&
      location.pathname.split("/") &&
      location.pathname.split("/")[1] &&
      location.pathname.split("/")[1] === "library" &&
      location.pathname.split("/")[2] &&
      location.pathname.split("/")[2] !== "org"
    ) {
      //get user folder data
      getFolder(false, location.pathname.split("/")[2], controller.signal)
    } else if (
      location.pathname &&
      location.pathname.split("/") &&
      location.pathname.split("/")[1] &&
      location.pathname.split("/")[1] === "library" &&
      location.pathname.split("/")[2] &&
      location.pathname.split("/")[2] === "org" &&
      location.pathname.split("/")[3]
    ) {
      //get org folder
      getFolder(true, location.pathname.split("/")[3], controller.signal)
    }

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line
  }, [location.pathname]);

  function getFolder(isOrg: boolean, folderId: string, signal: AbortSignal) {
    if (!isOrg) {
      Get(getUserFolder(folderId), signal).then(res => {
        if (res && res.status && res.status < 300) {
          if (res.data) {
            //also set session
            setFolder(res.data);
            setIsLoading(false);
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          if (res === undefined) {
          } else {
            //handle error
            //redirect to prompt list
            navigator("/library");
            setAlert({ message: "Folder Does Not Exist", type: "error" });
            setIsLoading(false);
          }
        }
      });
    } else {
      Get(getOrgFolder(folderId), signal).then(res => {
        if (res && res.status && res.status < 300) {
          if (res.data) {
            //also set session
            setFolder(res.data);
            setIsLoading(false);
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          if (res === undefined) {
          } else {
            //handle error
            //redirect to prompt list
            // navigator("/library");
            setAlert({ message: "Folder Does Not Exist", type: "error" });
            setIsLoading(false);
          }
        }
      });
    }
  }

  return !isLoading && folder ? (
    <div className="library">
      <div className="library__section-header">
        <h3>{folder?.name}</h3>
        <div>
          {user?.groups.includes(process.env.REACT_APP_INSTRUCTOR ? process.env.REACT_APP_INSTRUCTOR : "PapyrusAIInstructors") && (
            <>
              <Button
                id="basic-button"
                aria-controls={open ? 'basic-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
                variant="contained"
              >
                <AddIcon />
                &nbsp;
                New
              </Button>
              <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                  'aria-labelledby': 'basic-button',
                }}
              >
                <MenuItem onClick={() => {
                  navigator(location.pathname.split("/")[2] !== "org" ?
                    `/library/${folder.id}/createprompt` : //user prompt
                    `/library/org/${folder.id}/createprompt`) //is org prompt
                }}>Create Prompt</MenuItem>
                <MenuItem onClick={() => {
                  navigator(location.pathname.split("/")[2] !== "org" ?
                    `/library/${folder.id}/createfile` : //user file
                    `/library/org/${folder.id}/createfile`) //is org file
                }}>Create File</MenuItem>
              </Menu>
            </>
          )}
        </div>
      </div>

      <ListFolderContents folderId={folder.id} isOrgFolder={location.pathname.split("/")[2] === "org"} />
    </div>
  ) : (
    <LinearProgress />
  )
}