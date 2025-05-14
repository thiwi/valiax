import Drawer from '@mui/material/Drawer';
import { Box, Button } from '@mui/material';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import { DBConn } from '../../types';
import theme from '../../theme';

/**
 * Props for the DatabaseConnectionsDrawer component.
 * 
 * @property show - Controls whether the drawer is visible.
 * @property onHide - Callback function to close/hide the drawer.
 * @property dbConns - Array of database connection objects to display.
 * @property selectedDbId - The ID of the currently selected database connection (or null if none).
 * @property onDbClick - Callback invoked when a database connection is clicked, receives the clicked DBConn.
 * @property onAddClick - Callback invoked when the "Add New Database Connection" button is clicked.
 */
export interface DatabaseConnectionsDrawerProps {
  show: boolean;
  onHide: () => void;
  dbConns: DBConn[];
  selectedDbId: string | null;
  onDbClick: (db: DBConn) => void;
  onAddClick: () => void;
}

/**
 * DatabaseConnectionsDrawer component renders a sidebar drawer that lists all available
 * database connections. It allows users to select an existing connection or add a new one.
 * 
 * This drawer slides in from the left and contains:
 * - A header titled "Connections"
 * - A scrollable list of database connections, highlighting the selected one
 * - A divider separating the list from the action button
 * - A button to add a new database connection, styled according to the app's theme
 */
export default function DatabaseConnectionsDrawer({
  show,
  onHide,
  dbConns,
  selectedDbId,
  onDbClick,
  onAddClick,
}: DatabaseConnectionsDrawerProps) {
  return (
    // Drawer container anchored to the left side of the screen.
    // The drawer width is fixed at 300px to provide enough space for connection names
    // while maintaining a compact sidebar.
    <Drawer anchor="left" open={show} onClose={onHide}>
      <Box sx={{ width: 300 }} role="presentation">
        {/* Header section with padding, displaying the title of the drawer */}
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">Connections</Typography>
        </Box>

        {/* List of database connections.
            Each ListItemButton represents a connection.
            The selected item is highlighted by comparing selectedDbId with the connection's id.
            Clicking an item triggers onDbClick with the corresponding connection object. */}
        <List>
          {dbConns.map(db => (
            <ListItemButton
              key={db.id}
              selected={selectedDbId === db.id.toString()}
              onClick={() => onDbClick(db)}
            >
              <ListItemText primary={db.name} />
            </ListItemButton>
          ))}
        </List>

        {/* Divider visually separates the list of connections from the add-new button */}
        <Divider />

        {/* Container for the "Add New Database Connection" button with padding.
            The button is styled using the theme's primary color for background and contrast text color,
            ensuring consistency with the overall app design.
            It spans the full width of the drawer for easy accessibility. */}
        <Box sx={{ p: 2 }}>
          <Button
            variant="contained"
            fullWidth
            sx={{
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
            }}
            onClick={onAddClick}
          >
            Add New Database Connection
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}