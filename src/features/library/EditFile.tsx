

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
  Tooltip,
  IconButton,
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
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Get from "../../utility/Get";
import { FileType, TagType } from "../../utility/types/CourseTypes";
import { Checkbox } from "../../components/Checkbox";
import { AlertContext } from "../../utility/context/AlertContext";
import { Modal } from "../../components/Modal";
import { getTagList } from "../../utility/endpoints/TagsEndpoints";
import {
  getOrgFile,
  getSignedS3BucketDownloadFile,
  getSignedS3BucketUploadOrgFolder,
  getSignedS3BucketUploadUserFolder,
  getUserFile,
  putUpdateOrgFile,
  putUpdateUserFile
} from "../../utility/endpoints/FolderEndpoints";
import axios from "axios";
import { Document, Page, pdfjs } from 'react-pdf';
import Put from "../../utility/Put";
import DocViewer, { DocViewerRenderers } from "react-doc-viewer";
import CustomFileRender from "../../components/CustomFileRender";


const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
    },
  },
};

const options = ['Save & Publish', 'Discard Changes'];

export default function EditFile(): JSX.Element {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  let location = useLocation();
  let navigator = useNavigate();
  const [file, setFile] = useState<FileType>();
  const [newFile, setNewFile] = useState<{
    name: string, id: string, tags: Array<string>, url: string
  }>({
    name: "", id: "", tags: [], url: ""
  });
  const [errors, setErrors] = useState<any>({
    name: "",
    file: "",
    tags: ""
  });
  const [fileInfo, setFileInfo] = useState<{
    isOrgFolder: boolean,
    folderId: string,
    fileId: string
  }>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { setAlert } = useContext(AlertContext);
  const [openSave, setOpenSave] = useState(false);
  const anchorRefSave = useRef<HTMLDivElement>(null);
  const [selectedIndexSave, setSelectedIndexSave] = useState(0);
  const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
  const [openDiscardModal, setOpenDiscardModal] = useState<boolean>(false);
  const [tagList, setTagList] = useState<Array<TagType>>([]);

  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);

  /*To Prevent right click on screen*/
  document.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });

  /*When document gets loaded successfully*/
  function onDocumentLoadSuccess({ numPages }: any) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  function changePage(offset: number) {
    setPageNumber(prevPageNumber => prevPageNumber + offset);
  }

  function previousPage() {
    changePage(-1);
  }

  function nextPage() {
    changePage(1);
  }

  const fileRef = React.useRef<any>();

  const [selectedFiles, setSelectedFiles] = React.useState<any>();

  const handleFileSelect = (event: any) => {
    const file = event?.target?.files?.[0];

    if (file) {
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', //docx
        "text/plain"
      ];

      if (allowedTypes.includes(file.type)) {
        setErrors((prev: any) => ({ ...prev, file: '' }));
        setSelectedFiles(file);
      } else {
        setErrors((prev: any) => ({ ...prev, file: 'Invalid file type. Please select a JPEG, PNG, PDF, TXT, DOCX file.' }));
        setSelectedFiles(null);
      }
    }
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
      location.pathname.split("/")[4] === "files" &&
      location.pathname.split("/")[5]
    ) {
      //get prev file data
      const folderId = location.pathname.split("/")[3];
      const fileId = location.pathname.split("/")[5]
      //save the ids
      setFileInfo({ isOrgFolder: true, folderId: folderId, fileId: fileId });
      getFile(true, folderId, fileId, controller.signal)
    } else if (
      location.pathname &&
      location.pathname.split("/") &&
      location.pathname.split("/")[1] &&
      location.pathname.split("/")[2] !== "org" &&
      location.pathname.split("/")[3] === "files" &&
      location.pathname.split("/")[4]
    ) {
      //get prev file data
      const folderId = location.pathname.split("/")[2];
      const fileId = location.pathname.split("/")[4]
      //save the ids
      setFileInfo({ isOrgFolder: false, folderId: folderId, fileId: fileId });
      getFile(false, folderId, fileId, controller.signal)
    }

    if (tagList.length === 0) {
      getTags("", controller.signal)
    }

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line
  }, [location.pathname]);

  function getFile(isOrg: boolean, folderId: string, fileId: string, signal: AbortSignal) {
    if (!isOrg) {
      Get(getUserFile(folderId, fileId), signal).then(res => {
        if (res && res.status && res.status < 300) {
          if (res.data) {
            //also set session
            setFile(res.data);
            if (res.data.fileReference) {
              //pass fileReference
              Get(getSignedS3BucketDownloadFile(res.data.fileReference), signal).then(async res1 => {
                if (res1 && res1.status && res1.status < 300) {
                  if (res1.data) {
                    //also set session
                    //if txt file, get txt to replace url
                    if (res.data.fileReference.split(".")[1] === "txt") {
                      const temp = await fetch(res1.data.url).then((r) => {
                        return r.text()
                      })
                      setNewFile({ name: res.data.name, id: res.data.id, tags: res.data.tags, url: temp })
                    } else {
                      setNewFile({ name: res.data.name, id: res.data.id, tags: res.data.tags, url: res1.data.url })
                    }
                  }
                } else if (res1 && res1.status === 401) {
                  navigator("/login");
                } else {
                  if (res1 === undefined) {
                  } else {
                    //handle error
                    //redirect to file list
                    navigator("/library");
                    setAlert({ message: "File Does Not Exist", type: "error" });
                  }
                }
                setIsLoading(false);
              });
            } else {
              setNewFile({ name: res.data.name, id: res.data.id, tags: res.data.tags, url: "" })
              setIsLoading(false);
            }
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          if (res === undefined) {
          } else {
            //handle error
            //redirect to file list
            navigator("/library");
            setAlert({ message: "File Does Not Exist", type: "error" });
            setIsLoading(false);
          }
        }
      });
    } else {
      Get(getOrgFile(folderId, fileId), signal).then(res => {
        if (res && res.status && res.status < 300) {
          if (res.data) {
            //also set session
            setFile(res.data);
            if (res.data.fileReference) {
              //pass fileReference
              Get(getSignedS3BucketDownloadFile(res.data.fileReference), signal).then(async res1 => {
                if (res1 && res1.status && res1.status < 300) {
                  if (res1.data) {
                    //also set session
                    //if txt file, get txt to replace url
                    if (res.data.fileReference.split(".")[1] === "txt") {
                      const temp = await fetch(res1.data.url).then((r) => {
                        return r.text()
                      })
                      setNewFile({ name: res.data.name, id: res.data.id, tags: res.data.tags, url: temp })
                    } else {
                      setNewFile({ name: res.data.name, id: res.data.id, tags: res.data.tags, url: res1.data.url })
                    }
                  }
                } else if (res1 && res1.status === 401) {
                  navigator("/login");
                } else {
                  if (res1 === undefined) {
                  } else {
                    //handle error
                    //redirect to file list
                    navigator("/library");
                    setAlert({ message: "File Does Not Exist", type: "error" });
                  }
                }
                setIsLoading(false);
              });
            } else {
              setNewFile({ name: res.data.name, id: res.data.id, tags: res.data.tags, url: "" })
              setIsLoading(false)
            }
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          if (res === undefined) {
          } else {
            //handle error
            //redirect to file list
            navigator("/library");
            setAlert({ message: "File Does Not Exist", type: "error" });
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
          //if the data is 20 files, then call for the next page
          //handle pages
          if (
            res.data.ScannedCount > 0 &&
            res.data.ScannedCount >= limit &&
            res.data.LastEvaluatedKey &&
            res.data.LastEvaluatedKey.id
          ) {
            getTags(res.data.LastEvaluatedKey.id, signal);
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
    setIsLoading(true)
    if (selectedIndexSave === 0 && file) { //Save and activate
      handleUpload(e, false);
    } else if (selectedIndexSave === 1) { //discard changes
      setOpenDiscardModal(true);
    }
  };

  const handleMenuItemClick = (
    e: React.MouseEvent<HTMLLIElement, MouseEvent>,
    index: number,
  ) => {
    if (index === 0) { //Save and activate
      handleUpload(e, false);
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

  function handleSubmit(id: string, isDeleted = false) {
    setIsLoading(true);
    const dataToSend = {
      name: newFile.name,
      isDeleted: isDeleted,
      tags: newFile.tags,
      id: id
    }
    if (fileInfo && fileInfo.isOrgFolder) {
      // put data back
      Put(putUpdateOrgFile(fileInfo.folderId, fileInfo.fileId), dataToSend).then((res) => {
        if (res.status && res.status < 300) {
          if (res.data && res.data) {
            //pop up notifying user of update
            setAlert({ message: "File Updated", type: "success" })
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          // handle error
          if (res) {
            setAlert({ message: "File could not be updated. Try again later.", type: "error" });
          }
        }
        navigator(`/library/org/${fileInfo.folderId}`);
        setIsLoading(false);
      });
    } else if (fileInfo) {
      // put data back
      Put(putUpdateUserFile(fileInfo.folderId, fileInfo.fileId), dataToSend).then((res) => {
        if (res.status && res.status < 300) {
          if (res.data && res.data) {
            //pop up notifying user of updated
            setAlert({ message: "File updated", type: "success" })
          }
        } else if (res && res.status === 401) {
          navigator("/login");
        } else {
          // set errors
          setAlert({ message: "File could not be updated. Try again later.", type: "error" })
        }
        navigator(`/library/${fileInfo.folderId}`);
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
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

  function handleUpload(e: React.FormEvent, isDeleted = false) {
    e.preventDefault();
    if (newFile.name === "") {
      setErrors((prev: any) => ({ ...prev, name: "Name is too short" }))
    }
    //if new file selected, then get the signed upload url
    //else just update the file information
    if (selectedFiles) {
      // Handle here
      if (fileInfo) {
        var fileId = fileInfo.fileId
        if (selectedFiles) {
          const ext = selectedFiles.name.includes(".") ? "." + selectedFiles.name.split('.').pop() : "";
          fileId = Date.now() + "" + Math.floor(100000 + Math.random() * 900000) + ext;
        }
        //if is org folder, then upload to org folder
        if (fileInfo?.isOrgFolder) {
          Get(getSignedS3BucketUploadOrgFolder(fileInfo.folderId, fileId)).then(res => {
            if (res && res.status && res.status < 300) {
              if (res.data) {
                handleUploadToS3(res.data.url, res.data.id);
              } else {
                //handle error
                setAlert({ message: "Error updating file. Please try again later", type: "error" })
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
          Get(getSignedS3BucketUploadUserFolder(fileInfo.folderId, fileId)).then(res => {
            if (res && res.status && res.status < 300) {
              if (res.data) {
                handleUploadToS3(res.data.url, res.data.id);
              } else {
                //handle error
                setAlert({ message: "Error updating file. Please try again later", type: "error" })
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
    } else if (file && file.id) {
      handleSubmit(file.id, isDeleted);
    }
  }

  async function handleUploadToS3(url: string, id: string) {
    try {
      // Upload original file directly to s3
      await axios.put(url, selectedFiles, {
        headers: {
          'Content-Type': selectedFiles.type
        }
      }).then(res => {
        if (res && res.status && res.status < 300) {
          handleSubmit(id);

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

    } catch (error) {
      console.error((error as Error).message);
    }
  }

  function renderFile(): React.JSX.Element {
    if (file && file.fileReference) {
      switch (file.fileReference.split(".")[1].toLocaleLowerCase()) {
        case "txt": {
          return (
            <div>{newFile && newFile.url ? newFile.url : ""}</div>
          );
        }
        case "pdf":
          // {/* https://www.geeksforgeeks.org/how-to-display-a-pdf-as-an-image-in-react-app-using-url/ */}
          return (
            <div>
              <div>Current File</div>
              <div style={{ display: "flex", flexDirection: "row" }}>
                <IconButton
                  type="button"
                  disabled={pageNumber <= 1}
                  onClick={previousPage}
                  className="Pre"
                >
                  <ChevronLeftIcon />
                </IconButton>
                <div style={{ alignSelf: "center" }}>
                  Page {pageNumber || (numPages ? 1 : '--')} of {numPages || '--'}
                </div>
                <IconButton
                  type="button"
                  disabled={pageNumber >= numPages}
                  onClick={nextPage}
                >
                  <ChevronRightIcon />
                </IconButton>
              </div>
              <Document
                file={newFile.url}
                onLoadSuccess={onDocumentLoadSuccess}>
                <Page pageNumber={pageNumber} renderTextLayer={false} renderAnnotationLayer={false} />
              </Document>
            </div>
          )
        case "png":
          return (
            <img style={{ width: "100%" }} src={newFile && newFile.url ? newFile.url : ""} alt="File" />
          )
        case "jpg":
          return (
            <img style={{ width: "100%" }} src={newFile && newFile.url ? newFile.url : ""} alt="File" />
          )
        case "jpeg":
          return (
            <img style={{ width: "100%" }} src={newFile && newFile.url ? newFile.url : ""} alt="File" />
          )
        case "docx":
          const doc = [{ uri: newFile && newFile.url ? newFile.url : "", fileType: 'docx' }];
          return <DocViewer
            pluginRenderers={[CustomFileRender, ...DocViewerRenderers]}
            documents={doc}
            style={{ width: "100%", height: 500 }}
            config={{
              header: {
                disableHeader: false,
                disableFileName: true,
                retainURLParams: false
              }
            }}
          />;
        default:
          return <></>
      }
    } else {
      return <></>
    }

  }

  return fileInfo && !isLoading ? (
    <div className="prompt">
      {newFile.name ? (
        <>
          <Modal
            isOpen={openDeleteModal}
            title={"Delete File?"}
            onRequestClose={() => setOpenDeleteModal(false)}
            actions={
              <>
                <Button variant="contained" color="error" onClick={(e) => handleUpload(e, true)}>
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
              <h3>Edit {file?.name}</h3>
            </div>
            <div>
              <Tooltip
                title={"Delete"}
                arrow
                componentsProps={{
                  tooltip: {
                    sx: {
                      bgcolor: '#da0222', //error color
                      '& .MuiTooltip-arrow': {
                        color: '#da0222',
                      },
                    },
                  },
                }}
              >
                <IconButton
                  onClick={() => setOpenDeleteModal(true)}
                  aria-label="Delete File"
                  className="file__delete_background"
                  disabled={isLoading}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
              &nbsp;&nbsp;&nbsp;
              <ButtonGroup
                variant="contained"
                ref={anchorRefSave}
                aria-label="Button group with a nested menu"
              >
                <Button onClick={handleSaveClick} disabled={isLoading}>{options[selectedIndexSave]}</Button>
                <Button
                  size="small"
                  aria-controls={openSave ? 'split-button-menu' : undefined}
                  aria-expanded={openSave ? 'true' : undefined}
                  aria-label="select save and activation strategy"
                  aria-haspopup="menu"
                  onClick={handleToggle}
                  disabled={isLoading}
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
            <form onSubmit={(e) => handleUpload(e, false)}>
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
                disabled={isLoading}
              />
              {!selectedFiles?.name && (
                <Button
                  variant="contained"
                  component="label"
                  style={{ textTransform: 'none' }}
                  onClick={() => fileRef.current?.click()}
                  disabled={isLoading}
                >
                  Choose new file to upload
                </Button>
              )}
              {selectedFiles?.name && (
                <Button
                  variant="contained"
                  component="label"
                  style={{ textTransform: 'none' }}
                  onClick={onUpdate}
                  disabled={isLoading}
                >
                  <span style={{ float: 'left' }}> {selectedFiles?.name}</span>
                  <span style={{ padding: '10px' }}> Change</span>
                  <span>Clear</span>
                </Button>
              )}
              {errors.file && errors.file !== "" && (
                <span className="error">&nbsp;{errors.file}</span>
              )}

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
                  disabled={isLoading}
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
            <hr />

            {/* render file view  */}
            {newFile && newFile.url &&
              renderFile()
            }
          </Box>
        </>
      ) : (
        <div>File does not exist</div>
      )}
    </div>
  ) : (
    <LinearProgress />
  )
}