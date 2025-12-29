# Product Requirements Document: Agent Memory

## TL;DR

Build a minimal, production-grade memory management package for AI agents. Memory should be boring, explicit, reversible, and predictable. This package provides MCP-compatible tools and strict prompts that prevent common memory failures like hoarding, duplication, and stale data accumulation.

## 1. Overview

### 1.1 Problem Statement

AI agents with memory capabilities consistently fail in predictable ways:

- **Memory hoarding**: Storing every interaction, creating noise
- **Duplication**: Creating new memories instead of updating existing ones
- **Stale data**: Never cleaning up outdated information
- **Wrong granularity**: Storing raw conversations or guesses instead of facts
- **No reversibility**: Users can't correct or delete memories
- **Creepy behavior**: Exposing memory contents inappropriately

These failures stem from missing guardrails, not model limitations. Current solutions focus on the retrieval side (RAG) while ignoring write-side hygiene.

### 1.2 Solution

A memory management package that provides:

- **Strict write gates**: Prevent bad data from entering memory
- **Search-before-write**: Enforce updates over duplicates
- **Explicit formatting**: Structured, retrieval-optimized storage
- **User control**: Remember and forget commands that always work
- **MCP compatibility**: Standard tool interface for any agent framework

### 1.3 Design Philosophy

Memory should be:

- **Expensive**: Treat storage as scarce to prevent hoarding
- **Factual**: Only stable, verifiable information
- **Updatable**: Overwrite trumps append
- **Reversible**: Users control their data
- **Predictable**: Same input, same behavior

### 1.4 Success Metrics

- **Write Rejection Rate**: >60% of potential writes blocked by gates
- **Duplicate Prevention**: <5% duplicate memories in production
- **Retrieval Accuracy**: 2x improvement in RAG recall with formatted memories
- **User Trust**: >90% success rate for explicit remember/forget commands
- **Memory Efficiency**: <100 memories per active user after 6 months

## 2. User Stories & Requirements

### 2.1 Core User Stories

**As an AI agent, I want to:**

- Store user preferences that persist across sessions
- Remember facts about the user's environment and setup
- Update existing memories when information changes
- Search memories before responding to provide context
- Respect explicit remember and forget requests

**As a user, I want to:**

- Tell the agent to remember specific things
- Tell the agent to forget specific things
- Trust that the agent won't store inappropriate information
- Not be surprised by what the agent remembers
- Have memories that actually improve the experience

**As a developer, I want to:**

- Integrate memory with minimal configuration
- Trust that the package handles edge cases
- Monitor memory quality and health
- Debug memory behavior when issues arise
- Customize storage backends without changing logic

### 2.2 Functional Requirements

#### 2.2.1 Memory Operations

- **Create**: Store new factual memories
- **Search**: Find relevant memories by semantic similarity
- **Update**: Modify existing memories when facts change
- **Delete**: Remove memories on request
- **List**: Enumerate stored memories for debugging

#### 2.2.2 Write Gates

- **Store/Ignore Decision**: Binary gate before any write
- **Duplicate Detection**: Search before write, prefer update
- **Format Enforcement**: Structured output from unstructured input
- **Validation**: Reject invalid or unsafe content

#### 2.2.3 Prompt System

- **System Contract**: Global rules for memory behavior
- **Write Decision**: Should this information be stored?
- **Search Prompt**: Find related memories before writing
- **Create Prompt**: Format memories for optimal retrieval
- **Update Prompt**: Replace without referencing old versions
- **Retrieval Prompt**: Use memories as context, not truth

#### 2.2.4 User Commands

- **Explicit Remember**: Store even if normally ignored
- **Explicit Forget**: Delete matching memories immediately

### 2.3 Non-Functional Requirements

- **Latency**: <50ms for search, <100ms for write operations
- **Reliability**: Graceful degradation if storage unavailable
- **Privacy**: No PII stored without explicit consent
- **Portability**: Works with any vector DB or key-value store
- **Observability**: Structured logs for every decision

## 3. Technical Architecture

### 3.1 System Components

#### 3.1.1 Core Interfaces

