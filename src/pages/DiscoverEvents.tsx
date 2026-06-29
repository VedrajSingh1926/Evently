/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  CalendarDays, 
  ChevronDown, 
  SlidersHorizontal, 
  Users, 
  MapPin, 
  DollarSign, 
  Layers, 
  ArrowUpRight,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { api } from '../api';
import { Event, EventCategory } from '../types';

interface DiscoverEventsProps {
  onEventSelect: (id: string) => void;
  onOpenCreateModal: () => void;
}

const CATEGORIES: EventCategory[] = ['Conference', 'Workshop', 'Meetup', 'Social', 'Concert', 'Exhibition', 'Webinar'];

export default function DiscoverEvents({ onEventSelect, onOpenCreateModal }: DiscoverEventsProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedBudget, setSelectedBudget] = useState<string>('All'); // 'All' | 'Free' | 'Premium'
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('All'); // 'All' | 'Upcoming' | 'This Month'

  // Dropdown States for Micro-Filters
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showBudgetDropdown, setShowBudgetDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getEvents();
      if (res.success && res.data) {
        setEvents(res.data);
      } else {
        setError(res.error || 'Failed to retrieve curated experiences.');
      }
    } catch (err: any) {
      setError(err.message || 'Network interface offline.');
    } finally {
      // Simulate high-end $50k site skeleton transition time
      setTimeout(() => {
        setLoading(false);
      }, 600);
    }
  };

  // Filter Logic
  const filteredEvents = events.filter((evt) => {
    // 1. Search Query
    const query = searchQuery.toLowerCase().trim();
    if (query !== '') {
      const matchTitle = evt.title.toLowerCase().includes(query);
      const matchDesc = evt.description.toLowerCase().includes(query);
      const matchLoc = evt.location.toLowerCase().includes(query);
      if (!matchTitle && !matchDesc && !matchLoc) return false;
    }

    // 2. Category / Industry filter
    if (selectedCategory !== 'All' && evt.category !== selectedCategory) {
      return false;
    }

    // 3. Budget Filter
    // In our simplified mock DB, conferences & concerts are treated as Premium ($250+ value), others are Standard/Free
    if (selectedBudget === 'Free') {
      const isFree = evt.category === 'Workshop' || evt.category === 'Meetup' || evt.category === 'Webinar' || evt.category === 'Social';
      if (!isFree) return false;
    } else if (selectedBudget === 'Premium') {
      const isPremium = evt.category === 'Conference' || evt.category === 'Concert' || evt.category === 'Exhibition';
      if (!isPremium) return false;
    }

    // 4. Date Filter
    if (selectedDateFilter === 'This Month') {
      const evtMonth = new Date(evt.date).getMonth();
      const currentMonth = new Date().getMonth();
      if (evtMonth !== currentMonth) return false;
    }

    return true;
  });

  return (
    <div className="space-y-12">
      {/* Premium Hero Intro */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-100 pb-8">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-mono text-[10px] uppercase tracking-widest font-bold mb-2">
            <span className="h-1 w-1 bg-indigo-600 rounded-full animate-ping" />
            Curated Corporate Assembly
          </div>
          <h1 className="font-display font-medium text-4xl text-zinc-950 tracking-tight leading-tight">
            Discover <span className="font-light italic text-zinc-700">Exceptional</span> Events
          </h1>
          <p className="text-sm text-zinc-500 max-w-xl mt-2 leading-relaxed">
            Register for elite corporate summits, hands-on workshops, and invite-only networking mixers designed to elevate your organizational trajectory.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={loadEvents}
            className="group flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-800 hover:border-zinc-300 hover:bg-zinc-50 transition-all cursor-pointer shadow-sm"
          >
            <RefreshCw className="h-3.5 w-3.5 text-zinc-500 group-hover:rotate-180 transition-transform duration-500" />
            Sync Database
          </button>

          <button
            onClick={onOpenCreateModal}
            className="group flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 transition-all cursor-pointer shadow-md"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            Establish Event
          </button>
        </div>
      </div>

      {/* Elegant $50k Corporate Search & Micro-Filters Hub */}
      <div className="glass-panel rounded-2xl p-6 space-y-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Main Search Bar with absolute elegant alignment */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-zinc-400">
              <Search className="h-4 w-4 text-zinc-500" />
            </span>
            <input
              type="text"
              placeholder="Search by elite summit titles, keynotes, or cities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3.5 pl-11 pr-4 text-sm text-zinc-900 placeholder-zinc-400 outline-none hover:border-zinc-300 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all"
            />
          </div>

          {/* Micro-Filter Container with Subtle Borders and Premium Padding */}
          <div className="grid grid-cols-3 gap-2 lg:w-96">
            {/* Category Filter */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowCategoryDropdown(!showCategoryDropdown);
                  setShowBudgetDropdown(false);
                  setShowDateDropdown(false);
                }}
                className="flex w-full items-center justify-between rounded-xl border border-zinc-200 px-4 py-3.5 text-xs font-semibold text-zinc-700 bg-white hover:bg-zinc-50 transition-all cursor-pointer truncate"
              >
                <span className="truncate flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                  {selectedCategory === 'All' ? 'Type' : selectedCategory}
                </span>
                <ChevronDown className="h-3 w-3 shrink-0 text-zinc-400 ml-1" />
              </button>

              <AnimatePresence>
                {showCategoryDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowCategoryDropdown(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute right-0 top-full mt-2 z-20 w-48 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl"
                    >
                      <button
                        onClick={() => { setSelectedCategory('All'); setShowCategoryDropdown(false); }}
                        className="w-full text-left rounded-lg px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                      >
                        All Categories
                      </button>
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => { setSelectedCategory(cat); setShowCategoryDropdown(false); }}
                          className="w-full text-left rounded-lg px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                        >
                          {cat}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Budget Filter */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowBudgetDropdown(!showBudgetDropdown);
                  setShowCategoryDropdown(false);
                  setShowDateDropdown(false);
                }}
                className="flex w-full items-center justify-between rounded-xl border border-zinc-200 px-4 py-3.5 text-xs font-semibold text-zinc-700 bg-white hover:bg-zinc-50 transition-all cursor-pointer truncate"
              >
                <span className="truncate flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                  {selectedBudget === 'All' ? 'Budget' : selectedBudget}
                </span>
                <ChevronDown className="h-3 w-3 shrink-0 text-zinc-400 ml-1" />
              </button>

              <AnimatePresence>
                {showBudgetDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowBudgetDropdown(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute right-0 top-full mt-2 z-20 w-40 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl"
                    >
                      {['All', 'Free', 'Premium'].map((b) => (
                        <button
                          key={b}
                          onClick={() => { setSelectedBudget(b); setShowBudgetDropdown(false); }}
                          className="w-full text-left rounded-lg px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                        >
                          {b === 'All' ? 'All Budgets' : b}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Date Filter */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowDateDropdown(!showDateDropdown);
                  setShowCategoryDropdown(false);
                  setShowBudgetDropdown(false);
                }}
                className="flex w-full items-center justify-between rounded-xl border border-zinc-200 px-4 py-3.5 text-xs font-semibold text-zinc-700 bg-white hover:bg-zinc-50 transition-all cursor-pointer truncate"
              >
                <span className="truncate flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                  {selectedDateFilter === 'All' ? 'Date' : selectedDateFilter}
                </span>
                <ChevronDown className="h-3 w-3 shrink-0 text-zinc-400 ml-1" />
              </button>

              <AnimatePresence>
                {showDateDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowDateDropdown(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute right-0 top-full mt-2 z-20 w-44 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl"
                    >
                      {['All', 'This Month'].map((df) => (
                        <button
                          key={df}
                          onClick={() => { setSelectedDateFilter(df); setShowDateDropdown(false); }}
                          className="w-full text-left rounded-lg px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                        >
                          {df === 'All' ? 'All Dates' : df}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Active Applied Filters indicator */}
        {(selectedCategory !== 'All' || selectedBudget !== 'All' || selectedDateFilter !== 'All' || searchQuery !== '') && (
          <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-zinc-100">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mr-1">Applied Filters:</span>
            {selectedCategory !== 'All' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700">
                Category: {selectedCategory}
                <button onClick={() => setSelectedCategory('All')} className="hover:text-red-500 font-bold ml-1">×</button>
              </span>
            )}
            {selectedBudget !== 'All' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                Budget: {selectedBudget}
                <button onClick={() => setSelectedBudget('All')} className="hover:text-red-500 font-bold ml-1">×</button>
              </span>
            )}
            {selectedDateFilter !== 'All' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 border border-teal-100 px-2.5 py-0.5 text-[11px] font-semibold text-teal-700">
                Date: {selectedDateFilter}
                <button onClick={() => setSelectedDateFilter('All')} className="hover:text-red-500 font-bold ml-1">×</button>
              </span>
            )}
            {searchQuery !== '' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 border border-zinc-200 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-700">
                Query: "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="hover:text-red-500 font-bold ml-1">×</button>
              </span>
            )}
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedBudget('All');
                setSelectedDateFilter('All');
                setSearchQuery('');
              }}
              className="text-[11px] text-zinc-500 hover:text-zinc-950 font-bold underline underline-offset-2 ml-auto cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Active Grid Layout with Dynamic Event Cards */}
      {loading ? (
        /* Dynamic High-End $50k Skeleton Loader Screen */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="flex flex-col rounded-2xl border border-zinc-200 bg-white overflow-hidden p-0 h-[430px] space-y-4 shadow-sm animate-pulse">
              <div className="w-full h-48 bg-zinc-100 relative" />
              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="h-3 w-1/4 bg-zinc-100 rounded" />
                  <div className="h-5 w-3/4 bg-zinc-200 rounded" />
                  <div className="h-3 w-full bg-zinc-100 rounded" />
                  <div className="h-3 w-5/6 bg-zinc-100 rounded" />
                </div>
                <div className="h-8 w-full bg-zinc-50 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50/50 p-8 text-center max-w-lg mx-auto">
          <p className="text-sm font-semibold text-red-800">Connection Failed</p>
          <p className="text-xs text-red-500 mt-1">{error}</p>
          <button
            onClick={loadEvents}
            className="mt-4 px-4 py-2 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-sm"
          >
            Reconnect
          </button>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-12 text-center max-w-md mx-auto">
          <CalendarDays className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
          <h5 className="font-display font-semibold text-base text-zinc-800">No premium events match</h5>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            There are no curated events currently registered matching the criteria. Try clearing some filters.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('All');
              setSelectedBudget('All');
              setSelectedDateFilter('All');
              setSearchQuery('');
            }}
            className="mt-5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-sm"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        /* Premium Live Event Grid with Entrance Animation */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {filteredEvents.map((evt) => {
            const spotsLeft = evt.capacity - evt.rsvpCount;
            const isFull = spotsLeft <= 0;
            const isLowSpots = spotsLeft > 0 && spotsLeft <= 3;
            const isPremiumType = evt.category === 'Conference' || evt.category === 'Concert' || evt.category === 'Exhibition';

            return (
              <motion.div
                key={evt.id}
                whileHover={{ y: -6 }}
                className="group flex flex-col h-[440px] rounded-2xl glass-card overflow-hidden cursor-pointer"
                onClick={() => onEventSelect(evt.id)}
              >
                {/* 1. HIGH-RESOLUTION IMAGE ASPECT-RATIO WRAPPER */}
                <div className="relative h-48 w-full overflow-hidden bg-zinc-50 shrink-0">
                  <img
                    src={evt.imageUrl || `https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200`}
                    alt={evt.title}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Subtle Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/40 via-transparent to-transparent opacity-60" />

                  {/* 2. TINY BADGE INDICATOR FOR CATEGORY */}
                  <div className="absolute left-4 top-4">
                    <span className="inline-flex items-center rounded-md bg-white/95 backdrop-blur-md px-2.5 py-1 text-[9px] font-bold text-zinc-900 shadow-sm uppercase tracking-wider border border-zinc-200/50">
                      {evt.category}
                    </span>
                  </div>

                  {/* Premium Badge Overlay */}
                  {isPremiumType && (
                    <div className="absolute right-4 top-4">
                      <span className="inline-flex items-center rounded-md bg-zinc-900/90 text-white backdrop-blur-md px-2 py-1 text-[9px] font-semibold tracking-wider uppercase">
                        ★ Premium Pass
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Core Content */}
                <div className="flex flex-1 flex-col p-6 justify-between">
                  <div>
                    {/* 3. CUSTOM DATE PLACEMENT AND BADGES */}
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 font-mono uppercase tracking-widest">
                        <CalendarDays className="h-3.5 w-3.5 text-indigo-600" />
                        {new Date(evt.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>

                      <span className="text-[11px] font-mono text-zinc-400">
                        {evt.time}
                      </span>
                    </div>

                    {/* 4. BOLD BLACK TITLE */}
                    <h3 className="font-display font-semibold text-lg text-zinc-900 leading-snug line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {evt.title}
                    </h3>

                    {/* Description Paragraph */}
                    <p className="mt-2 text-xs text-zinc-400 line-clamp-2 leading-relaxed text-justify">
                      {evt.description}
                    </p>
                  </div>

                  {/* Card Footer detail */}
                  <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-zinc-500 max-w-[60%] truncate">
                      <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate font-medium">{evt.location}</span>
                    </div>

                    {/* 5. DYNAMIC CAPACITY COUNTDOWN */}
                    <div className="text-right shrink-0">
                      {isFull ? (
                        <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700 border border-red-100">
                          At Capacity
                        </span>
                      ) : isLowSpots ? (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 border border-amber-100 animate-pulse">
                          Only {spotsLeft} {spotsLeft === 1 ? 'seat' : 'seats'} remaining
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-zinc-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-600 border border-zinc-100">
                          {spotsLeft} spots open
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
