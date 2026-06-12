import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  studentId: {
    type: String,
    required: true,
    unique: true,
  },
  group: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  faceDescriptor: {
    // Array of numbers representing the 128D face descriptor
    type: [Number], 
    required: true,
  },
  photoUrl: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  }
}, { timestamps: true });

const Student = mongoose.model('Student', studentSchema);
export default Student;
