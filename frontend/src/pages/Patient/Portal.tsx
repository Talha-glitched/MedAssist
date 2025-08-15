import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Calendar,
  FileText,
  Download,
  Eye,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { notesAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface PatientNote {
  _id: string;
  patientName: string;
  dateOfService: string;
  patientSummary: string;
  recommendations: string[];
  followUp: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  doctorId: {
    _id: string;
    name: string;
    email: string;
  };
}

const PatientPortal: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notes, setNotes] = useState<PatientNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<PatientNote | null>(null);

  useEffect(() => {
    loadPatientNotes();
  }, []);

  const loadPatientNotes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        patientView: 'true',
        limit: '20'
      });
      const response = await notesAPI.getNotes(params.toString());
      setNotes(response.data.data);
    } catch (error: any) {
      toast.error('Failed to load your medical records: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNoteClick = (note: PatientNote) => {
    setSelectedNote(note);
  };

  const handleExport = async (noteId: string) => {
    try {
      const response = await notesAPI.exportPDF(noteId);
      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-medical-note-${noteId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Medical record downloaded successfully');
    } catch (error: any) {
      toast.error('Failed to download record: ' + error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending Review
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your medical records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Medical Records</h1>
              <p className="mt-2 text-gray-600">
                View your medical consultations and health summaries
              </p>
            </div>
            <button
              onClick={loadPatientNotes}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Patient Info Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{user?.name}</h2>
              <p className="text-gray-600">Patient ID: {user?._id}</p>
            </div>
          </div>
        </div>

        {/* Notes List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">
              Medical Records ({notes.length})
            </h2>
          </div>

          {notes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No medical records found</h3>
              <p className="text-gray-500">
                Your approved medical records will appear here once they are reviewed by your doctor.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <div
                  key={note._id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleNoteClick(note)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Consultation with Dr. {note.doctorId.name}
                        </h3>
                        {getStatusBadge(note.status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(note.dateOfService).toLocaleDateString()}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <FileText className="w-4 h-4 mr-2" />
                          {note.recommendations.length} recommendations
                        </div>
                      </div>

                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Summary</h4>
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {note.patientSummary}
                        </p>
                      </div>

                      {note.followUp && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Follow-up</h4>
                          <p className="text-sm text-gray-600">
                            {note.followUp}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNoteClick(note);
                        }}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExport(note._id);
                        }}
                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Note Detail Modal */}
        {selectedNote && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Medical Record - {new Date(selectedNote.dateOfService).toLocaleDateString()}
                </h3>
                <button
                  onClick={() => setSelectedNote(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <AlertCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Doctor Info */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Doctor Information</h4>
                  <p className="text-gray-700">Dr. {selectedNote.doctorId.name}</p>
                  <p className="text-sm text-gray-600">Consultation Date: {new Date(selectedNote.dateOfService).toLocaleDateString()}</p>
                </div>

                {/* Patient Summary */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Visit Summary</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-line">{selectedNote.patientSummary}</p>
                  </div>
                </div>

                {/* Recommendations */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Recommendations</h4>
                  {selectedNote.recommendations.length > 0 ? (
                    <ul className="space-y-2">
                      {selectedNote.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start p-3 bg-green-50 rounded-md">
                          <span className="w-2 h-2 bg-green-400 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                          <span className="text-gray-700">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic">No specific recommendations provided</p>
                  )}
                </div>

                {/* Follow-up */}
                {selectedNote.followUp && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Follow-up Instructions</h4>
                    <div className="bg-yellow-50 p-4 rounded-md">
                      <p className="text-gray-700">{selectedNote.followUp}</p>
                    </div>
                  </div>
                )}

                {/* Status */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Record Status</h4>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(selectedNote.status)}
                    <span className="text-sm text-gray-600">
                      {selectedNote.status === 'approved'
                        ? 'This record has been reviewed and approved by your doctor.'
                        : selectedNote.status === 'rejected'
                          ? 'This record requires revision by your doctor.'
                          : 'This record is currently being reviewed by your doctor.'
                      }
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedNote(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => handleExport(selectedNote._id)}
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="w-4 h-4 mr-2 inline" />
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientPortal;