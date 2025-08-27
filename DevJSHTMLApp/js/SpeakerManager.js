class SpeakerManager {
    constructor() {
        this.speakers = new Set();
        this.speakerOrder = []; // Maintains original order
        this.speakerMap = new Map();
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

    setSpeakers(speakerList) {
        this.speakers.clear();
        this.speakerOrder = [];
        this.speakerMap.clear();
        
        speakerList.forEach(speaker => {
            this.speakers.add(speaker);
            this.speakerOrder.push(speaker);
            this.speakerMap.set(speaker, speaker);
        });

        this.emit('speakersUpdated', {
            speakers: this.getAllSpeakers()
        });
    }

    addSpeaker(speakerName) {
        if (!speakerName || speakerName.trim() === '') return false;
        
        const trimmedName = speakerName.trim();
        if (this.speakers.has(trimmedName)) return false;

        this.speakers.add(trimmedName);
        this.speakerOrder.push(trimmedName);
        this.speakerMap.set(trimmedName, trimmedName);

        this.emit('speakerAdded', {
            speaker: trimmedName,
            speakers: this.getAllSpeakers()
        });

        return true;
    }

    removeSpeaker(speakerName) {
        if (!this.speakers.has(speakerName)) return false;

        this.speakers.delete(speakerName);
        const index = this.speakerOrder.indexOf(speakerName);
        if (index > -1) {
            this.speakerOrder.splice(index, 1);
        }
        this.speakerMap.delete(speakerName);

        this.emit('speakerRemoved', {
            speaker: speakerName,
            speakers: this.getAllSpeakers()
        });

        return true;
    }

    renameSpeaker(oldName, newName) {
        if (!oldName || !newName || oldName === newName) return false;
        
        const trimmedOldName = oldName.trim();
        const trimmedNewName = newName.trim();
        
        if (!this.speakers.has(trimmedOldName)) return false;
        if (this.speakers.has(trimmedNewName) && trimmedOldName !== trimmedNewName) return false;

        this.speakers.delete(trimmedOldName);
        this.speakers.add(trimmedNewName);
        
        // Update the order array to replace old name with new name at same position
        const index = this.speakerOrder.indexOf(trimmedOldName);
        if (index > -1) {
            this.speakerOrder[index] = trimmedNewName;
        }
        
        this.speakerMap.delete(trimmedOldName);
        this.speakerMap.set(trimmedNewName, trimmedNewName);

        this.emit('speakerRenamed', {
            oldName: trimmedOldName,
            newName: trimmedNewName,
            speakers: this.getAllSpeakers()
        });

        return true;
    }

    getAllSpeakers() {
        // Return speakers in their original order, filtering out any that may have been removed
        return this.speakerOrder.filter(speaker => this.speakers.has(speaker));
    }

    getSpeakerCount() {
        return this.speakers.size;
    }

    hasSpeaker(speakerName) {
        return this.speakers.has(speakerName);
    }

    clear() {
        this.speakers.clear();
        this.speakerOrder = [];
        this.speakerMap.clear();

        this.emit('speakersCleared', {
            speakers: []
        });
    }

    getSpeakersByPattern(pattern) {
        if (!pattern || pattern.trim() === '') return this.getAllSpeakers();
        
        const regex = new RegExp(pattern, 'i');
        return this.getAllSpeakers().filter(speaker => regex.test(speaker));
    }

    mergeSpeakers(speakersToMerge, targetSpeaker) {
        if (!speakersToMerge || speakersToMerge.length === 0) return false;
        if (!targetSpeaker || targetSpeaker.trim() === '') return false;

        const trimmedTarget = targetSpeaker.trim();
        let mergedCount = 0;

        speakersToMerge.forEach(speaker => {
            if (speaker !== trimmedTarget && this.speakers.has(speaker)) {
                this.speakers.delete(speaker);
                this.speakerMap.delete(speaker);
                
                // Remove from order array
                const index = this.speakerOrder.indexOf(speaker);
                if (index > -1) {
                    this.speakerOrder.splice(index, 1);
                }
                
                mergedCount++;
            }
        });

        if (mergedCount > 0) {
            this.speakers.add(trimmedTarget);
            this.speakerMap.set(trimmedTarget, trimmedTarget);
            
            // Add to order if not already present
            if (!this.speakerOrder.includes(trimmedTarget)) {
                this.speakerOrder.push(trimmedTarget);
            }

            this.emit('speakersMerged', {
                mergedSpeakers: speakersToMerge,
                targetSpeaker: trimmedTarget,
                mergedCount: mergedCount,
                speakers: this.getAllSpeakers()
            });
        }

        return mergedCount > 0;
    }

    getDuplicateSpeakers() {
        const duplicates = [];
        const normalized = new Map();

        this.speakers.forEach(speaker => {
            const normalizedName = speaker.toLowerCase().trim();
            if (normalized.has(normalizedName)) {
                const existing = normalized.get(normalizedName);
                if (!duplicates.find(group => group.includes(existing))) {
                    duplicates.push([existing]);
                }
                const groupIndex = duplicates.findIndex(group => group.includes(existing));
                if (groupIndex !== -1) {
                    duplicates[groupIndex].push(speaker);
                }
            } else {
                normalized.set(normalizedName, speaker);
            }
        });

        return duplicates.filter(group => group.length > 1);
    }

    getSuggestedMerges() {
        const suggestions = [];
        const speakers = this.getAllSpeakers();

        for (let i = 0; i < speakers.length; i++) {
            for (let j = i + 1; j < speakers.length; j++) {
                const similarity = this.calculateSimilarity(speakers[i], speakers[j]);
                if (similarity > 0.7) {
                    suggestions.push({
                        speakers: [speakers[i], speakers[j]],
                        similarity: similarity,
                        suggestedTarget: speakers[i].length <= speakers[j].length ? speakers[i] : speakers[j]
                    });
                }
            }
        }

        return suggestions.sort((a, b) => b.similarity - a.similarity);
    }

    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;

        if (longer.length === 0) return 1.0;

        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];

        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[str2.length][str1.length];
    }

    getStatistics() {
        return {
            totalSpeakers: this.getSpeakerCount(),
            duplicates: this.getDuplicateSpeakers().length,
            suggestions: this.getSuggestedMerges().length,
            speakers: this.getAllSpeakers()
        };
    }

    exportSpeakerList() {
        return {
            speakers: this.getAllSpeakers(),
            speakerMap: Object.fromEntries(this.speakerMap),
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
    }

    importSpeakerList(importData) {
        try {
            if (!importData.speakers || !Array.isArray(importData.speakers)) {
                throw new Error('Invalid speaker data format');
            }

            this.setSpeakers(importData.speakers);

            if (importData.speakerMap) {
                this.speakerMap.clear();
                Object.entries(importData.speakerMap).forEach(([key, value]) => {
                    this.speakerMap.set(key, value);
                });
            }

            this.emit('speakersImported', {
                speakers: this.getAllSpeakers(),
                importDate: importData.exportDate
            });

            return true;
        } catch (error) {
            this.emit('importError', { message: error.message });
            return false;
        }
    }
}