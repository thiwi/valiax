import React, { useState, useEffect } from 'react';
import type { ColumnRule } from '../../types';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Box,
  Chip
} from '@mui/material';
import theme from '../../theme';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

/**
 * Interface defining the props for the DatabaseSelector component.
 * 
 * @property {string[]} tables - An array of table names available for selection.
 * @property {boolean} loading - Indicates if the tables data is currently loading.
 * @property {string | null} error - Contains any error message related to loading tables.
 * @property {(tableName: string, columnName: string) => void} onColumnClick - Callback when a column's "+" chip is clicked.
 * @property {(rule: ColumnRule) => void} [onRuleTagClick] - Optional callback when a rule chip is clicked.
 * @property {string} connectionId - Identifier for the database connection used to fetch columns and rules.
 * @property {(adder: (rule: ColumnRule) => void) => void} [onRuleAdded] - Optional callback to register a function that adds new rules to the component's state.
 */
export interface DatabaseSelectorProps {
  tables: string[];
  loading: boolean;
  error: string | null;
  onColumnClick: (tableName: string, columnName: string) => void;
  onRuleTagClick?: (rule: ColumnRule) => void;
  connectionId: string;
  onRuleAdded?: (adder: (rule: ColumnRule) => void) => void;
}

/**
 * DatabaseSelector component allows users to browse database tables,
 * expand each table to see its columns, and interact with rules associated
 * with each column. It supports loading states, error handling, and dynamic
 * fetching of columns and rules upon expansion.
 */
