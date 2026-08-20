import { render, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { useInactivityTimeout } from '../hooks/useInactivityTimeout';

const TestComponent = ({ timeoutMs, onTimeout, isActive }: any) => {
  useInactivityTimeout(timeoutMs, onTimeout, isActive);
  return <div data-testid="test-comp">Test</div>;
};

describe('useInactivityTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('calls onTimeout after the specified duration of inactivity', () => {
    const onTimeout = vi.fn();
    render(<TestComponent timeoutMs={1000} onTimeout={onTimeout} isActive={true} />);

    expect(onTimeout).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1001);
    });

    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it('resets the timer on user activity', () => {
    const onTimeout = vi.fn();
    render(<TestComponent timeoutMs={1000} onTimeout={onTimeout} isActive={true} />);

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(onTimeout).not.toHaveBeenCalled();

    // Trigger activity
    act(() => {
      const event = new Event('mousemove');
      window.dispatchEvent(event);
    });

    act(() => {
      vi.advanceTimersByTime(600); // 500 + 600 = 1100 total, but reset at 500
    });
    expect(onTimeout).not.toHaveBeenCalled(); // Should still be running the new 1000ms timer

    act(() => {
      vi.advanceTimersByTime(500); // Total 1100 since last reset
    });
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it('does not set timers if isActive is false', () => {
    const onTimeout = vi.fn();
    render(<TestComponent timeoutMs={1000} onTimeout={onTimeout} isActive={false} />);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(onTimeout).not.toHaveBeenCalled();
  });
});
