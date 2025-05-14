import React from 'react'
import { Modal, Alert } from 'react-bootstrap'
import { Button } from '@mui/material';
import { DBConn } from '../../types';
import { useStore } from '../../store/store';
import theme from '../../theme';

/**
 * DatabaseConnectionDetailModal component displays detailed information about a database connection.
 * It provides options to select or delete the connection, as well as to close the modal.
 * This component is controlled by props to manage its visibility, connection data, and actions.
 */
export interface ConnectionDetailModalProps {
  /**
   * Controls whether the modal is visible or hidden.
   */
  show: boolean
  /**
   * The database connection object to display details for.
   * If null, no connection is selected.
   */
  conn: DBConn | null
  /**
   * Callback function to hide the modal.
   */
  onHide: () => void
  /**
   * Callback function triggered when a connection is selected.
   * Receives the selected connection's ID.
   */
  onSelect: (id: string) => void
  /**
   * Callback function to delete a connection.
   * Receives the connection's ID and returns a Promise.
   */
  onDelete: (id: string) => Promise<void>
  /**
   * Boolean indicating if a delete operation is currently in progress.
   * Used to disable the delete button and show loading state.
   */
  deleting: boolean
  /**
   * Error message string to display if deletion fails.
   * Null if there is no error.
   */
  deleteError: string | null
}

const ConnectionDetailModal: React.FC<ConnectionDetailModalProps> = ({
  show,
  conn,
  onHide,
  onSelect,
  onDelete,
  deleting,
  deleteError,
}) => (
  // Modal component from react-bootstrap that displays connection details.
  // The backdrop is static to prevent closing the modal by clicking outside.
  // A high z-index ensures the modal appears above other UI elements.
  <Modal
    show={show}
    onHide={onHide}
    backdrop="static"
    style={{ zIndex: 2000 }}
  >
    <Modal.Header closeButton>
      <Modal.Title>Connection Details</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      {conn ? (
        // If a connection is selected, display its ID, name, and connection string.
        <>
          <p><strong>ID:</strong> {conn.id}</p>
          <p><strong>Name:</strong> {conn.name}</p>
          <p><strong>Connection String:</strong> {conn.connStr}</p>
        </>
      ) : (
        // If no connection is selected, inform the user accordingly.
        <p>No connection selected.</p>
      )}
      {/* Display an error alert if there was an error during deletion */}
      {deleteError && <Alert variant="danger">{deleteError}</Alert>}
    </Modal.Body>
    <Modal.Footer>
      {/* Close button to dismiss the modal without any action.
          Styled with grey colors from the theme for a neutral appearance. */}
      <Button
        variant="contained"
        onClick={onHide}
        sx={{
          backgroundColor: theme.palette.greyButton.main,
          color: theme.palette.greyButton.contrastText,
          mr: 1,
        }}
      >
        Close
      </Button>
      {conn && (
        <>
          {/* Select button allows the user to select the displayed connection.
              It triggers state updates and callbacks, then closes the modal.
              Styled with the primary color from the theme to indicate a positive action. */}
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              useStore.getState().selectDatabase(conn.id);
              onSelect(conn.id);
              onHide();
            }}
            sx={{
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              mr: 1,
            }}
          >
            Select
          </Button>
          {/* Delete button initiates deletion of the connection.
              Disabled while deletion is in progress to prevent duplicate requests.
              Shows 'Deleting...' text during the operation.
              Styled with the error color from the theme to indicate a destructive action. */}
          <Button
            variant="contained"
            color="error"
            onClick={() => onDelete(conn.id)}
            disabled={deleting}
            sx={{
              backgroundColor: theme.palette.error.main,
              color: theme.palette.error.contrastText,
            }}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </>
      )}
    </Modal.Footer>
  </Modal>
)

export default ConnectionDetailModal
