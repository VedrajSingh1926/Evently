/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response } from 'express';
import { supabase } from '../config/supabaseConfig';
import { AuthenticatedRequest } from '../middleware/firebaseAuth';

/**
 * Get all events with advanced multi-parameter filtering (category, search queries, location, dates).
 */
export const getEvents = async (req: Request, res: Response) => {
  try {
    const { category, search, location, dateFilter, budget } = req.query;

    let query = supabase.from('events').select('*');

    // Filter by Category
    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    // Filter by Location
    if (location && typeof location === 'string' && location.trim() !== '') {
      query = query.ilike('location', `%${location}%`);
    }

    // Filter by general search string (title/description/location)
    if (search && typeof search === 'string' && search.trim() !== '') {
      query = query.ilike('title', `%${search}%`);
    }

    // Retrieve events
    const { data: events, error } = await query;

    if (error) {
      throw error;
    }

    let filteredEvents = events || [];

    // Filter by budget category (Free vs Premium passes)
    if (budget === 'Free') {
      filteredEvents = filteredEvents.filter((evt: any) => 
        evt.category === 'Workshop' || evt.category === 'Meetup' || evt.category === 'Webinar' || evt.category === 'Social'
      );
    } else if (budget === 'Premium') {
      filteredEvents = filteredEvents.filter((evt: any) => 
        evt.category === 'Conference' || evt.category === 'Concert' || evt.category === 'Exhibition'
      );
    }

    // Filter by date filter (e.g., 'This Month')
    if (dateFilter === 'This Month') {
      const currentMonth = new Date().getMonth();
      filteredEvents = filteredEvents.filter((evt: any) => {
        const evtMonth = new Date(evt.date).getMonth();
        return evtMonth === currentMonth;
      });
    }

    // Sort by chronological event date
    filteredEvents.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Map fields for camelCase compatibility with frontend types
    const mappedEvents = filteredEvents.map((evt: any) => ({
      id: evt.id,
      title: evt.title,
      description: evt.description,
      date: evt.date,
      time: evt.time,
      location: evt.location,
      category: evt.category,
      imageUrl: evt.image_url || evt.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200',
      capacity: evt.capacity,
      organizerId: evt.organizer_id || evt.organizerId,
      organizerName: evt.organizer_name || evt.organizerName || 'Organizer',
      rsvpCount: evt.rsvp_count || evt.rsvpCount || 0,
      createdAt: evt.created_at || evt.createdAt,
    }));

    return res.status(200).json({
      success: true,
      data: mappedEvents,
    });
  } catch (error: any) {
    console.error('[Event Controller] Fetch events failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve events.',
    });
  }
};

/**
 * Get detailed event metrics, comments, and current RSVPs.
 */
export const getEventById = async (req: Request, res: Response) => {
  try {
    const eventId = req.params.id;

    // Fetch core event
    const { data: events, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId);

    if (eventError || !events || events.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Event could not be located in the register.',
      });
    }

    const event = events[0];

    // Fetch RSVPs
    const { data: rsvps, error: rsvpsError } = await supabase
      .from('rsvps')
      .select('*')
      .eq('event_id', eventId);

    // Fetch Comments
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select('*')
      .eq('event_id', eventId);

    const sortedComments = (comments || []).sort(
      (a: any, b: any) => new Date(b.created_at || b.createdAt).getTime() - new Date(a.created_at || a.createdAt).getTime()
    );

    // Format for frontend
    const details = {
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      location: event.location,
      category: event.category,
      imageUrl: event.image_url || event.imageUrl,
      capacity: event.capacity,
      organizerId: event.organizer_id || event.organizerId,
      organizerName: event.organizer_name || event.organizerName || 'Organizer',
      rsvpCount: rsvps ? rsvps.filter((r: any) => r.status === 'going').length : 0,
      createdAt: event.created_at || event.createdAt,
      rsvps: (rsvps || []).map((r: any) => ({
        id: r.id,
        eventId: r.event_id || r.eventId,
        userId: r.user_id || r.userId,
        userName: r.user_name || r.userName || 'Attendee',
        userEmail: r.user_email || r.userEmail || '',
        status: r.status,
        createdAt: r.created_at || r.createdAt,
      })),
      comments: sortedComments.map((c: any) => ({
        id: c.id,
        eventId: c.event_id || c.eventId,
        userId: c.user_id || c.userId,
        userName: c.user_name || c.userName || 'Anonymous',
        content: c.content,
        createdAt: c.created_at || c.createdAt,
      })),
    };

    return res.status(200).json({
      success: true,
      data: details,
    });
  } catch (error: any) {
    console.error('[Event Controller] Fetch single event failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve detailed event profile.',
    });
  }
};

/**
 * Publish a new corporate gathering or training meetup.
 */
export const createEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, description, date, time, location, category, imageUrl, capacity } = req.body;

    if (!title || !description || !date || !time || !location || !category || !capacity) {
      return res.status(400).json({
        success: false,
        error: 'Please supply all required logistics parameters to create the event.',
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Identity context missing. Unable to create experience.',
      });
    }

    const eventId = 'evt_' + Math.random().toString(36).substr(2, 9);
    const newEvent = {
      id: eventId,
      title,
      description,
      date,
      time,
      location,
      category,
      image_url: imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200',
      capacity: parseInt(capacity, 10),
      organizer_id: req.user.id,
      organizer_name: req.user.name || req.user.email?.split('@')[0] || 'Organizer',
      rsvp_count: 0,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('events').insert([newEvent]);

    if (error) {
      throw error;
    }

    return res.status(201).json({
      success: true,
      data: {
        id: newEvent.id,
        title: newEvent.title,
        description: newEvent.description,
        date: newEvent.date,
        time: newEvent.time,
        location: newEvent.location,
        category: newEvent.category,
        imageUrl: newEvent.image_url,
        capacity: newEvent.capacity,
        organizerId: newEvent.organizer_id,
        organizerName: newEvent.organizer_name,
        rsvpCount: 0,
        createdAt: newEvent.created_at,
      },
    });
  } catch (error: any) {
    console.error('[Event Controller] Create event failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to publish event listings on Supabase.',
    });
  }
};

