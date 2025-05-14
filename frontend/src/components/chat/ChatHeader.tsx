/**
 * ChatHeader component
 *
 * This component renders the header section for the chat UI. It displays the title of the chat and,
 * when the chat is expanded, shows a close button to collapse or hide the chat. The header's appearance
 * and behavior change depending on whether the chat is currently expanded or collapsed.
 */
import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import theme from '../../theme';

/**
 * Props for the ChatHeader component.
 * @property expanded - Controls whether the chat is currently expanded (open) or collapsed (closed).
 * @property onOpen - Callback function to trigger when the header is clicked to expand/open the chat.
 * @property onClose - Callback function to trigger when the close button is clicked to collapse/close the chat.
 */
interface ChatHeaderProps {
  expanded: boolean;    // True if the chat is expanded (open), false if collapsed
  onOpen: () => void;   // Function called to open/expand the chat
  onClose: () => void;  // Function called to close/collapse the chat
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ expanded, onOpen, onClose }) => {
  return (
    // Outer Box: provides the background color, rounded corners when expanded, and hides overflow
    <Box
      sx={{
        overflow: 'hidden',
        backgroundColor: theme.palette.primary.main,
        borderRadius: expanded ? '16px 16px 0 0' : 0, // Rounded top corners if expanded
      }}
    >
      {
        // Inner Box: contains the chat title and optional close button.
        // Handles click to open the chat if not already expanded.
      }
      <Box
        onClick={() => !expanded && onOpen()}
        sx={{
          position: 'relative',
          p: 1,
          color: theme.palette.primary.contrastText,
          cursor: expanded ? 'default' : 'pointer', // Pointer cursor if clickable
          textAlign: 'center',
        }}
      >
        <Typography variant="subtitle1">Chat with Valiax</Typography>
        {expanded && (
          // IconButton: displays a close ("X") icon in the header when expanded.
          // Clicking this button triggers the onClose callback to collapse the chat.
          <IconButton
            size="small"
            onClick={onClose}
            sx={{ position: 'absolute', top: 4, right: 4 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
    </Box>
  );
}

export default ChatHeader;