```typescript
interface Memory {
  id: string;
  content: string;
  metadata: MemoryMetadata;
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

interface MemoryMetadata {
  source: "inferred" | "explicit";
  category: MemoryCategory;
  confidence: number;
  expiresAt?: Date;
  tags?: string[];
}

type MemoryCategory =
  | "preference"
  | "fact"
  | "context"
  | "instruction";

interface MemoryStore {
  createAction: (memory: CreateMemoryInput) => Promise<Memory>;
  searchAction: (query: string, options?: SearchOptions) => Promise<Memory[]>;
  updateAction: (id: string, updates: UpdateMemoryInput) => Promise<Memory>;
  deleteAction: (id: string) => Promise<void>;
  listAction: (options?: ListOptions) => Promise<Memory[]>;
}

interface CreateMemoryInput {
  content: string;
  category: MemoryCategory;
  source: "inferred" | "explicit";
  tags?: string[];
  expiresAt?: Date;
}

interface UpdateMemoryInput {
  content?: string;
  category?: MemoryCategory;
  tags?: string[];
  expiresAt?: Date;
}

interface SearchOptions {
  limit?: number;
  threshold?: number;
  category?: MemoryCategory;
  tags?: string[];
}

interface ListOptions {
  limit?: number;
  offset?: number;
  category?: MemoryCategory;
  sortBy?: "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}
```

#### 3.1.2 Decision Engine

```typescript
interface WriteDecision {
  action: "store" | "ignore" | "update";
  reason: string;
  existingMemoryId?: string;
}

interface MemoryDecisionEngine {
  shouldStoreAction: (input: string, context: DecisionContext) => Promise<WriteDecision>;
  formatMemoryAction: (input: string) => Promise<string>;
  findDuplicatesAction: (content: string) => Promise<Memory[]>;
}

interface DecisionContext {
  recentMessages?: string[];
  existingMemories?: Memory[];
  userIntent?: "remember" | "forget" | "none";
}
```

#### 3.1.3 Prompt Templates

```typescript
interface PromptTemplates {
  systemContract: string;
  writeDecision: string;
  searchBeforeWrite: string;
  formatMemory: string;
  updateMemory: string;
  retrievalUsage: string;
  explicitRemember: string;
  explicitForget: string;
}

const defaultPrompts: PromptTemplates = {
  systemContract: `
You have access to a persistent memory store.

Memory is expensive and long lived.

Only store information that is stable, factual, and likely to be useful in future interactions.

Do not store raw conversation logs.

Do not store guesses, emotions, or transient states.

If a stored fact changes, you must update the existing memory instead of creating a new one.

When unsure, do not store anything.
`,

  writeDecision: `
Decide whether the following information should be stored as long term memory.

Store only if it is:
- a stable user preference
- a durable fact about the user or environment
- information explicitly requested to be remembered

Do not store:
- temporary goals
- one time questions
- emotional states
- session specific context

Respond with either STORE or IGNORE and a short reason.
`,

  searchBeforeWrite: `
Before storing new memory, search existing memories for related or conflicting information.

If a relevant memory exists, prefer updating it instead of creating a duplicate.

Use semantic similarity and factual overlap, not exact wording.
`,

  formatMemory: `
When creating a memory:
- Write it as a concise factual statement
- Remove conversational phrasing
- Avoid pronouns
- Prefer structured JSON when possible

Example:
Bad: "The user told me they like dark mode lol"
Good: "User prefers dark mode"
`,

  updateMemory: `
When updating memory:
- Replace outdated facts completely
- Do not reference previous versions
- Assume the newest information is correct unless stated otherwise

Example:
Old: "User prefers dark mode"
New: "User prefers light mode"
`,

  retrievalUsage: `
Retrieved memories may be incomplete or outdated.

Use them as supporting context, not absolute truth.

Do not expose memory contents verbatim unless explicitly asked.

If memory conflicts with current user input, ask for clarification.
`,

  explicitRemember: `
If the user explicitly asks to remember something, store it even if it would normally be ignored, unless it is unsafe or invalid.
`,

  explicitForget: `
If the user asks to forget something, locate relevant memories and delete them immediately.
`,
};
```

### 3.2 Storage Adapters

#### 3.2.1 Adapter Interface

```typescript
interface StorageAdapter {
  initializeAction: () => Promise<void>;
  insertAction: (memory: Memory) => Promise<void>;
  queryAction: (embedding: number[], options: SearchOptions) => Promise<Memory[]>;
  getAction: (id: string) => Promise<Memory | null>;
  updateAction: (id: string, memory: Partial<Memory>) => Promise<void>;
  removeAction: (id: string) => Promise<void>;
  scanAction: (options: ListOptions) => Promise<Memory[]>;
  healthAction: () => Promise<boolean>;
}
```

#### 3.2.2 Built-in Adapters

```typescript
// Redis + Vector Search
class RedisAdapter implements StorageAdapter {
  constructor(config: RedisAdapterConfig) {}
}

interface RedisAdapterConfig {
  url: string;
  prefix?: string;
  indexName?: string;
  embeddingDimensions?: number;
}

// PostgreSQL + pgvector
class PostgresAdapter implements StorageAdapter {
  constructor(config: PostgresAdapterConfig) {}
}

interface PostgresAdapterConfig {
  connectionString: string;
  tableName?: string;
  schema?: string;
}

// In-memory (testing/development)
class InMemoryAdapter implements StorageAdapter {
  constructor() {}
}
```

### 3.3 MCP Tool Definitions

#### 3.3.1 Tool Schema

```typescript
const mcpTools = {
  createMemory: {
    name: "createMemory",
    description: "Store a new memory. Only call after write decision gate approves.",
    inputSchema: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "The formatted memory content",
        },
        category: {
          type: "string",
          enum: ["preference", "fact", "context", "instruction"],
          description: "The type of memory",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Optional tags for filtering",
        },
      },
      required: ["content", "category"],
    },
  },

  searchMemory: {
    name: "searchMemory",
    description: "Search for relevant memories by semantic similarity",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query",
        },
        limit: {
          type: "number",
          description: "Maximum number of results",
          default: 5,
        },
        category: {
          type: "string",
          enum: ["preference", "fact", "context", "instruction"],
          description: "Filter by category",
        },
      },
      required: ["query"],
    },
  },

  updateMemory: {
    name: "updateMemory",
    description: "Update an existing memory with new information",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The memory ID to update",
        },
        content: {
          type: "string",
          description: "The new memory content",
        },
      },
      required: ["id", "content"],
    },
  },

  deleteMemory: {
    name: "deleteMemory",
    description: "Delete a memory by ID",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The memory ID to delete",
        },
      },
      required: ["id"],
    },
  },

  listMemory: {
    name: "listMemory",
    description: "List all stored memories for debugging",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of results",
          default: 20,
        },
        category: {
          type: "string",
          enum: ["preference", "fact", "context", "instruction"],
          description: "Filter by category",
        },
      },
    },
  },
};
```

### 3.4 Data Models

#### 3.4.1 PostgreSQL Schema

```sql
CREATE TABLE agent_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  embedding vector(1536),
  
  category TEXT NOT NULL CHECK (category IN ('preference', 'fact', 'context', 'instruction')),
  source TEXT NOT NULL CHECK (source IN ('inferred', 'explicit')),
  confidence REAL DEFAULT 1.0,
  
  tags TEXT[] DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, agent_id, content_hash)
);

CREATE INDEX idx_memories_user_agent ON agent_memories(user_id, agent_id);
CREATE INDEX idx_memories_category ON agent_memories(category);
CREATE INDEX idx_memories_embedding ON agent_memories USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_memories_tags ON agent_memories USING gin(tags);

CREATE TABLE memory_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id UUID REFERENCES agent_memories(id) ON DELETE SET NULL,
  user_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  
  event_type TEXT NOT NULL CHECK (event_type IN ('create', 'update', 'delete', 'search', 'ignore')),
  event_data JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_memory_events_user ON memory_events(user_id, agent_id, created_at DESC);
```

#### 3.4.2 Redis Schema

```typescript
// Memory storage
// Key: memory:{userId}:{agentId}:{memoryId}
// Type: Hash
interface RedisMemoryHash {
  content: string;
  category: string;
  source: string;
  confidence: string;
  tags: string; // JSON array
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Vector index for search
// Index: idx:memories:{userId}:{agentId}
// Schema: VECTOR embedding FLAT 6 TYPE FLOAT32 DIM 1536 DISTANCE_METRIC COSINE

// User memory set (for listing)
// Key: memories:{userId}:{agentId}
// Type: Sorted Set (score = timestamp)
```

## 4. Implementation Details

### 4.1 Write Decision Flow

