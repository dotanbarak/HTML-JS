class TableRenderer {
    constructor(tableElement, conversationManager) {
        this.table = tableElement;
        this.tbody = tableElement.querySelector('tbody');
        this.conversationManager = conversationManager;
        this.currentEntries = [];
        this.listeners = {};
        
        this.setupEventListeners();
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

    setupEventListeners() {
        this.tbody.addEventListener('change', this.handleCellChange.bind(this));
        this.tbody.addEventListener('input', this.handleTextInput.bind(this));
        this.tbody.addEventListener('blur', this.handleCellBlur.bind(this), true);
        this.tbody.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    render(entries, speakers = []) {
        console.log('TableRenderer.render - Speakers:', speakers);
        console.log('TableRenderer.render - Entries:', entries.length);
        this.currentEntries = entries;
        this.tbody.innerHTML = '';

        if (entries.length === 0) {
            this.renderEmptyState();
            return;
        }

        entries.forEach(entry => {
            const row = this.createEntryRow(entry, speakers);
            this.tbody.appendChild(row);
        });

        this.table.style.display = 'table';
        this.emit('rendered', { entriesCount: entries.length });
    }

    renderEmptyState() {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="3" class="empty-state">
                No entries to display. Load an SRT file to get started.
            </td>
        `;
        this.tbody.appendChild(row);
    }

    createEntryRow(entry, speakers) {
        const row = document.createElement('tr');
        row.dataset.entryId = entry.id;
        
        if (entry.isModified) {
            row.classList.add('modified');
        }

        const timeCell = document.createElement('td');
        timeCell.className = 'time-cell';
        timeCell.innerHTML = `
            <div class="time-display">
                <span class="start-time">${entry.startTime}</span>
                <span class="time-separator">→</span>
                <span class="end-time">${entry.endTime}</span>
            </div>
        `;

        const speakerCell = document.createElement('td');
        speakerCell.className = 'speaker-cell';
        speakerCell.appendChild(this.createSpeakerSelect(entry, speakers));

        const textCell = document.createElement('td');
        textCell.className = 'text-cell';
        textCell.innerHTML = this.createTextInput(entry);

        row.appendChild(timeCell);
        row.appendChild(speakerCell);
        row.appendChild(textCell);

        return row;
    }

    createSpeakerSelect(entry, speakers) {
        console.log('Creating speaker select for entry', entry.id, 'speaker:', entry.speaker, 'available speakers:', speakers);
        const select = document.createElement('select');
        select.className = 'speaker-select';
        select.dataset.entryId = entry.id;
        select.dataset.field = 'speaker';

        speakers.forEach(speaker => {
            const option = document.createElement('option');
            option.value = speaker;
            option.textContent = speaker;
            option.selected = speaker === entry.speaker;
            select.appendChild(option);
            console.log('Added option:', speaker, 'selected:', option.selected);
        });

        if (!speakers.includes(entry.speaker)) {
            const option = document.createElement('option');
            option.value = entry.speaker;
            option.textContent = entry.speaker;
            option.selected = true;
            select.insertBefore(option, select.firstChild);
            console.log('Added missing speaker:', entry.speaker);
        }

        return select;
    }

    createTextInput(entry) {
        return `
            <textarea 
                class="text-input" 
                data-entry-id="${entry.id}" 
                data-field="text"
                rows="2"
                placeholder="Enter transcript text..."
            >${this.escapeHtml(entry.text)}</textarea>
        `;
    }

    handleCellChange(event) {
        const target = event.target;
        
        if (target.matches('.speaker-select')) {
            this.handleSpeakerChange(target);
        }
    }

    handleTextInput(event) {
        const target = event.target;
        
        if (target.matches('.text-input')) {
            this.debounce(() => {
                this.handleTextChange(target);
            }, 500)();
        }
    }

    handleSpeakerChange(selectElement) {
        const entryId = parseInt(selectElement.dataset.entryId);
        const newSpeaker = selectElement.value;
        
        const success = this.conversationManager.updateEntry(entryId, 'speaker', newSpeaker);
        
        if (success) {
            this.updateRowModifiedState(entryId);
            this.emit('speakerChanged', {
                entryId: entryId,
                newSpeaker: newSpeaker
            });
        }
    }

    handleTextChange(textareaElement) {
        const entryId = parseInt(textareaElement.dataset.entryId);
        const newText = textareaElement.value;
        
        const success = this.conversationManager.updateEntry(entryId, 'text', newText);
        
        if (success) {
            this.updateRowModifiedState(entryId);
            this.emit('textChanged', {
                entryId: entryId,
                newText: newText
            });
        }
    }

    handleCellBlur(event) {
        const target = event.target;
        
        if (target.matches('.text-input')) {
            this.autoResizeTextarea(target);
        }
    }

    handleKeyDown(event) {
        if (event.key === 'Tab') {
            this.handleTabNavigation(event);
        } else if (event.key === 'Enter' && event.ctrlKey) {
            this.handleCtrlEnter(event);
        }
    }

    handleTabNavigation(event) {
        const target = event.target;
        if (!target.matches('.text-input, .speaker-select')) return;

        event.preventDefault();

        const currentRow = target.closest('tr');
        const currentIndex = Array.from(this.tbody.children).indexOf(currentRow);

        let nextRow, nextInput;

        if (event.shiftKey) {
            if (target.matches('.speaker-select')) {
                const prevRow = this.tbody.children[currentIndex - 1];
                if (prevRow) {
                    nextInput = prevRow.querySelector('.text-input');
                }
            } else {
                nextInput = currentRow.querySelector('.speaker-select');
            }
        } else {
            if (target.matches('.text-input')) {
                nextRow = this.tbody.children[currentIndex + 1];
                if (nextRow) {
                    nextInput = nextRow.querySelector('.speaker-select');
                }
            } else {
                nextInput = currentRow.querySelector('.text-input');
            }
        }

        if (nextInput) {
            nextInput.focus();
        }
    }

    handleCtrlEnter(event) {
        event.preventDefault();
        const target = event.target;
        const entryId = parseInt(target.dataset.entryId);
        
        this.emit('addEntryRequested', {
            afterId: entryId
        });
    }

    updateRowModifiedState(entryId) {
        const row = this.tbody.querySelector(`tr[data-entry-id="${entryId}"]`);
        if (row) {
            const entry = this.conversationManager.getEntry(entryId);
            if (entry && entry.isModified) {
                row.classList.add('modified');
            } else {
                row.classList.remove('modified');
            }
        }
    }

    updateSpeakerSelects(speakers) {
        const selects = this.tbody.querySelectorAll('.speaker-select');
        
        selects.forEach(select => {
            const currentValue = select.value;
            const entryId = parseInt(select.dataset.entryId);
            const entry = this.conversationManager.getEntry(entryId);
            
            select.innerHTML = '';
            
            speakers.forEach(speaker => {
                const option = document.createElement('option');
                option.value = speaker;
                option.textContent = speaker;
                option.selected = speaker === entry.speaker;
                select.appendChild(option);
            });

            if (!speakers.includes(entry.speaker)) {
                const option = document.createElement('option');
                option.value = entry.speaker;
                option.textContent = entry.speaker;
                option.selected = true;
                select.insertBefore(option, select.firstChild);
            }
        });
    }

    highlightEntry(entryId) {
        const row = this.tbody.querySelector(`tr[data-entry-id="${entryId}"]`);
        if (row) {
            row.classList.add('highlighted');
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            setTimeout(() => {
                row.classList.remove('highlighted');
            }, 2000);
        }
    }

    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }

    sortTable(column, direction = 'asc') {
        const entries = [...this.currentEntries];
        
        entries.sort((a, b) => {
            let valueA, valueB;
            
            switch (column) {
                case 'time':
                    valueA = this.timeToSeconds(a.startTime);
                    valueB = this.timeToSeconds(b.startTime);
                    break;
                case 'speaker':
                    valueA = a.speaker.toLowerCase();
                    valueB = b.speaker.toLowerCase();
                    break;
                case 'text':
                    valueA = a.text.toLowerCase();
                    valueB = b.text.toLowerCase();
                    break;
                default:
                    return 0;
            }

            if (valueA < valueB) return direction === 'asc' ? -1 : 1;
            if (valueA > valueB) return direction === 'asc' ? 1 : -1;
            return 0;
        });

        this.render(entries, this.conversationManager.getAllSpeakers());
        this.emit('tableSorted', { column: column, direction: direction });
    }

    filterTable(filterText, column = 'all') {
        if (!filterText || filterText.trim() === '') {
            this.render(this.currentEntries, this.conversationManager.getAllSpeakers());
            return;
        }

        const filteredEntries = this.currentEntries.filter(entry => {
            const searchText = filterText.toLowerCase();
            
            switch (column) {
                case 'speaker':
                    return entry.speaker.toLowerCase().includes(searchText);
                case 'text':
                    return entry.text.toLowerCase().includes(searchText);
                case 'all':
                default:
                    return entry.speaker.toLowerCase().includes(searchText) ||
                           entry.text.toLowerCase().includes(searchText);
            }
        });

        this.render(filteredEntries, this.conversationManager.getAllSpeakers());
        this.emit('tableFiltered', { 
            filterText: filterText, 
            column: column, 
            resultCount: filteredEntries.length 
        });
    }

    getSelectedEntries() {
        const checkboxes = this.tbody.querySelectorAll('input[type="checkbox"]:checked');
        return Array.from(checkboxes).map(checkbox => 
            parseInt(checkbox.closest('tr').dataset.entryId)
        );
    }

    showEntry(entryId) {
        const entry = this.conversationManager.getEntry(entryId);
        if (entry) {
            this.highlightEntry(entryId);
        }
    }

    refresh() {
        const entries = this.conversationManager.getEntries();
        const speakers = this.conversationManager.getAllSpeakers();
        this.render(entries, speakers);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    timeToSeconds(timeString) {
        const [time, ms] = timeString.split(',');
        const [hours, minutes, seconds] = time.split(':').map(Number);
        return hours * 3600 + minutes * 60 + seconds + parseInt(ms) / 1000;
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}