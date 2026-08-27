// UI wiring for the resume screening app.
//
// Parsing and scoring live in their own files:
//   pdf-extract.js    -- PDF -> page text
//   resume-parser.js  -- page text -> candidates
//   scoring.js        -- job requirements + match scores

// Global state
let resumeFile = null;
let jobDescriptionText = '';
let candidates = [];
let jobRequirements = { skills: [], requiredYears: 0 };
let filteredCandidates = [];
let currentStep = 1;

// Current sort. The table starts on score, best first.
let sortState = { key: 'keywordScore', dir: 'desc' };

// Active advanced-filter selections, kept so that filtering and searching
// compose instead of overwriting each other.
let activeFilters = null;
let activeSearch = '';

// Largest resume PDF we will attempt.
const MAX_FILE_BYTES = 50 * 1024 * 1024;

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    updateStepIndicator();
});

// Initialize all event listeners
function initializeEventListeners() {
    // File upload listeners
    document.getElementById('resumeFile').addEventListener('change', handleResumeUpload);
    document.getElementById('jobDescFile').addEventListener('change', handleJobDescUpload);
    document.getElementById('jobDescText').addEventListener('input', handleJobDescText);

    // Drag and drop listeners
    setupDragAndDrop('resumeUpload', 'resumeFile');
    setupDragAndDrop('jobDescUpload', 'jobDescFile');

    // Button listeners
    document.getElementById('processBtn').addEventListener('click', startProcessing);
    document.getElementById('viewResultsBtn').addEventListener('click', () => goToStep(3));

    // Search and filter listeners
    document.getElementById('candidateSearch').addEventListener('input', searchCandidates);
    document.getElementById('selectAll').addEventListener('change', toggleSelectAll);
    document.getElementById('minScore').addEventListener('input', updateScoreValue);

    // Sortable column headers (click or keyboard).
    document.querySelectorAll('#candidatesTable th.sortable').forEach(th => {
        th.addEventListener('click', () => toggleSort(th.dataset.sortKey));
        th.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleSort(th.dataset.sortKey);
            }
        });
    });

    // Modal listeners
    document.addEventListener('click', handleModalClicks);
}

// Setup drag and drop functionality
function setupDragAndDrop(uploadAreaId, fileInputId) {
    const uploadArea = document.getElementById(uploadAreaId);
    const fileInput = document.getElementById(fileInputId);

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            fileInput.dispatchEvent(new Event('change'));
        }
    });
}

// ---------------------------------------------------------------------------
// Step 1: upload
// ---------------------------------------------------------------------------

function handleResumeUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) {
        showMessage('Please select a valid PDF file', 'error');
        return;
    }
    if (file.size > MAX_FILE_BYTES) {
        showMessage('That PDF is ' + formatFileSize(file.size) +
            '. The limit is ' + formatFileSize(MAX_FILE_BYTES) + '.', 'error');
        return;
    }

    resumeFile = file;
    showFileInfo('resumeFileInfo', file.name, formatFileSize(file.size));
    checkProcessButton();
}

// Read the job description. A PDF goes through PDF.js; plain text is read
// directly. The previous version ran readAsText() on PDFs, which fed binary
// noise into keyword matching.
async function handleJobDescUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    const isText = /\.(txt|md)$/i.test(file.name) || file.type.indexOf('text/') === 0;

    if (!isPdf && !isText) {
        showMessage('Job description must be a PDF or a plain text file.', 'error');
        return;
    }

    try {
        let text;
        if (isPdf) {
            const pages = await extractPdfPages(file);
            text = pages.join('\n');
        } else {
            text = await readFileAsText(file);
        }

        if (!text.trim()) {
            showMessage('No text could be read from that job description.', 'error');
            return;
        }

        jobDescriptionText = text;
        document.getElementById('jobDescText').value = text;
        showFileInfo('jobDescFileInfo', file.name, formatFileSize(file.size));
        checkProcessButton();
    } catch (error) {
        showMessage(describeError(error, 'Could not read the job description.'), 'error');
    }
}

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = () => reject(new Error('File could not be read.'));
        reader.readAsText(file);
    });
}

