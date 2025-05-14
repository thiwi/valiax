/**
 * Custom React hook `useUI` for managing the visibility state of various UI panels.
 * 
 * This hook centralizes the control of multiple UI components' visibility, such as navigation menus,
 * database creation dialogs, database menus, and detail panels. It provides a clean interface 
 * to show, hide, or toggle these UI sections, enabling consistent state management across components.
 */

import { useReducer } from 'react';

/**
 * Interface representing the visibility state of UI panels.
 * Each boolean field corresponds to whether a specific UI section is visible (true) or hidden (false).
 */
interface UIState {
  /** Controls visibility of the main navigation panel */
  nav: boolean;
  /** Controls visibility of the 'new database' creation dialog */
  newDb: boolean;
  /** Controls visibility of the database menu panel */
  dbMenu: boolean;
  /** Controls visibility of the detail information panel */
  detail: boolean;
}

/**
 * Union type representing all possible actions to modify the UI visibility state.
 * Each action corresponds to showing, hiding, or toggling a particular UI panel.
 */
type Action =
  | { type: 'SHOW_NAV' }     // Show the navigation panel
  | { type: 'HIDE_NAV' }     // Hide the navigation panel
  | { type: 'TOGGLE_NAV' }   // Toggle the navigation panel visibility

  | { type: 'SHOW_NEWDB' }   // Show the new database creation dialog
  | { type: 'HIDE_NEWDB' }   // Hide the new database creation dialog
  | { type: 'TOGGLE_NEWDB' } // Toggle the new database creation dialog visibility

  | { type: 'SHOW_DB_MENU' }   // Show the database menu panel
  | { type: 'HIDE_DB_MENU' }   // Hide the database menu panel
  | { type: 'TOGGLE_DB_MENU' } // Toggle the database menu panel visibility

  | { type: 'SHOW_DETAIL' }    // Show the detail information panel
  | { type: 'HIDE_DETAIL' }    // Hide the detail information panel
  | { type: 'TOGGLE_DETAIL' }; // Toggle the detail information panel visibility

/**
 * Initial state for the UI visibility.
 * All UI panels are hidden by default.
 */
const initialState: UIState = {
  nav: false,      // Navigation panel is initially hidden
  newDb: false,    // New database creation dialog is initially hidden
  dbMenu: false,   // Database menu panel is initially hidden
  detail: false,   // Detail information panel is initially hidden
};

/**
 * Reducer function to update UI visibility state based on dispatched actions.
 * Handles showing, hiding, and toggling each individual UI panel.
 * 
 * @param state - Current UIState object
 * @param action - Action describing the update to perform
 * @returns Updated UIState object
 */
function uiReducer(state: UIState, action: Action): UIState {
  switch (action.type) {
    case 'SHOW_NAV':      
      // Show the navigation panel
      return { ...state, nav: true };
    case 'HIDE_NAV':      
      // Hide the navigation panel
      return { ...state, nav: false };
    case 'TOGGLE_NAV':    
      // Toggle the navigation panel visibility
      return { ...state, nav: !state.nav };

    case 'SHOW_NEWDB':    
      // Show the new database creation dialog
      return { ...state, newDb: true };
    case 'HIDE_NEWDB':    
      // Hide the new database creation dialog
      return { ...state, newDb: false };
    case 'TOGGLE_NEWDB':  
      // Toggle the new database creation dialog visibility
      return { ...state, newDb: !state.newDb };

    case 'SHOW_DB_MENU':  
      // Show the database menu panel
      return { ...state, dbMenu: true };
    case 'HIDE_DB_MENU':  
      // Hide the database menu panel
      return { ...state, dbMenu: false };
    case 'TOGGLE_DB_MENU':
      // Toggle the database menu panel visibility
      return { ...state, dbMenu: !state.dbMenu };

    case 'SHOW_DETAIL':   
      // Show the detail information panel
      return { ...state, detail: true };
    case 'HIDE_DETAIL':   
      // Hide the detail information panel
      return { ...state, detail: false };
    case 'TOGGLE_DETAIL': 
      // Toggle the detail information panel visibility
      return { ...state, detail: !state.detail };

    default:
      // Return current state if action type is unrecognized
      return state;
  }
}

/**
 * Custom hook to manage visibility of several UI panels.
 * 
 * Returns an object containing the current UI visibility state (`ui`) and a set of functions to
 * show, hide, or toggle each panel individually.
 * 
 * Usage pattern in components:
 * ```
 * const { ui, showNav, hideNav, toggleNav, ... } = useUI();
 * 
 * // Access visibility state
 * if (ui.nav) {
 *   // Navigation panel is visible
 * }
 * 
 * // Show navigation panel
 * showNav();
 * 
 * // Hide navigation panel
 * hideNav();
 * 
 * // Toggle navigation panel visibility
 * toggleNav();
 * ```
 * 
 * This design promotes clear and centralized control of UI panel visibility.
 */
export function useUI() {
  const [state, dispatch] = useReducer(uiReducer, initialState);

  return {
    ui: state,

    /** Show the navigation panel */
    showNav:      () => dispatch({ type: 'SHOW_NAV' }),
    /** Hide the navigation panel */
    hideNav:      () => dispatch({ type: 'HIDE_NAV' }),
    /** Toggle the navigation panel visibility */
    toggleNav:    () => dispatch({ type: 'TOGGLE_NAV' }),

    /** Show the new database creation dialog */
    showNewDb:    () => dispatch({ type: 'SHOW_NEWDB' }),
    /** Hide the new database creation dialog */
    hideNewDb:    () => dispatch({ type: 'HIDE_NEWDB' }),
    /** Toggle the new database creation dialog visibility */
    toggleNewDb:  () => dispatch({ type: 'TOGGLE_NEWDB' }),

    /** Show the database menu panel */
    showDbMenu:   () => dispatch({ type: 'SHOW_DB_MENU' }),
    /** Hide the database menu panel */
    hideDbMenu:   () => dispatch({ type: 'HIDE_DB_MENU' }),
    /** Toggle the database menu panel visibility */
    toggleDbMenu: () => dispatch({ type: 'TOGGLE_DB_MENU' }),

    /** Show the detail information panel */
    showDetail:   () => dispatch({ type: 'SHOW_DETAIL' }),
    /** Hide the detail information panel */
    hideDetail:   () => dispatch({ type: 'HIDE_DETAIL' }),
    /** Toggle the detail information panel visibility */
    toggleDetail: () => dispatch({ type: 'TOGGLE_DETAIL' }),
  };
}