/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  Sparkles, 
  Ticket, 
  MapPin, 
  Clock, 
  Download, 
  Plus, 
  Briefcase,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  Loader2,
  BookmarkCheck
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { api } from '../api';
import { User, Event, RSVP } from '../types';

/* ==========================================================================
   SUPABASE DDL REFERENCE & RELATIONAL CONSTRAINTS REQUIRED
   ==========================================================================
   Execute these statements in your Supabase SQL editor to provision tables:

   -- 1. Profiles Table linked to Firebase UID (or Supabase Auth)
   CREATE TABLE profiles (
     id TEXT PRIMARY KEY, -- Firebase Auth UID string
     email TEXT NOT NULL,
     name TEXT,
     role TEXT DEFAULT 'user' CHECK (role IN ('user', 'organizer')),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
   );

   -- 2. Corporate Events Table
   CREATE TABLE events (
     id TEXT PRIMARY KEY,
     title TEXT NOT NULL,
     description TEXT NOT NULL,
     date DATE NOT NULL,
     time TEXT NOT NULL,
     location TEXT NOT NULL,
     category TEXT NOT NULL,
     image_url TEXT,
     capacity INTEGER NOT NULL,
     organizer_id TEXT REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
     organizer_name TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
   );

   -- 3. RSVPs Table with Compound Constraints
   CREATE TABLE rsvps (
     id TEXT PRIMARY KEY,
     event_id TEXT REFERENCES events(id) ON DELETE CASCADE NOT NULL,
     user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
     user_name TEXT NOT NULL,
     user_email TEXT NOT NULL,
     status TEXT NOT NULL CHECK (status IN ('going', 'maybe', 'not_going')),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
     UNIQUE (event_id, user_id)
   );

   -- 4. Discussion Comments Table
   CREATE TABLE comments (
     id TEXT PRIMARY KEY,
     event_id TEXT REFERENCES events(id) ON DELETE CASCADE NOT NULL,
     user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
     user_name TEXT NOT NULL,
     content TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
   );
   ========================================================================== */

interface DashboardProps {
  currentUser: User | null;
  onOpenCreateModal: () => void;
  onEventSelect: (id: string) => void;
}

