import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import axios from 'axios';
import fs from 'fs';

// --- DEBUG LOGGING ---
const logStream = fs.createWriteStream('./debug.log', { flags: 'a' });
const origLog = console.log;
const origError = console.error;
const origWarn = console.warn;
console.log = function(...args) {
  logStream.write(new Date().toISOString() + ' [INFO] ' + args.join(' ') + '\n');
  origLog.apply(console, args);
};
console.error = function(...args) {
  logStream.write(new Date().toISOString() + ' [ERROR] ' + args.join(' ') + '\n');
  origError.apply(console, args);
};
console.warn = function(...args) {
  logStream.write(new Date().toISOString() + ' [WARN] ' + args.join(' ') + '\n');
  origWarn.apply(console, args);
};
// ---------------------

dotenv.config();

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }));
// helmet убран — в локальной разработке не нужен
app.use(morgan('dev'));

import studentRoutes from './routes/studentRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import securityRoutes from './routes/securityRoutes.js';
import telegramRoutes from './routes/telegramRoutes.js';

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/security/threats', securityRoutes);
app.use('/api/telegram', telegramRoutes);

// Настройка групп и персонала (хранится в JSON)
import db from './db/jsonStore.js';
const Config = db.getCollection('config');

app.get('/api/config', (req, res) => {
  const Config = db.getCollection('config');
  const cfg = Config.findOne({ key: 'main' }) || { key: 'main', groups: [], staffRoles: [] };
  res.json(cfg);
});

app.post('/api/config', (req, res) => {
  try {
    const Config = db.getCollection('config');
    const newConfig = {
      _id: 'config_main',
      key: 'main',
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    Config.data = [newConfig];
    Config._save();
    console.log('✅ [CONFIG SAVED]:', newConfig);
    res.status(200).json(newConfig);
  } catch (err) {
    console.error('❌ [CONFIG ERROR]:', err);
    res.status(500).json({ message: err.message });
  }
});

console.log('✅ Роуты /api/config зарегистрированы');

app.get('/', (req, res) => {
  res.send('Smart Juz Face ID API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  // Регистрируем webhook в Telegram
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;

  if (token && webhookUrl) {
    try {
      await axios.post(`https://api.telegram.org/bot${token}/setWebhook`, {
        url: `${webhookUrl}/api/telegram/webhook`
      });
      console.log(`✅ Telegram Webhook set: ${webhookUrl}/api/telegram/webhook`);
    } catch (e) {
      console.log('⚠️  Telegram Webhook not set. Use polling mode.');
    }
  } else {
    console.log('ℹ️  TELEGRAM_WEBHOOK_URL not set — forcing Polling mode.');
    if (token) {
      try {
        // Принудительно удаляем старый вебхук, чтобы Polling заработал
        await axios.get(`https://api.telegram.org/bot${token}/deleteWebhook`);
        console.log('🧹 [TG]: Old webhook deleted for polling.');
      } catch (err) {
        console.log('⚠️ [TG]: Could not delete webhook:', err.message);
      }
      startPolling(token);
    }
  }
});

// Long polling fallback для localhost
let pollOffset = 0;
const startPolling = async (token) => {
  const { handleTelegramUpdate } = await import('./utils/telegramBot.js');
  const poll = async () => {
    try {
      const resp = await axios.get(`https://api.telegram.org/bot${token}/getUpdates`, {
        params: { offset: pollOffset, timeout: 30 },
        timeout: 35000
      });
      const updates = resp.data?.result || [];
      for (const update of updates) {
        pollOffset = update.update_id + 1;
        await handleTelegramUpdate(update);
      }
    } catch (e) {
      if (!e.code?.includes('ECONNABORTED')) {
        console.error('Polling error:', e.message);
      }
    }
    poll();
  };
  poll();
  console.log('🤖 Telegram Bot polling started...');
};
