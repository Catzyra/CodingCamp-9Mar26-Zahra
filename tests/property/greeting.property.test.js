/**
 * Property-Based Tests for Greeting Display Component
 * Feature: productivity-dashboard
 */

const { describe, it, expect } = require('@jest/globals');
const fc = require('fast-check');
const fs = require('fs');
const path = require('path');

// Load the greeting.js file and extract the functions
const greetingScript = fs.readFileSync(
  path.join(__dirname, '../../scripts/greeting.js'),
  'utf8'
);

// Create a mock GreetingDisplay object by evaluating the script
const createGreetingDisplay = () => {
  // Execute the script and extract GreetingDisplay
  const GreetingDisplay = eval(greetingScript + '; GreetingDisplay;');
  return GreetingDisplay;
};

describe('Greeting Display Property Tests', () => {
  // Feature: productivity-dashboard, Property 1: Time Formatting
  // **Validates: Requirements 1.1**
  it('Property 1: Time Formatting', () => {
    const GreetingDisplay = createGreetingDisplay();
    
    fc.assert(
      fc.property(
        fc.date(),
        (date) => {
          const formatted = GreetingDisplay.formatTime(date);
          
          // Should match 12-hour format with AM/PM pattern
          const timePattern = /^(1[0-2]|[1-9]):[0-5][0-9] (AM|PM)$/;
          expect(formatted).toMatch(timePattern);
          
          // Verify the time components
          const hours = date.getHours();
          const minutes = date.getMinutes();
          const expectedAmPm = hours >= 12 ? 'PM' : 'AM';
          let expectedHour = hours % 12;
          expectedHour = expectedHour === 0 ? 12 : expectedHour;
          const expectedMinutes = minutes < 10 ? '0' + minutes : minutes.toString();
          
          expect(formatted).toBe(`${expectedHour}:${expectedMinutes} ${expectedAmPm}`);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: productivity-dashboard, Property 2: Date Formatting
  // **Validates: Requirements 1.2**
  it('Property 2: Date Formatting', () => {
    const GreetingDisplay = createGreetingDisplay();
    
    fc.assert(
      fc.property(
        fc.date(),
        (date) => {
          const formatted = GreetingDisplay.formatDate(date);
          
          // Should contain day of week, month name, and day number
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December'];
          
          const expectedDay = days[date.getDay()];
          const expectedMonth = months[date.getMonth()];
          const expectedDate = date.getDate();
          
          const expected = `${expectedDay}, ${expectedMonth} ${expectedDate}`;
          expect(formatted).toBe(expected);
          
          // Verify format pattern
          const datePattern = /^(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday), (January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}$/;
          expect(formatted).toMatch(datePattern);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: productivity-dashboard, Property 3: Time-Based Greeting
  // **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
  it('Property 3: Time-Based Greeting', () => {
    const GreetingDisplay = createGreetingDisplay();
    
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 23 }),
        (hour) => {
          const greeting = GreetingDisplay.getGreeting(hour);
          
          // Verify greeting matches the time period
          if (hour >= 5 && hour < 12) {
            expect(greeting).toBe('Good Morning');
          } else if (hour >= 12 && hour < 17) {
            expect(greeting).toBe('Good Afternoon');
          } else if (hour >= 17 && hour < 21) {
            expect(greeting).toBe('Good Evening');
          } else {
            // hour >= 21 || hour < 5
            expect(greeting).toBe('Good Night');
          }
          
          // Verify greeting is one of the valid options
          const validGreetings = ['Good Morning', 'Good Afternoon', 'Good Evening', 'Good Night'];
          expect(validGreetings).toContain(greeting);
        }
      ),
      { numRuns: 100 }
    );
  });
});
