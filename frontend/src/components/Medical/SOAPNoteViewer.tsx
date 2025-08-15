import React, { useState } from 'react';
import { Copy, Download, Edit, Check, X, FileText, User } from 'lucide-react';
import toast from 'react-hot-toast';

interface SOAPNote {
  id: string;
  patientName: string;
  dateOfService: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  status: 'draft' | 'pending' | 'approved';
  doctorNotes?: string;
  medications?: string[];
  diagnoses?: string[];
  recommendations?: string[];
  followUp?: string;
  createdAt: string;
  updatedAt: string;
}

interface SOAPNoteViewerProps {
  note: SOAPNote;
  onApprove?: (noteId: string) => void;
  onEdit?: (noteId: string, updatedNote: Partial<SOAPNote>) => void;
  onReject?: (noteId: string, reason: string) => void;
  canEdit?: boolean;
}

const SOAPNoteViewer: React.FC<SOAPNoteViewerProps> = ({
  note,
  onApprove,
  onEdit,
  onReject,
  canEdit = true,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedNote, setEditedNote] = useState<Partial<SOAPNote>>(note);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleCopyNote = async () => {
    const formattedNote = `
SOAP NOTE - ${note.patientName}
Date of Service: ${new Date(note.dateOfService).toLocaleDateString()}

SUBJECTIVE:
${note.subjective}

OBJECTIVE:
${note.objective}

ASSESSMENT:
${note.assessment}

PLAN:
${note.plan}

${note.medications?.length ? `MEDICATIONS:\n${note.medications.join('\n')}` : ''}
${note.diagnoses?.length ? `\nDIAGNOSES:\n${note.diagnoses.join('\n')}` : ''}
${note.recommendations?.length ? `\nRECOMMENDATIONS:\n${note.recommendations.join('\n')}` : ''}
${note.followUp ? `\nFOLLOW-UP:\n${note.followUp}` : ''}
    `.trim();

    try {
      await navigator.clipboard.writeText(formattedNote);
      toast.success('SOAP note copied to clipboard');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy note');
    }
  };

  const handleDownloadNote = () => {
    const formattedNote = `
SOAP NOTE - ${note.patientName}
Date of Service: ${new Date(note.dateOfService).toLocaleDateString()}
Generated: ${new Date(note.createdAt).toLocaleString()}

SUBJECTIVE:
${note.subjective}

OBJECTIVE:
${note.objective}

ASSESSMENT:
${note.assessment}

PLAN:
${note.plan}

${note.medications?.length ? `MEDICATIONS:\n${note.medications.map(med => `• ${med}`).join('\n')}` : ''}
${note.diagnoses?.length ? `\nDIAGNOSES:\n${note.diagnoses.map(diag => `• ${diag}`).join('\n')}` : ''}
${note.recommendations?.length ? `\nRECOMMENDATIONS:\n${note.recommendations.map(rec => `• ${rec}`).join('\n')}` : ''}
${note.followUp ? `\nFOLLOW-UP:\n${note.followUp}` : ''}
    `.trim();

    const blob = new Blob([formattedNote], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `soap-note-${note.patientName.replace(/\s+/g, '-').toLowerCase()}-${new Date(note.dateOfService).toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveEdit = () => {
    onEdit?.(note.id, editedNote);
    setIsEditing(false);
    toast.success('SOAP note updated successfully');
  };

  const handleApprove = () => {
    onApprove?.(note.id);
    toast.success('SOAP note approved');
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    onReject?.(note.id, rejectReason);
    setShowRejectModal(false);
    setRejectReason('');
    toast.success('SOAP note rejected');
  };

  const soapSections = [
    { key: 'subjective', title: 'Subjective', description: 'Patient\'s reported symptoms and history' },
    { key: 'objective', title: 'Objective', description: 'Observable findings and measurements' },
    { key: 'assessment', title: 'Assessment', description: 'Clinical impression and diagnosis' },
    { key: 'plan', title: 'Plan', description: 'Treatment plan and recommendations' },
  ];

  return (
    <div className="medical-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-medical-blue rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">SOAP Medical Note</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
              <span className="flex items-center">
                <User className="w-3 h-3 mr-1" />
                {note.patientName}
              </span>
              <span>Date: {new Date(note.dateOfService).toLocaleDateString()}</span>
              <span
                className={`medical-badge ${
                  note.status === 'approved'
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
        </div>

        <div className="flex items-center space-x-2">
          {canEdit && note.status !== 'approved' && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 text-gray-600 hover:text-medical-blue rounded-lg hover:bg-gray-100 transition-colors"
              title={isEditing ? 'Cancel editing' : 'Edit note'}
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleCopyNote}
            className="p-2 text-gray-600 hover:text-medical-blue rounded-lg hover:bg-gray-100 transition-colors"
            title="Copy note"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownloadNote}
            className="p-2 text-gray-600 hover:text-medical-blue rounded-lg hover:bg-gray-100 transition-colors"
            title="Download note"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SOAP Sections */}
      <div className="space-y-6">
        {soapSections.map((section) => (
          <div key={section.key} className="border-l-4 border-l-medical-blue pl-4">
            <h4 className="font-semibold text-gray-900 text-lg mb-1">{section.title}</h4>
            <p className="text-sm text-gray-600 mb-3">{section.description}</p>
            
            {isEditing ? (
              <textarea
                value={editedNote[section.key as keyof SOAPNote] as string || ''}
                onChange={(e) => setEditedNote({ ...editedNote, [section.key]: e.target.value })}
                className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-medical-blue focus:border-transparent"
                placeholder={`Enter ${section.title.toLowerCase()} information...`}
              />
            ) : (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                  {note[section.key as keyof SOAPNote] as string || 'No information provided'}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Additional Information */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Medications */}
        {note.medications && note.medications.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h5 className="font-medium text-blue-900 mb-2">Medications</h5>
            <ul className="space-y-1">
              {note.medications.map((med, index) => (
                <li key={index} className="text-sm text-blue-800 flex items-start">
                  <span className="w-1 h-1 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  {med}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Diagnoses */}
        {note.diagnoses && note.diagnoses.length > 0 && (
          <div className="bg-orange-50 rounded-lg p-4">
            <h5 className="font-medium text-orange-900 mb-2">Diagnoses</h5>
            <ul className="space-y-1">
              {note.diagnoses.map((diag, index) => (
                <li key={index} className="text-sm text-orange-800 flex items-start">
                  <span className="w-1 h-1 bg-orange-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  {diag}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Recommendations and Follow-up */}
      {(note.recommendations || note.followUp) && (
        <div className="mt-6 space-y-4">
          {note.recommendations && note.recommendations.length > 0 && (
            <div className="bg-green-50 rounded-lg p-4">
              <h5 className="font-medium text-green-900 mb-2">Recommendations</h5>
              <ul className="space-y-1">
                {note.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-green-800 flex items-start">
                    <span className="w-1 h-1 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {note.followUp && (
            <div className="bg-purple-50 rounded-lg p-4">
              <h5 className="font-medium text-purple-900 mb-2">Follow-up Instructions</h5>
              <p className="text-sm text-purple-800">{note.followUp}</p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {isEditing ? (
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={() => {
              setIsEditing(false);
              setEditedNote(note);
            }}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveEdit}
            className="btn-primary px-4 py-2"
          >
            Save Changes
          </button>
        </div>
      ) : (
        canEdit && note.status === 'pending' && (
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={() => setShowRejectModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Reject</span>
            </button>
            <button
              onClick={handleApprove}
              className="flex items-center space-x-2 btn-secondary px-4 py-2"
            >
              <Check className="w-4 h-4" />
              <span>Approve Note</span>
            </button>
          </div>
        )
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject SOAP Note</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting this note:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Enter rejection reason..."
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Reject Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SOAPNoteViewer;