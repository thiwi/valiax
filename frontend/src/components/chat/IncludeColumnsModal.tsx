import React from 'react';
import { useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, CircularProgress, Alert, Box
} from '@mui/material';
import TableAccordion from '../db/TableAccordion';

interface IncludeColumnsModalProps {
  /**
   * Controls whether the modal dialog is open or closed.
   */
  open: boolean;
  /**
   * Callback function invoked when the modal is requested to be closed.
   */
  onClose: () => void;
  /**
   * Array of table names to be displayed in the modal.
   */
  tables: string[];
  /**
   * Array of table names that are currently expanded in the accordion view.
   */
  expandedTables: string[];
  /**
   * Function that returns a toggle handler for expanding/collapsing a table accordion.
   * Accepts the table name and returns a function handling the toggle event.
   */
  onToggleTable: (table: string) => (_e: any, isExpanded: boolean) => void;
  /**
   * Object mapping table names to their respective array of column names.
   */
  tableColumns: Record<string, string[]>;
  /**
   * Object mapping table names to boolean values indicating if columns are currently loading.
   */
  loadingColumns: Record<string, boolean>;
  /**
   * Object mapping table names to error messages (string) or null if no error.
   */
  errorColumns: Record<string, string | null>;
  /**
   * Set of strings representing currently selected column identifiers (usually table.column combos).
   */
  selectedColumns: Set<string>;
  /**
   * Callback function invoked when a column selection is toggled.
   * Accepts the column identifier and a boolean indicating if it was checked or unchecked.
   */
  onToggleColumn: (combo: string, checked: boolean) => void;
  /**
   * Identifier for the current database connection, used to fetch columns.
   */
  connectionId: string;
}

/**
 * IncludeColumnsModal is a modal dialog component that allows users to select which columns
 * from various database tables should be included in a chat context. It displays an accordion
 * list of tables, each expandable to show their columns. Columns can be selected or deselected.
 * The component handles fetching column data for tables dynamically when needed.
 */
const IncludeColumnsModal: React.FC<IncludeColumnsModalProps> = ({
  open, onClose, tables, expandedTables,
  onToggleTable, tableColumns, loadingColumns,
  errorColumns, selectedColumns, onToggleColumn,
  connectionId
}) => {
  /**
   * Effect hook that triggers whenever the list of tables changes.
   * For each table, if columns are not already loaded, loading, or errored,
   * it fetches the columns from the backend API.
   * This ensures column data is loaded on demand and kept up to date.
   */
  useEffect(() => {
    tables.forEach(table => {
      if (!loadingColumns[table] && !tableColumns[table] && !errorColumns[table]) {
        fetch(`/api/db-connections/${connectionId}/tables/${encodeURIComponent(table)}/columns`)
          .then(res => res.json())
          .then((data: any) => {
            const cols: string[] = Array.isArray(data)
              ? data
              : Array.isArray(data.columns)
                ? data.columns
                : [];
            tableColumns[table] = cols;
          })
          .catch(err => {
            console.error(`Error loading columns for table ${table}:`, err);
          });
      }
    });
  }, [tables]);

  return (
    // Main modal dialog container with title, content, and actions
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" sx={{ zIndex: theme => theme.zIndex.tooltip + 10 }}>
      {/* Modal header showing the purpose of the dialog */}
      <DialogTitle>Include columns in chat</DialogTitle>

      {/* Modal content area displaying either a message or the list of tables */}
      <DialogContent dividers>
        {tables.length === 0 ? (
          // Message shown when no tables are available to display
          <Typography>No tables available.</Typography>
        ) : (
          // Map over each table to render a TableAccordion component
          tables.map(table => (
            <TableAccordion
              key={table}
              table={table}
              columns={tableColumns[table] || []}
              isExpanded={expandedTables.includes(table)}
              isLoading={loadingColumns[table]}
              error={errorColumns[table]}
              expandedTables={expandedTables}
              onToggleTable={onToggleTable}
              selectedColumns={selectedColumns}
              onToggleColumn={onToggleColumn}
            />
          ))
        )}
      </DialogContent>

      {/* Modal footer with action buttons */}
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default IncludeColumnsModal;