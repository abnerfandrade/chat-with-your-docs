from src.services.rag_pipeline.embedder import Embedder
from src.services.vector_store.datatypes import EmbeddingStoreResult


def test_embedder_returns_zero_result_for_empty_chunks(fake_vector_store):
    embedder = Embedder(vector_store=fake_vector_store)

    result = embedder.embed_and_store([])

    assert isinstance(result, EmbeddingStoreResult)
    assert result.collection_name == "chat_with_your_docs_test"
    assert result.stored_count == 0
    assert result.point_ids == []
    fake_vector_store.add_documents.assert_not_called()


def test_embedder_converts_chunks_and_stores_documents(fake_vector_store, sample_chunk):
    embedder = Embedder(vector_store=fake_vector_store)

    result = embedder.embed_and_store([sample_chunk])

    assert result.collection_name == "chat_with_your_docs_test"
    assert result.stored_count == 1
    assert len(result.point_ids) == 1
    fake_vector_store.add_documents.assert_called_once()
    kwargs = fake_vector_store.add_documents.call_args.kwargs
    assert kwargs["ids"] == result.point_ids
    assert len(kwargs["documents"]) == 1
    stored_document = kwargs["documents"][0]
    assert stored_document.page_content == sample_chunk.content
    assert stored_document.metadata["chunk_id"] == sample_chunk.metadata.chunk_id
    assert stored_document.metadata["document_id"] == str(sample_chunk.metadata.document_id)
    assert stored_document.metadata["content"] == sample_chunk.content