```typescript
async function processMemoryWriteAction(
  input: string,
  context: DecisionContext,
  store: MemoryStore,
  engine: MemoryDecisionEngine
): Promise<WriteResult> {
  // Step 1: Check for explicit user intent
  if (context.userIntent === "forget") {
    const matches = await store.searchAction(input, { limit: 10 });
    for (const match of matches) {
      await store.deleteAction(match.id);
    }
    return { action: "deleted", count: matches.length };
  }

  // Step 2: Run write decision gate
  const decision = await engine.shouldStoreAction(input, context);
  
  if (decision.action === "ignore" && context.userIntent !== "remember") {
    return { action: "ignored", reason: decision.reason };
  }

  // Step 3: Search for duplicates
  const duplicates = await engine.findDuplicatesAction(input);
  
  if (duplicates.length > 0 && decision.action !== "update") {
    // Found semantic duplicate, update instead of create
    const formatted = await engine.formatMemoryAction(input);
    await store.updateAction(duplicates[0].id, { content: formatted });
    return { action: "updated", memoryId: duplicates[0].id };
  }

  // Step 4: Format and store
  const formatted = await engine.formatMemoryAction(input);
  const memory = await store.createAction({
    content: formatted,
    category: categorizeMemory(formatted),
    source: context.userIntent === "remember" ? "explicit" : "inferred",
  });

  return { action: "created", memoryId: memory.id };
}

interface WriteResult {
  action: "created" | "updated" | "deleted" | "ignored";
  memoryId?: string;
  reason?: string;
  count?: number;
}
```

### 4.2 Memory Formatting

```typescript
async function formatMemoryAction(
  input: string,
  llm: LLMClient
): Promise<string> {
  const response = await llm.complete({
    messages: [
      {
        role: "system",
        content: defaultPrompts.formatMemory,
      },
      {
        role: "user",
        content: `Format this as a memory:\n\n${input}`,
      },
    ],
    temperature: 0,
    maxTokens: 200,
  });

  return response.content.trim();
}

// Examples of formatting transformations:
// "The user said they prefer using vim" -> "User prefers vim editor"
// "I think they work at a startup" -> REJECTED (guess, not fact)
// "Remember I have a meeting at 3pm" -> "User has meeting at 3pm on [date]"
// "My API key is sk-abc123" -> REJECTED (sensitive data)
```

### 4.3 Duplicate Detection

```typescript
async function findDuplicatesAction(
  content: string,
  store: MemoryStore,
  embedder: Embedder,
  threshold: number = 0.85
): Promise<Memory[]> {
  const embedding = await embedder.embed(content);
  
  const candidates = await store.searchAction(content, {
    limit: 5,
    threshold,
  });

  // Additional semantic overlap check
  return candidates.filter((memory) => {
    const overlap = calculateSemanticOverlap(content, memory.content);
    return overlap > threshold;
  });
}

function calculateSemanticOverlap(a: string, b: string): number {
  // Jaccard similarity on key terms
  const termsA = extractKeyTerms(a);
  const termsB = extractKeyTerms(b);
  
  const intersection = termsA.filter((t) => termsB.includes(t));
  const union = [...new Set([...termsA, ...termsB])];
  
  return intersection.length / union.length;
}
```

## 5. Package Structure

```
packages/memory/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                 # Public exports
│   ├── memory-client.ts         # Main client class
│   ├── decision-engine.ts       # Write decision logic
│   ├── prompts.ts               # Prompt templates
│   ├── types.ts                 # Type definitions
│   ├── adapters/
│   │   ├── adapter.ts           # Base adapter interface
│   │   ├── redis-adapter.ts     # Redis implementation
│   │   ├── postgres-adapter.ts  # PostgreSQL implementation
│   │   └── memory-adapter.ts    # In-memory implementation
│   ├── mcp/
│   │   ├── tools.ts             # MCP tool definitions
│   │   └── server.ts            # MCP server implementation
│   └── utils/
│       ├── embeddings.ts        # Embedding utilities
│       ├── hashing.ts           # Content hashing
│       └── validation.ts        # Input validation
└── tests/
    ├── decision-engine.test.ts
    ├── duplicate-detection.test.ts
    ├── formatting.test.ts
    └── adapters/
        ├── redis.test.ts
        └── postgres.test.ts
```

## 6. Usage Examples

### 6.1 Basic Integration

