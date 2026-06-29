/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, SlidersHorizontal, CalendarDays, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import EventCard from '../components/EventCard';
import { api } from '../api';
import { Event } from '../types';

interface EventExplorerProps {
  onEventSelect: (id: string) => void;
}

const CATEGORIES = ['All', 'Conference', 'Workshop', 'Meetup', 'Social', 'Concert', 'Exhibition', 'Webinar'];

export default function EventExplorer({ onEventSelect }: EventExplorerProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce search input for high-end performance
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Mimic real-time fetching from API endpoint
  const loadEvents = async () => {
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
        setError(res.error || 'Could not retrieve list of curated events.');
      }
    } catch (err) {
      setError('Connection failed. Verify server is online.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [selectedCategory, debouncedSearch]);

  return (
    <div className="space-y-8">
      {/* Search and Filters Hub */}
      <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-[0_2px_12px_rgba(0,0,0,0.015)] space-y-5">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Custom Minimalist Search */}
          <div className="relative w-full md:max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search summit, workshop, meetup, or cities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2.5 pl-10 pr-4 text-sm text-zinc-800 placeholder-zinc-400 outline-none hover:bg-zinc-50 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>

          {/* Quick Stats Banner */}
          <div className="flex items-center gap-6 text-zinc-400 text-xs font-semibold uppercase tracking-wider shrink-0">
            <span className="flex items-center gap-1.5 text-zinc-500">
              <CalendarDays className="h-4 w-4 text-indigo-600" />
              {events.length} Live Connections
            </span>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="border-t border-zinc-100 pt-5">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mr-2 shrink-0 flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Curate:
            </span>
            <div className="flex gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold tracking-tight cursor-pointer transition-all ${
                    selectedCategory === cat
                      ? 'bg-zinc-900 text-white shadow-sm'
                      : 'bg-zinc-100 hover:bg-zinc-200/70 text-zinc-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid Display Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          <span className="text-zinc-400 text-[10px] font-mono mt-4 tracking-wider uppercase">Loading database...</span>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50/50 p-8 text-center max-w-lg mx-auto">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
          <p className="text-sm font-semibold text-red-800">Connection Interrupted</p>
          <p className="text-xs text-red-500 mt-1">{error}</p>
          <button
            onClick={loadEvents}
            className="mt-4 px-4 py-2 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-sm"
          >
            Retry Connection
          </button>
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-12 text-center max-w-md mx-auto">
          <CalendarDays className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
          <h5 className="font-display font-semibold text-base text-zinc-800">No events located</h5>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            We couldn't locate any premium events matching your filter. Clear your search or choose a different category.
          </p>
          {(searchQuery !== '' || selectedCategory !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="mt-5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-sm"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        /* Event Grid with smooth entrance animation */
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onSelect={() => onEventSelect(event.id)}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}
