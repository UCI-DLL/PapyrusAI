import React, { useContext, useState, useEffect } from "react";
import { UserContext } from "../../utility/context/UserContext";
import { useLocation, useNavigate } from "react-router";
import {
  Home,
  BookOpen,
  Layers,
  BarChart3,
  Library,
  User,
  Info,
  Settings,
  ExternalLink,
  LogOut,
  HelpCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from "../../components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { Button } from "../../components/ui/button";

// Icon mapping for menu items
const menuIcons: Record<string, React.ComponentType<any>> = {
  Dashboard: Home,
  Courses: BookOpen,
  Modules: Layers,
  Reports: BarChart3,
  Library: Library,
  Account: User,
  About: Info,
  Settings: Settings,
};

// NavigationContent component to be used inside SidebarProvider
interface NavigationContentProps {
  children: React.ReactNode;
}

function NavigationContent({ children }: NavigationContentProps): JSX.Element {
  const { user, setUser } = useContext(UserContext);
  let navigator = useNavigate();
  const location = useLocation();
  const { state, openMobile, setOpenMobile } = useSidebar();

  // For the side drawer main nav menu
  // base this list off instructor, admin, student access, and TAs
  // tas dont have access to library
  const [mainMenuList, setMainMenuList] = useState([
    "Dashboard",
    "Courses",
    "Account",
    "About",
  ]);
  const [mainMenuLinks, setMainMenuLinks] = useState([
    "/",
    "/courses",
    "/account",
    "/about",
  ]);
  const [breadcrumbText, setBreadcrumbText] = useState(["", ""]);

  // decide nav bar based on user permissions
  useEffect(() => {
    if (user) {
      if (user.groups.find((a) => a.includes("-TA"))) {
        setMainMenuList([
          "Dashboard",
          "Courses",
          "Reports",
          "Account",
          "About",
        ]);
        setMainMenuLinks(["/", "/courses", "/reports", "/account", "/about"]);
      }
      if (
        user?.groups.includes(
          process.env.REACT_APP_INSTRUCTOR
            ? process.env.REACT_APP_INSTRUCTOR
            : "PapyrusAIInstructors"
        )
      ) {
        setMainMenuList([
          "Dashboard",
          "Courses",
          "Reports",
          "Library",
          "Account",
          "About",
        ]);
        setMainMenuLinks([
          "/",
          "/courses",
          "/reports",
          "/library",
          "/account",
          "/about",
        ]);
      }
      if (
        user?.groups.includes(
          process.env.REACT_APP_ADMIN
            ? process.env.REACT_APP_ADMIN
            : "PapyrusAIAdmin"
        )
      ) {
        setMainMenuList([
          "Dashboard",
          "Courses",
          "Reports",
          "Library",
          "Account",
          "About",
          "Settings",
        ]);
        setMainMenuLinks([
          "/",
          "/courses",
          "/reports",
          "/library",
          "/account",
          "/about",
          "/org-settings",
        ]);
      }
    }
  }, [user]);

  useEffect(() => {
    //set breadcrumb text based on the url location
    const pathnameSplit = location.pathname.split("/");

    // Handle root dashboard
    if (location.pathname === "/") {
      setBreadcrumbText(["Dashboard", ""]);
    }
    // Handle courses list
    else if (location.pathname === "/courses") {
      setBreadcrumbText(["Courses", ""]);
    }
    // Handle all modules
    else if (location.pathname === "/modules") {
      setBreadcrumbText(["All Modules", ""]);
    }
    // Handle course-specific modules: /courses/:id/modules
    else if (
      pathnameSplit.length === 4 &&
      pathnameSplit[1] === "courses" &&
      pathnameSplit[3] === "modules"
    ) {
      setBreadcrumbText(["Courses", "Modules"]);
    }
    // Handle conversations in a module: /courses/:id/modules/:id
    else if (
      pathnameSplit.length === 5 &&
      pathnameSplit[1] === "courses" &&
      pathnameSplit[3] === "modules"
    ) {
      setBreadcrumbText(["Courses", "Conversations"]);
    }
    // Handle chat: /chat/:id/:id/:id/:id
    else if (pathnameSplit[1] === "chat") {
      setBreadcrumbText(["Courses", "Chat"]);
    }
    // Handle edit module: /courses/:id/editmodule/:id
    else if (
      pathnameSplit.length === 5 &&
      pathnameSplit[1] === "courses" &&
      pathnameSplit[3] === "editmodule"
    ) {
      setBreadcrumbText(["Courses", "Edit Module"]);
    }
    // Handle edit course: /editcourse/:id
    else if (pathnameSplit[1] === "editcourse") {
      setBreadcrumbText(["Courses", "Edit Course"]);
    }
    // Handle create course: /createcourse
    else if (pathnameSplit[1] === "createcourse") {
      setBreadcrumbText(["Courses", "Create Course"]);
    }
    // Handle add module: /addmodule
    else if (pathnameSplit[1] === "addmodule") {
      setBreadcrumbText(["Modules", "Add Module"]);
    }
    // Handle reports
    else if (pathnameSplit[1] === "reports") {
      setBreadcrumbText(["Reports", ""]);
    }
    // Handle account
    else if (location.pathname === "/account") {
      setBreadcrumbText(["Account", ""]);
    }
    // Handle about
    else if (location.pathname === "/about") {
      setBreadcrumbText(["About", ""]);
    }
    // Handle library
    else if (pathnameSplit[1] === "library") {
      setBreadcrumbText(["Library", ""]);
    }
    // Handle prompts (hidden)
    else if (pathnameSplit[1] === "prompts") {
      setBreadcrumbText(["Prompts", ""]);
    }
    // Handle organization settings
    else if (pathnameSplit[1] === "org-settings") {
      setBreadcrumbText(["Organization Settings", ""]);
    }
    // Default fallback
    else {
      setBreadcrumbText(["Dashboard", ""]);
    }
  }, [location.pathname]);

  function handleLogOut() {
    setUser(null);
    localStorage.clear();
    navigator("/login");
    window.location.replace(
      process.env.REACT_APP_LOGIN_URL ? process.env.REACT_APP_LOGIN_URL : ""
    );
  }

  return (
    <div className="flex h-screen w-full">
      <Sidebar collapsible="icon" variant="sidebar">
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="flex items-center gap-3 px-4 py-2" style={state === "collapsed" && !openMobile ? { padding: "0" } : {}}>
            <img
              src="/dll-logo-noname.png"
              alt="PapyrusAI logo"
              className="h-8 w-8 shrink-0"
            />
            <h6 className="text-lg font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
              PapyrusAI
            </h6>
          </div>
        </SidebarHeader>

        <SidebarContent className="py-4">
          <SidebarGroup className="space-y-1">
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {mainMenuList.map((text, index) => {
                  const IconComponent = menuIcons[text];
                  const isActive = location.pathname === mainMenuLinks[index];

                  return (
                    <SidebarMenuItem key={text}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className="h-10 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:bg-accent data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground cursor-pointer"
                      >
                        <Link
                          to={mainMenuLinks[index]}
                          className="no-underline"
                          onClick={() => setOpenMobile(false)}
                        >
                          <div className="flex items-center gap-3">
                            {IconComponent && (
                              <IconComponent className="h-4 w-4 shrink-0" />
                            )}
                            <span className="text-sm font-medium">{text}</span>
                          </div>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <div className="flex-1" />

          <SidebarGroup className="space-y-1">
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() =>
                      window.open(
                        "https://www.genaied.org/resources.html",
                        "_blank"
                      )
                    }
                    className="h-10 rounded-lg px-3 text-sidebar-foreground hover:bg-sidebar-accent hover:bg-accent"
                    tooltip="Resources"
                  >
                    <ExternalLink className="h-4 w-4 shrink-0" />
                    <span className="text-sm font-medium">Resources</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border px-2 py-4">
          <SidebarMenu className="space-y-1">
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogOut}
                className="h-10 rounded-lg px-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
                tooltip="Log Out"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium">Log Out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          <div className="mt-2 px-1 group-data-[collapsible=icon]:px-0">
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-full justify-start rounded-lg border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
              onClick={() =>
                window.open(
                  "https://docs.google.com/forms/d/e/1FAIpQLSe1XsS-I2bhQyoWv_LwPTp-jVoFPqups9XBuPqvLmmWQByfVw/viewform",
                  "_blank"
                )
              }
              title="Report Issue"
            >
              <span className="text-xs font-medium group-data-[collapsible=icon]:hidden">
                Report Issue
              </span>
              <HelpCircle className="h-4 w-4 hidden group-data-[collapsible=icon]:inline" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="flex h-16 items-center gap-4 border-b border-sidebar-border bg-sidebar px-6 shrink-0">
          <SidebarTrigger className="text-sidebar-foreground hover:bg-sidebar-accent" />

          <Breadcrumb>
            <BreadcrumbList className="text-sidebar-foreground">
              {breadcrumbText[0] !== "" && breadcrumbText[1] !== "" ? (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <button
                        onClick={() => {
                          // Navigate to appropriate parent page based on current context
                          if (breadcrumbText[0] === "Dashboard") {
                            navigator("/");
                          } else if (breadcrumbText[0] === "Courses") {
                            navigator("/courses");
                          } else if (breadcrumbText[0] === "Modules") {
                            navigator("/modules");
                          } else if (breadcrumbText[0] === "Reports") {
                            navigator("/reports");
                          } else if (breadcrumbText[0] === "Library") {
                            navigator("/library");
                          } else if (breadcrumbText[0] === "Account") {
                            navigator("/account");
                          } else if (breadcrumbText[0] === "About") {
                            navigator("/about");
                          } else if (
                            breadcrumbText[0] === "Organization Settings"
                          ) {
                            navigator("/org-settings");
                          } else if (breadcrumbText[0] === "Prompts") {
                            navigator("/prompts");
                          }
                        }}
                        className="cursor-pointer hover:underline text-sidebar-foreground hover:text-sidebar-accent-foreground text-sm font-medium"
                      >
                        {breadcrumbText[0]}
                      </button>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="text-sidebar-foreground" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-sidebar-foreground text-sm font-medium">
                      {breadcrumbText[1]}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              ) : (
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-sidebar-foreground text-sm font-medium">
                    {breadcrumbText[0]}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* Main Content Area */}
        <main id="main-content" className="flex-1 overflow-auto">{children}</main>
      </SidebarInset>
    </div>
  );
}

interface NavigationProps {
  children?: React.ReactNode;
}

export default function Navigation({ children }: NavigationProps): JSX.Element {
  return (
    <SidebarProvider defaultOpen={true}>
      <NavigationContent>{children}</NavigationContent>
    </SidebarProvider>
  );
}
