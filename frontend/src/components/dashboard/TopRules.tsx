import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import type { DashboardTopViolations } from '../../types';

/**
 * TopRules Component
 * 
 * This component is responsible for displaying a concise table of the most frequently violated rules
 * within the dashboard. It provides users with a quick overview of which rules are most commonly triggered.
 * Each rule name is interactive, allowing users to click on it to trigger further actions, such as filtering
 * or viewing detailed information related to that specific rule.
 */

 /**
  * Props interface for TopRules component
  * 
  * @property {DashboardTopViolations['top_rules']} topRules - An array of objects representing the top violated rules.
  * Each object contains the rule's name and the count of violations. This data drives the content of the table.
  * 
  * @property {(name: string) => void} handleRuleClick - A callback function that is invoked when a user clicks on a rule name.
  * It receives the rule name as an argument, enabling parent components to respond to user interactions, such as filtering
  * the dashboard based on the selected rule.
  */
interface Props {
  topRules: DashboardTopViolations['top_rules'];
  handleRuleClick: (name: string) => void;
}

const TopRules: React.FC<Props> = ({ topRules, handleRuleClick }) => (
  // The outermost div serves as a semantic container for the entire TopRules section.
  // It groups the heading and the table together visually and structurally.
  <div>
    {/* 
      Section heading:
      Provides a clear, descriptive title for the table below.
      Uses utility classes for styling: text-xl for larger font size, font-semibold for emphasis, and mb-2 for margin below.
    */}
    <h3 className="text-xl font-semibold mb-2">Top Rules</h3>

    {/* 
      TableContainer wraps the table in a Paper component, which adds elevation and background styling 
      consistent with Material UI's design language. The sx prop adds a bottom margin for spacing.
      This container also handles overflow and responsiveness of the table.
    */}
    <TableContainer component={Paper} sx={{ mb: 2 }}>
      {/* 
        Table component from MUI provides accessible and well-structured tabular data.
        The size="small" prop reduces padding and font size for a more compact display, fitting well in dashboard layouts.
      */}
      <Table size="small">
        {/* 
          TableHead defines the header row of the table, labeling each column.
          This improves readability and accessibility by clearly identifying the data presented.
        */}
        <TableHead>
          <TableRow>
            {/* Column header for the rule names */}
            <TableCell>Rule Name</TableCell>
            {/* Column header for the count of violations, aligned right for numerical data */}
            <TableCell align="right">Count</TableCell>
          </TableRow>
        </TableHead>

        {/* 
          TableBody contains the data rows.
          Each row corresponds to a top rule and its violation count.
        */}
        <TableBody>
          {topRules.map(r => (
            /* 
              Each TableRow represents a clickable entry for a rule.
              - key: unique identifier using rule_name for efficient rendering.
              - hover: enables a visual hover effect to indicate interactivity.
              - style cursor: pointer to communicate that the row is clickable.
              - onClick: triggers handleRuleClick with the specific rule name, enabling parent components to react.
            */
            <TableRow
              key={r.rule_name}
              hover
              style={{ cursor: 'pointer' }}
              onClick={() => handleRuleClick(r.rule_name)}
            >
              {/* 
                TableCell for the rule name:
                - component="th" and scope="row" improve accessibility by defining this cell as a row header.
              */}
              <TableCell component="th" scope="row">
                {r.rule_name}
              </TableCell>

              {/* 
                TableCell for the count of violations:
                - aligned right to visually separate numerical data from text.
              */}
              <TableCell align="right">{r.count}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </div>
);

export default TopRules;