/**
 * Edit existing logistics or coverage for an active event.
 */
export const updateEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const eventId = req.params.id;

    const { data: events, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId);

    if (fetchError || !events || events.length === 0) {
      return res.status(404).json({ success: false, error: 'Event not found.' });
    }

    const event = events[0];

    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized user.' });
    }

    // Verify creator ownership or administrative bypass
    if (event.organizer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only the host organizer or administrative delegates may edit this event.',
      });
    }

    const { title, description, date, time, location, category, imageUrl, capacity } = req.body;

    const updates: any = {};
    if (title) updates.title = title;
    if (description) updates.description = description;
    if (date) updates.date = date;
    if (time) updates.time = time;
    if (location) updates.location = location;
    if (category) updates.category = category;
    if (imageUrl) updates.image_url = imageUrl;
    if (capacity) updates.capacity = parseInt(capacity, 10);

    const { data: updatedEvents, error: updateError } = await supabase
      .from('events')
      .update(updates)
      .eq('id', eventId);

    if (updateError) {
      throw updateError;
    }

    return res.status(200).json({
      success: true,
      message: 'Event listings updated successfully.',
    });
  } catch (error: any) {
    console.error('[Event Controller] Update event failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update event particulars.',
    });
  }
};

/**
 * Remove event listing entirely.
 */
export const deleteEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const eventId = req.params.id;

    const { data: events, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId);

    if (fetchError || !events || events.length === 0) {
      return res.status(404).json({ success: false, error: 'Event listing not found.' });
    }

    const event = events[0];

    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized user.' });
    }

    if (event.organizer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Permission denied. Only host organizers can remove this listing.',
      });
    }

    // Delete associated RSVPs, Comments, then the Event
    await supabase.from('rsvps').delete().eq('event_id', eventId);
    await supabase.from('comments').delete().eq('event_id', eventId);
    const { error: deleteError } = await supabase.from('events').delete().eq('id', eventId);

    if (deleteError) {
      throw deleteError;
    }

    return res.status(200).json({
      success: true,
      message: 'Experience successfully deleted.',
    });
  } catch (error: any) {
    console.error('[Event Controller] Deletion failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to remove listing from database.',
    });
  }
};

/**
 * Submit or modify active RSVP status for corporate assembly.
 */
export const submitRsvp = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const eventId = req.params.id;
    const { status } = req.body;

    if (!status || !['going', 'maybe', 'not_going'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Please choose a valid RSVP status.' });
    }

    const { data: events, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId);

    if (eventError || !events || events.length === 0) {
      return res.status(404).json({ success: false, error: 'Event could not be located.' });
    }

    const event = events[0];

    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    // Limit checks if going
    if (status === 'going') {
      const { data: existingGoing } = await supabase
        .from('rsvps')
        .select('*')
        .eq('event_id', eventId)
        .eq('status', 'going');

      const currentCount = existingGoing ? existingGoing.length : 0;
      const isAlreadyRegistered = existingGoing ? existingGoing.some((r: any) => r.user_id === req.user?.id) : false;

      if (!isAlreadyRegistered && currentCount >= event.capacity) {
        return res.status(400).json({
          success: false,
          error: 'This high-end assembly is fully booked. Join the waiting list.',
        });
      }
    }

    // Check if user has an existing RSVP
    const { data: rsvps } = await supabase
      .from('rsvps')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', req.user.id);

    if (rsvps && rsvps.length > 0) {
      // Update existing RSVP
      const { error: updateError } = await supabase
        .from('rsvps')
        .update({ status })
        .eq('id', rsvps[0].id);

      if (updateError) throw updateError;
    } else {
      // Insert new RSVP
      const newRsvp = {
        id: 'rsvp_' + Math.random().toString(36).substr(2, 9),
        event_id: eventId,
        user_id: req.user.id,
        user_name: req.user.name || req.user.email?.split('@')[0] || 'Attendee',
        user_email: req.user.email || '',
        status: status,
        created_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase.from('rsvps').insert([newRsvp]);
      if (insertError) throw insertError;
    }

    return res.status(200).json({
      success: true,
      message: 'RSVP status submitted successfully.',
    });
  } catch (error: any) {
    console.error('[Event Controller] RSVP submission failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to record RSVP choice.',
    });
  }
};

/**
 * Add inline professional comment to active discussion thread.
 */
export const addComment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const eventId = req.params.id;
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ success: false, error: 'Comments cannot be blank.' });
    }

    const { data: events, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId);

    if (eventError || !events || events.length === 0) {
      return res.status(404).json({ success: false, error: 'Event details missing.' });
    }

    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    const newComment = {
      id: 'cmt_' + Math.random().toString(36).substr(2, 9),
      event_id: eventId,
      user_id: req.user.id,
      user_name: req.user.name || req.user.email?.split('@')[0] || 'Anonymous',
      content: content,
      created_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabase.from('comments').insert([newComment]);

    if (insertError) {
      throw insertError;
    }

    return res.status(201).json({
      success: true,
      data: {
        id: newComment.id,
        eventId: newComment.event_id,
        userId: newComment.user_id,
        userName: newComment.user_name,
        content: newComment.content,
        createdAt: newComment.created_at,
      },
    });
  } catch (error: any) {
    console.error('[Event Controller] Comment submission failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to submit comment.',
    });
  }
};
