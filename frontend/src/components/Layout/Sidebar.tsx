import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Activity,
  FileText,
  Mic,
  Settings,
  User,
  BarChart3,
  Stethoscope,
  Users,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  const doctorMenuItems = [
    { icon: Activity, label: 'Dashboard', path: '/doctor' },
    { icon: Mic, label: 'New Consultation', path: '/doctor/consultation' },
    { icon: FileText, label: 'Medical Notes', path: '/notes' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: Settings, label: 'Settings', path: '/doctor/settings' },
  ];

  const patientMenuItems = [
    { icon: User, label: 'My Portal', path: '/patient' },
    { icon: FileText, label: 'My Records', path: '/patient/records' },
    { icon: Settings, label: 'Settings', path: '/patient/settings' },
  ];

  const menuItems = user?.role === 'doctor' ? doctorMenuItems : patientMenuItems;

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-medical-blue rounded-lg flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">MediAssist</h1>
            <p className="text-sm text-gray-500">AI Healthcare Assistant</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path ||
            (item.path !== '/doctor' && location.pathname.startsWith(item.path));

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-medical-teal rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;