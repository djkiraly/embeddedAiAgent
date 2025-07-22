const express = require('express');
const router = express.Router();

// Get usage report
router.get('/report', async (req, res) => {
  try {
    const Session = req.app.locals.models.Session;
    const Message = req.app.locals.models.Message;
    
    // Get basic statistics
    const sessions = await Session.getAll(100);
    const usageStats = await Message.getUsageStats();
    
    // Calculate aggregated data
    const totalSessions = sessions.length;
    const totalMessages = sessions.reduce((sum, session) => sum + (session.message_count || 0), 0);
    
    // Model usage breakdown
    const modelUsage = {};
    const dailyUsage = {};
    
    usageStats.forEach(stat => {
      // Model usage
      if (!modelUsage[stat.model]) {
        modelUsage[stat.model] = {
          message_count: 0,
          total_tokens: 0
        };
      }
      modelUsage[stat.model].message_count += stat.message_count;
      modelUsage[stat.model].total_tokens += stat.total_tokens || 0;
      
      // Daily usage
      if (!dailyUsage[stat.date]) {
        dailyUsage[stat.date] = {
          message_count: 0,
          total_tokens: 0,
          models_used: new Set()
        };
      }
      dailyUsage[stat.date].message_count += stat.message_count;
      dailyUsage[stat.date].total_tokens += stat.total_tokens || 0;
      dailyUsage[stat.date].models_used.add(stat.model);
    });
    
    // Convert sets to arrays for JSON serialization
    Object.keys(dailyUsage).forEach(date => {
      dailyUsage[date].models_used = Array.from(dailyUsage[date].models_used);
    });
    
    // Get recent sessions with more details
    const recentSessions = sessions.slice(0, 10).map(session => ({
      id: session.id,
      title: session.title,
      message_count: session.message_count,
      model_used: session.model_used,
      created_at: session.created_at,
      last_message_at: session.last_message_at
    }));
    
    // Calculate average messages per session
    const avgMessagesPerSession = totalSessions > 0 ? (totalMessages / totalSessions).toFixed(2) : 0;
    
    // Get top models by usage
    const topModels = Object.entries(modelUsage)
      .sort(([,a], [,b]) => b.message_count - a.message_count)
      .slice(0, 5)
      .map(([model, stats]) => ({
        model,
        ...stats
      }));
    
    res.json({
      summary: {
        total_sessions: totalSessions,
        total_messages: totalMessages,
        avg_messages_per_session: parseFloat(avgMessagesPerSession),
        total_tokens: Object.values(modelUsage).reduce((sum, model) => sum + (model.total_tokens || 0), 0)
      },
      model_usage: modelUsage,
      top_models: topModels,
      daily_usage: dailyUsage,
      recent_sessions: recentSessions,
      generated_at: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Get detailed session report
router.get('/report/sessions', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const Session = req.app.locals.models.Session;
    const sessions = await Session.getAll(limit + offset);
    
    // Apply pagination
    const paginatedSessions = sessions.slice(offset, offset + limit);
    
    res.json({
      sessions: paginatedSessions,
      pagination: {
        limit,
        offset,
        total: sessions.length,
        has_more: sessions.length > offset + limit
      }
    });
    
  } catch (error) {
    console.error('Sessions report error:', error);
    res.status(500).json({ error: 'Failed to get sessions report' });
  }
});

// Get model usage report
router.get('/report/models', async (req, res) => {
  try {
    const Message = req.app.locals.models.Message;
    const usageStats = await Message.getUsageStats();
    
    const modelStats = {};
    
    usageStats.forEach(stat => {
      if (!modelStats[stat.model]) {
        modelStats[stat.model] = {
          total_messages: 0,
          total_tokens: 0,
          usage_by_date: {},
          first_used: stat.date,
          last_used: stat.date
        };
      }
      
      const modelStat = modelStats[stat.model];
      modelStat.total_messages += stat.message_count;
      modelStat.total_tokens += stat.total_tokens || 0;
      modelStat.usage_by_date[stat.date] = {
        messages: stat.message_count,
        tokens: stat.total_tokens || 0
      };
      
      // Update date range
      if (stat.date < modelStat.first_used) {
        modelStat.first_used = stat.date;
      }
      if (stat.date > modelStat.last_used) {
        modelStat.last_used = stat.date;
      }
    });
    
    res.json({
      model_statistics: modelStats,
      generated_at: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Models report error:', error);
    res.status(500).json({ error: 'Failed to get models report' });
  }
});

// Export data
router.get('/report/export', async (req, res) => {
  try {
    const format = req.query.format || 'json';
    const includeMessages = req.query.include_messages === 'true';
    
    const Session = req.app.locals.models.Session;
    const Message = req.app.locals.models.Message;
    
    const sessions = await Session.getAll(1000); // Export up to 1000 sessions
    
    let exportData = {
      export_date: new Date().toISOString(),
      sessions: sessions
    };
    
    if (includeMessages) {
      const sessionsWithMessages = await Promise.all(
        sessions.map(async (session) => {
          const messages = await Message.getBySessionId(session.id);
          return {
            ...session,
            messages
          };
        })
      );
      exportData.sessions = sessionsWithMessages;
    }
    
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="chat_export_${Date.now()}.json"`);
      res.json(exportData);
    } else {
      res.status(400).json({ error: 'Unsupported export format. Only JSON is supported.' });
    }
    
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

module.exports = router; 