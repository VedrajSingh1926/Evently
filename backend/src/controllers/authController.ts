/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Response } from 'express';
import { supabase } from '../config/supabaseConfig';
import { AuthenticatedRequest } from '../middleware/firebaseAuth';

/**
 * Syncs the Firebase Authenticated User context with the Supabase Profiles Table.
 * Allows the client to submit the desired role ('user' | 'organizer') during their first onboarding.
 */
export const syncProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication context missing. Unable to synchronize profile.',
      });
    }

    const { uid, email, name: tokenName } = req.user;
    const { role, name: bodyName } = req.body;

    const displayName = bodyName || tokenName || email?.split('@')[0] || 'Member';
    const userRole = role === 'organizer' ? 'organizer' : 'user';

    // Check if profile already exists in Supabase to avoid overwriting existing roles
    const { data: existingProfiles, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid);

    if (fetchError) {
      console.error('[Sync Profile] Error fetching existing profile:', fetchError);
    }

    let profileData = null;

    if (existingProfiles && existingProfiles.length > 0) {
      // Profile exists, update non-sensitive metadata (name, email)
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({
          name: displayName,
          email: email,
        })
        .eq('id', uid);

      if (updateError) {
        throw updateError;
      }
      profileData = existingProfiles[0];
      // Keep existing role if already set, otherwise update with submitted role
      profileData.name = displayName;
      profileData.email = email;
    } else {
      // Create new profile record in profiles table
      const newProfile = {
        id: uid,
        email: email,
        name: displayName,
        role: userRole,
        created_at: new Date().toISOString(),
      };

      const { data, error: insertError } = await supabase
        .from('profiles')
        .insert([newProfile]);

      if (insertError) {
        throw insertError;
      }
      profileData = newProfile;
    }

    return res.status(200).json({
      success: true,
      message: 'Profile successfully synchronized between Firebase and Supabase.',
      data: {
        id: profileData.id,
        email: profileData.email,
        name: profileData.name,
        role: profileData.role,
        createdAt: profileData.created_at || profileData.createdAt,
      },
    });
  } catch (error: any) {
    console.error('[Auth Controller Sync] Profile synchronization failed:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to synchronize profile metadata with Supabase.',
    });
  }
};
