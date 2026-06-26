# chat-with-your-docs

This project is my implementation for the assignment option **Chat With Your Docs**. I decided to build a fullstack web application where the user can upload documents, wait for them to be processed in the background, and ask questions in a chat interface at any time. When documents are available, the assistant can answer in a grounded way using the uploaded corpus and show citations.

I tried to keep the solution simple, well structured, and easy to explain. So I decided to use the technologies I have more experience with, follow a backend organization pattern I am already used to with FastAPI microservices, and create a frontend that is simple but enough to understand and to chat with your docs.

## Summary about the project

The application has two main flows that are connected, but not blocked by each other:

1. The user uploads a document.
2. The backend stores the document metadata in PostgreSQL and starts a background RAG pipeline with extraction, chunking, embedding, and indexing in Qdrant.
3. The user can ask questions in the chat even without uploaded documents.
4. After documents are processed, the assistant can use them to answer in a grounded way.
5. The backend runs a LangGraph workflow with guardrails and an answer agent.
6. When relevant documents exist, the answer agent uses hybrid retrieval in Qdrant and streams the final answer to the frontend with SSE.
7. Chats and messages are persisted, so previous chats can be reopened later.

This first version uses a **single shared corpus**. Once a document is indexed, it becomes available for retrieval across all chats.

## Main features

- Upload `.txt`, `.md`, and `.pdf` documents.
- Validate file size with a limit of `10MB`.
- Avoid duplicate uploads by checking the file hash.
- Process documents asynchronously after upload.
- Store metadata and chats in PostgreSQL.
- Store embeddings and lexical data in Qdrant.
- Use hybrid retrieval: semantic + lexical (BM25).
- Allow the user to start a chat even without uploaded documents.
- Stream chat responses with SSE.
- Show citations/references used to answer.
- Reopen previous chats.
- Block unsafe or inappropriate requests before answering.

## Architecture overview

```text
Frontend (React + Vite + TypeScript)
        |
        v
Backend API (FastAPI)
        |
        +--> PostgreSQL
        |      - documents metadata
        |      - chats
        |      - messages
        |
        +--> Background RAG pipeline
        |      - extraction
        |      - chunking
        |      - embedding
        |      - indexing
        |
        +--> LangGraph workflow
               - guardrails_node
               - answer_agent_node
                        |
                        v
                    Qdrant
               - vector retrieval
               - lexical retrieval
```

### Runtime flow

1. The user uploads a file on the Documents page.
2. The backend creates the document record with status `queued`.
3. A background task updates the status to `processing`, runs the RAG pipeline, and then marks the document as `completed` or `failed`.
4. On the Chat page, the user can send a message at any time, even if no document has been uploaded yet.
5. The backend persists the user message, loads the previous messages, and invokes the LangGraph workflow.
6. The workflow runs `guardrails_node` first.
7. If the request is allowed, the workflow runs `answer_agent_node`.
8. If there are relevant documents in Qdrant, the answer agent can call the retrieval tool multiple times.
9. If there are no relevant uploaded documents, the assistant can still answer, but it should say that it does not have enough grounded information.
10. The backend streams the answer and citations to the frontend and persists the final assistant message.

## How to run

### Prerequisites

- Docker and Docker Compose
- Python `3.12+` if you want to run the backend locally
- Node `22+` if you want to run the frontend locally
- An API key for the LLM provider you want to use

### Backend environment variables

Create a file at `backend/.env`. The application supports OpenAI and Gemini through environment variables, so I decided to leave the provider choice configurable.

```env
ENVIRONMENT=development
LOG_LEVEL=INFO

DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/chat_with_your_docs

LLM_PROVIDER=openai

OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-5.4-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-001

QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION_NAME=chat_with_your_docs
QDRANT_VECTOR_SIZE=1536

CHUNK_SIZE_TOKENS=1024
CHUNK_OVERLAP_TOKENS=154
MAX_UPLOAD_SIZE_MB=10

ANSWER_AGENT_MAX_TOOL_CALLS=3
ANSWER_AGENT_MAX_MODEL_CALLS=4
```

### Quick setup with Docker

This is the simplest way to run everything.

```bash
make run-all
```

That command starts:

- PostgreSQL on `http://localhost:5432`
- Qdrant on `http://localhost:6333`
- Backend API on `http://localhost:8000`
- Frontend on `http://localhost:5173`

Useful URLs:

- Frontend: `http://localhost:5173`
- FastAPI docs: `http://localhost:8000/docs`
- Qdrant dashboard: `http://localhost:6333/dashboard`

Other useful commands:

```bash
make run-infra
make run-api
make run-frontend
make logs
make logs-api
make logs-frontend
make logs-db
make stop
make down
```

### Run locally without Docker

If I wanted to run the services separately in development, I would do it like this.

Start the infrastructure first:

```bash
make run-infra
```

Run the backend:

```bash
cd backend
python -m venv venv
source venv/bin/activate
make install-dev
make dev
```

Run the frontend:

```bash
cd frontend
npm ci
npm run dev -- --host 0.0.0.0 --port 5173
```

The frontend already defaults to `http://localhost:8000` for the API, but if needed it is also possible to set `VITE_API_URL`.

### About database migrations

I decided to run Alembic migrations automatically on backend startup to keep the local development simple. So when the API starts, it already tries to bring the database schema to the latest version.

However, in a real cloud deployment like ECS, I know this is not a good practice. In production, I would run the migrations as a separate step in the CI/CD pipeline before updating the backend services.

## How to test

### Backend tests

```bash
cd backend
python -m venv venv
source venv/bin/activate
make install-dev
make test
```

There are also some more specific targets:

```bash
make test-unit
make test-answer-agent
make test-routes
```

### Frontend tests

```bash
cd frontend
npm ci
npm test
```

## Backend

I decided to use the technologies I have more experience with, like FastAPI, LangGraph, LangChain, PostgreSQL, and Qdrant, and decided to follow a pattern that I am used to with FastAPI microservices, where I separate the components by domain in specific folders.

### About the folder structure

- `agents`: here I put the agentic workflow.
- `core`: here I put all global configurations the project uses.
- `db`: here I put the PostgreSQL connection class and table models.
- `middlewares`: here I put the FastAPI middlewares.
- `repositories`: here I created the repositories for table models to centralize database actions.
- `routes`: here I put all routes organized using a factory-style pattern, where each route defines itself.
- `services`: here I put isolated services that are responsible for specific things.

### About the agentic workflow

I decided to use LangGraph version 1 to create a deterministic workflow with state and LangChain version 1 to create the main agent.

In that graph I created the `guardrails_node` using LLM structured output and a structured prompt to make sure the LLM always answers in a structured way. That node checks the user input and blocks unsafe and inappropriate content.

I also created the `answer_agent_node` using `create_agent` from LangChain and used some LangChain middlewares to improve observability and add guardrails for that agent. I also used structured output to make sure the LLM answers the user questions and shows the references used to answer. That agent has a tool that does hybrid retrieval from the Qdrant vector store.

### About the RAG pipeline

I decided to create a RAG pipeline on the backend side to ingest the documents asynchronously. It works like a real pipeline with well defined steps: extraction, chunking, embedding, and indexing. But for this challenge it is together with the backend and runs with FastAPI `BackgroundTasks` after every file upload.

In a real production application, I would implement that RAG pipeline in a different microservice. On AWS, for example, I could use SageMaker Pipelines for it because it is robust and scalable, runs on demand like Lambda, does not have Lambda limitations on time or memory, and does not need to be always running like EC2, ECS, or EKS. I also could use AWS Bedrock to do it in a simpler way than creating a whole SageMaker pipeline.

Regarding the document extraction, I decided to use the library MarkItDown created by Microsoft because it makes the extraction simpler and extracts in markdown format, which is a great format for chunking and for LLMs to understand. It is also possible to use LLM-based OCR and I have used that before for PDFs with figures in the content.

Regarding the chunking strategy, I decided to use the most common and simple strategy, which is token-based chunking with overlap, with `1024` token size and `154` overlap size. Those are numbers I have already tested and used in the past and they work well.

Regarding the embeddings, it is a little basic, nothing much special. I decided to use the length of `1536` dimensions to create the collection in the vector store and to embed the chunks, mainly because `text-embedding-3-small` is limited to that length. However, we can use another embedding model from OpenAI or Gemini here and define another length regarding the chosen model, because it is configurable by environment variables.

### About the vector store

I decided to use Qdrant because it is simpler to configure, install, and use. We can use it by just starting a Docker container.

Another important thing is that this vector store has lexical retrieval (BM25) natively, so it makes hybrid retrieval possible. There is also a LangChain wrapper for Qdrant, which makes the implementation much simpler in the code.

Last but not least, Qdrant offers its own dashboard, accessed locally at `http://localhost:6333/dashboard`, where we can see and even change collections, chunks, and other things.

### About the observability

I decided to create a global configuration for logging and a different configuration for local and production environments. I also added logging in important parts of the application, like the LangGraph workflow and the background pipeline.

I did not implement it, but since I am using LangGraph and LangChain, I could use LangSmith to have better observability for the agentic workflow.

### RAGAS

I did not implement a RAGAS script to evaluate the RAG agent. However, it would be something I would do in a production-grade application. Those evaluations would help to understand how exactly the RAG implementation is working.

So, I might need to improve some part of the ingestion, like chunking for example, or I might need to improve the retrieval tool, and so on. With RAGAS, I could make better decisions regarding how to improve the RAG implementation.

## Frontend

I decided to use React 19 + Vite + TypeScript because it is the frontend stack I have more experience with.

### About the layout

I decided to follow a common chatbot layout, similar to ChatGPT, just to make it simpler and faster to plan and implement. So the layout is simple, but enough to understand and to chat with your docs.

