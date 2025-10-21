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
    if (location.pathname === "/") {
      setBreadcrumbText(["Dashboard", "Overview"]);
    } else if (location.pathname === "/courses") {
      setBreadcrumbText(["Courses", ""]);
    } else if (location.pathname === "/modules") {
      setBreadcrumbText(["All Modules", ""]);
    } else if (
      pathnameSplit.length === 4 &&
      pathnameSplit[1] === "courses" &&
      pathnameSplit[3] === "modules"
    ) {
      setBreadcrumbText(["Modules", ""]);
    } else if (
      pathnameSplit.length === 5 &&
      pathnameSplit[1] === "courses" &&
      pathnameSplit[3] === "editmodule"
    ) {
      setBreadcrumbText(["Edit Module", ""]);
    } else if (
      pathnameSplit.length === 5 &&
      pathnameSplit[1] === "courses" &&
      pathnameSplit[3] === "modules"
    ) {
      setBreadcrumbText(["Conversations", ""]);
    } else if (pathnameSplit[1] === "chat") {
      setBreadcrumbText(["Chat", ""]);
    } else if (pathnameSplit[1] === "reports") {
      setBreadcrumbText(["Reports", ""]);
    } else if (location.pathname === "/account") {
      setBreadcrumbText(["Account", ""]);
    } else if (location.pathname === "/about") {
      setBreadcrumbText(["About", ""]);
    } else if (pathnameSplit[1] === "editcourse") {
      setBreadcrumbText(["Edit Course", ""]);
    } else if (pathnameSplit[1] === "prompts") {
      //hidden
      setBreadcrumbText(["Prompts", ""]);
    } else if (pathnameSplit[1] === "library") {
      setBreadcrumbText(["Library", ""]);
    } else if (pathnameSplit[1] === "org-settings") {
      setBreadcrumbText(["Organization Settings", ""]);
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
          <div className="flex items-center gap-3 px-4 py-2">
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
                        className="h-10 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground cursor-pointer"
                      >
                        <Link
                          to={mainMenuLinks[index]}
                          className="no-underline"
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
                    className="h-10 rounded-lg px-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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
              className="h-9 w-full justify-start rounded-lg border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
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
            <BreadcrumbList className="text-sidebar-foreground font-medium">
              {breadcrumbText[0] !== "" && breadcrumbText[1] !== "" ? (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <button
                        onClick={() =>
                          navigator(
                            breadcrumbText[0] === "Dashboard"
                              ? "/"
                              : `/courses/${breadcrumbText[0]}/modules`
                          )
                        }
                        className="cursor-pointer hover:underline text-sidebar-foreground hover:text-sidebar-accent-foreground font-medium"
                      >
                        {breadcrumbText[0]}
                      </button>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="text-sidebar-foreground" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-sidebar-foreground font-medium">
                      {breadcrumbText[1]}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              ) : (
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-sidebar-foreground font-medium">
                    {breadcrumbText[0]}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">{children}</main>
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
