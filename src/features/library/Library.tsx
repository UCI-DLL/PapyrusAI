import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";
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
import SearchIcon from '@mui/icons-material/Search';
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { CustomUserType } from "../../utility/types/UserTypes";
import { Folder } from "../../components/Folder";
import { UserContext } from "../../utility/context/UserContext";
import { getOrgFolderList, getUserFolderList } from "../../utility/endpoints/FolderEndpoints";

export enum SortOptions {
  Ascending = "Ascending",
  Descending = "Descending",
  Newest = "Newest",
  Oldest = "Oldest",
}

export default function Library(): JSX.Element {
  let navigator = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>();
  const [orgFolderList, setOrgFolderList] = useState<Array<FolderType>>([]);
  const [userFolderList, setUserFolderList] = useState<Array<FolderType>>([]);
  const [filteredFolderList, setFilteredFolderList] = useState<Array<PromptType>>([]); //TODO figure out if needed?
  const [creatorList, setCreatorList] = useState<Array<CustomUserType>>([]);
  const { user } = useContext(UserContext);

  useEffect(() => {
    const controller = new AbortController();
    if (orgFolderList.length === 0) {
      setIsLoading(true);
      getOrgFolders("", controller.signal)
    }
    if (userFolderList.length === 0) {
      setIsLoading(true);
      getUserFolders("", controller.signal)
    }

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line
  }, []);

  function getOrgFolders(startKey: string, signal: AbortSignal) {
    var limit = 20;
    Get(getOrgFolderList(limit, startKey), signal).then(res => {
      if (res && res.status && res.status < 300) {
        if (res.data && res.data.folders && res.data.ScannedCount !== undefined) {
          //Get the list of all folders
          setOrgFolderList((prev) => [...prev, ...res.data.folders]);
          // setFilteredFolderList((prev) => [...prev, ...res.data.folders]);

          //Add creators to list
          var currentCreators = creatorList;
          res.data.folders.forEach((prompt: PromptType) => {
            if (currentCreators.some(p => p.sub === prompt.creator.sub)) {
              //creator is already in the list so move on
            } else {
              currentCreators.push(prompt.creator);
            }
          });
          setCreatorList(currentCreators); //update creator list

          //if the data is 20 prompts, then call for the next page
          //handle pages
          if (
            res.data.ScannedCount > 0 &&
            res.data.ScannedCount >= limit &&
            res.data.LastEvaluatedKey &&
            res.data.LastEvaluatedKey.id
          ) {
            getOrgFolders(res.data.LastEvaluatedKey.id, signal);
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
          // setError("No Folders Found");
          setIsLoading(false);
        }
      }
    });
  }

  function getUserFolders(startKey: string, signal: AbortSignal) {
    var limit = 20;
    Get(getUserFolderList(limit, startKey), signal).then(res => {
      if (res && res.status && res.status < 300) {
        if (res.data && res.data.folders && res.data.ScannedCount !== undefined) {
          //Get the list of all folders
          setUserFolderList((prev) => [...prev, ...res.data.folders]);
          // setFilteredFolderList((prev) => [...prev, ...res.data.folders]);

          //Add creators to list
          var currentCreators = creatorList;
          res.data.folders.forEach((prompt: PromptType) => {
            if (currentCreators.some(p => p.sub === prompt.creator.sub)) {
              //creator is already in the list so move on
            } else {
              currentCreators.push(prompt.creator);
            }
          });
          setCreatorList(currentCreators); //update creator list

          //if the data is 20 prompts, then call for the next page
          //handle pages
          if (
            res.data.ScannedCount > 0 &&
            res.data.ScannedCount >= limit &&
            res.data.LastEvaluatedKey &&
            res.data.LastEvaluatedKey.id
          ) {
            getUserFolders(res.data.LastEvaluatedKey.id, signal);
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
          // setError("No Folders Found");
          setIsLoading(false);
        }
      }
    });
  }

  function refreshList() {
    setIsLoading(true);
    const controller = new AbortController();
    getOrgFolders("", controller.signal)
    getUserFolders("", controller.signal)
  }


  return !isLoading ? (
    <div className="library">
      {error ? (
        <div>{error}</div>
      ) : (
        <>
          {/* TODO add searching and filtering  */}
          <div className="library__section-header">
            <h3>My Library</h3>
            <div>
              {user?.groups.includes(process.env.REACT_APP_INSTRUCTOR ? process.env.REACT_APP_INSTRUCTOR : "PapyrusAIInstructors") && (
                <Button variant="contained" onClick={() => console.log("here")}>Create Folder</Button>
              )}
            </div>
          </div>
          <hr />
          <div style={{ display: "flex", flexWrap: "wrap", width: "100%", justifyContent: "flex-start" }}>
            {orgFolderList.map((folder: FolderType, i) => {
              return (
                <Folder
                  isOrganizationFolder
                  displayName={folder.name}
                  onClick={() => navigator(`/library/org/${folder.id}`)}
                  folder={folder}
                  key={i}
                  refreshList={refreshList}
                />
              )
            })}
            {userFolderList.map((folder: FolderType, i) => {
              return (
                <Folder
                  displayName={folder.name}
                  onClick={() => navigator(`/library/${folder.id}`)}
                  folder={folder}
                  key={i}
                  refreshList={refreshList}
                />
              )
            })}
          </div>
        </>
      )}
    </div>
  ) : (
    <LinearProgress />
  )
}