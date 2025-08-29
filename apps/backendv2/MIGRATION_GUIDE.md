# Convex to PostgreSQL Migration Guide

## Overview
This document outlines the key differences between the Convex schema and the new PostgreSQL/Drizzle schema, along with migration considerations.

## Key Schema Changes

### 1. ID Types
- **Convex**: Uses string-based document IDs (`Id<"tableName">`)
- **PostgreSQL**: Uses UUIDs (`uuid`)
- **Migration**: Need to generate new UUIDs for all records during migration

### 2. Foreign Key Constraints
- **Convex**: No native foreign key support, relationships managed in application code
- **PostgreSQL**: Proper foreign key constraints with cascade options
- **Benefits**: 
  - Database-enforced referential integrity
  - Automatic cascade deletes where appropriate
  - Better query optimization

### 3. Array Fields Normalization
Several array fields have been normalized into separate tables:

#### Pinned Messages
- **Convex**: `channels.pinnedMessages` array
- **PostgreSQL**: `pinned_messages` table with foreign keys
- **Benefits**: Easier to query, update individual pins, track who pinned what

#### Message Reactions
- **Convex**: `messages.reactions` array
- **PostgreSQL**: `message_reactions` table
- **Benefits**: Efficient reaction queries, user-specific reaction management

#### Message Attachments
- **Convex**: `messages.attachedFiles` array
- **PostgreSQL**: `message_attachments` junction table
- **Benefits**: Better attachment management, reusable attachments

### 4. Direct Message Channel Deduplication
- **Convex**: Used `participantHash` pattern (sorted user IDs concatenated)
- **PostgreSQL**: `direct_message_participants` table with unique constraints
- **Benefits**: 
  - Proper relational model
  - Can use database constraints for uniqueness
  - Easier to query participants

### 5. Soft Deletes
- **Convex**: `deletedAt` timestamp fields
- **PostgreSQL**: Same pattern maintained with partial indexes
- **Benefits**: Unique constraints only apply to non-deleted records

### 6. Timestamps
- **Convex**: Stores as numbers (Unix timestamps)
- **PostgreSQL**: Native timestamp columns
- **Migration**: Convert Unix timestamps to PostgreSQL timestamps

### 7. Settings/JSON Fields
- **Convex**: Structured objects in schema
- **PostgreSQL**: Currently stored as text, can migrate to JSONB
- **Future**: Consider using PostgreSQL JSONB for better querying

## Migration Steps

### 1. Data Export from Convex
```typescript
// Export all data from Convex
const organizations = await ctx.db.query("organizations").collect()
const users = await ctx.db.query("users").collect()
const channels = await ctx.db.query("channels").collect()
// ... export all tables
```

### 2. Data Transformation
```typescript
// Transform Convex data to PostgreSQL format
function transformUser(convexUser) {
  return {
    id: generateUUID(), // Generate new UUID
    externalId: convexUser.externalId,
    email: convexUser.email,
    firstName: convexUser.firstName,
    lastName: convexUser.lastName,
    avatarUrl: convexUser.avatarUrl,
    status: convexUser.status,
    lastSeen: new Date(convexUser.lastSeen),
    settings: JSON.stringify(convexUser.settings || {}),
    createdAt: new Date(convexUser._creationTime),
    updatedAt: convexUser.updatedAt ? new Date(convexUser.updatedAt) : null,
    deletedAt: convexUser.deletedAt ? new Date(convexUser.deletedAt) : null,
  }
}

// Create mapping tables for ID conversions
const idMapping = new Map()
users.forEach(user => {
  idMapping.set(user._id, generateUUID())
})
```

### 3. Handle Normalized Arrays
```typescript
// Extract reactions from messages
const messageReactions = []
messages.forEach(message => {
  message.reactions?.forEach(reaction => {
    messageReactions.push({
      id: generateUUID(),
      messageId: idMapping.get(message._id),
      userId: idMapping.get(reaction.userId),
      emoji: reaction.emoji,
      createdAt: new Date(),
    })
  })
})

// Extract pinned messages from channels
const pinnedMessages = []
channels.forEach(channel => {
  channel.pinnedMessages?.forEach(pin => {
    pinnedMessages.push({
      id: generateUUID(),
      channelId: idMapping.get(channel._id),
      messageId: idMapping.get(pin.messageId),
      pinnedBy: idMapping.get(pin.pinnedBy),
      pinnedAt: new Date(pin.pinnedAt),
    })
  })
})
```

### 4. Handle Direct Message Channels
```typescript
// Create direct message participants from channels
const dmParticipants = []
channels.filter(c => c.type === 'direct' && c.participantHash).forEach(channel => {
  const userIds = channel.participantHash.split(':')
  userIds.forEach(userId => {
    dmParticipants.push({
      id: generateUUID(),
      channelId: idMapping.get(channel._id),
      userId: idMapping.get(userId),
      organizationId: idMapping.get(channel.organizationId),
    })
  })
})
```

