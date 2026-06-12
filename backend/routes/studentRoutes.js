import express from 'express';
import { getStudents, addStudent, deleteStudent, getStudentDescriptors, updateStudent } from '../controllers/studentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getStudents)
  .post(protect, addStudent);

router.get('/descriptors', getStudentDescriptors);

router.route('/:id')
  .put(protect, updateStudent)
  .delete(protect, deleteStudent);

export default router;
