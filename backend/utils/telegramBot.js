/**
 * Telegram Bot Service - Полноценный бот с регистрацией пользователей
 * 
 * Роли в системе:
 *   admin    - видит всё, выбирает фильтры
 *   curator  - видит только свою группу
 *   parent   - видит только своего ребёнка
 * 
 * Безопасность: пользователи регистрируются только через секретный код
 */

import axios from 'axios';
import FormData from 'form-data';
import db from '../db/jsonStore.js';

const BOT_TOKEN = () => process.env.TELEGRAM_BOT_TOKEN;
const API_URL = () => `https://api.telegram.org/bot${BOT_TOKEN()}`;

// Коллекции
const TgUsers = db.getCollection('tg_users');
const Student = db.getCollection('students');
const Attendance = db.getCollection('attendance');

// --- Утилиты для отправки ---

export const sendMessage = async (chatId, text, extra = {}) => {
  try {
    console.log(`📤 [TG SEND]: Отправка на ${chatId}...`);
    const resp = await axios.post(`${API_URL()}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      ...extra
    });
    if (resp.data && resp.data.ok) {
      console.log(`✅ [TG SUCCESS]: Сообщение улетело в облако TG для ${chatId}. MsgID: ${resp.data.result?.message_id}`);
    } else {
      console.warn(`⚠️ [TG WARN]: Телеграм вернул странный ответ для ${chatId}:`, resp.data);
    }
  } catch (e) {
    console.error(`❌ [TG ERROR]: Ошибка отправки на ${chatId}:`, e.response?.data || e.message);
  }
};

const sendMessageWithKeyboard = (chatId, text, buttons) => {
  return sendMessage(chatId, text, {
    reply_markup: {
      inline_keyboard: buttons
    }
  });
};

// --- Уведомление подписчиков при скане ---

export const notifySubscribers = async (person) => {
  const token = BOT_TOKEN();
  if (!token) {
    console.error('❌ Ошибка: BOT_TOKEN не найден в .env');
    return;
  }

  // 1. Сначала принудительно обновляем данные из файлов
  TgUsers._load();
  const allUsers = TgUsers.find({ status: 'active' });
  
  const type = person.roleType || 'Студент';
  const info = person.group || person.department || '-';
  const now = new Date();
  const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('ru-RU');

  let emoji = '👨‍🎓';
  if (type === 'Преподаватель') emoji = '👨‍🏫';
  if (type === 'Сотрудник') emoji = '👨‍🔧';

  const text = `✅ <b>Вход зафиксирован</b>\n\n👤 ${type}: <b>${person.fullName}</b>\n📌 Группа: ${info}\n🕒 Время: ${timeStr}`;

  // Множество для отслеживания тех, кому уже отправили (чтобы не спамить)
  const sentChatIds = new Set();

  // 2. Всегда шлём в основной чат (если указан в .env)
  const mainChatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (mainChatId) {
    console.log(`📡 Попытка отправки в основной чат: ${mainChatId}`);
    await sendMessage(mainChatId, text);
    sentChatIds.add(String(mainChatId));
  }

  // 3. Рассылка по всем зарегистрированным в базе
  console.log(`👥 Начинаю рассылку. Всего активных в базе: ${allUsers.length}`);
  
  for (const user of allUsers) {
    const uChatId = String(user.chatId || '').trim();
    if (!uChatId) continue;
    
    // Если это админский чат из env, мы ему уже отправили в пункте 2
    if (uChatId === mainChatId) {
      console.log(`⏭️ Пропуск ${user.name} (уже отправлено как в основной чат)`);
      continue;
    }

    if (sentChatIds.has(uChatId)) continue;

    let shouldNotify = false;
    let reason = '';

    if (user.role === 'admin') {
      shouldNotify = true; // Админам шлем всё для контроля
      reason = 'Admin Override';
    } 
    else if (user.role === 'curator') {
      const pGroup = String(person.group || '').trim().toUpperCase();
      const uGroup = String(user.assignedGroup || '').trim().toUpperCase();
      shouldNotify = (pGroup === uGroup);
      reason = `Curator match: ${uGroup} vs ${pGroup}`;
    } 
    else if (user.role === 'parent') {
      const pId = String(person.studentId || '').trim().toUpperCase();
      const uId = String(user.assignedChildId || '').trim().toUpperCase();
      
      shouldNotify = (pId === uId);
      reason = `Parent match: ${uId} vs ${pId}`;
    }

    if (shouldNotify) {
      console.log(`📨 [NOTIFY]: ${user.name} (${user.role}) -> ${uChatId}. Причина: ${reason}`);
      await sendMessage(uChatId, text);
      sentChatIds.add(uChatId);
    }
  }
};

// --- Состояние диалогов (в памяти) ---
const dialogState = {};

// --- Обработчик входящих сообщений ---

export const handleTelegramUpdate = async (update) => {
  const token = BOT_TOKEN();
  if (!token) return;

  // Обработка callback_query (нажатие кнопок)
  if (update.callback_query) {
    await handleCallback(update.callback_query);
    return;
  }

  if (!update.message) return;

  const msg = update.message;
  const chatId = msg.chat.id;
  const text = msg.text?.trim() || '';
  const firstName = msg.from?.first_name || 'Пользователь';

  console.log(`📩 [TG INCOMING]: Сообщение от ${firstName} (${chatId}): "${text}"`);

  // Проверяем существующего пользователя
  const existingUser = TgUsers.findOne({ chatId: String(chatId) });

  // Команды
  if (text === '/start') {
    dialogState[chatId] = { step: 'awaiting_code' };
    await sendMessage(chatId, `👋 Привет, <b>${firstName}</b>!\n\nДобро пожаловать в <b>SmartFace ID</b> — систему контроля посещаемости Политехнического Колледжа.\n\n🔐 Введите <b>секретный код доступа</b> для регистрации в системе:`);
    return;
  }

  // /test — проверка связи и подписки
  if (text === '/test') {
    if (existingUser?.status === 'active') {
      let detail = '';
      if (existingUser.role === 'parent') {
        detail = `\n\n👶 Вы подписаны на: <b>${existingUser.childName?.trim()}</b>\n🆔 ID: <code>${existingUser.assignedChildId}</code>\n\nУведомление придет, когда этот студент отсканируется на киоске.`;
      } else if (existingUser.role === 'curator') {
        detail = `\n\n📚 Ваша группа: <b>${existingUser.assignedGroup}</b>\n\nУведомление придет, когда студент вашей группы отсканируется.`;
      } else if (existingUser.role === 'admin') {
        detail = `\n\n👑 Вы получаете все уведомления системы.`;
      }
      await sendMessage(chatId, `✅ <b>Связь работает!</b>\n\nВы зарегистрированы как: <b>${existingUser.role}</b>${detail}`);
    } else {
      await sendMessage(chatId, `⚠️ Вы не зарегистрированы в системе.\n\nОтправьте /start для регистрации.`);
    }
    return;
  }

  // Диалоговая машина состояний
  const state = dialogState[chatId];

  if (state?.step === 'awaiting_code') {
    const CODE_ADMIN = process.env.TG_CODE_ADMIN || 'ADMIN777';
    const CODE_CURATOR = process.env.TG_CODE_CURATOR || 'TEACH555';
    const CODE_PARENT = process.env.TG_CODE_PARENT || 'FAMILY111';

    if (text === CODE_ADMIN) {
      const old = TgUsers.findOne({ chatId: String(chatId) });
      if (old) TgUsers.deleteById(old._id);

      TgUsers.create({
        chatId: String(chatId),
        name: firstName,
        role: 'admin',
        filter: 'all',
        status: 'active'
      });
      delete dialogState[chatId];
      await sendMessage(chatId, `👑 Регистрация <b>Администратора</b> завершена!\n\nВы будете получать все уведомления системы.`);
    } 
    else if (text === CODE_CURATOR) {
      dialogState[chatId] = { step: 'enter_group' };
      const students = Student.find({});
      const groups = [...new Set(students.map(s => s.group).filter(Boolean))];
      const groupList = groups.length > 0 ? groups.join(', ') : '(групп пока нет)';
      await sendMessage(chatId, `✅ Код принят!\n📚 Теперь введите название вашей <b>группы</b>:\n\nДоступные группы: <b>${groupList}</b>`);
    } 
    else if (text === CODE_PARENT) {
      dialogState[chatId] = { step: 'enter_child_id' };
      await sendMessage(chatId, '✅ Код принят!\n👪 Теперь введите <b>ID вашего ребёнка</b> (напр. STD-26-001):');
    } 
    else {
      await sendMessage(chatId, '❌ Неверный код доступа.');
    }
    return;
  }

  // Куратор вводит группу
  if (state?.step === 'enter_group') {
    const students = Student.find({});
    const groups = [...new Set(students.map(s => String(s.group || '').trim()))].filter(Boolean);
    const upperText = text.toUpperCase();
    const matchedGroup = groups.find(g => g.toUpperCase() === upperText);
    
    if (matchedGroup) {
      const old = TgUsers.findOne({ chatId: String(chatId) });
      if (old) TgUsers.deleteById(old._id);

      TgUsers.create({
        chatId: String(chatId),
        name: firstName,
        role: 'curator',
        assignedGroup: matchedGroup,
        status: 'active'
      });
      delete dialogState[chatId];
      await sendMessage(chatId, `🎉 Регистрация завершена!\n\nВы куратор группы <b>${matchedGroup}</b>.`);
    } else {
      await sendMessage(chatId, `❌ Группа <b>${text}</b> не найдена.`);
    }
    return;
  }

  // Родитель вводит ID ребёнка
  if (state?.step === 'enter_child_id') {
    const studentId = text.toUpperCase();
    const foundStudent = Student.findOne({ studentId });

    if (foundStudent) {
      const old = TgUsers.findOne({ chatId: String(chatId) });
      if (old) TgUsers.deleteById(old._id);

      TgUsers.create({
        chatId: String(chatId),
        name: firstName,
        role: 'parent',
        assignedChildId: foundStudent.studentId,
        childName: foundStudent.fullName,
        status: 'active'
      });
      delete dialogState[chatId];
      await sendMessage(chatId, `🎉 Регистрация завершена!\n\nВы будете получать уведомления о посещаемости студента: <b>${foundStudent.fullName}</b>.`);
    } else {
      await sendMessage(chatId, `❌ Студент с ID <b>${studentId}</b> не найден в базе.\n\nПожалуйста, проверьте ID (например, <code>STD-26-001</code>) и попробуйте снова:`);
    }
    return;
  }

  // Групповая рассылка для кураторов
  if (text.startsWith('/msg ')) {
    const parts = text.split(' ');
    if (parts.length < 3) {
      await sendMessage(chatId, '❌ Формат: <code>/msg [Группа] [Текст]</code>\nПример: <code>/msg П22-4В Завтра пара в 9:00</code>');
      return;
    }
    
    const targetGroup = parts[1].toUpperCase();
    const message = parts.slice(2).join(' ');

    // Проверяем права (только админ или куратор этой группы)
    if (existingUser.role !== 'admin' && (existingUser.role !== 'curator' || existingUser.assignedGroup.toUpperCase() !== targetGroup)) {
      await sendMessage(chatId, '❌ У вас нет прав для рассылки этой группе.');
      return;
    }

    const allStudents = Student.find({ group: targetGroup });
    // Находим родителей этих студентов
    const studentIds = allStudents.map(s => s.studentId);
    const parents = TgUsers.find({ role: 'parent' }).filter(p => studentIds.includes(p.assignedChildId));

    console.log(`📢 Групповая рассылка для ${targetGroup}: ${parents.length} получателей.`);
    
    for (const parent of parents) {
      await sendMessage(parent.chatId, `📢 <b>СООБЩЕНИЕ ОТ КУРАТОРА (${targetGroup}):</b>\n\n${message}`);
    }

    await sendMessage(chatId, `✅ Сообщение отправлено ${parents.length} родителям группы ${targetGroup}.`);
    return;
  }

};

// --- Функции для фото (угрозы) ---

export const sendPhoto = async (chatId, base64Image, caption) => {
  const token = BOT_TOKEN();
  if (!token) return;
  try {
    const matches = base64Image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return;
    const imageBuffer = Buffer.from(matches[2], 'base64');

    const form = new FormData();
    form.append('chat_id', String(chatId).trim());
    form.append('caption', caption);
    form.append('parse_mode', 'HTML');
    form.append('photo', imageBuffer, { filename: 'threat.jpg', contentType: 'image/jpeg' });

    await axios.post(`${API_URL()}/sendPhoto`, form, { headers: form.getHeaders() });
    console.log(`📸 [PHOTO] Отправлено на ${chatId}`);
  } catch (err) {
    console.error(`❌ [PHOTO ERROR] Ошибка для ${chatId}:`, err.message);
  }
};

export const broadcastPhoto = async (base64Image, caption) => {
  TgUsers._load();
  const users = TgUsers.find({ status: 'active' });
  for (const user of users) {
    await sendPhoto(user.chatId, base64Image, caption);
  }
};

const handleCallback = async (callbackQuery) => { /* basic */ };

export default { sendMessage, notifySubscribers, handleTelegramUpdate, sendPhoto, broadcastPhoto };

