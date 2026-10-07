const { ROLES } = require('../models/User');
const { Class } = require('../models/Class');
const { ClassTeacher } = require('../models/ClassTeacher');
const { ClassStudent } = require('../models/ClassStudent');

class DataIsolationHelper {
  static async getTeacherAccessibleClassIds(teacherId) {
    const createdClasses = await Class.find({ createdBy: teacherId }, '_id').lean();
    const createdClassIds = createdClasses.map((c) => c._id);

    const assignedClasses = await ClassTeacher.find({ teacherId }, 'classId').lean();
    const assignedClassIds = assignedClasses.map((ct) => ct.classId);

    const uniqueClassIdStrings = Array.from(
      new Set([
        ...createdClassIds.map((id) => id.toString()),
        ...assignedClassIds.map((id) => id.toString()),
      ])
    );

    return uniqueClassIdStrings;
  }

  static async getStudentEnrolledClassIds(studentId) {
    const enrollments = await ClassStudent.find(
      { studentId, isActive: true },
      'classId'
    ).lean();

    return enrollments.map((e) => e.classId);
  }

  static async getClassScopeFilter(currentUser) {
    if (currentUser.role === ROLES.ADMIN) {
      return {};
    }

    if (currentUser.role === ROLES.TEACHER) {
      const accessibleClassIds = await this.getTeacherAccessibleClassIds(currentUser._id);
      return {
        $or: [
          { _id: { $in: accessibleClassIds } },
          { createdBy: currentUser._id },
        ],
      };
    }

    if (currentUser.role === ROLES.STUDENT) {
      const enrolledClassIds = await this.getStudentEnrolledClassIds(currentUser._id);
      return { _id: { $in: enrolledClassIds } };
    }

    return { _id: null };
  }

  static async getStudentScopeFilter(currentUser) {
    if (currentUser.role === ROLES.ADMIN) {
      return { role: ROLES.STUDENT };
    }

    if (currentUser.role === ROLES.TEACHER) {
      const accessibleClassIds = await this.getTeacherAccessibleClassIds(currentUser._id);
      
      const studentsInClasses = await ClassStudent.find(
        { classId: { $in: accessibleClassIds } },
        'studentId'
      ).lean();
      const studentIdsInClasses = studentsInClasses.map((s) => s.studentId);

      return {
        role: ROLES.STUDENT,
        $or: [
          { _id: { $in: studentIdsInClasses } },
          { createdBy: currentUser._id },
        ],
      };
    }

    if (currentUser.role === ROLES.STUDENT) {
      return { _id: currentUser._id, role: ROLES.STUDENT };
    }

    return { _id: null };
  }

  static async getExamScopeFilter(currentUser) {
    if (currentUser.role === ROLES.ADMIN) {
      return {};
    }

    if (currentUser.role === ROLES.TEACHER) {
      const accessibleClassIds = await this.getTeacherAccessibleClassIds(currentUser._id);
      return {
        $or: [
          { createdBy: currentUser._id },
          { assignedClasses: { $in: accessibleClassIds } },
        ],
      };
    }

    if (currentUser.role === ROLES.STUDENT) {
      const enrolledClassIds = await this.getStudentEnrolledClassIds(currentUser._id);
      return {
        assignedClasses: { $in: enrolledClassIds },
        status: 'PUBLISHED',
      };
    }

    return { _id: null };
  }

  static async getSubmissionScopeFilter(currentUser) {
    if (currentUser.role === ROLES.ADMIN) {
      return {};
    }

    if (currentUser.role === ROLES.TEACHER) {
      const accessibleClassIds = await this.getTeacherAccessibleClassIds(currentUser._id);
      return {
        classId: { $in: accessibleClassIds },
      };
    }

    if (currentUser.role === ROLES.STUDENT) {
      return {
        studentId: currentUser._id,
      };
    }

    return { _id: null };
  }
}

module.exports = {
  DataIsolationHelper,
};
