import db from '../db/jsonStore.js';
import { notifySubscribers } from '../utils/telegramBot.js';

const Attendance = db.getCollection('attendance');
const Student = db.getCollection('students');

// @desc    Log attendance
// @route   POST /api/attendance
// @access  Private
export const logAttendance = async (req, res) => {
  const { studentId, confidenceScore } = req.body;

  try {
    const now = new Date();

    const attendance = Attendance.create({
      studentId,
      confidenceScore,
      location: req.body.location || 'MAIN BLOCK',
      status: 'Present',
      timestamp: now.toISOString()
    });

    // Уведомляем всех подписчиков в Telegram
    const person = Student.findById(studentId);
    console.log(`🔍 [ATTENDANCE]: Попытка уведомления для ${studentId}. Найден: ${person ? person.fullName : 'НЕТ'}`);
    if (person) {
      notifySubscribers(person).catch(e => console.error('TG notify error:', e));
    } else {
      console.warn(`⚠️ [ATTENDANCE]: Пропуск уведомления, так как студент с _id=${studentId} не найден в базе.`);
    }

    res.status(201).json({ ...attendance, student: person || null });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Invalid attendance data' });
  }
};

// @desc    Get all attendance logs
// @route   GET /api/attendance
// @access  Private
export const getAttendanceLogs = async (req, res) => {
  try {
    const admin = req.admin;
    let allStudents = Student.find({});
    
    if (admin.role === 'teacher' && admin.assignedGroup) {
      allStudents = allStudents.filter(s => s.group === admin.assignedGroup);
    } else if (admin.role === 'parent' && admin.assignedStudentId) {
      allStudents = allStudents.filter(s => s.studentId === admin.assignedStudentId);
    }

    const allowedStudentIds = new Set(allStudents.map(s => s._id));
    let logs = Attendance.find({});
    
    if (admin.role !== 'admin') {
      logs = logs.filter(log => allowedStudentIds.has(log.studentId));
    }

    const populatedLogs = logs.map(log => ({
      ...log,
      student: Student.findById(log.studentId) || null
    }));

    const sortedLogs = Attendance.sort(populatedLogs, { createdAt: -1 });
    res.json(sortedLogs);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
