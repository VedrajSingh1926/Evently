/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ReactNode } from 'react';
import { motion } from 'motion/react';

interface AmbientLayoutProps {
  children: ReactNode;
}

export default function AmbientLayout({ children }: AmbientLayoutProps) {
  return (
    <div 
      className="relative min-h-screen w-full overflow-x-hidden text-zinc-100 selection:bg-indigo-500/30 selection:text-indigo-200"
      style={{
        background: 'radial-gradient(circle at 50% -20%, rgba(99,102,241,0.18) 0%, rgba(9,9,11,1) 80%)',
        backgroundColor: '#09090b'
      }}
    >
      {/* 1. LAYERED DEEP AMBIENT MESH GRADIENTS (Active & Moving) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Shifting Royal Violet glow */}
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-indigo-600/15 blur-[120px] animate-drift-slow mix-blend-screen" />
        
        {/* Shifting Deep Indigo/Purple glow */}
        <div className="absolute top-[40%] -right-[10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[130px] animate-drift-slower mix-blend-screen" />
        
        {/* Slow breathing highlight at bottom left */}
        <div className="absolute -bottom-[10%] left-[20%] w-[45%] h-[45%] rounded-full bg-violet-600/10 blur-[100px] animate-pulse-slow mix-blend-screen" />
      </div>

      {/* 2. HIGH-END GLASSMORPHIC GRID PATTERN MASK */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.03]" 
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />
      
      {/* Subtle radial light sweep mask */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,transparent_30%,rgba(9,9,11,0.95)_90%)] pointer-events-none z-0" />

      {/* 3. CONTENT WRAPPER */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  );
}
