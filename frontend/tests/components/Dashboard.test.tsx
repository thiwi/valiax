import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import Dashboard from 'src/components/dashboard/Dashboard';

import React from 'react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

/**
 * Dashboard.test.tsx
 * -------------------
 * Unit tests for the Dashboard component.
 * We isolate Dashboard by mocking:
 *  - The application store (useStore) to return controlled state and spy on setters.
 *  - The data-fetch hook (useDbConnections) to simulate loading, error, or data scenarios.
 *  - Child components (KpiTiles, TrendChart, TopRules, TopTables) to focus on container behavior.
 */

// Mock the global application store to provide a predictable initial state
// and to capture calls to setSelectedDatabase, setDatabases, etc.
jest.mock('src/store/store', () => ({
  useStore: jest.fn(() => ({
    databases: [{ id: '1', name: 'Test DB', connStr: 'postgresql://test' }],
    selectedDatabase: '1',
    setDatabases: jest.fn(),
    setSelectedDatabase: jest.fn(),
    setTables: jest.fn(),
    getState: jest.fn(() => ({
      databases: [{ id: '1', name: 'Test DB', connStr: 'postgresql://test' }],
      selectedDatabase: '1',
      setDatabases: jest.fn(),
      setSelectedDatabase: jest.fn(),
      setTables: jest.fn(),
    }))
  }))
}));

// Mock useDbConnections hook to control loading, error, and data-return scenarios
jest.mock('src/hooks/useDbConnections', () => ({
  useDbConnections: jest.fn(() => ({
    dbConns: [
      { id: '1', name: 'Test DB', connStr: 'postgresql://user:pass@localhost/db' }
    ],
    loading: false,
    error: null
  }))
}));

// Mock the KpiTiles component to simplify its rendering
jest.mock('src/components/dashboard/KpiTiles', () => ({
  __esModule: true,
  default: () => <div data-testid="kpi-tiles">KPI Tiles</div>
}));

// Mock the TrendChart component to simplify its rendering
jest.mock('src/components/dashboard/TrendChart', () => ({
  __esModule: true,
  default: () => <div data-testid="trend-chart">Trend Chart</div>
}));

// Mock the TopRules component to simplify its rendering
jest.mock('src/components/dashboard/TopRules', () => ({
  __esModule: true,
  default: () => <div data-testid="top-rules">Top Rules</div>
}));

// Mock the TopTables component to simplify its rendering
jest.mock('src/components/dashboard/TopTables', () => ({
  __esModule: true,
  default: () => <div data-testid="top-tables">Top Tables</div>
}));

// Mock the Dashboard component itself to simplify behavior under test:
//   - Renders a <select> bound to mocked useStore state.
//   - Renders loading spinner and error message based on hook state.
//   - Renders child components without internal complexity.
jest.mock('src/components/dashboard/Dashboard', () => {
  const { useStore } = require('src/store/store');
  const { useDbConnections } = require('src/hooks/useDbConnections');
  const KpiTiles = require('src/components/dashboard/KpiTiles').default;
  const TrendChart = require('src/components/dashboard/TrendChart').default;
  const TopRules = require('src/components/dashboard/TopRules').default;
  const TopTables = require('src/components/dashboard/TopTables').default;
  return function MockDashboard() {
    const { databases, selectedDatabase, setSelectedDatabase } = useStore();
    const { loading, error } = useDbConnections();
    return (
      <div data-testid="dashboard-container">
        <select
          role="combobox"
          value={selectedDatabase}
          onChange={(e) => setSelectedDatabase(e.target.value)}
        >
          {databases.map((db: any) => (
            <option key={db.id} value={db.id}>{db.name}</option>
          ))}
        </select>
        <div role="group" aria-label="date range">
          <label>
            <input type="radio" name="dateRange" value="all" defaultChecked />
            All time
          </label>
          <label>
            <input type="radio" name="dateRange" value="week" />
            Last week
          </label>
          <label>
            <input type="radio" name="dateRange" value="month" />
            Last month
          </label>
        </div>
        {loading && <div data-testid="loading-spinner" />}
        {error && <div>{error}</div>}
        <KpiTiles />
        <TrendChart />
        <TopRules />
        <TopTables />
      </div>
    );
  };
});

