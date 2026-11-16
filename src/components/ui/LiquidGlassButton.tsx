"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { GlassSurface } from "@/components/ui/GlassSurface";

export type LiquidGlassButtonVariant = "primary" | "glass" | "mars" | "cyan";
export type LiquidGlassButtonSize = "sm" | "md" | "lg" | "icon";

interface BaseProps {
  children: React.ReactNode;
  variant?: LiquidGlassButtonVariant;
  size?: LiquidGlassButtonSize;
  fullWidth?: boolean;
  magnetic?: boolean;
  wrapClassName?: string;
  className?: string;
  contentClassName?: string;
}

type ButtonProps = BaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps> & {
    href?: undefined;
  };

type ExternalAnchorProps = BaseProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseProps> & {
    href: string;
    external?: true;
  };

type InternalLinkProps = BaseProps &
  Omit<React.ComponentPropsWithoutRef<typeof Link>, keyof BaseProps> & {
    href: string;
    external?: false;
  };

export type LiquidGlassButtonProps =
  | ButtonProps
  | ExternalAnchorProps
  | InternalLinkProps;

function isExternalHref(href: string, external?: boolean): boolean {
  if (external === true) return true;
  if (external === false) return false;
  return /^(https?:\/\/|mailto:|tel:)/.test(href);
}

export function LiquidGlassButton(props: LiquidGlassButtonProps) {
  const {
    children,
    variant = "glass",
    size = "md",
    fullWidth = false,
    magnetic = true,
    wrapClassName = "",
    className = "",
    contentClassName = "",
    ...rest
  } = props;

  const wrapRef = useRef<HTMLSpanElement>(null);

  const handlePointerMove = (e: React.PointerEvent<HTMLSpanElement>) => {
    if (!magnetic || e.pointerType === "touch") return;
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = ((e.clientX - (r.left + r.width * 0.5)) / (r.width * 0.5)) * 3.5;
    const dy = ((e.clientY - (r.top + r.height * 0.5)) / (r.height * 0.5)) * 2.5;
    el.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`;
  };

  const handlePointerLeave = () => {
    const el = wrapRef.current;
    if (!el) return;
    el.style.transform = "";
  };

  const wrapClasses = [
    "lg-btn-wrap",
    fullWidth ? "lg-btn-wrap--full" : "",
    wrapClassName,
  ]
    .filter(Boolean)
    .join(" ");

  const controlClasses = [
    "lg-btn",
    `lg-btn--${variant}`,
    `lg-btn--${size}`,
    fullWidth ? "lg-btn--full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const contentClasses = ["lg-btn-content", contentClassName]
    .filter(Boolean)
    .join(" ");

  const innerContent = (
    <>
      <GlassSurface
        layer
        distortionScale={variant === "primary" ? -35 : -70}
        displace={0.8}
        blur={12}
        backgroundOpacity={0.05}
        saturation={1.35}
      />
      <span className={contentClasses}>{children}</span>
    </>
  );

  let control: React.ReactNode;

  if ("href" in props && typeof props.href === "string") {
    const { href, external, ...anchorProps } = rest as Omit<
      ExternalAnchorProps | InternalLinkProps,
      keyof BaseProps
    > & { href: string; external?: boolean };

    if (isExternalHref(href, external)) {
      control = (
        <a
          href={href}
          className={controlClasses}
          {...(anchorProps as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {innerContent}
        </a>
      );
    } else {
      control = (
        <Link
          href={href}
          className={controlClasses}
          {...(anchorProps as Omit<
            React.ComponentPropsWithoutRef<typeof Link>,
            "href"
          >)}
        >
          {innerContent}
        </Link>
      );
    }
  } else {
    const buttonProps = rest as Omit<ButtonProps, keyof BaseProps>;
    control = (
      <button
        type={buttonProps.type ?? "button"}
        className={controlClasses}
        {...buttonProps}
      >
        {innerContent}
      </button>
    );
  }

  return (
    <span
      ref={wrapRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={wrapClasses}
    >
      {control}
    </span>
  );
}
