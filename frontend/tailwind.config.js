/** 
 * This is the TailwindCSS configuration file for the project.
 * It allows customization of the default TailwindCSS setup to better fit the project's design needs.
 * Here, you can specify which files Tailwind should scan for class names, extend the default theme with custom values,
 * and add plugins to enhance Tailwind's capabilities.
 */

 /** @type {import('tailwindcss').Config} */
module.exports = {
  // The 'content' array specifies the paths to all template files in the project.
  // Tailwind uses this to scan for class names and generate only the CSS that is actually used,
  // which helps to keep the final CSS bundle small and optimized.
  content: ['./src/**/*.{js,jsx,ts,tsx}'],

  theme: {
    // The 'extend' object is used to add custom values to Tailwind's default theme.
    // This is where you can define additional colors, spacing, fonts, or other design tokens
    // without completely overriding the default Tailwind settings.
    extend: {},
  },

  // The 'plugins' array allows you to include third-party or custom plugins.
  // Plugins can add new utilities, components, or variants to Tailwind,
  // enabling more advanced or project-specific styling capabilities.
  plugins: [],
};
