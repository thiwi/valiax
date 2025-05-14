// frontend/src/hooks/useDbConnections.ts
import { useState, useEffect, useCallback } from 'react';
import { DBConn } from '../types';
import { useStore } from '../store/store';

/**
 * Custom React hook to manage database connections.
 * 
 * This hook provides components with the current list of database connections,
 * loading and error states, and functions to add, test, and delete connections.
 * It handles fetching the initial connections from the API and keeps both local
 * state and a global store in sync.
 */
export interface UseDbConnectionsResult {
  dbConns: DBConn[];
  loading: boolean;
  error: string | null;
  addConn: (name: string, connStr: string) => Promise<DBConn | null>;
  testConn: (connStr: string) => Promise<string>;
  deleteConn: (id: string) => Promise<boolean>;
}

export function useDbConnections(apiBase: string): UseDbConnectionsResult {
  // State to hold the list of database connections
  const [dbConns, setDbConns] = useState<DBConn[]>([]);
  // State to track whether the initial data is still loading
  const [loading, setLoading] = useState(true);
  // State to capture any error messages during API calls
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch the list of database connections from the API endpoint
    fetch(`${apiBase}/api/db-connections`)
      .then(res => {
        if (!res.ok) {
          // Throw an error if the response is not successful
          throw new Error(`Fetch error: ${res.status}`);
        }
        // Parse the JSON response with expected structure
        return res.json() as Promise<Array<{ id: string; name: string; connection_string: string }>>;
      })
      .then(data => {
        // Transform the API response into the DBConn type expected by the app
        const conns: DBConn[] = data.map(d => ({
          id:      d.id,
          name:    d.name,
          connStr: d.connection_string,
        }));
        // Update the local state with the fetched connections
        setDbConns(conns);
        // Also update the global store so other parts of the app can access the connections
        useStore.getState().setDatabases(conns);
      })
      .catch(e => 
        // Capture and set any error messages encountered during fetch
        setError((e as Error).message)
      )
      .finally(() => 
        // Mark loading as finished regardless of success or failure
        setLoading(false)
      );
  }, [apiBase]);

  /**
   * Adds a new database connection by sending a POST request to the API.
   * On success, updates local state with the newly created connection.
   */
  const addConn = useCallback(async (name: string, connStr: string) => {
    // Send POST request with connection details to create a new DB connection
    const res = await fetch(`${apiBase}/api/db-connections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, connection_string: connStr }),
    });
    if (!res.ok) throw new Error('Failed to create');
    // Parse the newly created connection from the response
    const raw = await res.json() as { id: string; name: string; connection_string: string };
    const created: DBConn = { id: raw.id, name: raw.name, connStr: raw.connection_string };
    // Append the new connection to the existing list in local state
    setDbConns(cs => [...cs, created]);
    return created;
  }, [apiBase]);

  /**
   * Tests a database connection string by sending it to the API.
   * Returns a success or failure message based on the API response.
   */
  const testConn = useCallback(async (connStr: string) => {
    // Send POST request to test the provided connection string
    const res = await fetch(`${apiBase}/api/test-connection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connection_string: connStr }),
    });
    // Parse the response body, expecting a detail message or fallback status message
    const body = await res.json();
    return body.detail || (res.ok ? 'Test erfolgreich' : 'Test fehlgeschlagen');
  }, [apiBase]);

  /**
   * Deletes a database connection by ID via a DELETE request to the API.
   * On success, removes the connection from local state.
   */
  const deleteConn = useCallback(async (id: string) => {
    // Send DELETE request to remove the specified connection
    const res = await fetch(`${apiBase}/api/db-connections/${id}`, { method: 'DELETE' });
    if (!res.ok) return false;
    // Remove the deleted connection from local state
    setDbConns(cs => cs.filter(c => c.id !== id));
    return true;
  }, [apiBase]);

  return { dbConns, loading, error, addConn, testConn, deleteConn };
}