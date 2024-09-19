

import React, { useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Button,
  Box,
  TextField,
  FormLabel,
  Select,
  MenuItem,
  ListItemText,
  SelectChangeEvent,
  LinearProgress,
  FormControl,
  InputLabel,
  ButtonGroup,
  Popper,
  Grow,
  Paper,
  ClickAwayListener,
  MenuList
} from "@mui/material";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import Get from "../../utility/Get";
import { TagType } from "../../utility/types/CourseTypes";
import { Checkbox } from "../../components/Checkbox";
import { AlertContext } from "../../utility/context/AlertContext";
import { Modal } from "../../components/Modal";
import { getTagList } from "../../utility/endpoints/TagsEndpoints";
import Post from "../../utility/Post";
import {
  getSignedS3BucketUploadOrgFolder,
  getSignedS3BucketUploadUserFolder,
  postCreateOrgFile,
  postCreateUserFile
} from "../../utility/endpoints/FolderEndpoints";
import axios from "axios";

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
    },
  },
};

const options = ['Save & Upload', 'Discard Changes'];

export default function CreateFile(): JSX.Element {
  let location = useLocation();
  let navigator = useNavigate();
  const [newFile, setNewFile] = useState<{
    name: string, file: string, tags: Array<string>, fileId: string
  }>({
    name: "", file: "", tags: [], fileId: ""
  });
  const [errors, setErrors] = useState<any>({
    name: "",
    file: "",
    tags: ""
  });
  const [fileInfo, setFileInfo] = useState<{
    isOrgFolder: boolean,
    folderId: string
  }>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { setAlert } = useContext(AlertContext);
  const [openSave, setOpenSave] = useState(false);
  const anchorRefSave = useRef<HTMLDivElement>(null);
  const [selectedIndexSave, setSelectedIndexSave] = useState(0);
  const [openDiscardModal, setOpenDiscardModal] = useState<boolean>(false);
  const [tagList, setTagList] = useState<Array<TagType>>([]);
  const fileRef = React.useRef<any>();

  const [selectedFiles, setSelectedFiles] = React.useState<any>();

  const handleFileSelect = (event: any) => {
    setSelectedFiles(event?.target?.files?.[0]);
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
      location.pathname.split("/")[2] === "org" &&
      location.pathname.split("/")[3] &&
      location.pathname.split("/")[4] === "createfile"
    ) {
      //get prev file data
      const folderId = location.pathname.split("/")[3];
      //save the ids
      setFileInfo({ isOrgFolder: true, folderId: folderId });
    } else if (
      location.pathname &&
      location.pathname.split("/") &&
      location.pathname.split("/")[1] &&
      location.pathname.split("/")[2] !== "org" &&
      location.pathname.split("/")[3] === "createfile"
    ) {
      //get prev file data
      const folderId = location.pathname.split("/")[2];
      //save the ids
      setFileInfo({ isOrgFolder: false, folderId: folderId });
    }

    if (tagList.length === 0) {
      getTags("", controller.signal)
    }

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line
  }, [location.pathname]);


  function getTags(startKey: string, signal: AbortSignal) {
    var limit = 20;
    Get(getTagList(limit, startKey), signal).then(res => {
      if (res && res.status && res.status < 300) {
        if (res.data && res.data.tags && res.data.ScannedCount !== undefined) {
          //Get the list of all folders
          setTagList((prev) => [...prev, ...res.data.tags]);
          //if the data is 20 files, then call for the next page
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

  function handleSaveClick(e: any) {
    if (selectedIndexSave === 0) { //Save and upload
      handleUpload(e);
    } else if (selectedIndexSave === 1) { //discard changes
      setOpenDiscardModal(true);
    }
  };

  const handleMenuItemClick = (
    e: React.MouseEvent<HTMLLIElement, MouseEvent>,
    index: number,
  ) => {
    if (index === 0) { //Save and upload
      handleUpload(e);
    } else if (index === 1) { //discard changes
      setOpenDiscardModal(true);
    }
    setSelectedIndexSave(index);
    setOpenSave(false);
  };

  const handleToggle = () => {
    setOpenSave((prevOpen) => !prevOpen);
  };

  const handleSaveClose = (event: Event) => {
    if (
      anchorRefSave.current &&
      anchorRefSave.current.contains(event.target as HTMLElement)
    ) {
      return;
    }

    setOpenSave(false);
  };

  function handleSubmit(id: string) {
    if (fileInfo && fileInfo.isOrgFolder) {
      const dataToSend = {
        name: newFile.name,
        isDeleted: false,
        tags: newFile.tags,
        id: id
      }
      // post data back
      Post(postCreateOrgFile(fileInfo.folderId), dataToSend).then((res) => {
        if (res.status && res.status < 300) {
          if (res.data && res.data) {
            //pop up notifying user of created
            setAlert({ message: "File Created", type: "success" })
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          // handle error
          if (res) {
            setAlert({ message: "File could not be created. Try again later.", type: "error" });
          }
        }
        navigator(`/library/org/${fileInfo.folderId}`);
      });
    } else if (fileInfo) {
      const dataToSend = {
        name: newFile.name,
        isDeleted: false,
        tags: newFile.tags,
        id: id
      }
      // post data back
      Post(postCreateUserFile(fileInfo.folderId), dataToSend).then((res) => {
        if (res.status && res.status < 300) {
          if (res.data && res.data) {
            //pop up notifying user of Created
            setAlert({ message: "File Created", type: "success" })
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          // set errors
          setAlert({ message: "File could not be created. Try again later.", type: "error" })
        }
        navigator(`/library/${fileInfo.folderId}`);
      });
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setNewFile((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  const handleSelectChange = (event: SelectChangeEvent<typeof newFile.tags>) => {
    const {
      target: { value },
    } = event;
    setNewFile((prev) => ({
      ...prev,
      tags: typeof value === 'string' ? value.split(',') : value
    }))
  };

  function handleUpload(e: any) {
    e.preventDefault();
    if (!selectedFiles) {
      setAlert({ message: "Missing File information", type: "error" });
      return
    }
    if (newFile.name === "") {
      setErrors((prev: any) => ({ ...prev, name: "Name is too short" }))
    }
    // Handle here
    if (fileInfo) {
      //if is org folder, then upload to org folder
      if (fileInfo?.isOrgFolder) {
        Get(getSignedS3BucketUploadOrgFolder(fileInfo.folderId)).then(res => {
          if (res && res.status && res.status < 300) {
            //handle upload to s3 -> handleUploadToS3
            if (res.data) {
              handleUploadToS3(res.data.url, res.data.metadataUrl, res.data.id);
            } else {
              //handle error
              setAlert({ message: "Error creating file. Please try again later", type: "error" })
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

      } else {//else an user folder
        Get(getSignedS3BucketUploadUserFolder(fileInfo.folderId)).then(res => {
          if (res && res.status && res.status < 300) {
            //handle upload to s3 -> handleUploadToS3
            if (res.data) {
              handleUploadToS3(res.data.url, res.data.metadataUrl, res.data.id);
            } else {
              //handle error
              setAlert({ message: "Error creating file. Please try again later", type: "error" })
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

    }
  }

  async function handleUploadToS3(url: string, metadataUrl: string, id: string) {
    try {
      // Upload original file directly to s3
      const uploadResponse = await axios.put(url, selectedFiles, {
        headers: {
          'Content-Type': selectedFiles.type
        }
      }).then(val => {
        handleSubmit(id);
      });
      console.log('Upload response:', uploadResponse);

      // Create corresponding metadata
      const metadata = {
        metadataAttributes: {
          filename: selectedFiles.name
        }
      };

      const metadataBlob = new Blob([JSON.stringify(metadata)]);

      // Upload the metadata
      const metadataResponse = await axios.put(metadataUrl, metadataBlob, {
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(res => {
        if (res && res.status && res.status < 300) {
          // metadata complete
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
      console.log('Metadata upload response:', metadataResponse);

    } catch (error) {
      console.error((error as Error).message);
    }
  }

  return fileInfo && !isLoading ? (
    <div className="prompt">
      <Modal
        isOpen={openDiscardModal}
        title={"Discard Changes?"}
        onRequestClose={() => setOpenDiscardModal(false)}
        actions={
          <>
            <Button variant="contained" color="primary" onClick={() => navigator(-1)}>
              Discard
            </Button>
            <Button variant="contained" color="secondary" onClick={() => setOpenDiscardModal(false)}>
              Cancel
            </Button>
          </>
        }
      >
        <div>Are you sure you would like to discard the changes to this file?</div>
      </Modal>
      <div className="prompt__section-header">
        <div>
          <h3>Create File</h3>
        </div>
        <div>
          <ButtonGroup
            variant="contained"
            ref={anchorRefSave}
            aria-label="Button group with a nested menu"
          >
            <Button onClick={handleSaveClick}>{options[selectedIndexSave]}</Button>
            <Button
              size="small"
              aria-controls={openSave ? 'split-button-menu' : undefined}
              aria-expanded={openSave ? 'true' : undefined}
              aria-label="select save and activation strategy"
              aria-haspopup="menu"
              onClick={handleToggle}
            >
              <ArrowDropDownIcon />
            </Button>
          </ButtonGroup>
          <Popper
            sx={{
              zIndex: 1,
            }}
            open={openSave}
            anchorEl={anchorRefSave.current}
            role={undefined}
            transition
            disablePortal
          >
            {({ TransitionProps, placement }) => (
              <Grow
                {...TransitionProps}
                style={{
                  transformOrigin:
                    placement === 'bottom' ? 'center top' : 'center bottom',
                }}
              >
                <Paper>
                  <ClickAwayListener onClickAway={handleSaveClose}>
                    <MenuList id="split-button-menu" autoFocusItem>
                      {options.map((option, index) => (
                        <MenuItem
                          key={option}
                          selected={index === selectedIndexSave}
                          onClick={(event) => handleMenuItemClick(event, index)}
                          className={index === 2 ? "file__discard_background" : ""}
                        >
                          {option}
                        </MenuItem>
                      ))}
                    </MenuList>
                  </ClickAwayListener>
                </Paper>
              </Grow>
            )}
          </Popper>
        </div>
      </div>
      <hr />
      <div className="prompt__section-header">
        <span>* indicates a required field</span>
      </div>
      <Box className="prompt__add">
        <form onSubmit={(e) => handleUpload(e)}>
          <FormLabel>Enter File Information</FormLabel>
          <TextField
            name="name"
            label="File Name"
            fullWidth
            sx={{ margin: ".5rem 0" }}
            value={newFile.name}
            onChange={handleChange}
            error={errors.name !== ""}
            helperText={errors.name}
            disabled={isLoading}
            required
          />
          <input
            ref={fileRef}
            hidden
            type="file"
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
            onClick={handleUpload}
          >
            Upload
          </Button>
          {/* add dropdown to handle tags  */}
          <FormControl fullWidth sx={{ margin: ".5rem 0" }}>
            <InputLabel id="multiple-tag-checkbox-select">Tags</InputLabel>
            <Select
              labelId="multiple-tag-checkbox-select"
              id="multiple-tag-checkbox-select"
              multiple
              value={newFile.tags}
              onChange={handleSelectChange}
              renderValue={(selected) => {//find the name for the file id
                return selected.map((id) => tagList.find((p) => p.id === id)?.id).join(', ');
              }}
              label="Tags"
              MenuProps={MenuProps}
              fullWidth
            >
              {tagList.map((tag, index) => (
                <MenuItem key={index} value={tag.id}>
                  <Checkbox checked={newFile.tags.indexOf(tag.id) > -1} />
                  <ListItemText primary={tag.id} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </form>
      </Box>
    </div>
  ) : (
    <LinearProgress />
  )
}