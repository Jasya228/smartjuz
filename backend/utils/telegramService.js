/**
 * Telegram Service — обертка для отправки сообщений и фото.
 */
import axios from 'axios';
import FormData from 'form-data';

export const sendTelegramMessage = async (text) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  try {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: 'HTML'
    });
  } catch (error) {
    console.error('Telegram Message Error:', error.message);
  }
};

export const sendTelegramPhoto = async (chatIds, base64Image, caption) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatIds || chatIds.length === 0) return;

  try {
    // Извлекаем base64 данные
    const matches = base64Image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return;
    
    const imageBuffer = Buffer.from(matches[2], 'base64');

    for (const chatId of chatIds) {
      try {
        console.log(`📤 [TG PHOTO]: Отправка фото на ${chatId}...`);
        const form = new FormData();
        form.append('chat_id', chatId);
        form.append('caption', caption);
        form.append('parse_mode', 'HTML');
        form.append('photo', imageBuffer, { filename: 'threat.jpg', contentType: 'image/jpeg' });

        const resp = await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, form, { 
          headers: form.getHeaders(),
          timeout: 10000 
        });
        
        if (resp.data && resp.data.ok) {
          console.log(`✅ [TG PHOTO SUCCESS]: Фото доставлено в ${chatId}`);
        } else {
          console.warn(`⚠️ [TG PHOTO WARN]: Ошибка для ${chatId}:`, resp.data);
        }
      } catch (err) {
        console.error(`❌ [TG PHOTO ERROR]: Ошибка для ${chatId}:`, err.response?.data || err.message);
      }
    }
  } catch (error) {
    console.error('Telegram Global Photo Error:', error.message);
  }
};
