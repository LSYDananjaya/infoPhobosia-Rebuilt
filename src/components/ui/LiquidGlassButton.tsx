import React from "react";
import Link from "next/link";

export type LiquidGlassButtonVariant = "primary" | "glass" | "mars" | "cyan";
export type LiquidGlassButtonSize = "sm" | "md" | "lg" | "icon";

interface BaseProps {
  children: React.ReactNode;
  variant?: LiquidGlassButtonVariant;
  size?: LiquidGlassButtonSize;
  fullWidth?: boolean;
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
    wrapClassName = "",
    className = "",
    contentClassName = "",
    ...rest
  } = props;

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

  const innerContent = <span className={contentClasses}>{children}</span>;

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
    <span className={wrapClasses}>
      {control}
      <span className="lg-btn-shadow" aria-hidden="true" />
    </span>
  );
}