function handleJobDescText(event) {
    jobDescriptionText = event.target.value;
    checkProcessButton();
}

function showFileInfo(elementId, fileName, fileSize) {
    const fileInfo = document.getElementById(elementId);
    fileInfo.querySelector('.file-name').textContent = fileName;
    fileInfo.querySelector('.file-size').textContent = fileSize;
    fileInfo.style.display = 'flex';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function checkProcessButton() {
    const processBtn = document.getElementById('processBtn');
    processBtn.disabled = !(resumeFile && jobDescriptionText.trim());
}

// Turn a thrown value into something worth showing a user.
function describeError(error, fallback) {
    if (error && error.name === 'PdfExtractError' && error.message) return error.message;
    console.error(error);
    return fallback;
}

// ---------------------------------------------------------------------------
// Step 2: processing
// ---------------------------------------------------------------------------

async function startProcessing() {
    goToStep(2);
    document.getElementById('viewResultsBtn').disabled = true;
    document.getElementById('processingSummary').style.display = 'none';
    resetProcessingStages();

    try {
        await processResumeExtraction();
        await processJobAnalysis();
        await processKeywordScoring();

        showProcessingSummary();
        document.getElementById('viewResultsBtn').disabled = false;
    } catch (error) {
        showMessage(describeError(error, 'Error processing documents. Please try again.'), 'error');
    }
}

function resetProcessingStages() {
    ['resumeProgress', 'jobAnalysisProgress', 'scoringProgress'].forEach(id => {
        document.getElementById(id).style.width = '0%';
    });
    ['resumeStatus', 'jobAnalysisStatus', 'scoringStatus'].forEach(id => {
        const el = document.getElementById(id);
        el.classList.remove('success', 'error');
        el.innerHTML = '<i class="fas fa-clock"></i>';
    });
}

// Extract text from the bulk PDF and parse it into candidates.
//
// There is deliberately no mock-data fallback here. The original version waited
// three seconds and returned five hardcoded people regardless of the upload,
// which made a non-functional tool look functional.
async function processResumeExtraction() {
    updateProcessingStatus('resumeStatus', 'processing');
    setProgress('resumeProgress', 0);

    try {
        const pageTexts = await extractPdfPages(resumeFile, (done, total) => {
            setProgress('resumeProgress', (done / total) * 100);
        });

        candidates = parseCandidates(pageTexts);

        if (candidates.length === 0) {
            throw new PdfExtractError('NO_CANDIDATES',
                'Text was extracted but no resumes could be identified in it. ' +
                'Check that the PDF contains resumes with names and contact details.');
        }

        setProgress('resumeProgress', 100);
        updateProcessingStatus('resumeStatus', 'success');
    } catch (error) {
        updateProcessingStatus('resumeStatus', 'error');
        throw error;
    }
}

async function processJobAnalysis() {
    updateProcessingStatus('jobAnalysisStatus', 'processing');

    jobRequirements = extractJobRequirements(jobDescriptionText);

    setProgress('jobAnalysisProgress', 100);
    await delay(400);
    updateProcessingStatus('jobAnalysisStatus', 'success');
}

async function processKeywordScoring() {
    updateProcessingStatus('scoringStatus', 'processing');

    candidates.forEach(candidate => {
        candidate.keywordScore = calculateKeywordScore(candidate, jobRequirements);
    });

    setProgress('scoringProgress', 100);
    await delay(400);
    updateProcessingStatus('scoringStatus', 'success');
}

function updateProcessingStatus(statusId, status) {
    const statusElement = document.getElementById(statusId);

    if (status === 'processing') {
        statusElement.innerHTML = '<div class="loading"></div>';
    } else if (status === 'success') {
        statusElement.innerHTML = '<i class="fas fa-check-circle"></i>';
        statusElement.classList.add('success');
    } else if (status === 'error') {
        statusElement.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
        statusElement.classList.add('error');
    }
}

// Set a progress bar. .progress-fill carries a CSS width transition, so a
// direct assignment animates smoothly -- no JS timer needed.
function setProgress(progressId, percent) {
    const bar = document.getElementById(progressId);
    if (bar) bar.style.width = Math.max(0, Math.min(100, percent)) + '%';
}

function showProcessingSummary() {
    const summary = document.getElementById('processingSummary');
    const avgScore = candidates.reduce((sum, c) => sum + c.keywordScore, 0) / candidates.length;

    document.getElementById('candidateCount').textContent = candidates.length;
    document.getElementById('keywordCount').textContent = jobRequirements.skills.length;
    document.getElementById('avgScore').textContent = Math.round(avgScore) + '%';

    summary.style.display = 'block';
    renderRequirementChips();

    // A score built only from experience and education bonuses says nothing
    // about skill fit, so say so rather than letting the number stand alone.
    if (jobRequirements.skills.length === 0) {
        showMessage('No recognised skills were found in the job description, so ' +
            'match scores reflect only experience and education. Add specific ' +
            'technologies to the description for a meaningful score.', 'info');
    }
}

// ---------------------------------------------------------------------------
// Requirement review
// ---------------------------------------------------------------------------

// Show every requirement the job description yielded, tagged by where it came
// from, each removable.
//
// Term extraction cannot reliably tell a competency from an organisation name
// -- this posting yields "SAHI" and "clinician-in-the-loop" (real requirements)
// alongside "WJCF" and "NHA" (the employer and the client). Rather than pretend
// otherwise, show the list and let the reviewer correct it.
function renderRequirementChips() {
    const panel = document.getElementById('requirementsPanel');
    const container = document.getElementById('requirementChips');
    const meta = document.getElementById('requirementsMeta');
    if (!panel || !container) return;

    container.innerHTML = '';
    const skills = jobRequirements.skills || [];

    if (skills.length === 0) {
        panel.style.display = 'none';
        return;
    }

    skills.forEach(skill => {
        const source = (jobRequirements.skillSources || {})[skill] || 'vocabulary';

        const chip = document.createElement('span');
        chip.className = 'requirement-chip source-' + source;
        chip.title = source === 'jd'
            ? 'Read from the job description text'
            : 'Recognised technology';

        const label = document.createElement('span');
        label.textContent = skill;
        chip.appendChild(label);

        const remove = document.createElement('button');
        remove.className = 'chip-remove';
        remove.type = 'button';
        remove.textContent = '×';
        remove.setAttribute('aria-label', 'Remove requirement ' + skill);
        remove.addEventListener('click', () => removeRequirement(skill));
        chip.appendChild(remove);

        container.appendChild(chip);
    });

    const mined = skills.filter(s => (jobRequirements.skillSources || {})[s] === 'jd').length;
    meta.textContent = skills.length + ' requirements (' + (skills.length - mined) +
        ' recognised technologies, ' + mined + ' read from the description text)' +
        (jobRequirements.scopedToRequirements
            ? '. Read from the qualifications and responsibilities sections.'
            : '. No requirements section was found, so the whole description was used.') +
        ' Required experience: ' + (jobRequirements.requiredYears > 0
            ? jobRequirements.requiredYears + ' years.'
            : 'not stated.');

    panel.style.display = 'block';
}

// Drop a requirement and rescore every candidate against what is left.
function removeRequirement(skill) {
    jobRequirements.skills = (jobRequirements.skills || []).filter(s => s !== skill);
    if (jobRequirements.skillSources) delete jobRequirements.skillSources[skill];

    candidates.forEach(c => { c.keywordScore = calculateKeywordScore(c, jobRequirements); });

    const avg = candidates.length
        ? Math.round(candidates.reduce((s, c) => s + c.keywordScore, 0) / candidates.length)
        : 0;
    document.getElementById('keywordCount').textContent = jobRequirements.skills.length;
    document.getElementById('avgScore').textContent = avg + '%';

    renderRequirementChips();

    // Keep the table and its skill filter consistent with the new requirements.
    if (currentStep === 3) {
        populateFilterSkills();
        applyActiveView();
    }
}

// ---------------------------------------------------------------------------
// Step navigation
// ---------------------------------------------------------------------------

function goToStep(step) {
    document.querySelectorAll('.step-content').forEach(content => {
        content.classList.remove('active');
    });

    document.getElementById(`step${step}`).classList.add('active');

    currentStep = step;
    updateStepIndicator();

    if (step === 3) {
        loadCandidatesTable();
        populateFilterSkills();
    }
}

function updateStepIndicator() {
    document.querySelectorAll('.step').forEach((step, index) => {
        if (index + 1 === currentStep) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
}

// ---------------------------------------------------------------------------
// Step 3: table rendering
// ---------------------------------------------------------------------------

function loadCandidatesTable() {
    applyActiveView();
    updateClearedCount();
}

// Recompute filteredCandidates from the advanced filters AND the search box,
// then render. Previously searchCandidates() and applyFilters() each reset from
// the full list, so using one silently discarded the other.
function applyActiveView() {
    let result = candidates.slice();

    if (activeFilters) result = result.filter(c => matchesFilters(c, activeFilters));
    if (activeSearch) result = result.filter(c => matchesSearch(c, activeSearch));

    filteredCandidates = result;
    renderCandidatesTable();
}

function renderCandidatesTable() {
    sortFilteredCandidates();

    const tbody = document.getElementById('candidatesTableBody');
    tbody.innerHTML = '';

    if (filteredCandidates.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 8;
        cell.className = 'empty-row';
        cell.textContent = candidates.length === 0
            ? 'No candidates loaded yet.'
            : 'No candidates match the current filters.';
        row.appendChild(cell);
        tbody.appendChild(row);
        return;
    }

    filteredCandidates.forEach(candidate => {
        tbody.appendChild(createCandidateRow(candidate));
    });
}

// Build a row with DOM nodes and textContent.
//
// This used to be an innerHTML template. Candidate fields now come out of an
// uploaded PDF, i.e. untrusted input, so interpolating them into HTML would let
// a crafted resume run script in the page.
function createCandidateRow(candidate) {
    const row = document.createElement('tr');

    // Select checkbox
    const selectCell = document.createElement('td');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.dataset.candidateId = candidate.id;
    checkbox.setAttribute('aria-label', 'Select ' + candidate.name);
    selectCell.appendChild(checkbox);
    row.appendChild(selectCell);

    // Name, linked to the resume preview
    const nameCell = document.createElement('td');
    const link = document.createElement('a');
    link.href = '#';
    link.className = 'candidate-name';
    link.textContent = candidate.name;
    link.addEventListener('click', event => {
        event.preventDefault();
        showResumeModal(candidate.id);
    });
    nameCell.appendChild(link);
    row.appendChild(nameCell);

    row.appendChild(badgeCell('experience-badge',
        candidate.experience + (candidate.experience === 1 ? ' year' : ' years')));

    // Compact label in the column, full degree line on hover. Real degree lines
    // carry institutions, years and grades, which makes the column unreadable.
    const eduCell = badgeCell('education-badge',
        candidate.educationSummary || candidate.education);
    eduCell.title = candidate.education;
    row.appendChild(eduCell);

    // Skills: first three plus an overflow count
    const skillsCell = document.createElement('td');
    const skillsWrap = document.createElement('div');
    skillsWrap.className = 'skills-container';
    candidate.skills.slice(0, 3).forEach(skill => {
        const tag = document.createElement('span');
        tag.className = 'skill-tag';
        tag.textContent = skill;
        skillsWrap.appendChild(tag);
    });
    if (candidate.skills.length > 3) {
        const more = document.createElement('span');
        more.className = 'skill-tag';
        more.textContent = '+' + (candidate.skills.length - 3);
        more.title = candidate.skills.slice(3).join(', ');
        skillsWrap.appendChild(more);
    }
    skillsCell.appendChild(skillsWrap);
    row.appendChild(skillsCell);

    row.appendChild(badgeCell('score-badge ' + getScoreClass(candidate.keywordScore), candidate.keywordScore + '%'));
    row.appendChild(badgeCell('status-badge status-' + candidate.status, candidate.status));

    // Actions
    const actionsCell = document.createElement('td');
    const actions = document.createElement('div');
    actions.className = 'action-buttons';
    actions.appendChild(actionButton('btn-small btn-clear', 'Clear', () =>
        updateCandidateStatus(candidate.id, 'cleared')));
    actions.appendChild(actionButton('btn-small btn-reject', 'Reject', () =>
        updateCandidateStatus(candidate.id, 'rejected')));
    actionsCell.appendChild(actions);
    row.appendChild(actionsCell);

    return row;
}

function badgeCell(className, text) {
    const cell = document.createElement('td');
    const span = document.createElement('span');
    span.className = className;
    span.textContent = text;
    cell.appendChild(span);
    return cell;
}

function actionButton(className, label, onClick) {
    const button = document.createElement('button');
    button.className = className;
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
}

function getScoreClass(score) {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    if (score >= 40) return 'score-average';
    return 'score-poor';
}

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

function toggleSort(key) {
    if (!key) return;
    if (sortState.key === key) {
        sortState.dir = sortState.dir === 'asc' ? 'desc' : 'asc';
    } else {
        // Text ascends, numbers descend, on first click.
        sortState = { key: key, dir: (key === 'experience' || key === 'keywordScore') ? 'desc' : 'asc' };
    }
    renderCandidatesTable();
    updateSortIndicators();
}

function sortFilteredCandidates() {
    const key = sortState.key;
    const factor = sortState.dir === 'asc' ? 1 : -1;

    filteredCandidates.sort((a, b) => {
        const av = a[key];
        const bv = b[key];
        let cmp;
        if (typeof av === 'number' && typeof bv === 'number') {
            cmp = av - bv;
        } else {
            cmp = String(av === undefined ? '' : av)
                .localeCompare(String(bv === undefined ? '' : bv), undefined, { sensitivity: 'base' });
        }
        // Stable tie-break so equal rows keep a predictable order.
        return cmp !== 0 ? cmp * factor : a.id - b.id;
    });
}

function updateSortIndicators() {
    document.querySelectorAll('#candidatesTable th.sortable').forEach(th => {
        const icon = th.querySelector('.sort-icon');
        const isActive = th.dataset.sortKey === sortState.key;
        th.setAttribute('aria-sort', isActive
            ? (sortState.dir === 'asc' ? 'ascending' : 'descending')
            : 'none');
        th.classList.toggle('sorted', isActive);
        if (icon) {
            icon.className = 'fas sort-icon ' + (isActive
                ? (sortState.dir === 'asc' ? 'fa-sort-up' : 'fa-sort-down')
                : 'fa-sort');
        }
    });
}

// ---------------------------------------------------------------------------
// Status changes
// ---------------------------------------------------------------------------

function updateCandidateStatus(candidateId, status) {
    const candidate = candidates.find(c => c.id === candidateId);
    if (candidate) {
        candidate.status = status;
        loadCandidatesTable();
    }
}

// Apply a status to every checked row. The checkboxes and the select-all box
// already existed but nothing consumed the selection.
function bulkUpdateStatus(status) {
    const checked = document.querySelectorAll('#candidatesTableBody input[data-candidate-id]:checked');
    if (checked.length === 0) {
        showMessage('Select one or more candidates first.', 'info');
        return;
    }

    const ids = Array.from(checked).map(box => parseInt(box.dataset.candidateId, 10));
    candidates.forEach(candidate => {
        if (ids.indexOf(candidate.id) !== -1) candidate.status = status;
    });

    document.getElementById('selectAll').checked = false;
    loadCandidatesTable();
    showMessage('Marked ' + ids.length + ' candidate(s) as ' + status + '.', 'success');
}

function toggleSelectAll() {
    const selectAll = document.getElementById('selectAll');
    document.querySelectorAll('#candidatesTableBody input[data-candidate-id]').forEach(checkbox => {
        checkbox.checked = selectAll.checked;
    });
}

function updateClearedCount() {
    const clearedCount = candidates.filter(c => c.status === 'cleared').length;
    document.getElementById('clearedCount').textContent = clearedCount;
}

// ---------------------------------------------------------------------------
// Search and filters
// ---------------------------------------------------------------------------

function searchCandidates() {
    activeSearch = document.getElementById('candidateSearch').value.toLowerCase().trim();
    applyActiveView();
}

function matchesSearch(candidate, term) {
    return candidate.name.toLowerCase().indexOf(term) !== -1 ||
        candidate.education.toLowerCase().indexOf(term) !== -1 ||
        candidate.skills.some(skill => skill.toLowerCase().indexOf(term) !== -1);
}

function populateFilterSkills() {
    const skillsFilter = document.getElementById('skillsFilter');
    skillsFilter.innerHTML = '';

    // Offer the job's required skills first -- those are what filtering is for --
    // then anything else the candidates bring.
    const required = jobRequirements.skills || [];
    const fromCandidates = candidates.reduce((all, c) => all.concat(c.skills), []);
    const seen = {};
    const ordered = [];
    required.concat(fromCandidates).forEach(skill => {
        const key = skill.toLowerCase();
        if (seen[key]) return;
        seen[key] = true;
        ordered.push(skill);
    });

    ordered.forEach(skill => {
        const label = document.createElement('label');
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.value = skill;            // property assignment, not HTML
        label.appendChild(input);
        label.appendChild(document.createTextNode(' ' + skill));
        skillsFilter.appendChild(label);
    });
}

function updateScoreValue() {
    const minScore = document.getElementById('minScore').value;
    document.getElementById('minScoreValue').textContent = minScore + '%';
}

// Read the filter modal into a plain object. Sections are addressed by id --
// they used to be found by position (:nth-child(2), :last-child), which broke
// if anyone reordered the markup.
function readFilterForm() {
    const checkedValues = sectionId => Array.from(
        document.querySelectorAll('#' + sectionId + ' input[type="checkbox"]:checked')
    ).map(input => input.value);

    return {
        minExperience: parseInt(document.getElementById('minExperience').value, 10) || 0,
        maxExperience: parseInt(document.getElementById('maxExperience').value, 10) || 50,
        minScore: parseInt(document.getElementById('minScore').value, 10) || 0,
        education: checkedValues('filterEducation'),
        skills: checkedValues('filterSkills'),
        statuses: checkedValues('filterStatus')
    };
}

function matchesFilters(candidate, filters) {
    if (candidate.experience < filters.minExperience) return false;
    if (candidate.experience > filters.maxExperience) return false;
    if (candidate.keywordScore < filters.minScore) return false;

    if (filters.education.length > 0) {
        const education = candidate.education.toLowerCase();
        if (!filters.education.some(level => education.indexOf(level) !== -1)) return false;
    }

    if (filters.skills.length > 0) {
        const own = candidate.skills.map(s => s.toLowerCase());
        if (!filters.skills.some(skill => own.indexOf(skill.toLowerCase()) !== -1)) return false;
    }

    if (filters.statuses.length > 0 && filters.statuses.indexOf(candidate.status) === -1) {
        return false;
    }

    return true;
}

function applyFilters() {
    activeFilters = readFilterForm();
    applyActiveView();
    closeFilterModal();
}

function clearFilters() {
    document.getElementById('minExperience').value = 0;
    document.getElementById('maxExperience').value = 50;
    document.getElementById('minScore').value = 0;
    document.getElementById('minScoreValue').textContent = '0%';

    document.querySelectorAll('#filterModal input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });

    // All statuses on by default. With only 'pending' checked, clearing a
    // candidate made them disappear from the table, which looked like data loss.
    document.querySelectorAll('#filterStatus input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = true;
    });

    activeFilters = null;
    applyActiveView();
}

// ---------------------------------------------------------------------------
// Modals
// ---------------------------------------------------------------------------

function openFilterModal() {
    document.getElementById('filterModal').classList.add('show');
}

function closeFilterModal() {
    document.getElementById('filterModal').classList.remove('show');
}

// Candidate detail: a structured summary of what was parsed, with the raw
// extracted text available but tucked away.
//
// Everything here is set with textContent, never innerHTML, because every value
// originates in an uploaded PDF.
function showResumeModal(candidateId) {
    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate) return;

    document.getElementById('resumeModalTitle').textContent = candidate.name;

    const container = document.getElementById('resumeContent');
    container.innerHTML = '';

    // --- Headline and contact details ---
    if (candidate.headline) {
        const headline = document.createElement('p');
        headline.className = 'cd-headline';
        headline.textContent = candidate.headline;
        container.appendChild(headline);
    }

    const contactBits = [];
    if (candidate.email) contactBits.push({ icon: 'fa-envelope', text: candidate.email });
    if (candidate.phone) contactBits.push({ icon: 'fa-phone', text: candidate.phone });
    if (contactBits.length > 0) {
        const contact = document.createElement('p');
        contact.className = 'cd-contact';
        contactBits.forEach((bit, i) => {
            if (i > 0) contact.appendChild(document.createTextNode('   '));
            const icon = document.createElement('i');
            icon.className = 'fas ' + bit.icon;
            contact.appendChild(icon);
            contact.appendChild(document.createTextNode(' ' + bit.text));
        });
        container.appendChild(contact);
    }

    // --- Key parameters ---
    const tiles = document.createElement('div');
    tiles.className = 'cd-tiles';
    tiles.appendChild(detailTile('Keyword Score', candidate.keywordScore + '%',
        getScoreClass(candidate.keywordScore)));
    tiles.appendChild(detailTile('Experience',
        candidate.experience + (candidate.experience === 1 ? ' year' : ' years'),
        '', candidate.experienceSource === 'stated'
            ? 'Stated on the resume'
            : candidate.experienceSource === 'dates'
                ? 'Totalled from dated roles'
                : 'Could not be determined'));
    tiles.appendChild(detailTile('Education', candidate.educationLevel || 'Not specified',
        '', candidate.education));
    tiles.appendChild(detailTile('Status', candidate.status, 'status-' + candidate.status));
    container.appendChild(tiles);

    // --- Requirement match ---
    const required = jobRequirements.skills || [];
    if (required.length > 0) {
        const matched = candidate.matchedSkills || [];
        const missing = required.filter(s => matched.indexOf(s) === -1);

        container.appendChild(detailSection(
            'Requirements met (' + matched.length + ' of ' + required.length + ')',
            matched, 'cd-tag-match', 'No requirements were evidenced in this resume.'));
        container.appendChild(detailSection(
            'Not evidenced (' + missing.length + ')',
            missing, 'cd-tag-missing', 'Every requirement was evidenced.'));
    }

    // --- Everything else detected ---
    const extras = (candidate.skills || []).filter(s => (candidate.matchedSkills || []).indexOf(s) === -1);
    if (extras.length > 0) {
        container.appendChild(detailSection(
            'Other skills detected (' + extras.length + ')', extras, 'cd-tag-other', ''));
    }

    // --- Raw text, collapsed ---
    const details = document.createElement('details');
    details.className = 'cd-raw';
    const toggle = document.createElement('summary');
    toggle.textContent = 'Full extracted text';
    details.appendChild(toggle);
    const pre = document.createElement('pre');
    pre.className = 'resume-text';
    pre.textContent = candidate.resumeText;
    details.appendChild(pre);
    container.appendChild(details);

    document.getElementById('resumeModal').classList.add('show');
}

function detailTile(label, value, valueClass, hint) {
    const tile = document.createElement('div');
    tile.className = 'cd-tile';
    if (hint) tile.title = hint;

    const l = document.createElement('div');
    l.className = 'cd-tile-label';
    l.textContent = label;
    tile.appendChild(l);

    const v = document.createElement('div');
    v.className = 'cd-tile-value' + (valueClass ? ' ' + valueClass : '');
    v.textContent = value;
    tile.appendChild(v);

    return tile;
}

function detailSection(heading, items, tagClass, emptyText) {
    const wrap = document.createElement('div');
    wrap.className = 'cd-section';

    const h = document.createElement('h5');
    h.textContent = heading;
    wrap.appendChild(h);

    if (items.length === 0) {
        if (emptyText) {
            const p = document.createElement('p');
            p.className = 'cd-empty';
            p.textContent = emptyText;
            wrap.appendChild(p);
        }
        return wrap;
    }

    const tags = document.createElement('div');
    tags.className = 'cd-tags';
    items.forEach(item => {
        const tag = document.createElement('span');
        tag.className = 'cd-tag ' + tagClass;
        tag.textContent = item;
        tags.appendChild(tag);
    });
    wrap.appendChild(tags);
    return wrap;
}

function closeResumeModal() {
    document.getElementById('resumeModal').classList.remove('show');
}

function handleModalClicks(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('show');
    }
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

function exportClearedCandidates() {
    const clearedCandidates = candidates.filter(c => c.status === 'cleared');

    if (clearedCandidates.length === 0) {
        showMessage('No cleared candidates to export', 'info');
        return;
    }

    const exportData = clearedCandidates.map(candidate => ({
        'Name': candidate.name,
        'Email': candidate.email || '',
        'Phone': candidate.phone || '',
        'Experience (Years)': candidate.experience,
        'Education': candidate.education,
        'Key Skills': candidate.skills.join(', '),
        'Keyword Score (%)': candidate.keywordScore,
        'Status': candidate.status
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, 'Cleared Candidates');

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    XLSX.writeFile(wb, `cleared_candidates_${timestamp}.xlsx`);

    showMessage(`Exported ${clearedCandidates.length} cleared candidates successfully!`, 'success');
}

// ---------------------------------------------------------------------------
// Sample data (demo only)
// ---------------------------------------------------------------------------

// Load the fixtures from test-data.js so the screening UI can be explored
// without a PDF. Explicit and user-initiated -- the processing pipeline never
// falls back to this.
function loadSampleData() {
    if (typeof enhancedTestCandidates === 'undefined') {
        showMessage('Sample data is unavailable (test-data.js did not load).', 'error');
        return;
    }

    // The fixtures never pass through parseCandidates(), so derive the fields
    // the table and detail view expect rather than leaving them undefined.
    candidates = enhancedTestCandidates.map((c, i) => {
        const level = detectEducationLevel(c.education, { education: c.education });
        return Object.assign({}, c, {
            id: i + 1,
            status: 'pending',
            email: c.email || '',
            phone: c.phone || '',
            headline: c.headline || extractHeadline(c.resumeText || '', c.name),
            educationLevel: level,
            educationSummary: summariseEducation(c.education, level),
            experienceSource: 'stated'
        });
    });

    if (!jobDescriptionText.trim() && typeof testJobDescriptions !== 'undefined') {
        jobDescriptionText = testJobDescriptions.fullstack;
        document.getElementById('jobDescText').value = jobDescriptionText;
    }

    jobRequirements = extractJobRequirements(jobDescriptionText);
    candidates.forEach(c => { c.keywordScore = calculateKeywordScore(c, jobRequirements); });

    showMessage('Loaded ' + candidates.length + ' sample candidates. This is demo data, not a real screening.', 'info');
    goToStep(3);
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function showMessage(text, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = text;

    const currentStepContent = document.querySelector('.step-content.active');
    currentStepContent.insertBefore(messageDiv, currentStepContent.firstChild);

    setTimeout(() => {
        messageDiv.remove();
    }, 8000);
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
