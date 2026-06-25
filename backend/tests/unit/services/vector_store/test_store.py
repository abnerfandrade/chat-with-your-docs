from src.services.vector_store.store import (
    RetrievalMode,
    ensure_collection_exists,
    get_embeddings_client,
    get_vector_store,
)


def test_get_embeddings_client_returns_openai_embeddings(mocker, settings_override):
    settings_override(
        LLM_PROVIDER="openai",
        OPENAI_API_KEY="openai-test-key",
        OPENAI_EMBEDDING_MODEL="text-embedding-test",
        QDRANT_VECTOR_SIZE=256,
    )
    embeddings = mocker.Mock(name="openai_embeddings")
    ctor = mocker.patch(
        "src.services.vector_store.store.OpenAIEmbeddings",
        return_value=embeddings,
    )

    result = get_embeddings_client()

    assert result is embeddings
    ctor.assert_called_once_with(
        model="text-embedding-test",
        api_key="openai-test-key",
        dimensions=256,
    )


def test_get_embeddings_client_returns_gemini_embeddings(mocker, settings_override):
    settings_override(
        LLM_PROVIDER="gemini",
        GEMINI_API_KEY="gemini-test-key",
        GEMINI_EMBEDDING_MODEL="gemini-embedding-test",
        QDRANT_VECTOR_SIZE=768,
    )
    embeddings = mocker.Mock(name="gemini_embeddings")
    ctor = mocker.patch(
        "src.services.vector_store.store.GoogleGenerativeAIEmbeddings",
        return_value=embeddings,
    )

    result = get_embeddings_client(for_query=True)

    assert result is embeddings
    ctor.assert_called_once_with(
        model="gemini-embedding-test",
        google_api_key="gemini-test-key",
        task_type="RETRIEVAL_QUERY",
        output_dimensionality=768,
    )


def test_ensure_collection_exists_creates_collection_when_missing(
    mocker, settings_override
):
    settings_override(
        QDRANT_COLLECTION_NAME="chat_docs",
        QDRANT_VECTOR_SIZE=512,
    )
    client = mocker.Mock()
    client.collection_exists.return_value = False

    ensure_collection_exists(client)

    client.collection_exists.assert_called_once_with("chat_docs")
    client.create_collection.assert_called_once()


def test_get_vector_store_initializes_hybrid_qdrant_store(
    mocker, settings_override
):
    settings_override(QDRANT_COLLECTION_NAME="chat_docs")
    client = mocker.Mock(name="qdrant_client")
    embeddings = mocker.Mock(name="embeddings")
    sparse_embeddings = mocker.Mock(name="sparse_embeddings")
    vector_store = mocker.Mock(name="vector_store")

    mocker.patch(
        "src.services.vector_store.store.get_qdrant_client",
        return_value=client,
    )
    ensure = mocker.patch("src.services.vector_store.store.ensure_collection_exists")
    get_embeddings = mocker.patch(
        "src.services.vector_store.store.get_embeddings_client",
        return_value=embeddings,
    )
    sparse_ctor = mocker.patch(
        "src.services.vector_store.store.FastEmbedSparse",
        return_value=sparse_embeddings,
    )
    qdrant_ctor = mocker.patch(
        "src.services.vector_store.store.QdrantVectorStore",
        return_value=vector_store,
    )

    result = get_vector_store(for_query=True)

    assert result is vector_store
    ensure.assert_called_once_with(client)
    get_embeddings.assert_called_once_with(for_query=True)
    sparse_ctor.assert_called_once_with(model_name="Qdrant/bm25")
    qdrant_ctor.assert_called_once()
    kwargs = qdrant_ctor.call_args.kwargs
    assert kwargs["client"] is client
    assert kwargs["collection_name"] == "chat_docs"
    assert kwargs["embedding"] is embeddings
    assert kwargs["sparse_embedding"] is sparse_embeddings
    assert kwargs["retrieval_mode"] == RetrievalMode.HYBRID
    assert kwargs["vector_name"] == "dense"
    assert kwargs["sparse_vector_name"] == "sparse"
