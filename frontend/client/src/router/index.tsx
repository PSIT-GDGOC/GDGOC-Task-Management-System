import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { TaskBoard } from '../pages/TaskBoard';
import { MyWorkHistory } from '../pages/MyWorkHistory';
import { MyProfile } from '../pages/MyProfile';
import { Login } from '../pages/Login';

interface AppRouterProps {
  user: any;
  onLoginSuccess: (user: any) => void;
  onLogout: () => void;
}

export const AppRouter: React.FC<AppRouterProps> = ({ user, onLoginSuccess, onLogout }) => {
  return (
    <Routes>
      <Route path="/login" element={<Login onLoginSuccess={onLoginSuccess} />} />
      <Route element={<MainLayout user={user} onLogout={onLogout} />}>
        <Route index element={<TaskBoard />} />
        <Route path="history" element={<MyWorkHistory user={user} />} />
        <Route path="profile" element={<MyProfile user={user} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};
