import dotenv from 'dotenv';
dotenv.config();
import { sendTelegramMessage } from './utils/telegramService.js';

async function test() {
  console.log("Sending test msg to", process.env.TELEGRAM_CHAT_ID);
  await sendTelegramMessage("🤖 Test from backend directly!");
  console.log("Done");
}
test();
