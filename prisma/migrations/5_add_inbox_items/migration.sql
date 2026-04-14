-- Migration: Add InboxItem table for capture box feature
-- Note: SQLite requires foreign key constraints to be defined in CREATE TABLE

CREATE TABLE inbox_items (
    id TEXT NOT NULL PRIMARY KEY,
    content TEXT NOT NULL,
    userId TEXT NOT NULL,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    convertedToTodoId TEXT,
    convertedAt TEXT,

    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for efficient queries
CREATE INDEX inbox_items_userId_createdAt_idx ON inbox_items(userId, createdAt);
CREATE INDEX inbox_items_userId_convertedToTodoId_idx ON inbox_items(userId, convertedToTodoId);
