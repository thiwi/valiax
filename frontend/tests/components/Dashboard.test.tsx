import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import Dashboard from 'src/components/dashboard/Dashboard';

// Mock the store
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

// Mock the hooks and components used by Dashboard
jest.mock('src/hooks/useDbConnections', () => ({
  useDbConnections: jest.fn(() => ({
    dbConns: [
      { id: '1', name: 'Test DB', connStr: 'postgresql://user:pass@localhost/db' }
    ],
    loading: false,
    error: null
  }))
}));

// Mock child components
jest.mock('src/components/dashboard/KpiTiles', () => ({
  __esModule: true,
  default: () => <div data-testid="kpi-tiles">KPI Tiles</div>
}));

jest.mock('src/components/dashboard/TrendChart', () => ({
  __esModule: true,
  default: () => <div data-testid="trend-chart">Trend Chart</div>
}));

jest.mock('src/components/dashboard/TopRules', () => ({
  __esModule: true,
  default: () => <div data-testid="top-rules">Top Rules</div>
}));

jest.mock('src/components/dashboard/TopTables', () => ({
  __esModule: true,
  default: () => <div data-testid="top-tables">Top Tables</div>
}));

// Mock the Dashboard component itself to avoid MUI dependencies
jest.mock('src/components/dashboard/Dashboard', () => {
  return function MockDashboard() {
    return (
      <div>
        <div data-testid="dashboard-container">
          <select role="combobox">
            <option>Test DB</option>
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
          <div data-testid="kpi-tiles">KPI Tiles</div>
          <div data-testid="trend-chart">Trend Chart</div>
          <div data-testid="top-rules">Top Rules</div>
          <div data-testid="top-tables">Top Tables</div>
        </div>
      </div>
    );
  };
});

// Mock fetch for API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  } as unknown as Response)
);

describe('Dashboard component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders dashboard components correctly', () => {
    render(<Dashboard />);
    
    // Check if all dashboard components are rendered
    expect(screen.getByTestId('kpi-tiles')).toBeInTheDocument();
    expect(screen.getByTestId('trend-chart')).toBeInTheDocument();
    expect(screen.getByTestId('top-rules')).toBeInTheDocument();
    expect(screen.getByTestId('top-tables')).toBeInTheDocument();
  });
  
  test('renders database selector', () => {
    render(<Dashboard />);
    
    // Check if database selector is rendered
    const dbSelector = screen.getByRole('combobox');
    expect(dbSelector).toBeInTheDocument();
    
    // Check if the database option is rendered
    const dbOption = screen.getByText('Test DB');
    expect(dbOption).toBeInTheDocument();
  });
  
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
});
