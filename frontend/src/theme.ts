import { createTheme } from '@mui/material/styles';

// This file defines the centralized Material-UI (MUI) theme for the project.
// It sets up brand-specific colors and custom palette options to ensure consistent styling across the application.
// By centralizing these definitions, it becomes easier to maintain and update the look and feel of the UI.

// Define the core brand colors used throughout the application.
// Each color is assigned a specific role to maintain design consistency.
export const brandColors: string[] = [
  'rgb(93, 45, 125)',    // purple - used for secondary buttons and highlights
  'rgb(43, 41, 48)',     // dark gray - used for tile backgrounds and card shadows
  'rgb(65, 195, 173)',   // turquoise - used for accent elements and interactive states
  'rgb(160, 159, 170)',  // light gray - used for backgrounds and disabled states
  'rgb(45, 70, 113)',    // dark blue - primary color, used for main buttons and headers
];

const theme = createTheme({
  palette: {
    // Primary palette color: dark blue.
    // Used for main call-to-action buttons, app bars, and primary interactive elements.
    primary: {
      main: brandColors[4], // rgb(45, 70, 113)
      contrastText: '#fff', // white text to ensure readability on dark blue background
    },
    // Secondary palette color: purple.
    // Used for secondary buttons, links, and less prominent interactive elements.
    secondary: {
      main: brandColors[0], // rgb(93, 45, 125)
      contrastText: '#fff', // white text for good contrast on purple
    },
    // Error palette color: Bootstrap red.
    // Used to indicate validation errors, alerts, and destructive actions.
    error: {
      main: '#dc3545', // Bootstrap-Rot (optional)
      contrastText: '#fff', // white text for visibility on red background
    },
    // Custom greyButton palette color.
    // Used for grey buttons throughout the UI, such as disabled or secondary actions.
    greyButton: {
      main: '#6c757d', // Bootstrap secondary gray
      contrastText: '#fff', // white text for contrast
    },
  },
});

// Extend the MUI Palette interface to include the custom 'greyButton' color.
// This is necessary because MUI's default palette does not include 'greyButton'.
// By augmenting the module, TypeScript recognizes 'greyButton' as a valid palette option,
// enabling type safety and autocompletion when using this custom color in components.
declare module '@mui/material/styles' {
  interface Palette {
    greyButton: Palette['primary'];
  }
  interface PaletteOptions {
    greyButton: PaletteOptions['primary'];
  }
}

export default theme;