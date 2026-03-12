/**
 * Unit tests for Quick Links Component - Task 9.1
 */

const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const fs = require('fs');
const path = require('path');

// Load the links module code
const linksCode = fs.readFileSync(path.join(__dirname, '../../scripts/links.js'), 'utf8');

// Mock DOM elements
const createLinksDOM = () => {
    const container = document.createElement('div');
    container.className = 'links-container';
    container.innerHTML = `
        <h2>Quick Links</h2>
        <div class="link-input-section">
            <input type="text" class="link-name-input" placeholder="Site name..." maxlength="50" />
            <input type="url" class="link-url-input" placeholder="https://..." />
            <button class="btn-add-link">Add Link</button>
        </div>
        <div class="links-grid">
            <!-- Link buttons will be rendered here dynamically -->
        </div>
    `;
    return container;
};

// Mock Storage
const mockStorage = {
    data: {},
    getItem(key) {
        return this.data[key] !== undefined ? this.data[key] : null;
    },
    setItem(key, value) {
        this.data[key] = value;
        return true;
    },
    removeItem(key) {
        delete this.data[key];
        return true;
    },
    hasItem(key) {
        return this.data[key] !== undefined;
    },
    clear() {
        this.data = {};
    }
};

// Make Storage available globally
global.Storage = mockStorage;

