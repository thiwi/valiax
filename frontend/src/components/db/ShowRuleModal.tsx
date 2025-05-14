// This component displays a modal dialog showing detailed information about a specific database column rule.
// It presents read-only fields with rule properties and includes a Snackbar for user notifications (currently unused).
// The modal is controlled via the `open` prop and can be closed with the `onClose` callback.

import React, { Fragment } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import type { ColumnRule } from '../../types';
import { useStore } from '../../store/store';

/**
 * Props for ShowRuleModal component.
 * 
 * @property {boolean} open - Determines if the modal dialog is open.
 * @property {ColumnRule} rule - The rule object containing details to display.
 * @property {() => void} onClose - Callback function invoked when the modal should be closed.
 */
interface ShowRuleModalProps {
  open: boolean;
  rule: ColumnRule;
  onClose: () => void;
}

const ShowRuleModal: React.FC<ShowRuleModalProps> = ({ open, rule, onClose }) => {
  // Get the selected database name from the global store; fallback to 'Unknown DB' if not set.
  const dbName = useStore(state => state.selectedDatabaseName) || 'Unknown DB';

  // State to control visibility of the notification Snackbar.
  const [notifOpen, setNotifOpen] = React.useState(false);
  // State to hold the message text displayed in the Snackbar.
  const [notifMessage, setNotifMessage] = React.useState('');
  // State to hold the severity level of the notification ('success' or 'error').
  const [notifSeverity, setNotifSeverity] = React.useState<'success' | 'error'>('success');

  /**
   * Handles closing of the Snackbar notification.
   * Ignores close events triggered by clicking away to avoid premature dismissal.
   * 
   * @param _ - The event object (unused).
   * @param reason - Reason for the Snackbar close event.
   */
  const handleNotifClose = (_: any, reason: string) => {
    if (reason === 'clickaway') return; // Prevent closing when user clicks outside the Snackbar.
    setNotifOpen(false); // Close the Snackbar.
  };

  return (
    <Fragment>
      {/* Modal dialog displaying rule details */}
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        {/* Dialog title showing database and rule location */}
        <DialogTitle>
          Rule Details for {dbName} ({rule.table_name}.{rule.column_name})
        </DialogTitle>
        <DialogContent>
          {/* Read-only field displaying the rule's name */}
          <TextField
            label="Rule Name"
            value={rule.rule_name}
            fullWidth
            InputProps={{ readOnly: true }}
            sx={{ mt: 2, mb: 2 }}
          />
          {/* Read-only multiline field showing the rule's text */}
          <TextField
            label="Rule Text"
            value={rule.rule_text}
            multiline
            minRows={3}
            fullWidth
            InputProps={{ readOnly: true }}
            sx={{ mb: 2 }}
          />
          {/* Read-only field showing the rule's interval */}
          <TextField
            label="Interval"
            value={rule.interval}
            fullWidth
            InputProps={{ readOnly: true }}
            sx={{ mb: 2 }}
          />
          {/* Read-only field displaying the rule's severity */}
          <TextField
            label="Severity"
            value={rule.severity}
            fullWidth
            InputProps={{ readOnly: true }}
            sx={{ mb: 2 }}
          />
          {/* Read-only multiline field showing the rule's description */}
          <TextField
            label="Description"
            value={rule.description || ''}
            multiline
            minRows={2}
            fullWidth
            InputProps={{ readOnly: true }}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          {/* Button to close the modal dialog */}
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar and Alert components intended for user notifications.
          Currently, the notification mechanism is not actively used,
          but can be triggered to display success or error messages at the bottom-right of the screen. */}
      <Snackbar
        open={notifOpen}
        autoHideDuration={5000}
        onClose={handleNotifClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setNotifOpen(false)}
          severity={notifSeverity}
          sx={{ width: '100%' }}
        >
          {notifMessage}
        </Alert>
      </Snackbar>
    </Fragment>
  );
};

export default ShowRuleModal;