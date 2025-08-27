class SRTParser {
    constructor() {
        this.entries = [];
        this.speakers = new Set();
    }

    parseFile(fileContent) {
        this.entries = [];
        this.speakers.clear();

        const blocks = fileContent.trim().split(/\n\s*\n/);
        
        for (const block of blocks) {
            const lines = block.trim().split('\n');
            if (lines.length < 3) continue;

            const entry = this.parseBlock(lines);
            if (entry) {
                this.entries.push(entry);
                this.speakers.add(entry.speaker);
            }
        }

        const speakerArray = Array.from(this.speakers).sort();
        console.log('SRTParser.parseFile - Found speakers:', speakerArray);
        console.log('SRTParser.parseFile - Found entries:', this.entries.length);
        
        return {
            entries: this.entries,
            speakers: speakerArray
        };
    }

    parseBlock(lines) {
        try {
            const id = parseInt(lines[0]);
            if (isNaN(id)) return null;

            const timeLine = lines[1];
            const timeMatch = timeLine.match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);
            if (!timeMatch) return null;

            const startTime = timeMatch[1];
            const endTime = timeMatch[2];

            const textLines = lines.slice(2);
            const fullText = textLines.join(' ').trim();

            const { speaker, text } = this.extractSpeakerAndText(fullText);

            return {
                id: id,
                startTime: startTime,
                endTime: endTime,
                speaker: speaker,
                text: text,
                isModified: false,
                originalText: text,
                originalSpeaker: speaker
            };
        } catch (error) {
            console.warn('Failed to parse block:', lines, error);
            return null;
        }
    }

    extractSpeakerAndText(fullText) {
        const speakerMatch = fullText.match(/^([^:]+):\s*(.*)$/);
        
        if (speakerMatch) {
            return {
                speaker: speakerMatch[1].trim(),
                text: speakerMatch[2].trim()
            };
        }

        return {
            speaker: 'Unknown Speaker',
            text: fullText
        };
    }

    validateSRTFormat(fileContent) {
        const errors = [];
        
        if (!fileContent || fileContent.trim().length === 0) {
            errors.push('File is empty');
            return { isValid: false, errors };
        }

        const blocks = fileContent.trim().split(/\n\s*\n/);
        
        if (blocks.length === 0) {
            errors.push('No subtitle blocks found');
            return { isValid: false, errors };
        }

        for (let i = 0; i < blocks.length; i++) {
            const lines = blocks[i].trim().split('\n');
            
            if (lines.length < 3) {
                errors.push(`Block ${i + 1}: Insufficient lines (need at least 3)`);
                continue;
            }

            const id = parseInt(lines[0]);
            if (isNaN(id)) {
                errors.push(`Block ${i + 1}: Invalid sequence number`);
            }

            const timeLine = lines[1];
            const timeMatch = timeLine.match(/\d{2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{2}:\d{2}:\d{2},\d{3}/);
            if (!timeMatch) {
                errors.push(`Block ${i + 1}: Invalid time format`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    timeToSeconds(timeString) {
        const [time, ms] = timeString.split(',');
        const [hours, minutes, seconds] = time.split(':').map(Number);
        return hours * 3600 + minutes * 60 + seconds + parseInt(ms) / 1000;
    }

    secondsToTime(totalSeconds) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = Math.floor(totalSeconds % 60);
        const milliseconds = Math.round((totalSeconds % 1) * 1000);

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
    }

    sortEntriesByTime(entries) {
        return entries.sort((a, b) => {
            const timeA = this.timeToSeconds(a.startTime);
            const timeB = this.timeToSeconds(b.startTime);
            return timeA - timeB;
        });
    }

    getFileStatistics(entries) {
        const totalEntries = entries.length;
        const uniqueSpeakers = new Set(entries.map(entry => entry.speaker)).size;
        const modifiedEntries = entries.filter(entry => entry.isModified).length;
        
        let totalDuration = 0;
        if (entries.length > 0) {
            const lastEntry = entries[entries.length - 1];
            totalDuration = this.timeToSeconds(lastEntry.endTime);
        }

        return {
            totalEntries,
            uniqueSpeakers,
            modifiedEntries,
            totalDuration: this.secondsToTime(totalDuration)
        };
    }
}