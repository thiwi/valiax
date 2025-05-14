import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Alert,
  Button
} from '@mui/material';
import theme from '../../theme';

/**
 * Props for NewDatabaseConnectionModal component.
 * 
 * @property {boolean} show - Controls the visibility of the modal.
 * @property {() => void} onHide - Callback to hide/close the modal.
 * @property {string} newDbName - Current value of the new database connection name input.
 * @property {(v: string) => void} setNewDbName - Setter function to update the new database connection name.
 * @property {string} newConnStr - Current value of the new connection string input.
 * @property {(v: string) => void} setNewConnStr - Setter function to update the connection string.
 * @property {boolean} testing - Indicates if a connection test is currently in progress.
 * @property {string | null} testError - Message returned from the test connection attempt; can indicate success or error.
 * @property {() => Promise<void>} onTest - Async callback to trigger testing the connection string.
 * @property {() => Promise<void>} onSave - Async callback to save the new database connection.
 */
export interface NewDatabaseConnectionModalProps {
  show: boolean;
  onHide: () => void;
  newDbName: string;
  setNewDbName: (v: string) => void;
  newConnStr: string;
  setNewConnStr: (v: string) => void;
  testing: boolean;
  testError: string | null;
  onTest: () => Promise<void>;
  onSave: () => Promise<void>;
}

/**
 * Modal component for adding a new database connection.
 * Allows users to input a connection name and connection string,
 * test the connection, and save it if successful.
 */
export default function NewDatabaseConnectionModal({
  show,
  onHide,
  newDbName,
  setNewDbName,
  newConnStr,
  setNewConnStr,
  testing,
  testError,
  onTest,
  onSave
}: NewDatabaseConnectionModalProps) {
  // Determine if the test result indicates success by checking if the testError message contains 'erfolgreich' (German for 'successful')
  const isTestSuccess = testError?.toLowerCase().includes('erfolgreich');

  return (
    <Dialog open={show} onClose={onHide} fullWidth maxWidth="sm">
      <DialogTitle>Neue Datenbankverbindung</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          {/* TextField for entering the name of the new database connection */}
          <TextField
            label="Name"
            value={newDbName}
            onChange={e => setNewDbName(e.target.value)}
            placeholder="Verbindungsname"
            fullWidth
          />
          {/* TextField for entering the connection string (e.g. PostgreSQL URI) */}
          <TextField
            label="Connection String"
            value={newConnStr}
            onChange={e => setNewConnStr(e.target.value)}
            placeholder="postgres://user:pass@host:5432/db"
            fullWidth
          />
          {/* Conditionally render an Alert to show success or error message after testing the connection */}
          {testError && (
            <Alert severity={isTestSuccess ? 'success' : 'error'}>
              {testError}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {/* Cancel button: closes the modal without saving */}
        <Button onClick={onHide}>Cancel</Button>
        {/* Test Connection button:
            - triggers the onTest callback when clicked
            - disabled if connection string is empty or a test is currently running
            - shows 'Testing...' text while testing is in progress */}
        <Button
          onClick={onTest}
          disabled={!newConnStr.trim() || testing}
          variant="outlined"
        >
          {testing ? 'Testing...' : 'Test Connection'}
        </Button>
        {/* Save button:
            - triggers onSave callback and then closes modal on success
            - disabled if either connection name or connection string is empty
            - styled with theme's primary color and contrast text for visual emphasis */}
        <Button
          onClick={async () => {
            await onSave();
            onHide();
          }}
          disabled={!newDbName.trim() || !newConnStr.trim()}
          variant="contained"
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}