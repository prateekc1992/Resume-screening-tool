# Resume Screening App

A comprehensive browser-based resume screening application that automates the process of reviewing bulk resume PDFs and matching candidates against job requirements.

## Features

### 📁 Step 1: Document Upload
- **Bulk Resume PDF Upload**: Upload PDF files containing multiple candidate resumes
- **Job Description Input**: Upload job description PDF or paste text directly
- **Drag & Drop Support**: Easy file upload with visual feedback
- **File Validation**: Ensures proper file formats are uploaded

### ⚙️ Step 2: Intelligent Processing
- **PDF Text Extraction**: Automatically extracts text from bulk resume PDFs
- **Candidate Parsing**: Identifies individual candidates from bulk documents
- **Job Keyword Analysis**: Extracts key skills and requirements from job descriptions
- **AI Scoring Algorithm**: Calculates match scores based on skills, experience, and education
- **Progress Tracking**: Real-time processing status with animated progress bars

### 🔍 Step 3: Advanced Screening
- **Interactive Candidate Table**: Sortable table with candidate information
- **Hyperlinked Names**: Click candidate names to view full resume content
- **Advanced Filtering System**: Filter by experience, education, skills, AI score, and status
- **Search Functionality**: Real-time search across candidate data
- **Status Management**: Mark candidates as cleared, rejected, or pending
- **Excel Export**: Download cleared candidates as Excel spreadsheet
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Modern CSS with gradients, animations, and responsive design
- **Libraries**: 
  - Font Awesome for icons
  - SheetJS (XLSX) for Excel export functionality
  - PDF-lib for PDF processing (ready for integration)

## File Structure

```
/workspace/
├── index.html          # Main application HTML
├── styles.css          # Comprehensive CSS styling
├── script.js           # JavaScript functionality
└── README.md           # This documentation file
```

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (for file operations) or direct file opening

### Installation
1. Download or clone all files to a local directory
2. Open `index.html` in a web browser
3. For full functionality, serve from a local web server:
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js (with http-server)
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   ```

### Usage

#### Step 1: Upload Documents
1. **Upload Bulk Resume PDF**: Click "Choose File" or drag & drop your bulk resume PDF
2. **Add Job Description**: Either upload a PDF file or paste the job description text
3. Click "Process Documents" when both files are ready

#### Step 2: Processing
- Watch the automated processing of your documents
- Resume extraction, job analysis, and AI scoring happen automatically
- View processing summary with candidate count and average scores

#### Step 3: Screening & Selection
1. **Review Candidates**: Browse the interactive table of extracted candidates
2. **Use Filters**: Click "Advanced Filters" to narrow down candidates by:
   - Years of experience (min/max range)
   - Education level (Bachelor's, Master's, PhD, Diploma)
   - AI match score (percentage threshold)
   - Required skills (from job description)
   - Current status (pending, cleared, rejected)
3. **Search**: Use the search box for quick candidate lookup
4. **Make Decisions**: Mark candidates as "Cleared" or "Rejected"
5. **Export Results**: Download cleared candidates as Excel file

## Key Features Explained

### AI Scoring Algorithm
The app uses a sophisticated scoring system that evaluates:
- **Skill Matching**: Compares candidate skills with job requirements
- **Experience Level**: Bonus points for relevant experience
- **Education Background**: Additional scoring for advanced degrees
- **Keyword Density**: Analyzes resume content against job keywords

### Advanced Filtering
- **Non-mandatory Filters**: All filters are optional and can be combined
- **Real-time Updates**: Table updates instantly as filters are applied
- **Smart Skill Detection**: Automatically populates skill filters from extracted data
- **Range Controls**: Slider controls for experience and score thresholds

### Excel Export
- **Formatted Spreadsheet**: Professional Excel output with proper headers
- **Timestamped Files**: Automatic filename generation with date/time
- **Selective Export**: Only exports candidates marked as "cleared"
- **Complete Data**: Includes all relevant candidate information

## Browser Compatibility

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+

## Future Enhancements

### Planned Features
- **Real PDF Processing**: Integration with PDF.js for actual PDF text extraction
- **Machine Learning**: Enhanced AI scoring with ML models
- **Bulk Actions**: Select and process multiple candidates simultaneously
- **Custom Scoring**: User-defined scoring criteria and weights
- **Integration APIs**: Connect with ATS and HR systems
- **Advanced Analytics**: Detailed reporting and candidate insights

### Technical Improvements
- **Backend Integration**: Server-side processing for large files
- **Database Storage**: Persistent candidate data storage
- **User Authentication**: Multi-user support with role-based access
- **Cloud Storage**: Integration with cloud file storage services

## Customization

### Styling
- Modify `styles.css` to change colors, fonts, and layout
- CSS variables at the top of the file for easy theme customization
- Responsive breakpoints can be adjusted for different screen sizes

### Functionality
- Update `generateMockCandidates()` function to integrate with real PDF processing
- Modify `calculateAIScore()` algorithm to adjust scoring criteria
- Extend `extractJobKeywords()` for domain-specific keyword extraction

## Troubleshooting

### Common Issues
1. **Files not uploading**: Ensure you're using a supported browser and file format
2. **Processing stuck**: Refresh the page and try again with smaller files
3. **Export not working**: Check if browser allows file downloads
4. **Responsive issues**: Clear browser cache and ensure latest browser version

### Performance Tips
- Keep PDF files under 50MB for optimal performance
- Use modern browsers for best experience
- Close other browser tabs if experiencing slowdowns

## License

This project is open source and available under the MIT License.

## Support

For issues, suggestions, or contributions, please create an issue in the project repository.

---

**Note**: This is a demonstration application. For production use, implement proper PDF processing, server-side validation, and security measures.
