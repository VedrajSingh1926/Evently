/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Plus, LogOut, Shield, Sparkles, Compass, LayoutDashboard } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  currentUser: User | null;
  activeTab: 'discover' | 'dashboard';
  onChangeTab: (tab: 'discover' | 'dashboard') => void;
  onLoginClick: () => void;
  onPublishClick: () => void;
  onLogout: () => void;
}

export default function Navbar({
  currentUser,
  activeTab,
  onChangeTab,
  onLoginClick,
  onPublishClick,
  onLogout,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/60 bg-zinc-950/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-8">
        
        {/* Brand Logo & Tabs Group */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-xl tracking-tight bg-gradient-to-r from-indigo-400 via-indigo-500 to-violet-500 bg-clip-text text-transparent">
              Evently
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[9px] font-bold text-indigo-400 tracking-wide uppercase">
              <Sparkles className="h-2.5 w-2.5" /> suite
            </span>
          </div>

          {/* Interactive Navigation Tabs */}
          {currentUser && (
            <nav className="hidden md:flex items-center gap-1 bg-zinc-900/80 rounded-xl p-1 border border-zinc-800/60">
              <button
                onClick={() => onChangeTab('discover')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'discover'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Compass className="h-3.5 w-3.5" />
                Discover
              </button>
              <button
                onClick={() => onChangeTab('dashboard')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                Dashboard
              </button>
            </nav>
          )}
        </div>

        {/* Action Widgets */}
        <div className="flex items-center gap-4">
          {currentUser && (
            <div className="md:hidden flex items-center gap-1 bg-zinc-900/85 rounded-xl p-0.5 border border-zinc-800">
              <button
                onClick={() => onChangeTab('discover')}
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'discover' ? 'bg-indigo-600 text-white' : 'text-zinc-400'
                }`}
                title="Discover Events"
              >
                <Compass className="h-4 w-4" />
              </button>
              <button
                onClick={() => onChangeTab('dashboard')}
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-zinc-400'
                }`}
                title="SaaS Dashboard"
              >
                <LayoutDashboard className="h-4 w-4" />
              </button>
            </div>
          )}

          {currentUser?.role === 'organizer' && (
            <button
              onClick={onPublishClick}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:shadow transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Publish Event
            </button>
          )}

          {currentUser ? (
            <div className="flex items-center gap-3">
              {/* User Avatar & Info */}
              <div className="hidden md:block text-right">
                <span className="block text-xs font-semibold text-zinc-100 leading-none">{currentUser.name}</span>
                <span className="inline-flex items-center gap-1 text-[9px] text-zinc-400 font-mono mt-1 uppercase tracking-wider">
                  {currentUser.role === 'organizer' ? (
                    <>
                      <Shield className="h-2.5 w-2.5 text-indigo-400" /> Host Organizer
                    </>
                  ) : (
                    'Attendee Member'
                  )}
                </span>
              </div>
              
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-bold text-xs flex items-center justify-center select-none shadow ring-2 ring-zinc-800">
                {currentUser.name[0].toUpperCase()}
              </div>

              {/* Log Out */}
              <button
                onClick={onLogout}
                title="Sign out of Evently"
                className="p-2 rounded-xl text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-all cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 py-2 px-4 text-xs font-semibold text-zinc-200 shadow-sm transition-all cursor-pointer"
            >
              Log In
            </button>
          )}
        </div>

      </div>
    </header>
  );
}

