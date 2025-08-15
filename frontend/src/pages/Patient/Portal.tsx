import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { FileText, Download, Volume2, Calendar, User } from 'lucide-react';
import { notesAPI, ttsAPI } from '../../services/api';
import toast from 'react-hot-toast';

const PatientPortal: React.FC = () => {
  const [patientRecords, setPatientRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPatientRecords();
  }, []);

  const loadPatientRecords = async () => {
    try {
      const response = await notesAPI.getNotes({ patientView: true });
      if (response.data.success) {
        setPatientRecords(response.data.data);
      }
    } catch (error) {
      console.error('Error loading patient records:', error);
      toast.error('Failed to load your medical records');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayAudio = async (text: string) => {
    try {
      const response = await ttsAPI.generateSpeech({ text });
      const audioBlob = new Blob([response.data], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      toast.error('Failed to play audio');
    }
  };

  const handleDownloadPDF = async (recordId: string) => {
    try {
      const response = await notesAPI.exportToPDF(recordId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medical-record-${recordId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  return (
    <Routes>
      <Route
        index
        element={
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Patient Portal</h1>
                <p className="text-gray-600 mt-1">
                  Access your medical records and consultation summaries.
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="medical-card border-l-medical-teal">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Records</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {patientRecords.length}
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-medical-teal" />
                </div>
              </div>

              <div className="medical-card border-l-medical-blue">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Last Visit</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      {patientRecords.length > 0
                        ? new Date(patientRecords[0].createdAt).toLocaleDateString()
                        : 'No visits'}
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-medical-blue" />
                </div>
              </div>

              <div className="medical-card border-l-medical-green">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Health Status</p>
                    <p className="text-lg font-bold text-green-600 mt-1">Good</p>
                  </div>
                  <User className="w-8 h-8 text-medical-green" />
                </div>
              </div>
            </div>

            {/* Medical Records */}
            <div className="medical-card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-medical-blue" />
                Your Medical Records
              </h3>

              {isLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-medical-blue border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-gray-600">Loading your medical records...</p>
                </div>
              ) : patientRecords.length > 0 ? (
                <div className="space-y-4">
                  {patientRecords.map((record: any) => (
                    <div
                      key={record._id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            Consultation - {new Date(record.createdAt).toLocaleDateString()}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Dr. {record.doctorName || 'Healthcare Provider'}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handlePlayAudio(record.patientSummary || record.summary)}
                            className="p-2 text-medical-teal hover:bg-secondary-50 rounded-lg transition-colors"
                            title="Play audio summary"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(record._id)}
                            className="p-2 text-medical-blue hover:bg-primary-50 rounded-lg transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {record.patientSummary && (
                        <div className="bg-blue-50 rounded-lg p-3 mb-3">
                          <p className="text-sm font-medium text-blue-800 mb-1">Summary</p>
                          <p className="text-sm text-blue-700">{record.patientSummary}</p>
                        </div>
                      )}

                      {record.recommendations && record.recommendations.length > 0 && (
                        <div className="bg-green-50 rounded-lg p-3">
                          <p className="text-sm font-medium text-green-800 mb-1">
                            Recommendations
                          </p>
                          <ul className="text-sm text-green-700 space-y-1">
                            {record.recommendations.map((rec: string, index: number) => (
                              <li key={index} className="flex items-start">
                                <span className="w-1 h-1 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">No medical records found</p>
                  <p className="text-sm text-gray-500">
                    Your consultation records will appear here after your first visit.
                  </p>
                </div>
              )}
            </div>
          </div>
        }
      />

      <Route
        path="records"
        element={
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Medical Records</h1>
            <div className="medical-card">
              <p className="text-gray-600">Detailed medical records view coming soon...</p>
            </div>
          </div>
        }
      />

      <Route
        path="settings"
        element={
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <div className="medical-card">
              <p className="text-gray-600">Patient settings panel coming soon...</p>
            </div>
          </div>
        }
      />
    </Routes>
  );
};

export default PatientPortal;