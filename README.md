# Resume Screening App

A comprehensive browser-based resume screening application that automates the process of reviewing bulk resume PDFs and matching candidates against job requirements.

## Features

### 📁 Step 1: Document Upload
- **Bulk Resume PDF Upload**: Upload PDF files containing multiple candidate resumes
- **Job Description Input**: Upload job description PDF or paste text directly
- **Drag & Drop Support**: Easy file upload with visual feedback
- **File Validation**: Ensures proper file formats are uploaded

### ⚙️ Step 2: Processing
- **PDF Text Extraction**: Real extraction via PDF.js. Text fragments are regrouped
  into lines by position, so headings and date ranges survive
- **Candidate Parsing**: Splits a bulk PDF into individual resumes on page
  boundaries (contact block, name line, or an explicit "Resume" banner), then
  extracts name, email, phone, years of experience, highest degree and skills
- **Job Requirement Analysis**: Reads requirement terms *out of the job
  description*, so terms nobody put on a list still count, and reads the stated
  years-of-experience requirement
- **Match Scoring**: Keyword-and-rules scoring (see below) -- not machine learning
- **Progress Tracking**: The extraction bar tracks real page-by-page progress

### 🔍 Step 3: Advanced Screening
- **Interactive Candidate Table**: Click any column header to sort (keyboard
  accessible; `aria-sort` is maintained)
- **Hyperlinked Names**: Click a candidate name to read their extracted resume
- **Advanced Filtering System**: Filter by experience, education, skills, match
  score, and status. Filters and the search box compose -- using one no longer
  discards the other
- **Search Functionality**: Real-time search across candidate data
- **Status Management**: Mark candidates cleared or rejected, individually or in
  bulk via the row checkboxes
- **Excel Export**: Download cleared candidates as Excel spreadsheet
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Modern CSS with gradients, animations, and responsive design
- **Libraries**:
  - PDF.js 3.11 (UMD build) for PDF text extraction
  - SheetJS (XLSX) for Excel export
  - Font Awesome for icons

## File Structure

```
├── index.html          # Application markup
├── styles.css          # Styling
├── scoring.js          # Skill vocabulary, job requirements, match scoring
├── pdf-extract.js      # PDF.js wrapper: PDF -> page text
├── resume-parser.js    # Page text -> candidate records
├── script.js           # UI wiring only
├── test-data.js        # Sample job descriptions and candidate fixtures
├── test-runner.html    # Standalone demo page (see the warning inside it)
└── README.md           # This file
```

No build step and no bundler: the files load as plain globals in dependency
order (`scoring.js` -> `pdf-extract.js` -> `resume-parser.js` -> `script.js`).

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- **A local web server is required.** PDF.js runs its parser in a Web Worker,
  which will not load from a `file://` URL. Opening `index.html` directly leaves
  extraction broken.

### Installation
1. Download or clone all files to a local directory
2. Serve the directory, then open `http://localhost:8000/index.html`:
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

### Where requirements come from
The requirement list is derived from the job description you supply, in two
layers:

1. **Recognised technologies** &mdash; `SKILL_VOCABULARY` in `scoring.js` supplies
   aliases and canonical casing, so `nodejs`, `Node.js` and `node` all count as
   one skill, and `Python3` matches `Python`.
2. **Terms mined from the description** &mdash; abbreviations (`RAG`, `FHIR`,
   `NHCX`), parenthesised definitions, CamelCase product names and hyphenated
   practices (`model-monitoring`, `clinician-in-the-loop`). This is what stops a
   fixed list from being the ceiling: a term matters because the job description
   says so, not because someone predicted it.

Mining is restricted to the qualifications, responsibilities and skills sections
when the posting has them, which keeps mission statements and funder lists out
of the requirement list.

Extraction cannot reliably tell a competency from an organisation name, so
**step 2 shows every requirement it found, tagged by origin, and lets you remove
any of them.** Scores recompute immediately. Treat that panel as part of the
workflow: a posting that names its employer and client will offer those as
requirements, and dropping them sharpens the ranking.

### Match Scoring
Deterministic keyword-and-rules scoring, not a model. `calculateAIScore()` in
`scoring.js` awards:
- **10 points per required skill** the candidate demonstrates, in their skills
  list or anywhere in their resume text
- **Up to 20 experience points**, measured against the years the job description
  actually asks for (or a graduated scale when it states none)
- **Up to 15 education points** for the highest degree detected

The total is normalised over `requiredSkills x 10 + 35`. If no skills are
recognised in the job description, the score reflects only experience and
education, so it is capped at 50% and the UI says why.

`SKILL_VOCABULARY` in `scoring.js` is the single place to add technologies; it
feeds both job-description parsing and resume skill extraction.

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
- **OCR**: Scanned, image-only PDFs are detected and rejected; no OCR yet
- **Multi-column layouts**: Line reconstruction assumes a single column
- **Machine Learning**: Scoring is currently deterministic rules
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
- Add technologies to `SKILL_VOCABULARY` in `scoring.js` for better aliasing and
  casing; you do not need to add a term for it to be scored, because
  `mineJobDescriptionTerms()` picks up whatever the description states
- Adjust the weights in `calculateAIScore()` (`scoring.js`) to change scoring
- Tune `isResumeStart()` / `looksLikeResume()` in `resume-parser.js` if your
  bulk PDFs are laid out unusually

## Troubleshooting

### Common Issues
1. **"The PDF library failed to load"**: PDF.js comes from a CDN and the worker
   needs an http(s) origin. Serve the directory; do not open `index.html` as a
   `file://` URL.
2. **"This PDF appears to be scanned images"**: the file has no text layer.
   OCR is not supported -- supply a text-based PDF.
3. **"No resumes could be identified"**: text was extracted but nothing in it
   looked like a resume (no contact details, no name lines, no section
   headings). The app reports this rather than inventing candidates.
4. **Wrong candidate count**: resumes are split on page boundaries. If several
   resumes share one page, the email-anchored fallback tries to recover; check
   the browser console, which reports any blocks that were skipped.
5. **Wrong years of experience**: taken from an explicit "N years" statement if
   present, otherwise the merged span of dated roles in the experience section.
   Internships are included. Where a resume has no detectable section headings
   the whole document is scanned and degree lines are filtered out by hand, so
   the figure is less reliable for those.
6. **Odd candidate name**: taken from the resume's own header. Where that header
   has no parseable name -- a single run-together word, or a name printed only
   in a page footer -- it falls back to the email local part, which can read
   oddly. The record is still the right person.
7. **Export not working**: check that the browser allows downloads.

### Performance Tips
- Keep PDF files under 50MB for optimal performance
- Use modern browsers for best experience
- Close other browser tabs if experiencing slowdowns

## License

This project is open source and available under the MIT License.

## Support

For issues, suggestions, or contributions, please create an issue in the project repository.

---

**Note**: PDF parsing, candidate extraction and scoring are real and run
entirely in the browser -- no data leaves the page. Parsing resumes is
heuristic: verify anything that matters before acting on it. Extraction quality
depends on the PDF being text-based and single-column. For production, add
server-side validation and a review step for parsed fields.

A "Load sample data" link on the upload step fills the table from `test-data.js`
fixtures for demo purposes. The real processing path never falls back to it: if
no resumes can be identified, it reports an error instead.