I separated the frontend into two main pages:

- `Documents`: to upload files and monitor ingestion status.
- `Chat`: to ask questions, read answers, and reopen previous chats, even before the document corpus is ready.

### About some technologies

I decided to use Zustand for global state instead of Context API, because Zustand does not trigger changes in the whole DOM every time a state changes and it is more performant for this kind of transient UI state. But I know that in some specific cases it is good to use Context API, like in small components or small pages.

I decided to use TanStack Query to cache some requests that make sense. It is great to make the frontend more performant, but I also know I should use it mainly when it makes sense to cache request results.

I decided to use Vite because it is faster to bootstrap and faster in development, which helped me move quicker in the challenge.

## RAG and LLM approach decisions

These were the main choices I made:

- I decided to keep the workflow deterministic with LangGraph and only use agentic behavior where it adds value.
- I decided to keep the corpus shared across chats because multi-tenancy and access control were not necessary for this challenge.
- I decided to use hybrid retrieval because only semantic retrieval or only lexical retrieval felt weaker than combining both.
- I decided to return structured output from guardrails and answer generation because it makes the behavior easier to validate and easier to consume in the API layer.
- I decided to stream the answer to the frontend because it improves the user experience and makes the chat feel more responsive.
- I decided to persist chats and messages in PostgreSQL because reopening old chats is a core product behavior here.

## Key technical decisions and trade-offs

- I decided to keep the RAG pipeline inside the backend for this version because it is simpler to ship in a challenge, even though I would separate it in production.
- I decided not to implement authentication or document-level permissions because I preferred to focus on the core RAG flow first.
- I decided not to over-engineer the UI. I wanted it clean, understandable, and enough to demonstrate the main product flow.
- I decided to support only `.txt`, `.md`, and `.pdf` in this version because they cover the use case well and keep extraction simpler.
- I decided to use background processing with FastAPI instead of a dedicated queue system to keep the implementation smaller and more direct.

## Engineering standards I followed

- Clear folder organization by domain.
- Async backend with typed request/response models.
- Centralized repositories for database access.
- Isolated services for extraction, chunking, embedding, indexing, and retrieval.
- Automated database migrations.
- Unit tests for both backend and frontend.
- Containerized local environment with Docker.
- Logging in important parts of the system.

## Engineering standards I skipped or kept simple

- I did not implement authentication and authorization.
- I did not implement multi-tenancy or document-level access control.
- I did not implement a dedicated background job system like Celery, RabbitMQ, or SQS.
- I did not implement RAGAS evaluations.
- I did not implement LangSmith or a more advanced observability stack.
- I did not add end-to-end tests.

I made those trade-offs because I preferred to finish a solid core solution instead of starting many advanced features and leaving the core weaker.

## How I used AI tools in the development process

I used Codex as my main pair programming tool throughout the project. My process looked like this:

- **Planning:** I used Codex to plan the entire backend and frontend architecture.
- **Review:** I did multiple reviews of the generated plan, refining it until I was satisfied with the approach.
- **Breaking it down:** I broke the final plan into smaller, manageable pieces.
- **Implementation:** I asked Codex to implement the project step by step. I reviewed the code at each stage and followed along to ensure everything was correct.
- **Iteration:** I made several adjustments and changes along the way, especially on the frontend, to improve the final result.

This approach allowed me to move much faster while still keeping control over the code, the architecture, and the final decisions.

## What I would do differently with more time

- Add authentication and authorization.
- Add document ownership and access control.
- Split the ingestion pipeline into a separate service.
- Add a proper queue and worker architecture.
- Add RAGAS evaluation scripts and a better offline evaluation workflow.
- Add LangSmith or OpenTelemetry for stronger observability.
- Improve prompt/version management and experiment tracking.
- Add end-to-end tests.
- Add more file formats and improve OCR for complex PDFs.
- Add a better production-ready deployment pipeline.

## Architecture on cloud

I would implement the whole web application on AWS.

I would host the backend on ECS Fargate with its own tasks and scaling rules. Since the frontend is a React SPA, I would host the built static files on an S3 bucket and serve them via CloudFront instead of using ECS.

For the RAG pipeline I would choose one of two options. The first one is to host it on SageMaker Pipelines, triggered either after a file is uploaded to S3 or by an EventBridge recurrent schedule. The second one is to use AWS Bedrock to manage the RAG pipeline, but I do not have enough Bedrock experience to say for sure which one I would choose in a real project without testing both.

For the vector store, I would use AWS OpenSearch because it is robust, supports hybrid retrieval and it is native on AWS.

I would use an ALB in front of ECS to manage the backend traffic.

For PostgreSQL, I would use RDS Aurora PostgreSQL.

Regarding the VPC, I would use a private network to isolate the resources and use either a NAT Gateway or VPC Endpoints for the internet access that is really needed.

I also would use AWS Bedrock to centralize the LLMs available.
