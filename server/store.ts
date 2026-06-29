/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { User, Event, RSVP, Comment } from '../src/types.js';

// Define the file-based database structure
interface Schema {
  users: (User & { passwordHash: string })[];
  events: Event[];
  rsvps: RSVP[];
  comments: Comment[];
}

const dbDirectory = path.join(process.cwd(), 'data');
const dbFilePath = path.join(dbDirectory, 'db.json');

// Helper to ensure database directory and file exist
function initDb(): Schema {
  if (!fs.existsSync(dbDirectory)) {
    fs.mkdirSync(dbDirectory, { recursive: true });
  }

  if (fs.existsSync(dbFilePath)) {
    try {
      const rawData = fs.readFileSync(dbFilePath, 'utf-8');
      return JSON.parse(rawData);
    } catch (err) {
      console.error('Error reading DB, re-initializing...', err);
    }
  }

  // Pre-seed some luxury consumer SaaS and design events
  const salt = bcrypt.genSaltSync(10);
  const adminPasswordHash = bcrypt.hashSync('admin123', salt);
  const userPasswordHash = bcrypt.hashSync('user123', salt);

  const initialUsers = [
    {
      id: 'usr_admin',
      email: 'organizer@evently.com',
      name: 'Sarah Jenkins',
      role: 'admin' as const,
      createdAt: new Date().toISOString(),
      passwordHash: adminPasswordHash,
    },
    {
      id: 'usr_user1',
      email: 'alex@minimalist.io',
      name: 'Alex Rivera',
      role: 'user' as const,
      createdAt: new Date().toISOString(),
      passwordHash: userPasswordHash,
    }
  ];

  const initialEvents: Event[] = [
    {
      id: 'evt_1',
      title: 'SaaS Founder Summit 2026',
      description: 'An exclusive gathering of high-growth SaaS founders, operators, and investors. Dive deep into next-generation growth playbooks, modern design aesthetics, and enterprise scale strategies. Includes keynote panels, roundtables, and premium networking cocktails overlooking the harbor.',
      date: '2026-08-14',
      time: '09:00',
      location: 'The Ritz-Carlton Glass Pavilion, San Francisco',
      category: 'Conference',
      imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop',
      capacity: 150,
      organizerId: 'usr_admin',
      organizerName: 'Sarah Jenkins',
      rsvpCount: 32,
      createdAt: new Date().toISOString()
    },
    {
      id: 'evt_2',
      title: 'AI & Typography: Next-Gen Editorial Design',
      description: 'A hands-on, high-end design workshop exploring the collision of machine learning with advanced Swiss typographic systems. Learn how to craft responsive, dynamic typographic canvases, handle variable type scales, and employ generative layouts for luxury consumer brands.',
      date: '2026-09-05',
      time: '14:00',
      location: 'Studio Grid-Eight, Portland',
      category: 'Workshop',
      imageUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1200&auto=format&fit=crop',
      capacity: 45,
      organizerId: 'usr_admin',
      organizerName: 'Sarah Jenkins',
      rsvpCount: 18,
      createdAt: new Date().toISOString()
    },
    {
      id: 'evt_3',
      title: 'Curated Soundscapes: Outdoor Ambient Live Set',
      description: 'Experience a minimalist ambient sound performance featuring modular synthesizers and acoustic strings in a serene, architecturally stunning redwood grove. Attendees will be provided with custom sound-insulating headsets for an intimate, high-fidelity auditory journey.',
      date: '2026-07-25',
      time: '18:30',
      location: 'Cathedral of Redwoods, Big Sur',
      category: 'Concert',
      imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop',
      capacity: 80,
      organizerId: 'usr_admin',
      organizerName: 'Sarah Jenkins',
      rsvpCount: 64,
      createdAt: new Date().toISOString()
    },
    {
      id: 'evt_4',
      title: 'Minimalist Architecture & Light Exhibition',
      description: 'A private tour and open discussion featuring the concrete residential works of Tadao Ando and his contemporaries. The exhibition highlights the interplay of natural light, negative space, and raw, honest architectural materials. Followed by a wine tasting with curators.',
      date: '2026-07-10',
      time: '16:00',
      location: 'The Concrete Monolith, Los Angeles',
      category: 'Exhibition',
      imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop',
      capacity: 60,
      organizerId: 'usr_user1',
      organizerName: 'Alex Rivera',
      rsvpCount: 42,
      createdAt: new Date().toISOString()
    }
  ];

  const initialRsvps: RSVP[] = [
    {
      id: 'rsvp_1',
      eventId: 'evt_1',
      userId: 'usr_user1',
      userName: 'Alex Rivera',
      userEmail: 'alex@minimalist.io',
      status: 'going',
      createdAt: new Date().toISOString()
    },
    {
      id: 'rsvp_2',
      eventId: 'evt_2',
      userId: 'usr_user1',
      userName: 'Alex Rivera',
      userEmail: 'alex@minimalist.io',
      status: 'maybe',
      createdAt: new Date().toISOString()
    }
  ];

  const initialComments: Comment[] = [
    {
      id: 'cmt_1',
      eventId: 'evt_1',
      userId: 'usr_user1',
      userName: 'Alex Rivera',
      content: 'Absolutely thrilled for this year\'s summit. The Ritz-Carlton venue in SF is stunning. Looking forward to the Keynote on UI scale architectures!',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString() // 4 hours ago
    },
    {
      id: 'cmt_2',
      eventId: 'evt_1',
      userId: 'usr_admin',
      userName: 'Sarah Jenkins',
      content: 'Thanks Alex! We are introducing roundtable design sessions this year specifically focusing on typography and user flows. See you there!',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString() // 2 hours ago
    }
  ];

  const seedData: Schema = {
    users: initialUsers,
    events: initialEvents,
    rsvps: initialRsvps,
    comments: initialComments
  };

  fs.writeFileSync(dbFilePath, JSON.stringify(seedData, null, 2), 'utf-8');
  return seedData;
}

