import React, { useRef } from 'react';
import { useMouseGradient } from '../../hooks/useMouseGradient';
import './BackgroundGradientAnimation.css';

export default function BackgroundGradientAnimation() {
  const interactiveRef = useRef(null);
  useMouseGradient(interactiveRef);

  return (
    <div className="bg-anim-container">

      {/* ── Orb layer ────────────────────────────────────────────
          Each blob blurs individually so screen-blend compositing
          works correctly between orbs and the base colour.
      ──────────────────────────────────────────────────────── */}
      <div className="bg-orbs">
        {/* Orb 1 — primary hue, top-left anchor */}
        <div className="bg-blob blob-1" />
        {/* Orb 2 — secondary/cool hue, top-right off-canvas */}
        <div className="bg-blob blob-2" />
        {/* Orb 3 — accent/warm hue, right-center */}
        <div className="bg-blob blob-3" />
      </div>

      {/* Orb 4 — mouse follower — outside overflow-offset container for alignment */}
      <div ref={interactiveRef} className="bg-blob blob-interactive" />

      {/* ── Grain noise overlay ───────────────────────────────────
          feTurbulence + desaturate → fine monochrome grain.
          opacity 0.04 prevents colour banding without distracting.
      ──────────────────────────────────────────────────────── */}
      <svg className="bg-noise-svg" xmlns="http://www.w3.org/2000/svg">
        <filter id="grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.72"
            numOctaves="4"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>

    </div>
  );
}
