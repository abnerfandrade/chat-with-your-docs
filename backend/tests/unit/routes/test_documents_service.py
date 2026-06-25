from uuid import uuid4

import pytest

from src.services.rag_pipeline.datatypes import RagPipelineResult
from src.routes.documents.service import run_pipeline_background


@pytest.mark.asyncio
async def test_run_pipeline_background_marks_document_completed(mocker):
    document_id = uuid4()
    pipeline = mocker.Mock()
    pipeline.run = mocker.AsyncMock(
        return_value=RagPipelineResult(
            document_id=document_id,
            filename="doc.txt",
            char_count=10,
            chunk_count=2,
            stored_count=2,
        )
    )
    update_status = mocker.patch(
        "src.routes.documents.service._update_document_status",
        new=mocker.AsyncMock(),
    )

    result = await run_pipeline_background(
        document_id=document_id,
        filename="doc.txt",
        content=b"hello",
        pipeline=pipeline,
    )

    assert result is not None
    pipeline.run.assert_awaited_once_with(
        document_id=document_id,
        filename="doc.txt",
        content=b"hello",
    )
    assert [call.kwargs["status"] for call in update_status.await_args_list] == [
        "processing",
        "completed",
    ]


@pytest.mark.asyncio
async def test_run_pipeline_background_marks_document_failed_on_error(mocker):
    document_id = uuid4()
    pipeline = mocker.Mock()
    pipeline.run = mocker.AsyncMock(side_effect=RuntimeError("pipeline exploded"))
    update_status = mocker.patch(
        "src.routes.documents.service._update_document_status",
        new=mocker.AsyncMock(),
    )

    result = await run_pipeline_background(
        document_id=document_id,
        filename="doc.txt",
        content=b"hello",
        pipeline=pipeline,
    )

    assert result is None
    pipeline.run.assert_awaited_once_with(
        document_id=document_id,
        filename="doc.txt",
        content=b"hello",
    )
    assert [call.kwargs["status"] for call in update_status.await_args_list] == [
        "processing",
        "failed",
    ]
    assert update_status.await_args_list[1].kwargs["error_message"] == "pipeline exploded"
