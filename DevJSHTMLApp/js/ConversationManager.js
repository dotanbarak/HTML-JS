class ConversationManager {
    constructor() {
        this.entries = [];
        this.currentFile = null;
        this.changeHistory = [];
        this.currentHistoryIndex = -1;
        this.parser = new SRTParser();
        this.speakerManager = new SpeakerManager();
        this.listeners = {};
    }

    addEventListener(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    removeEventListener(event, callback) {
        if (this.listeners[event]) {
            const index = this.listeners[event].indexOf(callback);
            if (index > -1) {
                this.listeners[event].splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }

    async loadFile(file) {
        try {
            this.currentFile = file;
            const fileContent = await this.readFileContent(file);
            
            const validation = this.parser.validateSRTFormat(fileContent);
            if (!validation.isValid) {
                throw new Error(`Invalid SRT format: ${validation.errors.join(', ')}`);
            }

            const parseResult = this.parser.parseFile(fileContent);
            this.entries = this.parser.sortEntriesByTime(parseResult.entries);
            this.speakerManager.setSpeakers(parseResult.speakers);

            this.clearHistory();
            this.saveState('File loaded');

            this.emit('fileLoaded', {
                filename: file.name,
                entries: this.entries,
                speakers: parseResult.speakers,
                stats: this.parser.getFileStatistics(this.entries)
            });

            return parseResult;
        } catch (error) {
            this.emit('error', { message: error.message });
            throw error;
        }
    }

    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsText(file, 'UTF-8');
        });
    }

    updateEntry(id, field, value) {
        const entry = this.entries.find(e => e.id === id);
        if (!entry) return false;

        const oldValue = entry[field];
        if (oldValue === value) return false;

        this.saveState(`Updated ${field} for entry ${id}`);

        entry[field] = value;
        entry.isModified = true;

        if (field === 'speaker') {
            this.speakerManager.addSpeaker(value);
            this.emit('speakerAdded', { speaker: value });
        }

        this.emit('entryUpdated', {
            id: id,
            field: field,
            oldValue: oldValue,
            newValue: value,
            entry: entry
        });

        this.updateStatistics();
        return true;
    }

    globalRenameSpeaker(oldName, newName) {
        if (oldName === newName) return 0;

        let changedCount = 0;
        this.saveState(`Global rename: ${oldName} → ${newName}`);

        this.entries.forEach(entry => {
            if (entry.speaker === oldName) {
                entry.speaker = newName;
                entry.isModified = true;
                changedCount++;
            }
        });

        if (changedCount > 0) {
            this.speakerManager.renameSpeaker(oldName, newName);
            this.emit('globalSpeakerRenamed', {
                oldName: oldName,
                newName: newName,
                changedCount: changedCount
            });
            this.updateStatistics();
        }

        return changedCount;
    }

    deleteEntry(id) {
        const index = this.entries.findIndex(e => e.id === id);
        if (index === -1) return false;

        this.saveState(`Deleted entry ${id}`);
        
        const deletedEntry = this.entries.splice(index, 1)[0];
        
        this.renumberEntries();
        
        this.emit('entryDeleted', {
            deletedEntry: deletedEntry,
            index: index
        });

        this.updateStatistics();
        return true;
    }

    addEntry(afterId, newEntryData) {
        const insertIndex = afterId ? 
            this.entries.findIndex(e => e.id === afterId) + 1 : 
            this.entries.length;

        const newId = this.getNextId();
        const newEntry = {
            id: newId,
            startTime: newEntryData.startTime || '00:00:00,000',
            endTime: newEntryData.endTime || '00:00:01,000',
            speaker: newEntryData.speaker || 'New Speaker',
            text: newEntryData.text || '',
            isModified: true,
            originalText: '',
            originalSpeaker: ''
        };

        this.saveState(`Added new entry ${newId}`);
        
        this.entries.splice(insertIndex, 0, newEntry);
        this.renumberEntries();
        
        this.speakerManager.addSpeaker(newEntry.speaker);

        this.emit('entryAdded', {
            entry: newEntry,
            index: insertIndex
        });

        this.updateStatistics();
        return newEntry;
    }

    getNextId() {
        return Math.max(...this.entries.map(e => e.id), 0) + 1;
    }

    renumberEntries() {
        this.entries.forEach((entry, index) => {
            entry.id = index + 1;
        });
    }

    sortByTime() {
        this.saveState('Sorted entries by time');
        this.entries = this.parser.sortEntriesByTime(this.entries);
        this.renumberEntries();
        
        this.emit('entriesSorted', {
            entries: this.entries
        });
    }

    saveState(description) {
        if (this.currentHistoryIndex < this.changeHistory.length - 1) {
            this.changeHistory = this.changeHistory.slice(0, this.currentHistoryIndex + 1);
        }

        const state = {
            description: description,
            timestamp: new Date(),
            entries: JSON.parse(JSON.stringify(this.entries)),
            speakers: this.speakerManager.getAllSpeakers()
        };

        this.changeHistory.push(state);
        this.currentHistoryIndex++;

        if (this.changeHistory.length > 50) {
            this.changeHistory.shift();
            this.currentHistoryIndex--;
        }
    }

    undo() {
        if (this.currentHistoryIndex > 0) {
            this.currentHistoryIndex--;
            const state = this.changeHistory[this.currentHistoryIndex];
            this.restoreState(state);
            
            this.emit('undoPerformed', {
                description: state.description,
                canUndo: this.canUndo(),
                canRedo: this.canRedo()
            });
            
            return true;
        }
        return false;
    }

    redo() {
        if (this.currentHistoryIndex < this.changeHistory.length - 1) {
            this.currentHistoryIndex++;
            const state = this.changeHistory[this.currentHistoryIndex];
            this.restoreState(state);
            
            this.emit('redoPerformed', {
                description: state.description,
                canUndo: this.canUndo(),
                canRedo: this.canRedo()
            });
            
            return true;
        }
        return false;
    }

    restoreState(state) {
        this.entries = JSON.parse(JSON.stringify(state.entries));
        this.speakerManager.setSpeakers(state.speakers);
        
        this.emit('stateRestored', {
            entries: this.entries,
            speakers: state.speakers
        });
        
        this.updateStatistics();
    }

    canUndo() {
        return this.currentHistoryIndex > 0;
    }

    canRedo() {
        return this.currentHistoryIndex < this.changeHistory.length - 1;
    }

    clearHistory() {
        this.changeHistory = [];
        this.currentHistoryIndex = -1;
    }

    updateStatistics() {
        const stats = this.parser.getFileStatistics(this.entries);
        this.emit('statisticsUpdated', stats);
    }

    getEntries() {
        return this.entries;
    }

    getEntry(id) {
        return this.entries.find(e => e.id === id);
    }

    getAllSpeakers() {
        return this.speakerManager.getAllSpeakers();
    }

    getModifiedEntries() {
        return this.entries.filter(entry => entry.isModified);
    }

    hasUnsavedChanges() {
        return this.entries.some(entry => entry.isModified);
    }

    exportToSRT() {
        const sortedEntries = this.parser.sortEntriesByTime([...this.entries]);
        let srtContent = '';

        sortedEntries.forEach((entry, index) => {
            srtContent += `${index + 1}\n`;
            srtContent += `${entry.startTime} --> ${entry.endTime}\n`;
            srtContent += `${entry.speaker}: ${entry.text}\n\n`;
        });

        return srtContent.trim();
    }

    reset() {
        this.entries = [];
        this.currentFile = null;
        this.clearHistory();
        this.speakerManager.clear();
        
        this.emit('reset', {});
    }
}