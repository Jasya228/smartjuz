import { useState, useEffect, useRef } from 'react';
import GlassCard from '../components/GlassCard';
import { Users, UserPlus, Trash2, Camera, ChevronRight, CheckCircle, X, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as faceapi from 'face-api.js';

// =====================================
// Утилита: генерация ID
// =====================================
const generateId = (roleType, existingStudents) => {
  const prefixes = { 'Студент': 'STD', 'Преподаватель': 'TCH', 'Сотрудник': 'STF' };
  const prefix = prefixes[roleType] || 'USR';
  const year = new Date().getFullYear().toString().slice(2);
  
  // Считаем примерное количество
  let count = existingStudents.filter(s => s.roleType === roleType || (roleType === 'Студент' && !s.roleType)).length + 1;
  let newId = `${prefix}-${year}-${String(count).padStart(3, '0')}`;
  
  // Гарантируем уникальность: если ID уже есть в базе, просто берём следующий номер
  while (existingStudents.some(s => s.studentId === newId)) {
    count++;
    newId = `${prefix}-${year}-${String(count).padStart(3, '0')}`;
  }
  
  return newId;
};

// =====================================
// Шаг 1: Выбор роли
// =====================================
const StepChooseRole = ({ onNext }) => (
  <div className="space-y-4">
    <h2 className="text-xl font-bold text-white mb-6">Кого добавляем?</h2>
    {[
      { role: 'Студент', icon: '👨‍🎓', desc: 'Учащийся колледжа', color: 'from-green-500/20 to-green-600/10 border-green-500/30' },
      { role: 'Преподаватель', icon: '👨‍🏫', desc: 'Куратор или преподаватель', color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30' },
      { role: 'Сотрудник', icon: '👨‍🔧', desc: 'Технический персонал', color: 'from-purple-500/20 to-purple-600/10 border-purple-500/30' },
    ].map(item => (
      <button
        key={item.role}
        onClick={() => onNext(item.role)}
        className={`w-full p-4 rounded-xl bg-gradient-to-r ${item.color} border text-left hover:scale-[1.02] transition-all flex items-center gap-4`}
      >
        <span className="text-3xl">{item.icon}</span>
        <div>
          <p className="text-white font-bold text-lg">{item.role}</p>
          <p className="text-gray-400 text-sm">{item.desc}</p>
        </div>
        <ChevronRight className="text-gray-400 ml-auto" />
      </button>
    ))}
  </div>
);

// =====================================
// Шаг 2: Форма данных
// =====================================
const StepFillData = ({ roleType, students, onNext, onBack }) => {
  const [form, setForm] = useState({ fullName: '', group: '', department: '' });
  const [groups, setGroups] = useState([]);
  const [staffRoles, setStaffRoles] = useState([]);

  useEffect(() => {
    // Читаем группы и должности из localStorage (сохраняются в Настройках)
    try {
      const savedGroups = JSON.parse(localStorage.getItem('college_groups') || '[]');
      const savedRoles = JSON.parse(localStorage.getItem('college_staff_roles') || '[]');
      setGroups(savedGroups);
      setStaffRoles(savedRoles);
    } catch (e) { /* ignore */ }
  }, []);

  const generatedId = generateId(roleType, students);

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext({ ...form, studentId: generatedId, roleType });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <button type="button" onClick={onBack} className="text-gray-400 hover:text-white transition-colors">← Назад</button>
        <h2 className="text-xl font-bold text-white">Данные {roleType === 'Студент' ? 'студента' : roleType === 'Преподаватель' ? 'преподавателя' : 'сотрудника'}</h2>
      </div>

      {/* Автогенерированный ID */}
      <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 flex items-center gap-3">
        <RefreshCw size={16} className="text-primary" />
        <div>
          <p className="text-xs text-gray-400">ID генерируется автоматически</p>
          <p className="text-primary font-mono font-bold">{generatedId}</p>
        </div>
      </div>

      {/* ФИО - для всех */}
      <input
        required
        placeholder="Полное ФИО"
        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary placeholder-gray-500"
        value={form.fullName}
        onChange={e => setForm({ ...form, fullName: e.target.value })}
      />

      {/* Студент: выбор группы */}
      {roleType === 'Студент' && (
        <div className="space-y-2">
          <label className="text-gray-400 text-sm flex justify-between">
            Группа
            {groups.length === 0 && <span className="text-yellow-500 text-xs">! Настройте группы</span>}
          </label>
          <div className="relative group">
            <select
              required
              className="w-full bg-white/10 border border-white/20 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary appearance-none cursor-pointer hover:bg-white/15 transition-all"
              value={form.group}
              onChange={e => setForm({ ...form, group: e.target.value })}
            >
              <option value="" className="bg-gray-900">Выберите группу из списка...</option>
              {groups.map(g => <option key={g} value={g} className="bg-gray-800">{g}</option>)}
              {groups.length === 0 && <option value="TEST" className="bg-gray-800">Нет групп (создайте в Настройках)</option>}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
          </div>
        </div>
      )}

      {/* Преподаватель: выбор группы (необязательно) */}
      {roleType === 'Преподаватель' && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-gray-400 text-sm">Группа (кураторство)</label>
            <div className="relative">
              <select
                className="w-full bg-white/10 border border-white/20 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary appearance-none cursor-pointer"
                value={form.group}
                onChange={e => setForm({ ...form, group: e.target.value })}
              >
                <option value="" className="bg-gray-900">Не является куратором</option>
                {groups.map(g => <option key={g} value={g} className="bg-gray-800">{g}</option>)}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
            </div>
          </div>
          <input
            placeholder="Кафедра / Предмет"
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary placeholder-gray-500"
            value={form.department}
            onChange={e => setForm({ ...form, department: e.target.value })}
          />
        </div>
      )}

      {/* Сотрудник: выбор должности */}
      {roleType === 'Сотрудник' && (
        <div className="space-y-2">
          <label className="text-gray-400 text-sm">Должность</label>
          <div className="relative">
            <select
              required
              className="w-full bg-white/10 border border-white/20 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary appearance-none cursor-pointer"
              value={form.department}
              onChange={e => setForm({ ...form, department: e.target.value })}
            >
              <option value="" className="bg-gray-900">Выберите должность...</option>
              {staffRoles.map(r => <option key={r} value={r} className="bg-gray-800">{r}</option>)}
              {staffRoles.length === 0 && <option value="STAFF" className="bg-gray-800">Нет должностей (Настройте их)</option>}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
          </div>
        </div>
      )}

      <button
        type="submit"
        className="w-full bg-primary hover:bg-primary-dark text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
      >
        Далее: Скан лица
        <ChevronRight size={18} />
      </button>
    </form>
  );
};

