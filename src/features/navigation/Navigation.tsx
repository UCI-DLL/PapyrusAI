import React, { useContext, useState, useEffect } from "react";
import {
  Box,
  Button,
  ListItem,
  ListItemButton,
  ListItemText,
  // Menu,
  // MenuItem,
  List,
  Breadcrumbs,
  Link,
  Typography,
  SwipeableDrawer
} from "@mui/material";
import { UserContext } from "../../utility/context/UserContext";
import { useLocation, useNavigate } from "react-router";
// import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ViewSidebarOutlinedIcon from '@mui/icons-material/ViewSidebarOutlined';


export default function Navigation(): JSX.Element {
  const { user, setUser } = useContext(UserContext);
  let navigator = useNavigate();
  const location = useLocation();

  //little menu for logout and account
  // const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  // const open = Boolean(anchorEl);
  // const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
  //   setAnchorEl(event.currentTarget);
  // };
  // const handleClose = () => {
  //   setAnchorEl(null);
  // };

  //For the side drawer main nav menu
  // base this list off instuctor, admin, student access, and TAs
  var mainMenuList = user?.groups.includes(process.env.REACT_APP_INSTRUCTOR ? process.env.REACT_APP_INSTRUCTOR : "PapyrusAIInstructors") || 
  user?.groups.find(a=> a.includes("-TA")) ?
    user?.groups.includes(process.env.REACT_APP_ADMIN ? process.env.REACT_APP_ADMIN : "PapyrusAIAdmin") ?
      ["Dashboard", "Courses", "Modules", "Reports", "Prompts", "Account", "About"] :
      ["Dashboard", "Courses", "Modules", "Reports", "Account", "About"] :
    ["Dashboard", "Courses", "Modules", "Account", "About"];
  var mainMenuLinks = user?.groups.includes(process.env.REACT_APP_INSTRUCTOR ? process.env.REACT_APP_INSTRUCTOR : "PapyrusAIInstructors") || 
  user?.groups.find(a=> a.includes("-TA")) ?
    user?.groups.includes(process.env.REACT_APP_ADMIN ? process.env.REACT_APP_ADMIN : "PapyrusAIAdmin") ?
      ["/dashboard", "/courses", "/modules", "/reports", "/prompts", "/account", "/about"] :
      ["/dashboard", "/courses", "/modules", "/reports", "/account", "/about"] :
    ["/dashboard", "/courses", "/modules", "/account", "/about"];
  const [sideDrawer, setSideDrawer] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [breadcrumbText, setBreadcrumbText] = useState(["", ""])

  //create a use effect to get updated window size when user resizes window
  useEffect(() => {
    function handleResize() {
      setWindowWidth(window.innerWidth)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, []);

  useEffect(() => {
    //set breadcrumb text based on the url location
    /**
     * Dashboard > Overview
     * Courses
     * modules
     * Course # > modules
     * course # > module #
     * Chat
     * Reports
     * prompts
     * account
     * about
     */
    const pathnameSplit = location.pathname.split("/dashboard");
    if (location.pathname === "/dashboard") {
      setBreadcrumbText(["Dashboard", "Overview"])
    } else if (location.pathname === "/courses") {
      setBreadcrumbText(["Courses", ""])
    } else if (location.pathname === "/modules") {
      setBreadcrumbText(["All Modules", ""])
    } else if (
      pathnameSplit.length === 4 &&
      pathnameSplit[1] === "courses" &&
      pathnameSplit[3] === "modules"
    ) {
      setBreadcrumbText(["Modules", ""])
    } else if (
      pathnameSplit.length === 5 &&
      pathnameSplit[1] === "courses" &&
      pathnameSplit[3] === "editmodule"
    ) {
      setBreadcrumbText(["Edit Module", ""])
    } else if (
      pathnameSplit.length === 5 &&
      pathnameSplit[1] === "courses" &&
      pathnameSplit[3] === "modules"
    ) {
      setBreadcrumbText(["Conversations", ""])
    } else if (pathnameSplit[1] === "chat") { 
      setBreadcrumbText(["Chat", ""])
    } else if (pathnameSplit[1] === "reports") {
      setBreadcrumbText(["Reports", ""])
    } else if (location.pathname === "/account") {
      setBreadcrumbText(["Account", ""])
    } else if (location.pathname === "/about") {
      setBreadcrumbText(["About", ""])
    } else if (pathnameSplit[1] === "editcourse") {
      setBreadcrumbText(["Edit Course", ""])
    } else if (pathnameSplit[1] === "prompts") {
      setBreadcrumbText(["Prompt", ""])
    }
  }, [location.pathname])

  function handleLogOut() {
    setUser(null);
    localStorage.clear();
    navigator("/login");
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
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
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
        width: "14rem",
        paddingTop: "3rem",
        zIndex: "10000"
      }}>
        <nav>
          <List>
            {mainMenuList.map((text, index) => (
              <ListItem key={text} disablePadding>
                <ListItemButton
                  href={mainMenuLinks[index]}
                  selected={location.pathname === mainMenuLinks[index]}
                >
                  <ListItemText primary={text} />
                </ListItemButton>
              </ListItem>
            ))}
            <hr />
            <ListItem key={"logout"} disablePadding>
              <ListItemButton onClick={handleLogOut}>
                <ListItemText primary={"Log Out"} />
              </ListItemButton>
            </ListItem>
          </List>
        </nav>
        <div style={{ position: "fixed", bottom: "0", padding: "0.4rem", zIndex: "120" }}>
          <Button onClick={() => window.open("https://docs.google.com/forms/d/e/1FAIpQLSe1XsS-I2bhQyoWv_LwPTp-jVoFPqups9XBuPqvLmmWQByfVw/viewform", "_blank")}>
            Report Issue
          </Button>
        </div>
      </Box>
    </Box>
  );


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
        </header>

        <hr style={{ width: "100%" }} />
        <Box sx={{
          width: '100%',
          maxWidth: 360,
          bgcolor: 'background.paper',
          paddingTop: "3rem"
        }}>
          <nav aria-label="Main menu">
            <List sx={{ zIndex: "1000" }}>
              {mainMenuList.map((text, index) => (
                <ListItem key={text} disablePadding>
                  <ListItemButton
                    href={mainMenuLinks[index]}
                    selected={location.pathname === mainMenuLinks[index]}
                  >
                    <ListItemText primary={text} />
                  </ListItemButton>
                </ListItem>
              ))}
              <hr />
              <ListItem key={"logout"} disablePadding>
                <ListItemButton onClick={handleLogOut}>
                  <ListItemText primary={"Log Out"} />
                </ListItemButton>
              </ListItem>
            </List>
          </nav>
          <div style={{ position: "fixed", bottom: "0", padding: "0.4rem", zIndex: "120" }}>
            <Button onClick={() => window.open("https://docs.google.com/forms/d/e/1FAIpQLSe1XsS-I2bhQyoWv_LwPTp-jVoFPqups9XBuPqvLmmWQByfVw/viewform", "_blank")}>
              Report Issue
            </Button>
          </div>
        </Box>
      </div>

      <div className="top-breadcrumb-bar">
        {windowWidth < 1024 ? (
          <React.Fragment>
            <Button
              aria-controls="super-sidebar"
              onClick={toggleDrawer(true)}
            >
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

        <nav role="presentation">
          <Breadcrumbs aria-label="breadcrumb">
            {breadcrumbText[0] !== "" && breadcrumbText[1] !== "" ? (
              <Link
                underline="hover"
                color="inherit"
                href={
                  breadcrumbText[0] === "Dashboard" ? "/dashboard" :
                    `/courses/${breadcrumbText[0]}/modules`
                }
              >
                {breadcrumbText[0]}
              </Link>
            ) : (
              <Typography color="text.primary">{breadcrumbText[0]}</Typography>
            )}
            {breadcrumbText[1] !== "" && (
              <Typography color="text.primary">{breadcrumbText[1]}</Typography>
            )}
          </Breadcrumbs>
        </nav>

        &nbsp;&nbsp;&nbsp;

        {windowWidth < 1024 ? (
          <div style={{ opacity: "0", minWidth: "64px", padding: "6px 8px" }} aria-hidden="true">
            {/* <Button
              // id="basic-button"
              // aria-controls={open ? 'basic-menu' : undefined}
              // aria-haspopup="true"
              // aria-expanded={open ? 'true' : undefined}
              // onClick={handleClick}
            >
              <AccountCircleIcon />
            </Button> */}
            {/* <Menu
              id="basic-menu"
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              MenuListProps={{
                'aria-labelledby': 'basic-button',
              }}
              sx={{ zIndex: "100001" }}
            >
              <MenuItem onClick={() => navigator("/account")}>My account</MenuItem>
              <MenuItem onClick={handleLogOut}>Logout</MenuItem>
            </Menu> */}
          </div>
        ) : <></>}
      </div>
    </div>
  )
}

