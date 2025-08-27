const testFramework = new TestFramework();

testFramework.describe('FileExporter Tests', function() {
    let exporter;
    let mockConversationManager;
    let mockEntries;

    this.beforeEach(() => {
        mockEntries = [
            {
                id: 1,
                startTime: '00:00:01,000',
                endTime: '00:00:03,000',
                speaker: 'John',
                text: 'Hello there',
                isModified: true,
                originalSpeaker: 'Speaker 1',
                originalText: 'Original text'
            },
            {
                id: 2,
                startTime: '00:00:03,000',
                endTime: '00:00:05,000',
                speaker: 'Sarah',
                text: 'How are you?',
                isModified: false,
                originalSpeaker: 'Sarah',
                originalText: 'How are you?'
            }
        ];

        mockConversationManager = {
            getEntries: () => mockEntries,
            getAllSpeakers: () => ['John', 'Sarah'],
            hasUnsavedChanges: () => true,
            currentFile: { name: 'test.srt' }
        };

        exporter = new FileExporter(mockConversationManager);
    });

    this.it('should generate SRT content correctly', () => {
        const srtContent = exporter.generateSRTContent(mockEntries);
        
        testFramework.expect(srtContent).toContain('1\n00:00:01,000 --> 00:00:03,000\nJohn: Hello there');
        testFramework.expect(srtContent).toContain('2\n00:00:03,000 --> 00:00:05,000\nSarah: How are you?');
    });

    this.it('should generate CSV content correctly', () => {
        const csvContent = exporter.generateCSVContent(mockEntries);
        
        testFramework.expect(csvContent).toContain('ID,Start Time,End Time,Speaker,Text,Modified,Original Speaker,Original Text');
        testFramework.expect(csvContent).toContain('1,"00:00:01,000","00:00:03,000","John","Hello there",Yes,"Speaker 1","Original text"');
    });

    this.it('should generate default filename correctly', () => {
        const filename = exporter.generateDefaultFilename('srt');
        
        testFramework.expect(filename).toContain('test_edited_');
        testFramework.expect(filename).toContain('.srt');
    });
});