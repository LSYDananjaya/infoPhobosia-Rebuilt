"use client";

import React from "react";
import type { SceneAsset } from "@/data/sceneAssets";
import { queueScrollRefresh } from "@/lib/gsap";

interface SpriteImgProps {
  asset: SceneAsset;
  className?: string;
  style?: React.CSSProperties;
  flip?: boolean;
}

/** Bare decorative <img> for a scene asset. */
export function SpriteImg({ asset, className = "", style, flip }: SpriteImgProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={asset.src}
      width={asset.width}
      height={asset.height}
      alt=""
      aria-hidden="true"
      draggable={false}
      loading="lazy"
      decoding="async"
      onLoad={queueScrollRefresh}
      className={`block w-full h-auto select-none ${className}`}
      style={{ ...style, transform: flip ? "scaleX(-1)" : undefined }}
    />
  );
}

interface SceneSpriteProps {
  asset: SceneAsset;
  /** Value for data-layer, the hook GSAP timelines target. */
  layer: string;
  /** Pointer parallax depth multiplier (e.g. 0.2 far .. 1.35 foreground). */
  depth?: number;
  /** Placement and width of the animated layer. Avoid translate/rotate/scale utilities: GSAP owns transform here. */
  className?: string;
  /** Static CSS filter, e.g. depth blur. Never animated. */
  filter?: string;
  flip?: boolean;
  /** Masked light sweep that only shows on the sprite's opaque pixels. */
  glint?: boolean;
  /** Soft contact shadow under grounded objects. */
  shadow?: boolean;
  /** Ambient rim backlight behind the sprite. */
  rimGlow?: "mars" | "cyan" | "amber";
  /** Optional attached visual effects (e.g. scanner beam, dust plume) that move with [data-inner]. */
  children?: React.ReactNode;
}

const RIM_GLOW_CLASS: Record<NonNullable<SceneSpriteProps["rimGlow"]>, string> = {
  mars: "scene-rim-glow--mars",
  cyan: "scene-rim-glow--cyan",
  amber: "scene-rim-glow--amber",
};

/**
 * 3-tier transform hierarchy:
 * [data-layer] (ScrollTrigger scrub timeline)
 *   > [data-depth] (2.5D pointer parallax rig)
 *     > [data-inner] (idle hover / rumble loops)
 *       > img + glint + attached children
 */
export function SceneSprite({
  asset,
  layer,
  depth = 0.5,
  className = "",
  filter,
  flip,
  glint,
  shadow,
  rimGlow,
  children,
}: SceneSpriteProps) {
  const mask = `url(${asset.src})`;
  return (
    <div data-layer={layer} aria-hidden="true" className={`scene-layer pointer-events-none ${className}`}>
      <div data-depth={depth} className="scene-layer relative">
        {rimGlow && <span className={`scene-rim-glow ${RIM_GLOW_CLASS[rimGlow]}`} />}
        {shadow && <span className="scene-contact-shadow" />}
        <div data-inner className="scene-layer relative">
          <SpriteImg asset={asset} flip={flip} style={filter ? { filter } : undefined} />
          {glint && (
            <span
              className="sprite-glint"
              style={{
                maskImage: mask,
                WebkitMaskImage: mask,
                transform: flip ? "scaleX(-1)" : undefined,
              }}
            >
              <span data-glint className="sprite-glint-bar" />
            </span>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
