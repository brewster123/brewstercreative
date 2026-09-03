import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  UserCheck, 
  Sparkles, 
  ArrowRight, 
  Layers, 
  Eye, 
  Send, 
  Key, 
  Mail, 
  User, 
  CheckCircle2, 
  Lock,
  Compass,
  Briefcase
} from 'lucide-react';

export const AuthView: React.FC = () => {
  const { 
    currentUser, 
    loginUser, 
    registerClient, 
    logout, 
    setActiveView, 
    users, 
    studioProfile 
  } = useApp();

  const [authRoleTab, setAuthRoleTab] = useState<'client' | 'admin'>('client');
  const [clientMode, setClientMode] = useState<'signin' | 'register'>('signin');

  // Client sign-in form state
  const [clientEmail, setClientEmail] = useState('');
  
  // Client registration form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regHandle, setRegHandle] = useState('');
  const [regContact, setRegContact] = useState('Platform Chat & Email');

  // Admin sign-in form state
  const [adminEmail, setAdminEmail] = useState('cabandobrewster@gmail.com');
  const [adminPin, setAdminPin] = useState('admin2026');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  const sampleClients = users.filter(u => u.role === 'client');

  const handleClientLogin = (emailToUse?: string) => {
    setAuthError('');
    const email = emailToUse || clientEmail;
    if (!email) {
      setAuthError('Please enter your email or choose a sample client.');
      return;
    }
    const success = loginUser(email, 'client');
    if (success) {
      setAuthSuccess(`Welcome back! Logged in as client.`);
      setTimeout(() => {
        setActiveView('client-dashboard');
      }, 400);
    }
  };

  const handleClientRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!regName.trim() || !regEmail.trim()) {
      setAuthError('Please enter your full name and email.');
      return;
    }
    const newClient = registerClient(regName, regEmail, regHandle, regContact);
    setAuthSuccess(`Welcome, ${newClient.name}! Your client account has been created.`);
    setTimeout(() => {
      setActiveView('client-dashboard');
    }, 400);
  };

  const handleAdminLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError('');
    // For demo convenience, allow sign in
    const success = loginUser('cabandobrewster@gmail.com', 'admin');
    if (success) {
      setAuthSuccess(`Welcome back, Brewster! Admin studio privileges unlocked.`);
      setTimeout(() => {
        setActiveView('admin-dashboard');
      }, 400);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      
      {/* Header Banner */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-mono-code uppercase tracking-wider font-bold border border-orange-200">
          <Lock className="w-3.5 h-3.5 text-orange-500" />
          <span>Role-Based Access Portal</span>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight">
          Sign In to Brewster Creative
        </h1>

        <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-medium">
          Clients log in to view their private commissions and submit briefs. Brewster logs in as Admin to manage and edit website content, portfolio, rates, and all client commissions.
        </p>
      </div>

      {/* If currently logged in banner */}
      {currentUser && (
        <div className="bg-white border border-[#E5E5E5] rounded-[24px] p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name} 
              className="w-12 h-12 rounded-full object-cover ring-2 ring-orange-500/30"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-zinc-900">{currentUser.name}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono-code font-bold uppercase ${
                  currentUser.role === 'admin' 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-orange-50 text-orange-700 border border-orange-200'
                }`}>
                  {currentUser.role === 'admin' ? 'Studio Director (Admin)' : 'Client Account'}
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-mono-code mt-0.5">{currentUser.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {currentUser.role === 'admin' ? (
              <button
                type="button"
                onClick={() => setActiveView('admin-dashboard')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Go to Admin Dashboard</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveView('client-dashboard')}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Go to My Client Portal</span>
              </button>
            )}

            <button
              type="button"
              onClick={logout}
              className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main Dual Tab Container */}
      <div className="bg-white border border-[#E5E5E5] rounded-[32px] p-6 sm:p-10 shadow-sm space-y-8">
        
        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-zinc-100/90 rounded-2xl border border-zinc-200/80">
          <button
            id="tab-auth-client"
            type="button"
            onClick={() => {
              setAuthRoleTab('client');
              setAuthError('');
              setAuthSuccess('');
            }}
            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              authRoleTab === 'client'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <UserCheck className={`w-4 h-4 ${authRoleTab === 'client' ? 'text-orange-500' : ''}`} />
            <span>I am a Client</span>
          </button>

          <button
            id="tab-auth-admin"
            type="button"
            onClick={() => {
              setAuthRoleTab('admin');
              setAuthError('');
              setAuthSuccess('');
            }}
            className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              authRoleTab === 'admin'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <ShieldCheck className={`w-4 h-4 ${authRoleTab === 'admin' ? 'text-emerald-600' : ''}`} />
            <span>I am Brewster (Admin)</span>
          </button>
        </div>

        {/* Feedback Alert Messages */}
        {authError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {authError}
          </div>
        )}
        {authSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{authSuccess}</span>
          </div>
        )}

        {/* TAB 1: CLIENT SIGN IN / REGISTER */}
        {authRoleTab === 'client' && (
          <div className="space-y-8">
            
            {/* Permission Scope Notice for Client */}
            <div className="p-5 rounded-2xl bg-orange-50/50 border border-orange-200/60 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-orange-900">
                <Compass className="w-4 h-4 text-orange-600 shrink-0" />
                <span>Client Access Permissions & View Scope</span>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-zinc-600 font-medium">
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span> Browse Home, Portfolio & Design Services
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span> Submit new custom commission requests
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span> Track and approve <strong className="text-zinc-900">your personal project only</strong>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span> Edit your own client profile & contact details
                </li>
                <li className="flex items-center gap-1.5 text-zinc-400">
                  <span className="text-rose-500 font-bold">✗</span> Cannot edit website info, portfolio, or prices
                </li>
                <li className="flex items-center gap-1.5 text-zinc-400">
                  <span className="text-rose-500 font-bold">✗</span> Cannot see other clients' commission requests
                </li>
              </ul>
            </div>

            {/* Client Mode Switch: Sign In vs Register */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <span className="text-xs font-bold text-zinc-700">
                {clientMode === 'signin' ? 'Sign in to existing account:' : 'Create a new client account:'}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setClientMode('signin')}
                  className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors ${
                    clientMode === 'signin' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setClientMode('register')}
                  className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors ${
                    clientMode === 'register' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  Register
                </button>
              </div>
            </div>

            {clientMode === 'signin' ? (
              <div className="space-y-6">
                {/* One-Click Sample Client Login Buttons */}
                <div className="space-y-2.5">
                  <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider font-mono-code">
                    Quick-Login with Sample Client Profile:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {sampleClients.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => handleClientLogin(client.email)}
                        className="p-3.5 rounded-2xl bg-zinc-50 hover:bg-orange-50/50 border border-zinc-200 hover:border-orange-300 text-left transition-all group flex flex-col justify-between"
                      >
                        <div className="flex items-center gap-2.5 mb-2">
                          <img 
                            src={client.avatar} 
                            alt={client.name} 
                            className="w-9 h-9 rounded-full object-cover ring-1 ring-zinc-300 group-hover:ring-orange-400"
                          />
                          <div>
                            <span className="text-xs font-bold text-zinc-900 block group-hover:text-orange-600 transition-colors">
                              {client.name}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono-code block">
                              {client.handle || 'Client'}
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] text-orange-600 font-bold group-hover:underline flex items-center gap-1">
                          Sign In &rarr;
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Email Sign In Form */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                    Or Enter Any Registered Client Email:
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="e.g. alex.rivera@solislabs.io"
                      className="flex-1 bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:bg-white"
                    />
                    <button
                      id="btn-client-login-submit"
                      type="button"
                      onClick={() => handleClientLogin()}
                      className="px-6 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm transition-all shadow-xs"
                    >
                      Sign In as Client
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Register Form */
              <form onSubmit={handleClientRegister} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Sarah Jenkins"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="sarah@example.com"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1">
                      Company / Brand Handle
                    </label>
                    <input
                      type="text"
                      value={regHandle}
                      onChange={(e) => setRegHandle(e.target.value)}
                      placeholder="@sarahcreative"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1">
                      Preferred Contact Channel
                    </label>
                    <select
                      value={regContact}
                      onChange={(e) => setRegContact(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-orange-500 focus:bg-white font-medium"
                    >
                      <option value="Platform Chat & Email">Platform Chat & Email</option>
                      <option value="Discord">Discord</option>
                      <option value="Telegram">Telegram</option>
                      <option value="WhatsApp">WhatsApp</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm transition-all shadow-xs flex items-center gap-2"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Create Account & Sign In</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        )}

        {/* TAB 2: ADMIN SIGN IN (BREWSTER) */}
        {authRoleTab === 'admin' && (
          <div className="space-y-6">
            
            {/* Admin Scope Notice */}
            <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Studio Director (Admin) Permissions & Control Privileges</span>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-zinc-700 font-medium">
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span> <strong className="text-zinc-900">Edit Website Info</strong>: Bio, name, contacts & commission slot availability
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span> <strong className="text-zinc-900">Manage Portfolio</strong>: Add new works, edit details, or remove showcase pieces
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span> <strong className="text-zinc-900">Manage Services & Pricing</strong>: Update base rates, turnaround, and deliverables
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span> <strong className="text-zinc-900">View All Client Commissions</strong>: Track, accept, progress stages, & deliver final files
                </li>
              </ul>
            </div>

            {/* Quick 1-Click Instant Login */}
            <div className="p-6 rounded-[28px] bg-zinc-900 text-white flex flex-col sm:flex-row items-center justify-between gap-5">
              <div className="flex items-center gap-3.5">
                <img 
                  src={studioProfile.avatar} 
                  alt={studioProfile.designerName} 
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-400"
                />
                <div>
                  <h3 className="font-display font-black text-sm text-white flex items-center gap-1.5">
                    {studioProfile.designerName}
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono-code">{studioProfile.email}</p>
                </div>
              </div>

              <button
                id="btn-admin-instant-login"
                type="button"
                onClick={() => handleAdminLogin()}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 shrink-0"
              >
                <Key className="w-4 h-4" />
                <span>Sign in as Brewster (Admin)</span>
              </button>
            </div>

            {/* Manual Admin Form */}
            <form onSubmit={handleAdminLogin} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">
                    Security Passcode
                  </label>
                  <input
                    type="password"
                    required
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs transition-all shadow-xs"
                >
                  Verify & Enter Admin Studio
                </button>
              </div>
            </form>

          </div>
        )}

      </div>

    </div>
  );
};
