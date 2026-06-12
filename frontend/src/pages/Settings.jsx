import { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import { Settings as SettingsIcon, Save, Database, Shield, Plus, Trash2, Users, Briefcase } from 'lucide-react';

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
          <p className="text-gray-400 mt-1">Управление группами, должностями и конфигурацией системы.</p>
        </div>
        {saveMsg && (
          <div className="bg-green-500/20 border border-green-500/40 text-green-400 px-4 py-2 rounded-xl font-medium flex items-center gap-2 animate-pulse">
            <Save size={16} />
            {saveMsg}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* === Управление группами === */}
        <GlassCard className="space-y-4">
          <div className="flex items-center gap-3 text-lg font-semibold text-white border-b border-white/10 pb-3">
            <Users className="text-primary" size={22} />
            Группы Колледжа
            <span className="ml-auto text-xs bg-primary/20 text-primary px-2 py-1 rounded-lg">{groups.length} групп</span>
          </div>
          <p className="text-gray-400 text-sm">Добавляйте группы — они появятся в выпадающем меню при регистрации.</p>

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

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {groups.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">Группы не добавлены.<br/>Добавь первую группу выше ↑</p>
            ) : (
              groups.map(g => (
                <div key={g} className="flex items-center justify-between bg-white/5 hover:bg-white/8 rounded-xl px-4 py-2 transition-colors">
                  <span className="text-white font-mono font-medium">{g}</span>
                  <button
                    onClick={() => removeGroup(g)}
                    className="text-red-400 hover:text-red-300 p-1 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        {/* === Управление должностями персонала === */}
        <GlassCard className="space-y-4">
          <div className="flex items-center gap-3 text-lg font-semibold text-white border-b border-white/10 pb-3">
            <Briefcase className="text-purple-400" size={22} />
            Должности Персонала
            <span className="ml-auto text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-lg">{staffRoles.length} должностей</span>
          </div>
          <p className="text-gray-400 text-sm">Добавляйте должности для персонала (охранник, завуч и т.д.).</p>

          <div className="flex gap-2">
            <input
              placeholder="Должность (напр. Охранник)"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-primary placeholder-gray-500 text-sm"
              value={newRole}
              onChange={e => setNewRole(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addStaffRole()}
            />
            <button
              onClick={addStaffRole}
              disabled={!newRole.trim()}
              className="bg-purple-500 hover:bg-purple-600 disabled:opacity-40 text-white font-bold px-3 py-2 rounded-xl flex items-center gap-1 transition-all"
            >
              <Plus size={16} />
            </button>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-2">Быстро добавить:</p>
            <div className="flex flex-wrap gap-2">
              {['Директор', 'Завуч', 'Охранник', 'Уборщица', 'Методист', 'Бухгалтер', 'Секретарь'].filter(r => !staffRoles.includes(r)).map(r => (
                <button
                  key={r}
                  onClick={() => addQuickRole(r)}
                  className="text-xs bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 px-3 py-1 rounded-lg transition-colors"
                >
                  + {r}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {staffRoles.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">Должности не добавлены</p>
            ) : (
              staffRoles.map(r => (
                <div key={r} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2">
                  <span className="text-white font-medium">{r}</span>
                  <button onClick={() => removeStaffRole(r)} className="text-red-400 hover:text-red-300 p-1 hover:bg-red-400/10 rounded-lg transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        {/* === Безопасность === */}
        <GlassCard className="space-y-4">
          <div className="flex items-center gap-3 text-lg font-semibold text-white border-b border-white/10 pb-3">
            <Shield className="text-primary" size={22} />
            Telegram Бот — Коды Доступа
          </div>

          <div className="space-y-3 text-sm">
            <div className="bg-white/5 rounded-xl p-4 space-y-3">
              {[
                { role: '👑 Администратор', code: 'ADMIN777', color: 'text-yellow-400' },
                { role: '📚 Куратор', code: 'TEACH555', color: 'text-blue-400' },
                { role: '👪 Родитель', code: 'FAMILY111', color: 'text-green-400' },
              ].map(({ role, code, color }) => (
                <div key={code} className="flex justify-between items-center">
                  <span className="text-gray-400">{role}</span>
                  <code className={`${color} font-mono font-bold bg-white/5 px-3 py-1 rounded-lg`}>{code}</code>
                </div>
              ))}
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <p className="text-blue-400 font-medium mb-1">📱 Как подключиться к боту</p>
              <ol className="text-gray-400 text-xs space-y-1 list-decimal list-inside">
                <li>Найди бота в Telegram и напиши <code className="bg-white/10 px-1 rounded">/start</code></li>
                <li>Введи нужный код (в зависимости от роли)</li>
                <li>Куратор — введёт свою группу. Родитель — ID ребёнка</li>
              </ol>
            </div>
          </div>
        </GlassCard>

        {/* === Опасная зона === */}
        <GlassCard className="space-y-4">
          <div className="flex items-center gap-3 text-lg font-semibold text-red-400 border-b border-red-500/20 pb-3">
            <Database className="text-red-400" size={22} />
            Управление Базой
          </div>

          <div className="space-y-3">
            <button
              onClick={handleClearAttendance}
              className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-3 rounded-xl transition-colors font-medium text-left flex items-center gap-3"
            >
              <Trash2 size={16} />
              Очистить все логи посещаемости
            </button>
            <p className="text-gray-600 text-xs pl-1">Это удалит все записи о посещениях. Студенты в базе сохранятся.</p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default Settings;
