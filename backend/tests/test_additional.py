"""Additional unit tests for the Valiax backend."""

import importlib
import sys
from unittest.mock import MagicMock
import runpy
import uuid
import types

import pytest

# We will test database module initialization and generator

def test_database_wait_for_postgres(monkeypatch):
    # Prepare mock engine with connect behavior
    connect_calls = []
    mock_conn = MagicMock()
    mock_conn.__enter__.return_value = mock_conn
    mock_conn.__exit__.return_value = None
    def connect():
        connect_calls.append(True)
        if len(connect_calls) == 1:
            from sqlalchemy.exc import OperationalError
            raise OperationalError('x','y','z')
        return mock_conn
    mock_engine = MagicMock(connect=MagicMock(side_effect=connect))

    monkeypatch.setattr('sqlalchemy.create_engine', lambda *a, **k: mock_engine)
    monkeypatch.setattr('sqlalchemy.ext.declarative.declarative_base', lambda: MagicMock(metadata=MagicMock(create_all=MagicMock())))
    monkeypatch.setattr('time.sleep', lambda s: None)

    sys.modules.pop('app.database', None)
    db = importlib.import_module('app.database')

    assert len(connect_calls) == 2
    # Test get_db generator
    session = MagicMock()
    db.SessionLocal = MagicMock(return_value=session)
    gen = db.get_db()
    assert next(gen) is session
    with pytest.raises(StopIteration):
        next(gen)
    session.close.assert_called_once()


def test_get_dashboard_kpis_zero(monkeypatch):
    from app import crud
    db = MagicMock()
    db.query.return_value.join.return_value.filter.return_value.scalar.side_effect = [5, 2, 1, 0]
    result = crud.get_dashboard_kpis(db, uuid.uuid4())
    assert result['total_violations'] == 5
    assert result['critical_violations'] == 2
    assert result['affected_tables'] == 1
    assert result['compliance_rate'] == 1.0


def test_get_dashboard_trends_with_range():
    from app import crud
    from datetime import date
    db = MagicMock()
    mock_row = MagicMock(date=types.SimpleNamespace(isoformat=lambda: 'd'), rule_name='R', count=1)
    db.query.return_value.join.return_value.filter.return_value.filter.return_value.filter.return_value.group_by.return_value.order_by.return_value.all.return_value = [mock_row]
    res = crud.get_dashboard_trends(db, uuid.uuid4(), date_from=date.today(), date_to=date.today())
    assert res == [{'date': 'd', 'rule_name': 'R', 'count': 1}]


def test_get_dashboard_top_violations_with_range():
    from app import crud
    from datetime import date
    db = MagicMock()
    mock_rule = MagicMock(rule_name='R', count=2)
    mock_table = MagicMock(table_name='T', count=3)
    # chain for top_rules
    db.query.return_value.join.return_value.filter.return_value.filter.return_value.filter.return_value.group_by.return_value.order_by.return_value.limit.return_value.all.side_effect = [[mock_rule], [mock_table]]
    res = crud.get_dashboard_top_violations(db, uuid.uuid4(), date_from=date.today(), date_to=date.today())
    assert res['top_rules'][0]['rule_name'] == 'R'
    assert res['top_tables'][0]['table_name'] == 'T'


def test_runfile_executes_main(monkeypatch):
    called = {'yes': False}
    monkeypatch.setattr('unittest.main', lambda: called.__setitem__('yes', True))
    path = 'backend/tests/test_models_schemas_mocked.py'
    with open(path) as f:
        code = compile(f.read(), path, 'exec')
        exec(code, {'__name__': '__main__'})

    path2 = 'backend/tests/test_crud.py'
    with open(path2) as f:
        code2 = compile(f.read(), path2, 'exec')
        exec(code2, {'__name__': '__main__', '__file__': path2})
    assert called['yes']
