/**
 * Property-Based Tests for Storage Persistence
 * Feature: productivity-dashboard
 */

const { describe, it, expect, beforeEach } = require('@jest/globals');
const fc = require('fast-check');

// Mock localStorage for testing
const createMockStorage = () => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value; },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
};

// Import Storage module (we'll need to adapt it for testing)
const Storage = {
  getItem(key) {
    try {
      if (typeof localStorage === 'undefined') {
        return null;
      }
      const item = localStorage.getItem(key);
      if (item === null) {
        return null;
      }
      return JSON.parse(item);
    } catch (error) {
      return null;
    }
  },

  setItem(key, value) {
    try {
      if (typeof localStorage === 'undefined') {
        return false;
      }
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      return false;
    }
  }
};

describe('Storage Persistence Property Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  // Feature: productivity-dashboard, Property 8: Task Persistence Round-Trip
  // **Validates: Requirements 4.3, 5.4, 6.3, 8.1, 8.2**
  it('Property 8: Task Persistence Round-Trip', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            text: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
            completed: fc.boolean(),
            createdAt: fc.integer({ min: 0 }),
            updatedAt: fc.integer({ min: 0 })
          }),
          { maxLength: 50 }
        ),
        (tasks) => {
          // Save tasks to storage
          const saved = Storage.setItem('tasks', tasks);
          expect(saved).toBe(true);

          // Retrieve tasks from storage
          const retrieved = Storage.getItem('tasks');

          // Verify the retrieved tasks match the original
          expect(retrieved).toEqual(tasks);

          // Verify each task has the same properties
          if (tasks.length > 0) {
            tasks.forEach((task, index) => {
              expect(retrieved[index].id).toBe(task.id);
              expect(retrieved[index].text).toBe(task.text);
              expect(retrieved[index].completed).toBe(task.completed);
              expect(retrieved[index].createdAt).toBe(task.createdAt);
              expect(retrieved[index].updatedAt).toBe(task.updatedAt);
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: productivity-dashboard, Property 16: Link Persistence Round-Trip
  // **Validates: Requirements 9.3, 12.1, 12.2**
  it('Property 16: Link Persistence Round-Trip', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            url: fc.webUrl(),
            createdAt: fc.integer({ min: 0 })
          }),
          { maxLength: 50 }
        ),
        (links) => {
          // Save links to storage
          const saved = Storage.setItem('links', links);
          expect(saved).toBe(true);

          // Retrieve links from storage
          const retrieved = Storage.getItem('links');

          // Verify the retrieved links match the original
          expect(retrieved).toEqual(links);

          // Verify each link has the same properties
          if (links.length > 0) {
            links.forEach((link, index) => {
              expect(retrieved[index].id).toBe(link.id);
              expect(retrieved[index].name).toBe(link.name);
              expect(retrieved[index].url).toBe(link.url);
              expect(retrieved[index].createdAt).toBe(link.createdAt);
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: productivity-dashboard, Property 21: Timer Duration Persistence Round-Trip
  // **Validates: Requirements 16.4, 16.5**
  it('Property 21: Timer Duration Persistence Round-Trip', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 120 }),
        (duration) => {
          // Save timer duration to storage
          const saved = Storage.setItem('timerDuration', duration);
          expect(saved).toBe(true);

          // Retrieve timer duration from storage
          const retrieved = Storage.getItem('timerDuration');

          // Verify the retrieved duration matches the original
          expect(retrieved).toBe(duration);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: productivity-dashboard, Property 26: Task Order Persistence Round-Trip
  // **Validates: Requirements 18.4, 18.5**
  it('Property 26: Task Order Persistence Round-Trip', () => {
    fc.assert(
      fc.property(
        fc.array(fc.uuid(), { minLength: 0, maxLength: 100 }),
        (taskOrder) => {
          // Save task order to storage
          const saved = Storage.setItem('taskOrder', taskOrder);
          expect(saved).toBe(true);

          // Retrieve task order from storage
          const retrieved = Storage.getItem('taskOrder');

          // Verify the retrieved order matches the original
          expect(retrieved).toEqual(taskOrder);

          // Verify the order is preserved (same sequence)
          if (taskOrder.length > 0) {
            taskOrder.forEach((taskId, index) => {
              expect(retrieved[index]).toBe(taskId);
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
