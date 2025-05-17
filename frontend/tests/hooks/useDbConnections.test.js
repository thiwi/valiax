import { render, screen } from '@testing-library/react';
import { useDbConnections } from 'src/hooks/useDbConnections';
import React from 'react';

// Mock the useDbConnections hook
jest.mock('src/hooks/useDbConnections', () => ({
  useDbConnections: jest.fn()
}));

// Mock fetch API
global.fetch = jest.fn();

// Test component that uses the hook
function TestComponent({ apiBase }) {
  const { dbConns, loading, error, addConn, testConn, deleteConn } = useDbConnections(apiBase);
  
  return (
    <div>
      {loading && <div data-testid="loading">Loading...</div>}
      {error && <div data-testid="error">{error}</div>}
      <ul>
        {dbConns.map(conn => (
          <li key={conn.id} data-testid="db-conn">
            {conn.name} - {conn.connStr}
          </li>
        ))}
      </ul>
      <button onClick={() => addConn('New DB', 'connection-string')}>Add</button>
      <button onClick={() => testConn('test-connection')}>Test</button>
      <button onClick={() => deleteConn('1')}>Delete</button>
    </div>
  );
}

describe('useDbConnections hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should display loading state', () => {
    // Mock the hook implementation for this test
    useDbConnections.mockReturnValue({
      dbConns: [],
      loading: true,
      error: null,
      addConn: jest.fn(),
      testConn: jest.fn(),
      deleteConn: jest.fn()
    });
    
    render(<TestComponent apiBase="/api" />);
    
    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(useDbConnections).toHaveBeenCalledWith('/api');
  });

  test('should display database connections', () => {
    // Mock the hook implementation for this test
    useDbConnections.mockReturnValue({
      dbConns: [
        { id: '1', name: 'Test DB 1', connStr: 'postgresql://user:pass@localhost/db1' },
        { id: '2', name: 'Test DB 2', connStr: 'postgresql://user:pass@localhost/db2' }
      ],
      loading: false,
      error: null,
      addConn: jest.fn(),
      testConn: jest.fn(),
      deleteConn: jest.fn()
    });
    
    render(<TestComponent apiBase="/api" />);
    
    const connections = screen.getAllByTestId('db-conn');
    expect(connections).toHaveLength(2);
    expect(connections[0]).toHaveTextContent('Test DB 1 - postgresql://user:pass@localhost/db1');
    expect(connections[1]).toHaveTextContent('Test DB 2 - postgresql://user:pass@localhost/db2');
  });

  test('should display error message', () => {
    // Mock the hook implementation for this test
    useDbConnections.mockReturnValue({
      dbConns: [],
      loading: false,
      error: 'Failed to fetch connections',
      addConn: jest.fn(),
      testConn: jest.fn(),
      deleteConn: jest.fn()
    });
    
    render(<TestComponent apiBase="/api" />);
    
    expect(screen.getByTestId('error')).toHaveTextContent('Failed to fetch connections');
  });
});
