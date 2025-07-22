const { v4: uuidv4 } = require('uuid');

class Message {
  constructor(db) {
    this.db = db;
  }

  create(sessionId, content, role, model = null, tokenCount = 0, contentType = 'text', imageMetadata = null) {
    return new Promise((resolve, reject) => {
      const id = uuidv4();
      const sql = `
        INSERT INTO messages (id, session_id, content, role, model, token_count, content_type, image_metadata) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const imageMetaString = imageMetadata ? JSON.stringify(imageMetadata) : null;
      
      this.db.run(sql, [id, sessionId, content, role, model, tokenCount, contentType, imageMetaString], function(err) {
        if (err) {
          reject(err);
        } else {
          // Update session's updated_at timestamp
          const updateSessionSql = `
            UPDATE sessions 
            SET updated_at = CURRENT_TIMESTAMP, model_used = COALESCE(?, model_used)
            WHERE id = ?
          `;
          
          resolve({
            id,
            session_id: sessionId,
            content,
            role,
            model,
            token_count: tokenCount,
            content_type: contentType,
            image_metadata: imageMetadata,
            timestamp: new Date().toISOString()
          });
        }
      });
    });
  }

  getBySessionId(sessionId, limit = 100) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM messages 
        WHERE session_id = ? 
        ORDER BY timestamp ASC
        LIMIT ?
      `;
      
      this.db.all(sql, [sessionId, limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // Parse image metadata for rows that have it
          const processedRows = rows.map(row => ({
            ...row,
            content_type: row.content_type || 'text', // Default for existing messages
            image_metadata: row.image_metadata ? JSON.parse(row.image_metadata) : null
          }));
          resolve(processedRows);
        }
      });
    });
  }

  getById(id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM messages WHERE id = ?';
      
      this.db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          if (row) {
            row.content_type = row.content_type || 'text';
            row.image_metadata = row.image_metadata ? JSON.parse(row.image_metadata) : null;
          }
          resolve(row);
        }
      });
    });
  }

  update(id, updates) {
    return new Promise((resolve, reject) => {
      // Handle image_metadata serialization if it's being updated
      if (updates.image_metadata && typeof updates.image_metadata === 'object') {
        updates.image_metadata = JSON.stringify(updates.image_metadata);
      }
      
      const fields = Object.keys(updates);
      const values = Object.values(updates);
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      
      const sql = `UPDATE messages SET ${setClause} WHERE id = ?`;
      
      this.db.run(sql, [...values, id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  delete(id) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM messages WHERE id = ?';
      
      this.db.run(sql, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  getUsageStats() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          model,
          COUNT(*) as message_count,
          SUM(token_count) as total_tokens,
          DATE(timestamp) as date,
          content_type
        FROM messages 
        WHERE role = 'assistant'
        GROUP BY model, DATE(timestamp), content_type
        ORDER BY date DESC
      `;
      
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}

module.exports = Message; 