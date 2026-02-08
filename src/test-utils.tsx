/**
 * Common test utilities and helpers
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';

/**
 * Custom render function that includes common providers
 */
export const renderWithProviders = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
  };

  return render(ui, { wrapper: AllTheProviders, ...options });
};

/**
 * Create mock validators for testing
 */
export const createMockValidators = () => ({
  email: (value: string) => {
    if (!value) return 'Email is required';
    if (!value.includes('@')) return 'Invalid email format';
    return '';
  },
  password: (value: string) => {
    if (!value) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    return '';
  },
  name: (value: string) => {
    if (!value) return 'Name is required';
    if (value.length < 2) return 'Name must be at least 2 characters';
    return '';
  },
});

/**
 * Create mock API responses
 */
export const createMockInstructor = (overrides = {}) => ({
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  rating: 4.5,
  reviews: 25,
  hourlyRate: 50,
  bio: 'Experienced driving instructor',
  avatar: 'https://example.com/avatar.jpg',
  ...overrides,
});

export const createMockLesson = (overrides = {}) => ({
  id: '1',
  title: 'Basic Driving Skills',
  instructorId: '1',
  studentId: '1',
  startTime: new Date().toISOString(),
  endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  duration: 60,
  status: 'confirmed',
  price: 50,
  ...overrides,
});

export const createMockBooking = (overrides = {}) => ({
  id: '1',
  instructorId: '1',
  studentId: '1',
  lessonId: '1',
  status: 'confirmed',
  createdAt: new Date().toISOString(),
  ...overrides,
});

/**
 * Mock fetch for API testing
 */
export const mockFetch = (data: any, options: { status?: number; delay?: number } = {}) => {
  const { status = 200, delay = 0 } = options;

  return jest.fn(() =>
    new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ok: status >= 200 && status < 300,
          status,
          json: jest.fn(() => Promise.resolve(data)),
          text: jest.fn(() => Promise.resolve(JSON.stringify(data))),
        });
      }, delay);
    })
  );
};

/**
 * Flush all pending promises
 */
export const flushPromises = () => {
  return new Promise((resolve) => setImmediate(resolve));
};

/**
 * Wait for element to appear
 */
export const waitForElement = (
  callback: () => HTMLElement,
  options: { timeout?: number } = {}
) => {
  const { timeout = 1000 } = options;
  const startTime = Date.now();

  return new Promise<HTMLElement>((resolve, reject) => {
    const checkElement = () => {
      try {
        const element = callback();
        resolve(element);
      } catch (error) {
        if (Date.now() - startTime > timeout) {
          reject(error);
        } else {
          setTimeout(checkElement, 50);
        }
      }
    };

    checkElement();
  });
};

export default {
  renderWithProviders,
  createMockValidators,
  createMockInstructor,
  createMockLesson,
  createMockBooking,
  mockFetch,
  flushPromises,
  waitForElement,
};
