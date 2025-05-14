// frontend/src/store.ts

// This file manages the shared application state using Zustand, a lightweight state management library.
// It defines the structure and actions for handling database-related data and chat messages,
// allowing components across the app to access and modify this state in a predictable way.

import { create } from 'zustand';

// Represents a database entity with an identifier, a display name, and optionally a list of table names.
export interface Database {
  id: string;          // Unique identifier for the database
  name: string;        // Human-readable name of the database
  tables?: string[];   // Optional array of table names contained in this database
}

// Defines the shape of the main store that holds database-related state and methods to update it.
interface Store {
  databases: Database[];                 // List of all available databases
  selectedDatabase: string | null;      // ID of the currently selected database, or null if none selected
  selectedDatabaseName: string | null;  // Name of the selected database for easier display
  tables: string[];                     // List of tables for the selected database
  tableColumns: Record<string, string[]>; // Mapping from table name to its column names

  // Updates the list of databases in the state
  setDatabases: (dbs: Database[]) => void;

  // Selects a database by its ID, updating selectedDatabase, selectedDatabaseName, and tables accordingly
  selectDatabase: (id: string) => void;

  // Sets the list of tables (useful when tables are updated independently)
  setTables: (tables: string[]) => void;

  // Sets the columns for a specific table, updating the tableColumns mapping
  setTableColumns: (table: string, columns: string[]) => void;
}

// Zustand store managing database-related state and actions
export const useStore = create<Store>((set) => ({
  // Initially, no databases are loaded
  databases: [],

  // No database is selected on startup
  selectedDatabase: null,

  // No database name selected initially
  selectedDatabaseName: null,

  // No tables loaded initially
  tables: [],

  // No column information loaded initially
  tableColumns: {},

  // Sets the entire list of databases in state
  setDatabases: (dbs) => set({ databases: dbs }),

  // When a database is selected, update selectedDatabase and selectedDatabaseName,
  // and also load its tables if available
  selectDatabase: (id) =>
    set((state) => {
      const db = state.databases.find((d) => d.id === id);
      return {
        selectedDatabase: id,
        selectedDatabaseName: db?.name || null,
        tables: db?.tables || [],
      };
    }),

  // Directly update the tables array in state
  setTables: (tables) => set({ tables }),

  // Update the columns for a given table, merging with existing tableColumns state
  setTableColumns: (table, columns) => set(state => ({
    tableColumns: {
      ...state.tableColumns,
      [table]: columns,
    },
  })),
}));

// Represents a single chat message with a role indicating sender and the message content
export interface ChatMessage {
  role: 'user' | 'assistant'  // Indicates if the message was sent by the user or the assistant
  content: string             // Text content of the message
}

// Defines the shape of the chat state including messages and a method to send new messages
interface ChatState {
  messages: ChatMessage[]           // Array of chat messages exchanged so far
  sendMessage: (msg: string) => void  // Function to send a new user message
}

// Zustand store managing chat state and WebSocket communication with the backend
export const useChatStore = create<ChatState>((set, get) => {
  // Create a WebSocket connection to the backend chat server.
  // This connection is opened once when the store is initialized and reused for sending/receiving messages.
  const socket = new WebSocket('ws://localhost:8000/ws/chat')

  // Event handler for receiving messages from the WebSocket server
  socket.onmessage = (event) => {
    // Parse the incoming message JSON and extract the 'response' field
    const { response } = JSON.parse(event.data)

    // Append the assistant's response message to the existing messages in state
    set(state => ({
      messages: [...state.messages, { role: 'assistant', content: response }],
    }))
  }

  // Log any errors that occur on the WebSocket connection for debugging
  socket.onerror = (err) => console.error('WebSocket error', err)

  // Log when the WebSocket connection is closed
  socket.onclose = () => console.log('WebSocket closed')

  return {
    // Initialize with an empty message history
    messages: [],

    // Method to send a new user message
    sendMessage: (msg: string) => {
      // First, append the user's message to the local state so UI updates immediately
      set(state => ({
        messages: [...state.messages, { role: 'user', content: msg }],
      }))

      // Then send the message to the backend server over the WebSocket connection
      socket.send(JSON.stringify({ message: msg }))
    },
  }
})