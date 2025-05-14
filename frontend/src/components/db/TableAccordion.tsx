// components/TableAccordion.tsx

/**
 * TableAccordion component renders an expandable accordion UI element for a database table.
 * It displays the table name as the accordion summary and, when expanded, shows a list of columns
 * associated with that table. Each column is presented with a checkbox to allow users to select
 * or deselect columns for further operations (e.g., querying or visualization).
 * 
 * This component is typically used within a list of tables to provide an intuitive and interactive
 * way for users to browse database tables and choose specific columns of interest.
 */

import React from 'react';
import {
  Accordion, AccordionSummary, AccordionDetails,
  Typography, CircularProgress, Alert,
  FormControlLabel, Checkbox
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface TableAccordionProps {
  /** The name of the database table to display in the accordion summary */
  table: string;
  /** Array of column names belonging to the table, to be shown as selectable items */
  columns: string[];
  /** Boolean indicating whether this accordion is currently expanded */
  isExpanded: boolean;
  /** Boolean indicating if the table's column data is currently being loaded */
  isLoading: boolean;
  /** Error message string if loading columns failed; null if no error */
  error: string | null;
  /** Array of currently expanded table names to control which accordions are open */
  expandedTables: string[];
  /**
   * Callback function invoked when the accordion expansion state changes.
   * Takes the table name and returns an event handler that receives the expansion state.
   */
  onToggleTable: (table: string) => (_e: any, expanded: boolean) => void;
  /** Set of selected column identifiers in the format "table:column" to track user selections */
  selectedColumns: Set<string>;
  /**
   * Callback invoked when a column checkbox is toggled.
   * Receives the column identifier ("table:column") and the new checked state (true/false).
   */
  onToggleColumn: (combo: string, checked: boolean) => void;
}

const TableAccordion: React.FC<TableAccordionProps> = ({
  table,
  columns,
  isExpanded,
  isLoading,
  error,
  expandedTables,
  onToggleTable,
  selectedColumns,
  onToggleColumn
}) => (
  // Accordion component wraps the entire table section and controls expand/collapse behavior.
  // The 'expanded' prop determines if this accordion is open based on isExpanded.
  // The onChange handler toggles expansion state by invoking onToggleTable callback.
  <Accordion
    key={table}
    expanded={isExpanded}
    onChange={onToggleTable(table)}
  >
    {/* AccordionSummary displays the table name and an expand icon */}
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      {/* Typography component shows the table name as the accordion header */}
      <Typography>{table}</Typography>
    </AccordionSummary>

    {/* AccordionDetails contains the content shown when the accordion is expanded */}
    <AccordionDetails>
      {/* Conditional rendering logic for the accordion content: */}
      {isLoading ? (
        // While loading column data, show a circular progress spinner to indicate activity.
        <CircularProgress size={24} />
      ) : error ? (
        // If an error occurred during loading, display an error alert with the message.
        <Alert severity="error">{error}</Alert>
      ) : columns.length === 0 ? (
        // If no columns are found, display a secondary text message indicating empty state.
        <Typography variant="body2" color="text.secondary">No columns found.</Typography>
      ) : (
        // Otherwise, render a list of FormControlLabel components each containing a checkbox for a column.
        columns.map(column => (
          <FormControlLabel
            key={column}
            control={
              <Checkbox
                // Checkbox checked state is determined by whether the column is in selectedColumns set.
                checked={selectedColumns.has(`${table}:${column}`)}
                // When the checkbox state changes, invoke onToggleColumn callback with column identifier and new checked state.
                onChange={e => onToggleColumn(`${table}:${column}`, e.target.checked)}
              />
            }
            // Label displays the fully qualified column name in the format "table.column"
            label={`${table}.${column}`}
          />
        ))
      )}
    </AccordionDetails>
  </Accordion>
);

export default TableAccordion;