import express from 'express';
import { getAttendanceLogs, logAttendance } from '../controllers/attendanceController.js';
import { protect } from '../middleware/authMiddleware.js';
import db from '../db/jsonStore.js';

const router = express.Router();

router.route('/')
  .get(protect, getAttendanceLogs)
  .post(logAttendance);

// Очистка всех логов посещаемости
router.delete('/clear', protect, (req, res) => {
  try {
    if (req.admin.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ только для администратора' });
    }
    const Attendance = db.getCollection('attendance');
    Attendance.data = [];
    Attendance._save();
    res.json({ message: 'Логи очищены' });
  } catch (e) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

export default router;