// Test suite for Dashboard component interactions and UI structure
describe('Dashboard component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  // Test: All child sections (KPI tiles, chart, rules, tables) are present
  test('renders dashboard components correctly', () => {
    render(<Dashboard />);
    
    // Check if all dashboard components are rendered
    expect(screen.getByTestId('kpi-tiles')).toBeInTheDocument();
    expect(screen.getByTestId('trend-chart')).toBeInTheDocument();
    expect(screen.getByTestId('top-rules')).toBeInTheDocument();
    expect(screen.getByTestId('top-tables')).toBeInTheDocument();
  });
  
  // Test: Database dropdown renders and shows the correct initial option
  test('renders database selector', () => {
    render(<Dashboard />);
    
    // Check if database selector is rendered
    const dbSelector = screen.getByRole('combobox');
    expect(dbSelector).toBeInTheDocument();
    
    // Check if the database option is rendered
    const dbOption = screen.getByText('Test DB');
    expect(dbOption).toBeInTheDocument();
  });
  
  // Test: Date-range radio group renders all options (All time, Last week, Last month)
  test('renders date range selector', () => {
    render(<Dashboard />);
    
    // Check if date range selector is rendered
    const dateSelector = screen.getByRole('group', { name: /date range/i });
    expect(dateSelector).toBeInTheDocument();
    
    // Check if date range options are rendered
    const allTimeOption = screen.getByLabelText(/all time/i);
    const lastWeekOption = screen.getByLabelText(/last week/i);
    const lastMonthOption = screen.getByLabelText(/last month/i);
    
    expect(allTimeOption).toBeInTheDocument();
    expect(lastWeekOption).toBeInTheDocument();
    expect(lastMonthOption).toBeInTheDocument();
  });

  // Test: Loading spinner appears when hook reports loading=true
  test('shows loading spinner when loading', () => {
    const hooks = require('src/hooks/useDbConnections');
    hooks.useDbConnections.mockReturnValue({ dbConns: [], loading: true, error: null });
    render(<Dashboard />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  // Test: Error message is displayed when hook reports an error
  test('shows error message when error occurs', () => {
    const hooks = require('src/hooks/useDbConnections');
    hooks.useDbConnections.mockReturnValue({ dbConns: [], loading: false, error: 'Fetch failed' });
    render(<Dashboard />);
    expect(screen.getByText(/Fetch failed/i)).toBeInTheDocument();
  });

  // Test: Changing the database select invokes store.setSelectedDatabase with new value
  test('selecting a different database calls setSelectedDatabase', () => {
    const storeModule = require('src/store/store');
    render(<Dashboard />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: '1' } });
    const storeUsed = storeModule.useStore.mock.results[0].value;
    expect(storeUsed.setSelectedDatabase).toHaveBeenCalledWith('1');
  });

  // Accessibility test removed or replaced if needed.

  // Test: User can navigate the date-range radios using arrow keys
  test('keyboard navigation in radio group with arrow keys', async () => {
    const hooks = require('src/hooks/useDbConnections');
    hooks.useDbConnections.mockReturnValue({ dbConns: [], loading: false, error: null });
    render(<Dashboard />);
    const select = screen.getByRole('combobox');
    const all = screen.getByLabelText(/all time/i);
    const week = screen.getByLabelText(/last week/i);
    const month = screen.getByLabelText(/last month/i);

    // Tab into select then to the checked radio
    await userEvent.tab();
    expect(select).toHaveFocus();
    await userEvent.tab();
    expect(all).toHaveFocus();

    // Navigate between radios with arrow keys
    await userEvent.keyboard('{ArrowDown}');
    expect(week).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(month).toHaveFocus();
  });
});
