import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../components/GlassCard';
import { Settings as SettingsIcon, Save, Database, Shield, Plus, Trash2, Users, Briefcase, Send, MessageSquare, X, ExternalLink, Activity } from 'lucide-react';
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

// Переиспользуемая обертка для модального окна
const ModalWrapper = ({ isOpen, onClose, title, icon: Icon, children, maxWidth = "max-w-xl", iconColor = "text-primary" }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", bounce: 0, duration: 0.3 }}
          className={`relative bg-gray-900 border border-white/10 shadow-2xl rounded-2xl w-full ${maxWidth} flex flex-col max-h-[90vh]`}
        >
          <div className="flex-shrink-0 flex items-center justify-between p-5 border-b border-white/5 bg-white/5">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              {Icon && <Icon className={iconColor} size={24} />} 
              {title}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/10">
              <X size={20} />
            </button>
          </div>
          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const Settings = () => {
  const [activeModal, setActiveModal] = useState(null); // 'groups' | 'staff' | 'telegram' | 'broadcast' | 'database'

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
  const [tgTab, setTgTab] = useState('config'); // 'config' | 'users'

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

  const [broadcastConfirm, setBroadcastConfirm] = useState(false);

  const handleBroadcast = async () => {
    if (!broadcastText.trim()) return;
    if (!broadcastConfirm) {
      setBroadcastConfirm(true);
      return;
    }
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
        alert(`✅ Отправлено сообщений: ${data.count}`);
        setBroadcastText('');
        setBroadcastConfirm(false);
        setActiveModal(null);
      }
    } catch (err) { console.error(err); alert('Ошибка при отправке.'); }
  };

  const showSaved = () => {
    setSaveMsg('✅ Сохранено');
    setTimeout(() => setSaveMsg(''), 2000);
  };

  const addGroup = () => {
    const trimmed = newGroup.trim().toUpperCase();
    if (!trimmed || groups.includes(trimmed)) return;
    const updated = [...groups, trimmed];
    setGroups(updated);
    localStorage.setItem(LS_GROUPS, JSON.stringify(updated));
    setNewGroup('');
  };

  const removeGroup = (g) => {
    const updated = groups.filter(x => x !== g);
    setGroups(updated);
    localStorage.setItem(LS_GROUPS, JSON.stringify(updated));
  };

  const addStaffRole = () => {
    const trimmed = newRole.trim();
    if (!trimmed || staffRoles.includes(trimmed)) return;
    const updated = [...staffRoles, trimmed];
    setStaffRoles(updated);
    localStorage.setItem(LS_ROLES, JSON.stringify(updated));
    setNewRole('');
  };

  const removeStaffRole = (r) => {
    const updated = staffRoles.filter(x => x !== r);
    setStaffRoles(updated);
    localStorage.setItem(LS_ROLES, JSON.stringify(updated));
  };

  const handleClearAttendance = async () => {
    try {
      const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
      const res = await fetch('/api/attendance/clear', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminInfo.token}` }
      });
      if (res.ok) {
        alert('✅ Логи посещаемости успешно очищены.');
        setActiveModal(null);
      } else alert('Ошибка при очистке.');
    } catch (e) { alert('Ошибка при очистке.'); }
  };

  return (
    <div className="space-y-8 max-w-6xl pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-white flex items-center gap-3 tracking-tight">
            <SettingsIcon className="text-primary" size={36} />
            Настройки Системы
          </h1>
          <p className="text-gray-400 mt-2 text-lg">Центр управления всеми параметрами платформы.</p>
        </div>
        {saveMsg && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-green-500/20 border border-green-500/40 text-green-400 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-green-500/10">
            <Save size={18} /> {saveMsg}
          </motion.div>
        )}
      </div>

      {/* DASHBOARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Telegram Widget */}
        <GlassCard className="col-span-1 md:col-span-2 lg:col-span-2 flex flex-col justify-between border-blue-500/20 shadow-[0_0_30px_-15px_rgba(59,130,246,0.5)]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/20 rounded-2xl">
                  <Shield className="text-blue-400" size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Интеграция Telegram</h3>
                  <p className="text-blue-400 text-sm font-medium flex items-center gap-1">
                    <Activity size={14} /> Подключено {tgUsers.length} пользователей
                  </p>
                </div>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Управление токеном, секретными кодами доступа для ролей (Админ, Куратор, Родитель) и модерация списка активных подписчиков.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setActiveModal('telegram')} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold py-3 px-4 rounded-xl transition-all flex justify-center items-center gap-2">
              <SettingsIcon size={18} /> Настройки Бота
            </button>
            <button onClick={() => setActiveModal('broadcast')} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-blue-500/20 flex justify-center items-center gap-2">
              <Send size={18} /> Рассылка
            </button>
          </div>
        </GlassCard>

        {/* Groups Widget */}
        <GlassCard className="flex flex-col justify-between border-white/5 hover:border-primary/30 transition-colors">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary/20 rounded-2xl">
                <Users className="text-primary" size={28} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Группы</h3>
                <p className="text-primary text-sm font-medium">{groups.length} активных</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-6">Академические группы колледжа для регистрации студентов и назначения кураторов.</p>
          </div>
          <button onClick={() => setActiveModal('groups')} className="w-full bg-white/5 hover:bg-primary/20 hover:text-primary border border-white/10 text-white font-semibold py-3 rounded-xl transition-all flex justify-center items-center gap-2">
            <ExternalLink size={18} /> Управление группами
          </button>
        </GlassCard>

        {/* Staff Widget */}
        <GlassCard className="flex flex-col justify-between border-white/5 hover:border-purple-500/30 transition-colors">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-500/20 rounded-2xl">
                <Briefcase className="text-purple-400" size={28} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Персонал</h3>
                <p className="text-purple-400 text-sm font-medium">{staffRoles.length} должностей</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-6">Должности для сотрудников колледжа (охрана, преподаватели, администрация).</p>
          </div>
          <button onClick={() => setActiveModal('staff')} className="w-full bg-white/5 hover:bg-purple-500/20 hover:text-purple-300 border border-white/10 text-white font-semibold py-3 rounded-xl transition-all flex justify-center items-center gap-2">
            <ExternalLink size={18} /> Управление персоналом
          </button>
        </GlassCard>

        {/* Database Widget */}
        <GlassCard className="col-span-1 md:col-span-2 lg:col-span-2 flex flex-col justify-between border-red-500/10 bg-red-500/5">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-500/20 rounded-2xl">
                <Database className="text-red-400" size={28} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">База Данных</h3>
                <p className="text-red-400 text-sm font-medium">Опасная зона</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-6">Глобальные операции с логами системы. Будьте осторожны, данные удаляются безвозвратно.</p>
          </div>
          <button onClick={() => setActiveModal('database')} className="w-full md:w-auto bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold py-3 px-6 rounded-xl transition-all flex justify-center items-center gap-2">
            <Trash2 size={18} /> Очистить логи посещаемости
          </button>
        </GlassCard>

      </div>

      {/* --- MODALS --- */}

      {/* GROUPS MODAL */}
      <ModalWrapper isOpen={activeModal === 'groups'} onClose={() => setActiveModal(null)} title="Группы Колледжа" icon={Users}>
        <div className="space-y-6">
          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Добавить новую группу</label>
            <div className="flex gap-2">
              <input
                placeholder="Напр. ПР-21, ИС-22..."
                className="flex-1 bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary placeholder-gray-600 text-sm uppercase"
                value={newGroup}
                onChange={e => setNewGroup(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addGroup()}
              />
              <button onClick={addGroup} disabled={!newGroup.trim()} className="bg-primary hover:bg-primary-dark disabled:opacity-40 text-black font-bold px-5 rounded-xl transition-all">
                <Plus size={20} />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Список групп ({groups.length})</p>
            {groups.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">Нет добавленных групп</p>
            ) : (
              groups.map(g => (
                <div key={g} className="flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl px-5 py-3 transition-colors group">
                  <span className="text-white font-mono font-medium">{g}</span>
                  <button onClick={() => removeGroup(g)} className="text-gray-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </ModalWrapper>

      {/* STAFF ROLES MODAL */}
      <ModalWrapper isOpen={activeModal === 'staff'} onClose={() => setActiveModal(null)} title="Должности Персонала" icon={Briefcase} iconColor="text-purple-400">
        <div className="space-y-6">
          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Добавить должность</label>
            <div className="flex gap-2">
              <input
                placeholder="Напр. Охранник, Завуч..."
                className="flex-1 bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-purple-400 placeholder-gray-600 text-sm"
                value={newRole}
                onChange={e => setNewRole(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addStaffRole()}
              />
              <button onClick={addStaffRole} disabled={!newRole.trim()} className="bg-purple-500 hover:bg-purple-600 disabled:opacity-40 text-white font-bold px-5 rounded-xl transition-all">
                <Plus size={20} />
              </button>
            </div>
            
            <div className="mt-4">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Быстрые шаблоны:</p>
              <div className="flex flex-wrap gap-2">
                {['Директор', 'Завуч', 'Охранник', 'Методист', 'Секретарь'].filter(r => !staffRoles.includes(r)).map(r => (
                  <button key={r} onClick={() => addQuickRole(r)} className="text-xs bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 px-3 py-1.5 rounded-lg transition-colors">
                    + {r}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Список должностей ({staffRoles.length})</p>
            {staffRoles.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">Нет добавленных должностей</p>
            ) : (
              staffRoles.map(r => (
                <div key={r} className="flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl px-5 py-3 transition-colors group">
                  <span className="text-white font-medium">{r}</span>
                  <button onClick={() => removeStaffRole(r)} className="text-gray-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </ModalWrapper>

      {/* TELEGRAM SETTINGS MODAL */}
      <ModalWrapper isOpen={activeModal === 'telegram'} onClose={() => setActiveModal(null)} title="Настройки Telegram" icon={Shield} iconColor="text-blue-400" maxWidth="max-w-2xl">
        
        <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-xl border border-white/10">
          <button 
            onClick={() => setTgTab('config')} 
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${tgTab === 'config' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            Конфигурация
          </button>
          <button 
            onClick={() => setTgTab('users')} 
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${tgTab === 'users' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            Подписчики <span className={`px-2 py-0.5 rounded-full text-xs ${tgTab === 'users' ? 'bg-white/20' : 'bg-white/10'}`}>{tgUsers.length}</span>
          </button>
        </div>

        {tgTab === 'config' ? (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white/5 p-5 rounded-xl border border-white/10 space-y-4">
              <h3 className="text-white font-bold text-sm border-b border-white/10 pb-2">Основные ключи</h3>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Bot Token (BotFather)</label>
                <input value={tgConfig.botToken || ''} onChange={e => setTgConfig({...tgConfig, botToken: e.target.value})} placeholder="Оставьте пустым для использования .env" className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 px-3 text-white text-sm focus:border-blue-400 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Имя бота (без @)</label>
                  <input value={tgConfig.botName || ''} onChange={e => setTgConfig({...tgConfig, botName: e.target.value})} placeholder="smart_college_bot" className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 px-3 text-white text-sm focus:border-blue-400 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Chat ID Охраны</label>
                  <input value={tgConfig.mainChatId || ''} onChange={e => setTgConfig({...tgConfig, mainChatId: e.target.value})} placeholder="-100123456" className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 px-3 text-white text-sm focus:border-blue-400 focus:outline-none" />
                </div>
              </div>
            </div>

            <div className="bg-white/5 p-5 rounded-xl border border-white/10 space-y-4">
              <h3 className="text-white font-bold text-sm border-b border-white/10 pb-2">Секретные коды для регистрации</h3>
              
              <div className="grid gap-3">
                <div className="flex items-center gap-4 bg-black/20 p-2 rounded-lg">
                  <span className="w-28 text-xs font-medium text-yellow-400 flex items-center gap-2">👑 Админ</span>
                  <input value={tgConfig.codeAdmin} onChange={e => setTgConfig({...tgConfig, codeAdmin: e.target.value})} className="flex-1 bg-black/40 border border-white/10 rounded-lg py-1.5 px-3 text-white text-sm font-mono focus:border-blue-400 focus:outline-none" />
                </div>
                <div className="flex items-center gap-4 bg-black/20 p-2 rounded-lg">
                  <span className="w-28 text-xs font-medium text-blue-400 flex items-center gap-2">📚 Куратор</span>
                  <input value={tgConfig.codeCurator} onChange={e => setTgConfig({...tgConfig, codeCurator: e.target.value})} className="flex-1 bg-black/40 border border-white/10 rounded-lg py-1.5 px-3 text-white text-sm font-mono focus:border-blue-400 focus:outline-none" />
                </div>
                <div className="flex items-center gap-4 bg-black/20 p-2 rounded-lg">
                  <span className="w-28 text-xs font-medium text-green-400 flex items-center gap-2">👪 Родитель</span>
                  <input value={tgConfig.codeParent} onChange={e => setTgConfig({...tgConfig, codeParent: e.target.value})} className="flex-1 bg-black/40 border border-white/10 rounded-lg py-1.5 px-3 text-white text-sm font-mono focus:border-blue-400 focus:outline-none" />
                </div>
              </div>
            </div>

            <button onClick={saveTelegramConfig} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex justify-center items-center gap-2">
              <Save size={18} /> Сохранить Конфигурацию
            </button>
          </div>
        ) : (
          <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
            {tgUsers.length === 0 ? (
              <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                <Users size={40} className="mx-auto text-gray-600 mb-3" />
                <p className="text-gray-400 font-medium">Никто еще не подключился к боту.</p>
              </div>
            ) : (
              tgUsers.map(u => (
                <div key={u._id} className="flex justify-between items-center bg-white/5 hover:bg-white/10 border border-white/10 p-4 rounded-xl transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                      ${u.role === 'admin' ? 'bg-yellow-500/20 text-yellow-400' : 
                        u.role === 'curator' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-white font-bold">{u.name}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <span className="uppercase text-[10px] tracking-wider font-semibold opacity-70">{u.role}</span>
                        <span>•</span>
                        <span className="text-primary font-medium">{u.assignedGroup || u.childName || u.assignedChildId || 'Все уведомления'}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => removeTelegramUser(u._id)} className="text-gray-500 hover:text-red-400 hover:bg-red-400/10 p-2.5 rounded-xl transition-all" title="Отключить">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </ModalWrapper>

      {/* BROADCAST MODAL */}
      <ModalWrapper isOpen={activeModal === 'broadcast'} onClose={() => setActiveModal(null)} title="Массовая Рассылка" icon={Send} iconColor="text-blue-400">
        <div className="space-y-5">
          <p className="text-sm text-gray-400">Отправьте мгновенное сообщение пользователям бота. Оно придет им от имени бота.</p>
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Кому отправляем?</label>
            <div className="relative">
              <select 
                value={broadcastAudience} 
                onChange={e => setBroadcastAudience(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 px-4 text-white text-sm focus:outline-none focus:border-blue-400 appearance-none font-medium"
              >
                <option value="all">📢 Всем подписчикам ({tgUsers.length})</option>
                <option value="parent">👪 Только Родителям ({tgUsers.filter(u=>u.role==='parent').length})</option>
                <option value="curator">📚 Только Кураторам ({tgUsers.filter(u=>u.role==='curator').length})</option>
                <option value="admin">👑 Только Администраторам ({tgUsers.filter(u=>u.role==='admin').length})</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">▼</div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Текст сообщения</label>
            <textarea
              value={broadcastText}
              onChange={e => setBroadcastText(e.target.value)}
              placeholder="Напишите важное объявление здесь..."
              className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-blue-400 h-36 resize-none custom-scrollbar leading-relaxed"
            ></textarea>
          </div>

          {broadcastConfirm ? (
            <div className="space-y-3 mt-2">
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm font-medium flex items-center gap-2">
                <Shield size={16} /> Вы уверены? Это сообщение получат {tgUsers.length} человек.
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setBroadcastConfirm(false)} 
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3.5 rounded-xl transition-all"
                >
                  Отмена
                </button>
                <button 
                  onClick={handleBroadcast} 
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-red-500/20 flex justify-center items-center gap-2"
                >
                  <Send size={18} /> Да, разослать
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={handleBroadcast} 
              disabled={!broadcastText.trim()} 
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 flex justify-center items-center gap-2"
            >
              <Send size={18} /> Отправить сообщение
            </button>
          )}
        </div>
      </ModalWrapper>

      {/* DATABASE DANGER MODAL */}
      <ModalWrapper isOpen={activeModal === 'database'} onClose={() => setActiveModal(null)} title="Очистка Базы Данных" icon={Database} iconColor="text-red-500">
        <div className="text-center space-y-6 py-4">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-red-500/20">
            <Trash2 className="text-red-500" size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Вы абсолютно уверены?</h3>
            <p className="text-gray-400 text-sm leading-relaxed max-w-sm mx-auto">
              Это действие необратимо удалит <b>все логи посещаемости и угрозы</b> из системы. Студенты и настройки сохранятся.
            </p>
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={() => setActiveModal(null)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-colors">
              Отмена
            </button>
            <button onClick={handleClearAttendance} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-500/20 transition-colors">
              Да, удалить всё
            </button>
          </div>
        </div>
      </ModalWrapper>

    </div>
  );
};

export default Settings;
