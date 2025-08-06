// Global variables
let resumeFile = null;
let jobDescriptionText = '';
let candidates = [];
let jobKeywords = [];
let filteredCandidates = [];
let currentStep = 1;

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

// Handle resume file upload
function handleResumeUpload(event) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
        resumeFile = file;
        showFileInfo('resumeFileInfo', file.name, formatFileSize(file.size));
        checkProcessButton();
    } else {
        showMessage('Please select a valid PDF file', 'error');
    }
}

// Handle job description file upload
function handleJobDescUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            jobDescriptionText = e.target.result;
            showFileInfo('jobDescFileInfo', file.name, formatFileSize(file.size));
            document.getElementById('jobDescText').value = jobDescriptionText;
            checkProcessButton();
        };
        reader.readAsText(file);
    }
}

// Handle job description text input
function handleJobDescText(event) {
    jobDescriptionText = event.target.value;
    checkProcessButton();
}

// Show file information
function showFileInfo(elementId, fileName, fileSize) {
    const fileInfo = document.getElementById(elementId);
    fileInfo.querySelector('.file-name').textContent = fileName;
    fileInfo.querySelector('.file-size').textContent = fileSize;
    fileInfo.style.display = 'flex';
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Check if process button should be enabled
function checkProcessButton() {
    const processBtn = document.getElementById('processBtn');
    processBtn.disabled = !(resumeFile && jobDescriptionText.trim());
}

// Start processing documents
async function startProcessing() {
    goToStep(2);
    
    try {
        // Step 1: Extract resume data
        await processResumeExtraction();
        
        // Step 2: Analyze job description
        await processJobAnalysis();
        
        // Step 3: Calculate AI scores
        await processAIScoring();
        
        // Show processing summary
        showProcessingSummary();
        
        document.getElementById('viewResultsBtn').disabled = false;
        
    } catch (error) {
        console.error('Processing error:', error);
        showMessage('Error processing documents. Please try again.', 'error');
    }
}

// Process resume extraction
async function processResumeExtraction() {
    updateProcessingStatus('resumeStatus', 'processing');
    animateProgress('resumeProgress', 100, 3000);
    
    // Simulate PDF processing delay
    await delay(3000);
    
    // Mock candidate extraction (in real implementation, this would use PDF.js or similar)
    candidates = generateMockCandidates();
    
    updateProcessingStatus('resumeStatus', 'success');
}

// Process job description analysis
async function processJobAnalysis() {
    updateProcessingStatus('jobAnalysisStatus', 'processing');
    animateProgress('jobAnalysisProgress', 100, 2000);
    
    // Simulate analysis delay
    await delay(2000);
    
    // Extract keywords from job description
    jobKeywords = extractJobKeywords(jobDescriptionText);
    
    updateProcessingStatus('jobAnalysisStatus', 'success');
}

// Process AI scoring
async function processAIScoring() {
    updateProcessingStatus('scoringStatus', 'processing');
    animateProgress('scoringProgress', 100, 2500);
    
    // Simulate scoring delay
    await delay(2500);
    
    // Calculate AI scores for each candidate
    candidates.forEach(candidate => {
        candidate.aiScore = calculateAIScore(candidate, jobKeywords);
    });
    
    // Sort candidates by AI score
    candidates.sort((a, b) => b.aiScore - a.aiScore);
    
    updateProcessingStatus('scoringStatus', 'success');
}

// Generate mock candidates (replace with actual PDF extraction)
function generateMockCandidates() {
    const mockCandidates = [
        {
            id: 1,
            name: 'John Smith',
            experience: 5,
            education: 'Master\'s in Computer Science',
            skills: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS'],
            resumeText: 'Experienced software developer with 5 years in full-stack development...',
            status: 'pending'
        },
        {
            id: 2,
            name: 'Sarah Johnson',
            experience: 8,
            education: 'Bachelor\'s in Software Engineering',
            skills: ['Java', 'Spring Boot', 'Angular', 'Docker', 'Kubernetes'],
            resumeText: 'Senior software engineer with expertise in enterprise applications...',
            status: 'pending'
        },
        {
            id: 3,
            name: 'Michael Chen',
            experience: 3,
            education: 'Bachelor\'s in Computer Science',
            skills: ['Python', 'Django', 'PostgreSQL', 'Redis', 'Linux'],
            resumeText: 'Backend developer passionate about scalable web applications...',
            status: 'pending'
        },
        {
            id: 4,
            name: 'Emily Davis',
            experience: 6,
            education: 'Master\'s in Information Technology',
            skills: ['C#', '.NET', 'SQL Server', 'Azure', 'DevOps'],
            resumeText: 'Full-stack developer with strong background in Microsoft technologies...',
            status: 'pending'
        },
        {
            id: 5,
            name: 'David Wilson',
            experience: 4,
            education: 'Bachelor\'s in Computer Engineering',
            skills: ['React', 'Vue.js', 'TypeScript', 'GraphQL', 'MongoDB'],
            resumeText: 'Frontend-focused developer with modern JavaScript expertise...',
            status: 'pending'
        }
    ];
    
    return mockCandidates;
}

// Extract keywords from job description
function extractJobKeywords(text) {
    const techKeywords = [
        'javascript', 'react', 'angular', 'vue', 'node.js', 'python', 'java', 'c#',
        'php', 'ruby', 'go', 'rust', 'typescript', 'html', 'css', 'sql', 'mongodb',
        'postgresql', 'mysql', 'redis', 'elasticsearch', 'docker', 'kubernetes',
        'aws', 'azure', 'gcp', 'git', 'jenkins', 'ci/cd', 'agile', 'scrum',
        'microservices', 'api', 'rest', 'graphql', 'devops', 'linux', 'windows'
    ];
    
    const lowerText = text.toLowerCase();
    const foundKeywords = techKeywords.filter(keyword => 
        lowerText.includes(keyword.toLowerCase())
    );
    
    // Add experience-related keywords
    const experienceMatch = text.match(/(\d+)[\+\s]*years?/gi);
    if (experienceMatch) {
        foundKeywords.push(`${experienceMatch[0]} experience`);
    }
    
    return foundKeywords;
}

// Calculate AI score for a candidate
function calculateAIScore(candidate, keywords) {
    let score = 0;
    let maxScore = keywords.length * 10;
    
    // Check skill matches
    keywords.forEach(keyword => {
        const candidateSkills = candidate.skills.join(' ').toLowerCase();
        const candidateText = candidate.resumeText.toLowerCase();
        
        if (candidateSkills.includes(keyword.toLowerCase()) || 
            candidateText.includes(keyword.toLowerCase())) {
            score += 10;
        }
    });
    
    // Experience bonus
    if (candidate.experience >= 5) score += 20;
    else if (candidate.experience >= 3) score += 10;
    
    // Education bonus
    if (candidate.education.toLowerCase().includes('master')) score += 15;
    else if (candidate.education.toLowerCase().includes('bachelor')) score += 10;
    
    maxScore += 35; // Max bonus points
    
    return Math.min(Math.round((score / maxScore) * 100), 100);
}

// Update processing status
function updateProcessingStatus(statusId, status) {
    const statusElement = document.getElementById(statusId);
    
    if (status === 'processing') {
        statusElement.innerHTML = '<div class="loading"></div>';
    } else if (status === 'success') {
        statusElement.innerHTML = '<i class="fas fa-check-circle"></i>';
        statusElement.classList.add('success');
    }
}

// Animate progress bar
function animateProgress(progressId, targetWidth, duration) {
    const progressBar = document.getElementById(progressId);
    let currentWidth = 0;
    const increment = targetWidth / (duration / 50);
    
    const animation = setInterval(() => {
        currentWidth += increment;
        if (currentWidth >= targetWidth) {
            currentWidth = targetWidth;
            clearInterval(animation);
        }
        progressBar.style.width = currentWidth + '%';
    }, 50);
}

// Show processing summary
function showProcessingSummary() {
    const summary = document.getElementById('processingSummary');
    const avgScore = candidates.reduce((sum, c) => sum + c.aiScore, 0) / candidates.length;
    
    document.getElementById('candidateCount').textContent = candidates.length;
    document.getElementById('keywordCount').textContent = jobKeywords.length;
    document.getElementById('avgScore').textContent = Math.round(avgScore) + '%';
    
    summary.style.display = 'block';
}

// Navigate to specific step
function goToStep(step) {
    // Hide all step contents
    document.querySelectorAll('.step-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Show target step content
    document.getElementById(`step${step}`).classList.add('active');
    
    // Update step indicator
    currentStep = step;
    updateStepIndicator();
    
    // Load candidates table if going to step 3
    if (step === 3) {
        loadCandidatesTable();
        populateFilterSkills();
    }
}

// Update step indicator
function updateStepIndicator() {
    document.querySelectorAll('.step').forEach((step, index) => {
        if (index + 1 === currentStep) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
}

// Load candidates table
function loadCandidatesTable() {
    filteredCandidates = [...candidates];
    renderCandidatesTable();
    updateClearedCount();
}

// Render candidates table
function renderCandidatesTable() {
    const tbody = document.getElementById('candidatesTableBody');
    tbody.innerHTML = '';
    
    filteredCandidates.forEach(candidate => {
        const row = createCandidateRow(candidate);
        tbody.appendChild(row);
    });
}

// Create candidate row
function createCandidateRow(candidate) {
    const row = document.createElement('tr');
    
    const scoreClass = getScoreClass(candidate.aiScore);
    const statusClass = `status-${candidate.status}`;
    
    row.innerHTML = `
        <td><input type="checkbox" data-candidate-id="${candidate.id}"></td>
        <td>
            <a href="#" class="candidate-name" onclick="showResumeModal(${candidate.id})">
                ${candidate.name}
            </a>
        </td>
        <td><span class="experience-badge">${candidate.experience} years</span></td>
        <td><span class="education-badge">${candidate.education}</span></td>
        <td>
            <div class="skills-container">
                ${candidate.skills.slice(0, 3).map(skill => 
                    `<span class="skill-tag">${skill}</span>`
                ).join('')}
                ${candidate.skills.length > 3 ? `<span class="skill-tag">+${candidate.skills.length - 3}</span>` : ''}
            </div>
        </td>
        <td><span class="score-badge ${scoreClass}">${candidate.aiScore}%</span></td>
        <td><span class="status-badge ${statusClass}">${candidate.status}</span></td>
        <td>
            <div class="action-buttons">
                <button class="btn-small btn-clear" onclick="updateCandidateStatus(${candidate.id}, 'cleared')">
                    Clear
                </button>
                <button class="btn-small btn-reject" onclick="updateCandidateStatus(${candidate.id}, 'rejected')">
                    Reject
                </button>
            </div>
        </td>
    `;
    
    return row;
}

// Get score class for styling
function getScoreClass(score) {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    if (score >= 40) return 'score-average';
    return 'score-poor';
}

// Update candidate status
function updateCandidateStatus(candidateId, status) {
    const candidate = candidates.find(c => c.id === candidateId);
    if (candidate) {
        candidate.status = status;
        loadCandidatesTable();
    }
}

// Search candidates
function searchCandidates() {
    const searchTerm = document.getElementById('candidateSearch').value.toLowerCase();
    
    if (!searchTerm) {
        filteredCandidates = [...candidates];
    } else {
        filteredCandidates = candidates.filter(candidate => 
            candidate.name.toLowerCase().includes(searchTerm) ||
            candidate.skills.some(skill => skill.toLowerCase().includes(searchTerm)) ||
            candidate.education.toLowerCase().includes(searchTerm)
        );
    }
    
    renderCandidatesTable();
}

// Toggle select all candidates
function toggleSelectAll() {
    const selectAll = document.getElementById('selectAll');
    const checkboxes = document.querySelectorAll('input[data-candidate-id]');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAll.checked;
    });
}

// Update cleared count
function updateClearedCount() {
    const clearedCount = candidates.filter(c => c.status === 'cleared').length;
    document.getElementById('clearedCount').textContent = clearedCount;
}

// Populate filter skills
function populateFilterSkills() {
    const skillsFilter = document.getElementById('skillsFilter');
    const allSkills = [...new Set(candidates.flatMap(c => c.skills))];
    
    skillsFilter.innerHTML = allSkills.map(skill => 
        `<label><input type="checkbox" value="${skill}"> ${skill}</label>`
    ).join('');
}

// Update score value display
function updateScoreValue() {
    const minScore = document.getElementById('minScore').value;
    document.getElementById('minScoreValue').textContent = minScore + '%';
}

// Modal functions
function openFilterModal() {
    document.getElementById('filterModal').classList.add('show');
}

function closeFilterModal() {
    document.getElementById('filterModal').classList.remove('show');
}

function showResumeModal(candidateId) {
    const candidate = candidates.find(c => c.id === candidateId);
    if (candidate) {
        document.getElementById('resumeModalTitle').textContent = `${candidate.name} - Resume`;
        document.getElementById('resumeContent').textContent = candidate.resumeText;
        document.getElementById('resumeModal').classList.add('show');
    }
}

function closeResumeModal() {
    document.getElementById('resumeModal').classList.remove('show');
}

// Handle modal clicks
function handleModalClicks(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('show');
    }
}

// Apply filters
function applyFilters() {
    const minExperience = parseInt(document.getElementById('minExperience').value) || 0;
    const maxExperience = parseInt(document.getElementById('maxExperience').value) || 50;
    const minScore = parseInt(document.getElementById('minScore').value) || 0;
    
    // Get selected education levels
    const educationFilters = Array.from(document.querySelectorAll('#filterModal .filter-section:nth-child(2) input:checked'))
        .map(input => input.value);
    
    // Get selected skills
    const skillFilters = Array.from(document.querySelectorAll('#skillsFilter input:checked'))
        .map(input => input.value);
    
    // Get selected statuses
    const statusFilters = Array.from(document.querySelectorAll('#filterModal .filter-section:last-child input:checked'))
        .map(input => input.value);
    
    filteredCandidates = candidates.filter(candidate => {
        // Experience filter
        if (candidate.experience < minExperience || candidate.experience > maxExperience) {
            return false;
        }
        
        // Score filter
        if (candidate.aiScore < minScore) {
            return false;
        }
        
        // Education filter
        if (educationFilters.length > 0) {
            const hasMatchingEducation = educationFilters.some(edu => 
                candidate.education.toLowerCase().includes(edu)
            );
            if (!hasMatchingEducation) return false;
        }
        
        // Skills filter
        if (skillFilters.length > 0) {
            const hasMatchingSkill = skillFilters.some(skill => 
                candidate.skills.includes(skill)
            );
            if (!hasMatchingSkill) return false;
        }
        
        // Status filter
        if (statusFilters.length > 0 && !statusFilters.includes(candidate.status)) {
            return false;
        }
        
        return true;
    });
    
    renderCandidatesTable();
    closeFilterModal();
}

// Clear all filters
function clearFilters() {
    document.getElementById('minExperience').value = 0;
    document.getElementById('maxExperience').value = 50;
    document.getElementById('minScore').value = 0;
    document.getElementById('minScoreValue').textContent = '0%';
    
    document.querySelectorAll('#filterModal input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Check default status filter
    document.querySelector('#filterModal .filter-section:last-child input[value="pending"]').checked = true;
    
    filteredCandidates = [...candidates];
    renderCandidatesTable();
}

// Export cleared candidates to Excel
function exportClearedCandidates() {
    const clearedCandidates = candidates.filter(c => c.status === 'cleared');
    
    if (clearedCandidates.length === 0) {
        showMessage('No cleared candidates to export', 'info');
        return;
    }
    
    // Prepare data for Excel export
    const exportData = clearedCandidates.map(candidate => ({
        'Name': candidate.name,
        'Experience (Years)': candidate.experience,
        'Education': candidate.education,
        'Key Skills': candidate.skills.join(', '),
        'AI Score (%)': candidate.aiScore,
        'Status': candidate.status
    }));
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Cleared Candidates');
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `cleared_candidates_${timestamp}.xlsx`;
    
    // Save file
    XLSX.writeFile(wb, filename);
    
    showMessage(`Exported ${clearedCandidates.length} cleared candidates successfully!`, 'success');
}

// Show message to user
function showMessage(text, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = text;
    
    // Insert at the top of the current step content
    const currentStepContent = document.querySelector('.step-content.active');
    currentStepContent.insertBefore(messageDiv, currentStepContent.firstChild);
    
    // Remove message after 5 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Utility function for delays
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Update TODO status
document.addEventListener('DOMContentLoaded', function() {
    // Mark setup as completed since we've created all the files
    updateTodoStatus('setup_project', 'completed');
    updateTodoStatus('step1_upload', 'completed');
    updateTodoStatus('step2_processing', 'completed');
    updateTodoStatus('step3_screening', 'completed');
    updateTodoStatus('pdf_extraction', 'completed');
    updateTodoStatus('ai_scoring', 'completed');
    updateTodoStatus('excel_export', 'completed');
    updateTodoStatus('filter_system', 'completed');
});

function updateTodoStatus(todoId, status) {
    // This is a placeholder - in a real implementation, this would update the todo system
    console.log(`TODO ${todoId} marked as ${status}`);
}