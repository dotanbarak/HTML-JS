class SRTEditorApp {
    constructor() {
        this.conversationManager = new ConversationManager();
        this.fileExporter = new FileExporter(this.conversationManager);
        this.tableRenderer = null;
        this.currentSpeakers = [];
        
        this.initializeElements();
        this.setupEventListeners();
        this.setupConversationManagerListeners();
        this.setupFileExporterListeners();
        
        this.updateUIState();
    }

    initializeElements() {
        this.elements = {
            fileInput: document.getElementById('fileInput'),
            browseBtn: document.getElementById('browseBtn'),
            dropZone: document.getElementById('dropZone'),
            fileInfo: document.getElementById('fileInfo'),
            fileName: document.getElementById('fileName'),
            fileStats: document.getElementById('fileStats'),
            speakerManagement: document.getElementById('speakerManagement'),
            speakersList: document.getElementById('speakersList'),
            newSpeakerInput: document.getElementById('newSpeakerInput'),
            addSpeakerBtn: document.getElementById('addSpeakerBtn'),
            applySpeakerChanges: document.getElementById('applySpeakerChanges'),
            conversationTable: document.getElementById('conversationTable'),
            tableBody: document.getElementById('tableBody'),
            exportBtn: document.getElementById('exportBtn'),
            statusInfo: document.getElementById('statusInfo')
        };

        this.tableRenderer = new TableRenderer(
            this.elements.conversationTable, 
            this.conversationManager
        );
    }

    setupEventListeners() {
        this.elements.browseBtn.addEventListener('click', () => {
            this.elements.fileInput.click();
        });

        this.elements.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileSelection(e.target.files[0]);
            }
        });

        this.setupDragAndDrop();

        this.elements.applySpeakerChanges.addEventListener('click', () => {
            this.applySpeakerChanges();
        });

        this.elements.addSpeakerBtn.addEventListener('click', () => {
            this.addNewSpeaker();
        });

        this.elements.newSpeakerInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addNewSpeaker();
            }
        });

        this.elements.newSpeakerInput.addEventListener('input', (e) => {
            const hasText = e.target.value.trim().length > 0;
            this.elements.addSpeakerBtn.disabled = !hasText;
        });

        this.elements.exportBtn.addEventListener('click', () => {
            this.showExportOptions();
        });

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.conversationManager.undo();
            } else if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'Z')) {
                e.preventDefault();
                this.conversationManager.redo();
            } else if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.fileExporter.exportSRT();
            }
        });
    }

    setupDragAndDrop() {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.elements.dropZone.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            this.elements.dropZone.addEventListener(eventName, () => {
                this.elements.dropZone.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            this.elements.dropZone.addEventListener(eventName, () => {
                this.elements.dropZone.classList.remove('dragover');
            }, false);
        });

        this.elements.dropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelection(files[0]);
            }
        }, false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    setupConversationManagerListeners() {
        this.conversationManager.addEventListener('fileLoaded', (data) => {
            console.log('File loaded - Speakers found:', data.speakers);
            console.log('File loaded - Entries:', data.entries.length);
            this.currentSpeakers = data.speakers;
            this.updateFileInfo(data);
            this.renderSpeakerManagement(data.speakers);
            this.tableRenderer.render(data.entries, data.speakers);
            this.updateUIState('fileLoaded');
            this.updateStatus(`Loaded ${data.entries.length} entries from ${data.filename}`);
        });

        this.conversationManager.addEventListener('entryUpdated', (data) => {
            this.tableRenderer.updateRowModifiedState(data.id);
            this.updateStatus(`Updated ${data.field} for entry ${data.id}`);
        });

        this.conversationManager.addEventListener('globalSpeakerRenamed', (data) => {
            this.currentSpeakers = this.conversationManager.getAllSpeakers();
            this.renderSpeakerManagement(this.currentSpeakers);
            this.tableRenderer.updateSpeakerSelects(this.currentSpeakers);
            this.updateStatus(`Renamed "${data.oldName}" to "${data.newName}" (${data.changedCount} entries affected)`);
        });

        this.conversationManager.addEventListener('speakerAdded', (data) => {
            if (!this.currentSpeakers.includes(data.speaker)) {
                this.currentSpeakers = this.conversationManager.getAllSpeakers();
                this.renderSpeakerManagement(this.currentSpeakers);
                this.tableRenderer.updateSpeakerSelects(this.currentSpeakers);
            }
        });

        this.conversationManager.addEventListener('statisticsUpdated', (stats) => {
            this.updateFileStats(stats);
        });

        this.conversationManager.addEventListener('undoPerformed', (data) => {
            this.tableRenderer.refresh();
            this.currentSpeakers = this.conversationManager.getAllSpeakers();
            this.renderSpeakerManagement(this.currentSpeakers);
            this.updateStatus(`Undo: ${data.description}`);
        });

        this.conversationManager.addEventListener('redoPerformed', (data) => {
            this.tableRenderer.refresh();
            this.currentSpeakers = this.conversationManager.getAllSpeakers();
            this.renderSpeakerManagement(this.currentSpeakers);
            this.updateStatus(`Redo: ${data.description}`);
        });

        this.conversationManager.addEventListener('error', (data) => {
            this.showError(data.message);
        });
    }

    setupFileExporterListeners() {
        this.fileExporter.addEventListener('exportCompleted', (data) => {
            this.showSuccess(`Exported to ${data.filename} (${data.entriesCount} entries)`);
        });

        this.fileExporter.addEventListener('exportError', (data) => {
            this.showError(`Export failed: ${data.message}`);
        });
    }

    handleFileSelection(file) {
        if (!file) return;

        const validExtensions = ['.srt'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!validExtensions.includes(fileExtension)) {
            this.showError('Please select a valid SRT file (.srt)');
            return;
        }

        this.updateStatus('Loading file...');
        this.conversationManager.loadFile(file);
    }

    renderSpeakerManagement(speakers) {
        this.elements.speakersList.innerHTML = '';
        
        speakers.forEach(speaker => {
            const speakerItem = document.createElement('div');
            speakerItem.className = 'speaker-item';
            speakerItem.dataset.originalName = speaker;
            
            const label = document.createElement('label');
            label.textContent = 'Speaker:';
            
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'speaker-name-input';
            input.value = speaker;
            input.dataset.originalValue = speaker;
            input.placeholder = 'Enter speaker name';
            
            // Add change detection
            input.addEventListener('input', (e) => {
                const originalValue = e.target.dataset.originalValue;
                const currentValue = e.target.value.trim();
                
                if (currentValue !== originalValue && currentValue !== '') {
                    e.target.classList.add('modified');
                } else {
                    e.target.classList.remove('modified');
                }
            });
            
            speakerItem.appendChild(label);
            speakerItem.appendChild(input);
            this.elements.speakersList.appendChild(speakerItem);
        });

        this.elements.speakerManagement.style.display = speakers.length > 0 ? 'block' : 'none';
    }

    applySpeakerChanges() {
        const speakerInputs = this.elements.speakersList.querySelectorAll('.speaker-name-input');
        const changes = [];

        speakerInputs.forEach(input => {
            const originalName = input.dataset.originalValue;
            const newName = input.value.trim();
            
            if (originalName !== newName && newName !== '') {
                changes.push({ original: originalName, new: newName });
            }
        });

        if (changes.length === 0) {
            this.showInfo('No speaker name changes detected');
            return;
        }

        let totalChanges = 0;
        changes.forEach(change => {
            const changedCount = this.conversationManager.globalRenameSpeaker(change.original, change.new);
            totalChanges += changedCount;
        });

        if (totalChanges > 0) {
            // Reset all input backgrounds to white and update their original values
            speakerInputs.forEach(input => {
                input.classList.remove('modified');
                input.dataset.originalValue = input.value;
            });
            
            this.showSuccess(`Applied ${changes.length} speaker rename(s), affecting ${totalChanges} entries total`);
        } else {
            this.showInfo('No entries were affected by the speaker changes');
        }
    }

    addNewSpeaker() {
        const newSpeakerName = this.elements.newSpeakerInput.value.trim();
        
        if (!newSpeakerName) {
            this.showError('Please enter a speaker name');
            return;
        }

        // Check if speaker already exists
        if (this.currentSpeakers.includes(newSpeakerName)) {
            this.showError(`Speaker "${newSpeakerName}" already exists`);
            this.elements.newSpeakerInput.select();
            return;
        }

        // Add speaker to the conversation manager
        const success = this.conversationManager.speakerManager.addSpeaker(newSpeakerName);
        
        if (success) {
            // Update current speakers list
            this.currentSpeakers = this.conversationManager.getAllSpeakers();
            
            // Re-render speaker management to include new speaker
            this.renderSpeakerManagement(this.currentSpeakers);
            
            // Update all table dropdowns to include new speaker
            this.tableRenderer.updateSpeakerSelects(this.currentSpeakers);
            
            // Clear the input field
            this.elements.newSpeakerInput.value = '';
            this.elements.addSpeakerBtn.disabled = true;
            
            this.showSuccess(`Added speaker "${newSpeakerName}"`);
        } else {
            this.showError('Failed to add speaker');
        }
    }

    showExportOptions() {
        const modal = document.createElement('div');
        modal.className = 'export-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            padding: 20px;
            border-radius: 8px;
            min-width: 300px;
            max-width: 500px;
        `;

        const options = this.fileExporter.createExportOptions();
        
        modalContent.innerHTML = `
            <h3>Export Options</h3>
            <div class="export-options">
                ${options.map(option => `
                    <button class="export-option-btn" data-method="${option.method}" style="
                        display: block;
                        width: 100%;
                        margin: 10px 0;
                        padding: 10px;
                        border: 1px solid #ccc;
                        background: white;
                        border-radius: 4px;
                        cursor: pointer;
                        text-align: left;
                    ">
                        <strong>${option.format}</strong> (${option.extension})<br>
                        <small>${option.description}</small>
                    </button>
                `).join('')}
            </div>
            <button id="cancelExport" style="
                margin-top: 10px;
                padding: 10px 20px;
                background: #6c757d;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            ">Cancel</button>
        `;

        modalContent.querySelectorAll('.export-option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const method = btn.dataset.method;
                this.fileExporter[method]();
                document.body.removeChild(modal);
            });
        });

        modalContent.querySelector('#cancelExport').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    updateFileInfo(data) {
        this.elements.fileName.textContent = data.filename;
        this.updateFileStats(data.stats);
        this.elements.fileInfo.style.display = 'block';
    }

    updateFileStats(stats) {
        this.elements.fileStats.textContent = 
            `${stats.totalEntries} entries, ${stats.uniqueSpeakers} speakers` +
            (stats.modifiedEntries > 0 ? `, ${stats.modifiedEntries} modified` : '');
    }

    updateUIState(state = 'initial') {
        const hasFile = this.conversationManager.getEntries().length > 0;
        
        this.elements.exportBtn.disabled = !hasFile;
        this.elements.conversationTable.style.display = hasFile ? 'table' : 'none';
        this.elements.speakerManagement.style.display = hasFile ? 'block' : 'none';
        
        // Initialize add speaker button as disabled
        this.elements.addSpeakerBtn.disabled = !this.elements.newSpeakerInput.value.trim();
        
        if (!hasFile && state !== 'loading') {
            this.elements.fileInfo.style.display = 'none';
        }
    }

    updateStatus(message) {
        this.elements.statusInfo.textContent = message;
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 4px;
            color: white;
            z-index: 1000;
            max-width: 400px;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        const colors = {
            error: '#e74c3c',
            success: '#27ae60',
            info: '#3498db'
        };
        
        notification.style.backgroundColor = colors[type] || colors.info;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 10);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    reset() {
        this.conversationManager.reset();
        this.currentSpeakers = [];
        this.elements.speakersList.innerHTML = '';
        this.tableRenderer.render([], []);
        this.updateUIState();
        this.updateStatus('Ready to load SRT file');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.srtEditorApp = new SRTEditorApp();
});