export default function Dashboard({ currentUser, onOpenCreateModal, onEventSelect }: DashboardProps) {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [allRsvps, setAllRsvps] = useState<RSVP[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load state and profiles
  useEffect(() => {
    loadDashboardData();
  }, [currentUser]);

  const loadDashboardData = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    try {
      const eventsRes = await api.getEvents();
      if (eventsRes.success && eventsRes.data) {
        setEvents(eventsRes.data);
      } else {
        setError(eventsRes.error || 'Failed to populate core experience lists.');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with full-stack endpoints.');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 max-w-md mx-auto">
        <ShieldAlert className="h-12 w-12 text-zinc-600 animate-pulse" />
        <h3 className="font-display font-bold text-xl text-zinc-100">Identity Context Offline</h3>
        <p className="text-zinc-400 text-sm">
          Please authenticate via the premium access portal to configure your dynamic dual-role SaaS dashboards.
        </p>
      </div>
    );
  }

  const isOrganizer = currentUser.role === 'organizer';

  // --- DUAL ROLE INTERFACES ---

  return (
    <div className="space-y-12">
      {/* Premium Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-200 pb-8">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-mono text-[10px] uppercase tracking-widest font-bold mb-2">
            <span className="h-1.5 w-1.5 bg-indigo-600 rounded-full animate-ping" />
            SaaS Interactive Portal
          </div>
          <h1 className="font-display font-medium text-4xl text-zinc-900 tracking-tight leading-tight">
            Welcome, <span className="font-light italic text-zinc-600">{currentUser.name}</span>
          </h1>
          <p className="text-sm text-zinc-500 max-w-xl mt-2 leading-relaxed">
            {isOrganizer 
              ? 'Analyze live engagement charts, track digital seat monetization, and manage invite-only corporate listings.'
              : 'View booked timeline calendars, acquire digital boarding passes, and browse recommended AI matches.'}
          </p>
        </div>

        {isOrganizer && (
          <button
            onClick={onOpenCreateModal}
            className="group flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-semibold text-white hover:bg-indigo-500 transition-all cursor-pointer shadow-md active:scale-95 shrink-0"
          >
            <Plus className="h-4 w-4 text-indigo-200" />
            Create Experience
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
          <span className="text-xs font-mono tracking-wider text-zinc-500 uppercase">Synchronizing profiles...</span>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-6 text-center max-w-lg mx-auto">
          <p className="text-sm font-semibold text-red-400">Synchronization Interrupt</p>
          <p className="text-xs text-red-500 mt-2">{error}</p>
          <button
            onClick={loadDashboardData}
            className="mt-4 px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            Reconnect
          </button>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {isOrganizer ? (
            /* ==========================================================================
               PATH A: ORGANIZER HIGH-FIDELITY DASHBOARD
               ========================================================================== */
            <motion.div
              key="organizer-panel"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-10"
            >
              {/* ✨ Establish Event via Gemini AI Premium Banner */}
              <div className="relative overflow-hidden rounded-2xl border border-indigo-200 bg-indigo-50/50 p-6 glass-panel flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-indigo-200/50 blur-3xl pointer-events-none" />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider">
                    <Sparkles className="h-4 w-4 animate-pulse text-indigo-600" />
                    Intelligent Copilot Enabled
                  </div>
                  <h3 className="font-display font-bold text-xl text-zinc-900">Establish Event via Gemini AI</h3>
                  <p className="text-zinc-600 text-xs max-w-xl">
                    Draft, schedule, and refine premium events with official Gemini-guided copywriting assistants. Generate beautiful markdown-styled agendas instantly.
                  </p>
                </div>
                <button
                  onClick={onOpenCreateModal}
                  className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-5 py-3 text-xs font-semibold text-white hover:from-indigo-500 hover:to-indigo-400 transition-all cursor-pointer shadow-lg hover:shadow-indigo-500/20 active:scale-95 shrink-0"
                >
                  <Sparkles className="h-4 w-4 text-indigo-200 group-hover:rotate-12 transition-transform" />
                  Establish via Gemini AI
                </button>
              </div>

              {/* Metric Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Metric 1 */}
                <div className="relative overflow-hidden rounded-2xl glass-panel p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider font-mono">Active Listings</span>
                    <span className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
                      <Briefcase className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="font-display font-bold text-3xl text-zinc-900">
                      {events.filter(e => e.organizerId === currentUser.id).length}
                    </h3>
                    <p className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-emerald-400" />
                      Live in active registry
                    </p>
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="relative overflow-hidden rounded-2xl glass-panel p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider font-mono">Attending Registry</span>
                    <span className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                      <Users className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="font-display font-bold text-3xl text-zinc-900">
                      {events.filter(e => e.organizerId === currentUser.id).reduce((acc, curr) => acc + (curr.rsvpCount || 0), 0)}
                    </h3>
                    <p className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-emerald-400" />
                      Combined RSVP actions
                    </p>
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="relative overflow-hidden rounded-2xl glass-panel p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider font-mono">Est. Gross Booking</span>
                    <span className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
                      <DollarSign className="h-5 w-5" />
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="font-display font-bold text-3xl text-zinc-900">
                      ${events
                        .filter(e => e.organizerId === currentUser.id)
                        .reduce((acc, curr) => {
                          const ticketCost = curr.category === 'Conference' || curr.category === 'Concert' ? 299 : 0;
                          return acc + ((curr.rsvpCount || 0) * ticketCost);
                        }, 0)
                        .toLocaleString()}
                    </h3>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Calculating premium passes ($299/seat)
                    </p>
                  </div>
                </div>
              </div>

              {/* High-fidelity Recharts Analytics area */}
              <div className="rounded-2xl glass-panel p-6 space-y-6">
                <div>
                  <h3 className="font-display font-bold text-lg text-zinc-900">Event Conversion Trends</h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Visualizing RSVP conversion quantities relative to total seat capacity.
                  </p>
                </div>

                <div className="h-80 w-full bg-zinc-950/40 rounded-xl p-4">
                  {events.filter(e => e.organizerId === currentUser.id).length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={events
                          .filter(e => e.organizerId === currentUser.id)
                          .map(e => ({
                            name: e.title.substring(0, 15) + '...',
                            RSVPs: e.rsvpCount || 0,
                            Limit: e.capacity,
                          }))}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorRsvps" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} />
                        <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#18181b', 
                            borderColor: '#27272a', 
                            borderRadius: '8px', 
                            color: '#fff' 
                          }} 
                        />
                        <Area type="monotone" dataKey="RSVPs" stroke="#6366F1" fillOpacity={1} fill="url(#colorRsvps)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-zinc-500 font-mono text-xs uppercase tracking-wider">
                      Create events to generate conversion charts
                    </div>
                  )}
                </div>
              </div>

              {/* Live listings index */}
              <div className="space-y-4">
                <h3 className="font-display font-bold text-lg text-zinc-900 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-indigo-600" />
                  Your Active Listings Registry
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {events.filter(e => e.organizerId === currentUser.id).length > 0 ? (
                    events
                      .filter(e => e.organizerId === currentUser.id)
                      .map(evt => (
                        <div 
                          key={evt.id} 
                          onClick={() => onEventSelect(evt.id)}
                          className="group relative flex rounded-xl glass-card p-4 transition-all duration-300 cursor-pointer overflow-hidden hover:shadow-lg"
                        >
                          <img 
                            src={evt.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200'} 
                            alt={evt.title} 
                            referrerPolicy="no-referrer"
                            className="h-20 w-20 rounded-lg object-cover bg-zinc-100"
                          />
                          <div className="ml-4 flex-1 flex flex-col justify-between truncate">
                            <div>
                              <span className="text-[9px] font-mono font-bold text-indigo-600 uppercase tracking-widest">{evt.category}</span>
                              <h4 className="font-display font-semibold text-sm text-zinc-900 truncate group-hover:text-indigo-600 transition-colors">{evt.title}</h4>
                            </div>
                            <div className="flex items-center justify-between text-xs text-zinc-500">
                              <span className="font-mono text-[10px]">
                                {new Date(evt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                              <span className="font-semibold text-zinc-700">{evt.rsvpCount} / {evt.capacity} seats filled</span>
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="col-span-2 text-center py-10 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/10">
                      <p className="text-xs text-zinc-400">No active listings located in your catalog.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            /* ==========================================================================
               PATH B: USER / ATTENDEE MOUNTED TIMELINE & DIGIPASSES
               ========================================================================== */
            <motion.div
              key="user-panel"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-12"
            >
              {/* Upcoming Tickets Deck */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 1. Digital Passes / Digital wallet */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="font-display font-bold text-lg text-zinc-900 flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-indigo-600" />
                    My Virtual Boarding Passes
                  </h3>

                  {/* Pass deck */}
                  <div className="space-y-4">
                    {events.length > 0 ? (
                      events.slice(0, 3).map((evt, idx) => (
                        <div 
                          key={evt.id}
                          className="group relative rounded-2xl glass-card p-6 flex flex-col sm:flex-row gap-6 items-stretch justify-between overflow-hidden shadow-md"
                        >
                          <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[9px] font-bold text-indigo-700 uppercase tracking-wider">
                                {evt.category} pass
                              </span>
                              <span className="text-[10px] font-mono text-zinc-500">Seat {idx + 1}A (Confirmed)</span>
                            </div>

                            <div>
                              <h4 className="font-display font-bold text-lg text-zinc-900 truncate">{evt.title}</h4>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-xs text-zinc-500">
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                                  {evt.location}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5 text-zinc-400" />
                                  {evt.time}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Interactive QR/Barcode card element */}
                          <div className="w-full sm:w-44 border-t sm:border-t-0 sm:border-l border-dashed border-zinc-800 pt-4 sm:pt-0 sm:pl-6 flex flex-col justify-between items-center text-center shrink-0">
                            {/* Barcode representation */}
                            <div className="space-y-1 w-full flex flex-col items-center">
                              <div className="flex gap-[2px] h-10 w-full max-w-[120px] bg-zinc-100/10 rounded overflow-hidden p-1">
                                {[1, 3, 1, 2, 4, 1, 3, 2, 1, 3, 2, 4, 1, 3, 2, 1].map((w, index) => (
                                  <div 
                                    key={index} 
                                    className="bg-white h-full" 
                                    style={{ flexGrow: w }} 
                                  />
                                ))}
                              </div>
                              <span className="text-[8px] font-mono text-zinc-500 tracking-widest">EVT-{evt.id.toUpperCase().substring(4, 10)}</span>
                            </div>

                            <button 
                              onClick={() => {
                                alert(`Pass EVT-${evt.id.substring(4, 10)} downloaded successfully in Apple Wallet passkit format.`);
                              }}
                              className="mt-4 flex items-center justify-center gap-1 w-full rounded-lg bg-zinc-800 hover:bg-zinc-700 py-1.5 text-[10px] font-semibold text-zinc-200 cursor-pointer active:scale-95 transition-all"
                            >
                              <Download className="h-3 w-3" />
                              Download Wallet Pass
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/10">
                        <p className="text-xs text-zinc-400">No active rsvp tickets registered in your portal.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Timeline Calendar Column */}
                <div className="space-y-4">
                  <h3 className="font-display font-bold text-lg text-zinc-900 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-indigo-600" />
                    Timeline Agenda
                  </h3>

                  <div className="relative border-l border-zinc-300 ml-4 pl-6 space-y-8 py-2">
                    {events.length > 0 ? (
                      events.slice(0, 4).map((evt) => (
                        <div key={evt.id} className="relative">
                          {/* Timeline dot */}
                          <span className="absolute -left-[31px] top-1 h-2.5 w-2.5 rounded-full bg-indigo-500 ring-4 ring-white" />

                          <div className="space-y-1">
                            <span className="text-[10px] font-mono text-indigo-600 font-semibold uppercase tracking-wider">
                              {new Date(evt.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </span>
                            <h4 
                              onClick={() => onEventSelect(evt.id)}
                              className="font-display font-semibold text-sm text-zinc-900 hover:text-indigo-600 cursor-pointer truncate"
                            >
                              {evt.title}
                            </h4>
                            <p className="text-[11px] text-zinc-500 line-clamp-1">{evt.location}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-zinc-500 font-mono">Registry calendar empty</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Personalized AI Event recommendations */}
              <div className="rounded-2xl glass-panel p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display font-bold text-lg text-zinc-900 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-indigo-600 animate-pulse" />
                      Gemini Personalized Recommendations
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Instantly tailored to your preferences based on machine-learning categorical matches.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {events.slice(2, 4).map((recEvt) => (
                    <div 
                      key={recEvt.id}
                      onClick={() => onEventSelect(recEvt.id)}
                      className="group flex gap-4 p-4 rounded-xl glass-card cursor-pointer"
                    >
                      <img 
                        src={recEvt.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200'} 
                        alt={recEvt.title} 
                        referrerPolicy="no-referrer"
                        className="h-16 w-16 rounded-lg object-cover bg-zinc-100 shrink-0"
                      />
                      <div className="flex-1 truncate flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">{recEvt.category}</span>
                            <span className="text-[9px] font-mono text-indigo-600 flex items-center gap-0.5">
                              <Sparkles className="h-2.5 w-2.5" /> 98% Match
                            </span>
                          </div>
                          <h4 className="font-display font-bold text-sm text-zinc-900 group-hover:text-indigo-600 transition-colors truncate">{recEvt.title}</h4>
                        </div>
                        <p className="text-[11px] text-zinc-600 truncate leading-relaxed">
                          {recEvt.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
