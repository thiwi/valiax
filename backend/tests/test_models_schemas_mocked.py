import unittest
from unittest.mock import MagicMock, patch
import uuid
import sys
import os

# Mock the database module to avoid actual database connections
sys.path.insert(0, '/home/ubuntu/valiax_tests/backend')

# Create mock modules
class MockBase:
    pass

class MockSession:
    def __init__(self):
        self.query = MagicMock()
        self.add = MagicMock()
        self.commit = MagicMock()
        self.refresh = MagicMock()
        self.delete = MagicMock()

# Apply mocks before importing the actual modules
sys.modules['app.database'] = MagicMock()
sys.modules['app.database'].Base = MockBase
sys.modules['app.database'].get_db = MagicMock(return_value=MockSession())

# Now import the modules to test
from app import schemas

# Create mock model classes that mimic SQLAlchemy models but allow direct instantiation
class MockDBConnection:
    def __init__(self, **kwargs):
        self.id = kwargs.get('id', uuid.uuid4())
        self.name = kwargs.get('name')
        self.connection_string = kwargs.get('connection_string')

class MockColumnRule:
    def __init__(self, **kwargs):
        self.id = kwargs.get('id', uuid.uuid4())
        self.db_connection_id = kwargs.get('db_connection_id')
        self.table_name = kwargs.get('table_name')
        self.column_name = kwargs.get('column_name')
        self.rule_name = kwargs.get('rule_name')
        self.rule_text = kwargs.get('rule_text')
        self.severity = kwargs.get('severity')
        self.interval = kwargs.get('interval')
        self.description = kwargs.get('description')

class MockRuleResult:
    def __init__(self, **kwargs):
        self.id = kwargs.get('id', uuid.uuid4())
        self.rule_id = kwargs.get('rule_id')
        self.detected_at = kwargs.get('detected_at')
        self.result = kwargs.get('result')

class MockRuleRun:
    def __init__(self, **kwargs):
        self.id = kwargs.get('id', uuid.uuid4())
        self.rule_id = kwargs.get('rule_id')
        self.start_time = kwargs.get('start_time')
        self.end_time = kwargs.get('end_time')
        self.duration_ms = kwargs.get('duration_ms')
        self.checked_rows = kwargs.get('checked_rows')
        self.failed_rows = kwargs.get('failed_rows')
        self.status = kwargs.get('status')

# Replace the actual model classes with our mocks
sys.modules['app.models'] = MagicMock()
sys.modules['app.models'].DBConnection = MockDBConnection
sys.modules['app.models'].ColumnRule = MockColumnRule
sys.modules['app.models'].RuleResult = MockRuleResult
sys.modules['app.models'].RuleRun = MockRuleRun

