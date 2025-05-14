// This custom React hook, `useTables`, is designed to fetch and manage the list of table names 
// from a selected database. It takes the base API URL and the ID of the selected database as inputs, 
// and returns the current list of tables, a loading state, and any error encountered during fetching. 
// This hook is intended to be used in components that need to display or interact with database tables 
// dynamically based on user selection.

import { useState, useEffect } from 'react';

export function useTables(apiBase: string, selectedDbId: string | null) {
  // State to hold the array of table names fetched from the server
  const [tables, setTables] = useState<string[]>([]);
  // State to indicate whether the fetch request is currently in progress
  const [loading, setLoading] = useState(false);
  // State to hold any error message encountered during the fetch operation
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // This effect runs whenever `apiBase` or `selectedDbId` changes.
    // It is responsible for fetching the list of tables for the selected database.

    // If no database is selected (selectedDbId is null), reset states to initial values.
    if (selectedDbId === null) {
      setTables([]);
      setError(null);
      setLoading(false);
      return;
    }

    // Create an AbortController to allow cancellation of the fetch request if the component unmounts
    // or if selectedDbId changes before the fetch completes.
    const abort = new AbortController();
    setLoading(true); // Indicate that loading has started
    setError(null);   // Clear any previous errors

    // Fetch the list of tables from the API endpoint corresponding to the selected database
    fetch(`${apiBase}/api/db-connections/${selectedDbId}/tables`, {
      signal: abort.signal, // Attach the abort signal to enable cancellation
    })
      .then(res => {
        // Check if the response is successful (status in the range 200-299)
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        // Parse the response JSON as an array of strings (table names)
        return res.json() as Promise<string[]>;
      })
      .then(data => {
        // Update the tables state with the fetched data
        setTables(data);
      })
      .catch(err => {
        // If the fetch was aborted, do not update error state
        if (err.name !== 'AbortError') {
          // For other errors, update the error state with the error message
          setError(err.message);
        }
      })
      .finally(() => {
        // Loading is finished regardless of success or failure
        setLoading(false);
      });

    // Cleanup function to abort the fetch request if the effect is re-run or component unmounts
    return () => {
      abort.abort();
    };
  }, [apiBase, selectedDbId]);

  // Return an object containing:
  // - tables: the current list of table names
  // - loading: boolean indicating if the fetch is in progress
  // - error: any error message encountered during fetching
  return { tables, loading, error };
}