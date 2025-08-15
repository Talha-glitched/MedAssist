import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Search,
    Plus,
    Users,
    Calendar,
    Phone,
    Mail,
    Filter,
    MoreVertical,
    Eye,
    Edit,
    Trash2,
    User,
    Clock,
    FileText
} from 'lucide-react';
import { patientsAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface Patient {
    _id: string;
    patientId: string;
    userId: {
        name: string;
        email: string;
    };
    demographics: {
        dateOfBirth: string;
        gender: string;
        phone: string;
    };
    status: string;
    consultationCount: number;
    lastConsultation?: {
        date: string;
        status: string;
    };
    age: number;
}

const PatientsView: React.FC = () => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('active');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

    useEffect(() => {
        loadPatients();
    }, [currentPage, searchTerm, statusFilter]);

    const loadPatients = async () => {
        try {
            setLoading(true);
            const response = await patientsAPI.getPatients({
                page: currentPage,
                limit: 10,
                search: searchTerm,
                status: statusFilter,
            });

            if (response.data.success) {
                setPatients(response.data.data.patients);
                setTotalPages(response.data.data.pagination.pages);
            }
        } catch (error) {
            console.error('Error loading patients:', error);
            toast.error('Failed to load patients');
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePatient = async (patient: Patient) => {
        try {
            await patientsAPI.deletePatient(patient._id);
            toast.success('Patient archived successfully');
            loadPatients();
            setShowDeleteModal(false);
            setSelectedPatient(null);
        } catch (error) {
            console.error('Error deleting patient:', error);
            toast.error('Failed to archive patient');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'inactive':
                return 'bg-yellow-100 text-yellow-800';
            case 'archived':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-medical-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading patients...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
                    <p className="text-gray-600 mt-1">
                        Manage your patient records and view consultation history
                    </p>
                </div>
                <Link
                    to="/patients/new"
                    className="btn-primary flex items-center space-x-2"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add Patient</span>
                </Link>
            </div>

            {/* Filters */}
            <div className="medical-card">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search by patient ID or phone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input-field pl-10 w-full"
                            />
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <Filter className="w-4 h-4 text-gray-500" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="input-field"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="archived">Archived</option>
                                <option value="all">All</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Patients List */}
            <div className="medical-card">
                {patients.length === 0 ? (
                    <div className="text-center py-12">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
                        <p className="text-gray-500 mb-4">
                            {searchTerm || statusFilter !== 'active'
                                ? 'Try adjusting your search or filters'
                                : 'Get started by adding your first patient'
                            }
                        </p>
                        {!searchTerm && statusFilter === 'active' && (
                            <Link to="/patients/new" className="btn-primary">
                                Add First Patient
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Patient
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Contact
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Consultations
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Last Visit
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {patients.map((patient) => (
                                    <tr key={patient._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 bg-medical-blue rounded-full flex items-center justify-center">
                                                    <User className="w-5 h-5 text-white" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {patient.userId.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        ID: {patient.patientId}
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        {patient.age} years • {patient.demographics.gender}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                <div className="flex items-center space-x-1">
                                                    <Phone className="w-3 h-3 text-gray-400" />
                                                    <span>{patient.demographics.phone}</span>
                                                </div>
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                <div className="flex items-center space-x-1">
                                                    <Mail className="w-3 h-3 text-gray-400" />
                                                    <span>{patient.userId.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(patient.status)}`}>
                                                {patient.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div className="flex items-center space-x-1">
                                                <FileText className="w-4 h-4 text-gray-400" />
                                                <span>{patient.consultationCount} consultations</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {patient.lastConsultation ? (
                                                <div className="flex items-center space-x-1">
                                                    <Clock className="w-4 h-4 text-gray-400" />
                                                    <span>{formatDate(patient.lastConsultation.date)}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">No visits</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                <Link
                                                    to={`/patients/${patient._id}`}
                                                    className="text-medical-blue hover:text-medical-blue-dark"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                                <Link
                                                    to={`/patients/${patient._id}/edit`}
                                                    className="text-medical-teal hover:text-medical-teal-dark"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => {
                                                        setSelectedPatient(patient);
                                                        setShowDeleteModal(true);
                                                    }}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
                        <div className="text-sm text-gray-700">
                            Page {currentPage} of {totalPages}
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedPatient && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Archive Patient
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to archive {selectedPatient.userId.name}?
                            This action can be undone later.
                        </p>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setSelectedPatient(null);
                                }}
                                className="btn-secondary flex-1"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeletePatient(selectedPatient)}
                                className="btn-danger flex-1"
                            >
                                Archive
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientsView;
