import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Upload, Trash2, User, Search, Plus } from 'lucide-react';
import { notesAPI, patientsAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface Patient {
  _id: string;
  patientId: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  gender: string;
}

interface AudioRecorderProps {
  onTranscriptGenerated?: (transcript: any) => void;
  onNotesGenerated?: (notes: any) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onTranscriptGenerated,
  onNotesGenerated,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);

  // Patient assignment states
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showPatientSelector, setShowPatientSelector] = useState(false);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load patients for assignment
  useEffect(() => {
    if (showPatientSelector) {
      loadPatients();
    }
  }, [showPatientSelector, patientSearchTerm]);

  const loadPatients = async () => {
    try {
      setIsLoadingPatients(true);
      const response = await patientsAPI.getActivePatients({
        search: patientSearchTerm,
      });

      if (response.data.success) {
        setPatients(response.data.data);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
      toast.error('Failed to load patients');
    } finally {
      setIsLoadingPatients(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        setRecordedAudio(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      toast.success('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }

      toast.success('Recording stopped');
    }
  };

  const playAudio = () => {
    if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const clearRecording = () => {
    setRecordedAudio(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setRecordingTime(0);
    setUploadProgress(0);
  };

  const processAudio = async () => {
    if (!recordedAudio) {
      toast.error('No audio recording found');
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('audio', recordedAudio, 'consultation.wav');
      formData.append('patientName', selectedPatient?.name || 'Anonymous Patient');
      if (selectedPatient?._id) {
        formData.append('patientId', selectedPatient._id);
      }

      const response = await notesAPI.uploadAudio(formData, (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(progress);
      });

      if (response.data.success) {
        if (response.data.data.noteGenerated) {
          toast.success('Audio processed and medical notes generated successfully!');
          onTranscriptGenerated?.(response.data.data.transcript);
          onNotesGenerated?.(response.data.data);
        } else {
          toast.success('Audio processed successfully!');
          onTranscriptGenerated?.(response.data.data.transcript);
        }
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      toast.error('Failed to process audio recording');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Patient Assignment */}
      <div className="medical-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <User className="w-5 h-5 mr-2 text-medical-blue" />
            Patient Assignment
          </h3>
          {!selectedPatient && (
            <button
              onClick={() => setShowPatientSelector(true)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Assign Patient</span>
            </button>
          )}
        </div>

        {selectedPatient ? (
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-medical-blue rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{selectedPatient.name}</p>
                  <p className="text-sm text-gray-600">
                    ID: {selectedPatient.patientId} • {selectedPatient.age} years • {selectedPatient.gender}
                  </p>
                  <p className="text-sm text-gray-500">{selectedPatient.phone}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <User className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No patient assigned to this consultation</p>
            <p className="text-sm">Click "Assign Patient" to link this consultation to a patient</p>
          </div>
        )}
      </div>

      {/* Patient Selector Modal */}
      {showPatientSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Select Patient</h3>
              <button
                onClick={() => {
                  setShowPatientSelector(false);
                  setPatientSearchTerm('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={patientSearchTerm}
                  onChange={(e) => setPatientSearchTerm(e.target.value)}
                  className="input-field pl-10 w-full"
                />
              </div>
            </div>

            <div className="overflow-y-auto max-h-64">
              {isLoadingPatients ? (
                <div className="text-center py-4">
                  <div className="w-6 h-6 border-2 border-medical-blue border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Loading patients...</p>
                </div>
              ) : patients.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">No patients found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {patients.map((patient) => (
                    <button
                      key={patient._id}
                      onClick={() => {
                        setSelectedPatient(patient);
                        setShowPatientSelector(false);
                        setPatientSearchTerm('');
                      }}
                      className="w-full text-left p-3 hover:bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-medical-blue rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{patient.name}</p>
                          <p className="text-sm text-gray-600">
                            {patient.patientId} • {patient.age} years • {patient.gender}
                          </p>
                          <p className="text-sm text-gray-500">{patient.phone}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recording Controls */}
      <div className="flex items-center justify-center space-x-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={isProcessing}
            className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <Mic className="w-5 h-5" />
            <span>Start Recording</span>
          </button>
        ) : (
          <>
            <div className="flex items-center space-x-3 bg-red-50 px-4 py-2 rounded-lg">
              <div className="recording-pulse"></div>
              <span className="text-red-600 font-medium">
                Recording: {formatTime(recordingTime)}
              </span>
            </div>
            <button
              onClick={stopRecording}
              className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Square className="w-5 h-5" />
              <span>Stop Recording</span>
            </button>
          </>
        )}
      </div>

      {/* Audio Playback */}
      {audioUrl && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Recorded Audio</h4>
            <div className="flex space-x-2">
              <button
                onClick={playAudio}
                className="flex items-center space-x-1 text-medical-blue hover:text-primary-700 transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span className="text-sm">{isPlaying ? 'Pause' : 'Play'}</span>
              </button>
              <button
                onClick={clearRecording}
                className="flex items-center space-x-1 text-red-600 hover:text-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm">Clear</span>
              </button>
            </div>
          </div>

          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            className="w-full"
            controls
          />
        </div>
      )}

      {/* Process Audio Button */}
      {recordedAudio && !isProcessing && (
        <button
          onClick={processAudio}
          className="w-full btn-primary py-3 flex items-center justify-center space-x-2"
        >
          <Upload className="w-5 h-5" />
          <span>Process Audio & Generate Notes</span>
        </button>
      )}

      {/* Processing Status */}
      {isProcessing && (
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-800">
              Processing Audio...
            </span>
            <span className="text-sm text-blue-600">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-xs text-blue-600 mt-2">
            This may take a few moments depending on audio length...
          </p>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;