import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User,
    Calendar,
    Phone,
    Mail,
    MapPin,
    Plus,
    X,
    Save,
    ArrowLeft
} from 'lucide-react';
import { patientsAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface PatientFormData {
    name: string;
    email: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    phone: string;
    address: string;
    emergencyContact: {
        name: string;
        relationship: string;
        phone: string;
    };
    allergies: string[];
    currentMedications: string[];
    chronicConditions: string[];
    familyHistory: string[];
    insurance: {
        provider: string;
        policyNumber: string;
        groupNumber: string;
        expiryDate: string;
    };
    preferences: {
        preferredLanguage: string;
        communicationMethod: 'email' | 'sms' | 'phone';
        appointmentReminders: boolean;
    };
    notes: string;
}

const AddPatient: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<PatientFormData>({
        name: '',
        email: '',
        dateOfBirth: '',
        gender: 'male',
        phone: '',
        address: '',
        emergencyContact: {
            name: '',
            relationship: '',
            phone: '',
        },
        allergies: [],
        currentMedications: [],
        chronicConditions: [],
        familyHistory: [],
        insurance: {
            provider: '',
            policyNumber: '',
            groupNumber: '',
            expiryDate: '',
        },
        preferences: {
            preferredLanguage: 'en',
            communicationMethod: 'email',
            appointmentReminders: true,
        },
        notes: '',
    });

    const [newAllergy, setNewAllergy] = useState('');
    const [newMedication, setNewMedication] = useState('');
    const [newCondition, setNewCondition] = useState('');
    const [newFamilyHistory, setNewFamilyHistory] = useState('');

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleNestedInputChange = (parent: string, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [parent]: {
                ...prev[parent as keyof PatientFormData],
                [field]: value
            }
        }));
    };

    const addItem = (field: keyof PatientFormData, value: string, setter: (value: string) => void) => {
        if (value.trim()) {
            setFormData(prev => ({
                ...prev,
                [field]: [...(prev[field] as string[]), value.trim()]
            }));
            setter('');
        }
    };

    const removeItem = (field: keyof PatientFormData, index: number) => {
        setFormData(prev => ({
            ...prev,
            [field]: (prev[field] as string[]).filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.email || !formData.dateOfBirth || !formData.phone) {
            toast.error('Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            const response = await patientsAPI.createPatient(formData);

            if (response.data.success) {
                toast.success('Patient created successfully');
                navigate('/patients');
            }
        } catch (error: any) {
            console.error('Error creating patient:', error);
            toast.error(error.response?.data?.message || 'Failed to create patient');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate('/patients')}
                        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Patients</span>
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Add New Patient</h1>
                        <p className="text-gray-600 mt-1">
                            Create a new patient record with complete information
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="medical-card">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                        <User className="w-5 h-5 mr-2 text-medical-blue" />
                        Basic Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                className="input-field"
                                placeholder="Enter patient's full name"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address *
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                className="input-field"
                                placeholder="patient@example.com"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date of Birth *
                            </label>
                            <input
                                type="date"
                                value={formData.dateOfBirth}
                                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                                className="input-field"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Gender *
                            </label>
                            <select
                                value={formData.gender}
                                onChange={(e) => handleInputChange('gender', e.target.value)}
                                className="input-field"
                                required
                            >
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                                <option value="prefer_not_to_say">Prefer not to say</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone Number *
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                className="input-field"
                                placeholder="+1 (555) 123-4567"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Address *
                            </label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => handleInputChange('address', e.target.value)}
                                className="input-field"
                                placeholder="Enter full address"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Emergency Contact */}
                <div className="medical-card">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                        <Phone className="w-5 h-5 mr-2 text-medical-blue" />
                        Emergency Contact
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Contact Name *
                            </label>
                            <input
                                type="text"
                                value={formData.emergencyContact.name}
                                onChange={(e) => handleNestedInputChange('emergencyContact', 'name', e.target.value)}
                                className="input-field"
                                placeholder="Emergency contact name"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Relationship *
                            </label>
                            <input
                                type="text"
                                value={formData.emergencyContact.relationship}
                                onChange={(e) => handleNestedInputChange('emergencyContact', 'relationship', e.target.value)}
                                className="input-field"
                                placeholder="e.g., Spouse, Parent, Sibling"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Contact Phone *
                            </label>
                            <input
                                type="tel"
                                value={formData.emergencyContact.phone}
                                onChange={(e) => handleNestedInputChange('emergencyContact', 'phone', e.target.value)}
                                className="input-field"
                                placeholder="+1 (555) 123-4567"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Medical History */}
                <div className="medical-card">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Medical History</h2>

                    {/* Allergies */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
                        <div className="flex space-x-2 mb-2">
                            <input
                                type="text"
                                value={newAllergy}
                                onChange={(e) => setNewAllergy(e.target.value)}
                                className="input-field flex-1"
                                placeholder="Add allergy (e.g., Penicillin, Peanuts)"
                                onKeyPress={(e) => e.key === 'Enter' && addItem('allergies', newAllergy, setNewAllergy)}
                            />
                            <button
                                type="button"
                                onClick={() => addItem('allergies', newAllergy, setNewAllergy)}
                                className="btn-secondary"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.allergies.map((allergy, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800"
                                >
                                    {allergy}
                                    <button
                                        type="button"
                                        onClick={() => removeItem('allergies', index)}
                                        className="ml-2 text-red-600 hover:text-red-800"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Current Medications */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Medications</label>
                        <div className="flex space-x-2 mb-2">
                            <input
                                type="text"
                                value={newMedication}
                                onChange={(e) => setNewMedication(e.target.value)}
                                className="input-field flex-1"
                                placeholder="Add medication (e.g., Aspirin 81mg daily)"
                                onKeyPress={(e) => e.key === 'Enter' && addItem('currentMedications', newMedication, setNewMedication)}
                            />
                            <button
                                type="button"
                                onClick={() => addItem('currentMedications', newMedication, setNewMedication)}
                                className="btn-secondary"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.currentMedications.map((medication, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                                >
                                    {medication}
                                    <button
                                        type="button"
                                        onClick={() => removeItem('currentMedications', index)}
                                        className="ml-2 text-blue-600 hover:text-blue-800"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Chronic Conditions */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Chronic Conditions</label>
                        <div className="flex space-x-2 mb-2">
                            <input
                                type="text"
                                value={newCondition}
                                onChange={(e) => setNewCondition(e.target.value)}
                                className="input-field flex-1"
                                placeholder="Add condition (e.g., Diabetes Type 2, Hypertension)"
                                onKeyPress={(e) => e.key === 'Enter' && addItem('chronicConditions', newCondition, setNewCondition)}
                            />
                            <button
                                type="button"
                                onClick={() => addItem('chronicConditions', newCondition, setNewCondition)}
                                className="btn-secondary"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.chronicConditions.map((condition, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800"
                                >
                                    {condition}
                                    <button
                                        type="button"
                                        onClick={() => removeItem('chronicConditions', index)}
                                        className="ml-2 text-yellow-600 hover:text-yellow-800"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Family History */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Family History</label>
                        <div className="flex space-x-2 mb-2">
                            <input
                                type="text"
                                value={newFamilyHistory}
                                onChange={(e) => setNewFamilyHistory(e.target.value)}
                                className="input-field flex-1"
                                placeholder="Add family history (e.g., Father - Heart Disease)"
                                onKeyPress={(e) => e.key === 'Enter' && addItem('familyHistory', newFamilyHistory, setNewFamilyHistory)}
                            />
                            <button
                                type="button"
                                onClick={() => addItem('familyHistory', newFamilyHistory, setNewFamilyHistory)}
                                className="btn-secondary"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.familyHistory.map((history, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                                >
                                    {history}
                                    <button
                                        type="button"
                                        onClick={() => removeItem('familyHistory', index)}
                                        className="ml-2 text-purple-600 hover:text-purple-800"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Insurance Information */}
                <div className="medical-card">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Insurance Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Insurance Provider
                            </label>
                            <input
                                type="text"
                                value={formData.insurance.provider}
                                onChange={(e) => handleNestedInputChange('insurance', 'provider', e.target.value)}
                                className="input-field"
                                placeholder="Insurance company name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Policy Number
                            </label>
                            <input
                                type="text"
                                value={formData.insurance.policyNumber}
                                onChange={(e) => handleNestedInputChange('insurance', 'policyNumber', e.target.value)}
                                className="input-field"
                                placeholder="Policy number"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Group Number
                            </label>
                            <input
                                type="text"
                                value={formData.insurance.groupNumber}
                                onChange={(e) => handleNestedInputChange('insurance', 'groupNumber', e.target.value)}
                                className="input-field"
                                placeholder="Group number (if applicable)"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Expiry Date
                            </label>
                            <input
                                type="date"
                                value={formData.insurance.expiryDate}
                                onChange={(e) => handleNestedInputChange('insurance', 'expiryDate', e.target.value)}
                                className="input-field"
                            />
                        </div>
                    </div>
                </div>

                {/* Preferences */}
                <div className="medical-card">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Preferences</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Preferred Language
                            </label>
                            <select
                                value={formData.preferences.preferredLanguage}
                                onChange={(e) => handleNestedInputChange('preferences', 'preferredLanguage', e.target.value)}
                                className="input-field"
                            >
                                <option value="en">English</option>
                                <option value="es">Spanish</option>
                                <option value="ur">Urdu</option>
                                <option value="fr">French</option>
                                <option value="de">German</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Communication Method
                            </label>
                            <select
                                value={formData.preferences.communicationMethod}
                                onChange={(e) => handleNestedInputChange('preferences', 'communicationMethod', e.target.value)}
                                className="input-field"
                            >
                                <option value="email">Email</option>
                                <option value="sms">SMS</option>
                                <option value="phone">Phone</option>
                            </select>
                        </div>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="appointmentReminders"
                                checked={formData.preferences.appointmentReminders}
                                onChange={(e) => handleNestedInputChange('preferences', 'appointmentReminders', e.target.checked)}
                                className="h-4 w-4 text-medical-blue focus:ring-medical-blue border-gray-300 rounded"
                            />
                            <label htmlFor="appointmentReminders" className="ml-2 block text-sm text-gray-900">
                                Send appointment reminders
                            </label>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                <div className="medical-card">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Notes</h2>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        className="input-field w-full h-32"
                        placeholder="Any additional notes about the patient..."
                    />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={() => navigate('/patients')}
                        className="btn-secondary"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary flex items-center space-x-2"
                    >
                        <Save className="w-4 h-4" />
                        <span>{loading ? 'Creating...' : 'Create Patient'}</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddPatient;