// Memory cache of DB loaded once
let dbCache: Schema = initDb();

function persistDb(): void {
  try {
    fs.writeFileSync(dbFilePath, JSON.stringify(dbCache, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write database to disk:', err);
  }
}

export const dbStore = {
  getUsers: () => dbCache.users,
  addUser: (user: User & { passwordHash: string }) => {
    dbCache.users.push(user);
    persistDb();
  },
  findUserByEmail: (email: string) => {
    return dbCache.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },
  findUserById: (id: string) => {
    return dbCache.users.find(u => u.id === id);
  },

  getEvents: () => dbCache.events,
  getEventById: (id: string) => {
    return dbCache.events.find(e => e.id === id);
  },
  addEvent: (event: Event) => {
    dbCache.events.push(event);
    persistDb();
  },
  updateEvent: (id: string, updatedFields: Partial<Event>) => {
    const idx = dbCache.events.findIndex(e => e.id === id);
    if (idx !== -1) {
      dbCache.events[idx] = { ...dbCache.events[idx], ...updatedFields };
      persistDb();
      return dbCache.events[idx];
    }
    return null;
  },
  deleteEvent: (id: string) => {
    dbCache.events = dbCache.events.filter(e => e.id !== id);
    dbCache.rsvps = dbCache.rsvps.filter(r => r.eventId !== id);
    dbCache.comments = dbCache.comments.filter(c => c.eventId !== id);
    persistDb();
  },

  getRsvps: () => dbCache.rsvps,
  getRsvpsForEvent: (eventId: string) => {
    return dbCache.rsvps.filter(r => r.eventId === eventId);
  },
  addOrUpdateRsvp: (rsvp: RSVP) => {
    const idx = dbCache.rsvps.findIndex(r => r.eventId === rsvp.eventId && r.userId === rsvp.userId);
    if (idx !== -1) {
      dbCache.rsvps[idx] = rsvp;
    } else {
      dbCache.rsvps.push(rsvp);
    }
    
    // Recalculate rsvp count for this event
    const eventRsvps = dbCache.rsvps.filter(r => r.eventId === rsvp.eventId && r.status === 'going');
    const eventIdx = dbCache.events.findIndex(e => e.id === rsvp.eventId);
    if (eventIdx !== -1) {
      dbCache.events[eventIdx].rsvpCount = eventRsvps.length;
    }

    persistDb();
  },

  getComments: () => dbCache.comments,
  getCommentsForEvent: (eventId: string) => {
    return dbCache.comments.filter(c => c.eventId === eventId);
  },
  addComment: (comment: Comment) => {
    dbCache.comments.push(comment);
    persistDb();
  },
  deleteComment: (commentId: string) => {
    dbCache.comments = dbCache.comments.filter(c => c.id !== commentId);
    persistDb();
  }
};
