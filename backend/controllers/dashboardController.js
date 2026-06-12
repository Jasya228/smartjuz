import db from '../db/jsonStore.js';

const Attendance = db.getCollection('attendance');
const Student = db.getCollection('students');

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private
export const getDashboardStats = async (req, res) => {
  try {
    const admin = req.admin;
    let allStudents = Student.find({});
    
    if (admin.role === 'teacher' && admin.assignedGroup) {
      allStudents = allStudents.filter(s => s.group === admin.assignedGroup);
    } else if (admin.role === 'parent' && admin.assignedStudentId) {
      allStudents = allStudents.filter(s => s.studentId === admin.assignedStudentId);
    }
    
    const allowedStudentIds = new Set(allStudents.map(s => s._id));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let todaysAttendance = Attendance.find({
      createdAt: {
        $gte: today.toISOString(),
        $lt: tomorrow.toISOString()
      }
    });

    if (admin.role !== 'admin') {
      todaysAttendance = todaysAttendance.filter(a => allowedStudentIds.has(a.studentId));
    }

    const uniqueStudentsToday = new Set(todaysAttendance.map(a => a.studentId));
    const presentToday = uniqueStudentsToday.size;
    
    // Unknown faces metric
    const unknownFaces = admin.role === 'admin' ? db.getCollection('threats').find({}).length : 0;

    res.json({
      totalStudents: allStudents.length,
      presentToday,
      unknownFaces
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
