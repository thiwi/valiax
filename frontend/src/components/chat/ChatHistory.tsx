import React from 'react';
import { Box, List, ListItem, ListItemText, Divider, CircularProgress, Typography } from '@mui/material';

/**
 * Interface representing a single chat message.
 * - `from`: Indicates the sender of the message, either 'user' or 'bot'.
 * - `text`: The content of the message.
 */
interface Message { from: 'user' | 'bot'; text: string; }

/**
 * Props for the ChatHistory component.
 * - `messages`: An array of Message objects representing the chat conversation.
 * - `loading`: A boolean indicating whether the bot is currently typing/responding.
 * - `historyRef`: A React ref attached to the container div for scrolling or DOM access.
 */
interface ChatHistoryProps {
  messages: Message[];
  loading: boolean;
  historyRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * ChatHistory component displays the list of chat messages between the user and the bot.
 * It renders each message with proper alignment and labels, includes dividers between messages,
 * and shows a loading indicator when the bot is typing.
 */
const ChatHistory: React.FC<ChatHistoryProps> = ({ messages, loading, historyRef }) => (
  // Container box for chat history with vertical scroll and padding.
  <Box
    component="div"
    ref={historyRef}
    sx={{ maxHeight: '50vh', overflowY: 'auto', p: 2, bgcolor: 'background.paper', color: 'text.primary' }}
  >
    {/* List of all chat messages */}
    <List disablePadding>
      {messages.map((msg, i) => (
        <React.Fragment key={i}>
          {/* Individual message item */}
          <ListItem>
            <ListItemText
              // Display the message text
              primary={msg.text}
              // Display sender label: 'You' for user, 'Valiax' for bot
              secondary={msg.from === 'user' ? 'You' : 'Valiax'}
              // Align message text right if from user, left if from bot
              primaryTypographyProps={{ align: msg.from === 'user' ? 'right' : 'left' }}
              // Use caption style for the sender label
              secondaryTypographyProps={{ variant: 'caption' }}
            />
          </ListItem>
          {/* Add a divider between messages except after the last message */}
          {i < messages.length - 1 && <Divider component="li" />}
        </React.Fragment>
      ))}
    </List>
    {/* Show loading indicator and message when bot is typing */}
    {loading && (
      <Box sx={{ textAlign: 'center', mt: 1 }}>
        <CircularProgress size={20} />
        <Typography variant="caption">Valiax is typing...</Typography>
      </Box>
    )}
  </Box>
);

export default ChatHistory;