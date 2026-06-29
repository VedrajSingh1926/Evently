/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'organizer';
  createdAt: string;
}

export type EventCategory = 'Conference' | 'Workshop' | 'Meetup' | 'Social' | 'Concert' | 'Exhibition' | 'Webinar';

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  location: string;
  category: EventCategory;
  imageUrl: string;
  capacity: number;
  organizerId: string;
  organizerName: string;
  rsvpCount: number;
  createdAt: string;
}

export type RSVPStatus = 'going' | 'maybe' | 'not_going';

export interface RSVP {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: RSVPStatus;
  createdAt: string;
}

export interface Comment {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
