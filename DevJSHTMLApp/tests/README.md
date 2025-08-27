# SRT Editor - Unit Tests

This directory contains comprehensive unit tests for the SRT Editor application using a custom lightweight testing framework.

## 📁 Test Structure

```
tests/
├── README.md              # This file
├── test-framework.js       # Custom testing framework
├── test-data.js           # Test data and sample SRT content
├── test-runner.html       # Browser-based test runner
├── srt-parser.test.js     # Tests for SRTParser class
├── speaker-manager.test.js # Tests for SpeakerManager class  
├── conversation-manager.test.js # Tests for ConversationManager class
└── file-exporter.test.js  # Tests for FileExporter class
```

## 🚀 Running Tests

### Method 1: Browser Test Runner (Recommended)

1. Open `test-runner.html` in your web browser
2. Tests will run automatically when the page loads
3. Click "▶️ Run All Tests" to re-run tests
4. View results in the console output area

### Method 2: Manual Console Testing

1. Open your browser's developer console
2. Load the main application page (`index.html`)
3. Load each test file manually in the console
4. Tests will execute and display results

## 🧪 Test Coverage

### SRTParser Tests
- ✅ Parse valid SRT content
- ✅ Extract speaker and text correctly
- ✅ Validate SRT format
- ✅ Convert time formats (seconds ↔ SRT format)
- ✅ Sort entries by time
- ✅ Calculate file statistics
- ✅ Handle malformed content gracefully

### SpeakerManager Tests
- ✅ Add/remove speakers
- ✅ Rename speakers
- ✅ Prevent duplicate speakers
- ✅ Merge similar speakers
- ✅ Detect duplicate speakers
- ✅ Calculate string similarity
- ✅ Export/import speaker data
- ✅ Filter speakers by pattern

### ConversationManager Tests
- ✅ Load SRT files
- ✅ Update entry content
- ✅ Global speaker renaming
- ✅ Undo/redo operations
- ✅ Export to SRT format
- ✅ Detect unsaved changes
- ✅ Add/delete entries
- ✅ Sort entries by time

### FileExporter Tests
- ✅ Generate SRT content
- ✅ Generate CSV content  
- ✅ Generate TXT content
- ✅ Generate default filenames
- ✅ Escape CSV fields
- ✅ Sort entries by time
- ✅ Export statistics
- ✅ Multiple format export

## 📊 Test Instructions Format

The tests include a sample instruction format for testing speaker changes and text edits:

```javascript
const testInstructions = {
    speakerChanges: [
        { from: 'Speaker 1', to: 'John' },
        { from: 'Speaker 2', to: 'Sarah' },
        { from: 'Speaker 3', to: 'Mike' }
    ],
    textEdits: [
        { id: 1, newText: 'Updated transcript text...' },
        { id: 2, newText: 'Another updated text...' }
    ],
    expectedResults: {
        totalEntries: 5,
        uniqueSpeakers: 3,
        modifiedEntries: 4
    }
};
```

## 🔧 Custom Test Framework Features

Our lightweight test framework provides:

- **describe()** - Test suite grouping
- **it()** - Individual test cases
- **beforeEach()** - Setup before each test
- **afterEach()** - Cleanup after each test
- **expect()** - Assertion library with methods:
  - `toBe()`, `toEqual()`, `toBeTruthy()`, `toBeFalsy()`
  - `toContain()`, `toHaveLength()`, `toThrow()`
  - `toBeGreaterThan()`, `toBeLessThan()`, `toBeInstanceOf()`
- **Mocking** - Simple mock functions with call tracking
- **Async Support** - `waitFor()` and `sleep()` utilities

## 📈 Expected Results

When running the test suite, you should see output similar to:

```
📋 SRTParser Tests
==================================================
  ✅ should parse valid SRT content correctly
  ✅ should extract speaker and text correctly
  ✅ should validate SRT format correctly
  ✅ should convert time to seconds correctly
  ...

📊 Results: 8 passed, 0 failed (45ms)

🏁 Test Summary
==================================================
SRTParser Tests: 8 passed, 0 failed (45ms)
SpeakerManager Tests: 12 passed, 0 failed (32ms)
ConversationManager Tests: 9 passed, 0 failed (78ms)
FileExporter Tests: 8 passed, 0 failed (23ms)

📈 Overall: 37 passed, 0 failed (178ms)
🎉 All tests passed!
```

## 🐛 Troubleshooting

**Tests not running:**
- Ensure all JavaScript files are loaded correctly
- Check browser console for syntax errors
- Verify file paths are correct

**Async tests failing:**
- Tests involving file operations may need longer timeouts
- Check that mock objects are properly configured

**Framework errors:**
- Ensure the test framework is loaded before test files
- Verify all application classes are available globally

## 📝 Adding New Tests

1. Create a new test file: `[component-name].test.js`
2. Use the test framework pattern:
   ```javascript
   const testFramework = new TestFramework();
   
   testFramework.describe('Component Tests', function() {
       this.beforeEach(() => {
           // Setup
       });
       
       this.it('should do something', () => {
           // Test logic
           testFramework.expect(result).toBe(expected);
       });
   });
   ```
3. Add the test file to `test-runner.html`
4. Run tests and verify results

## 📋 Test Data

The `test-data.js` file contains:
- Sample SRT content in Hebrew (from the provided example)
- Modified SRT content with English translations
- Invalid SRT content for error testing
- Test instruction templates for manual testing

This test suite ensures the SRT Editor application works correctly across all major functionality areas.