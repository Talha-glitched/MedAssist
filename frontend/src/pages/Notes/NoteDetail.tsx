import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Edit,
    Save,
    X,
    Download,
    CheckCircle,
    XCircle,
    User,
    Calendar,
    FileText,
    AlertCircle,
    Clock
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

const NoteDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [note, setNote] = useState<MedicalNote | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editData, setEditData] = useState<Partial<MedicalNote>>({});

    const isDoctor = user?.role === 'doctor';
    const canEdit = isDoctor && note?.status !== 'approved';

    useEffect(() => {
        loadNote();
    }, [id]);

    const loadNote = async () => {
        try {
            setLoading(true);
            const response = await notesAPI.getNote(id!);
            setNote(response.data.data);
            setEditData(response.data.data);
        } catch (error: any) {
            toast.error('Failed to load note: ' + error.message);
            navigate('/notes');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const response = await notesAPI.updateNote(id!, editData);
            setNote(response.data.data);
            setEditing(false);
            toast.success('Note updated successfully');
        } catch (error: any) {
            toast.error('Failed to update note: ' + error.message);
        }
    };

    const handleApprove = async () => {
        try {
            await notesAPI.approveNote(id!);
            toast.success('Note approved successfully');
            loadNote();
        } catch (error: any) {
            toast.error('Failed to approve note: ' + error.message);
        }
    };

    const handleReject = async () => {
        const reason = prompt('Please provide a reason for rejection:');
        if (!reason) return;

        try {
            await notesAPI.rejectNote(id!, reason);
            toast.success('Note rejected');
            loadNote();
        } catch (error: any) {
            toast.error('Failed to reject note: ' + error.message);
        }
    };

    const handleExport = async () => {
        try {
            const response = await notesAPI.exportPDF(id!);
            const blob = new Blob([response], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `medical-note-${id}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success('PDF exported successfully');
        } catch (error: any) {
            toast.error('Failed to export PDF: ' + error.message);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approved
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        <XCircle className="w-4 h-4 mr-1" />
                        Rejected
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        <Clock className="w-4 h-4 mr-1" />
                        Pending
                    </span>
                );
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading note...</p>
                </div>
            </div>
        );
    }

    if (!note) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Note Not Found</h2>
                    <p className="text-gray-600 mb-4">The requested medical note could not be found.</p>
                    <button
                        onClick={() => navigate('/notes')}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Notes
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate('/notes')}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Notes
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    Medical Note - {note.patientName}
                                </h1>
                                <p className="mt-1 text-gray-600">
                                    Created on {new Date(note.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            {getStatusBadge(note.status)}
                            {isDoctor && (
                                <>
                                    {canEdit && (
                                        <button
                                            onClick={() => setEditing(!editing)}
                                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            {editing ? <X className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                                            {editing ? 'Cancel' : 'Edit'}
                                        </button>
                                    )}
                                    {editing && (
                                        <button
                                            onClick={handleSave}
                                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                                        >
                                            <Save className="w-4 h-4 mr-2" />
                                            Save Changes
                                        </button>
                                    )}
                                    <button
                                        onClick={handleExport}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Export PDF
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Patient Information */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Patient Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-center">
                            <User className="w-5 h-5 text-gray-400 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-gray-500">Patient Name</p>
                                <p className="text-lg font-semibold">{note.patientName}</p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-gray-500">Date of Service</p>
                                <p className="text-lg">{new Date(note.dateOfService).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <FileText className="w-5 h-5 text-gray-400 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-gray-500">Doctor</p>
                                <p className="text-lg">Dr. {note.doctorId.name}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SOAP Note */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">SOAP Note</h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Subjective */}
                        <div>
                            <h3 className="text-lg font-medium text-blue-600 mb-3 flex items-center">
                                <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                                Subjective
                            </h3>
                            {editing ? (
                                <textarea
                                    value={editData.subjective || ''}
                                    onChange={(e) => setEditData({ ...editData, subjective: e.target.value })}
                                    className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Patient's reported symptoms and history..."
                                />
                            ) : (
                                <div className="bg-blue-50 p-4 rounded-md">
                                    <p className="text-gray-700 whitespace-pre-line">{note.subjective}</p>
                                </div>
                            )}
                        </div>

                        {/* Objective */}
                        <div>
                            <h3 className="text-lg font-medium text-green-600 mb-3 flex items-center">
                                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                                Objective
                            </h3>
                            {editing ? (
                                <textarea
                                    value={editData.objective || ''}
                                    onChange={(e) => setEditData({ ...editData, objective: e.target.value })}
                                    className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    placeholder="Observable findings and test results..."
                                />
                            ) : (
                                <div className="bg-green-50 p-4 rounded-md">
                                    <p className="text-gray-700 whitespace-pre-line">{note.objective}</p>
                                </div>
                            )}
                        </div>

                        {/* Assessment */}
                        <div>
                            <h3 className="text-lg font-medium text-yellow-600 mb-3 flex items-center">
                                <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                                Assessment
                            </h3>
                            {editing ? (
                                <textarea
                                    value={editData.assessment || ''}
                                    onChange={(e) => setEditData({ ...editData, assessment: e.target.value })}
                                    className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                    placeholder="Medical diagnosis and clinical impression..."
                                />
                            ) : (
                                <div className="bg-yellow-50 p-4 rounded-md">
                                    <p className="text-gray-700 whitespace-pre-line">{note.assessment}</p>
                                </div>
                            )}
                        </div>

                        {/* Plan */}
                        <div>
                            <h3 className="text-lg font-medium text-purple-600 mb-3 flex items-center">
                                <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
                                Plan
                            </h3>
                            {editing ? (
                                <textarea
                                    value={editData.plan || ''}
                                    onChange={(e) => setEditData({ ...editData, plan: e.target.value })}
                                    className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    placeholder="Treatment recommendations and follow-up..."
                                />
                            ) : (
                                <div className="bg-purple-50 p-4 rounded-md">
                                    <p className="text-gray-700 whitespace-pre-line">{note.plan}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Medications and Diagnoses */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Medications */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Medications</h3>
                        {editing ? (
                            <div>
                                <textarea
                                    value={editData.medications?.join('\n') || ''}
                                    onChange={(e) => setEditData({
                                        ...editData,
                                        medications: e.target.value.split('\n').filter(item => item.trim())
                                    })}
                                    className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    placeholder="Enter medications, one per line..."
                                />
                            </div>
                        ) : (
                            <div>
                                {note.medications.length > 0 ? (
                                    <ul className="space-y-2">
                                        {note.medications.map((med, index) => (
                                            <li key={index} className="flex items-center p-3 bg-red-50 rounded-md">
                                                <span className="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
                                                <span className="text-gray-700">{med}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-500 italic">No medications listed</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Diagnoses */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Diagnoses</h3>
                        {note.diagnoses.length > 0 ? (
                            <ul className="space-y-3">
                                {note.diagnoses.map((diagnosis, index) => (
                                    <li key={index} className="p-3 bg-orange-50 rounded-md">
                                        <div className="font-medium text-gray-900">{diagnosis.description}</div>
                                        <div className="text-sm text-gray-600">Code: {diagnosis.code}</div>
                                        <div className="text-xs text-gray-500 capitalize">{diagnosis.type}</div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 italic">No diagnoses listed</p>
                        )}
                    </div>
                </div>

                {/* Patient Summary */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Summary</h3>
                    {editing ? (
                        <textarea
                            value={editData.patientSummary || ''}
                            onChange={(e) => setEditData({ ...editData, patientSummary: e.target.value })}
                            className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Patient-friendly summary..."
                        />
                    ) : (
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-gray-700 whitespace-pre-line">{note.patientSummary}</p>
                        </div>
                    )}
                </div>

                {/* Recommendations and Follow-up */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Recommendations */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
                        {editing ? (
                            <textarea
                                value={editData.recommendations?.join('\n') || ''}
                                onChange={(e) => setEditData({
                                    ...editData,
                                    recommendations: e.target.value.split('\n').filter(item => item.trim())
                                })}
                                className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter recommendations, one per line..."
                            />
                        ) : (
                            <div>
                                {note.recommendations.length > 0 ? (
                                    <ul className="space-y-2">
                                        {note.recommendations.map((rec, index) => (
                                            <li key={index} className="flex items-start p-3 bg-blue-50 rounded-md">
                                                <span className="w-2 h-2 bg-blue-400 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                                                <span className="text-gray-700">{rec}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-500 italic">No recommendations listed</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Follow-up */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Follow-up</h3>
                        {editing ? (
                            <textarea
                                value={editData.followUp || ''}
                                onChange={(e) => setEditData({ ...editData, followUp: e.target.value })}
                                className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                placeholder="Follow-up instructions..."
                            />
                        ) : (
                            <div className="bg-green-50 p-4 rounded-md">
                                <p className="text-gray-700">{note.followUp || 'No follow-up instructions'}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Processing Metrics */}
                {note.processingMetrics && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Confidence Score</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {(note.processingMetrics.confidenceScore * 100).toFixed(1)}%
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Entities Extracted</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {note.processingMetrics.extractedEntities.length}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Processing Status</p>
                                <p className="text-lg font-semibold text-gray-900">Completed</p>
                            </div>
                        </div>

                        {note.processingMetrics.extractedEntities.length > 0 && (
                            <div className="mt-4">
                                <p className="text-sm font-medium text-gray-700 mb-2">Extracted Medical Entities</p>
                                <div className="flex flex-wrap gap-2">
                                    {note.processingMetrics.extractedEntities.map((entity, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                                        >
                                            {entity.entity}
                                            <span className="ml-1 text-xs text-blue-600">({entity.type})</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                {isDoctor && note.status === 'pending' && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Note Actions</h3>
                        <div className="flex space-x-4">
                            <button
                                onClick={handleApprove}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve Note
                            </button>
                            <button
                                onClick={handleReject}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject Note
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NoteDetail;
