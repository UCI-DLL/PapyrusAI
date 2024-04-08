import { createTheme } from "@mui/material";

export function changeTheme(root: HTMLElement, theme: string) {
  if (theme === "dark") {
    root?.style.setProperty("--primary", "#A6E4FF");
    root?.style.setProperty("--accent-1", "#47B9FF");
    root?.style.setProperty("--accent-3", "#A8D5E9");
    root?.style.setProperty("--background", "#141414");
    root?.style.setProperty("--white", "#0A0A0A");
    root?.style.setProperty("--black", "#EBEBEB");
    root?.style.setProperty("--error", "#B30505");
  } else if (theme === "light") {
    root?.style.setProperty("--primary", "#0064a4");
    root?.style.setProperty("--accent-1", "#6aa2b8");
    root?.style.setProperty("--accent-3", "#1b3d6d");
    root?.style.setProperty("--background", "#EBEBEB");
    root?.style.setProperty("--white", "#fff");
    root?.style.setProperty("--black", "#1a1a1a");
    root?.style.setProperty("--error", "#E91B1B");
  } else if (theme === "colorful-light") {
    root?.style.setProperty("--primary", "#220F57");
    root?.style.setProperty("--accent-1", "#03325B");
    root?.style.setProperty("--accent-3", "#140934");
    root?.style.setProperty("--background", "#ABA7DB");
    root?.style.setProperty("--white", "#EDEFFF");
    root?.style.setProperty("--black", "#1a1a1a");
    root?.style.setProperty("--error", "#B30505");
  } else if (theme === "colorful-dark") {
    root?.style.setProperty("--primary", "#7DAF9C");
    root?.style.setProperty("--accent-1", "#47B9FF");
    root?.style.setProperty("--accent-3", "#7DAF9C");
    root?.style.setProperty("--background", "#280119");
    root?.style.setProperty("--white", "#121212");
    root?.style.setProperty("--black", "#EBEBEB");
    root?.style.setProperty("--error", "#E91B1B");
  } else {
    //default is light theme
    root?.style.setProperty("--primary", "#0064a4");
    root?.style.setProperty("--accent-1", "#6aa2b8");
    root?.style.setProperty("--accent-3", "#1b3d6d");
    root?.style.setProperty("--background", "#EBEBEB");
    root?.style.setProperty("--white", "#fff");
    root?.style.setProperty("--black", "#1a1a1a");
  }
}

export function getLightTheme() {
  const { palette } = createTheme();
  //light theme is default
  const lightTheme = createTheme({
    palette: {
      background: {
        default: "#EBEBEB",
      },
      text: {
        primary: "#1a1a1a",
      },
      primary: { main: "#1b3d6d" },
      secondary: { main: "#6aa2b8" },
      error: { main: "#B30505" },
      white: palette.augmentColor({
        color: {
          main: "#fff",
        },
      }),
    },
    typography: {
      button: {
        textTransform: "none",
      },
      "fontFamily": "OpenSans",
    },
  });
  return lightTheme;
}

export function getDarkTheme() {
  const { palette } = createTheme();
  const darkTheme = createTheme({
    palette: {
      mode: "dark",
      background: {
        default: "#141414",
      },
      text: {
        primary: "#EBEBEB",
      },
      primary: { main: "#A8D5E9" },
      secondary: { main: "#ededed" },
      error: { main: "#E91B1B" },
      white: palette.augmentColor({
        color: {
          main: "#FFF",
        },
      }),
    },
    typography: {
      button: {
        textTransform: "none",
      },
      "fontFamily": "OpenSans",
    },
  });
  return darkTheme;
}

export function getColorfulLightTheme() {
  const { palette } = createTheme();
  //light theme is default
  const colorfulLightTheme = createTheme({
    palette: {
      background: {
        default: "#ABA7DB",
      },
      text: {
        primary: "#1a1a1a",
      },
      primary: { main: "#220F57" },
      secondary: { main: "#03325B" },
      error: { main: "#B30505" },
      white: palette.augmentColor({
        color: {
          main: "#EDEFFF",
        },
      }),
    },
    typography: {
      button: {
        textTransform: "none",
      },
      "fontFamily": "OpenSans",
    },
  });
  return colorfulLightTheme;
}

export function getColorfulDarkTheme() {
  const { palette } = createTheme();
  const colorfulDarkTheme = createTheme({
    palette: {
      mode: "dark",
      background: {
        default: "#280119",
      },
      text: {
        primary: "#EBEBEB",
      },
      primary: { main: "#7DAF9C" },
      secondary: { main: "#ededed" },
      error: { main: "#E91B1B" },
      white: palette.augmentColor({
        color: {
          main: "#121212",
        },
      }),
    },
    typography: {
      button: {
        textTransform: "none",
      },
      "fontFamily": "OpenSans",
    },
  });
  return colorfulDarkTheme;
}