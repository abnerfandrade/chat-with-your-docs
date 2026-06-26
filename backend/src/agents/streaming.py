from __future__ import annotations

from typing import Any

from langchain_core.messages import AIMessageChunk
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.outputs import Generation


def extract_message_text(chunk: Any) -> str:
    if isinstance(chunk, AIMessageChunk):
        content = chunk.content
    else:
        content = getattr(chunk, "content", "")

    if isinstance(content, str):
        return content

    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
                continue

            if isinstance(item, dict):
                text = item.get("text")
                if isinstance(text, str):
                    parts.append(text)

        return "".join(parts)

    return ""


class StructuredFieldStreamExtractor:
    def __init__(self, *, schema: type[Any], field_name: str) -> None:
        self._field_name = field_name
        self._mode = "undecided"
        self._raw_buffer = ""
        self._streamed_value = ""
        self._structured_output_parser = JsonOutputParser(pydantic_object=schema)

    def feed(self, text: str) -> str:
        if not text:
            return ""

        if self._mode == "passthrough":
            return text

        self._raw_buffer += text
        if self._mode == "undecided":
            stripped_buffer = self._raw_buffer.lstrip()
            if not stripped_buffer:
                return ""

            if not stripped_buffer.startswith("{"):
                self._mode = "passthrough"
                passthrough_text = self._raw_buffer
                self._raw_buffer = ""
                return passthrough_text

            self._mode = "structured"

        parsed = self._structured_output_parser.parse_result(
            [Generation(text=self._raw_buffer)],
            partial=True,
        )
        if not isinstance(parsed, dict):
            return ""

        field_value = parsed.get(self._field_name)
        if not isinstance(field_value, str):
            return ""

        if not field_value.startswith(self._streamed_value):
            return ""

        delta = field_value[len(self._streamed_value) :]
        self._streamed_value = field_value
        return delta
