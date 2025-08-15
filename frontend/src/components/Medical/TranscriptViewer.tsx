import React from 'react';
import { Copy, Download, Edit } from 'lucide-react';
import toast from 'react-hot-toast';

interface TranscriptViewerProps {
  transcript: {
    id: string;
    text: string;
    confidence: number;
    speakerLabels?: Array<{
      speaker: string;
      text: string;
      timestamp: string;
    }>;
    duration: number;
    createdAt: string;
  };
  onEdit?: (editedText: string) => void;
}

const TranscriptViewer: React.FC<TranscriptViewerProps> = ({ transcript, onEdit }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedText, setEditedText] = React.useState(transcript.text);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(transcript.text);
      toast.success('Transcript copied to clipboard');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy transcript');
    }
  };

  const handleSaveEdit = () => {
    onEdit?.(editedText);
    setIsEditing(false);
    toast.success('Transcript updated successfully');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="medical-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Conversation Transcript</h3>
          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
            <span>Duration: {formatDuration(transcript.duration)}</span>
            <span>Confidence: {Math.round(transcript.confidence * 100)}%</span>
            <span>Generated: {new Date(transcript.createdAt).toLocaleString()}</span>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 text-gray-600 hover:text-medical-blue rounded-lg hover:bg-gray-100 transition-colors"
            title={isEditing ? 'Cancel editing' : 'Edit transcript'}
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopyToClipboard}
            className="p-2 text-gray-600 hover:text-medical-blue rounded-lg hover:bg-gray-100 transition-colors"
            title="Copy to clipboard"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              const blob = new Blob([transcript.text], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `transcript-${transcript.id}.txt`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="p-2 text-gray-600 hover:text-medical-blue rounded-lg hover:bg-gray-100 transition-colors"
            title="Download transcript"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Confidence Indicator */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600">Transcription Quality</span>
          <span className={`font-medium ${
            transcript.confidence >= 0.9 ? 'text-green-600' :
            transcript.confidence >= 0.7 ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {transcript.confidence >= 0.9 ? 'Excellent' :
             transcript.confidence >= 0.7 ? 'Good' : 'Fair'}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              transcript.confidence >= 0.9 ? 'bg-green-500' :
              transcript.confidence >= 0.7 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${transcript.confidence * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Transcript Content */}
      {isEditing ? (
        <div className="space-y-4">
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-medical-blue focus:border-transparent"
            placeholder="Edit the transcript here..."
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setIsEditing(false);
                setEditedText(transcript.text);
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
        </div>
      ) : (
        <div className="space-y-4">
          {transcript.speakerLabels && transcript.speakerLabels.length > 0 ? (
            // Speaker-labeled transcript
            <div className="space-y-3">
              {transcript.speakerLabels.map((segment, index) => (
                <div key={index} className="flex space-x-3">
                  <div className="flex-shrink-0 w-20 text-sm font-medium text-gray-600">
                    {segment.speaker}:
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 leading-relaxed">{segment.text}</p>
                    {segment.timestamp && (
                      <p className="text-xs text-gray-500 mt-1">{segment.timestamp}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Plain transcript
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                {transcript.text}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Analysis Insights */}
      {transcript.confidence < 0.7 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> This transcript has lower confidence due to audio quality. 
            Consider re-recording or editing for accuracy before generating medical notes.
          </p>
        </div>
      )}
    </div>
  );
};

export default TranscriptViewer;