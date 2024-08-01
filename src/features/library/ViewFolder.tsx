import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Button,
  IconButton,
  TextField,
} from "@mui/material";
import { FolderType, TagType } from "../../utility/types/CourseTypes";
import Get from "../../utility/Get";
import LinearProgress from '@mui/material/LinearProgress';
import { UserContext } from "../../utility/context/UserContext";
import { getOrgFolder, getUserFolder } from "../../utility/endpoints/FolderEndpoints";
import { AlertContext } from "../../utility/context/AlertContext";
import { getTagList } from "../../utility/endpoints/TagsEndpoints";
import ListPrompts from "./ListPrompts";
import FileUploadOutlined from "@mui/icons-material/FileUploadOutlined";


export enum SortOptions {
  Ascending = "Ascending",
  Descending = "Descending",
  Newest = "Newest",
  Oldest = "Oldest",
}

const AcceptedFileType = {
  Text: '.txt',
  Gif: '.gif',
  Jpeg: '.jpg',
  Png: '.png',
  Doc: '.doc',
  Pdf: '.pdf',
  AllImages: 'image/*',
  AllVideos: 'video/*',
  AllAudios: 'audio/*',
};

export default function ViewFolder(): JSX.Element {
  let location = useLocation();
  let navigator = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [folder, setFolder] = useState<FolderType>();
  const { user } = useContext(UserContext);
  const { setAlert } = useContext(AlertContext);
  const [tagList, setTagList] = useState<Array<TagType>>([]);
  const fileRef = React.useRef<any>();
  const acceptedFormats = (fileType: any) =>
    typeof fileType === 'string'
      ? fileType
      : Array.isArray(fileType)
        ? fileType?.join(',')
        : AcceptedFileType.Text;

  const [selectedFiles, setSelectedFiles] = React.useState<any>();

  const handleFileSelect = (event: any) => {
    setSelectedFiles(event?.target?.files?.[0]);
  };

  const onUpload = () => {
    console.log(selectedFiles);
  };

  const onClear = () => {
    setSelectedFiles(undefined);
  };

  const onUpdate = (event: any) => {
    if (event.target.textContent.trim().toLowerCase() === 'change' && fileRef.current) {
      onClear();
      fileRef.current.click();
      return;
    }
    if (event.target.textContent.trim().toLowerCase() === 'clear') {
      onClear();
      return;
    }
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

    if (tagList.length === 0) {
      getTags("", controller.signal)
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

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    e.preventDefault()
    console.log(e.target.value)
  }


  return !isLoading && folder ? (
    <div className="library">
      <div className="library__section-header">
        <h3>{folder?.name}</h3>
        <div>
          {user?.groups.includes(process.env.REACT_APP_INSTRUCTOR ? process.env.REACT_APP_INSTRUCTOR : "PapyrusAIInstructors") && (
            <>
              <Button variant="contained" onClick={() => {
                navigator(location.pathname.split("/")[2] !== "org" ?
                  `/library/${folder.id}/createprompt` : //user prompt
                  `/library/org/${folder.id}/createprompt`) //is org prompt
              }}>
                Create Prompt
              </Button>
            </>

          )}
        </div>
      </div>
      {/* <TextField
        variant="standard"
        type="text"
        InputProps={{
          endAdornment: (
            <IconButton component="label">
              <FileUploadOutlined />
              <input
                type="file"
                hidden
                onChange={handleUpload}
                name="[licenseFile]"
              />
            </IconButton>
          ),
        }}
      /> */}

      <>
        <input
          ref={fileRef}
          hidden
          type="file"
          // accept={acceptedFormats}
          onChange={handleFileSelect}
        />
        {!selectedFiles?.name && (
          <Button
            variant="contained"
            component="label"
            style={{ textTransform: 'none' }}
            onClick={() => fileRef.current?.click()}
          >
            Choose file to upload
          </Button>
        )}
        {selectedFiles?.name && (
          <Button
            variant="contained"
            component="label"
            style={{ textTransform: 'none' }}
            onClick={onUpdate}
          >
            <span style={{ float: 'left' }}> {selectedFiles?.name}</span>
            <span style={{ padding: '10px' }}> Change</span>
            <span>Clear</span>
          </Button>
        )}
        <Button
          color="primary"
          disabled={!selectedFiles}
          style={{ textTransform: 'none' }}
          onClick={onUpload}
        >
          Upload
        </Button>
      </>

      <ListPrompts folderId={folder.id} isOrgFolder={location.pathname.split("/")[2] === "org"} />
    </div>
  ) : (
    <LinearProgress />
  )
}