// app.jsx
import React, { useState, useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  Navigate,
} from 'react-router-dom';
import axios from 'axios';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';
import {
  Mail,
  Lock,
  LogIn,
  LogOut,
  CheckCircle,
  XCircle,
  Loader,
  PlusCircle,
} from 'lucide-react';

// ---------------- CONFIG ----------------
const firebaseConfig = {
  apiKey: "AIzaSyA_orsS4MR3eze8eXu69pIxhBtcKJOCmAE",
  authDomain: "synthiot-c734c.firebaseapp.com",
  projectId: "synthiot-c734c",
  storageBucket: "synthiot-c734c.firebasestorage.app",
  messagingSenderId: "529523977895",
  appId: "1:529523977895:web:3c9593120cdcdd3ffab582",
  measurementId: "G-W6G9C7V4GS"
};

const API_BASE_URL = 'http://localhost:8000';

initializeApp(firebaseConfig);
const authService = getAuth();

// ---------------- UI helpers ----------------
const statusClasses = {
  success: 'bg-green-100 text-green-800 border-green-400',
  error: 'bg-red-100 text-red-800 border-red-400',
  info: 'bg-blue-100 text-blue-800 border-blue-400',
};

const AuthBar = ({ authMessage }) => {
  const authStatusClass = statusClasses[authMessage.type] || 'hidden';
  return authMessage.text ? (
    <div className={`p-3 rounded-lg border text-sm flex items-center space-x-2 transition-opacity ${authStatusClass}`}>
      {authMessage.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
      <span>{authMessage.text}</span>
    </div>
  ) : null;
};

// ---------------- Home (projects) ----------------
const Home = ({ user, setAuthMessage, handleSignOut }) => {
  const [projects, setProjects] = useState([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchProjects = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken(true);
      const resp = await axios.get(`${API_BASE_URL}/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(Array.isArray(resp.data) ? resp.data : []);
    } catch (err) {
      console.error("Fetch projects error:", err.response || err);
      setAuthMessage({ type: 'error', text: 'Failed to fetch projects.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setAuthMessage({ type: 'error', text: 'Project name required.' });
      return;
    }
    setCreating(true);
    try {
      const token = await user.getIdToken(true);
      const resp = await axios.post(
        `${API_BASE_URL}/projects`,
        { name: name.trim(), description: description.trim() || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProjects(prev => [resp.data, ...prev]);
      setName('');
      setDescription('');
      setAuthMessage({ type: 'success', text: 'Project created.' });
    } catch (err) {
      console.error("Create project error:", err.response || err);
      const msg = err.response?.data?.detail || 'Failed to create project.';
      setAuthMessage({ type: 'error', text: msg });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center p-6 font-sans">
      <div className="w-full max-w-3xl bg-white shadow-2xl rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-indigo-700">My Projects</h1>
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-600 font-mono break-all">{user?.email}</div>
            <button
              onClick={handleSignOut}
              className="flex items-center px-3 py-1 text-sm font-medium text-indigo-600 bg-white border border-indigo-300 rounded-lg hover:bg-indigo-50 shadow-sm transition"
            >
              <LogOut size={16} className="mr-2" /> Sign Out
            </button>
          </div>
        </div>

        <form onSubmit={handleCreateProject} className="space-y-3 bg-indigo-50 p-4 rounded-lg border border-indigo-100">
          <div className="flex items-center space-x-2">
            <PlusCircle size={18} />
            <h2 className="text-lg font-medium text-indigo-700">Create New Project</h2>
          </div>
          <input
            placeholder="Project Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
            rows={3}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              {creating ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>

        <div>
          <h3 className="text-sm text-gray-500 mb-3">Your existing projects</h3>
          {loading ? (
            <div className="p-4 bg-gray-50 rounded-lg">Loading...</div>
          ) : projects.length === 0 ? (
            <div className="p-4 bg-gray-50 rounded-lg">No projects found — create one above.</div>
          ) : (
            <div className="grid gap-3">
              {projects.map(p => (
                <div key={p.id} className="p-3 border rounded-lg bg-white shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-indigo-700">{p.name}</h4>
                      <p className="text-xs text-gray-500">Created: {new Date(p.created_at).toLocaleString()}</p>
                    </div>
                    <div className="text-xs text-gray-500 font-mono">{p.id.substring(0,8)}...</div>
                  </div>
                  {p.description && <p className="mt-2 text-sm text-gray-700">{p.description}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

// ---------------- AppInner (auth + routing) ----------------
const AppInner = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState(''); // optional
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authMessage, setAuthMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(authService, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
      if (currentUser) {
        setAuthMessage({ type: 'success', text: 'User signed in. Redirecting...' });
        navigate('/home');
      } else {
        setAuthMessage({ type: 'info', text: 'No user signed in. Please log in.' });
      }
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayMessage = (type, text) => {
    setAuthMessage({ type, text });
    setTimeout(() => setAuthMessage({ type: '', text: '' }), 5000);
  };

  // Signup: call backend /signup (server creates Auth user + user_details doc)
  const handleSignUp = async (e) => {
    e.preventDefault();
    setAuthMessage({ type: 'info', text: 'Signing up...' });
    if (!email || !password) {
      displayMessage('error', 'Email and password required.');
      return;
    }

    try {
      // Send exactly the fields backend expects
      await axios.post(`${API_BASE_URL}/signup`, {
        email,
        password,
        display_name: displayName || null,
      });

      // Sign in client-side (so onAuthStateChanged triggers and gets a session)
      await signInWithEmailAndPassword(authService, email, password);

      displayMessage('success', 'Signed up and signed in!');
    } catch (err) {
      console.error("Signup error:", err.response || err);
      let message = 'Signup failed.';
      if (err.response) message = err.response.data?.detail || message;
      displayMessage('error', message);
    }
  };

  // Sign in existing user
  const handleSignIn = async (e) => {
    e.preventDefault();
    setAuthMessage({ type: 'info', text: 'Signing in...' });
    try {
      await signInWithEmailAndPassword(authService, email, password);
      displayMessage('success', 'Signed in!');
    } catch (err) {
      console.error("Sign-in error:", err);
      displayMessage('error', `Sign in failed: ${err.message?.split('(')[0]}`);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(authService);
      localStorage.removeItem('firebase_id_token');
      setUser(null);
      displayMessage('info', 'Signed out.');
      navigate('/');
    } catch (err) {
      displayMessage('error', 'Sign out failed.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-xl bg-white shadow-2xl rounded-xl p-8 space-y-8">
          <h1 className="text-3xl font-bold text-center text-indigo-700">SynthIoT</h1>

          <AuthBar authMessage={authMessage} />

          <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-200">
            <form className="space-y-4">
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Display name (optional)"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex justify-between space-x-4 pt-2">
                <button
                  onClick={handleSignIn}
                  className="flex-1 flex items-center justify-center px-4 py-2 font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-lg"
                >
                  <LogIn size={18} className="mr-2" /> Sign In
                </button>
                <button
                  onClick={handleSignUp}
                  className="flex-1 flex items-center justify-center px-4 py-2 font-medium text-indigo-600 bg-white border border-indigo-300 rounded-lg"
                >
                  Sign Up
                </button>
              </div>
            </form>
          </div>

          <div className="text-center pt-2 text-xs text-gray-400">
            <p>Token is managed in Firebase session; the app will request a fresh ID token when calling the backend.</p>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated routes
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={<Home user={user} setAuthMessage={displayMessage} handleSignOut={handleSignOut} />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

// Root wrapper
const App = () => (
  <BrowserRouter>
    <AppInner />
  </BrowserRouter>
);

export default App;
