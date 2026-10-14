import { useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import "./tvworld.css";

interface Props {
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}

/**
 * Drop-in replacement for `<Link to="/explore">`.
 * Plays a short CRT "power-off" over the current page, then navigates, so entering
 * the TV world feels like stepping into another room instead of a route swap.
 * Modified clicks (new tab, etc.) and reduced-motion users get a normal navigation.
 */
export function ExploreLink({ className, children, onClick }: Props) {
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.();
    try {
      sessionStorage.removeItem("devzgo:tvworld:cam");
    } catch {
      /* ignore */
    }
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    if (leaving) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      navigate("/explore");
      return;
    }
    setLeaving(true);
    window.setTimeout(() => navigate("/explore", { state: { tvEntry: true } }), 440);
  }

  return (
    <>
      <Link to="/explore" className={className} onClick={handleClick}>
        {children}
      </Link>
      {leaving &&
        createPortal(
          <div className="tvw-off" aria-hidden="true">
            <i />
          </div>,
          document.body
        )}
    </>
  );
}
