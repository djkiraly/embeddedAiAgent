const { v4: uuidv4 } = require('uuid');

class Session {
  constructor(db) {
    this.db = db;
  }

  create(title = null, modelUsed = null) {
    return new Promise((resolve, reject) => {
      const id = uuidv4();
      const sql = `
        INSERT INTO sessions (id, title, model_used) 
        VALUES (?, ?, ?)
      `;
      
      this.db.run(sql, [id, title, modelUsed], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id,
            title,
            model_used: modelUsed,
            created_at: new Date().toISOString()
          });
        }
      });
    });
  }

  getAll(limit = 50) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT s.*, 
               COUNT(m.id) as message_count,
               MAX(m.timestamp) as last_message_at
        FROM sessions s
        LEFT JOIN messages m ON s.id = m.session_id
        GROUP BY s.id
        ORDER BY s.updated_at DESC
        LIMIT ?
      `;
      
      this.db.all(sql, [limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  getById(id) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT s.*,
               COUNT(m.id) as message_count
        FROM sessions s
        LEFT JOIN messages m ON s.id = m.session_id
        WHERE s.id = ?
        GROUP BY s.id
      `;
      
      this.db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  update(id, updates) {
    return new Promise((resolve, reject) => {
      const fields = Object.keys(updates);
      const values = Object.values(updates);
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      
      const sql = `
        UPDATE sessions 
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
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
      // First delete associated messages
      this.db.run('DELETE FROM messages WHERE session_id = ?', [id], (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Then delete the session
        this.db.run('DELETE FROM sessions WHERE id = ?', [id], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ changes: this.changes });
          }
        });
      });
    });
  }
}

module.exports = Session; 