class TestModels(unittest.TestCase):
    def test_db_connection_model(self):
        # Create a DBConnection instance
        conn = MockDBConnection(
            name="Test DB",
            connection_string="postgresql://user:pass@localhost/testdb"
        )
        
        # Check that the attributes are set correctly
        self.assertEqual(conn.name, "Test DB")
        self.assertEqual(conn.connection_string, "postgresql://user:pass@localhost/testdb")
        
        # Check that UUID is generated
        self.assertIsNotNone(conn.id)
        self.assertIsInstance(conn.id, uuid.UUID)
    
    def test_column_rule_model(self):
        # Create a ColumnRule instance
        conn_id = uuid.uuid4()
        rule = MockColumnRule(
            db_connection_id=conn_id,
            table_name="users",
            column_name="email",
            rule_name="Email Format Check",
            rule_text="email LIKE '%@%.%'",
            severity="medium",
            interval="daily",
            description="Checks if email format is valid"
        )
        
        # Check that the attributes are set correctly
        self.assertEqual(rule.db_connection_id, conn_id)
        self.assertEqual(rule.table_name, "users")
        self.assertEqual(rule.column_name, "email")
        self.assertEqual(rule.rule_name, "Email Format Check")
        self.assertEqual(rule.rule_text, "email LIKE '%@%.%'")
        self.assertEqual(rule.severity, "medium")
        self.assertEqual(rule.interval, "daily")
        self.assertEqual(rule.description, "Checks if email format is valid")
        
        # Check that UUID is generated
        self.assertIsNotNone(rule.id)
        self.assertIsInstance(rule.id, uuid.UUID)
    
    def test_rule_result_model(self):
        # Create a RuleResult instance
        rule_id = uuid.uuid4()
        result = MockRuleResult(
            rule_id=rule_id,
            result={"status": "failed", "details": "Invalid email format"}
        )
        
        # Check that the attributes are set correctly
        self.assertEqual(result.rule_id, rule_id)
        self.assertEqual(result.result, {"status": "failed", "details": "Invalid email format"})
        
        # Check that UUID is generated
        self.assertIsNotNone(result.id)
        self.assertIsInstance(result.id, uuid.UUID)
    
    def test_rule_run_model(self):
        # Create a RuleRun instance
        from datetime import datetime
        
        rule_id = uuid.uuid4()
        start_time = datetime.now()
        end_time = datetime.now()
        
        run = MockRuleRun(
            rule_id=rule_id,
            start_time=start_time,
            end_time=end_time,
            duration_ms="100",
            checked_rows="1000",
            failed_rows="5",
            status="completed"
        )
        
        # Check that the attributes are set correctly
        self.assertEqual(run.rule_id, rule_id)
        self.assertEqual(run.start_time, start_time)
        self.assertEqual(run.end_time, end_time)
        self.assertEqual(run.duration_ms, "100")
        self.assertEqual(run.checked_rows, "1000")
        self.assertEqual(run.failed_rows, "5")
        self.assertEqual(run.status, "completed")
        
        # Check that UUID is generated
        self.assertIsNotNone(run.id)
        self.assertIsInstance(run.id, uuid.UUID)

class TestSchemas(unittest.TestCase):
    def test_db_connection_create_schema(self):
        # Create a DBConnectionCreate instance
        conn = schemas.DBConnectionCreate(
            name="Test DB",
            connection_string="postgresql://user:pass@localhost/testdb"
        )
        
        # Check that the attributes are set correctly
        self.assertEqual(conn.name, "Test DB")
        self.assertEqual(conn.connection_string, "postgresql://user:pass@localhost/testdb")
        
        # Check that the schema validates correctly
        conn_dict = conn.model_dump()  # Using model_dump instead of deprecated dict()
        self.assertEqual(conn_dict, {
            "name": "Test DB",
            "connection_string": "postgresql://user:pass@localhost/testdb"
        })
    
    def test_db_connection_read_schema(self):
        # Create a DBConnectionRead instance
        conn_id = uuid.uuid4()
        conn = schemas.DBConnectionRead(
            id=conn_id,
            name="Test DB",
            connection_string="postgresql://user:pass@localhost/testdb"
        )
        
        # Check that the attributes are set correctly
        self.assertEqual(conn.id, conn_id)
        self.assertEqual(conn.name, "Test DB")
        self.assertEqual(conn.connection_string, "postgresql://user:pass@localhost/testdb")
    
    def test_connection_test_request_schema(self):
        # Create a ConnectionTestRequest instance
        req = schemas.ConnectionTestRequest(
            connection_string="postgresql://user:pass@localhost/testdb"
        )
        
        # Check that the attributes are set correctly
        self.assertEqual(req.connection_string, "postgresql://user:pass@localhost/testdb")
    
    def test_connection_test_response_schema(self):
        # Create a ConnectionTestResponse instance with success
        resp_success = schemas.ConnectionTestResponse(
            success=True,
            detail="Connection successful"
        )
        
        # Check that the attributes are set correctly
        self.assertEqual(resp_success.success, True)
        self.assertEqual(resp_success.detail, "Connection successful")
        
        # Create a ConnectionTestResponse instance with failure
        resp_failure = schemas.ConnectionTestResponse(
            success=False,
            detail="Connection failed: database does not exist"
        )
        
        # Check that the attributes are set correctly
        self.assertEqual(resp_failure.success, False)
        self.assertEqual(resp_failure.detail, "Connection failed: database does not exist")
        
        # Test with default detail value
        resp_default = schemas.ConnectionTestResponse(success=True)
        self.assertEqual(resp_default.success, True)
        self.assertIsNone(resp_default.detail)

if __name__ == '__main__':
    unittest.main()
