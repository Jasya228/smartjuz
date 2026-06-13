import { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import { Settings as SettingsIcon, Save, Database, Shield, Plus, Trash2, Users, Briefcase, Send, MessageSquare } from 'lucide-react';
import { API_BASE_URL } from '../config';

// Ключи для localStorage
const LS_GROUPS = 'college_groups';
const LS_ROLES = 'college_staff_roles';

export const getStoredGroups = () => {
  try { return JSON.parse(localStorage.getItem(LS_GROUPS) || '[]'); } 
  catch { return []; }
};

export const getStoredStaffRoles = () => {
  try { return JSON.parse(localStorage.getItem(LS_ROLES) || '[]'); }
  catch { return []; }
};

const Settings = () => {
  const [groups, setGroups] = useState(getStoredGroups);
  const [staffRoles, setStaffRoles] = useState(getStoredStaffRoles);
  const [newGroup, setNewGroup] = useState('');
  const [newRole, setNewRole] = useState('');
  const [saveMsg, setSaveMsg] = useState('');

  // Telegram States
  const [tgConfig, setTgConfig] = useState({
    botToken: '',
    botName: '',
    mainChatId: '',
    codeAdmin: 'ADMIN777',
    codeCurator: 'TEACH555',
    codeParent: 'FAMILY111'
  });
  const [tgUsers, setTgUsers] = useState([]);
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastAudience, setBroadcastAudience] = useState('all');

  useEffect(() => {
    fetchTelegramConfig();
    fetchTelegramUsers();
  }, []);

  const fetchTelegramConfig = async () => {
    try {
      const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
      const res = await fetch(`${API_BASE_URL}/telegram/config`, {
        headers: { Authorization: `Bearer ${adminInfo.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTgConfig(prev => ({ ...prev, ...data }));
      }
    } catch (err) { console.error(err); }
  };

  const fetchTelegramUsers = async () => {
    try {
      const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
      const res = await fetch(`${API_BASE_URL}/telegram/users`, {
        headers: { Authorization: `Bearer ${adminInfo.token}` }
      });
      if (res.ok) {
        setTgUsers(await res.json());
      }
    } catch (err) { console.error(err); }
  };

  const saveTelegramConfig = async () => {
    try {
      const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
      const res = await fetch(`${API_BASE_URL}/telegram/config`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminInfo.token}` 
        },
        body: JSON.stringify(tgConfig)
      });
      if (res.ok) showSaved();
    } catch (err) { console.error(err); }
  };

  const removeTelegramUser = async (id) => {
    if (!window.confirm('Отключить этого пользователя от бота?')) return;
    try {
      const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
      const res = await fetch(`${API_BASE_URL}/telegram/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminInfo.token}` }
      });
      if (res.ok) fetchTelegramUsers();
    } catch (err) { console.error(err); }
  };

  const handleBroadcast = async () => {
    if (!broadcastText.trim()) return;
    if (!window.confirm(`Разослать сообщение (${broadcastAudience})?`)) return;
    try {
      const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
      const res = await fetch(`${API_BASE_URL}/telegram/broadcast`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminInfo.token}` 
        },
        body: JSON.stringify({ text: broadcastText, audience: broadcastAudience })
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Отправлено сообщений: ${data.count}`);
        setBroadcastText('');
      }
    } catch (err) { console.error(err); }
  };

  const showSaved = () => {
    setSaveMsg('✅ Сохранено!');
    setTimeout(() => setSaveMsg(''), 2000);
  };

  const addGroup = () => {
    const trimmed = newGroup.trim().toUpperCase();
    if (!trimmed || groups.includes(trimmed)) return;
    const updated = [...groups, trimmed];
    setGroups(updated);
    localStorage.setItem(LS_GROUPS, JSON.stringify(updated));
    setNewGroup('');
    showSaved();
  };

  const removeGroup = (g) => {
    const updated = groups.filter(x => x !== g);
    setGroups(updated);
    localStorage.setItem(LS_GROUPS, JSON.stringify(updated));
    showSaved();
  };

  const addStaffRole = () => {
    const trimmed = newRole.trim();
    if (!trimmed || staffRoles.includes(trimmed)) return;
    const updated = [...staffRoles, trimmed];
    setStaffRoles(updated);
    localStorage.setItem(LS_ROLES, JSON.stringify(updated));
    setNewRole('');
    showSaved();
  };

  const removeStaffRole = (r) => {
    const updated = staffRoles.filter(x => x !== r);
    setStaffRoles(updated);
    localStorage.setItem(LS_ROLES, JSON.stringify(updated));
    showSaved();
  };

  const addQuickRole = (r) => {
    if (staffRoles.includes(r)) return;
    const updated = [...staffRoles, r];
    setStaffRoles(updated);
    localStorage.setItem(LS_ROLES, JSON.stringify(updated));
    showSaved();
  };

  const handleClearAttendance = async () => {
    if (!window.confirm('Удалить все логи посещаемости? Это действие нельзя отменить!')) return;
    try {
      const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
      const res = await fetch('/api/attendance/clear', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminInfo.token}` }
      });
      if (res.ok) alert('Логи посещаемости очищены.');
      else alert('Ошибка при очистке.');
    } catch (e) { alert('Ошибка при очистке.'); }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <SettingsIcon className="text-primary" />
            Настройки Системы
          </h1>
          <p className="text-gray-400 mt-1">Управление группами, ботом и конфигурацией системы.</p>
        </div>
        {saveMsg && (
          <div className="bg-green-500/20 border border-green-500/40 text-green-400 px-4 py-2 rounded-xl font-medium flex items-center gap-2 animate-pulse">
            <Save size={16} />
            {saveMsg}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* === Telegram Бот Настройки === */}
        <GlassCard className="space-y-4 md:col-span-2">
          <div className="flex items-center gap-3 text-lg font-semibold text-white border-b border-white/10 pb-3">
            <Shield className="text-blue-400" size={22} />
            Telegram Бот — Конфигурация
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Bot Token (BotFather)</label>
              <input
                value={tgConfig.botToken || ''}
                onChange={e => setTgConfig({...tgConfig, botToken: e.target.value})}
                placeholder="Оставьте пустым для использования .env"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white focus:border-blue-400 focus:outline-none"
              />

              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest pt-2">Имя бота (без @)</label>
              <input
                value={tgConfig.botName || ''}
                onChange={e => setTgConfig({...tgConfig, botName: e.target.value})}
                placeholder="smart_college_bot"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white focus:border-blue-400 focus:outline-none"
              />

              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest pt-2">Основной Chat ID (Охрана)</label>
              <input
                value={tgConfig.mainChatId || ''}
                onChange={e => setTgConfig({...tgConfig, mainChatId: e.target.value})}
                placeholder="ID группы для всех логов и тревог"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white focus:border-blue-400 focus:outline-none"
              />
            </div>

            <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/10">
              <p className="text-sm font-bold text-white mb-2">Коды доступа для регистрации</p>
              
              <div className="flex items-center gap-3">
                <span className="w-1/3 text-xs text-gray-400">👑 Админ</span>
                <input value={tgConfig.codeAdmin} onChange={e => setTgConfig({...tgConfig, codeAdmin: e.target.value})} className="flex-1 bg-black/30 border border-white/5 rounded-lg py-1 px-2 text-white text-sm" />
              </div>
              <div className="flex items-center gap-3">
                <span className="w-1/3 text-xs text-gray-400">📚 Куратор</span>
                <input value={tgConfig.codeCurator} onChange={e => setTgConfig({...tgConfig, codeCurator: e.target.value})} className="flex-1 bg-black/30 border border-white/5 rounded-lg py-1 px-2 text-white text-sm" />
              </div>
              <div className="flex items-center gap-3">
                <span className="w-1/3 text-xs text-gray-400">👪 Родитель</span>
                <input value={tgConfig.codeParent} onChange={e => setTgConfig({...tgConfig, codeParent: e.target.value})} className="flex-1 bg-black/30 border border-white/5 rounded-lg py-1 px-2 text-white text-sm" />
              </div>

              <button onClick={saveTelegramConfig} className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded-lg transition-colors flex justify-center items-center gap-2">
                <Save size={16} /> Сохранить настройки TG
              </button>
            </div>
          </div>
        </GlassCard>

        {/* === Telegram Подписчики и Рассылка === */}
        <GlassCard className="space-y-4">
          <div className="flex items-center gap-3 text-lg font-semibold text-white border-b border-white/10 pb-3">
            <MessageSquare className="text-green-400" size={22} />
            Рассылка и Подписчики ({tgUsers.length})
          </div>

          <div className="space-y-2 mb-4">
            <select 
              value={broadcastAudience} 
              onChange={e => setBroadcastAudience(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white focus:outline-none"
            >
              <option value="all" className="bg-gray-800">Всем подписчикам</option>
              <option value="parent" className="bg-gray-800">Только Родителям</option>
              <option value="curator" className="bg-gray-800">Только Кураторам</option>
              <option value="admin" className="bg-gray-800">Только Администраторам</option>
            </select>
            <textarea
              value={broadcastText}
              onChange={e => setBroadcastText(e.target.value)}
              placeholder="Текст массовой рассылки..."
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-green-400 h-24 resize-none"
            ></textarea>
            <button onClick={handleBroadcast} disabled={!broadcastText.trim()} className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold py-2 rounded-xl transition-colors flex justify-center items-center gap-2">
              <Send size={16} /> Разослать
            </button>
          </div>

          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-4 mb-2">Список подписчиков</p>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
            {tgUsers.length === 0 ? (
              <p className="text-gray-500 text-xs text-center py-2">Никто не подключен</p>
            ) : (
              tgUsers.map(u => (
                <div key={u._id} className="flex justify-between items-center bg-white/5 p-2 rounded-lg text-sm">
                  <div>
                    <div className="text-white font-medium">{u.name} <span className="text-xs text-gray-500">({u.role})</span></div>
                    <div className="text-xs text-primary">{u.assignedGroup || u.childName || u.assignedChildId || 'Все логи'}</div>
                  </div>
                  <button onClick={() => removeTelegramUser(u._id)} className="text-red-400 hover:bg-red-500/20 p-1 rounded">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        {/* === Управление группами === */}
        <GlassCard className="space-y-4">
          <div className="flex items-center gap-3 text-lg font-semibold text-white border-b border-white/10 pb-3">
            <Users className="text-primary" size={22} />
            Группы Колледжа
            <span className="ml-auto text-xs bg-primary/20 text-primary px-2 py-1 rounded-lg">{groups.length} групп</span>
          </div>
          <div className="flex gap-2">
            <input
              placeholder="Напр. ПР-21, ИС-22..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-primary placeholder-gray-500 text-sm uppercase"
              value={newGroup}
              onChange={e => setNewGroup(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addGroup()}
            />
            <button
              onClick={addGroup}
              disabled={!newGroup.trim()}
              className="bg-primary hover:bg-primary-dark disabled:opacity-40 text-black font-bold px-3 py-2 rounded-xl flex items-center gap-1 transition-all"
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
            {groups.map(g => (
              <div key={g} className="flex items-center justify-between bg-white/5 hover:bg-white/8 rounded-xl px-4 py-2 transition-colors">
                <span className="text-white font-mono font-medium">{g}</span>
                <button onClick={() => removeGroup(g)} className="text-red-400 hover:text-red-300 p-1 hover:bg-red-400/10 rounded-lg transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* === Опасная зона === */}
        <GlassCard className="space-y-4 md:col-span-2 border-red-500/20">
          <div className="flex items-center gap-3 text-lg font-semibold text-red-400 border-b border-red-500/20 pb-3">
            <Database className="text-red-400" size={22} />
            Управление Базой
          </div>
          <button
            onClick={handleClearAttendance}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-3 rounded-xl transition-colors font-medium flex items-center gap-3 w-max"
          >
            <Trash2 size={16} />
            Очистить все логи посещаемости
          </button>
        </GlassCard>

      </div>
    </div>
  );
};

export default Settings;