const DatabaseSelector: React.FC<DatabaseSelectorProps> = ({
  tables,
  loading,
  error,
  onColumnClick,
  onRuleTagClick,
  connectionId,
  onRuleAdded,
}) => {
  // State holding the list of columns for each table (keyed by table name).
  const [tableColumns, setTableColumns] = useState<Record<string, string[]>>({});
  // State tracking loading status for columns of each table.
  const [loadingColumns, setLoadingColumns] = useState<Record<string, boolean>>({});
  // State holding error messages related to loading columns for each table.
  const [errorColumns, setErrorColumns] = useState<Record<string, string | null>>({});
  // State holding rules grouped by table and then by column.
  // Structure: { [tableName]: { [columnName]: ColumnRule[] } }
  const [tableRules, setTableRules] = useState<
    Record<string, Record<string, ColumnRule[]>>
  >({});
  // State tracking which tables are currently expanded.
  const [expandedTables, setExpandedTables] = useState<string[]>([]);

  /**
   * Adds a new rule to the component's state under the appropriate table and column.
   * This allows external components to add rules dynamically via the onRuleAdded prop.
   * @param rule The rule to add.
   */
  const addRuleToState = (rule: ColumnRule) => {
    const { table_name, column_name } = rule;
    setTableRules(prev => {
      const tableEntry = { ...(prev[table_name] || {}) };
      const existingRules = tableEntry[column_name] || [];
      tableEntry[column_name] = [...existingRules, rule];
      return { ...prev, [table_name]: tableEntry };
    });
  };

  /**
   * Effect hook to register the addRuleToState function with the parent component
   * via the onRuleAdded callback. This allows the parent to add rules to this component's state.
   * Runs once when onRuleAdded prop changes.
   */
  useEffect(() => {
    if (onRuleAdded) {
      onRuleAdded(addRuleToState);
    }
  }, [onRuleAdded]);

  /**
   * Handles toggling the expansion state of a table accordion.
   * When a table is expanded:
   * - Adds the table to the expandedTables state.
   * - If columns for the table are not loaded yet, fetches columns from the API.
   * - For each column fetched, also fetches associated rules.
   * When a table is collapsed:
   * - Removes the table from the expandedTables state.
   * @param table The table name to toggle.
   */
  const handleToggle =
    (table: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
      // Update expandedTables state based on whether the accordion is expanded or collapsed
      setExpandedTables(prev =>
        isExpanded ? [...prev, table] : prev.filter(t => t !== table)
      );

      // If the table is being expanded and columns are not yet loaded, fetch them
      if (isExpanded && !tableColumns[table]) {
        // Set loading state for columns of this table
        setLoadingColumns(prev => ({ ...prev, [table]: true }));

        // Fetch columns for the table from the API
        fetch(
          `/api/db-connections/${connectionId}/tables/${encodeURIComponent(
            table
          )}/columns`
        )
          .then(res => res.json())
          .then((data: any) => {
            // Extract columns array from response data
            const cols: string[] = Array.isArray(data)
              ? data
              : Array.isArray(data.columns)
              ? data.columns
              : [];
            // Update state with fetched columns
            setTableColumns(prev => ({ ...prev, [table]: cols }));
            // Clear any previous column loading errors for this table
            setErrorColumns(prev => ({ ...prev, [table]: null }));

            // For each column, fetch associated rules
            cols.forEach(colName => {
              fetch(
                `/api/db-connections/${connectionId}/tables/${encodeURIComponent(
                  table
                )}/columns/${encodeURIComponent(colName)}/rules`
              )
                .then(res => res.json())
                .then((rules: ColumnRule[]) => {
                  // Update tableRules state with fetched rules for this column
                  setTableRules(prev => {
                    const tableEntry = { ...(prev[table] || {}) };
                    tableEntry[colName] = rules;
                    return { ...prev, [table]: tableEntry };
                  });
                })
                .catch(err => {
                  // Log any errors encountered while fetching rules
                  console.error('Error fetching rules for', colName, err);
                });
            });
          })
          .catch(err => {
            // Set error state if fetching columns fails
            setErrorColumns(prev => ({ ...prev, [table]: err.message }));
          })
          .finally(() => {
            // Clear loading state for columns regardless of success or failure
            setLoadingColumns(prev => ({ ...prev, [table]: false }));
          });
      }
    };

  // Display a loading spinner if the tables list is currently loading
  if (loading) {
    return (
      <Box p={2} textAlign="center">
        <CircularProgress />
      </Box>
    );
  }

  // Display an error alert if there was an error loading the tables list
  if (error) {
    return (
      <Box p={2}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // Main render of the component displaying accordions for each table
  return (
    <Box width="100%">
      {tables.map(table => {
        // Retrieve columns, loading state, and error state for this table
        const cols = tableColumns[table] || [];
        const isLoading = loadingColumns[table];
        const colsError = errorColumns[table];
        const isExpanded = expandedTables.includes(table);

        return (
          // Accordion component used to expand/collapse each table's details
          <Accordion
            key={table}
            expanded={isExpanded}
            onChange={handleToggle(table)}
          >
          {/* AccordionSummary is the clickable header showing the table name */}
          <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`${table}-content`}
              id={`${table}-header`}
          >
            <Typography>{table}</Typography>
          </AccordionSummary>
          {/* AccordionDetails contains the content shown when expanded */}
          <AccordionDetails>
              {/* Show loading spinner while columns are loading */}
              {isLoading ? (
                <CircularProgress size={24} />
              ) : 
              /* Show error alert if there was an error loading columns */
              colsError ? (
                <Alert severity="error">{colsError}</Alert>
              ) : (
                // List of columns for the table
                <List disablePadding>
                  {cols.map(col => (
                    <ListItem key={col}>
                      {/* Display column name */}
                      <ListItemText primary={col} />
                      {/* Container for rule chips and the "+" chip */}
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', ml: 2 }}>
                        {/* Render chips for each rule associated with this column */}
                        {(tableRules[table]?.[col] || []).map(rule => (
                          <Chip
                            key={rule.id}
                            label={rule.rule_name}
                            size="small"
                            // When a rule chip is clicked, call onRuleTagClick callback if provided
                            onClick={() => onRuleTagClick?.(rule)}
                            sx={{
                              mr: 0.5,
                              mb: 0.5,
                              backgroundColor: theme.palette.grey[800],
                              color: theme.palette.getContrastText(theme.palette.grey[800]),
                            }}
                          />
                        ))}
                        {/* "+" chip allows adding a new rule to this column */}
                        <Chip
                          label="+"
                          size="small"
                          onClick={() => {
                            onColumnClick(table, col);
                          }}
                          sx={{
                            mb: 0.5,
                            backgroundColor: theme.palette.primary.main,
                            borderColor: theme.palette.primary.main,
                            '& .MuiChip-label': {
                              color: theme.palette.primary.contrastText,
                            },
                          }}
                        />
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
};

export default DatabaseSelector;