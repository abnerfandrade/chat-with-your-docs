from src.services.vector_store.retriever import VectorStoreRetriever


def test_retriever_search_uses_default_parameters(fake_vector_store):
    fake_vector_store.similarity_search.return_value = ["doc-a", "doc-b"]
    retriever = VectorStoreRetriever(
        k=4,
        score_threshold=0.6,
        vector_store=fake_vector_store,
    )
    filter_obj = object()

    result = retriever.search("security handbook", filter=filter_obj)

    assert result == ["doc-a", "doc-b"]
    fake_vector_store.similarity_search.assert_called_once_with(
        query="security handbook",
        k=4,
        filter=filter_obj,
        score_threshold=0.6,
    )


def test_retriever_search_allows_runtime_overrides(fake_vector_store):
    fake_vector_store.similarity_search.return_value = ["doc-c"]
    retriever = VectorStoreRetriever(k=5, vector_store=fake_vector_store)

    result = retriever.search(
        "deployment notes",
        k=2,
        score_threshold=0.8,
    )

    assert result == ["doc-c"]
    fake_vector_store.similarity_search.assert_called_once_with(
        query="deployment notes",
        k=2,
        score_threshold=0.8,
    )
