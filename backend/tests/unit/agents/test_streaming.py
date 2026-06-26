from langchain_core.messages import AIMessageChunk
from pydantic import BaseModel

from src.agents.streaming import StructuredFieldStreamExtractor, extract_message_text


class ExampleStructuredOutput(BaseModel):
    answer_text: str
    citations: list[str]


def test_extract_message_text_reads_string_content():
    chunk = AIMessageChunk(content="hello")

    assert extract_message_text(chunk) == "hello"


def test_extract_message_text_reads_text_blocks():
    chunk = AIMessageChunk(
        content=[
            {"text": "hello"},
            {"type": "ignored"},
            " world",
        ]
    )

    assert extract_message_text(chunk) == "hello world"


def test_structured_field_stream_extractor_streams_only_requested_field():
    extractor = StructuredFieldStreamExtractor(
        schema=ExampleStructuredOutput,
        field_name="answer_text",
    )

    assert extractor.feed("{") == ""
    assert extractor.feed('"answer_text"') == ""
    assert extractor.feed(': "hello ') == "hello "
    assert extractor.feed('world"') == "world"
    assert extractor.feed(', "citations": ["a", "b"]}') == ""


def test_structured_field_stream_extractor_passthroughs_plain_text():
    extractor = StructuredFieldStreamExtractor(
        schema=ExampleStructuredOutput,
        field_name="answer_text",
    )

    assert extractor.feed("hello ") == "hello "
    assert extractor.feed("world") == "world"
