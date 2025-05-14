/**
 * This file contains shared TypeScript interfaces used throughout the frontend application
 * to enforce type safety and provide consistent data structures. These interfaces model
 * various domain entities such as database connections, data validation rules, violations,
 * and dashboard metrics, as well as chat messages. They facilitate clear communication
 * between components and with backend APIs.
 */

/**
 * Represents a database connection configuration.
 * Used wherever database connection information is required,
 * such as connection management UI or API calls.
 */
export interface DBConn {
  /** 
   * The UUID string ID uniquely identifying the connection in the database.
   * Used as a primary key to reference this connection.
   */
  id: string;
  /**
   * The human-readable name of the connection.
   * Displayed in UI lists and selection dropdowns.
   */
  name: string;
  /**
   * The full connection string used to connect to the database,
   * e.g., "postgres://user:password@host:port/dbname".
   * Used internally for establishing connections.
   */
  connStr: string;
}

/**
 * Models a validation rule applied to a specific column in a database table.
 * Used in rule management interfaces and validation logic.
 */
export interface ColumnRule {
  /**
   * Unique identifier of the rule (UUID string).
   * Used to reference and manage this rule.
   */
  id: string;
  /**
   * The ID of the database connection this rule applies to.
   * Links the rule to a specific database.
   */
  db_connection_id: string;
  /**
   * The name of the table the rule applies to.
   * Specifies the scope of the rule within the database.
   */
  table_name: string;
  /**
   * The name of the column the rule validates.
   * Defines the exact data field subject to the rule.
   */
  column_name: string;
  /**
   * The name or identifier of the rule.
   * Used for display and referencing the rule logic.
   */
  rule_name: string;
  /**
   * The textual representation or expression of the rule.
   * Defines the validation criteria or condition.
   */
  rule_text: string;
  /**
   * The severity level of the rule (e.g., "critical", "warning").
   * Indicates the importance of violations detected by this rule.
   */
  severity: string;
  /**
   * The interval at which this rule should be evaluated (e.g., "daily").
   * Controls the frequency of rule enforcement.
   */
  interval: string;
  /**
   * Optional additional description providing context or details
   * about the rule’s purpose or behavior.
   */
  description?: string;
}

/**
 * Represents a detected violation of a validation rule on a database table.
 * Used in violation reporting and monitoring dashboards.
 */
export interface Violation {
  /**
   * Unique identifier of the violation (UUID string).
   * Used to reference this specific violation instance.
   */
  id: string;
  /**
   * The name of the table where the violation was detected.
   * Helps locate the source of the data issue.
   */
  table_name: string;
  /**
   * The name of the rule that was violated.
   * Identifies the validation criteria that failed.
   */
  rule_name: string;
  /**
   * The ISO 8601 formatted timestamp string when the violation was detected.
   * Used for sorting and filtering violation timelines.
   */
  detected_at: string;
  /**
   * The severity level of the violation (e.g., "critical", "warning").
   * Indicates how serious the violation is.
   */
  severity: string;
  /**
   * Optional value from the data that caused the violation.
   * Provides insight into the offending data.
   */
  offending_value?: string;
  /**
   * Optional status of the violation (e.g., "resolved", "pending").
   * Used to track violation lifecycle and remediation progress.
   */
  status?: string;
}

/**
 * Contains key performance indicators (KPIs) for the compliance dashboard.
 * Summarizes overall data quality metrics.
 */
export interface DashboardKPI {
  /**
   * Total number of violations detected across all monitored data.
   */
  total_violations: number;
  /**
   * Number of violations classified as critical severity.
   */
  critical_violations: number;
  /**
   * Count of unique tables affected by violations.
   */
  affected_tables: number;
  /**
   * Compliance rate expressed as a percentage (0-100).
   * Represents the proportion of data passing validation.
   */
  compliance_rate: number;
}

/**
 * Represents a single data point in a time series trend chart on the dashboard.
 * Used to visualize changes in violation counts over time.
 */
export interface DashboardTrendItem {
  /**
   * The date of the data point, formatted as an ISO 8601 string (e.g., "2023-04-01").
   */
  date: string;
  /**
   * The count of violations or relevant metric on this date.
   */
  count: number;
}

/**
 * Aggregated data for the top violations and affected tables.
 * Used to highlight the most significant issues on the dashboard.
 */
export interface DashboardTopViolations {
  /**
   * Array of top violated rules, each with the rule name and count of violations.
   */
  top_rules: { 
    /** The name of the violated rule. */
    rule_name: string; 
    /** Number of times this rule was violated. */
    count: number; 
  }[];
  /**
   * Array of top affected tables, each with the table name and count of violations.
   */
  top_tables: { 
    /** The name of the table with violations. */
    table_name: string; 
    /** Number of violations detected in this table. */
    count: number; 
  }[];
}

/**
 * Represents a detailed trend item including rule-specific counts.
 * Extends basic trend data with rule name for filtering or grouping.
 */
export interface DashboardTrendItem {
  /**
   * The date of the data point, formatted as an ISO 8601 string.
   */
  date: string;
  /**
   * The count of violations or relevant metric on this date.
   */
  count: number;
  /**
   * The name of the rule associated with this trend data point.
   */
  rule_name: string;
}

/**
 * Models a chat message exchanged in the ChatWidget component.
 * Used to display user and bot messages in the chat interface.
 */
export interface Message {
  /**
   * Indicates the sender of the message.
   * Can be 'user' for messages from the user,
   * or 'bot' for messages generated by the system.
   */
  from: 'user' | 'bot';
  /**
   * The textual content of the message.
   */
  text: string;
  /**
   * Optional ISO 8601 timestamp string indicating when the message was sent.
   * Used to display message times or order messages chronologically.
   */
  timestamp?: string;
}