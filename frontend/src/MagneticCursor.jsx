import React, { useEffect, useRef, useState } from 'react';

export function MagneticCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const [cursorState, setCursorState] = useState('default');
  const [cursorLabel, setCursorLabel] = useState('');
  const [visible, setVisible] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const hasHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!hasHover || reducedMotion) {
      return;
    }
    setIsSupported(true);

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let animFrameId;

    const onMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!visible) setVisible(true);

      const target = e.target;
      if (!target) return;

      const cursorEl = target.closest('[data-cursor]');
      if (cursorEl) {
        const val = cursorEl.getAttribute('data-cursor');
        if (val === 'inspect' || val === 'view') {
          setCursorState('inspect');
          setCursorLabel(val === 'inspect' ? 'INSPECT' : 'VIEW');
          return;
        }
        if (val === 'drag' || val === '↔') {
          setCursorState('drag');
          setCursorLabel('↔');
          return;
        }
        if (val === 'sound') {
          setCursorState('sound');
          setCursorLabel('AUDIO');
          return;
        }
        if (val === 'hidden') {
          setCursorState('hidden');
          setCursorLabel('');
          return;
        }
        setCursorState('interactive');
        setCursorLabel(val.toUpperCase());
        return;
      }

      const isClickable = target.closest('button, a, input, textarea, select, [role="button"], .interactive-target');
      if (isClickable) {
        setCursorState('interactive');
        setCursorLabel('');
        return;
      }

      setCursorState('default');
      setCursorLabel('');
    };

    const onMouseLeave = () => setVisible(false);
    const onMouseEnter = () => setVisible(true);

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    const loop = () => {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      }

      animFrameId = requestAnimationFrame(loop);
    };

    animFrameId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      cancelAnimationFrame(animFrameId);
    };
  }, [visible]);

  if (!isSupported || !visible || cursorState === 'hidden') return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 99999,
        mixBlendMode: cursorState === 'inspect' ? 'difference' : 'normal',
      }}
    >
      {/* Precision center dot */}
      <div
        ref={dotRef}
        style={{
          position: 'absolute',
          top: -3,
          left: -3,
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: cursorState === 'inspect' ? '#ffffff' : 'var(--amber, #e89d43)',
          transition: 'transform 0.04s linear, opacity 0.2s ease, width 0.2s ease, height 0.2s ease',
          opacity: cursorState === 'inspect' || cursorState === 'drag' ? 0 : 1,
        }}
      />

      {/* Magnetic lagging outer ring */}
      <div
        ref={ringRef}
        style={{
          position: 'absolute',
          top: cursorState === 'inspect' ? -42 : cursorState === 'drag' ? -34 : cursorState === 'interactive' ? -26 : -18,
          left: cursorState === 'inspect' ? -42 : cursorState === 'drag' ? -34 : cursorState === 'interactive' ? -26 : -18,
          width: cursorState === 'inspect' ? 84 : cursorState === 'drag' ? 68 : cursorState === 'interactive' ? 52 : 36,
          height: cursorState === 'inspect' ? 84 : cursorState === 'drag' ? 68 : cursorState === 'interactive' ? 52 : 36,
          borderRadius: '50%',
          border: cursorState === 'inspect' 
            ? '1px solid rgba(255, 255, 255, 0.95)' 
            : cursorState === 'interactive' 
            ? '1px solid rgba(232, 157, 67, 0.7)' 
            : '1px solid rgba(244, 239, 230, 0.35)',
          backgroundColor: cursorState === 'inspect'
            ? 'rgba(255, 255, 255, 0.12)'
            : cursorState === 'interactive'
            ? 'rgba(232, 157, 67, 0.08)'
            : 'transparent',
          backdropFilter: cursorState === 'inspect' ? 'blur(4px)' : 'none',
          WebkitBackdropFilter: cursorState === 'inspect' ? 'blur(4px)' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: cursorState === 'inspect' ? '#ffffff' : 'var(--amber, #e89d43)',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.12em',
          transition: 'width 0.28s cubic-bezier(0.16, 1, 0.3, 1), height 0.28s cubic-bezier(0.16, 1, 0.3, 1), top 0.28s cubic-bezier(0.16, 1, 0.3, 1), left 0.28s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease, background-color 0.2s ease',
        }}
      >
        {cursorLabel}
      </div>
    </div>
  );
}

export function useMagnetic(strength = 0.24) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const hasHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!hasHover) return;

    const onMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dist = Math.hypot(e.clientX - centerX, e.clientY - centerY);

      if (dist < 70) {
        const dx = (e.clientX - centerX) * strength;
        const dy = (e.clientY - centerY) * strength;
        el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      } else {
        el.style.transform = 'translate3d(0, 0, 0)';
      }
    };

    const onMouseLeave = () => {
      el.style.transform = 'translate3d(0, 0, 0)';
    };

    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseleave', onMouseLeave);

    return () => {
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [strength]);

  return ref;
}
