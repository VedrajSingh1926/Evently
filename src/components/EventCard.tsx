/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Calendar, MapPin, Users, ArrowUpRight } from 'lucide-react';
import { Event } from '../types';

interface EventCardProps {
  key?: React.Key | string | number;
  event: Event;
  onSelect: () => void;
}

export default function EventCard({ event, onSelect }: EventCardProps) {
  const isFull = event.rsvpCount >= event.capacity;
  const spotsLeft = event.capacity - event.rsvpCount;

  return (
    <div
      onClick={onSelect}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full"
    >
      {/* Event Banner Photo */}
      <div className="relative h-48 w-full overflow-hidden bg-zinc-50">
        <img
          src={event.imageUrl}
          alt={event.title}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Category Overlay */}
        <div className="absolute left-4 top-4">
          <span className="inline-flex rounded-full bg-white/90 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-zinc-800 shadow-sm uppercase tracking-wide border border-white/50">
            {event.category}
          </span>
        </div>
      </div>

      {/* Card Content Details */}
      <div className="flex flex-1 flex-col p-6">
        {/* Date / Remaining Capacity indicators */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 font-mono uppercase tracking-wider">
            <Calendar className="h-3.5 w-3.5 text-indigo-600" />
            {new Date(event.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </div>

          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-zinc-400" />
            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${
                isFull ? 'text-red-500' : 'text-zinc-500'
              }`}
            >
              {isFull ? 'At Capacity' : `${spotsLeft} spots left`}
            </span>
          </div>
        </div>

        {/* Title */}
        <h4 className="font-display font-semibold text-base text-zinc-900 group-hover:text-indigo-600 line-clamp-1 transition-colors leading-snug">
          {event.title}
        </h4>

        {/* Description Snippet */}
        <p className="mt-2 text-xs text-zinc-400 line-clamp-2 leading-relaxed flex-1 text-justify">
          {event.description}
        </p>

        {/* Location & Trigger Footers */}
        <div className="mt-5 pt-4 border-t border-zinc-50 flex items-center justify-between text-zinc-500">
          <div className="flex items-center gap-1 text-xs font-medium text-zinc-500 truncate max-w-[70%]">
            <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>

          <span className="inline-flex items-center gap-0.5 text-xs font-bold text-indigo-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
            RSVP <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
