import uuid
import datetime
import sys, os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from worker import worker

class DummyCursor:
    def __init__(self, rows):
        self.rows = rows
    def execute(self, sql, params=None):
        pass
    def fetchall(self):
        return self.rows
    def close(self):
        pass

class DummyConn:
    def __init__(self, rows):
        self.c = DummyCursor(rows)
    def cursor(self):
        return self.c
    def commit(self):
        pass
    def close(self):
        pass

class FakeResp:
    def raise_for_status(self):
        pass
    def json(self):
        return {"ok": True}

class FakeDateTime(datetime.datetime):
    _now = datetime.datetime(2024, 1, 2, tzinfo=datetime.timezone.utc)
    @classmethod
    def now(cls, tz=None):
        return cls._now


def test_check_rules_only_due(monkeypatch):
    due = uuid.uuid4()
    not_due = uuid.uuid4()
    rows = [
        (due, 'daily', FakeDateTime._now - datetime.timedelta(days=1, minutes=1)),
        (not_due, 'daily', FakeDateTime._now)
    ]
    conn = DummyConn(rows)
    monkeypatch.setattr(worker.psycopg2, 'connect', lambda *a, **k: conn)
    sent = []
    monkeypatch.setattr(worker.requests, 'post', lambda *a, **k: sent.append(k['json']['rule_ids'][0]) or FakeResp())
    monkeypatch.setattr(worker.datetime, 'datetime', FakeDateTime)

    worker.check_rules()
    assert sent == [due]
