/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User as UserIcon, Loader2, KeyRound } from 'lucide-react';
import { api } from '../api';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'organizer'>('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const response = await api.login(email, password);
        if (response.success && response.data) {
          onSuccess(response.data.user);
          onClose();
          resetForm();
        } else {
          setError(response.error || 'Invalid credentials');
        }
      } else {
        const response = await api.register(email, name, password, role);
        if (response.success && response.data) {
          onSuccess(response.data.user);
          onClose();
          resetForm();
        } else {
          setError(response.error || 'Registration failed');
        }
      }
    } catch (err: any) {
      setError('An unexpected connection error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setName('');
    setPassword('');
    setRole('user');
    setError(null);
  };

  const prefillCredentials = (role: 'admin' | 'user') => {
    if (role === 'admin') {
      setEmail('organizer@evently.com');
      setPassword('admin123');
    } else {
      setEmail('alex@minimalist.io');
      setPassword('user123');
    }
    setIsLogin(true);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 15, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.15 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-zinc-100 bg-white p-8 shadow-xl z-10"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-5 top-5 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600 transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="mb-6 text-center">
              <span className="font-display font-bold text-2xl tracking-tight bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">
                Evently
              </span>
              <h3 className="font-display font-semibold text-xl text-zinc-900 mt-2">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h3>
              <p className="text-zinc-400 text-sm mt-1">
                {isLogin ? 'Sign in to manage and RSVP to events' : 'Join Evently to explore and RSVP to events'}
              </p>
            </div>

            {/* Error Banner */}
            <AnimatePresence mode="popLayout">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="mb-4 overflow-hidden"
                >
                  <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-100">
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
                      <UserIcon className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Sarah Jenkins"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2.5 pl-10 pr-4 text-sm text-zinc-800 placeholder-zinc-400 outline-none hover:bg-zinc-50 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                  </div>
                </div>
              )}

              {!isLogin && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                    Account Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('user')}
                      className={`relative flex flex-col items-center justify-center p-3 rounded-xl border ${
                        role === 'user' 
                          ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700 shadow-sm' 
                          : 'border-zinc-200 bg-zinc-50/50 text-zinc-600 hover:bg-zinc-50'
                      } transition-all cursor-pointer`}
                    >
                      <UserIcon className={`h-5 w-5 mb-1 ${role === 'user' ? 'text-indigo-600' : 'text-zinc-400'}`} />
                      <span className="text-xs font-semibold">Attendee</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('organizer')}
                      className={`relative flex flex-col items-center justify-center p-3 rounded-xl border ${
                        role === 'organizer' 
                          ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700 shadow-sm' 
                          : 'border-zinc-200 bg-zinc-50/50 text-zinc-600 hover:bg-zinc-50'
                      } transition-all cursor-pointer`}
                    >
                      <div className={`h-5 w-5 mb-1 rounded flex items-center justify-center ${role === 'organizer' ? 'text-indigo-600' : 'text-zinc-400'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-briefcase"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                      </div>
                      <span className="text-xs font-semibold">Organizer</span>
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2.5 pl-10 pr-4 text-sm text-zinc-800 placeholder-zinc-400 outline-none hover:bg-zinc-50 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2.5 pl-10 pr-4 text-sm text-zinc-800 placeholder-zinc-400 outline-none hover:bg-zinc-50 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 py-3 px-4 font-medium text-sm text-white shadow-sm hover:shadow transition-all disabled:opacity-75 cursor-pointer mt-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : isLogin ? (
                  'Sign In'
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            {/* Toggle Tab */}
            <div className="mt-5 text-center text-xs text-zinc-400">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                }}
                className="font-semibold text-indigo-600 hover:text-indigo-700 underline underline-offset-2 cursor-pointer transition-colors"
              >
                {isLogin ? 'Sign Up' : 'Log In'}
              </button>
            </div>

            {/* Quick Demo Accounts */}
            <div className="mt-6 border-t border-zinc-100 pt-4">
              <div className="flex items-center justify-center gap-1.5 text-zinc-400 mb-2.5 text-[11px] font-semibold tracking-wider uppercase">
                <KeyRound className="h-3.5 w-3.5 text-zinc-400" />
                Quick Sandbox Credentials
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => prefillCredentials('admin')}
                  className="rounded-lg border border-zinc-100 bg-zinc-50 hover:bg-zinc-100/70 p-2 text-[11px] font-medium text-zinc-600 text-left transition-all cursor-pointer"
                >
                  <div className="font-semibold text-indigo-600">Sarah Jenkins</div>
                  <div className="text-zinc-400 truncate">organizer@evently.com</div>
                </button>
                <button
                  type="button"
                  onClick={() => prefillCredentials('user')}
                  className="rounded-lg border border-zinc-100 bg-zinc-50 hover:bg-zinc-100/70 p-2 text-[11px] font-medium text-zinc-600 text-left transition-all cursor-pointer"
                >
                  <div className="font-semibold text-indigo-600">Alex Rivera</div>
                  <div className="text-zinc-400 truncate">alex@minimalist.io</div>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
