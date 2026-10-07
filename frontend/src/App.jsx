import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

import StudentOverview from './pages/Student/StudentOverview';
import StudentExams from './pages/Student/StudentExams';
import ExamInstruction from './pages/Student/ExamInstruction';
import TakeExam from './pages/Student/TakeExam';
import StudentHistory from './pages/Student/StudentHistory';

import TeacherOverview from './pages/Teacher/TeacherOverview';
import TeacherClasses from './pages/Teacher/TeacherClasses';
import TeacherCreateExam from './pages/Teacher/TeacherCreateExam';
import TeacherLiveMonitor from './pages/Teacher/TeacherLiveMonitor';

import AdminDashboard from './pages/Admin/AdminDashboard';

import { getCurrentUser } from './utils/api';

function HomeRedirect() {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user.role === 'TEACHER') return <Navigate to="/teacher" replace />;
  return <Navigate to="/student" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<HomeRedirect />} />

        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentOverview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/exams"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentExams />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/exam-instruction/:id"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <ExamInstruction />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/take-exam/:id"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <TakeExam />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/history"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentHistory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherOverview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/classes"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherClasses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/create-exam"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherCreateExam />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/live-monitor"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherLiveMonitor />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
