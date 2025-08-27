# 🎬 SRT Transcript Editor

A powerful web-based application for editing SRT (SubRip) subtitle files with advanced speaker management and transcript editing capabilities.

## ✨ Features

- 📁 **File Import**: Drag-and-drop or browse to import SRT files
- 👥 **Speaker Management**: 
  - Global speaker renaming across entire conversation
  - Individual speaker assignment per entry
  - Automatic speaker detection and list management
- ✏️ **Transcript Editing**: Edit transcript text inline with auto-save
- 📊 **Table View**: Organized display of time, speaker, and transcript data
- 💾 **Export Options**: Save as SRT, JSON, CSV, or TXT formats
- ⚡ **Real-time Updates**: Instant visual feedback for changes
- 🔄 **Undo/Redo**: Full operation history with keyboard shortcuts
- 📱 **Responsive Design**: Works on desktop and mobile devices

## 🚀 Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- No server required - runs entirely in the browser

### Installation

1. **Clone or download** this repository to your local machine
2. **Navigate** to the project directory: `C:\DevJSHTMLApp`
3. **Open** `index.html` in your web browser

### Quick Start

1. **Open** the application by opening `index.html`
2. **Load an SRT file**:
   - Drag and drop an SRT file onto the drop zone, OR
   - Click "Browse" to select a file
3. **Edit speakers and transcript** as needed
4. **Export** your edited file using the Export button

## 📁 Project Structure

```
C:\DevJSHTMLApp/
├── index.html              # Main application page
├── styles.css              # Application styling
├── README.md              # This file
├── js/                    # JavaScript modules
│   ├── SRTParser.js       # SRT file parsing logic
│   ├── ConversationManager.js # Core data management
│   ├── SpeakerManager.js  # Speaker operations
│   ├── TableRenderer.js   # UI table rendering
│   ├── FileExporter.js    # Export functionality
│   └── app.js            # Main application controller
└── tests/                 # Unit tests
    ├── README.md          # Test documentation
    ├── test-runner.html   # Browser test runner
    ├── test-framework.js  # Testing framework
    ├── test-data.js       # Test data
    └── *.test.js         # Individual test files
```

## 🎯 How to Use

### Loading Files

1. **Drag and Drop**: Simply drag an SRT file onto the blue drop zone
2. **Browse**: Click the "Browse" button to select a file from your computer
3. **Supported Format**: Only `.srt` files are supported

### Managing Speakers

#### Global Speaker Renaming
1. Use the **Speaker Management** panel (appears after loading a file)
2. Enter new names in the "New Name" fields
3. Click **"Apply Global Changes"** to rename speakers throughout the entire transcript

#### Individual Speaker Assignment
1. In the conversation table, click the dropdown in the **Speaker** column
2. Select from existing speakers or the speaker will be added to the list
3. Changes are saved automatically

### Editing Transcripts

1. Click in any **Transcript** cell in the table
2. Edit the text directly - changes save automatically
3. Press **Tab** to navigate between fields
4. Press **Ctrl+Enter** to add a new entry

### Keyboard Shortcuts

- **Ctrl+Z**: Undo last change
- **Ctrl+Y** or **Ctrl+Shift+Z**: Redo last undone change
- **Ctrl+S**: Quick export as SRT
- **Tab**: Navigate between table cells
- **Ctrl+Enter**: Add new entry (when in transcript field)

### Exporting Files

1. Click the **"Export SRT"** button
2. Choose your preferred format:
   - **SRT**: Standard subtitle format
   - **JSON**: Structured data with metadata
   - **CSV**: Spreadsheet-compatible format
   - **TXT**: Plain text transcript
3. File will be automatically downloaded

## 📊 Understanding the Interface

### Header Section
- **File import area**: Drag-and-drop zone and browse button
- **File info**: Shows loaded filename and statistics
- **Export button**: Access to all export options

### Speaker Management Panel
- **Original**: Shows original speaker names from the file
- **New Name**: Enter replacement names
- **Apply Global Changes**: Replaces all instances of original names

