/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, SlidersHorizontal, CalendarDays, Ticket, Users, Sparkles, HelpCircle, 
  ArrowRight, Info, AlertCircle, CheckCircle2, Loader2 
} from 'lucide-react';
import Navbar from './components/Navbar';
import EventCard from './components/EventCard';
import AuthModal from './components/AuthModal';
import CreateEventModal from './components/CreateEventModal';
import EventDetailModal from './components/EventDetailModal';
import DiscoverEvents from './pages/DiscoverEvents';
import AmbientLayout from './components/AmbientLayout';
import Dashboard from './pages/Dashboard';
import { api } from './api';
import { User, Event } from './types';

const CATEGORIES = ['All', 'Conference', 'Workshop', 'Meetup', 'Social', 'Concert', 'Exhibition', 'Webinar'];

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'discover' | 'dashboard'>('discover');
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  
  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Filter & Search states
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // App state indicators
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Validate session on mount
  useEffect(() => {
    const checkSession = async () => {
      const storedToken = localStorage.getItem('evently_token');
      const storedUser = localStorage.getItem('evently_user');
      
      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setCurrentUser(parsedUser);
          setActiveTab('dashboard'); // Default authenticated users straight to their premium controls
          // Perform verification call with API
          const response = await api.getMe();
          if (response.success && response.data) {
            setCurrentUser(response.data);
          } else {
            // Token expired
            api.logout();
            setCurrentUser(null);
            setActiveTab('discover');
            triggerFeedback('error', 'Your session has expired. Please sign in again.');
          }
        } catch (err) {
          // Keep local profile if temporary connection issue
          console.warn('Session verification deferred due to connection.');
        }
      }
    };
    
    checkSession();
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch events based on current active category and search
  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getEvents(
        selectedCategory !== 'All' ? selectedCategory : undefined,
        debouncedSearch.trim() !== '' ? debouncedSearch : undefined
      );
      if (res.success && res.data) {
        setEvents(res.data);
      } else {
        setError(res.error || 'Could not fetch list of events.');
      }
    } catch (err) {
      setError('Connection failed. Verify your server is online.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedCategory, debouncedSearch]);

  const triggerFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4500);
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setActiveTab('dashboard'); // Switch straight to their personal portal upon successful authentication
    triggerFeedback('success', `Welcome to Evently, ${user.name}!`);
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setActiveTab('discover'); // Revert back to discovery feed
    triggerFeedback('success', 'Logged out of Evently successfully.');
  };

  const handlePublishClick = () => {
    if (!currentUser) {
      setIsAuthOpen(true);
    } else {
      setIsCreateOpen(true);
    }
  };

  const handleEventCreated = (newEvent: Event) => {
    triggerFeedback('success', `"${newEvent.title}" published successfully!`);
    fetchEvents();
  };

  const handleEventSelected = (id: string) => {
    setSelectedEventId(id);
    setIsDetailOpen(true);
  };

  return (
    <AmbientLayout>
      {/* Sticky Premium Navbar */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onLoginClick={() => setIsAuthOpen(true)}
        onPublishClick={handlePublishClick}
        onLogout={handleLogout}
      />

      {/* Floating System Notifications */}
      <AnimatePresence>
        {feedbackMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-6 z-50 max-w-sm rounded-xl border p-4 glass-panel text-zinc-900 shadow-2xl flex items-start gap-3 border-zinc-200"
          >
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-xs font-semibold text-zinc-900">
                {feedbackMessage.type === 'success' ? 'System Notification' : 'Attention required'}
              </p>
              <p className="text-xs text-zinc-600 mt-1 leading-normal">{feedbackMessage.text}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {activeTab === 'discover' ? (
          <motion.div
            key="discover-page"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex-1 flex flex-col"
          >
            {/* Hero Header Section */}
            <section className="relative px-6 sm:px-8 py-20 md:py-32 bg-transparent overflow-hidden shrink-0">
              <div className="mx-auto max-w-4xl text-center relative z-10 space-y-6">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 tracking-wide">
                    <Sparkles className="h-3 w-3 text-indigo-600" /> Curate. Engage. Elevate.
                  </span>
                </div>

                <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-zinc-900 leading-[1.05]">
                  Where premium experiences <br />
                  <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 bg-clip-text text-transparent italic font-light">
                    unfold seamlessly.
                  </span>
                </h1>

                <p className="mx-auto mt-6 max-w-xl text-sm sm:text-base text-zinc-600 leading-relaxed font-sans">
                  Join Evently to publish executive masterclasses, RSVP to invite-only technical summits, and network with elite industry leaders. Fully automated with secure dual-role profiles.
                </p>
              </div>
            </section>

            {/* Main Content Area */}
            <main className="flex-1 mx-auto w-full max-w-7xl px-6 sm:px-8 py-8 md:py-12">
              <DiscoverEvents onEventSelect={handleEventSelected} onOpenCreateModal={handlePublishClick} />
            </main>
          </motion.div>
        ) : (
          <motion.div
            key="dashboard-page"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex-1 mx-auto w-full max-w-7xl px-6 sm:px-8 py-10 md:py-16"
          >
            <Dashboard 
              currentUser={currentUser} 
              onOpenCreateModal={handlePublishClick} 
              onEventSelect={handleEventSelected} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Elegant minimalist Footer */}
      <footer className="border-t border-zinc-200 bg-white/50 backdrop-blur-md py-12 shrink-0">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-lg tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Evently
            </span>
            <span className="text-zinc-400">|</span>
            <span className="text-[10px] text-zinc-500 font-medium tracking-wide uppercase">Curating executive experiences since 2026</span>
          </div>
          <div className="text-[10px] text-zinc-500 font-medium tracking-wider uppercase">
            &copy; {new Date().getFullYear()} Evently Inc. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Shared Interdependent Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      <CreateEventModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleEventCreated}
      />

      <EventDetailModal
        eventId={selectedEventId}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedEventId(null);
        }}
        currentUser={currentUser}
        onTriggerAuth={() => {
          setIsDetailOpen(false);
          setIsAuthOpen(true);
        }}
        onEventModified={fetchEvents}
      />
    </AmbientLayout>
  );
}
