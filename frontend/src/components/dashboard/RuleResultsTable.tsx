import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Autocomplete, TextField } from '@mui/material';
import type { DashboardResultItem } from '../../types';

interface Props {
  results: DashboardResultItem[];
  allRules: string[];
  selectedRules: string[];
  onSelectedRulesChange: (v: string[]) => void;
}

const RuleResultsTable: React.FC<Props> = ({ results, allRules, selectedRules, onSelectedRulesChange }) => (
  <div>
    <h3 className="text-xl font-semibold mb-2">Latest Rule Results</h3>
    <Autocomplete
      multiple
      size="small"
      options={allRules}
      value={selectedRules}
      onChange={(_, v) => onSelectedRulesChange(v as string[])}
      renderInput={(params) => <TextField {...params} label="Filter rules" placeholder="All" />}
      sx={{ mb: 1, width: 300 }}
    />
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Detected At</TableCell>
            <TableCell>Rule Name</TableCell>
            <TableCell>Result</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {results.map(r => (
            <TableRow key={r.id}>
              <TableCell>{new Date(r.detected_at).toLocaleString()}</TableCell>
              <TableCell>{r.rule_name}</TableCell>
              <TableCell>
                <pre className="whitespace-pre-wrap text-xs m-0">
                  {JSON.stringify(r.result, null, 2)}
                </pre>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </div>
);

export default RuleResultsTable;

