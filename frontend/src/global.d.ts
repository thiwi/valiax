// This declaration file augments the Chart.js library by adding support for additional plugin configuration options.
// Specifically, it extends the type definitions to include the zoom plugin's configuration, enabling TypeScript users
// to safely and accurately configure zoom and pan behaviors on Chart.js charts.

// Declare the zoom plugin module.
// This declaration is necessary to use the 'chartjs-plugin-zoom' plugin with Chart.js in a TypeScript-safe way.
// Without this, TypeScript would not recognize the plugin module and its types.
declare module 'chartjs-plugin-zoom';

// Import Chart.js types to augment them.
// Importing 'chart.js' here is required so we can extend its existing type definitions with additional plugin options.
import 'chart.js';

// Extend Chart.js PluginOptionsByType to include zoom options.
// This section adds a new optional `zoom` property to the plugin options, describing how zoom and pan behaviors can be configured.
// The `zoom` object controls zooming interactions on the chart:
// - `drag`: Configures zooming by dragging a selection box, with options to enable it and customize the border color of the selection box.
// - `mode`: Specifies the zoom direction or mode (e.g., 'x', 'y', or 'xy').
// - `pan`: Controls panning behavior, with an option to enable or disable it.
declare module 'chart.js' {
  interface PluginOptionsByType<TType extends keyof import('chart.js').ChartTypeRegistry> {
    zoom?: {
      zoom: {
        drag: { enabled: boolean; borderColor: string };
        mode: string;
      };
      pan: { enabled: boolean };
    };
  }
}