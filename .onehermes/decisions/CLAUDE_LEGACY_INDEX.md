# Claude Legacy Context Index

*Extracted from `C:\Users\Admin\.claude\history.jsonl`*

## 1. Architectural Decisions & Patterns

### Atomic Transactions (Mongoose Sessions)
- **Mandatory for Multi-Document Ops**: All bidirectional operations and linked entity operations (e.g., creating connections between two organizations) **must** utilize atomic MongoDB transactions. 
- *Implementation Standard*: `mongoose.startSession()`, `session.startTransaction()`. Ensure that if any single operation fails across the batch, it triggers `session.abortTransaction()`.

### Aggregation over Node Processing
- **Rollups in DB**: Complex status queries and recalculations (e.g., determining an individual's active vs. inactive company using `endDate`) must use the MongoDB Aggregation Pipeline (using `$facet`, `$unwind`, and `$match`) rather than fetching raw arrays into the Node layer for filtering.

### Backend-Driven Dynamic Queries
- **Delegating Logic**: Dynamic data processing and flat-row formatting initially done in Angular (e.g., `entity-data-table`) is continually being moved natively into the MongoDB backend, allowing the backend to own the `table preference` queries explicitly based on schema configuration.

## 2. Coding & Validation Styles

### Schema Constraints
- **Strict XOR Validation**: When referring to polymorphic references (e.g., an entity can be connected to either an Organization OR an Individual), the structure enforces strict XOR logic. A connection MUST have one or the other, never both, never neither.
- **Joi Integration**: The `organization.validation.js` relies strictly on custom Joi validators (`Joi.alternatives()`) to run logic parity checks against the Mongoose `strict: false` schemas before persistence.

### Indexing Strategies
- **Compound and Target Indexing**: All foreign keys and query parameters hidden inside nested object arrays (like `connections.connectedIndividualId` and `connections.endDate`) must receive explicit `.index()` calls directly inside the schema definition to guarantee read speeds on large relation queries.
