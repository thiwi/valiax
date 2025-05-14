import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Stack, Button, Snackbar, Alert, SnackbarCloseReason } from '@mui/material';
import { Fragment, useState, useEffect } from 'react';
import type { ColumnRule } from '../../types';
import theme from '../../theme';

/**
 * Props for the NewRuleModal component.
 * 
 * @property open - Controls whether the modal dialog is open.
 * @property connectionId - The ID of the database connection.
 * @property tableName - The name of the table containing the column.
 * @property columnName - The name of the column to which the rule applies.
 * @property initialRule - Optional existing rule to edit; if provided, modal acts in edit mode.
 * @property onClose - Callback invoked when the modal is requested to close.
 * @property onSaveSuccess - Optional callback called with the saved rule upon successful save.
 */
interface NewRuleModalProps {
  open: boolean;
  connectionId: string;
  tableName: string;
  columnName: string;
  initialRule?: ColumnRule;
  onClose: () => void;
  onSaveSuccess?: (savedRule: ColumnRule) => void;
}

/**
 * NewRuleModal component allows users to add a new validation rule or modify an existing rule
 * for a specific column in a database table. It presents a form with inputs for rule details,
 * handles saving/updating via API calls, and shows notifications on success or error.
 */
const NewRuleModal: React.FC<NewRuleModalProps> = ({ open, connectionId, tableName, columnName, initialRule, onClose, onSaveSuccess }) => {
  // State to hold the text/content of the validation rule.
  const [ruleText, setRuleText] = useState('');
  // State to hold the interval at which the rule should be evaluated (e.g., daily, hourly).
  const [interval, setInterval] = useState<string>('daily');
  // State to hold the name/title of the rule.
  const [ruleName, setRuleName] = useState<string>(initialRule?.rule_name || '');
  // State to hold the severity level of the rule (e.g., low, medium, critical).
  const [severity, setSeverity] = useState<string>(initialRule?.severity || 'low');
  // State to hold an optional description providing more context about the rule.
  const [description, setDescription] = useState<string>(initialRule?.description || '');

  // State controlling whether the notification Snackbar is visible.
  const [notifOpen, setNotifOpen] = useState(false);
  // State holding the message text to display in the notification Snackbar.
  const [notifMessage, setNotifMessage] = useState('');
  // State to determine the severity/type of notification ('success' or 'error').
  const [notifSeverity, setNotifSeverity] = useState<'success' | 'error'>('success');

  // Local state to control the Dialog's open state independently, allowing Snackbar to persist after dialog closes.
  const [dialogOpen, setDialogOpen] = useState(open);

  /**
   * Effect hook triggered when the modal's open state or the initialRule changes.
   * When the modal opens or initialRule updates, it initializes form fields:
   * - If editing an existing rule, pre-fills fields with that rule's data.
   * - Otherwise, resets fields to default empty or initial values.
   */
  useEffect(() => {
    setDialogOpen(open);
    if (initialRule) {
      setRuleName(initialRule.rule_name);
      setRuleText(initialRule.rule_text);
      setSeverity(initialRule.severity);
      setDescription(initialRule.description || '');
    } else {
      setRuleText('');
      setRuleName('');
      setSeverity('low');
      setDescription('');
    }
  }, [initialRule, open]);

  /**
   * Handles closing the notification Snackbar.
   * Ignores 'clickaway' events to prevent accidental dismissal.
   * When Snackbar closes normally, also triggers the modal's onClose callback,
   * which typically unmounts this component.
   * 
   * @param event - The event that triggered the close.
   * @param reason - The reason for the Snackbar close.
   */
  const handleNotifClose = (
    event: React.SyntheticEvent<any, Event> | Event,
    reason: SnackbarCloseReason
  ) => {
    if (reason === 'clickaway') {
      return; // Do not close Snackbar on clickaway to avoid accidental dismissal.
    }
    setNotifOpen(false);
    onClose(); // Close the modal after the notification disappears.
  };

  /**
   * Handles adding a new rule or modifying an existing one.
   * Validates required fields, constructs the API endpoint and HTTP method
   * depending on whether creating or updating, sends the data as JSON,
   * and processes the response to show success or error notifications.
   */
  const handleAddRule = async () => {
    // Validate required fields: ruleName and ruleText must not be empty.
    if (!ruleName.trim() || !ruleText.trim()) return;

    // Construct API URL and HTTP method based on create (POST) or update (PUT).
    let url = `/api/db-connections/${connectionId}/tables/${encodeURIComponent(tableName)}/columns/${encodeURIComponent(columnName)}/rules`;
    let method = 'POST';
    if (initialRule) {
      url += `/${initialRule.id}`;
      method = 'PUT';
    }

    // Send the request with JSON body containing rule details.
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rule_name: ruleName.trim(),
        rule_text: ruleText.trim(),
        interval: interval,
        severity: severity,
        description: description.trim()
      }),
    });

    // Handle response: show notification and update UI accordingly.
    if (response.ok) {
      const savedRule = await response.json() as ColumnRule;
      setNotifSeverity('success');
      setNotifMessage('rule was stored.');
      setNotifOpen(true);
      onSaveSuccess?.(savedRule);
      // Close the dialog after successful save.
      setDialogOpen(false);
    } else {
      setNotifSeverity('error');
      setNotifMessage('error in storing rule.');
      setNotifOpen(true);
    }
  };

  return (
    <Fragment>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>
          {initialRule ? 'Modify Rule' : 'Add Rule to Column'} <small>({tableName}.{columnName})</small>
        </DialogTitle>
        <hr style={{ border: 'none', borderTop: '1px solid #ccc', margin: '0 24px 16px' }} />
        <DialogContent>
          <Stack spacing={3}>
            {/* Input for the rule's name/title; required field */}
            <TextField
              label="Rule name"
              value={ruleName}
              onChange={e => setRuleName(e.target.value)}
              required
              fullWidth
              sx={{ mt: 5 }}
            />
            {/* Multiline input for the rule's actual logic or description; required */}
            <TextField
              label="Rule"
              multiline
              minRows={3}
              maxRows={6}
              fullWidth
              value={ruleText}
              onChange={(e) => setRuleText(e.target.value)}
              placeholder="Enter rule description or constraints..."
              required
            />
            {/* Dropdown to select how often the rule should be evaluated */}
            <TextField
              select
              label="Interval"
              value={interval}
              onChange={e => setInterval(e.target.value)}
              fullWidth
            >
              <MenuItem value="monthly">1st of month, 01:00</MenuItem>
              <MenuItem value="monday">Every Monday, 01:00</MenuItem>
              <MenuItem value="daily">Every day, 01:00</MenuItem>
              <MenuItem value="hourly">Every hour</MenuItem>
              <MenuItem value="minutely">Every minute</MenuItem>
            </TextField>
            {/* Dropdown to select the severity level of the rule */}
            <TextField
              label="Severity"
              select
              value={severity}
              onChange={e => setSeverity(e.target.value)}
              fullWidth
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
            </TextField>
            {/* Optional multiline input for additional description/context about the rule */}
            <TextField
              label="Description"
              multiline
              minRows={2}
              fullWidth
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional description..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          {/* Cancel button closes the modal without saving */}
          <Button
            variant="contained"
            sx={{
              backgroundColor: theme.palette.greyButton?.main || '#6c757d',
              color: theme.palette.greyButton?.contrastText || '#fff',
            }}
            onClick={onClose}
          >
            Cancel
          </Button>
          {/* Submit button triggers saving or updating the rule */}
          <Button
            variant="contained"
            onClick={handleAddRule}
            sx={{
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
            }}
          >
            {initialRule ? 'Modify rule' : 'Add rule to column'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 
        Snackbar notification displays feedback messages for success or error 
        when saving rules. It appears at the bottom-right and auto-hides after 5 seconds.
        Closing the Snackbar triggers closing the modal dialog as well.
      */}
      <Snackbar
        open={notifOpen}
        autoHideDuration={5000}
        onClose={handleNotifClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        sx={{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          zIndex: (theme) => theme.zIndex.modal + 1,
        }}
      >
        <Alert onClose={() => setNotifOpen(false)} severity={notifSeverity} sx={{ width: '100%' }}>
          {notifMessage}
        </Alert>
      </Snackbar>
    </Fragment>
  );
};

export default NewRuleModal;