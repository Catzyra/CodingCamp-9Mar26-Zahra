/**
 * Property-Based Tests for Accessibility
 * Feature: productivity-dashboard
 */

const { describe, it, expect } = require('@jest/globals');
const fc = require('fast-check');
const fs = require('fs');
const path = require('path');

/**
 * Calculate relative luminance of a color
 * @param {number} r - Red value (0-255)
 * @param {number} g - Green value (0-255)
 * @param {number} b - Blue value (0-255)
 * @returns {number} Relative luminance
 */
function getRelativeLuminance(r, g, b) {
  // Convert to 0-1 range
  const [rs, gs, bs] = [r, g, b].map(val => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * @param {string} color1 - Hex color (e.g., '#ffffff')
 * @param {string} color2 - Hex color (e.g., '#000000')
 * @returns {number} Contrast ratio
 */
function getContrastRatio(color1, color2) {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  const l1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Convert hex color to RGB
 * @param {string} hex - Hex color (e.g., '#ffffff' or '#fff')
 * @returns {{r: number, g: number, b: number}}
 */
function hexToRgb(hex) {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Handle 3-digit hex
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return { r, g, b };
}

/**
 * Extract color pairs from CSS file
 * Returns array of {text, background, context} objects
 */
function extractColorPairs() {
  const cssPath = path.join(__dirname, '../../styles/main.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  
  // Extract CSS variables
  const colorVars = {};
  const varPattern = /--([\w-]+):\s*(#[0-9a-fA-F]{3,6})/g;
  let match;
  
  while ((match = varPattern.exec(cssContent)) !== null) {
    colorVars[match[1]] = match[2];
  }
  
  // Define color pairs to test based on the CSS
  const colorPairs = [
    // Primary text on white background
    {
      text: colorVars['text-primary'],
      background: colorVars['surface-color'],
      context: 'Primary text on white surface'
    },
    // Secondary text on white background
    {
      text: colorVars['text-secondary'],
      background: colorVars['surface-color'],
      context: 'Secondary text on white surface'
    },
    // Primary text on light background
    {
      text: colorVars['text-primary'],
      background: colorVars['background-color'],
      context: 'Primary text on light background'
    },
    // Secondary text on light background
    {
      text: colorVars['text-secondary'],
      background: colorVars['background-color'],
      context: 'Secondary text on light background'
    },
    // White text on primary color (buttons)
    {
      text: '#ffffff',
      background: colorVars['primary-color'],
      context: 'White text on primary button'
    },
    // White text on secondary color
    {
      text: '#ffffff',
      background: colorVars['secondary-color'],
      context: 'White text on secondary button'
    },
    // White text on error color
    {
      text: '#ffffff',
      background: colorVars['error-color'],
      context: 'White text on error button'
    },
    // White text on success color
    {
      text: '#ffffff',
      background: colorVars['success-color'],
      context: 'White text on success button'
    },
    // Error text on error background
    {
      text: colorVars['error-color'],
      background: colorVars['error-bg'],
      context: 'Error text on error background'
    },
    // Success text on success background
    {
      text: colorVars['success-color'],
      background: colorVars['success-bg'],
      context: 'Success text on success background'
    },
    // Warning text on warning background
    {
      text: colorVars['warning-color'],
      background: colorVars['warning-bg'],
      context: 'Warning text on warning background'
    },
    // Primary text on notification background
    {
      text: colorVars['text-primary'],
      background: colorVars['background-color'],
      context: 'Primary text on notification background'
    }
  ];
  
  return colorPairs;
}

describe('Accessibility Property Tests', () => {
  // Feature: productivity-dashboard, Property 27: Color Contrast Compliance
  // **Validates: Requirements 15.3**
  it('Property 27: Color Contrast Compliance', () => {
    const colorPairs = extractColorPairs();
    const WCAG_AA_MINIMUM = 4.5;
    
    fc.assert(
      fc.property(
        fc.constantFrom(...colorPairs),
        (colorPair) => {
          const { text, background, context } = colorPair;
          
          // Calculate contrast ratio
          const contrastRatio = getContrastRatio(text, background);
          
          // Verify it meets WCAG AA standard (4.5:1 minimum)
          expect(contrastRatio).toBeGreaterThanOrEqual(WCAG_AA_MINIMUM);
          
          // Additional context for debugging if test fails
          if (contrastRatio < WCAG_AA_MINIMUM) {
            console.error(`Failed: ${context}`);
            console.error(`Text: ${text}, Background: ${background}`);
            console.error(`Contrast ratio: ${contrastRatio.toFixed(2)}:1`);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // Additional test: Verify all color pairs meet minimum contrast
  it('All defined color pairs meet WCAG AA standards', () => {
    const colorPairs = extractColorPairs();
    const WCAG_AA_MINIMUM = 4.5;
    const failures = [];
    
    colorPairs.forEach(({ text, background, context }) => {
      const contrastRatio = getContrastRatio(text, background);
      
      if (contrastRatio < WCAG_AA_MINIMUM) {
        failures.push({
          context,
          text,
          background,
          contrastRatio: contrastRatio.toFixed(2)
        });
      }
    });
    
    if (failures.length > 0) {
      console.error('Color contrast failures:');
      failures.forEach(f => {
        console.error(`  ${f.context}: ${f.contrastRatio}:1 (text: ${f.text}, bg: ${f.background})`);
      });
    }
    
    expect(failures).toHaveLength(0);
  });
});
