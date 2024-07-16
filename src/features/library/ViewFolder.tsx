import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Button,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  Menu,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import { FolderType, PromptType } from "../../utility/types/CourseTypes";
import Get from "../../utility/Get";
import LinearProgress from '@mui/material/LinearProgress';
import { Modal } from "../../components/Modal";
import { getPromptList } from "../../utility/endpoints/PromptEndpoints";
import SearchIcon from '@mui/icons-material/Search';
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { CustomUserType } from "../../utility/types/UserTypes";
import { Folder } from "../../components/Folder";
import { UserContext } from "../../utility/context/UserContext";
import { getOrgFolder, getUserFolder } from "../../utility/endpoints/FolderEndpoints";
import { AlertContext } from "../../utility/context/AlertContext";

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
  const [error, setError] = useState<string>();
  const [folder, setFolder] = useState<FolderType>();
  const { user } = useContext(UserContext);
  const { setAlert } = useContext(AlertContext);


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
      const fodlerId = location.pathname.split("/")[2];
      Get(getUserFolder(fodlerId), controller.signal).then(res => {
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
      const fodlerId = location.pathname.split("/")[3];
      Get(getOrgFolder(fodlerId), controller.signal).then(res => {
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

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line
  }, [location.pathname]);

  return !isLoading ? (
    <div className="library">
      {error ? (
        <div>{error}</div>
      ) : (
        <>

          <div className="library__section-header">
            <h3>{folder?.name}</h3>
            <div>
              {user?.groups.includes(process.env.REACT_APP_INSTRUCTOR ? process.env.REACT_APP_INSTRUCTOR : "PapyrusAIInstructors") && (
                <Button variant="contained" onClick={() => console.log("here")}>Create Prompt</Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  ) : (
    <LinearProgress />
  )
}