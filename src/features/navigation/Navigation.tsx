import React, { useContext, useState, useEffect } from "react";
import {
  Box,
  Button,
  ListItem,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  List,
  Breadcrumbs,
  Link,
  Typography,
  SwipeableDrawer
} from "@mui/material";
import { UserContext } from "../../utility/context/UserContext";
import { useLocation, useNavigate } from "react-router";
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ViewSidebarOutlinedIcon from '@mui/icons-material/ViewSidebarOutlined';


export default function NavigationTwo(): JSX.Element {
  const { setUser } = useContext(UserContext);
  let navigator = useNavigate();
  const location = useLocation();

  //little menu for logout and account
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    console.log("here")
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  //For the side drawer main nav menu
  //TODO base this list off instuctor, researcher, student access
  const mainMenuList = ["Dashboard", "Courses", "Assignments", "Free Chat", "Reports"];
  const mainMenuLinks = ["/", "/courses", "/assignments", "/module", "reports"]
  const [sideDrawer, setSideDrawer] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  //create a use effect to get updated window size when user resizes window
  useEffect(() => {
    function handleResize() {
      setWindowWidth(window.innerWidth)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, []);

  function handleLogOut() {
    setUser(null);
    localStorage.clear();
    navigator("/login");
  }

  function handleBreadCrumbClick(event: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    event.preventDefault();
    console.info('You clicked a breadcrumb. TODO');
  }

  const toggleDrawer =
    (open: boolean) =>
      (event: React.KeyboardEvent | React.MouseEvent) => {
        if (
          event &&
          event.type === 'keydown' &&
          ((event as React.KeyboardEvent).key === 'Tab' ||
            (event as React.KeyboardEvent).key === 'Shift')
        ) {
          return;
        }

        setSideDrawer(open);
      };

  //Mobile drawer list
  const list = () => (
    <Box
      sx={{ width: 'auto' }}
      role="presentation"
      // onClick={toggleDrawer(false)}
      // onKeyDown={toggleDrawer(false)}
      className={"top-nav-title"}
    >
      <header className="top">
        <a href={"/"} className="top__logo" aria-label="PapyrusAI">
          <span className="for-screen-readers-only">PapyrusAI</span>
          <span className="top__logo-dimensions">
            <img src="/dll-logo-noname.png" alt="PapyrusAI logo" />
            <h6 className="top__logo-title">PapyrusAI</h6>
          </span>
          &nbsp;&nbsp;&nbsp;
        </a>
      </header>

      &nbsp;&nbsp;&nbsp;
      <Box sx={{
        position: "fixed",
        width: "100%",
        paddingTop: "3rem",
        zIndex: "100000"
      }}>
        <nav>
          <List>
            {mainMenuList.map((text, index) => (
              <ListItem key={text} disablePadding>
                <ListItemButton href={mainMenuLinks[index]} selected={location.pathname === mainMenuLinks[index]}>
                  <ListItemText primary={text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </nav>
      </Box>
    </Box>
  );

  console.log(location.pathname)

  return (
    <div>
      <div className="navigation top-nav-title">
        <header className="top">
          <a href={"/"} className="top__logo" aria-label="PapyrusAI Logo" >
            <span className="for-screen-readers-only">PapyrusAI</span>
            <span className="top__logo-dimensions">
              <img src="/dll-logo-noname.png" alt="PapyrusAI logo" />
              <h6 className="top__logo-title">PapyrusAI</h6>
            </span>
          </a>

          <Button
            id="basic-button"
            aria-controls={open ? 'basic-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
            onClick={handleClick}
          >
            <AccountCircleIcon fontSize="large" />
          </Button>
          <Menu
            id="basic-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            MenuListProps={{
              'aria-labelledby': 'basic-button',
            }}
            sx={{ zIndex: "10001" }}
          >
            {/* //TODO handle this  */}
            <MenuItem onClick={handleClose}>My account</MenuItem>
            <MenuItem onClick={handleLogOut}>Logout</MenuItem>
          </Menu>

        </header>

        <hr style={{ width: "100%" }} />
        <Box sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper', paddingTop: "3rem" }}>
          <nav aria-label="temp todo">
            <List sx={{ zIndex: "1000" }}>
              {mainMenuList.map((text, index) => (
                <ListItem key={text} disablePadding>
                  {/* TODO update links  */}
                  <ListItemButton href={mainMenuLinks[index]} selected={location.pathname === mainMenuLinks[index]}>
                    <ListItemText primary={text} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </nav>
        </Box>
      </div>

      <div className="top-breadcrumb-bar">
        {windowWidth < 1024 ? (
          <React.Fragment>
            <Button aria-controls="super-sidebar" onClick={toggleDrawer(true)}>
              <ViewSidebarOutlinedIcon />
            </Button>
            <SwipeableDrawer
              anchor={"left"}
              open={sideDrawer}
              onClose={toggleDrawer(false)}
              onOpen={toggleDrawer(true)}
            >
              {list()}
            </SwipeableDrawer>
          </React.Fragment>
        ) : <></>}

        &nbsp;&nbsp;&nbsp;

{/* TODO handle different breadcrumb links */}
        <nav role="presentation" onClick={handleBreadCrumbClick}>
          <Breadcrumbs aria-label="breadcrumb">
            <Link underline="hover" color="inherit" href="/">
              Dashboard
            </Link>
            <Typography color="text.primary">Overview</Typography>
          </Breadcrumbs>
        </nav>

        &nbsp;&nbsp;&nbsp;

        {windowWidth < 1024 ? (
          <div>
            <Button
              id="basic-button"
              aria-controls={open ? 'basic-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
              onClick={handleClick}
            >
              <AccountCircleIcon />
            </Button>
            <Menu
              id="basic-menu"
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              MenuListProps={{
                'aria-labelledby': 'basic-button',
              }}
              sx={{ zIndex: "100001" }}
            >
              {/* //TODO handle this  */}
              <MenuItem onClick={handleClose}>My account</MenuItem>
              <MenuItem onClick={handleLogOut}>Logout</MenuItem>
            </Menu>
          </div>
        ) : <></>}
      </div>
    </div>
  )
}

/**
 * Dashboard > Overview
 * Courses
 * Course # > Assignments
 * course # > assignment #
 * Free Chat
 * Reports
 */