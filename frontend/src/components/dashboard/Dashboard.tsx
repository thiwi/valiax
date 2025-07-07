// Dashboard.tsx
//
// React component responsible for displaying KPI tiles, trend charts and a list
// of top violations for the currently selected database connection.

import React, { useState, useEffect } from 'react';
import ShowRuleModal from '../db/ShowRuleModal';
import { useStore } from '../../store/store';
import axios from 'axios';
import 'react-circular-progressbar/dist/styles.css';
import type {
  DashboardKPI,
  DashboardTrendItem,
  DashboardTopViolations,
  DashboardResultItem,
  DashboardResultPage,
  ColumnRule,
  Violation,
} from '../../types';
import { brandColors } from '../../theme';

import KpiTiles from './KpiTiles';
import TrendChart from './TrendChart';
import TopRules from './TopRules';
import TopTables from './TopTables';
import RuleResultsTable from './RuleResultsTable';

// Define default date range: last 90 days until today
const defaultEnd = new Date().toISOString().slice(0,10);
const defaultStart = new Date(new Date().setDate(new Date().getDate() - 90)).toISOString().slice(0,10);

/**
 * Dashboard component displays key performance indicators (KPIs),
 * trends over time, and top violations related to selected database.
 * It fetches data from API endpoints based on selected database and date range,
 * and allows interaction such as sorting and viewing detailed rule information.
 */
