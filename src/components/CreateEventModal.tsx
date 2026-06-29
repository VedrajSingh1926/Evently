/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, MapPin, Users, Image as ImageIcon, Loader2, Tag, Clock } from 'lucide-react';
import CreateEventForm from './CreateEventForm';
import { api } from '../api';
import { Event, EventCategory } from '../types';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newEvent: Event) => void;
}

// Curated list of premium Unsplash covers for different categories
const PRESET_COVERS = [
  {
    name: 'Conference Hub',
    url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop',
  },
  {
    name: 'Creative Workshop',
    url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1200&auto=format&fit=crop',
  },
  {
    name: 'Acoustic / Concert',
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop',
  },
  {
    name: 'Exhibition & Art',
    url: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?q=80&w=1200&auto=format&fit=crop',
  },
  {
    name: 'Minimalist Meetup',
    url: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?q=80&w=1200&auto=format&fit=crop',
  },
  {
    name: 'Virtual Seminar',
    url: 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?q=80&w=1200&auto=format&fit=crop',
  },
];

const CATEGORIES: EventCategory[] = [
  'Conference',
  'Workshop',
  'Meetup',
  'Social',
  'Concert',
  'Exhibition',
  'Webinar',
];

export default function CreateEventModal({ isOpen, onClose, onSuccess }: CreateEventModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<EventCategory>('Conference');
  const [imageUrl, setImageUrl] = useState(PRESET_COVERS[0].url);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [isUsingCustomImage, setIsUsingCustomImage] = useState(false);
  const [capacity, setCapacity] = useState('100');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const activeImage = isUsingCustomImage ? customImageUrl : imageUrl;

    try {
      const response = await api.createEvent({
        title,
        description,
        date,
        time,
        location,
        category,
        imageUrl: activeImage,
        capacity: parseInt(capacity, 10),
      });

      if (response.success && response.data) {
        onSuccess(response.data);
        onClose();
        resetForm();
      } else {
        setError(response.error || 'Failed to create event');
      }
    } catch (err: any) {
      setError('A connection error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDate('');
    setTime('');
    setLocation('');
    setCategory('Conference');
    setImageUrl(PRESET_COVERS[0].url);
    setCustomImageUrl('');
    setIsUsingCustomImage(false);
    setCapacity('100');
    setError(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
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
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-100 glass-panel p-8 shadow-xl z-10 scrollbar-thin"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-5 top-5 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600 transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <h3 className="font-display font-semibold text-2xl text-zinc-900">
                Publish a New Event
              </h3>
              <p className="text-zinc-400 text-sm mt-1">
                Fill out the specifications below to list your premium event on the platform.
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

            <CreateEventForm
              onSubmitSuccess={(newEvent) => {
                onSuccess(newEvent);
                onClose();
              }}
              onCancel={onClose}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
