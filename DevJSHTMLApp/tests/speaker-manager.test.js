const testFramework = new TestFramework();

testFramework.describe('SpeakerManager Tests', function() {
    let speakerManager;

    this.beforeEach(() => {
        speakerManager = new SpeakerManager();
    });

    this.it('should initialize with empty speaker list', () => {
        testFramework.expect(speakerManager.getAllSpeakers()).toHaveLength(0);
        testFramework.expect(speakerManager.getSpeakerCount()).toBe(0);
    });

    this.it('should add speakers correctly', () => {
        const success1 = speakerManager.addSpeaker('John');
        const success2 = speakerManager.addSpeaker('Sarah');
        
        testFramework.expect(success1).toBeTruthy();
        testFramework.expect(success2).toBeTruthy();
        testFramework.expect(speakerManager.getSpeakerCount()).toBe(2);
        testFramework.expect(speakerManager.getAllSpeakers()).toContain('John');
        testFramework.expect(speakerManager.getAllSpeakers()).toContain('Sarah');
    });

    this.it('should not add duplicate speakers', () => {
        speakerManager.addSpeaker('John');
        const duplicateSuccess = speakerManager.addSpeaker('John');
        
        testFramework.expect(duplicateSuccess).toBeFalsy();
        testFramework.expect(speakerManager.getSpeakerCount()).toBe(1);
    });

    this.it('should rename speakers correctly', () => {
        speakerManager.addSpeaker('John');
        
        const renameSuccess = speakerManager.renameSpeaker('John', 'Johnny');
        
        testFramework.expect(renameSuccess).toBeTruthy();
        testFramework.expect(speakerManager.hasSpeaker('John')).toBeFalsy();
        testFramework.expect(speakerManager.hasSpeaker('Johnny')).toBeTruthy();
    });

    this.it('should not rename to existing speaker name', () => {
        speakerManager.addSpeaker('John');
        speakerManager.addSpeaker('Sarah');
        
        const renameSuccess = speakerManager.renameSpeaker('John', 'Sarah');
        
        testFramework.expect(renameSuccess).toBeFalsy();
        testFramework.expect(speakerManager.hasSpeaker('John')).toBeTruthy();
    });

    this.it('should remove speakers correctly', () => {
        speakerManager.addSpeaker('John');
        speakerManager.addSpeaker('Sarah');
        
        const removeSuccess = speakerManager.removeSpeaker('John');
        
        testFramework.expect(removeSuccess).toBeTruthy();
        testFramework.expect(speakerManager.getSpeakerCount()).toBe(1);
        testFramework.expect(speakerManager.hasSpeaker('John')).toBeFalsy();
        testFramework.expect(speakerManager.hasSpeaker('Sarah')).toBeTruthy();
    });

    this.it('should set speakers from array correctly', () => {
        const speakers = ['Alice', 'Bob', 'Charlie'];
        speakerManager.setSpeakers(speakers);
        
        testFramework.expect(speakerManager.getSpeakerCount()).toBe(3);
        testFramework.expect(speakerManager.getAllSpeakers()).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    this.it('should filter speakers by pattern', () => {
        speakerManager.setSpeakers(['John Smith', 'Jane Smith', 'Bob Jones', 'Alice Johnson']);
        
        const smithSpeakers = speakerManager.getSpeakersByPattern('Smith');
        testFramework.expect(smithSpeakers).toHaveLength(2);
        testFramework.expect(smithSpeakers).toContain('John Smith');
        testFramework.expect(smithSpeakers).toContain('Jane Smith');
        
        const johnSpeakers = speakerManager.getSpeakersByPattern('John');
        testFramework.expect(johnSpeakers).toHaveLength(2);
        testFramework.expect(johnSpeakers).toContain('John Smith');
        testFramework.expect(johnSpeakers).toContain('Alice Johnson');
    });

    this.it('should merge speakers correctly', () => {
        speakerManager.setSpeakers(['John', 'Johnny', 'J. Smith', 'Sarah']);
        
        const mergedCount = speakerManager.mergeSpeakers(['Johnny', 'J. Smith'], 'John');
        
        testFramework.expect(mergedCount).toBeTruthy();
        testFramework.expect(speakerManager.getSpeakerCount()).toBe(2);
        testFramework.expect(speakerManager.hasSpeaker('John')).toBeTruthy();
        testFramework.expect(speakerManager.hasSpeaker('Sarah')).toBeTruthy();
        testFramework.expect(speakerManager.hasSpeaker('Johnny')).toBeFalsy();
        testFramework.expect(speakerManager.hasSpeaker('J. Smith')).toBeFalsy();
    });

    this.it('should detect duplicate speakers correctly', () => {
        speakerManager.setSpeakers(['john', 'John', 'JOHN', 'Sarah']);
        
        const duplicates = speakerManager.getDuplicateSpeakers();
        
        testFramework.expect(duplicates).toHaveLength(1);
        testFramework.expect(duplicates[0]).toHaveLength(3);
    });

    this.it('should calculate string similarity correctly', () => {
        const similarity1 = speakerManager.calculateSimilarity('John', 'Johnny');
        const similarity2 = speakerManager.calculateSimilarity('Alice', 'Bob');
        
        testFramework.expect(similarity1).toBeGreaterThan(0.5);
        testFramework.expect(similarity2).toBeLessThan(0.5);
    });

    this.it('should get suggested merges based on similarity', () => {
        speakerManager.setSpeakers(['John', 'Johnny', 'Jon', 'Sarah', 'Bob']);
        
        const suggestions = speakerManager.getSuggestedMerges();
        
        testFramework.expect(suggestions.length).toBeGreaterThan(0);
        testFramework.expect(suggestions[0].similarity).toBeGreaterThan(0.7);
    });

    this.it('should clear speakers correctly', () => {
        speakerManager.setSpeakers(['John', 'Sarah', 'Bob']);
        
        speakerManager.clear();
        
        testFramework.expect(speakerManager.getSpeakerCount()).toBe(0);
        testFramework.expect(speakerManager.getAllSpeakers()).toHaveLength(0);
    });

    this.it('should export and import speaker data correctly', () => {
        speakerManager.setSpeakers(['John', 'Sarah', 'Bob']);
        
        const exportData = speakerManager.exportSpeakerList();
        
        testFramework.expect(exportData.speakers).toHaveLength(3);
        testFramework.expect(exportData.version).toBe('1.0');
        testFramework.expect(exportData.exportDate).toBeTruthy();
        
        speakerManager.clear();
        const importSuccess = speakerManager.importSpeakerList(exportData);
        
        testFramework.expect(importSuccess).toBeTruthy();
        testFramework.expect(speakerManager.getSpeakerCount()).toBe(3);
        testFramework.expect(speakerManager.getAllSpeakers()).toEqual(['Bob', 'John', 'Sarah']);
    });

    this.it('should get statistics correctly', () => {
        speakerManager.setSpeakers(['john', 'John', 'Johnny', 'Sarah']);
        
        const stats = speakerManager.getStatistics();
        
        testFramework.expect(stats.totalSpeakers).toBe(4);
        testFramework.expect(stats.duplicates).toBeGreaterThan(0);
        testFramework.expect(stats.suggestions).toBeGreaterThan(0);
        testFramework.expect(stats.speakers).toHaveLength(4);
    });
});