```typescript
import { MemoryClient, RedisAdapter } from "@databuddy/memory";

const memory = new MemoryClient({
  adapter: new RedisAdapter({
    url: process.env.REDIS_URL,
  }),
  embedder: {
    model: "text-embedding-3-small",
    apiKey: process.env.OPENAI_API_KEY,
  },
  userId: "user_123",
  agentId: "assistant",
});

// Process a potential memory
const result = await memory.processAction(
  "The user prefers TypeScript over JavaScript",
  { userIntent: "none" }
);
// result: { action: "created", memoryId: "mem_abc123" }

// Search for relevant context
const memories = await memory.searchAction("programming languages");
// memories: [{ content: "User prefers TypeScript", ... }]

// Explicit remember
const explicitResult = await memory.processAction(
  "Remember that my dog's name is Max",
  { userIntent: "remember" }
);
// result: { action: "created", memoryId: "mem_def456" }

// Explicit forget
const forgetResult = await memory.processAction(
  "Forget my dog's name",
  { userIntent: "forget" }
);
// result: { action: "deleted", count: 1 }
```

### 6.2 MCP Server Integration

```typescript
import { createMCPServer } from "@databuddy/memory/mcp";

const server = createMCPServer({
  adapter: new PostgresAdapter({
    connectionString: process.env.DATABASE_URL,
  }),
  embedder: {
    model: "text-embedding-3-small",
    apiKey: process.env.OPENAI_API_KEY,
  },
});

// Start MCP server
await server.start();
```

### 6.3 Custom Prompts

```typescript
import { MemoryClient, defaultPrompts } from "@databuddy/memory";

const memory = new MemoryClient({
  // ... adapter config
  prompts: {
    ...defaultPrompts,
    writeDecision: `
${defaultPrompts.writeDecision}

Additional rules for this application:
- Always store code preferences
- Never store temporary file paths
- Store project names and descriptions
`,
  },
});
```

### 6.4 With Agent Framework

```typescript
import { MemoryClient } from "@databuddy/memory";
import { Agent } from "some-agent-framework";

const memory = new MemoryClient({ /* config */ });

const agent = new Agent({
  systemPrompt: memory.getSystemContract(),
  tools: [
    ...memory.getMCPTools(),
    // other tools
  ],
  beforeResponse: async (messages) => {
    // Inject relevant memories
    const context = await memory.searchAction(
      messages.at(-1)?.content ?? "",
      { limit: 5 }
    );
    return memory.formatContextAction(context);
  },
  afterResponse: async (response, messages) => {
    // Check if we should store anything
    await memory.processConversationAction(messages, response);
  },
});
```

## 7. Quality Metrics

### 7.1 Memory Health Dashboard

```typescript
interface MemoryHealth {
  totalMemories: number;
  memoriesByCategory: Record<MemoryCategory, number>;
  memoriesBySource: Record<"inferred" | "explicit", number>;
  averageAge: number;
  duplicateRate: number;
  writeRejectionRate: number;
  searchHitRate: number;
}

async function getMemoryHealthAction(
  store: MemoryStore,
  events: EventStore
): Promise<MemoryHealth> {
  // Implementation
}
```

### 7.2 Quality Benchmarks

```typescript
// Run against test dataset
async function benchmarkMemoryQualityAction(
  client: MemoryClient,
  testCases: TestCase[]
): Promise<BenchmarkResults> {
  const results = {
    correctWrites: 0,
    incorrectWrites: 0,
    correctIgnores: 0,
    incorrectIgnores: 0,
    duplicatesCreated: 0,
    duplicatesPrevented: 0,
    formatQuality: 0,
    retrievalAccuracy: 0,
  };

  for (const testCase of testCases) {
    const result = await client.processAction(
      testCase.input,
      testCase.context
    );
    
    if (result.action === testCase.expectedAction) {
      results[`correct${capitalize(result.action)}s`]++;
    } else {
      results[`incorrect${capitalize(result.action)}s`]++;
    }
    
    // Additional quality checks...
  }

  return results;
}
```

## 8. Implementation Plan

### Phase 1: Core Package (2 weeks)

- [ ] Type definitions and interfaces
- [ ] In-memory adapter for testing
- [ ] Decision engine with default prompts
- [ ] Basic write/read/update/delete operations
- [ ] Unit tests for core logic

### Phase 2: Storage Adapters (2 weeks)

