const testFramework = new TestFramework();

testFramework.describe('ConversationManager Tests', function() {
    let manager;
    let mockFile;

    this.beforeEach(() => {
        manager = new ConversationManager();
        
        mockFile = {
            name: 'test.srt',
            size: 1000,
            type: 'text/plain'
        };

        global.FileReader = class MockFileReader {
            readAsText(file) {
                setTimeout(() => {
                    this.result = TestData.testSRTContent;
                    this.onload({ target: { result: this.result } });
                }, 0);
            }
        };
    });

    this.it('should load file successfully', async () => {
        let fileLoaded = false;
        manager.addEventListener('fileLoaded', () => {
            fileLoaded = true;
        });

        await manager.loadFile(mockFile);
        
        await testFramework.waitFor(() => fileLoaded);
        
        testFramework.expect(manager.getEntries()).toHaveLength(5);
        testFramework.expect(manager.getAllSpeakers()).toHaveLength(3);
    });

    this.it('should update entry correctly', async () => {
        await manager.loadFile(mockFile);
        await testFramework.waitFor(() => manager.getEntries().length > 0);
        
        const success = manager.updateEntry(1, 'text', 'Updated text');
        testFramework.expect(success).toBeTruthy();
        
        const entry = manager.getEntry(1);
        testFramework.expect(entry.text).toBe('Updated text');
        testFramework.expect(entry.isModified).toBeTruthy();
    });

    this.it('should perform global speaker rename correctly', async () => {
        await manager.loadFile(mockFile);
        await testFramework.waitFor(() => manager.getEntries().length > 0);
        
        const changedCount = manager.globalRenameSpeaker('Speaker 1', 'John');
        
        testFramework.expect(changedCount).toBe(1);
        
        const entries = manager.getEntries();
        const renamedEntry = entries.find(e => e.speaker === 'John');
        testFramework.expect(renamedEntry).toBeTruthy();
        testFramework.expect(renamedEntry.isModified).toBeTruthy();
    });

    this.it('should handle undo/redo operations', async () => {
        await manager.loadFile(mockFile);
        await testFramework.waitFor(() => manager.getEntries().length > 0);
        
        const originalText = manager.getEntry(1).text;
        manager.updateEntry(1, 'text', 'Modified text');
        
        testFramework.expect(manager.getEntry(1).text).toBe('Modified text');
        
        const undoSuccess = manager.undo();
        testFramework.expect(undoSuccess).toBeTruthy();
        testFramework.expect(manager.getEntry(1).text).toBe(originalText);
        
        const redoSuccess = manager.redo();
        testFramework.expect(redoSuccess).toBeTruthy();
        testFramework.expect(manager.getEntry(1).text).toBe('Modified text');
    });

    this.it('should export to SRT format correctly', async () => {
        await manager.loadFile(mockFile);
        await testFramework.waitFor(() => manager.getEntries().length > 0);
        
        manager.updateEntry(1, 'speaker', 'John');
        manager.updateEntry(1, 'text', 'Updated text');
        
        const srtContent = manager.exportToSRT();
        
        testFramework.expect(srtContent).toContain('John: Updated text');
        testFramework.expect(srtContent).toContain('00:00:01,000 --> 00:00:03,000');
    });

    this.it('should detect unsaved changes', async () => {
        await manager.loadFile(mockFile);
        await testFramework.waitFor(() => manager.getEntries().length > 0);
        
        testFramework.expect(manager.hasUnsavedChanges()).toBeFalsy();
        
        manager.updateEntry(1, 'text', 'Changed text');
        testFramework.expect(manager.hasUnsavedChanges()).toBeTruthy();
    });

    this.it('should add new entry correctly', async () => {
        await manager.loadFile(mockFile);
        await testFramework.waitFor(() => manager.getEntries().length > 0);
        
        const initialCount = manager.getEntries().length;
        
        const newEntry = manager.addEntry(2, {
            startTime: '00:00:25,000',
            endTime: '00:00:27,000',
            speaker: 'New Speaker',
            text: 'New text content'
        });
        
        testFramework.expect(manager.getEntries()).toHaveLength(initialCount + 1);
        testFramework.expect(newEntry.speaker).toBe('New Speaker');
        testFramework.expect(newEntry.isModified).toBeTruthy();
    });

    this.it('should delete entry correctly', async () => {
        await manager.loadFile(mockFile);
        await testFramework.waitFor(() => manager.getEntries().length > 0);
        
        const initialCount = manager.getEntries().length;
        
        const deleteSuccess = manager.deleteEntry(3);
        testFramework.expect(deleteSuccess).toBeTruthy();
        testFramework.expect(manager.getEntries()).toHaveLength(initialCount - 1);
        
        const deletedEntry = manager.getEntry(3);
        testFramework.expect(deletedEntry).toBeTruthy();
    });

    this.it('should sort entries by time correctly', async () => {
        await manager.loadFile(mockFile);
        await testFramework.waitFor(() => manager.getEntries().length > 0);
        
        manager.sortByTime();
        const entries = manager.getEntries();
        
        for (let i = 1; i < entries.length; i++) {
            const prevTime = manager.parser.timeToSeconds(entries[i-1].startTime);
            const currTime = manager.parser.timeToSeconds(entries[i].startTime);
            testFramework.expect(prevTime).toBeLessThan(currTime + 1);
        }
    });
});