---
name: Kafka Consumer & Producer Patterns
description: How to produce messages, consume with acknowledgment, handle failures, and coordinate consumer groups
type: reference
originSessionId: bbfa8ec4-697b-469f-9e09-efa15153699e
---
## Kafka Integration — Complete Pattern

### Producer Pattern (Publishing Events)

```javascript
// src/services/kafka/kafkaProducer.service.js

class KafkaProducer {
  constructor() {
    this.kafka = new Kafka({
      clientId: 'onehermes-producer',
      brokers: process.env.KAFKA_BROKERS.split(','),
      ssl: true,
      sasl: {
        mechanism: 'plain',
        username: process.env.KAFKA_USERNAME,
        password: process.env.KAFKA_PASSWORD
      }
    });
    this.producer = this.kafka.producer();
  }

  async connect() {
    await this.producer.connect();
  }

  async publishEvent(topic, event) {
    try {
      const result = await this.producer.send({
        topic,
        messages: [
          {
            key: event.aggregateId || event.id, // For partitioning
            value: JSON.stringify(event),
            timestamp: Date.now().toString(),
            headers: {
              'event-type': Buffer.from(event.type),
              'tenant-id': Buffer.from(event.tenantId)
            }
          }
        ],
        timeout: 30000,
        compression: 1 // Gzip
      });
      
      logger.info(`Event published: ${topic}`, { event, result });
      return result;
    } catch (error) {
      logger.error(`Failed to publish event: ${topic}`, { event, error });
      throw error; // Let caller decide retry strategy
    }
  }

  async disconnect() {
    await this.producer.disconnect();
  }
}

module.exports = new KafkaProducer();
```

**Usage in service:**
```javascript
// src/services/expense/expense.service.js
async createExpense(req) {
  const expense = await expenseModel.create(req.body);
  
  // Publish event
  await kafkaProducer.publishEvent('expense.created', {
    id: expense._id,
    aggregateId: expense._id,
    type: 'ExpenseCreated',
    tenantId: req.tenantContext.realm,
    data: expense,
    timestamp: new Date()
  });
  
  return expense;
}
```

### Consumer Pattern (Processing Events)

```javascript
// src/services/kafka/kafkaConsumer.service.js

class KafkaConsumer {
  constructor() {
    this.kafka = new Kafka({
      clientId: 'onehermes-consumer',
      brokers: process.env.KAFKA_BROKERS.split(','),
      ssl: true,
      sasl: {
        mechanism: 'plain',
        username: process.env.KAFKA_USERNAME,
        password: process.env.KAFKA_PASSWORD
      }
    });
  }

  async startConsuming(topic, groupId, messageHandler) {
    const consumer = this.kafka.consumer({
      groupId, // Identifies consumer group
      allowAutoTopicCreation: false,
      sessionTimeout: 30000,
      rebalanceTimeout: 60000
    });

    await consumer.connect();
    await consumer.subscribe({
      topic,
      fromBeginning: false // Start from latest (not old messages)
    });

    await consumer.run({
      autoCommit: false, // Manual offset management
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const event = JSON.parse(message.value.toString());
          const tenantId = message.headers['tenant-id'].toString();
          
          // Process the event
          await messageHandler(event, tenantId);
          
          // Commit offset AFTER successful processing
          await consumer.commitOffsets([{
            topic,
            partition,
            offset: (parseInt(message.offset) + 1).toString()
          }]);
          
          logger.info(`Message processed: ${topic}/${partition}/${message.offset}`);
        } catch (error) {
          logger.error(`Error processing message`, { error, message });
          // Don't commit — message will be retried
          // After max retries, send to DLQ
          await this.sendToDLQ(message, error);
        }
      }
    });
  }

  async sendToDLQ(message, error) {
    const dlqTopic = `${message.topic}.dlq`;
    const dlqMessage = {
      original: message,
      error: error.message,
      timestamp: new Date(),
      retries: parseInt(message.headers['x-retry-count']?.toString() || '0') + 1
    };
    
    await kafkaProducer.publishEvent(dlqTopic, dlqMessage);
    logger.error(`Message sent to DLQ`, { dlqMessage });
  }
}

module.exports = new KafkaConsumer();
```

**Start consumer in app.js:**
```javascript
// src/index.js
const kafkaConsumer = require('./services/kafka/kafkaConsumer.service');
const handleExpenseEvent = require('./services/expense/expenseEventHandler');

async function startServices() {
  // Start API server
  app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));

  // Start Kafka consumer
  await kafkaConsumer.startConsuming(
    'expense.created',
    'onehermes-expense-service',
    handleExpenseEvent
  );
}

startServices().catch(error => {
  logger.error('Failed to start services', error);
  process.exit(1);
});
```

