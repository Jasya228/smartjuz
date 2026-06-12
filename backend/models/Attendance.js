import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Student',
  },
  status: {
    type: String,
    enum: ['Present', 'Late', 'Absent'],
    default: 'Present',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  confidenceScore: {
    type: Number,
    required: true, // Stores the AI recognition confidence score
  }
}, { timestamps: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
