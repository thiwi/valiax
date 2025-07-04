// src/App.tsx
/**
 * The main application component that serves as the central layout and integration point
 * for all UI elements and state management within the Valiax frontend.
 * 
 * It manages database connections, table and column selections, rule creation,
 * and integrates the chat widget. It also handles modals and drawers for database
 * connection management and rule editing, coordinating state between these components.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import DatabaseSelector from './components/db/DatabaseTables';
import Dashboard from './components/dashboard/Dashboard';
import ChatWidget from './components/chat/ChatWidget';
import DatabaseConnectionsDrawer from './components/db/DatabaseConnectionsDrawer';
import ConnectionDetailModal from './components/db/DatabaseConnectionDetailModal';
import NewRuleModal from './components/db/NewRuleModal';
import NewDatabaseConnectionModal from './components/db/NewDatabaseConnectionModal';

import { AppBar, Toolbar, Typography, Button, Drawer, Box } from '@mui/material';

import { useStore } from './store/store';
import theme from './theme';
import { useTables } from './hooks/useTables';
import { useDbConnections } from './hooks/useDbConnections';
import { DBConn } from './types';
import { ColumnRule } from './types';
import { useUI } from './hooks/useUi';


// Determine API base URL:
// - In production builds, use the injected REACT_APP_API_URL
// - In development (npm start), use the CRA proxy, so no prefix
export const API_BASE =
  process.env.NODE_ENV === 'production'
    ? process.env.REACT_APP_API_URL ?? ''
    : '';

export default function App() {
  // UI state and handlers for showing/hiding navigation, modals, and drawers
  const {
    ui,
    toggleNav,
    showNewDb,
    hideNewDb,
    toggleDbMenu,
    hideDbMenu,
    showDetail,
    hideDetail
  } = useUI();

  /**
   * Database connection handling:
   * CRUD operations for database connections including loading state, errors, adding,
   * testing, and deleting connections.
   */
  const {
    dbConns,
    loading: loadingConns,
    error: connsError,
    addConn,
    testConn,
    deleteConn
  } = useDbConnections(API_BASE);

  /**
   * State for New Database Connection modal:
   * Holds the input values for the new database name and connection string,
   * as well as loading and error state for connection testing.
   */
  const [newDbName, setNewDbName] = useState('');
  const [newConnStr, setNewConnStr] = useState('');
  const [testing, setTesting] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  /**
   * State for Database Connection Detail modal:
   * Stores the currently selected connection for detail view,
   * and manages deletion state and errors.
   */
  const [selectedConn, setSelectedConn] = useState<DBConn | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Selected database ID and name from global Zustand store
  const selectedDbId = useStore(state => state.selectedDatabase);
  const selectedDbName = useStore(state => state.selectedDatabaseName);



  /**
   * State for Add Rule modal:
   * Keeps track of the currently active rule modal info including connection ID,
   * table, column, and optionally an existing rule for editing.
   */
  const [ruleModalInfo, setRuleModalInfo] = useState<{
    connectionId: string;
    table: string;
    column: string;
    rule?: ColumnRule;
  } | null>(null);

  /**
   * Handler invoked when a column is clicked.
   * Opens the rule modal for the selected table and column.
   */
  const handleColumnClick = useCallback((tableName: string, columnName: string) => {
    if (!selectedDbId) return;
    setRuleModalInfo({
      connectionId: selectedDbId,
      table: tableName,
      column: columnName,
    });
  }, [selectedDbId]);

  /**
   * Handler invoked when a rule tag is clicked.
   * Opens the rule modal for editing the selected rule.
   */
  const handleRuleTagClick = useCallback((rule: ColumnRule) => {
    if (!selectedDbId) return;
    setRuleModalInfo({
      connectionId: selectedDbId,
      table: rule.table_name,
      column: rule.column_name,
      rule: rule,
    });
  }, [selectedDbId]);

  /**
   * Fetch tables for the selected database.
   * Uses a custom hook that returns tables, loading state, and errors.
   */
  const {
    tables,
    loading: loadingTables,
    error: tablesError
  } = useTables(API_BASE, selectedDbId);

  // Synchronize fetched tables with the global Zustand store
  useEffect(() => {
    useStore.getState().setTables(tables);
  }, [tables]);

  /**
   * Handler for adding a new database connection.
   * Trims inputs, calls addConn, resets inputs, and hides relevant UI.
   */
  const handleAdd = useCallback(async () => {
    await addConn(newDbName.trim(), newConnStr.trim());
    setNewDbName('');
    setNewConnStr('');
    hideNewDb();
    hideDbMenu();  // close the database drawer after adding a new DB
  }, [addConn, newDbName, newConnStr, hideNewDb, hideDbMenu]);

  /**
   * Handler when a database connection is selected.
   * Sets the selected connection, shows detail modal, and closes navigation drawers.
   */
  const handleDbSelect = useCallback((conn: DBConn) => {
    setSelectedConn(conn);
    showDetail();
    hideDbMenu();  // close the navigation offcanvas after selecting a DB
    toggleNav();   // close the navigation offcanvas
  }, [showDetail, hideDbMenu, toggleNav]);

  /**
   * Handler for deleting a database connection.
   * Manages loading and error state, calls deleteConn, and hides detail modal on success.
   */
  const handleDeleteConn = useCallback(async (id: string) => {
    setDeleting(true);
    setDeleteError(null);
    try {
      const ok = await deleteConn(id);
      if (!ok) throw new Error('Delete failed');
      hideDetail();
    } catch (e) {
      setDeleteError((e as Error).message);
    } finally {
      setDeleting(false);
    }
  }, [deleteConn, hideDetail]);

  // Ref to hold a function for adding rules to the database selector component
  const addRuleToDatabaseSelector = useRef<((rule: ColumnRule) => void) | null>(null);



  return (
    <>
      {/* Top AppBar with application title and controls */}
      <AppBar position="static" sx={{ bgcolor: theme.palette.secondary.main }}>
        <Toolbar>
          {/* Application title */}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Valiax
          </Typography>
          {/* Button to toggle database connections drawer */}
          <Button color="inherit" onClick={toggleNav}>
            {ui.nav ? 'Close' : 'Connections'}
          </Button>
          {/* Button to toggle tables drawer */}
          <Button color="inherit" sx={{ ml: 2 }} onClick={toggleDbMenu}>
            {ui.dbMenu ? 'Close DBs' : 'Tables'}
          </Button>
        </Toolbar>
      </AppBar>

      {/* Drawer for listing and selecting database connections */}
      <DatabaseConnectionsDrawer
        show={ui.nav}
        onHide={toggleNav}
        dbConns={dbConns}
        selectedDbId={selectedDbId}
        onDbClick={handleDbSelect}
        onAddClick={showNewDb}
      />

      {/* Modal for adding a new database connection */}
      <NewDatabaseConnectionModal
        show={ui.newDb}
        onHide={hideNewDb}
        newDbName={newDbName}
        setNewDbName={setNewDbName}
        newConnStr={newConnStr}
        setNewConnStr={setNewConnStr}
        testing={testing}
        testError={testError}
        onTest={async () => {
          setTesting(true);
          setTestError(null);
          try {
            const msg = await testConn(newConnStr.trim());
            setTestError(msg);
          } catch (e) {
            setTestError((e as Error).message);
          } finally {
            setTesting(false);
          }
        }}
        onSave={handleAdd}
      />

      {/* Modal showing details for the selected database connection */}
      <ConnectionDetailModal
        show={ui.detail}
        conn={selectedConn}
        onHide={hideDetail}
        onSelect={id => {
          useStore.getState().selectDatabase(id.toString());
          hideDetail();
          hideDbMenu();  // close the database drawer without reopening the selector
        }}
        onDelete={handleDeleteConn}
        deleting={deleting}
        deleteError={deleteError}
      />

      {/* Drawer showing tables and columns for the selected database */}
      <Drawer
        anchor="right"
        open={ui.dbMenu}
        onClose={hideDbMenu}
      >
        <Box sx={{ width: '33vw', p: 2 }} role="presentation">
          {/* Title showing the selected database name */}
          <Typography variant="h6" gutterBottom>
            Tables in {selectedDbName}
          </Typography>
          {/* Component for displaying tables and columns with rule tags */}
          <DatabaseSelector
            tables={tables}
            loading={loadingTables}
            error={tablesError}
            onColumnClick={handleColumnClick}
            onRuleTagClick={handleRuleTagClick}
            connectionId={selectedDbId ?? ''}
            onRuleAdded={(adder) => { addRuleToDatabaseSelector.current = adder; }}
          />
          {/* Modal for adding or editing a rule */}
          {ruleModalInfo && (
            <NewRuleModal
              open={true}
              connectionId={ruleModalInfo.connectionId}
              tableName={ruleModalInfo.table}
              columnName={ruleModalInfo.column}
              initialRule={ruleModalInfo.rule}
              onClose={() => setRuleModalInfo(null)}
              onSaveSuccess={(savedRule: ColumnRule | null) => {
                if (addRuleToDatabaseSelector.current && savedRule) {
                  addRuleToDatabaseSelector.current(savedRule);
                }
                setRuleModalInfo(info => info ? { ...info } : null);
              }}
            />
          )}
        </Box>
      </Drawer>

      {/* Main dashboard area:
          - Shows Dashboard component if a database is selected
          - Otherwise shows a prompt to select a connection */}
      {selectedDbId ? (
        <Dashboard />
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh' }}>
          <Typography variant="h6" color="text.secondary">
            Select a connection to display dashboard
          </Typography>
        </Box>
      )}

      {/* Chat widget integration:
          - Passes the selected database connection ID to the chat component */}
      <ChatWidget 
        connectionId={selectedDbId ?? ''}
      />
    </>
  );
}