const Dashboard: React.FC = () => {
  // Get the selected database ID and name from global store
  const selectedDbId = useStore(state => state.selectedDatabase);
  const dbName = useStore(state => state.selectedDatabaseName) || 'None';

  // State to hold KPI metrics like total violations, critical violations, etc.
  const [kpis, setKpis] = useState<DashboardKPI>({ total_violations: 0, critical_violations: 0, affected_tables: 0, compliance_rate: 0 });
  // State to hold trend data points for visualization over time
  const [trends, setTrends] = useState<DashboardTrendItem[]>([]);
  // State to hold list of top rules by violation count
  const [topRules, setTopRules] = useState<DashboardTopViolations['top_rules']>([]);
  // State to hold list of top tables by violation count
  const [topTables, setTopTables] = useState<DashboardTopViolations['top_tables']>([]);
  // State to track which key is currently used for sorting (e.g. detected_at)
  const [sortKey, setSortKey] = useState<string>('detected_at');
  // State to track ascending/descending sort order
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  // State to hold filter text for searching violations (currently unused in this snippet)
  const [filterText, setFilterText] = useState<string>('');
  // State to hold violation selected for detailed panel view (unused here)
  const [panelViolation, setPanelViolation] = useState<Violation | null>(null);
  // State to control visibility of the rule details modal
  const [showRuleModal, setShowRuleModal] = useState<boolean>(false);
  // State to hold the name of the rule selected for detailed view
  const [selectedRuleName, setSelectedRuleName] = useState<string>('');
  // State to hold full details of the selected rule fetched from API
  const [selectedRule, setSelectedRule] = useState<ColumnRule | null>(null);
  // State to hold start date of the data range filter
  const [rangeStart, setRangeStart] = useState<string>(defaultStart);
  // State to hold end date of the data range filter
  const [rangeEnd, setRangeEnd] = useState<string>(defaultEnd);
  // State used to trigger reload of data by changing its value
  const [reloadKey, setReloadKey] = useState<number>(0);
  // State holding recent rule execution results
  const [results, setResults] = useState<DashboardResultItem[]>([]);
  const [resultsTotal, setResultsTotal] = useState<number>(0);
  const [resultsPage, setResultsPage] = useState<number>(0);
  const [resultsPerPage, setResultsPerPage] = useState<number>(10);
  const [allRules, setAllRules] = useState<string[]>([]);
  const [selectedRules, setSelectedRules] = useState<string[]>([]);
  // Ref for the trend chart component (used for imperative chart actions)
  const chartRef = React.useRef<any>(null);

  // Base URL for API calls from environment variable or empty string
  const apiBase = process.env.REACT_APP_API_URL || '';

  // Load all rule names for the selected database
  useEffect(() => {
    if (!selectedDbId) return;
    axios.get<string[]>(`${apiBase}/api/db-connections/${selectedDbId}/rules`)
      .then(res => setAllRules(res.data))
      .catch(err => {
        console.error('Failed to fetch rule names:', err);
        setAllRules([]);
      });
  }, [selectedDbId]);

  /**
   * Effect hook to fetch dashboard data whenever the selected database,
   * date range, or reload key changes.
   * 
   * It performs three API calls:
   * 1. Fetch KPI metrics and update kpis state.
   * 2. Fetch trend data points and update trends state.
   * 3. Fetch top violations data and update topRules and topTables states.
   */
  useEffect(() => {
    if (!selectedDbId) return; // Do nothing if no database selected

    // Prepare query parameters with database ID and date range
    const ps: Record<string, any> = { db_conn_id: selectedDbId };
    if (rangeStart) ps.date_from = rangeStart;
    if (rangeEnd) ps.date_to = rangeEnd;
    const params = { params: ps };

    // Fetch KPI metrics
    axios.get<DashboardKPI>(`${apiBase}/api/dashboard/kpis`, params)
      .then(res => {
        setKpis({ ...res.data });
      })
      .catch(err => {
        console.error('[API] KPI fetch error:', err);
        // Reset KPIs on error
        setKpis({ total_violations: 0, critical_violations: 0, affected_tables: 0, compliance_rate: 0 });
      });

    // Fetch trend data for charts
    axios.get<DashboardTrendItem[]>(`${apiBase}/api/dashboard/trends`, params)
      .then(res => setTrends(res.data))
      .catch(err => {
        console.error('Failed to fetch trends:', err);
        setTrends([]);
      });

    // Fetch top violations data (rules and tables)
    axios.get<DashboardTopViolations>(`${apiBase}/api/dashboard/top-violations`, params)
      .then(res => {
        const data = res.data;
        setTopRules(data.top_rules);
        setTopTables(data.top_tables);
      })
      .catch(err => {
        console.error('Failed to fetch top violations:', err);
        setTopRules([]);
        setTopTables([]);
      });

  }, [selectedDbId, rangeStart, rangeEnd, reloadKey]);

  // Load recent rule results whenever filters or pagination change
  useEffect(() => {
    if (!selectedDbId) return;
    const ps: Record<string, any> = {
      db_conn_id: selectedDbId,
      limit: resultsPerPage,
      offset: resultsPage * resultsPerPage,
    };
    if (rangeStart) ps.date_from = rangeStart;
    if (rangeEnd) ps.date_to = rangeEnd;
    if (selectedRules.length > 0) ps.rules = selectedRules;
    const params = { params: ps };
    axios
      .get<DashboardResultPage>(`${apiBase}/api/dashboard/results`, params)
      .then(res => {
        setResults(res.data.items);
        setResultsTotal(res.data.total);
      })
      .catch(err => {
        console.error('Failed to fetch results:', err);
        setResults([]);
        setResultsTotal(0);
      });
  }, [selectedDbId, rangeStart, rangeEnd, reloadKey, selectedRules, resultsPage, resultsPerPage]);

  /**
   * Handles sorting logic when user clicks on a sortable column.
   * Toggles ascending/descending if same key clicked, or sets new key.
   * @param key The key to sort by
   */
  const handleSort = (key: string) => {
    setSortAsc(key === sortKey ? !sortAsc : true);
    setSortKey(key);
  };

  /**
   * Handles user clicking on a rule name to view detailed information.
   * Fetches full rule details from API and opens the modal.
   * @param ruleName The name of the rule to fetch details for
   */
  const handleRuleClick = async (ruleName: string) => {
    try {
      // Fetch full rule details by name
      const resp = await axios.get<ColumnRule>(
        `${apiBase}/api/column-rules/${encodeURIComponent(ruleName)}`
      );
      setSelectedRule(resp.data);
      setShowRuleModal(true);
    } catch (err) {
      console.error('Failed to load rule details:', err);
    }
  };

  /**
   * Resets the date range filters to defaults and triggers data reload.
   */
  const reloadData = () => {
    setRangeStart(defaultStart);
    setRangeEnd(defaultEnd);
    setReloadKey(prev => prev + 1);
  };

  return (
    <div className="p-4">
      {/* Display selected database name as header */}
      <h2 className="text-2xl font-bold mb-4">{dbName}</h2>

      {/* KPI Tiles: Show key performance indicators like total violations, compliance rate */}
      <KpiTiles kpis={kpis} brandColors={brandColors} />

      {/* Trend Chart: Visualize trends over time with date range controls */}
      <TrendChart
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        setRangeStart={setRangeStart}
        setRangeEnd={setRangeEnd}
        chartRef={chartRef}
        trends={trends}
        defaultStart={defaultStart}
        defaultEnd={defaultEnd}
        onResetTimeframe={reloadData}
        reloadData={reloadData}
      />

      {/* Grid layout for top violations: rules on left, tables on right */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <TopRules topRules={topRules} handleRuleClick={handleRuleClick} />
        <TopTables topTables={topTables} />
      </div>
      <RuleResultsTable
        results={results}
        allRules={allRules}
        selectedRules={selectedRules}
        onSelectedRulesChange={v => {
          setResultsPage(0);
          setSelectedRules(v);
        }}
        page={resultsPage}
        rowsPerPage={resultsPerPage}
        total={resultsTotal}
        onPageChange={setResultsPage}
        onRowsPerPageChange={rows => {
          setResultsPerPage(rows);
          setResultsPage(0);
        }}
      />
      {/* Modal for showing detailed rule information when selected */}
      {selectedRule && (
        <ShowRuleModal
          open={showRuleModal}
          rule={selectedRule}
          onClose={() => {
            setShowRuleModal(false);
            setSelectedRule(null);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;

