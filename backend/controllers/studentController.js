import db from '../db/jsonStore.js';

const Student = db.getCollection('students');

// @desc    Get all students
// @route   GET /api/students
// @access  Private
export const getStudents = async (req, res) => {
  try {
    const admin = req.admin;
    let students = Student.find({});

    // Filter students by role
    if (admin.role === 'teacher' && admin.assignedGroup) {
      students = students.filter(s => s.group === admin.assignedGroup);
    } else if (admin.role === 'parent' && admin.assignedStudentId) {
      students = students.filter(s => s.studentId === admin.assignedStudentId);
    }

    const filteredStudents = students.map(s => {
      const { faceDescriptor, ...rest } = s;
      return rest;
    });
    res.json(filteredStudents);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get student face descriptors for Face ID matcher
// @route   GET /api/students/descriptors
// @access  Private
export const getStudentDescriptors = async (req, res) => {
  try {
    const students = Student.find({ isActive: true });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Add new student/staff
// @route   POST /api/students
// @access  Private
export const addStudent = async (req, res) => {
  const { fullName, studentId, group, department, faceDescriptor, roleType, image } = req.body;

  try {
    const studentExists = Student.findOne({ studentId });
    if (studentExists) {
      return res.status(400).json({ message: 'Сотрудник/Студент с таким ID уже существует' });
    }

    const student = Student.create({
      fullName,
      studentId,
      group,
      department,
      roleType: roleType || 'Студент',
      faceDescriptor,
      image,
      isActive: true
    });

    res.status(201).json(student);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Invalid data' });
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private
export const deleteStudent = async (req, res) => {
  try {
    const student = Student.findById(req.params.id);
    if (student) {
      Student.deleteById(req.params.id);
      res.json({ message: 'Student removed' });
    } else {
      res.status(404).json({ message: 'Student not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private
export const updateStudent = async (req, res) => {
  const { fullName, group, department, roleType } = req.body;
  try {
    const student = Student.findById(req.params.id);
    if (student) {
      const updated = Student.updateById(req.params.id, {
        fullName,
        group,
        department,
        roleType
      });
      res.json(updated);
    } else {
      res.status(404).json({ message: 'Student not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
