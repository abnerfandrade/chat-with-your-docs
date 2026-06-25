import src.db.models  # noqa: F401
from src.db.database import Base


def test_metadata_contains_expected_tables():
    tables = Base.metadata.tables

    assert "documents" in tables
    assert "chats" in tables
    assert "messages" in tables


def test_messages_table_contains_citations_json_column():
    messages_table = Base.metadata.tables["messages"]

    assert "citations_json" in messages_table.c
