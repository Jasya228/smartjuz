import express from 'express';
import { handleTelegramUpdate, sendMessage } from '../utils/telegramBot.js';
import db from '../db/jsonStore.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Telegram отправляет обновления сюда
router.post('/webhook', async (req, res) => {
  try {
    await handleTelegramUpdate(req.body);
    res.sendStatus(200);
  } catch (e) {
    console.error('Webhook error:', e);
    res.sendStatus(500);
  }
});

// Получить настройки Telegram
router.get('/config', protect, (req, res) => {
  const config = db.getCollection('settings').find({ id: 'telegram' })[0] || {};
  res.json(config);
});

// Сохранить настройки Telegram
router.post('/config', protect, (req, res) => {
  const Settings = db.getCollection('settings');
  const existing = Settings.find({ id: 'telegram' })[0];
  if (existing) {
    Settings.updateById(existing._id, { ...req.body });
  } else {
    Settings.create({ id: 'telegram', ...req.body });
  }
  res.json({ success: true });
});

// Получить список подписчиков бота
router.get('/users', protect, (req, res) => {
  res.json(db.getCollection('tg_users').find({}));
});

// Удалить подписчика
router.delete('/users/:id', protect, (req, res) => {
  db.getCollection('tg_users').deleteById(req.params.id);
  res.json({ success: true });
});

// Массовая рассылка (Broadcast)
router.post('/broadcast', protect, async (req, res) => {
  const { text, audience } = req.body;
  const users = db.getCollection('tg_users').find({ status: 'active' });
  let count = 0;
  for (const u of users) {
    if (audience === 'all' || u.role === audience) {
       await sendMessage(u.chatId, `📢 <b>Объявление:</b>\n\n${text}`);
       count++;
    }
  }
  res.json({ success: true, count });
});

export default router;
