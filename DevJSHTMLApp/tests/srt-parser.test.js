const testFramework = new TestFramework();

testFramework.describe('SRTParser Tests', function() {
    let parser;

    this.beforeEach(() => {
        parser = new SRTParser();
    });

    this.it('should parse valid SRT content correctly', () => {
        const result = parser.parseFile(TestData.testSRTContent);
        
        testFramework.expect(result.entries).toHaveLength(5);
        testFramework.expect(result.speakers).toHaveLength(3);
        testFramework.expect(result.speakers).toContain('Speaker 1');
        testFramework.expect(result.speakers).toContain('Speaker 2');
        testFramework.expect(result.speakers).toContain('Speaker 3');
    });

    this.it('should extract speaker and text correctly', () => {
        const result = parser.parseFile(TestData.testSRTContent);
        const firstEntry = result.entries[0];
        
        testFramework.expect(firstEntry.speaker).toBe('Speaker 1');
        testFramework.expect(firstEntry.text).toBe('משהו מאוד עמוק, מוערך.');
        testFramework.expect(firstEntry.startTime).toBe('00:00:01,000');
        testFramework.expect(firstEntry.endTime).toBe('00:00:03,000');
    });

    this.it('should validate SRT format correctly', () => {
        const validResult = parser.validateSRTFormat(TestData.testSRTContent);
        testFramework.expect(validResult.isValid).toBeTruthy();
        testFramework.expect(validResult.errors).toHaveLength(0);
        
        const invalidResult = parser.validateSRTFormat(TestData.invalidSRTContent);
        testFramework.expect(invalidResult.isValid).toBeFalsy();
        testFramework.expect(invalidResult.errors.length).toBeGreaterThan(0);
    });

    this.it('should convert time to seconds correctly', () => {
        const seconds = parser.timeToSeconds('00:01:30,500');
        testFramework.expect(seconds).toBe(90.5);
        
        const zeroSeconds = parser.timeToSeconds('00:00:00,000');
        testFramework.expect(zeroSeconds).toBe(0);
    });

    this.it('should convert seconds to time format correctly', () => {
        const timeString = parser.secondsToTime(90.5);
        testFramework.expect(timeString).toBe('00:01:30,500');
        
        const zeroTime = parser.secondsToTime(0);
        testFramework.expect(zeroTime).toBe('00:00:00,000');
    });

    this.it('should sort entries by time correctly', () => {
        const unsortedEntries = [
            { startTime: '00:00:30,000', id: 3 },
            { startTime: '00:00:01,000', id: 1 },
            { startTime: '00:00:15,000', id: 2 }
        ];
        
        const sorted = parser.sortEntriesByTime(unsortedEntries);
        
        testFramework.expect(sorted[0].id).toBe(1);
        testFramework.expect(sorted[1].id).toBe(2);
        testFramework.expect(sorted[2].id).toBe(3);
    });

    this.it('should calculate file statistics correctly', () => {
        const result = parser.parseFile(TestData.testSRTContent);
        const stats = parser.getFileStatistics(result.entries);
        
        testFramework.expect(stats.totalEntries).toBe(5);
        testFramework.expect(stats.uniqueSpeakers).toBe(3);
        testFramework.expect(stats.modifiedEntries).toBe(0);
    });

    this.it('should handle empty content gracefully', () => {
        const result = parser.parseFile('');
        testFramework.expect(result.entries).toHaveLength(0);
        testFramework.expect(result.speakers).toHaveLength(0);
    });

    this.it('should handle malformed blocks gracefully', () => {
        const malformedContent = `1
00:00:01,000 --> 00:00:03,000

2
invalid time format
Speaker: Some text`;
        
        const result = parser.parseFile(malformedContent);
        testFramework.expect(result.entries).toHaveLength(1);
    });
});