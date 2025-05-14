import React, { FormEvent, useRef } from 'react';
import { Box, TextField, Button, Checkbox, FormControlLabel, Chip } from '@mui/material';
import theme from '../../theme';

/**
 * ChatForm component provides a user interface for inputting chat messages,
 * toggling rule creation mode, selecting columns to include, and submitting the chat input.
 * 
 * Props:
 * - input: The current text input value in the chat box.
 * - onInputChange: Callback function triggered when the input text changes.
 * - onSubmit: Callback function triggered when the form is submitted.
 * - ruleCreation: Boolean flag indicating if rule creation mode is enabled.
 * - selectedColumns: A set of strings representing columns currently selected to include.
 * - onToggleRuleCreation: Callback to toggle the rule creation mode on or off.
 * - onOpenColumns: Callback to open the UI for selecting columns.
 * - onOpenChat: Callback to open or focus the chat UI.
 * - onRemoveColumn: Callback to remove a selected column from the set.
 */
interface ChatFormProps {
  input: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: FormEvent) => void;
  ruleCreation: boolean;
  selectedColumns: Set<string>;
  onToggleRuleCreation: (checked: boolean) => void;
  onOpenColumns: () => void;
  onOpenChat: () => void;
  onRemoveColumn: (column: string) => void;
}

const ChatForm: React.FC<ChatFormProps> = ({
  input, onInputChange, onSubmit,
  ruleCreation, selectedColumns,
  onToggleRuleCreation, onOpenColumns, onOpenChat,
  onRemoveColumn
}) => {
  // Ref to the text input field, useful for focusing or other direct DOM manipulations if needed
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    // The main form container for the chat input and controls
    <Box
      component="form"
      // Prevent default form submission behavior, then open chat and submit input
      onSubmit={e => { e.preventDefault(); onOpenChat(); onSubmit(e); }}
      // Styling: vertical layout with padding and a top border to separate from above content
      sx={{ display: 'flex', flexDirection: 'column', p: 2, borderTop: 1, borderColor: 'divider' }}
    >
      {/* Checkbox to toggle rule creation mode */}
      <FormControlLabel
        control={
          <Checkbox
            checked={ruleCreation}
            // When toggled, update rule creation mode and open chat if enabling
            onChange={e => { onToggleRuleCreation(e.target.checked); if (e.target.checked) onOpenChat(); }}
          />
        }
        label="Rule creation"
      />

      {/* Text input field for the chat message */}
      <TextField
        inputRef={inputRef} // Reference for potential programmatic focus or manipulation
        value={input} // Controlled input value
        onChange={onInputChange} // Update input value on user typing
        placeholder="Ask me about Data Quality" // Placeholder text guiding user input
        fullWidth // Expand to fill available width
        size="small" // Smaller size for compact UI
      />

      {/* Display chips for each selected column, if any are selected */}
      {selectedColumns.size > 0 && (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap', // Allow chips to wrap to next line if needed
            gap: 1, // Spacing between chips
            mt: 1 // Margin top to separate from input field
          }}
        >
          {/* Render a Chip component for each selected column */}
          {Array.from(selectedColumns).map(combo => (
            <Chip
              key={combo}
              label={combo}
              // Clicking a chip removes that column from selection
              onClick={() => onRemoveColumn(combo)}
              sx={{
                mr: 0.5, // Margin right for spacing between chips horizontally
                mb: 0.5, // Margin bottom for spacing between chips vertically
                backgroundColor: theme.palette.grey[800], // Dark grey background for contrast
                color: theme.palette.getContrastText(theme.palette.grey[800]), // Text color for readability
              }}
            />
          ))}
        </Box>
      )}

      {/* Container for the action buttons: Include columns and Send */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between', // Space buttons apart on opposite ends
          mt: 1 // Margin top to separate from chips or input
        }}
      >
        {/* Button to open the column selection UI */}
        <Button
          variant="contained"
          size="small"
          onClick={onOpenColumns}
          sx={{
            backgroundColor: theme.palette.primary.main, // Primary color background
            color: theme.palette.primary.contrastText, // Text color contrasting primary background
            '&:hover': {
              // Darker shade on hover for visual feedback
              backgroundColor: theme.palette.primary.dark || theme.palette.primary.main,
            },
          }}
        >
          Include columns
        </Button>

        {/* Submit button for sending the chat message */}
        <Button
          type="submit" // Submits the form when clicked
          variant="contained"
          size="small"
          sx={{
            backgroundColor: theme.palette.primary.main, // Consistent primary styling
            color: theme.palette.primary.contrastText,
            '&:hover': {
              backgroundColor: theme.palette.primary.dark || theme.palette.primary.main,
            },
          }}
        >
          Send
        </Button>
      </Box>
    </Box>
  );
};

export default ChatForm;