// =====================================
// Шаг 3: Скан лица
// =====================================
const StepScanFace = ({ formData, onDone, onBack }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | loading | scanning | captured | error
  const [descriptor, setDescriptor] = useState(null);
  const [countdown, setCountdown] = useState(3);

  const startCamera = async () => {
    setStatus('loading');
    try {
      // Загружаем модели если надо
      if (!faceapi.nets.tinyFaceDetector.isLoaded) {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        ]);
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setStatus('scanning');

      // Обратный отсчёт 3 секунды, потом скан
      let c = 3;
      setCountdown(c);
      const interval = setInterval(() => {
        c--;
        setCountdown(c);
        if (c <= 0) clearInterval(interval);
      }, 1000);

      await new Promise(r => setTimeout(r, 3500));

      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        setDescriptor(Array.from(detection.descriptor));
        
        // Capture photo for avatar
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
        const base64Image = canvas.toDataURL('image/jpeg', 0.8);
        onDone({ ...formData, faceDescriptor: Array.from(detection.descriptor), image: base64Image });
        
        setStatus('captured');
      } else {
        setStatus('error');
      }

      stream.getTracks().forEach(t => t.stop());
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setStatus('loading');
    
    try {
      if (!faceapi.nets.tinyFaceDetector.isLoaded) {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        ]);
      }

      const img = await faceapi.bufferToImage(file);
      const detection = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        setDescriptor(Array.from(detection.descriptor));
        
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);
        const base64Image = canvas.toDataURL('image/jpeg', 0.8);
        
        onDone({ ...formData, faceDescriptor: Array.from(detection.descriptor), image: base64Image });
        setStatus('captured');
      } else {
        setStatus('error');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <button type="button" onClick={onBack} className="text-gray-400 hover:text-white transition-colors">← Назад</button>
        <h2 className="text-xl font-bold text-white">Сканирование лица</h2>
      </div>

      {/* Превью камеры */}
      <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-white/10">
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
        
        {status === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Camera size={48} className="text-gray-500 mb-3" />
            <p className="text-gray-400">Камера не активна</p>
          </div>
        )}

        {status === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-white">Загрузка ИИ...</p>
          </div>
        )}

        {status === 'scanning' && countdown > 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-40 h-40 border-4 border-primary/50 rounded-full flex items-center justify-center">
              <span className="text-6xl font-bold text-white">{countdown}</span>
            </div>
          </div>
        )}

        {status === 'captured' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-primary/20 backdrop-blur-sm">
            <CheckCircle size={64} className="text-primary mb-3" />
            <p className="text-white font-bold text-lg">Лицо записано!</p>
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/20 backdrop-blur-sm">
            <X size={64} className="text-red-400 mb-3" />
            <p className="text-white font-bold">Лицо не обнаружено</p>
            <p className="text-gray-300 text-sm">Смотрите прямо в камеру</p>
          </div>
        )}
      </div>

      {status === 'idle' && (
        <div className="space-y-2">
          <button
            onClick={startCamera}
            className="w-full bg-primary hover:bg-primary-dark text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            <Camera size={18} />
            Включить камеру и сканировать
          </button>
          
          <div className="relative">
            <input type="file" accept="image/*" id="photo-upload" className="hidden" onChange={handleFileUpload} />
            <label htmlFor="photo-upload" className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer">
              Загрузить фото из файла
            </label>
          </div>
        </div>
      )}

      {status === 'error' && (
        <button
          onClick={startCamera}
          className="w-full bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
        >
          <RefreshCw size={18} />
          Попробовать снова
        </button>
      )}

      {status === 'captured' && (
        <button
          onClick={() => {}}
          disabled
          className="w-full bg-primary/50 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all opacity-50"
        >
          <CheckCircle size={18} />
          Сохранено автоматически
        </button>
      )}
    </div>
  );
};

