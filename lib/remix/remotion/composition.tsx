/**
 * Remotion composition for Epic Remix.
 * Used when rendering with @remotion/renderer (requires Chromium).
 * Current default render uses ffmpeg directly (assembler.ts).
 *
 * This composition handles:
 * - Scene sequencing with precise frame timing
 * - On-screen text overlays with animations
 * - Background music layer (future)
 */

import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  Audio,
  Video,
  Easing,
  interpolate,
  useCurrentFrame,
} from 'remotion';

export interface RemixScene {
  videoUrl: string;
  audioUrl: string;
  durationFrames: number;
  onScreenText?: string;
}

export interface RemixCompositionProps {
  scenes: RemixScene[];
}

function OnScreenText({ text }: { text: string }) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 10], [0, 1], {
    easing: Easing.out(Easing.ease),
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        opacity,
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        color: '#ffffff',
        padding: '14px 28px',
        borderRadius: 10,
        fontSize: 42,
        fontWeight: 700,
        textAlign: 'center',
        maxWidth: '80%',
        fontFamily: 'Inter, system-ui, sans-serif',
        lineHeight: 1.3,
        letterSpacing: '-0.5px',
      }}
    >
      {text}
    </div>
  );
}

export const RemixComposition: React.FC<RemixCompositionProps> = ({ scenes }) => {
  let currentFrame = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {scenes.map((scene, i) => {
        const from = currentFrame;
        currentFrame += scene.durationFrames;

        return (
          <Sequence key={i} from={from} durationInFrames={scene.durationFrames}>
            <AbsoluteFill>
              <Video
                src={scene.videoUrl}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <Audio src={scene.audioUrl} />
              {scene.onScreenText && <OnScreenText text={scene.onScreenText} />}
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