### Conversation Table
- **Time**: Start and end timestamps (read-only)
- **Speaker**: Dropdown to assign/change speaker
- **Transcript**: Editable text content

### Status Footer
- Shows current application status and statistics

## 🔧 Technical Details

### Architecture

The application follows a modular architecture with clear separation of concerns:

- **SRTParser**: Handles file parsing and validation
- **ConversationManager**: Core data management with event system
- **SpeakerManager**: Speaker operations and deduplication
- **TableRenderer**: UI rendering and interaction handling
- **FileExporter**: Export functionality for multiple formats
- **App Controller**: Coordinates all modules and user interactions

### Data Flow

```
File Input → SRT Parser → Conversation Manager → Table Renderer → User Interactions → Data Updates → Export
                                ↓
                          Speaker Manager (for speaker operations)
```

### Browser Compatibility

- **Chrome**: 80+
- **Firefox**: 75+
- **Safari**: 13+
- **Edge**: 80+

## 🧪 Testing

The application includes comprehensive unit tests. See [`tests/README.md`](tests/README.md) for detailed testing information.

### Running Tests

1. Open `tests/test-runner.html` in your browser
2. Tests run automatically when the page loads
3. View results in the console output

### Test Coverage

- ✅ SRT file parsing and validation
- ✅ Speaker management operations  
- ✅ Conversation data management
- ✅ File export functionality
- ✅ Error handling and edge cases

## 📝 Sample Usage Instructions

Here's how to test the application with your sample file:

### Using the Sample File

1. Load `2025-08-13_18-19-15_with diarization of 5_-_BAD.srt`
2. **Speaker Changes**:
   - Rename "Speaker 1" → "David"
   - Rename "Speaker 2" → "Sarah"
   - Rename "Speaker 3" → "Mike" 
   - Rename "Speaker 4" → "Tom"
   - Rename "Speaker 5" → "Lisa"

3. **Text Editing Examples**:
   - Edit entry #1: Change text to something more readable
   - Edit entry #6: Fix any transcription errors
   - Edit entry #12: Update transcript content

4. **Export Results**:
   - Export as SRT to see cleaned up subtitles
   - Export as CSV to analyze conversation data
   - Export as TXT for readable transcript

### Expected Results

After applying changes:
- **Total Entries**: 27 (from your sample file)
- **Unique Speakers**: 5 (renamed speakers)
- **Modified Entries**: 8+ (depending on edits made)

## ⚠️ Limitations

- **File Size**: Large files (>10MB) may cause browser performance issues
- **Languages**: Supports all UTF-8 text (Hebrew, Arabic, etc.)
- **Format**: Only SRT format supported for import
- **Browser Storage**: Data is not persisted - always export your changes

## 🐛 Troubleshooting

### Common Issues

**File won't load:**
- Ensure file has `.srt` extension
- Check that file follows standard SRT format
- Try with a different browser

**Speakers not updating:**
- Make sure to click "Apply Global Changes"
- Check that new speaker names aren't empty
- Refresh page if interface becomes unresponsive

**Export not working:**
- Check browser's download settings
- Ensure pop-up blocker isn't interfering
- Try a different export format

**Performance issues:**
- Large files may be slow to process
- Close other browser tabs
- Try with a smaller file first

## 🆘 Support

If you encounter issues:

1. Check the browser console for error messages
2. Try refreshing the page
3. Test with a simple SRT file first
4. Ensure browser is up to date

## 🔮 Future Enhancements

Potential improvements for future versions:

- 🌐 Multiple language interface support
- 📤 Cloud storage integration  
- 🎵 Audio synchronization
- 🤖 Auto-transcription features
- 👥 Collaborative editing
- 📊 Advanced analytics
- 🎨 Themes and customization

## 📄 License

This project is open source. Feel free to use, modify, and distribute as needed.

---

**Enjoy using the SRT Transcript Editor! 🎬✨**