### Consumer Group Coordination

**Multiple instances of same consumer:**

```javascript
// instance-1.js and instance-2.js (both running)
const consumer = kafka.consumer({ groupId: 'onehermes-expense-service' });

// Kafka automatically distributes partitions:
// If topic has 3 partitions, instance-1 gets 2, instance-2 gets 1
// If instance-1 crashes, instance-2 takes over all 3
```

**Rebalancing (when instance joins/leaves):**
- Pauses all consumption
- Reassigns partitions
- Resumes from last committed offset
- Takes 10-30 seconds

### Offset Management

**Auto-commit (NOT RECOMMENDED):**
```javascript
// Risky: offset committed before message fully processed
await consumer.run({ autoCommit: true });
```

**Manual commit (RECOMMENDED):**
```javascript
// Safe: offset committed only AFTER successful processing
await consumer.run({
  autoCommit: false,
  eachMessage: async ({ message, partition, topic }) => {
    try {
      await processMessage(message);
      await consumer.commitOffsets([{
        topic,
        partition,
        offset: (parseInt(message.offset) + 1).toString()
      }]);
    } catch (error) {
      // Don't commit — message will be retried
    }
  }
});
```

**Offset reset scenarios:**
```bash
# Lost all offset history? Reset to earliest
kafka-consumer-groups --bootstrap-server localhost:9092 \
  --group onehermes-expense-service \
  --topic expense.created \
  --reset-offsets --to-earliest --execute

# Reset to specific timestamp
kafka-consumer-groups --bootstrap-server localhost:9092 \
  --group onehermes-expense-service \
  --topic expense.created \
  --reset-offsets --to-datetime 2026-04-28T10:00:00 --execute
```

### Dead Letter Queue (DLQ) Pattern

**When messages consistently fail:**

```javascript
const DLQ_TOPIC = 'expense.created.dlq';
const MAX_RETRIES = 5;

async function eachMessage({ topic, partition, message }) {
  let retries = parseInt(message.headers['x-retry-count']?.toString() || '0');
  
  try {
    await processExpenseEvent(message);
    await commitOffset();
  } catch (error) {
    if (retries < MAX_RETRIES) {
      // Retry: send back to main topic with retry count
      await kafkaProducer.publishEvent(topic, {
        ...message.value,
        headers: {
          ...message.headers,
          'x-retry-count': (retries + 1).toString(),
          'x-last-error': error.message
        }
      });
    } else {
      // Exhausted retries: move to DLQ
      await kafkaProducer.publishEvent(DLQ_TOPIC, {
        originalMessage: message.value,
        error: error.message,
        retries,
        timestamp: new Date()
      });
      logger.error(`Message moved to DLQ after ${MAX_RETRIES} retries`);
    }
  }
}
```

### Common Kafka Issues & Fixes

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Consumer lag | Processing too slow or messages pile up | Scale consumers, optimize handler, check DB queries |
| 401 Auth error | Bad credentials | Check KAFKA_USERNAME/PASSWORD env vars |
| Topic doesn't exist | Typo or topic never created | Create topic: `kafka-topics --create --topic ... --partitions 3` |
| Message lost | Offset not committed | Use manual commit, don't skip on errors |
| Consumer not starting | Connection timeout | Check KAFKA_BROKERS URL, firewall, SSL certificates |
| One partition stuck | Poison message (always fails) | Send poison message to DLQ, reset offset |
| Consumer group lagging | Consumer stopped or slow | Check consumer logs, restart if hung |

### Testing Kafka Integration

```bash
# Start Kafka locally (Docker)
docker-compose up -d kafka

# Create topic
kafka-topics --create --topic expense.created --partitions 3 --replication-factor 1 \
  --bootstrap-server localhost:9092

# Produce test message
echo '{"id":"123","type":"ExpenseCreated","data":{...}}' | \
  kafka-console-producer --topic expense.created --broker-list localhost:9092

# Consume messages
kafka-console-consumer --topic expense.created --from-beginning \
  --bootstrap-server localhost:9092

# Check consumer group status
kafka-consumer-groups --bootstrap-server localhost:9092 \
  --group onehermes-expense-service --describe
```

### Key Takeaways

✅ Use manual commit (not auto-commit)  
✅ One committed offset per successfully processed message  
✅ Consumer group automatically scales/rebalances  
✅ Implement DLQ for messages exceeding retry limit  
✅ Include tenant-id/aggregate-id in headers for tracing  
✅ Log offset positions for debugging lag  
✅ Test with real Kafka (not mock), especially rebalancing  
