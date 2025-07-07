import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Button from '@mui/material/Button';
import type { ColumnRule } from '../../types';
import { useStore } from '../../store/store';

const RuleDetailPage: React.FC = () => {
  const { ruleName } = useParams<{ ruleName: string }>();
  const navigate = useNavigate();
  const apiBase = process.env.REACT_APP_API_URL || '';
  const dbName = useStore(state => state.selectedDatabaseName) || 'Unknown DB';
  const [rule, setRule] = useState<ColumnRule | null>(null);

  useEffect(() => {
    if (!ruleName) return;
    axios
      .get<ColumnRule>(`${apiBase}/api/column-rules/${encodeURIComponent(ruleName)}`)
      .then(res => setRule(res.data))
      .catch(() => setRule(null));
  }, [ruleName]);

  if (!rule) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4 space-y-4">
      <Button variant="outlined" onClick={() => navigate(-1)}>
        Back
      </Button>
      <h2 className="text-2xl font-bold">{rule.rule_name}</h2>
      <div>
        <p><strong>Database:</strong> {dbName}</p>
        <p><strong>Table:</strong> {rule.table_name}</p>
        <p><strong>Column:</strong> {rule.column_name}</p>
        <p><strong>Interval:</strong> {rule.interval}</p>
        <p><strong>Severity:</strong> {rule.severity}</p>
        <p><strong>Description:</strong> {rule.description}</p>
      </div>
      <pre className="whitespace-pre-wrap border p-2 bg-gray-100">
        {rule.rule_text}
      </pre>
    </div>
  );
};

export default RuleDetailPage;
