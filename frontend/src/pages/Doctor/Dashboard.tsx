import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import {
  Mic,
  FileText,
  Clock,
  Users,
  TrendingUp,
  Plus,
  Upload,
  Play,
  Pause,
  Square,
} from 'lucide-react';
import { notesAPI, analyticsAPI } from '../../services/api';
import AudioRecorder from '../../components/Medical/AudioRecorder';
import TranscriptViewer from '../../components/Medical/TranscriptViewer';
import SOAPNoteViewer from '../../components/Medical/SOAPNoteViewer';
import toast from 'react-hot-toast';

const DoctorDashboard: React.FC = () => {
  const [dashboardStats, setDashboardStats] = useState({
    totalConsultations: 0,
    todayConsultations: 0,
    pendingNotes: 0,
    averageProcessingTime: 0,
  });
  const [recentNotes, setRecentNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsResponse, notesResponse] = await Promise.all([
        analyticsAPI.getDashboardStats(),
        notesAPI.getNotes({ limit: 5, sort: '-createdAt' }),
      ]);

      if (statsResponse.data.success) {
        setDashboardStats(statsResponse.data.data);
      }

      if (notesResponse.data.success) {
        setRecentNotes(notesResponse.data.data);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: string;
    color: string;
  }> = ({ title, value, icon, trend, color }) => (
    <div className={`medical-card border-l-${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <p className="text-sm text-green-600 mt-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              {trend}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 bg-${color} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <Routes>
      <Route
        index
        element={
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
                <p className="text-gray-600 mt-1">
                  Welcome back! Here's your medical practice overview.
                </p>
              </div>
              <button
                onClick={() => navigate('/doctor/consultation')}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>New Consultation</span>
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Consultations"
                value={dashboardStats.totalConsultations}
                icon={<FileText className="w-6 h-6 text-white" />}
                trend="+12% from last month"
                color="medical-blue"
              />
              <StatCard
                title="Today's Consultations"
                value={dashboardStats.todayConsultations}
                icon={<Clock className="w-6 h-6 text-white" />}
                color="medical-teal"
              />
              <StatCard
                title="Pending Reviews"
                value={dashboardStats.pendingNotes}
                icon={<Users className="w-6 h-6 text-white" />}
                color="medical-orange"
              />
              <StatCard
                title="Avg. Processing Time"
                value={`${dashboardStats.averageProcessingTime}s`}
                icon={<TrendingUp className="w-6 h-6 text-white" />}
                trend="5% faster"
                color="medical-green"
              />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Audio Recording Card */}
              <div className="medical-card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Mic className="w-5 h-5 mr-2 text-medical-blue" />
                  Quick Consultation Recording
                </h3>
                <AudioRecorder
                  onTranscriptGenerated={(transcript) => {
                    toast.success('Transcript generated successfully!');
                  }}
                  onNotesGenerated={(notes) => {
                    toast.success('Medical notes generated successfully!');
                    // Refresh the recent notes list
                    loadDashboardData();
                  }}
                />
              </div>

              {/* Recent Activity */}
              <div className="medical-card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-medical-blue" />
                  Recent Medical Notes
                </h3>
                <div className="space-y-3">
                  {recentNotes.length > 0 ? (
                    recentNotes.map((note: any) => (
                      <div
                        key={note._id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                        onClick={() => navigate(`/notes/${note._id}`)}
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {note.patientName || 'Consultation Note'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(note.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`medical-badge ${note.status === 'approved'
                                ? 'status-approved'
                                : note.status === 'pending'
                                  ? 'status-pending'
                                  : 'status-draft'
                              }`}
                          >
                            {note.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      No recent notes found. Start your first consultation!
                    </p>
                  )}
                </div>
                <button
                  onClick={() => navigate('/doctor/notes')}
                  className="w-full mt-4 btn-secondary"
                >
                  View All Notes
                </button>
              </div>
            </div>
          </div>
        }
      />

      <Route
        path="consultation"
        element={
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">New Consultation</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="medical-card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Record Consultation Audio
                </h3>
                <AudioRecorder
                  onTranscriptGenerated={(transcript) => {
                    toast.success('Consultation recorded successfully!');
                  }}
                  onNotesGenerated={(notes) => {
                    toast.success('Medical notes generated successfully!');
                    // Navigate to the notes view
                    if (notes.noteId) {
                      navigate(`/notes/${notes.noteId}`);
                    }
                  }}
                />
              </div>
              <div className="medical-card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Upload Audio File
                </h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-medical-blue transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Drop audio files here or click to browse</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Supports MP3, WAV, M4A files up to 50MB
                  </p>
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        toast.success('Audio file uploaded successfully!');
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        }
      />

      <Route
        path="notes"
        element={
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Medical Notes</h1>
            <div className="medical-card">
              <p className="text-gray-600">Medical notes management interface coming soon...</p>
            </div>
          </div>
        }
      />
    </Routes>
  );
};

export default DoctorDashboard;