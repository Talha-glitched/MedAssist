import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Calendar,
  User,
  FileText,
  Download,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Plus,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { notesAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface MedicalNote {
  _id: string;
  patientName: string;
  dateOfService: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  medications: string[];
  diagnoses: Array<{
    code: string;
    description: string;
    type: 'primary' | 'secondary';
  }>;
  recommendations: string[];
  followUp: string;
  patientSummary: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  doctorId: {
    _id: string;
    name: string;
    email: string;
  };
  processingMetrics: {
    confidenceScore: number;
    extractedEntities: Array<{
      entity: string;
      type: 'medication' | 'diagnosis' | 'symptom' | 'procedure';
      confidence: number;
    }>;
  };
}

interface NotesListProps {
  notes: MedicalNote[];
  loading: boolean;
  onNoteClick: (note: MedicalNote) => void;
  onApprove: (noteId: string) => void;
  onReject: (noteId: string) => void;
  onEdit: (note: MedicalNote) => void;
  onExport: (noteId: string) => void;
}

const NotesList: React.FC<NotesListProps> = ({
  notes,
  loading,
  onNoteClick,
  onApprove,
  onReject,
  onEdit,
  onExport
}) => {
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading notes...</span>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No notes found</h3>
        <p className="text-gray-500">No medical notes match your current filters.</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Approved
        </span>;
      case 'rejected':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Rejected
        </span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </span>;
    }
  };

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <div
          key={note._id}
          className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onNoteClick(note)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <h3 className="text-lg font-semibold text-gray-900">{note.patientName}</h3>
                {getStatusBadge(note.status)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  {new Date(note.dateOfService).toLocaleDateString()}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <User className="w-4 h-4 mr-2" />
                  Dr. {note.doctorId.name}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <FileText className="w-4 h-4 mr-2" />
                  {note.medications.length} medications
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Assessment</h4>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {note.assessment}
                </p>
              </div>

              {note.processingMetrics?.extractedEntities && note.processingMetrics.extractedEntities.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Key Entities</h4>
                  <div className="flex flex-wrap gap-2">
                    {note.processingMetrics.extractedEntities.slice(0, 5).map((entity, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {entity.entity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {isDoctor && (
              <div className="flex flex-col space-y-2 ml-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(note);
                  }}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  title="Edit note"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onExport(note._id);
                  }}
                  className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                  title="Export PDF"
                >
                  <Download className="w-4 h-4" />
                </button>
                {note.status === 'pending' && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onApprove(note._id);
                      }}
                      className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                      title="Approve note"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onReject(note._id);
                      }}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Reject note"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const NotesView: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notes, setNotes] = useState<MedicalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<MedicalNote | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    startDate: '',
    endDate: '',
    patientName: ''
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });

  const loadNotes = async () => {
    try {
      setLoading(true);
      console.log('=== Frontend: Loading notes ===');
      console.log('Pagination:', pagination);
      console.log('Filters:', filters);

      const params = {
        page: pagination.current.toString(),
        limit: '10',
        ...filters
      };

      console.log('Request params:', params);
      const response = await notesAPI.getNotes(params);
      console.log('Response received:', response);
      console.log('Response data:', response.data);
      console.log('Response data type:', typeof response.data);
      console.log('Response data keys:', Object.keys(response.data || {}));
      console.log('Response.data.data:', response.data?.data);
      console.log('Response.data.pagination:', response.data?.pagination);

      if (!response.data?.data) {
        console.error('response.data.data is undefined or null');
        throw new Error('Invalid response structure: data field is missing');
      }

      setNotes(response.data.data);
      setPagination(response.data.pagination);
      console.log('Notes loaded successfully');
    } catch (error: any) {
      console.error('=== Frontend: Error loading notes ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      toast.error('Failed to load notes: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [pagination.current, filters]);

  const handleNoteClick = (note: MedicalNote) => {
    setSelectedNote(note);
  };

  const handleApprove = async (noteId: string) => {
    try {
      await notesAPI.approveNote(noteId);
      toast.success('Note approved successfully');
      loadNotes();
    } catch (error: any) {
      toast.error('Failed to approve note: ' + error.message);
    }
  };

  const handleReject = async (noteId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      await notesAPI.rejectNote(noteId, reason);
      toast.success('Note rejected');
      loadNotes();
    } catch (error: any) {
      toast.error('Failed to reject note: ' + error.message);
    }
  };

  const handleEdit = (note: MedicalNote) => {
    navigate(`/notes/${note._id}/edit`);
  };

  const handleExport = async (noteId: string) => {
    try {
      const response = await notesAPI.exportPDF(noteId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medical-note-${noteId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('PDF exported successfully');
    } catch (error: any) {
      toast.error('Failed to export PDF: ' + error.message);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      startDate: '',
      endDate: '',
      patientName: ''
    });
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Medical Notes</h1>
              <p className="mt-2 text-gray-600">
                Manage and review patient medical notes and consultations
              </p>
            </div>
            {user?.role === 'doctor' && (
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Consultation
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Filters</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Filter className="w-4 h-4 mr-2" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Search notes..."
                    className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {showFilters && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Notes List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">
              Notes ({pagination.total})
            </h2>
            <button
              onClick={loadNotes}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>

          <NotesList
            notes={notes}
            loading={loading}
            onNoteClick={handleNoteClick}
            onApprove={handleApprove}
            onReject={handleReject}
            onEdit={handleEdit}
            onExport={handleExport}
          />

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing page {pagination.current} of {pagination.pages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
                  disabled={pagination.current === 1}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
                  disabled={pagination.current === pagination.pages}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Note Detail Modal */}
        {selectedNote && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Medical Note - {selectedNote.patientName}
                </h3>
                <button
                  onClick={() => setSelectedNote(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Patient Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Patient Name</label>
                    <p className="text-lg font-semibold">{selectedNote.patientName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date of Service</label>
                    <p className="text-lg">{new Date(selectedNote.dateOfService).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Doctor</label>
                    <p className="text-lg">Dr. {selectedNote.doctorId.name}</p>
                  </div>
                </div>

                {/* SOAP Note */}
                <div className="space-y-4">
                  <h4 className="text-xl font-semibold text-gray-900">SOAP Note</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="text-lg font-medium text-blue-600 mb-2">Subjective</h5>
                      <p className="text-gray-700 bg-blue-50 p-3 rounded-md">{selectedNote.subjective}</p>
                    </div>
                    <div>
                      <h5 className="text-lg font-medium text-green-600 mb-2">Objective</h5>
                      <p className="text-gray-700 bg-green-50 p-3 rounded-md">{selectedNote.objective}</p>
                    </div>
                    <div>
                      <h5 className="text-lg font-medium text-yellow-600 mb-2">Assessment</h5>
                      <p className="text-gray-700 bg-yellow-50 p-3 rounded-md">{selectedNote.assessment}</p>
                    </div>
                    <div>
                      <h5 className="text-lg font-medium text-purple-600 mb-2">Plan</h5>
                      <p className="text-gray-700 bg-purple-50 p-3 rounded-md">{selectedNote.plan}</p>
                    </div>
                  </div>
                </div>

                {/* Medications and Diagnoses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="text-lg font-medium text-gray-900 mb-3">Medications</h5>
                    {selectedNote.medications.length > 0 ? (
                      <ul className="space-y-2">
                        {selectedNote.medications.map((med, index) => (
                          <li key={index} className="flex items-center p-2 bg-red-50 rounded-md">
                            <span className="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
                            {med}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 italic">No medications listed</p>
                    )}
                  </div>

                  <div>
                    <h5 className="text-lg font-medium text-gray-900 mb-3">Diagnoses</h5>
                    {selectedNote.diagnoses.length > 0 ? (
                      <ul className="space-y-2">
                        {selectedNote.diagnoses.map((diagnosis, index) => (
                          <li key={index} className="p-2 bg-orange-50 rounded-md">
                            <div className="font-medium">{diagnosis.description}</div>
                            <div className="text-sm text-gray-600">Code: {diagnosis.code}</div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 italic">No diagnoses listed</p>
                    )}
                  </div>
                </div>

                {/* Patient Summary */}
                <div>
                  <h5 className="text-lg font-medium text-gray-900 mb-3">Patient Summary</h5>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-line">{selectedNote.patientSummary}</p>
                  </div>
                </div>

                {/* Recommendations and Follow-up */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="text-lg font-medium text-gray-900 mb-3">Recommendations</h5>
                    {selectedNote.recommendations.length > 0 ? (
                      <ul className="space-y-2">
                        {selectedNote.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start p-2 bg-blue-50 rounded-md">
                            <span className="w-2 h-2 bg-blue-400 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 italic">No recommendations listed</p>
                    )}
                  </div>

                  <div>
                    <h5 className="text-lg font-medium text-gray-900 mb-3">Follow-up</h5>
                    <div className="bg-green-50 p-3 rounded-md">
                      <p className="text-gray-700">{selectedNote.followUp || 'No follow-up instructions'}</p>
                    </div>
                  </div>
                </div>

                {/* Processing Metrics */}
                {selectedNote.processingMetrics && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="text-lg font-medium text-gray-900 mb-3">Processing Information</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Confidence Score</label>
                        <p className="text-lg font-semibold">
                          {(selectedNote.processingMetrics.confidenceScore * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Entities Extracted</label>
                        <p className="text-lg font-semibold">
                          {selectedNote.processingMetrics.extractedEntities.length}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedNote(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Close
                </button>
                {user?.role === 'doctor' && (
                  <>
                    <button
                      onClick={() => handleEdit(selectedNote)}
                      className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Edit Note
                    </button>
                    <button
                      onClick={() => handleExport(selectedNote._id)}
                      className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                    >
                      Export PDF
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesView;