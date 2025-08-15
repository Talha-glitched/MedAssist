import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { notesAPI } from '../../services/api';
import TranscriptViewer from '../../components/Medical/TranscriptViewer';
import SOAPNoteViewer from '../../components/Medical/SOAPNoteViewer';
import toast from 'react-hot-toast';

const NotesView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [note, setNote] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadNote(id);
    }
  }, [id]);

  const loadNote = async (noteId: string) => {
    try {
      const response = await notesAPI.getNote(noteId);
      if (response.data.success) {
        setNote(response.data.data);
      }
    } catch (error) {
      console.error('Error loading note:', error);
      toast.error('Failed to load note');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-medical-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading note...</p>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Note not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Medical Note Details</h1>
      
      {note.transcript && (
        <TranscriptViewer
          transcript={note.transcript}
          onEdit={(editedText) => {
            // Handle transcript edit
            console.log('Transcript edited:', editedText);
          }}
        />
      )}

      {note.soapNote && (
        <SOAPNoteViewer
          note={note.soapNote}
          onApprove={(noteId) => {
            // Handle note approval
            console.log('Note approved:', noteId);
          }}
          onEdit={(noteId, updatedNote) => {
            // Handle note edit
            console.log('Note edited:', noteId, updatedNote);
          }}
          onReject={(noteId, reason) => {
            // Handle note rejection
            console.log('Note rejected:', noteId, reason);
          }}
        />
      )}
    </div>
  );
};

export default NotesView;