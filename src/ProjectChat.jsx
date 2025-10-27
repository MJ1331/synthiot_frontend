// ProjectChat.jsx (or paste into app.jsx and export/import accordingly)
import React, { useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

// API base (match your frontend config)
const API_BASE_URL = 'http://localhost:8000';

// Helper: fetch protected streaming CSV and trigger browser download
async function downloadCSVWithAuth(projectId, genId, user) {
  const token = await user.getIdToken(true);
  const url = `${API_BASE_URL}/projects/${projectId}/download?gen=${genId}`;
  const resp = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Download failed: ${resp.status} ${text}`);
  }
  const blob = await resp.blob();
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `${projectId}_${genId}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(downloadUrl);
}

const ProjectChat = ({ user, setAuthMessage, navigateBack }) => {
  const { id: projectId } = useParams();
  const [prompt, setPrompt] = useState('');
  const [rows, setRows] = useState(24);
  const [freqSeconds, setFreqSeconds] = useState(3600);
  const [loading, setLoading] = useState(false);

  const submitPrompt = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setAuthMessage({ type: 'error', text: 'Please enter a prompt.' });
      return;
    }
    setLoading(true);
    try {
      const token = await user.getIdToken(true);
      // You can post rows and freq_seconds optionally
      const resp = await axios.post(
        `${API_BASE_URL}/projects/${projectId}/chat`,
        { prompt, rows, freq_seconds: freqSeconds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const genId = resp.data.generation_id;
      setAuthMessage({ type: 'success', text: 'Generation ready — starting download...' });
      await downloadCSVWithAuth(projectId, genId, user);
      setAuthMessage({ type: 'success', text: 'Download started.' });
    } catch (err) {
      console.error('Chat/generate error:', err.response || err);
      let message = 'Generation failed.';
      if (err.response && err.response.data) message = err.response.data.detail || message;
      setAuthMessage({ type: 'error', text: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 flex items-start justify-center">
      <div className="w-full max-w-3xl bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Chat / Generate CSV — Project {projectId.substring(0,8)}...</h2>
          <button className="text-sm text-gray-600" onClick={() => navigateBack && navigateBack()}>Back</button>
        </div>

        <form onSubmit={submitPrompt} className="space-y-3">
          <textarea
            placeholder="Example: Generate hourly temperature for 2025-11-01 in Mumbai, clear weather, 24 rows"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full p-3 border rounded"
            rows={4}
          />

          <div className="flex items-center space-x-3">
            <label className="text-sm">Rows:</label>
            <input type="number" value={rows} onChange={(e) => setRows(Number(e.target.value))} min={1} className="w-28 p-2 border rounded" />
            <label className="text-sm">Freq (s):</label>
            <input type="number" value={freqSeconds} onChange={(e) => setFreqSeconds(Number(e.target.value))} min={1} className="w-28 p-2 border rounded" />
            <button disabled={loading} className="ml-auto px-4 py-2 bg-indigo-600 text-white rounded">
              {loading ? 'Generating...' : 'Generate & Download CSV'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectChat;
