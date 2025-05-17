import unittest
from unittest.mock import MagicMock, patch
import uuid
from sqlalchemy.orm import Session
from datetime import datetime, date

# Import the modules to test
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import crud, models, schemas

class TestCrudOperations(unittest.TestCase):
    def setUp(self):
        # Create a mock session
        self.db = MagicMock(spec=Session)
        
        # Create sample data
        self.sample_uuid = uuid.uuid4()
        self.sample_connection = models.DBConnection(
            id=self.sample_uuid,
            name="Test DB",
            connection_string="postgresql://user:pass@localhost/testdb"
        )
        
        self.sample_rule = models.ColumnRule(
            id=uuid.uuid4(),
            db_connection_id=self.sample_uuid,
            table_name="users",
            column_name="email",
            rule_name="Email Format Check",
            rule_text="email LIKE '%@%.%'",
            severity="medium",
            interval="daily",
            description="Checks if email format is valid"
        )

    def test_get_db_connections(self):
        # Setup mock return value
        self.db.query.return_value.all.return_value = [self.sample_connection]
        
        # Call the function
        result = crud.get_db_connections(self.db)
        
        # Assertions
        self.db.query.assert_called_once_with(models.DBConnection)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0], self.sample_connection)

    def test_create_db_connection(self):
        # Setup payload
        payload = schemas.DBConnectionCreate(
            name="New DB",
            connection_string="postgresql://user:pass@localhost/newdb"
        )
        
        # Setup mock behavior
        self.db.add = MagicMock()
        self.db.commit = MagicMock()
        self.db.refresh = MagicMock()
        
        # Call the function
        result = crud.create_db_connection(self.db, payload)
        
        # Assertions
        self.db.add.assert_called_once()
        self.db.commit.assert_called_once()
        self.db.refresh.assert_called_once()
        self.assertEqual(result.name, "New DB")
        self.assertEqual(result.connection_string, "postgresql://user:pass@localhost/newdb")

    def test_delete_db_connection_success(self):
        # Setup mock behavior for successful deletion
        self.db.query.return_value.filter.return_value.first.return_value = self.sample_connection
        
        # Call the function
        result = crud.delete_db_connection(self.db, self.sample_uuid)
        
        # Assertions
        self.db.query.assert_called_once_with(models.DBConnection)
        self.db.query.return_value.filter.assert_called_once()
        self.db.delete.assert_called_once_with(self.sample_connection)
        self.db.commit.assert_called_once()
        self.assertTrue(result)

    def test_delete_db_connection_not_found(self):
        # Setup mock behavior for connection not found
        self.db.query.return_value.filter.return_value.first.return_value = None
        
        # Call the function
        result = crud.delete_db_connection(self.db, uuid.uuid4())
        
        # Assertions
        self.db.query.assert_called_once_with(models.DBConnection)
        self.db.query.return_value.filter.assert_called_once()
        self.db.delete.assert_not_called()
        self.db.commit.assert_not_called()
        self.assertFalse(result)

    def test_create_column_rule(self):
        # Setup mock behavior
        self.db.add = MagicMock()
        self.db.commit = MagicMock()
        self.db.refresh = MagicMock()
        
        # Call the function
        result = crud.create_column_rule(
            self.db,
            self.sample_uuid,
            "users",
            "email",
            "Email Format Check",
            "email LIKE '%@%.%'",
            "medium",
            "daily",
            "Checks if email format is valid"
        )
        
        # Assertions
        self.db.add.assert_called_once()
        self.db.commit.assert_called_once()
        self.db.refresh.assert_called_once()
        self.assertEqual(result.table_name, "users")
        self.assertEqual(result.column_name, "email")
        self.assertEqual(result.rule_name, "Email Format Check")
        self.assertEqual(result.rule_text, "email LIKE '%@%.%'")
        self.assertEqual(result.severity, "medium")
        self.assertEqual(result.interval, "daily")
        self.assertEqual(result.description, "Checks if email format is valid")

    def test_update_column_rule_success(self):
        # Setup mock behavior for successful update
        self.db.query.return_value.filter.return_value.first.return_value = self.sample_rule
        
        # Call the function
        result = crud.update_column_rule(
            self.db,
            self.sample_rule.id,
            "Updated Rule Name",
            "updated rule text",
            "Updated description",
            "high"
        )
        
        # Assertions
        self.db.query.assert_called_once_with(models.ColumnRule)
        self.db.query.return_value.filter.assert_called_once()
        self.db.commit.assert_called_once()
        self.db.refresh.assert_called_once()
        self.assertEqual(result.rule_name, "Updated Rule Name")
        self.assertEqual(result.rule_text, "updated rule text")
        self.assertEqual(result.description, "Updated description")
        self.assertEqual(result.severity, "high")

    def test_update_column_rule_not_found(self):
        # Setup mock behavior for rule not found
        self.db.query.return_value.filter.return_value.first.return_value = None
        
        # Call the function
        result = crud.update_column_rule(
            self.db,
            uuid.uuid4(),
            "Updated Rule Name",
            "updated rule text",
            "Updated description",
            "high"
        )
        
        # Assertions
        self.db.query.assert_called_once_with(models.ColumnRule)
        self.db.query.return_value.filter.assert_called_once()
        self.db.commit.assert_not_called()
        self.db.refresh.assert_not_called()
        self.assertIsNone(result)

    def test_get_dashboard_kpis(self):
        # Setup mock behavior
        self.db.query.return_value.join.return_value.filter.return_value.scalar.side_effect = [0, 10, 10, 10]
        
        # Call the function
        result = crud.get_dashboard_kpis(self.db, self.sample_uuid)
        
        # Assertions
        self.assertEqual(result["total_violations"], 0)
        self.assertEqual(result["critical_violations"], 10)
        self.assertEqual(result["affected_tables"], 10)
        self.assertEqual(result["compliance_rate"], 1.0)

    def test_get_dashboard_kpis_with_date_range(self):
        # Setup mock behavior
        self.db.query.return_value.join.return_value.filter.return_value.filter.return_value.filter.return_value.scalar.side_effect = [0, 5, 5, 5]
        
        # Call the function with date range
        date_from = date(2023, 1, 1)
        date_to = date(2023, 12, 31)
        result = crud.get_dashboard_kpis(self.db, self.sample_uuid, date_from, date_to)
        
        # Assertions
        self.assertEqual(result["total_violations"], 0)
        self.assertEqual(result["critical_violations"], 5)
        self.assertEqual(result["affected_tables"], 5)
        self.assertEqual(result["compliance_rate"], 1.0)

    def test_get_dashboard_trends(self):
        # Setup mock data
        mock_row = MagicMock()
        mock_row.date = datetime(2023, 1, 1)
        mock_row.rule_name = "Test Rule"
        mock_row.count = 5
        
        # Setup mock behavior
        self.db.query.return_value.join.return_value.filter.return_value.group_by.return_value.order_by.return_value.all.return_value = [mock_row]
        
        # Call the function
        result = crud.get_dashboard_trends(self.db, self.sample_uuid)
        
        # Assertions
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["date"], "2023-01-01T00:00:00")
        self.assertEqual(result[0]["rule_name"], "Test Rule")
        self.assertEqual(result[0]["count"], 5)

    def test_get_dashboard_top_violations(self):
        # Setup mock data for top rules
        mock_rule = MagicMock()
        mock_rule.rule_name = "Test Rule"
        mock_rule.count = 10
        
        # Setup mock data for top tables
        mock_table = MagicMock()
        mock_table.table_name = "Test Table"
        mock_table.count = 8
        
        # Setup mock behavior
        self.db.query.return_value.join.return_value.filter.return_value.group_by.return_value.order_by.return_value.limit.return_value.all.side_effect = [[mock_rule], [mock_table]]
        
        # Call the function
        result = crud.get_dashboard_top_violations(self.db, self.sample_uuid)
        
        # Assertions
        self.assertEqual(len(result["top_rules"]), 1)
        self.assertEqual(result["top_rules"][0]["rule_name"], "Test Rule")
        self.assertEqual(result["top_rules"][0]["count"], 10)
        
        self.assertEqual(len(result["top_tables"]), 1)
        self.assertEqual(result["top_tables"][0]["table_name"], "Test Table")
        self.assertEqual(result["top_tables"][0]["count"], 8)

if __name__ == '__main__':
    unittest.main()
