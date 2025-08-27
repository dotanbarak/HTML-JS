class FileExporter {
    constructor(conversationManager) {
        this.conversationManager = conversationManager;
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

    exportSRT(filename = null) {
        try {
            const entries = this.conversationManager.getEntries();
            
            if (entries.length === 0) {
                throw new Error('No entries to export');
            }

            const srtContent = this.generateSRTContent(entries);
            const exportFilename = filename || this.generateDefaultFilename();
            
            this.downloadFile(srtContent, exportFilename, 'text/plain');
            
            this.emit('exportCompleted', {
                filename: exportFilename,
                entriesCount: entries.length,
                format: 'SRT'
            });

            return true;
        } catch (error) {
            this.emit('exportError', {
                message: error.message,
                format: 'SRT'
            });
            throw error;
        }
    }

    generateSRTContent(entries) {
        const sortedEntries = this.sortEntriesByTime([...entries]);
        let srtContent = '';

        sortedEntries.forEach((entry, index) => {
            srtContent += `${index + 1}\n`;
            srtContent += `${entry.startTime} --> ${entry.endTime}\n`;
            srtContent += `${entry.speaker}: ${entry.text}\n\n`;
        });

        return srtContent.trim();
    }

    exportJSON(filename = null) {
        try {
            const entries = this.conversationManager.getEntries();
            const speakers = this.conversationManager.getAllSpeakers();
            
            if (entries.length === 0) {
                throw new Error('No entries to export');
            }

            const jsonData = {
                metadata: {
                    exportDate: new Date().toISOString(),
                    version: '1.0',
                    format: 'SRT_JSON',
                    totalEntries: entries.length,
                    totalSpeakers: speakers.length
                },
                speakers: speakers,
                entries: entries.map(entry => ({
                    id: entry.id,
                    startTime: entry.startTime,
                    endTime: entry.endTime,
                    speaker: entry.speaker,
                    text: entry.text,
                    isModified: entry.isModified,
                    originalSpeaker: entry.originalSpeaker,
                    originalText: entry.originalText
                }))
            };

            const jsonContent = JSON.stringify(jsonData, null, 2);
            const exportFilename = filename || this.generateDefaultFilename('json');
            
            this.downloadFile(jsonContent, exportFilename, 'application/json');
            
            this.emit('exportCompleted', {
                filename: exportFilename,
                entriesCount: entries.length,
                format: 'JSON'
            });

            return true;
        } catch (error) {
            this.emit('exportError', {
                message: error.message,
                format: 'JSON'
            });
            throw error;
        }
    }

    exportCSV(filename = null) {
        try {
            const entries = this.conversationManager.getEntries();
            
            if (entries.length === 0) {
                throw new Error('No entries to export');
            }

            const csvContent = this.generateCSVContent(entries);
            const exportFilename = filename || this.generateDefaultFilename('csv');
            
            this.downloadFile(csvContent, exportFilename, 'text/csv');
            
            this.emit('exportCompleted', {
                filename: exportFilename,
                entriesCount: entries.length,
                format: 'CSV'
            });

            return true;
        } catch (error) {
            this.emit('exportError', {
                message: error.message,
                format: 'CSV'
            });
            throw error;
        }
    }

    generateCSVContent(entries) {
        const headers = ['ID', 'Start Time', 'End Time', 'Speaker', 'Text', 'Modified', 'Original Speaker', 'Original Text'];
        const sortedEntries = this.sortEntriesByTime([...entries]);
        
        let csvContent = headers.join(',') + '\n';
        
        sortedEntries.forEach(entry => {
            const row = [
                entry.id,
                `"${entry.startTime}"`,
                `"${entry.endTime}"`,
                `"${this.escapeCsvField(entry.speaker)}"`,
                `"${this.escapeCsvField(entry.text)}"`,
                entry.isModified ? 'Yes' : 'No',
                `"${this.escapeCsvField(entry.originalSpeaker || '')}"`,
                `"${this.escapeCsvField(entry.originalText || '')}"`
            ];
            csvContent += row.join(',') + '\n';
        });

        return csvContent;
    }

    exportTXT(filename = null) {
        try {
            const entries = this.conversationManager.getEntries();
            
            if (entries.length === 0) {
                throw new Error('No entries to export');
            }

            const txtContent = this.generateTXTContent(entries);
            const exportFilename = filename || this.generateDefaultFilename('txt');
            
            this.downloadFile(txtContent, exportFilename, 'text/plain');
            
            this.emit('exportCompleted', {
                filename: exportFilename,
                entriesCount: entries.length,
                format: 'TXT'
            });

            return true;
        } catch (error) {
            this.emit('exportError', {
                message: error.message,
                format: 'TXT'
            });
            throw error;
        }
    }

    generateTXTContent(entries) {
        const sortedEntries = this.sortEntriesByTime([...entries]);
        let txtContent = `Transcript Export\n`;
        txtContent += `Generated: ${new Date().toLocaleString()}\n`;
        txtContent += `Total Entries: ${entries.length}\n`;
        txtContent += `Speakers: ${this.conversationManager.getAllSpeakers().join(', ')}\n\n`;
        txtContent += '='.repeat(80) + '\n\n';

        sortedEntries.forEach((entry, index) => {
            txtContent += `[${entry.startTime} - ${entry.endTime}] ${entry.speaker}: ${entry.text}\n\n`;
        });

        return txtContent;
    }

    importFromJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const jsonData = JSON.parse(e.target.result);
                    
                    if (!this.validateJSONFormat(jsonData)) {
                        throw new Error('Invalid JSON format');
                    }

                    this.emit('importStarted', {
                        filename: file.name,
                        format: 'JSON'
                    });

                    resolve(jsonData);
                } catch (error) {
                    this.emit('importError', {
                        message: error.message,
                        filename: file.name,
                        format: 'JSON'
                    });
                    reject(error);
                }
            };

            reader.onerror = () => {
                const error = new Error('Failed to read JSON file');
                this.emit('importError', {
                    message: error.message,
                    filename: file.name,
                    format: 'JSON'
                });
                reject(error);
            };

            reader.readAsText(file, 'UTF-8');
        });
    }

    validateJSONFormat(jsonData) {
        return (
            jsonData &&
            jsonData.metadata &&
            jsonData.entries &&
            Array.isArray(jsonData.entries) &&
            jsonData.speakers &&
            Array.isArray(jsonData.speakers)
        );
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }

    generateDefaultFilename(extension = 'srt') {
        const now = new Date();
        const timestamp = now.toISOString().slice(0, 19).replace(/[:.]/g, '-');
        const prefix = this.conversationManager.currentFile ? 
            this.conversationManager.currentFile.name.replace(/\.[^/.]+$/, '') : 
            'transcript';
        
        return `${prefix}_edited_${timestamp}.${extension}`;
    }

    escapeCsvField(field) {
        if (typeof field !== 'string') return field;
        return field.replace(/"/g, '""');
    }

    sortEntriesByTime(entries) {
        return entries.sort((a, b) => {
            const timeA = this.timeToSeconds(a.startTime);
            const timeB = this.timeToSeconds(b.startTime);
            return timeA - timeB;
        });
    }

    timeToSeconds(timeString) {
        const [time, ms] = timeString.split(',');
        const [hours, minutes, seconds] = time.split(':').map(Number);
        return hours * 3600 + minutes * 60 + seconds + parseInt(ms) / 1000;
    }

    getExportStatistics() {
        const entries = this.conversationManager.getEntries();
        const modifiedEntries = entries.filter(e => e.isModified);
        const speakers = this.conversationManager.getAllSpeakers();
        
        return {
            totalEntries: entries.length,
            modifiedEntries: modifiedEntries.length,
            totalSpeakers: speakers.length,
            hasUnsavedChanges: this.conversationManager.hasUnsavedChanges(),
            originalFile: this.conversationManager.currentFile ? 
                this.conversationManager.currentFile.name : null
        };
    }

    createExportOptions() {
        return [
            { format: 'SRT', extension: 'srt', description: 'SubRip Subtitle format', method: 'exportSRT' },
            { format: 'JSON', extension: 'json', description: 'JSON format with metadata', method: 'exportJSON' },
            { format: 'CSV', extension: 'csv', description: 'Comma-separated values', method: 'exportCSV' },
            { format: 'TXT', extension: 'txt', description: 'Plain text transcript', method: 'exportTXT' }
        ];
    }

    exportMultiple(formats, baseFilename = null) {
        const results = [];
        
        formats.forEach(format => {
            try {
                const method = this[format.method];
                if (method && typeof method === 'function') {
                    const filename = baseFilename ? 
                        `${baseFilename}.${format.extension}` : 
                        null;
                    method.call(this, filename);
                    results.push({ format: format.format, success: true });
                } else {
                    throw new Error(`Unknown export method: ${format.method}`);
                }
            } catch (error) {
                results.push({ 
                    format: format.format, 
                    success: false, 
                    error: error.message 
                });
            }
        });

        this.emit('multipleExportCompleted', { results: results });
        return results;
    }
}