- [ ] Redis adapter with vector search
- [ ] PostgreSQL adapter with pgvector
- [ ] Adapter health checks and reconnection
- [ ] Integration tests for each adapter

### Phase 3: MCP Integration (1 week)

- [ ] MCP tool definitions
- [ ] MCP server implementation
- [ ] Tool routing and error handling
- [ ] MCP integration tests

### Phase 4: Quality & Observability (1 week)

- [ ] Structured logging for all decisions
- [ ] Health metrics and dashboard
- [ ] Quality benchmarking suite
- [ ] Documentation and examples

### Phase 5: Production Hardening (1 week)

- [ ] Rate limiting and quotas
- [ ] Graceful degradation
- [ ] Security audit
- [ ] Performance optimization

## 9. Security Considerations

### 9.1 Data Protection

- **PII Detection**: Automatically detect and reject sensitive data
- **Content Hashing**: Prevent duplicate storage of identical content
- **Encryption**: Encrypt memories at rest in all adapters
- **Access Control**: Strict user/agent isolation

### 9.2 Prompt Injection Prevention

- **Input Sanitization**: Strip control characters and injection attempts
- **Output Validation**: Validate formatted memories before storage
- **Sandboxed Execution**: Run formatting in isolated context

### 9.3 Privacy Compliance

- **Data Deletion**: Complete removal on forget requests
- **Export**: Allow users to export all their memories
- **Retention Policies**: Configurable TTL for memory expiration

## 10. API Reference

### 10.1 MemoryClient

```typescript
class MemoryClient {
  constructor(config: MemoryClientConfig);
  
  // Core operations
  processAction(input: string, context: DecisionContext): Promise<WriteResult>;
  searchAction(query: string, options?: SearchOptions): Promise<Memory[]>;
  getAction(id: string): Promise<Memory | null>;
  deleteAction(id: string): Promise<void>;
  listAction(options?: ListOptions): Promise<Memory[]>;
  
  // Utilities
  getSystemContract(): string;
  getMCPTools(): MCPTool[];
  formatContextAction(memories: Memory[]): string;
  getHealthAction(): Promise<MemoryHealth>;
  
  // Lifecycle
  initializeAction(): Promise<void>;
  closeAction(): Promise<void>;
}

interface MemoryClientConfig {
  adapter: StorageAdapter;
  embedder: EmbedderConfig;
  userId: string;
  agentId: string;
  prompts?: Partial<PromptTemplates>;
  duplicateThreshold?: number;
  maxMemories?: number;
}
```

## 11. Error Handling

```typescript
class MemoryError extends Error {
  code: MemoryErrorCode;
  details?: Record<string, unknown>;
}

type MemoryErrorCode =
  | "ADAPTER_UNAVAILABLE"
  | "EMBEDDING_FAILED"
  | "MEMORY_NOT_FOUND"
  | "DUPLICATE_DETECTED"
  | "VALIDATION_FAILED"
  | "QUOTA_EXCEEDED"
  | "UNSAFE_CONTENT";

// All operations return results, not throw
// Errors are reserved for infrastructure failures
```

## 12. Testing Strategy

### 12.1 Unit Tests

- Decision engine logic
- Prompt template rendering
- Duplicate detection algorithms
- Memory formatting

### 12.2 Integration Tests

- Each storage adapter
- End-to-end write flows
- MCP tool execution

### 12.3 Quality Tests

- Write gate accuracy on labeled dataset
- Formatting quality scoring
- Retrieval accuracy benchmarks

## 13. Future Enhancements

### 13.1 Advanced Features

- **Hierarchical Memory**: Parent-child relationships
- **Memory Decay**: Automatic relevance scoring over time
- **Cross-Agent Sharing**: Shared memory pools with access control
- **Memory Compression**: Consolidate related memories

### 13.2 Integrations

- **LangChain/LlamaIndex**: Native integration packages
- **Vercel AI SDK**: Middleware support
- **OpenAI Assistants**: Tool compatibility layer

### 13.3 Analytics

- **Memory Usage Dashboard**: Visualize memory patterns
- **Quality Trends**: Track memory health over time
- **A/B Testing**: Compare prompt variations

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**Next Review**: January 2025  
**Owner**: Product Team  
**Stakeholders**: Engineering, AI/ML, Developer Relations

