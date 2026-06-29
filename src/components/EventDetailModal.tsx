/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Calendar, MapPin, Users, Send, Trash2, Edit3, Loader2, MessageSquare, 
  CheckCircle2, HelpCircle, XCircle, Info, Bookmark, RefreshCw 
} from 'lucide-react';
import { api } from '../api';
import { User, Event, RSVP, Comment, RSVPStatus } from '../types';

interface EventDetailModalProps {
  eventId: string | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onTriggerAuth: () => void;
  onEventModified: () => void;
}

export default function EventDetailModal({
  eventId,
  isOpen,
  onClose,
  currentUser,
  onTriggerAuth,
  onEventModified,
}: EventDetailModalProps) {
  const [event, setEvent] = useState<(Event & { rsvps: RSVP[]; comments: Comment[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingRsvp, setSubmittingRsvp] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Edit fields
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editCapacity, setEditCapacity] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [updatingEvent, setUpdatingEvent] = useState(false);

  const fetchEventDetails = async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getEventDetails(eventId);
      if (res.success && res.data) {
        setEvent(res.data);
        // Initialize edit states
        setEditTitle(res.data.title);
        setEditDesc(res.data.description);
        setEditLocation(res.data.location);
        setEditCapacity(res.data.capacity.toString());
        setEditDate(res.data.date);
        setEditTime(res.data.time);
      } else {
        setError(res.error || 'Failed to retrieve event details');
      }
    } catch (err: any) {
      setError('Connection failure.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && eventId) {
      fetchEventDetails();
      setIsEditing(false);
    }
  }, [isOpen, eventId]);

  const handleRsvpSubmit = async (status: RSVPStatus) => {
    if (!currentUser) {
      onTriggerAuth();
      return;
    }
    if (!event) return;

    setSubmittingRsvp(true);
    setError(null);
    try {
      const res = await api.rsvp(event.id, status);
      if (res.success) {
        await fetchEventDetails();
        onEventModified();
      } else {
        setError(res.error || 'RSVP registration failed');
      }
    } catch (err: any) {
      setError('Failed to update RSVP.');
    } finally {
      setSubmittingRsvp(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onTriggerAuth();
      return;
    }
    if (!commentText.trim() || !event) return;

    setSubmittingComment(true);
    try {
      const res = await api.addComment(event.id, commentText);
      if (res.success) {
        setCommentText('');
        await fetchEventDetails();
        onEventModified();
      } else {
        setError(res.error || 'Failed to submit comment');
      }
    } catch (err) {
      setError('Connection error.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCommentDelete = async (commentId: string) => {
    if (!event) return;
    try {
      const res = await api.deleteComment(event.id, commentId);
      if (res.success) {
        await fetchEventDetails();
        onEventModified();
      } else {
        setError(res.error || 'Could not delete comment');
      }
    } catch (err) {
      setError('Connection error.');
    }
  };

  const handleEventUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;

    setUpdatingEvent(true);
    try {
      const res = await api.updateEvent(event.id, {
        title: editTitle,
        description: editDesc,
        location: editLocation,
        capacity: parseInt(editCapacity, 10),
        date: editDate,
        time: editTime,
      });

      if (res.success) {
        setIsEditing(false);
        await fetchEventDetails();
        onEventModified();
      } else {
        setError(res.error || 'Failed to update event details');
      }
    } catch (err) {
      setError('Failed to modify specifications.');
    } finally {
      setUpdatingEvent(false);
    }
  };

  const handleEventDelete = async () => {
    if (!event) return;
    if (!confirm('Are you absolutely certain you wish to remove this event? This action cannot be undone.')) return;

    try {
      const res = await api.deleteEvent(event.id);
      if (res.success) {
        onEventModified();
        onClose();
      } else {
        setError(res.error || 'Could not delete event');
      }
    } catch (err) {
      setError('Failed to request deletion.');
    }
  };

  // Check current user RSVP status
  const userRsvp = event?.rsvps.find(r => r.userId === currentUser?.id);
  const goingRsvps = event?.rsvps.filter(r => r.status === 'going') || [];
  const maybeRsvps = event?.rsvps.filter(r => r.status === 'maybe') || [];

  const isOrganizer = currentUser && event && (event.organizerId === currentUser.id || currentUser.role === 'admin');

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
            className="relative w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-2xl z-10 flex flex-col"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-5 top-5 rounded-full p-2 text-zinc-400 bg-white/80 backdrop-blur-sm hover:bg-white hover:text-zinc-600 transition-all shadow z-20 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 px-8 h-96">
                <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
                <span className="text-zinc-400 text-xs font-mono mt-4">RECONSTRUCTING DETAILS...</span>
              </div>
            ) : error && !event ? (
              <div className="p-8 text-center">
                <div className="rounded-xl bg-red-50 p-4 border border-red-100 max-w-md mx-auto text-sm text-red-600">
                  <p className="font-semibold">Error Loading Specifications</p>
                  <p className="text-xs mt-1 text-red-500">{error}</p>
                </div>
                <button
                  onClick={fetchEventDetails}
                  className="mt-4 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="h-3 w-3" /> Retry
                </button>
              </div>
            ) : !event ? null : (
              <div className="flex-1 overflow-y-auto flex flex-col md:flex-row h-full">
                
                {/* Left Side: Images and Event specs */}
                <div className="w-full md:w-[55%] border-r border-zinc-100 flex flex-col">
                  {/* Event Cover Image */}
                  <div className="relative h-48 md:h-56 w-full overflow-hidden">
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-zinc-950/20 to-transparent" />
                    
                    <div className="absolute bottom-4 left-6 right-6 text-white">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md border border-white/20">
                        {event.category}
                      </span>
                      <h4 className="font-display font-bold text-xl md:text-2xl mt-2 tracking-tight drop-shadow-sm truncate">
                        {event.title}
                      </h4>
                    </div>
                  </div>

                  {/* Details Body */}
                  <div className="p-6 md:p-8 space-y-6 flex-1">
                    {/* Error Banner */}
                    {error && (
                      <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-100">
                        {error}
                      </div>
                    )}

                    {!isEditing ? (
                      <>
                        {/* Event specifications */}
                        <p className="text-zinc-600 text-sm leading-relaxed text-justify">
                          {event.description}
                        </p>

                        {/* Location, Date, Time, Capacity list */}
                        <div className="grid grid-cols-2 gap-4 border-t border-b border-zinc-100 py-5">
                          <div className="flex items-start gap-3">
                            <Calendar className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Date</span>
                              <span className="text-xs font-semibold text-zinc-800">
                                {new Date(event.date).toLocaleDateString('en-US', {
                                  month: 'long',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <MapPin className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Location</span>
                              <span className="text-xs font-semibold text-zinc-800 truncate block max-w-[150px]">
                                {event.location}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <Users className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Remaining capacity</span>
                              <span className="text-xs font-semibold text-zinc-800">
                                {goingRsvps.length} / {event.capacity} Going
                              </span>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <Bookmark className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Organizer</span>
                              <span className="text-xs font-semibold text-zinc-800 truncate block max-w-[150px]">
                                {event.organizerName}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Admin / Organizer controls */}
                        {isOrganizer && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => setIsEditing(true)}
                              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                            >
                              <Edit3 className="h-3.5 w-3.5" /> Edit Specifications
                            </button>
                            <button
                              onClick={handleEventDelete}
                              className="flex items-center justify-center px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      /* EDIT EVENT FORM */
                      <form onSubmit={handleEventUpdate} className="space-y-4">
                        <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                          <h5 className="font-display font-semibold text-sm text-zinc-800">Edit Event Specifications</h5>
                          <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="text-xs text-zinc-400 hover:text-zinc-600 underline"
                          >
                            Cancel
                          </button>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Title</label>
                          <input
                            type="text"
                            required
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full rounded-lg border border-zinc-200 py-2 px-3 text-xs text-zinc-800 outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Description</label>
                          <textarea
                            required
                            rows={3}
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            className="w-full rounded-lg border border-zinc-200 py-2 px-3 text-xs text-zinc-800 outline-none focus:border-indigo-500 resize-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Date</label>
                            <input
                              type="date"
                              required
                              value={editDate}
                              onChange={(e) => setEditDate(e.target.value)}
                              className="w-full rounded-lg border border-zinc-200 py-1.5 px-3 text-xs text-zinc-800 outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Time</label>
                            <input
                              type="time"
                              required
                              value={editTime}
                              onChange={(e) => setEditTime(e.target.value)}
                              className="w-full rounded-lg border border-zinc-200 py-1.5 px-3 text-xs text-zinc-800 outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Location</label>
                            <input
                              type="text"
                              required
                              value={editLocation}
                              onChange={(e) => setEditLocation(e.target.value)}
                              className="w-full rounded-lg border border-zinc-200 py-1.5 px-3 text-xs text-zinc-800 outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Capacity</label>
                            <input
                              type="number"
                              required
                              min="1"
                              value={editCapacity}
                              onChange={(e) => setEditCapacity(e.target.value)}
                              className="w-full rounded-lg border border-zinc-200 py-1.5 px-3 text-xs text-zinc-800 outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={updatingEvent}
                          className="w-full flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 py-2 font-semibold text-xs text-white disabled:opacity-75 cursor-pointer"
                        >
                          {updatingEvent ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : null}
                          Save Changes
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                {/* Right Side: RSVPs & Comments */}
                <div className="w-full md:w-[45%] flex flex-col bg-gradient-to-br from-indigo-50/30 to-white">
                  {/* RSVP Segment */}
                  <div className="p-6 md:p-8 border-b border-zinc-100 bg-transparent">
                    <h5 className="font-display font-semibold text-sm text-zinc-800 mb-3 flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-zinc-400" /> Are you attending?
                    </h5>

                    {/* RSVP Buttons */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleRsvpSubmit('going')}
                        disabled={submittingRsvp}
                        className={`flex flex-col items-center justify-center rounded-xl py-2.5 px-1 border transition-all duration-300 hover:-translate-y-1 active:scale-95 cursor-pointer shadow-sm hover:shadow-md ${
                          userRsvp?.status === 'going'
                            ? 'bg-emerald-500 border-emerald-600 text-white ring-2 ring-emerald-200 shadow-emerald-500/20'
                            : 'bg-white border-zinc-200 text-zinc-600 hover:border-emerald-200 hover:bg-emerald-50'
                        }`}
                      >
                        <CheckCircle2 className={`h-4 w-4 mb-1 ${userRsvp?.status === 'going' ? 'text-emerald-600' : 'text-zinc-400'}`} />
                        <span className="text-[10px] font-bold">Going</span>
                      </button>

                      <button
                        onClick={() => handleRsvpSubmit('maybe')}
                        disabled={submittingRsvp}
                        className={`flex flex-col items-center justify-center rounded-xl py-2.5 px-1 border transition-all duration-300 hover:-translate-y-1 active:scale-95 cursor-pointer shadow-sm hover:shadow-md ${
                          userRsvp?.status === 'maybe'
                            ? 'bg-amber-500 border-amber-600 text-white ring-2 ring-amber-200 shadow-amber-500/20'
                            : 'bg-white border-zinc-200 text-zinc-600 hover:border-amber-200 hover:bg-amber-50'
                        }`}
                      >
                        <HelpCircle className={`h-4 w-4 mb-1 ${userRsvp?.status === 'maybe' ? 'text-white' : 'text-zinc-400'}`} />
                        <span className="text-[10px] font-bold">Maybe</span>
                      </button>

                      <button
                        onClick={() => handleRsvpSubmit('not_going')}
                        disabled={submittingRsvp}
                        className={`flex flex-col items-center justify-center rounded-xl py-2.5 px-1 border transition-all duration-300 hover:-translate-y-1 active:scale-95 cursor-pointer shadow-sm hover:shadow-md ${
                          userRsvp?.status === 'not_going'
                            ? 'bg-zinc-700 border-zinc-800 text-white shadow-zinc-700/20'
                            : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-100'
                        }`}
                      >
                        <XCircle className={`h-4 w-4 mb-1 ${userRsvp?.status === 'not_going' ? 'text-zinc-300' : 'text-zinc-400'}`} />
                        <span className="text-[10px] font-bold">Decline</span>
                      </button>
                    </div>

                    {/* Guest list feedback */}
                    <div className="mt-4">
                      {goingRsvps.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-1.5 overflow-hidden">
                            {goingRsvps.slice(0, 4).map((r, i) => (
                              <div
                                key={r.id}
                                className="inline-block h-6 w-6 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-indigo-700"
                              >
                                {r.userName[0].toUpperCase()}
                              </div>
                            ))}
                          </div>
                          <span className="text-[11px] text-zinc-400 font-medium">
                            {goingRsvps.length} {goingRsvps.length === 1 ? 'guest' : 'guests'} going
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-medium">
                          <Info className="h-3.5 w-3.5 text-zinc-300" />
                          Be the first to RSVP for this event
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Comments Feed Segment */}
                  <div className="flex-1 p-6 md:p-8 flex flex-col min-h-[250px]">
                    <h5 className="font-display font-semibold text-sm text-zinc-800 mb-4 flex items-center gap-1.5 shrink-0">
                      <MessageSquare className="h-4 w-4 text-zinc-400" /> Comments & Chat ({event.comments.length})
                    </h5>

                    {/* Comments List */}
                    <div className="flex-1 overflow-y-auto space-y-3.5 max-h-[180px] scrollbar-thin pr-1 mb-4">
                      {event.comments.length > 0 ? (
                        event.comments.map((comment) => (
                          <div key={comment.id} className="text-xs group">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-zinc-800">{comment.userName}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-zinc-400">
                                  {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {(currentUser && (comment.userId === currentUser.id || currentUser.role === 'admin')) ? (
                                  <button
                                    onClick={() => handleCommentDelete(comment.id)}
                                    className="text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                ) : null}
                              </div>
                            </div>
                            <p className="text-zinc-600 mt-1 bg-white p-2 rounded-lg border border-zinc-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)] break-words">
                              {comment.content}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center text-zinc-400">
                          <MessageSquare className="h-6 w-6 text-zinc-300 mb-2" />
                          <span className="text-[11px] font-medium">No comments posted yet.</span>
                        </div>
                      )}
                    </div>

                    {/* Comment Form */}
                    <form onSubmit={handleCommentSubmit} className="mt-auto shrink-0 relative">
                      <input
                        type="text"
                        placeholder={currentUser ? 'Write a comment...' : 'Sign in to leave a comment...'}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        disabled={submittingComment}
                        className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-4 pr-11 text-xs text-zinc-800 placeholder-zinc-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 transition-all"
                      />
                      <button
                        type="submit"
                        disabled={submittingComment || !commentText.trim()}
                        className="absolute right-1.5 top-1.5 p-1.5 rounded-lg bg-indigo-600 text-white disabled:opacity-40 hover:bg-indigo-700 transition-colors cursor-pointer"
                      >
                        {submittingComment ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </form>
                  </div>
                </div>

              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