## Real-time Considerations

### 1. Presence System
- **Convex**: Uses @convex-dev/presence component
- **PostgreSQL**: Presence table with heartbeat timestamps
- **Solution**: 
  - Use PostgreSQL LISTEN/NOTIFY for real-time updates
  - Or integrate with external pub/sub (Redis, etc.)
  - Clean up stale presence records with cron job

### 2. Typing Indicators
- **Convex**: Ephemeral data with automatic cleanup
- **PostgreSQL**: Regular table with timestamp-based cleanup
- **Solution**: 
  - Background job to clean old indicators
  - Use LISTEN/NOTIFY for real-time updates

### 3. Subscriptions
- **Convex**: Built-in real-time subscriptions
- **PostgreSQL**: Need external solution
- **Options**:
  - PostgreSQL LISTEN/NOTIFY with WebSockets
  - Supabase Realtime
  - Custom WebSocket server with database triggers
  - GraphQL subscriptions

## Performance Optimizations

### 1. Indexes
All necessary indexes have been added:
- Primary keys on all tables
- Foreign key indexes for joins
- Composite indexes for common queries
- Partial indexes for soft deletes

### 2. Query Patterns
Common queries to optimize:
```sql
-- Get channels for a user in an organization
SELECT c.* FROM channels c
JOIN channel_members cm ON c.id = cm.channel_id
WHERE cm.user_id = ? AND c.organization_id = ?
AND c.deleted_at IS NULL AND cm.deleted_at IS NULL;

-- Get messages with reactions and attachments
SELECT m.*, 
  json_agg(DISTINCT r.*) as reactions,
  json_agg(DISTINCT a.*) as attachments
FROM messages m
LEFT JOIN message_reactions r ON m.id = r.message_id
LEFT JOIN message_attachments ma ON m.id = ma.message_id
LEFT JOIN attachments a ON ma.attachment_id = a.id
WHERE m.channel_id = ?
GROUP BY m.id
ORDER BY m.created_at DESC
LIMIT 50;
```

### 3. Partitioning Considerations
For large-scale deployments:
- Partition `messages` table by `created_at` (monthly/yearly)
- Partition `typing_indicators` by `last_typed` for easy cleanup
- Archive old messages to separate tables

## Application Code Changes

### 1. Query Syntax
```typescript
// Convex
const messages = await ctx.db
  .query("messages")
  .withIndex("by_channelId", q => q.eq("channelId", channelId))
  .collect()

// Drizzle
const messages = await db
  .select()
  .from(messagesTable)
  .where(eq(messagesTable.channelId, channelId))
```

### 2. Transactions
```typescript
// PostgreSQL supports proper transactions
await db.transaction(async (tx) => {
  const channelId = await tx.insert(channelsTable).values(channelData).returning()
  await tx.insert(channelMembersTable).values(memberData)
})
```

### 3. Joins
```typescript
// Can now use proper SQL joins
const channelsWithMembers = await db
  .select()
  .from(channelsTable)
  .leftJoin(channelMembersTable, eq(channelsTable.id, channelMembersTable.channelId))
  .where(eq(channelMembersTable.userId, userId))
```

## Testing Migration

1. Set up test PostgreSQL database
2. Run migration script on sample data
3. Verify data integrity:
   - All relationships maintained
   - No orphaned records
   - Timestamps converted correctly
   - Arrays properly normalized
4. Test application functionality:
   - Message sending/receiving
   - Channel operations
   - Real-time features
   - File uploads

## Rollback Plan

1. Keep Convex running in parallel during migration
2. Implement dual-write temporarily (write to both systems)
3. Gradually migrate read operations
4. Once stable, remove Convex dependencies

## Benefits of PostgreSQL Migration

1. **Cost**: Potentially lower infrastructure costs
2. **Flexibility**: Full SQL capabilities, complex queries
3. **Ecosystem**: Vast ecosystem of tools and libraries
4. **Control**: Full control over database optimization
5. **Portability**: Can self-host or use any PostgreSQL provider
6. **Features**: Advanced PostgreSQL features (JSONB, full-text search, etc.)
7. **Scaling**: Proven scaling patterns (read replicas, partitioning)

## Challenges to Address

1. **Real-time**: Need to implement real-time infrastructure
2. **Migrations**: Manual schema migrations vs Convex's automatic handling
3. **Type Safety**: Ensure type safety with Drizzle ORM
4. **Deployment**: More complex deployment process
5. **Monitoring**: Need to set up database monitoring