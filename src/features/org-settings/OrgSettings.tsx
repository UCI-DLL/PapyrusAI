import { useContext, useEffect, useState } from "react";
import Get from "../../utility/Get";
import { useNavigate } from "react-router";
import { OrgPermissionType } from "../../utility/types/OrganizationTypes";
import { getOrgPermissionsList, postCreateOrgPermission, updateOrgPermission } from "../../utility/endpoints/OrgSettingsEndpoints";
import {
  Button,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip
} from "@mui/material";
import { Modal } from "../../components/Modal";
import SearchIcon from '@mui/icons-material/Search';
import BlockIcon from '@mui/icons-material/Block';
import DeleteIcon from '@mui/icons-material/Delete';
import Put from "../../utility/Put";
import Post from "../../utility/Post";
import { AlertContext } from "../../utility/context/AlertContext";

export enum PermissionsOptions {
  Admin = "Admin",
  Instructor = "Instructor",
  None = "None",
}

export default function OrgSettings(): JSX.Element {
  let navigator = useNavigate();
  const { setAlert } = useContext(AlertContext);
  const [orgPermissionsList, setOrgPermissionsList] = useState<Array<OrgPermissionType>>([]); //org permissions list
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>();
  const [showAddOrgPermissionModal, setShowAddOrgPermissionModal] = useState<{
    open: boolean,
    email: string,
    permission: string
  }>({
    open: false,
    email: "",
    permission: "None"
  });
  const [showUpdateOrgPermissionModal, setShowUpdateOrgPermissionModal] = useState<{ //update permission modal
    id: string; //email
    permission: string
  }>({
    id: "",
    permission: "None"
  });
  const [openDeleteModal, setOpenDeleteModal] = useState<OrgPermissionType | undefined>(undefined);
  const [filter, setFilter] = useState<{
    search: string,
  }>({
    search: "", //email
  });
  const [filteredOrgPermissionList, setFilteredOrgPermissionList] = useState<Array<OrgPermissionType>>([]);

  useEffect(() => {
    const controller = new AbortController();
    if (!showAddOrgPermissionModal.open && orgPermissionsList.length === 0) {
      setIsLoading(true);
      getOrgPermissions("", controller.signal)
    }

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line
  }, [showAddOrgPermissionModal]);

  function getOrgPermissions(startKey: string, signal: AbortSignal) {
    var limit = 20;
    Get(getOrgPermissionsList(limit, startKey), signal).then(res => {
      if (res && res.status && res.status < 300) {
        if (res.data && res.data.permission && res.data.ScannedCount !== undefined) {
          //Get the list of all permissions
          setOrgPermissionsList((prev) => [...prev, ...res.data.permission]);
          setFilteredOrgPermissionList((prev) => [...prev, ...res.data.permission]);

          //if the data is 20 permissions, then call for the next page
          //handle pages
          if (
            res.data.ScannedCount > 0 &&
            res.data.ScannedCount >= limit &&
            res.data.LastEvaluatedKey &&
            res.data.LastEvaluatedKey.id
          ) {
            getOrgPermissions(res.data.LastEvaluatedKey.id, signal);
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
          setError("No Permissions Found");
          setIsLoading(false);
        }
      }
    });
  }

  useEffect(() => {
    var filteredList = orgPermissionsList;

    //handle search
    if (filter.search !== "") {
      filteredList = filteredList.filter(
        permission => permission.id.toLowerCase().includes(filter.search.toLowerCase()));
    }
    //then set filtered list
    setFilteredOrgPermissionList(filteredList);

  }, [filter, orgPermissionsList]);

  function handleSearchOrgPermissionList(e: React.ChangeEvent<HTMLInputElement>) {
    e.preventDefault()
    setFilter((prev) => ({ ...prev, search: e.target.value }));
  }

  function clearFilters() {
    setFilter({
      search: "",
    });
    setFilteredOrgPermissionList(orgPermissionsList);
  }

  function addPermission(e: React.FormEvent) {
    e.preventDefault();
    //add permissions
    if (showAddOrgPermissionModal.email === "") {
      setAlert({ message: "Missing Email", type: "error" });
      setShowAddOrgPermissionModal({
        open: false,
        email: "",
        permission: "None"
      })
    }
    else {
      // set is loading
      setIsLoading(true);
      const dataToSend = { //if admin, then admin and instructor permissions
        isAdmin: showAddOrgPermissionModal.permission === PermissionsOptions.Admin,
        isInstructor: showAddOrgPermissionModal.permission === PermissionsOptions.Instructor || showAddOrgPermissionModal.permission === PermissionsOptions.Admin,
        id: showAddOrgPermissionModal.email
      }
      // post data back
      Post(postCreateOrgPermission(), dataToSend).then((res) => {
        if (res.status && res.status < 300) {
          if (res.data && res.data) {
            // update list
            setOrgPermissionsList((prev) => ([...prev, res.data]))
            //pop up notifying user of creation
            setAlert({ message: "Permission added", type: "success" })
          }
        } else {
          // set errors
          setAlert({ message: res.data, type: "error" })
        }
        // set is loading back 
        setIsLoading(false);
        setShowAddOrgPermissionModal({
          open: false,
          email: "",
          permission: "None"
        })
      });
    }
  }

  function updatePermission(e: React.FormEvent) {
    e.preventDefault();
    //if permissions is none, then open delete modal
    if (showUpdateOrgPermissionModal.permission === PermissionsOptions.None) {
      setShowUpdateOrgPermissionModal({
        id: "",
        permission: ""
      })
      setOpenDeleteModal({ id: showUpdateOrgPermissionModal.id, isAdmin: false, isInstructor: false, organization: process.env.REACT_APP_ORGANIZATION ?? "" })
    } else {
      // set is loading
      setIsLoading(true);
      const dataToSend = { //if admin, then admin and instructor permissions
        isAdmin: showUpdateOrgPermissionModal.permission === PermissionsOptions.Admin,
        isInstructor: showUpdateOrgPermissionModal.permission === PermissionsOptions.Instructor || showUpdateOrgPermissionModal.permission === PermissionsOptions.Admin,
        id: showUpdateOrgPermissionModal.id,
        isDeleted: false,
      }
      // post data back
      Put(updateOrgPermission(showUpdateOrgPermissionModal.id), dataToSend).then((res) => {
        if (res.status && res.status < 300) {
          if (res.data && res.data) {
            // update list
            setOrgPermissionsList((prev) => {
              const index = prev.findIndex((x) => x.id === showUpdateOrgPermissionModal.id);
              const newList = prev;
              newList[index] = res.data;
              return newList;
            })
            //pop up notifying user of creation
            setAlert({ message: "Permission updated", type: "success" })
          }
        } else {
          // set errors
          setAlert({ message: res.data, type: "error" })
        }
        // set is loading back 
        setIsLoading(false);
        //then close modal
        setShowUpdateOrgPermissionModal({
          id: "",
          permission: ""
        })
      });
    }
  }

  function handleDelete() {
    // handle delete
    if (openDeleteModal) {
      // set is loading
      setIsLoading(true);
      const dataToSend = { //if admin, then admin and instructor permissions
        isAdmin: openDeleteModal.isAdmin,
        isInstructor: openDeleteModal.isInstructor,
        id: openDeleteModal.id,
        isDeleted: true,
      }
      // post data back
      Put(updateOrgPermission(openDeleteModal.id), dataToSend).then((res) => {
        if (res.status && res.status < 300) {
          if (res.data && res.data) {
            // update list
            setOrgPermissionsList((prev) => {
              const newList = prev.filter((x) => x.id !== openDeleteModal.id);
              return newList;
            })
            //pop up notifying user of creation
            setAlert({ message: "Permission removed", type: "success" })
          }
        } else {
          // set errors
          setAlert({ message: res.data, type: "error" })
        }
        // set is loading back 
        setIsLoading(false);
        //then close modal
        setOpenDeleteModal(undefined)
      });
    } else {
      setAlert({ message: "Something went wrong. Please contact support.", type: "error" })
    }
  }

  return !isLoading ? (
    <div className="org-settings">
      {error ? (
        <div>{error}</div>
      ) : (
        <>
          <div className="org-settings__section-header">
            <Modal
              isOpen={showAddOrgPermissionModal.open}
              title={"Add New Permissions"}
              onRequestClose={() => setShowAddOrgPermissionModal({
                open: false,
                email: "",
                permission: "None"
              })}
              actions={
                <Button sx={{ width: "100%" }} variant="contained" color="secondary" onClick={() => setShowAddOrgPermissionModal({
                  open: false,
                  email: "",
                  permission: "None"
                })}>
                  Cancel
                </Button>
              }
            >
              <form onSubmit={addPermission} style={{ display: "flex", flexDirection: "column" }}>
                <TextField
                  name="email"
                  label="email"
                  fullWidth
                  sx={{ margin: ".5rem 0" }}
                  value={showAddOrgPermissionModal.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShowAddOrgPermissionModal((prev) => ({ ...prev, email: e.target.value }))}
                  disabled={isLoading}
                  required
                />
                <FormControl sx={{ width: "100%", marginTop: "1rem" }}>
                  <InputLabel shrink={true} id="permission-select-label">Permission Level</InputLabel>
                  <Select
                    value={showAddOrgPermissionModal.permission}
                    onChange={(e: SelectChangeEvent) => {
                      setShowAddOrgPermissionModal((prev) => ({ ...prev, permission: PermissionsOptions[e.target.value as keyof typeof PermissionsOptions] }));
                    }}
                    label="Permission Level"
                    labelId="permission-select-label"
                    id="permission-select"
                    sx={{ maxWidth: '100%' }}
                    notched={true}
                  >
                    {Object.keys(PermissionsOptions).map(key => {
                      return (
                        <MenuItem value={key} key={key}>{key}</MenuItem>
                      )
                    })}
                  </Select>
                </FormControl>

                &nbsp;&nbsp;&nbsp;
                <Button
                  variant="contained"
                  onClick={addPermission}
                  type="submit"
                  disabled={isLoading}
                >
                  Add Permission
                </Button>
              </form>
            </Modal>
            <Modal
              isOpen={openDeleteModal !== undefined}
              title={"Remove All Permissions?"}
              onRequestClose={() => setOpenDeleteModal(undefined)}
              actions={
                <>
                  <Button variant="contained" color="error" onClick={handleDelete}>
                    Remove
                  </Button>
                  <Button variant="contained" color="secondary" onClick={() => setOpenDeleteModal(undefined)}>
                    Cancel
                  </Button>
                </>
              }
            >
              <div>Are you sure you would like to remove permissions from this user? {openDeleteModal?.id} will still have student level acess.</div>
            </Modal>
            <Modal
              isOpen={showUpdateOrgPermissionModal.id !== ""}
              title={"Update Permissions?"}
              onRequestClose={() => setShowUpdateOrgPermissionModal({
                id: "",
                permission: ""
              })}
              actions={
                <Button
                  variant="contained"
                  color="secondary"
                  sx={{ width: "100%" }}
                  onClick={() => setShowUpdateOrgPermissionModal({
                    id: "",
                    permission: ""
                  })}
                >
                  Cancel
                </Button>
              }
            >
              <form onSubmit={updatePermission} style={{ display: "flex", flexDirection: "column" }}>
                <div>Would you like to update the permissions for {showUpdateOrgPermissionModal.id}?</div>
                <FormControl sx={{ width: "100%", marginTop: "1rem" }}>
                  <InputLabel shrink={true} id="permission-select-label">Permission Level</InputLabel>
                  <Select
                    value={showUpdateOrgPermissionModal.permission}
                    onChange={(e: SelectChangeEvent) => {
                      setShowUpdateOrgPermissionModal((prev) => ({ ...prev, permission: PermissionsOptions[e.target.value as keyof typeof PermissionsOptions] }));
                    }}
                    label="Permission Level"
                    labelId="permission-select-label"
                    id="permission-select"
                    sx={{ maxWidth: '100%' }}
                    notched={true}
                  >
                    {Object.keys(PermissionsOptions).map(key => {
                      return (
                        <MenuItem value={key} key={key}>{key}</MenuItem>
                      )
                    })}
                  </Select>
                </FormControl>

                &nbsp;&nbsp;&nbsp;
                <Button
                  variant="contained"
                  onClick={updatePermission}
                  type="submit"
                  disabled={isLoading}
                >
                  Update Permission
                </Button>
              </form>
            </Modal>

            <h3>Organization Settings</h3>
            <div>
              <Button variant="contained" onClick={() => setShowAddOrgPermissionModal((prev) => ({ ...prev, open: true }))}>Add Permission</Button>
            </div>

          </div>
          <hr />

          {/* Filter, search  */}
          <div className="org-settings__filter">
            <FormControl fullWidth>
              <OutlinedInput
                id="outlined-adornment-message"
                placeholder="Search"
                sx={{ width: "100%" }}
                value={filter.search}
                onChange={handleSearchOrgPermissionList}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="sumbit new message"
                      edge="end"
                      type="submit"
                    >
                      {<SearchIcon />}
                    </IconButton>
                  </InputAdornment>
                }
              />
            </FormControl>
            &nbsp;&nbsp;&nbsp;
            <Button onClick={clearFilters}>Clear</Button>
          </div>

          <hr />

          {filteredOrgPermissionList.length > 0 ? (
            <div className="org-settings__list">
              <TableContainer component={Paper} aria-label="permissions list">
                <Table aria-label="simple table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Email</TableCell>
                      <TableCell align="right">Access Level</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredOrgPermissionList.map((permission, index) => (
                      <TableRow
                        key={index}
                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                      >
                        <TableCell component="th" scope="row">
                          <button onClick={() => setShowUpdateOrgPermissionModal({ id: permission.id, permission: permission.isAdmin ? "Admin" : permission.isInstructor ? "Instructor" : "None" })}>
                            {permission.id}
                          </button>
                        </TableCell>
                        <TableCell align="right">
                          <button onClick={() => setShowUpdateOrgPermissionModal({ id: permission.id, permission: permission.isAdmin ? "Admin" : permission.isInstructor ? "Instructor" : "None" })}>
                            {permission.isAdmin ? <span>Admin</span> : permission.isInstructor ? <span>Instructor</span> : <BlockIcon color="error" />}
                          </button>
                          &nbsp;
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
                              onClick={() => setOpenDeleteModal(permission)}
                              aria-label="Delete Module"
                              className="modules__delete_background"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
          ) : (
            <div>No available permissions</div>
          )}
        </>
      )}
    </div>
  ) : (
    <LinearProgress />
  )
}