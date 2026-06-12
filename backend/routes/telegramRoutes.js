import express from 'express';
import { handleTelegramUpdate } from '../utils/telegramBot.js';

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

export default router;