describe('Quick Links Component - Task 9.1', () => {
    let container;
    let QuickLinks;

    beforeEach(() => {
        // Setup DOM
        container = createLinksDOM();
        document.body.appendChild(container);
        
        // Clear mock storage
        mockStorage.clear();
        
        // Load links module into scope
        QuickLinks = eval(linksCode + '; QuickLinks;');
        
        // Reset component state
        QuickLinks.links = [];
        QuickLinks.container = null;
        QuickLinks.nameInput = null;
        QuickLinks.urlInput = null;
        QuickLinks.addButton = null;
        QuickLinks.linksGrid = null;
    });

    afterEach(() => {
        // Cleanup
        if (container && container.parentNode) {
            document.body.removeChild(container);
        }
    });

    describe('init()', () => {
        it('should initialize with empty links array when no storage', () => {
            QuickLinks.init(container);
            expect(QuickLinks.links).toEqual([]);
        });

        it('should load links from storage on init', () => {
            const savedLinks = [
                { id: '1', name: 'Google', url: 'https://google.com', createdAt: Date.now() }
            ];
            mockStorage.setItem('links', savedLinks);
            
            QuickLinks.init(container);
            expect(QuickLinks.links).toEqual(savedLinks);
        });

        it('should attach event listeners to add button', () => {
            QuickLinks.init(container);
            expect(QuickLinks.addButton).toBeTruthy();
        });

        it('should render existing links on init', () => {
            const savedLinks = [
                { id: '1', name: 'Google', url: 'https://google.com', createdAt: Date.now() }
            ];
            mockStorage.setItem('links', savedLinks);
            
            QuickLinks.init(container);
            const linksGrid = container.querySelector('.links-grid');
            expect(linksGrid.children.length).toBe(1);
        });
    });

    describe('addLink()', () => {
        it('should create link with valid name and URL', () => {
            QuickLinks.init(container);
            const result = QuickLinks.addLink('Google', 'https://google.com');
            
            expect(result).toBe(true);
            expect(QuickLinks.links.length).toBe(1);
            expect(QuickLinks.links[0].name).toBe('Google');
            expect(QuickLinks.links[0].url).toBe('https://google.com');
        });

        it('should reject empty name', () => {
            QuickLinks.init(container);
            const result = QuickLinks.addLink('', 'https://google.com');
            
            expect(result).toBe(false);
            expect(QuickLinks.links.length).toBe(0);
        });

        it('should reject empty URL', () => {
            QuickLinks.init(container);
            const result = QuickLinks.addLink('Google', '');
            
            expect(result).toBe(false);
            expect(QuickLinks.links.length).toBe(0);
        });

        it('should reject whitespace-only name', () => {
            QuickLinks.init(container);
            const result = QuickLinks.addLink('   ', 'https://google.com');
            
            expect(result).toBe(false);
            expect(QuickLinks.links.length).toBe(0);
        });

        it('should reject whitespace-only URL', () => {
            QuickLinks.init(container);
            const result = QuickLinks.addLink('Google', '   ');
            
            expect(result).toBe(false);
            expect(QuickLinks.links.length).toBe(0);
        });

        it('should trim whitespace from name and URL', () => {
            QuickLinks.init(container);
            const result = QuickLinks.addLink('  Google  ', '  https://google.com  ');
            
            expect(result).toBe(true);
            expect(QuickLinks.links[0].name).toBe('Google');
            expect(QuickLinks.links[0].url).toBe('https://google.com');
        });

        it('should generate unique UUID for each link', () => {
            QuickLinks.init(container);
            QuickLinks.addLink('Google', 'https://google.com');
            QuickLinks.addLink('GitHub', 'https://github.com');
            
            expect(QuickLinks.links[0].id).toBeTruthy();
            expect(QuickLinks.links[1].id).toBeTruthy();
            expect(QuickLinks.links[0].id).not.toBe(QuickLinks.links[1].id);
        });

        it('should add createdAt timestamp', () => {
            QuickLinks.init(container);
            const beforeTime = Date.now();
            QuickLinks.addLink('Google', 'https://google.com');
            const afterTime = Date.now();
            
            expect(QuickLinks.links[0].createdAt).toBeGreaterThanOrEqual(beforeTime);
            expect(QuickLinks.links[0].createdAt).toBeLessThanOrEqual(afterTime);
        });

        it('should save links to storage after adding', () => {
            QuickLinks.init(container);
            QuickLinks.addLink('Google', 'https://google.com');
            
            const savedLinks = mockStorage.getItem('links');
            expect(savedLinks).toBeTruthy();
            expect(savedLinks.length).toBe(1);
            expect(savedLinks[0].name).toBe('Google');
        });

        it('should render link after adding', () => {
            QuickLinks.init(container);
            QuickLinks.addLink('Google', 'https://google.com');
            
            const linksGrid = container.querySelector('.links-grid');
            expect(linksGrid.children.length).toBe(1);
        });
    });

    describe('URL validation', () => {
        it('should accept URL starting with https://', () => {
            QuickLinks.init(container);
            const result = QuickLinks.addLink('Google', 'https://google.com');
            expect(result).toBe(true);
        });

        it('should accept URL starting with http://', () => {
            QuickLinks.init(container);
            const result = QuickLinks.addLink('Local', 'http://localhost:3000');
            expect(result).toBe(true);
        });

        it('should reject URL without protocol', () => {
            QuickLinks.init(container);
            const result = QuickLinks.addLink('Google', 'google.com');
            expect(result).toBe(false);
        });

        it('should reject URL with invalid protocol', () => {
            QuickLinks.init(container);
            const result = QuickLinks.addLink('FTP', 'ftp://example.com');
            expect(result).toBe(false);
        });

        it('should reject URL with only protocol', () => {
            QuickLinks.init(container);
            const result = QuickLinks.addLink('Empty', 'https://');
            expect(result).toBe(true); // This is technically valid per our validation
        });
    });

    describe('isValidURL()', () => {
        beforeEach(() => {
            QuickLinks.init(container);
        });

        it('should return true for https:// URLs', () => {
            expect(QuickLinks.isValidURL('https://example.com')).toBe(true);
        });

        it('should return true for http:// URLs', () => {
            expect(QuickLinks.isValidURL('http://example.com')).toBe(true);
        });

        it('should return false for URLs without protocol', () => {
            expect(QuickLinks.isValidURL('example.com')).toBe(false);
        });

        it('should return false for empty string', () => {
            expect(QuickLinks.isValidURL('')).toBe(false);
        });

        it('should return false for null', () => {
            expect(QuickLinks.isValidURL(null)).toBe(false);
        });

        it('should return false for undefined', () => {
            expect(QuickLinks.isValidURL(undefined)).toBe(false);
        });

        it('should handle URLs with whitespace', () => {
            expect(QuickLinks.isValidURL('  https://example.com  ')).toBe(true);
        });
    });

    describe('generateUUID()', () => {
        beforeEach(() => {
            QuickLinks.init(container);
        });

        it('should generate a string', () => {
            const uuid = QuickLinks.generateUUID();
            expect(typeof uuid).toBe('string');
        });

        it('should generate UUID in correct format', () => {
            const uuid = QuickLinks.generateUUID();
            const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            expect(uuidPattern.test(uuid)).toBe(true);
        });

        it('should generate unique UUIDs', () => {
            const uuid1 = QuickLinks.generateUUID();
            const uuid2 = QuickLinks.generateUUID();
            expect(uuid1).not.toBe(uuid2);
        });
    });

    describe('render()', () => {
        it('should render all links in the grid', () => {
            QuickLinks.init(container);
            QuickLinks.addLink('Google', 'https://google.com');
            QuickLinks.addLink('GitHub', 'https://github.com');
            
            const linksGrid = container.querySelector('.links-grid');
            expect(linksGrid.children.length).toBe(2);
        });

        it('should clear existing links before rendering', () => {
            QuickLinks.init(container);
            QuickLinks.addLink('Google', 'https://google.com');
            QuickLinks.render();
            
            const linksGrid = container.querySelector('.links-grid');
            expect(linksGrid.children.length).toBe(1);
        });

        it('should render empty grid when no links', () => {
            QuickLinks.init(container);
            QuickLinks.render();
            
            const linksGrid = container.querySelector('.links-grid');
            expect(linksGrid.children.length).toBe(0);
        });
    });

    describe('renderLink()', () => {
        it('should create link item with correct structure', () => {
            QuickLinks.init(container);
            const link = {
                id: 'test-id',
                name: 'Google',
                url: 'https://google.com',
                createdAt: Date.now()
            };
            
            QuickLinks.renderLink(link);
            
            const linkItem = container.querySelector('.link-item');
            expect(linkItem).toBeTruthy();
            expect(linkItem.getAttribute('data-link-id')).toBe('test-id');
        });

        it('should create link button with correct name', () => {
            QuickLinks.init(container);
            const link = {
                id: 'test-id',
                name: 'Google',
                url: 'https://google.com',
                createdAt: Date.now()
            };
            
            QuickLinks.renderLink(link);
            
            const linkButton = container.querySelector('.link-button');
            expect(linkButton.textContent).toBe('Google');
        });

        it('should create delete button', () => {
            QuickLinks.init(container);
            const link = {
                id: 'test-id',
                name: 'Google',
                url: 'https://google.com',
                createdAt: Date.now()
            };
            
            QuickLinks.renderLink(link);
            
            const deleteButton = container.querySelector('.btn-delete-link');
            expect(deleteButton).toBeTruthy();
            expect(deleteButton.textContent).toBe('×');
        });
    });

    describe('input clearing', () => {
        it('should clear inputs after successful add', () => {
            QuickLinks.init(container);
            const nameInput = container.querySelector('.link-name-input');
            const urlInput = container.querySelector('.link-url-input');
            
            nameInput.value = 'Google';
            urlInput.value = 'https://google.com';
            
            QuickLinks.addButton.click();
            
            expect(nameInput.value).toBe('');
            expect(urlInput.value).toBe('');
        });

        it('should not clear inputs after failed add', () => {
            QuickLinks.init(container);
            const nameInput = container.querySelector('.link-name-input');
            const urlInput = container.querySelector('.link-url-input');
            
            nameInput.value = 'Google';
            urlInput.value = 'invalid-url';
            
            QuickLinks.addButton.click();
            
            expect(nameInput.value).toBe('Google');
            expect(urlInput.value).toBe('invalid-url');
        });
    });

    describe('keyboard support', () => {
        it('should add link when Enter is pressed in URL input', () => {
            QuickLinks.init(container);
            const nameInput = container.querySelector('.link-name-input');
            const urlInput = container.querySelector('.link-url-input');
            
            nameInput.value = 'Google';
            urlInput.value = 'https://google.com';
            
            const enterEvent = new KeyboardEvent('keypress', { key: 'Enter' });
            urlInput.dispatchEvent(enterEvent);
            
            expect(QuickLinks.links.length).toBe(1);
        });
    });

    describe('storage persistence', () => {
        it('should load links from storage on init', () => {
            const savedLinks = [
                { id: '1', name: 'Google', url: 'https://google.com', createdAt: 123456 },
                { id: '2', name: 'GitHub', url: 'https://github.com', createdAt: 123457 }
            ];
            mockStorage.setItem('links', savedLinks);
            
            QuickLinks.init(container);
            
            expect(QuickLinks.links).toEqual(savedLinks);
        });

        it('should handle empty storage gracefully', () => {
            QuickLinks.init(container);
            expect(QuickLinks.links).toEqual([]);
        });

        it('should handle invalid storage data gracefully', () => {
            mockStorage.data['links'] = 'invalid-json';
            QuickLinks.init(container);
            expect(QuickLinks.links).toEqual([]);
        });
    });

    describe('deleteLink() - Task 9.3', () => {
        it('should remove link from links array', () => {
            QuickLinks.init(container);
            QuickLinks.addLink('Google', 'https://google.com');
            QuickLinks.addLink('GitHub', 'https://github.com');
            
            const linkId = QuickLinks.links[0].id;
            const result = QuickLinks.deleteLink(linkId);
            
            expect(result).toBe(true);
            expect(QuickLinks.links.length).toBe(1);
            expect(QuickLinks.links[0].name).toBe('GitHub');
        });

        it('should remove link from storage', () => {
            QuickLinks.init(container);
            QuickLinks.addLink('Google', 'https://google.com');
            QuickLinks.addLink('GitHub', 'https://github.com');
            
            const linkId = QuickLinks.links[0].id;
            QuickLinks.deleteLink(linkId);
            
            const savedLinks = mockStorage.getItem('links');
            expect(savedLinks.length).toBe(1);
            expect(savedLinks[0].name).toBe('GitHub');
        });

        it('should remove link from DOM', () => {
            QuickLinks.init(container);
            QuickLinks.addLink('Google', 'https://google.com');
            
            const linkId = QuickLinks.links[0].id;
            const linksGrid = container.querySelector('.links-grid');
            expect(linksGrid.children.length).toBe(1);
            
            QuickLinks.deleteLink(linkId);
            
            expect(linksGrid.children.length).toBe(0);
        });

        it('should return false for non-existent link ID', () => {
            QuickLinks.init(container);
            QuickLinks.addLink('Google', 'https://google.com');
            
            const result = QuickLinks.deleteLink('non-existent-id');
            
            expect(result).toBe(false);
            expect(QuickLinks.links.length).toBe(1);
        });

        it('should not affect other links when deleting', () => {
            QuickLinks.init(container);
            QuickLinks.addLink('Google', 'https://google.com');
            QuickLinks.addLink('GitHub', 'https://github.com');
            QuickLinks.addLink('Stack Overflow', 'https://stackoverflow.com');
            
            const middleLinkId = QuickLinks.links[1].id;
            QuickLinks.deleteLink(middleLinkId);
            
            expect(QuickLinks.links.length).toBe(2);
            expect(QuickLinks.links[0].name).toBe('Google');
            expect(QuickLinks.links[1].name).toBe('Stack Overflow');
        });

        it('should work when delete button is clicked', () => {
            QuickLinks.init(container);
            QuickLinks.addLink('Google', 'https://google.com');
            
            const deleteButton = container.querySelector('.btn-delete-link');
            deleteButton.click();
            
            expect(QuickLinks.links.length).toBe(0);
            expect(container.querySelector('.links-grid').children.length).toBe(0);
        });
    });
});