// =====================================
// Главная страница Students
// =====================================
const Students = () => {
  const [students, setStudents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState(1); // 1=роль, 2=данные, 3=лицо, 4=редактирование
  const [selectedRole, setSelectedRole] = useState(null);
  const [stepData, setStepData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [isSaving, setIsSaving] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
      const res = await fetch('/api/students', {
        headers: { Authorization: `Bearer ${adminInfo.token}` }
      });
      if (res.ok) setStudents(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить из базы?')) return;
    try {
      const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
      const res = await fetch(`/api/students/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminInfo.token}` }
      });
      if (res.ok) fetchStudents();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSavePerson = async (finalData) => {
    setIsSaving(true);
    try {
      const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminInfo.token}` },
        body: JSON.stringify(finalData)
      });

      if (res.ok) {
        setIsModalOpen(false);
        resetModal();
        fetchStudents();
      } else {
        const err = await res.json();
        alert(err.message || 'Ошибка при сохранении');
      }
    } catch (err) {
      console.error(err);
    }
    setIsSaving(false);
  };

  const handleUpdatePerson = async (finalData) => {
    setIsSaving(true);
    try {
      const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
      const res = await fetch(`/api/students/${editingStudent._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminInfo.token}` },
        body: JSON.stringify(finalData)
      });

      if (res.ok) {
        setIsModalOpen(false);
        resetModal();
        fetchStudents();
      } else {
        const err = await res.json();
        alert(err.message || 'Ошибка при сохранении');
      }
    } catch (err) {
      console.error(err);
    }
    setIsSaving(false);
  };

  const resetModal = () => {
    setStep(1);
    setSelectedRole(null);
    setStepData(null);
    setEditingStudent(null);
  };

  const openModal = () => {
    resetModal();
    setStep(1);
    setIsModalOpen(true);
  };

  const openEditModal = (student) => {
    resetModal();
    setEditingStudent(student);
    setSelectedRole(student.roleType || 'Студент');
    setStep(4);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetModal();
  };

  const filteredStudents = students.filter(s => {
    const matchSearch = s.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentId?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = filterRole === 'all' || s.roleType === filterRole;
    return matchSearch && matchRole;
  });

  const roleColors = {
    'Студент': 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5',
    'Преподаватель': 'border-blue-500/30 text-blue-400 bg-blue-500/5',
    'Сотрудник': 'border-purple-500/30 text-purple-400 bg-purple-500/5'
  };

  return (
    <div className="space-y-8 pb-10">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight uppercase">
            PERSONNEL <span className="text-primary text-neon">DATABASE</span>
          </h1>
          <p className="text-gray-400 font-medium flex items-center gap-2 mt-1">
            Управление биометрическими данными и ролями доступа
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative group">
            <input
              type="text"
              placeholder="Поиск по ФИО или ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-primary/50 placeholder-gray-600 w-64 transition-all focus:w-80 group-hover:bg-white/10"
            />
          </div>
          <select
            value={filterRole}
            onChange={e => setFilterRole(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-primary/50 cursor-pointer hover:bg-white/10 transition-all"
          >
            <option value="all" className="bg-gray-900">Все категории</option>
            <option value="Студент" className="bg-gray-900">👨‍🎓 Студенты</option>
            <option value="Преподаватель" className="bg-gray-900">👨‍🏫 Преподаватели</option>
            <option value="Сотрудник" className="bg-gray-900">👨‍🔧 Сотрудники</option>
          </select>
          <button
            onClick={openModal}
            className="bg-primary text-black font-black px-6 py-3 rounded-2xl flex items-center gap-2 hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all uppercase tracking-widest text-xs"
          >
            <UserPlus size={18} />
            Add User
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredStudents.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center opacity-30">
            <Users size={80} className="mb-4" />
            <p className="text-2xl font-black uppercase tracking-widest">Database Empty</p>
          </div>
        ) : (
          filteredStudents.map((person, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={person._id}
              className="glass-card group border-white/5 hover:border-primary/30 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>
              
              <div className="flex justify-between items-start mb-6">
                {person.image ? (
                  <div className="w-14 h-14 bg-cover bg-center rounded-2xl border border-white/10 relative" style={{ backgroundImage: `url(${person.image})` }}>
                    {person.isActive === false && <div className="absolute inset-0 bg-red-500/50 rounded-2xl flex items-center justify-center"><X size={20} className="text-white"/></div>}
                  </div>
                ) : (
                  <div className="w-14 h-14 bg-gradient-to-br from-white/10 to-transparent rounded-2xl flex items-center justify-center font-black text-2xl text-white/80 border border-white/10 relative">
                    {person.fullName[0].toUpperCase()}
                    {person.isActive === false && <div className="absolute inset-0 bg-red-500/50 rounded-2xl flex items-center justify-center"><X size={20} className="text-white"/></div>}
                  </div>
                )}
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${roleColors[person.roleType] || 'border-white/20 text-white/40'}`}>
                  {person.roleType || 'Студент'}
                </div>
              </div>

              <div className="space-y-1 mb-6">
                <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors truncate">
                  {person.fullName}
                </h3>
                <p className="text-xs font-mono text-gray-500 tracking-tighter uppercase">
                  UID: <span className="text-gray-300">{person.studentId}</span>
                </p>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                <div className="flex-1">
                  <p className="text-[10px] uppercase text-gray-600 font-black tracking-widest">Department / Group</p>
                  <p className="text-sm font-medium text-gray-300 truncate">
                    {person.group || person.department || '—'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => openEditModal(person)}
                    className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all shadow-lg shadow-blue-500/0 hover:shadow-blue-500/20"
                  >
                    ✎
                  </button>
                  <button 
                    onClick={() => handleDelete(person._id)}
                    className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20 hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/0 hover:shadow-red-500/20"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/0 to-transparent group-hover:via-primary/30 transition-all duration-700"></div>
            </motion.div>
          ))
        )}
      </div>

      {/* Модальное окно: многошаговая регистрация */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-xl glass-card border-primary/30 shadow-[0_0_80px_rgba(16,185,129,0.15)] relative"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                  {step === 4 ? 'Edit User' : 'User Registration'}
                </h2>
                {step !== 4 && <p className="text-gray-500 text-xs font-mono uppercase mt-1">Step {step} of 3</p>}
              </div>
              <button 
                onClick={closeModal}
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Прогресс */}
            {step !== 4 && (
              <div className="flex items-center gap-2 mb-10">
                {[1, 2, 3].map(n => (
                  <div key={n} className="flex-1 relative h-1.5">
                    <div className={`absolute inset-0 rounded-full ${n <= step ? 'bg-primary shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-white/10'}`} />
                    {n === step && <div className="absolute inset-0 bg-primary animate-ping opacity-40 rounded-full" />}
                  </div>
                ))}
              </div>
            )}

            <div className="min-h-[400px]">
              {step === 1 && (
                <StepChooseRole onNext={(role) => { setSelectedRole(role); setStep(2); }} />
              )}
              {step === 2 && (
                <StepFillData
                  roleType={selectedRole}
                  students={students}
                  onNext={(data) => { setStepData(data); setStep(3); }}
                  onBack={() => setStep(1)}
                />
              )}
              {step === 3 && (
                <StepScanFace
                  formData={stepData}
                  onDone={(data) => {
                    handleSavePerson(data);
                    // Automatically called from capture
                  }}
                  onBack={() => setStep(2)}
                />
              )}
              {step === 4 && editingStudent && (
                <div className="space-y-4">
                  <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 mb-4">
                    <p className="text-xs text-gray-400">Редактирование профиля</p>
                    <p className="text-primary font-mono font-bold">{editingStudent.studentId}</p>
                  </div>
                  <input
                    placeholder="Полное ФИО"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary placeholder-gray-500"
                    value={editingStudent.fullName || ''}
                    onChange={e => setEditingStudent({ ...editingStudent, fullName: e.target.value })}
                  />
                  <input
                    placeholder="Группа / Должность"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary placeholder-gray-500"
                    value={editingStudent.group || editingStudent.department || ''}
                    onChange={e => {
                      if (editingStudent.roleType === 'Студент') {
                        setEditingStudent({ ...editingStudent, group: e.target.value });
                      } else {
                        setEditingStudent({ ...editingStudent, department: e.target.value });
                      }
                    }}
                  />
                  
                  <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4 mt-4">
                    <span className="text-sm font-bold text-white">Доступ к системе</span>
                    <button
                      onClick={() => setEditingStudent({ ...editingStudent, isActive: editingStudent.isActive === false ? true : false })}
                      className={`w-12 h-6 rounded-full transition-colors relative ${editingStudent.isActive !== false ? 'bg-primary' : 'bg-red-500'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${editingStudent.isActive !== false ? 'left-6' : 'left-0.5'}`}></div>
                    </button>
                  </div>

                  <button
                    onClick={() => handleUpdatePerson(editingStudent)}
                    className="w-full bg-primary hover:bg-primary-dark text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all mt-4"
                  >
                    Сохранить изменения
                  </button>
                </div>
              )}
            </div>

            {isSaving && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center rounded-3xl z-50">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6" />
                <p className="text-primary font-mono text-xs uppercase tracking-[0.3em] animate-pulse">Uploading to Core...</p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Students;

