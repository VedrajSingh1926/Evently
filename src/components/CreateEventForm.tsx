/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Loader2, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Tag, 
  Image as ImageIcon, 
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  FileText
} from 'lucide-react';
import { api } from '../api';
import { EventCategory } from '../types';

interface CreateEventFormProps {
  onSubmitSuccess: (newEvent: any) => void;
  onCancel?: () => void;
}

const PRESET_COVERS = [
  {
    name: 'Conference Hub',
    url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200',
  },
  {
    name: 'Creative Workshop',
    url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1200',
  },
  {
    name: 'Acoustic / Concert',
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200',
  },
  {
    name: 'Exhibition & Art',
    url: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?q=80&w=1200',
  },
  {
    name: 'Minimalist Meetup',
    url: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?q=80&w=1200',
  },
  {
    name: 'Virtual Seminar',
    url: 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?q=80&w=1200',
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

export default function CreateEventForm({ onSubmitSuccess, onCancel }: CreateEventFormProps) {
  // Wizard Step State
  const [currentStep, setCurrentStep] = useState(1); // 1: Identity, 2: Logistics, 3: Copywriting & Review

  // Form Field States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventCategory>('Conference');
  const [capacity, setCapacity] = useState('100');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [imageUrl, setImageUrl] = useState(PRESET_COVERS[0].url);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [isUsingCustomImage, setIsUsingCustomImage] = useState(false);

  // Gemini AI Assistant States
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showAiAssistant, setShowAiAssistant] = useState(false);

  // Main Form Submission States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step Validation Helpers
  const isStep1Valid = title.trim() !== '' && category && capacity && parseInt(capacity, 10) > 0;
  const isStep2Valid = date !== '' && time !== '' && location.trim() !== '';
  const isStep3Valid = description.trim() !== '';

  const handleNextStep = () => {
    if (currentStep === 1 && isStep1Valid) setCurrentStep(2);
    else if (currentStep === 2 && isStep2Valid) setCurrentStep(3);
  };

  const handlePrevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // Trigger high-end Gemini copywriting endpoint via customized api wrapper
  const handleAiGenerateCopy = async () => {
    const promptToSend = aiPrompt.trim() || title.trim();
    if (!promptToSend) {
      setAiError('Please provide a short title or details to give Gemini AI some context.');
      return;
    }

    setIsAiLoading(true);
    setAiError(null);

    try {
      const response = await api.generateCopy(promptToSend);
      if (response.success && response.data?.description) {
        // Beautiful autofill text update
        setDescription(response.data.description);
        setShowAiAssistant(false);
        setAiPrompt('');
      } else {
        setAiError(response.error || 'Failed to generate markdown copy. Verify server logs.');
      }
    } catch (err: any) {
      setAiError(err.message || 'Error communicating with Gemini copywriting server.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStep1Valid || !isStep2Valid || !isStep3Valid) {
      setError('Please complete all stages of the wizard before publishing.');
      return;
    }

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
        onSubmitSuccess(response.data);
      } else {
        setError(response.error || 'Failed to publish event. Please check authorizations.');
      }
    } catch (err: any) {
      setError(err.message || 'A network error occurred. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Progress bar indicator */}
      <div className="border-b border-zinc-100 pb-5">
        <div className="flex items-center justify-between text-xs text-zinc-400 font-mono tracking-widest uppercase mb-3">
          <span>Wizard Phase {currentStep} of 3</span>
          <span className="font-bold text-indigo-600">
            {currentStep === 1 ? 'Identity' : currentStep === 2 ? 'Logistics' : 'Content & Polish'}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 h-1 bg-zinc-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-300 ${currentStep >= 1 ? 'bg-indigo-600' : 'bg-zinc-100'}`} />
          <div className={`h-full rounded-full transition-all duration-300 ${currentStep >= 2 ? 'bg-indigo-600' : 'bg-zinc-100'}`} />
          <div className={`h-full rounded-full transition-all duration-300 ${currentStep >= 3 ? 'bg-indigo-600' : 'bg-zinc-100'}`} />
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-600 border border-red-100 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Main Creation form wrapped in wizard transitions */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <AnimatePresence mode="wait">
          {/* STEP 1: IDENTITY */}
          {currentStep === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              className="space-y-6"
            >
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Silicon Valley Executive Roundtable"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3 px-4 text-sm text-zinc-800 placeholder-zinc-400 outline-none hover:bg-zinc-50 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    Event Category
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
                      <Tag className="h-4 w-4 text-zinc-400" />
                    </span>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as EventCategory)}
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3 pl-10 pr-4 text-sm text-zinc-800 outline-none hover:bg-zinc-50 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all appearance-none cursor-pointer"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    Attendee Capacity
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
                      <Users className="h-4 w-4 text-zinc-400" />
                    </span>
                    <input
                      type="number"
                      required
                      min="1"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3 pl-10 pr-4 text-sm text-zinc-800 outline-none hover:bg-zinc-50 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: LOGISTICS */}
          {currentStep === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    Event Date
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
                      <Calendar className="h-4 w-4 text-zinc-400" />
                    </span>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3 pl-10 pr-4 text-sm text-zinc-800 outline-none hover:bg-zinc-50 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                    Start Time
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
                      <Clock className="h-4 w-4 text-zinc-400" />
                    </span>
                    <input
                      type="time"
                      required
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3 pl-10 pr-4 text-sm text-zinc-800 outline-none hover:bg-zinc-50 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  Location / Venue
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
                    <MapPin className="h-4 w-4 text-zinc-400" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Grand Ballroom, Four Seasons Hotel or Zoom Link"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3 pl-10 pr-4 text-sm text-zinc-800 placeholder-zinc-400 outline-none hover:bg-zinc-50 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: COPYWRITING & IMAGERY & REVIEW */}
          {currentStep === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              className="space-y-6"
            >
              {/* Event Description Text Area containing the ✨ Enhance with Gemini AI button neatly placed INSIDE the border */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  Persuasive Event Description
                </label>
                
                {/* Textarea Frame with Sparkle assist integrated inside */}
                <div className="relative flex flex-col rounded-xl border border-zinc-200 bg-zinc-50/50 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-100 transition-all overflow-hidden">
                  
                  {/* Dynamic Skeleton Loader Overlay if Generating */}
                  {isAiLoading && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-15 flex flex-col items-center justify-center space-y-2">
                      <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" />
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-700 animate-pulse">
                        Gemini AI Copywriter Crafting Proposal...
                      </span>
                    </div>
                  )}

                  <textarea
                    required
                    rows={6}
                    placeholder="Agenda details, topics covered, target demographic, special guest panels..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border-0 bg-transparent py-3 px-4 text-sm text-zinc-800 placeholder-zinc-400 outline-none resize-none"
                  />

                  {/* PREMIUM ENHANCE BUTTON INSIDE THE TEXT AREA BORDER */}
                  <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-100 bg-zinc-50 shrink-0 z-10">
                    <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-mono">
                      <FileText className="h-3 w-3" />
                      Markdown Supported
                    </span>

                    <button
                      type="button"
                      onClick={() => setShowAiAssistant(!showAiAssistant)}
                      className="group inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 transition-all cursor-pointer shadow-sm active:scale-95"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-indigo-400 group-hover:rotate-12 transition-transform" />
                      ✨ Enhance with Gemini AI
                    </button>
                  </div>
                </div>
              </div>

              {/* Collapsible Prompt Helper Drawer */}
              <AnimatePresence>
                {showAiAssistant && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-xl border border-indigo-100 bg-indigo-50/20 p-4 space-y-3 overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-indigo-600 animate-pulse" />
                        Prompt Details (Key Takeaways, Location, Guest Speakers)
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAiAssistant(false)}
                        className="text-xs font-bold text-zinc-400 hover:text-zinc-600"
                      >
                        Close
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. modular synthesis meetup, dynamic speakers, curated coffee bar"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAiGenerateCopy())}
                        className="flex-1 rounded-lg border border-zinc-200 bg-white py-2 px-3 text-xs text-zinc-800 outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        disabled={isAiLoading}
                        onClick={handleAiGenerateCopy}
                        className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 text-xs font-semibold text-white flex items-center gap-1 cursor-pointer disabled:opacity-75 transition-all shadow"
                      >
                        Draft Copy
                      </button>
                    </div>

                    {aiError && (
                      <p className="text-[11px] font-semibold text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {aiError}
                      </p>
                    )}
                    <p className="text-[10px] text-zinc-400 leading-relaxed">
                      Type specific bullet points or topics. Gemini 2.5 Flash will write structured, beautifully styled corporate copy in Markdown.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Event Cover Image selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Event Cover Image
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsUsingCustomImage(!isUsingCustomImage)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-2 cursor-pointer transition-all"
                  >
                    {isUsingCustomImage ? 'Use Curated Presets' : 'Use Custom Cover URL'}
                  </button>
                </div>

                {!isUsingCustomImage ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PRESET_COVERS.map((cov) => (
                      <button
                        key={cov.url}
                        type="button"
                        onClick={() => setImageUrl(cov.url)}
                        className={`group relative h-20 overflow-hidden rounded-xl border transition-all duration-300 cursor-pointer ${
                          imageUrl === cov.url
                            ? 'border-indigo-600 ring-2 ring-indigo-100'
                            : 'border-zinc-200 hover:opacity-90'
                        }`}
                      >
                        <img
                          src={cov.url}
                          alt={cov.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-zinc-950/20 flex items-end p-1.5">
                          <span className="text-[10px] font-semibold text-white drop-shadow truncate w-full">
                            {cov.name}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
                      <ImageIcon className="h-4 w-4" />
                    </span>
                    <input
                      type="url"
                      required={isUsingCustomImage}
                      placeholder="https://images.unsplash.com/... custom link"
                      value={customImageUrl}
                      onChange={(e) => setCustomImageUrl(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-3 pl-10 pr-4 text-sm text-zinc-800 placeholder-zinc-400 outline-none hover:bg-zinc-50 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition-all"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wizard Footer Controls */}
        <div className="flex items-center justify-between pt-6 border-t border-zinc-100">
          <div>
            {onCancel && currentStep === 1 && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 text-xs font-semibold text-zinc-500 hover:bg-zinc-50 rounded-xl transition-all border border-zinc-200 cursor-pointer"
              >
                Cancel Process
              </button>
            )}
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 rounded-xl transition-all border border-zinc-200 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Previous Phase
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={(currentStep === 1 && !isStep1Valid) || (currentStep === 2 && !isStep2Valid)}
                className="flex items-center gap-1.5 rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 transition-all cursor-pointer disabled:opacity-50"
              >
                Next Step
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || !isStep3Valid}
                className="flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 py-2.5 px-6 font-semibold text-xs text-white shadow-sm hover:shadow transition-all disabled:opacity-75 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Publishing Experience...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1.5 text-indigo-200" />
                    Publish Curated Event
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
