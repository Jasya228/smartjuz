import axios from 'axios';

async function test() {
  const token = '8949733119:AAGamzc-OyQFxqOrmh7xiGHv79x2p7X8wHE';
  const chatId = '6084511754';
  
  try {
    const res = await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: '🤖 Тестовое сообщение от SmartFace ID!'
    });
    console.log('SUCCESS:', res.data);
  } catch (err) {
    console.error('ERROR:', err.response ? err.response.data : err.message);
  }
}

test();
