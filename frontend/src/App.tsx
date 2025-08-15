import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import DoctorDashboard from './pages/Doctor/Dashboard';
import PatientPortal from './pages/Patient/Portal';
import Analytics from './pages/Analytics/Analytics';
import NotesView from './pages/Notes/NotesView';
import NoteDetail from './pages/Notes/NoteDetail';
import ProtectedRoute from './components/Auth/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route
                        path="/"
                        element={
                          <ProtectedRoute role="doctor">
                            <DoctorDashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/doctor/*"
                        element={
                          <ProtectedRoute role="doctor">
                            <DoctorDashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/patient/*"
                        element={
                          <ProtectedRoute role="patient">
                            <PatientPortal />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/analytics"
                        element={
                          <ProtectedRoute role="doctor">
                            <Analytics />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/notes"
                        element={
                          <ProtectedRoute>
                            <NotesView />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/notes/:id"
                        element={
                          <ProtectedRoute>
                            <NoteDetail />
                          </ProtectedRoute>
                        }
                      />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;