// Turn extracted PDF page text into candidate records.
//
// Exposes parseCandidates(pageTexts) -> Candidate[], where Candidate matches
// the shape the rest of the app already expects:
//   { id, name, experience, education, skills, resumeText, status }
// (aiScore is added later by the scoring pass.)
//
// Depends on findSkillsInText() from scoring.js.

// ---------------------------------------------------------------------------
// Patterns
// ---------------------------------------------------------------------------

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z0-9.-]+/;
const EMAIL_RE_ALL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z0-9.-]+/g;
const PHONE_RE = /(?:\+\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;

// Section headings we care about, mapped to a canonical key.
const SECTION_PATTERNS = [
    { key: 'experience', re: /^(work\s+|professional\s+|employment\s+|relevant\s+)?(experience|employment|work\s+history|career\s+history)\s*:?$/i },
    { key: 'education',  re: /^(education|academic\s+background|academic\s+qualifications?|qualifications?)\s*:?$/i },
    { key: 'skills',     re: /^(technical\s+|core\s+|key\s+)?(skills|technologies|technical\s+expertise|competencies|tech\s+stack)\s*:?$/i },
    { key: 'summary',    re: /^(summary|professional\s+summary|objective|profile|about\s+me)\s*:?$/i },
    { key: 'projects',   re: /^(projects?|selected\s+projects?|key\s+projects?)\s*:?$/i },
    { key: 'certs',      re: /^(certifications?|licenses?|awards?|achievements?|publications?)\s*:?$/i },
    { key: 'other',      re: /^(languages|interests|hobbies|references|volunteer(ing)?|activities)\s*:?$/i }
];

// Words that mean a Title Case line is a job title, not a person's name.
// "Senior Full Stack Developer" would otherwise pass the name test.
const JOB_TITLE_WORDS = /\b(developer|engineer|manager|analyst|consultant|architect|designer|specialist|administrator|scientist|intern|associate|director|officer|lead|senior|junior|principal|staff|head|chief|president|founder|freelance|contractor|programmer|tester|devops|technician)\b/i;

// Resume furniture that is Title Case but is not anybody's name. Without this,
// headings such as "Research Experience", "Educational Qualification" and
// "Public Health Program Management" pass the name test, which both mislabels
// candidates and -- worse -- makes a continuation page look like a new resume.
const RESUME_SECTION_WORDS = /\b(experience|qualifications?|educationals?|education|skills?|summary|objective|profile|research|projects?|programmes?|program|management|training|certifications?|achievements?|publications?|awards?|employment|history|details?|information|personal|professional|technical|work|activities|interests|references?|declaration|competenc(?:y|ies)|expertise|responsibilities|internships?|curriculum|vitae|resume|contact|address|career|portfolio|languages|hobbies|strengths|highlights|accomplishments|memberships?|affiliations?|conferences?|workshops?|seminars?|thesis|dissertation)\b/i;

// Degree detection, highest level first. Abbreviations require punctuation or a
// distinctive spelling so that "MS Office" and "BE flexible" do not register as
// degrees.
const DEGREE_LEVELS = [
    {
        rank: 4, label: 'PhD', keyword: 'phd',
        re: /\b(ph\.?\s?d\.?|doctorate|doctoral)\b/i
    },
    {
        rank: 3, label: "Master's", keyword: 'master',
        // A bare "Master" needs degree context, or "Master Trainers" and
        // "Master Data Management" register as degrees.
        re: /(\bmaster(?:'|’)?s\b|\bmaster\b(?=\s+(?:of|in|degree))|\bm\.s\.|\bm\.sc\.?|\bmsc\b|\bm\.?tech\b|\bmtech\b|\bmba\b|\bm\.a\.|\bm\.eng\b|\bm\.c\.a\.|\bmca\b|\bm\.p\.h\.|\bmph\b)/i
    },
    {
        rank: 2, label: "Bachelor's", keyword: 'bachelor',
        re: /(\bbachelor(?:'|’)?s\b|\bbachelor\b(?=\s+(?:of|in|degree))|\bb\.s\.|\bb\.sc\.?|\bbsc\b|\bb\.?tech\b|\bbtech\b|\bb\.e\.|\bb\.a\.|\bb\.c\.a\.|\bbca\b|\bb\.pharm\b|\bundergraduate\b)/i
    },
    {
        rank: 1, label: 'Diploma', keyword: 'diploma',
        re: /\b(diploma|associate(?:'|’)?s?\s+degree)\b/i
    }
];

const MONTHS = {
    jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
    may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7,
    sep: 8, sept: 8, september: 8, oct: 9, october: 9, nov: 10, november: 10,
    dec: 11, december: 11
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function nonEmptyLines(text) {
    return text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
}

function isSectionHeading(line) {
    for (let i = 0; i < SECTION_PATTERNS.length; i++) {
        if (SECTION_PATTERNS[i].re.test(line.trim())) return SECTION_PATTERNS[i].key;
    }
    return null;
}

// Sections that open a resume. These essentially never begin a continuation
// page, so finding one at the top of a page is strong evidence of a new resume
// -- unlike Experience or Education, which routinely start page two.
//
// The trailing ":" form matters: real resumes write "Profile Summary: With 15
// years of experience in..." as one line, which the anchored heading patterns
// above deliberately do not match.
const OPENING_SECTION_RE =
    /^(?:professional\s+|career\s+|executive\s+|personal\s+)?(?:summary|profile|objective|about\s+me)(?:\s+summary)?\s*(?::|$)/i;

function isOpeningSectionLine(line) {
    return OPENING_SECTION_RE.test(line.trim());
}

// Personal-detail field labels and values. Real resumes put "Female" or
// "Nationality: Indian" on their own line right under the name, and a
// single-token name test will happily take "Female" as somebody's name.
const PERSONAL_FIELD_WORDS = /^(?:female|male|other|gender|sex|nationality|indian|dob|d\.o\.b|date\s+of\s+birth|age|marital|married|unmarried|single|address|phone|mobile|email|e-mail|contact|nation|religion|category|caste|passport|languages?)\b/i;

// Strip decoration a resume header picks up before the name is testable:
// an ATS "Page 1 of 2" stamp, stray backticks and pipes, bullet glyphs.
function cleanNameCandidate(line) {
    return line
        .replace(/page\s*\d{1,3}\s*(?:of|\/)\s*\d{1,3}/i, ' ')
        .replace(/[`|•·●▪*_~^"\\/]+/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();
}

// An ATS "Page 1 of 3" stamp settles the question in both directions.
// Returns 1-based page number within the document, or 0 if unstamped.
function readPageStamp(lines) {
    const head = lines.slice(0, 3).join(' ');
    const match = head.match(/page\s*(\d{1,3})\s*(?:of|\/)\s*\d{1,3}/i);
    return match ? parseInt(match[1], 10) : 0;
}

// Does this line look like a person's name?
//
// allowSingleToken permits a one-word name ("Anubhav", "SHUBHANKGAUR"). It is
// used only when naming an already-identified candidate, never by
// isResumeStart() -- a lone capitalised word is far too weak a signal to open a
// new resume on, and would split continuation pages.
function isNameLike(line, allowSingleToken) {
    const text = cleanNameCandidate(line);
    if (text.length < 3 || text.length > 45) return false;
    if (text.indexOf('@') !== -1) return false;
    if (/\d/.test(text)) return false;
    if (/https?:|www\.|linkedin/i.test(text)) return false;
    if (isSectionHeading(text)) return false;
    if (isOpeningSectionLine(text)) return false;
    if (PERSONAL_FIELD_WORDS.test(text)) return false;
    if (JOB_TITLE_WORDS.test(text)) return false;
    if (RESUME_SECTION_WORDS.test(text)) return false;

    const tokens = text.split(/\s+/);
    const minTokens = allowSingleToken ? 1 : 2;
    if (tokens.length < minTokens || tokens.length > 4) return false;

    // Every token is Title Case or ALL CAPS, letters plus . ' - only.
    for (let i = 0; i < tokens.length; i++) {
        if (!/^[A-Z][a-z]*[.'\-]?[a-z]*$/.test(tokens[i]) &&
            !/^[A-Z][A-Z.'\-]*$/.test(tokens[i])) {
            return false;
        }
    }
    return true;
}

function titleCase(str) {
    return str.replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
}

// ---------------------------------------------------------------------------
// Candidate boundary detection
// ---------------------------------------------------------------------------

// Bulk resume PDFs almost always begin each resume on a fresh page, so decide
// per page whether it opens a new resume, then accumulate pages until the next
// opener.
function isResumeStart(pageText) {
    const lines = nonEmptyLines(pageText);
    if (lines.length === 0) return false;

    const head = lines.slice(0, 15).join('\n');
    const firstThree = lines.slice(0, 3);

    // An ATS page stamp is decisive both ways: "Page 1 of 2" opens a resume,
    // "Page 2 of 2" continues one.
    const stamp = readPageStamp(lines);
    if (stamp > 0) return stamp === 1;

    // An explicit "Resume" / "Curriculum Vitae" banner is decisive.
    for (let i = 0; i < firstThree.length; i++) {
        if (/^(resume|curriculum\s+vitae|c\.?\s?v\.?)\s*:?$/i.test(firstThree[i])) return true;
    }

    // A resume-opening section at the very top. Catches resumes that lead with
    // prose and put contact details below the fold, where no name line and no
    // contact block appear near the top at all.
    for (let i = 0; i < firstThree.length; i++) {
        if (isOpeningSectionLine(firstThree[i])) return true;
    }

    // A page that opens mid-section is a continuation, not a new resume.
    const opener = lines[0];
    if (/^[•·\-\*•]/.test(opener)) return false;
    if (/\(cont(inued)?\.?\)/i.test(opener)) return false;

    const hasEmail = EMAIL_RE.test(head);
    const hasPhone = PHONE_RE.test(head);
    const hasName = firstThree.some(isNameLike);

    // Contact block at the top is the strongest ordinary signal.
    if (hasEmail && hasPhone) return true;
    if (hasEmail && hasName) return true;

    const hasHeading = lines.some(l => isSectionHeading(l));

    // An email in the header plus section headings. This catches resumes whose
    // name line we cannot recognise -- e.g. a PDF that renders "SHUBHANKGAUR"
    // with no space, which fails the two-to-four-token name test. Continuation
    // pages rarely repeat the email address in their first 15 lines.
    if (hasEmail && hasHeading) return true;

    // A name plus a real section heading. Weakest rule, kept because some
    // resumes put contact details below the fold, but it depends on
    // isNameLike() rejecting section headings (see RESUME_SECTION_WORDS).
    if (hasName && hasHeading) return true;

    return false;
}

// Group pages into per-candidate text blocks.
function splitIntoResumeBlocks(pageTexts) {
    const blocks = [];
    let current = [];

    for (let i = 0; i < pageTexts.length; i++) {
        const text = pageTexts[i];
        if (!text || !text.trim()) continue;

        // Page 1 always opens the first resume.
        const startsNew = (blocks.length === 0 && current.length === 0) || isResumeStart(text);

        if (startsNew && current.length > 0) {
            blocks.push(current.join('\n'));
            current = [];
        }
        current.push(text);
    }
    if (current.length > 0) blocks.push(current.join('\n'));

    return blocks;
}

// Fallback: the page heuristics found one block but the document clearly holds
// several resumes (many distinct email addresses). Split on email anchors.
function splitByEmailAnchors(text) {
    const lines = text.split('\n');
    const anchorIndexes = [];
    for (let i = 0; i < lines.length; i++) {
        if (EMAIL_RE.test(lines[i])) anchorIndexes.push(i);
    }
    if (anchorIndexes.length < 2) return [text];

    // Cut a few lines above each email so the name line stays with its resume.
    const cuts = [0];
    for (let i = 1; i < anchorIndexes.length; i++) {
        const cut = Math.max(cuts[cuts.length - 1] + 1, anchorIndexes[i] - 3);
        if (cut > cuts[cuts.length - 1]) cuts.push(cut);
    }

    const blocks = [];
    for (let i = 0; i < cuts.length; i++) {
        const end = (i + 1 < cuts.length) ? cuts[i + 1] : lines.length;
        const block = lines.slice(cuts[i], end).join('\n').trim();
        if (block) blocks.push(block);
    }
    return blocks;
}

// Does this block of text actually look like somebody's resume?
//
// Page 1 is unconditionally treated as a resume start, so without this gate ANY
// text-bearing PDF -- a financial report, a contract -- yields one bogus
// "Candidate 1" and the app reports success on garbage. Score the available
// evidence and require a minimum.
function looksLikeResume(text) {
    const lines = nonEmptyLines(text);
    let score = 0;

    if (EMAIL_RE.test(text)) score += 2;
    if (PHONE_RE.test(text)) score += 2;
    if (lines.some(l => isSectionHeading(l))) score += 2;
    if (lines.slice(0, 5).some(isNameLike)) score += 1;
    if (DEGREE_LEVELS.some(level => level.re.test(text))) score += 1;
    if (typeof findSkillsInText === 'function' && findSkillsInText(text).length >= 2) score += 1;

    // 3 is reachable by a sparse but genuine resume (a name plus a phone, or a
    // name plus a skills section) while a document about something else scores 0.
    return score >= 3;
}

function countDistinctEmails(text) {
    const found = text.match(EMAIL_RE_ALL);
    if (!found) return 0;
    const seen = {};
    for (let i = 0; i < found.length; i++) seen[found[i].toLowerCase()] = true;
    return Object.keys(seen).length;
}

// ---------------------------------------------------------------------------
// Section splitting
// ---------------------------------------------------------------------------

// Split one resume's text into { experience, education, skills, ... }.
// Text before the first recognised heading goes to 'header'.
function splitSections(text) {
    const sections = { header: [] };
    let current = 'header';

    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const key = isSectionHeading(line);
        if (key) {
            current = key;
            if (!sections[current]) sections[current] = [];
            continue;
        }
        if (!sections[current]) sections[current] = [];
        sections[current].push(line);
    }

    const out = {};
    for (const key in sections) {
        if (Object.prototype.hasOwnProperty.call(sections, key)) {
            out[key] = sections[key].join('\n');
        }
    }
    return out;
}

// ---------------------------------------------------------------------------
// Field extraction
// ---------------------------------------------------------------------------

function extractName(text, email, index) {
    const lines = nonEmptyLines(text).slice(0, 6);

    // Prefer a full multi-token name, then accept a single-token one. Trying
    // two-plus tokens first stops a lone first name winning over the full name
    // on the line below it.
    for (let pass = 0; pass < 2; pass++) {
        const allowSingle = pass === 1;
        for (let i = 0; i < lines.length; i++) {
            if (!isNameLike(lines[i], allowSingle)) continue;
            // Return the cleaned form, so "Page 1 of 2 Biswaroop Dutta"
            // surfaces as "Biswaroop Dutta".
            const candidate = cleanNameCandidate(lines[i]);
            // Normalise shouty names for display. Testing against
            // candidate.toUpperCase() alone fails on "Dr. DEEPANKAR PANT",
            // where the honorific supplies the only lowercase letter, so
            // measure the proportion of capitals instead.
            const letters = candidate.replace(/[^A-Za-z]/g, '');
            const capitals = candidate.replace(/[^A-Z]/g, '').length;
            const mostlyCaps = letters.length > 0 && capitals / letters.length >= 0.8;
            return mostlyCaps ? titleCase(candidate) : candidate;
        }
    }

    // Fall back to the email local part: alex.rodriguez -> Alex Rodriguez
    if (email) {
        const local = email.split('@')[0].replace(/[._\-+]+/g, ' ').replace(/\d+/g, '').trim();
        if (local.length >= 3) return titleCase(local);
    }

    return 'Candidate ' + index;
}

// Years of experience, tried in order of reliability.
// Returns { years, source }.
//
// Semantics when derived from dates: the total merged span of every dated role
// in the experience section, so concurrent roles are not double counted and
// gaps between jobs are not counted. Internships are included -- exclude them
// by hand if your process treats them differently. A bare "2019-2024" counts as
// 5 years, not 6.
function extractExperience(text, sections) {
    // 1. An explicit statement wins.
    const explicit = findExplicitYears(sections.summary || '') ||
        findExplicitYears(sections.header || '') ||
        findExplicitYears(text);
    if (explicit) return { years: explicit, source: 'stated' };

    // 2. Otherwise total the date ranges in the experience section. Restricting
    //    to that section keeps degree dates (e.g. "2016-2018") out of the sum;
    //    when no such section is found, filter degree lines out by hand.
    const scope = sections.experience || text;
    const fromDates = yearsFromDateRanges(scope, !sections.experience);
    if (fromDates > 0) return { years: fromDates, source: 'dates' };

    return { years: 0, source: 'unknown' };
}

function findExplicitYears(text) {
    if (!text) return 0;
    const patterns = [
        /(\d{1,2})\s*\+?\s*(?:years?|yrs?)[^.\n]{0,25}?experien/i,
        /experien[^.\n]{0,25}?(\d{1,2})\s*\+?\s*(?:years?|yrs?)/i,
        /(\d{1,2})\s*\+\s*(?:years?|yrs?)/i
    ];
    for (let i = 0; i < patterns.length; i++) {
        const m = text.match(patterns[i]);
        if (m) {
            const years = parseInt(m[1], 10);
            if (years > 0 && years <= 50) return years;
        }
    }
    return 0;
}

// Lines that describe schooling rather than employment. Degree dates must not
// count as work experience: when a resume's section headings are not detected,
// extractExperience() falls back to the whole document, and without this filter
// a 2001-2024 career plus a 1994-1998 degree reads as 30 years of work.
// Deliberately narrow: degree and grade tokens only. An earlier version also
// matched university/college/institute/school/academy, which threw away real
// employment lines -- people work at universities, run "Master Trainer"
// programmes, and are employed by companies with "Institute" in the name.
const DEGREE_LINE_RE = /\b(bachelor(?:'|’)?s?|master(?:'|’)?s|phd|ph\.?d|doctorate|diploma|b\.?tech|m\.?tech|b\.?sc|m\.?sc|b\.?e\.|m\.?e\.|mba|bca|mca|b\.?pharm|cgpa|gpa|matriculation|higher\s+secondary|senior\s+secondary|10th|12th)\b/i;

// Parse date ranges, merge overlaps, return total years (rounded).
//
// excludeDegreeLines applies only when the caller could not isolate an
// experience section and is scanning the whole document: there, degree dates
// would otherwise be counted as employment. Inside a real experience section
// every date is a work date, so filtering there only loses information.
function yearsFromDateRanges(text, excludeDegreeLines) {
    if (excludeDegreeLines) {
        text = text.split('\n').filter(line => !DEGREE_LINE_RE.test(line)).join('\n');
    }
    const rangeRe = new RegExp(
        '(?:([a-z]{3,9})\\.?\\s+)?(\\d{4})' +          // optional month + start year
        '\\s*(?:-|--|to|through|\\u2013|\\u2014)\\s*' + // separator
        '(?:(present|current|now|date)|(?:([a-z]{3,9})\\.?\\s+)?(\\d{4}))',
        'gi'
    );

    const intervals = [];
    const now = new Date();
    const nowMonths = now.getFullYear() * 12 + now.getMonth();
    let m;

    while ((m = rangeRe.exec(text)) !== null) {
        const startMonth = m[1] ? MONTHS[m[1].toLowerCase()] : undefined;
        const startYear = parseInt(m[2], 10);
        if (startYear < 1950 || startYear > now.getFullYear() + 1) continue;

        const start = startYear * 12 + (startMonth === undefined ? 0 : startMonth);

        let end;
        if (m[3]) {
            end = nowMonths;
        } else {
            const endYear = parseInt(m[5], 10);
            if (!endYear || endYear < 1950 || endYear > now.getFullYear() + 1) continue;
            // With no month given, treat "2019-2024" as spanning 2024-2019 = 5
            // years. Defaulting the end to December instead would silently add
            // a phantom year to every bare-year range.
            const endMonth = m[4] ? MONTHS[m[4].toLowerCase()] : undefined;
            end = endYear * 12 + (endMonth === undefined ? 0 : endMonth);
        }

        if (end > start) intervals.push([start, end]);
    }

    if (intervals.length === 0) return 0;

    // Merge overlapping intervals so concurrent roles are not double counted.
    intervals.sort((a, b) => a[0] - b[0]);
    const merged = [intervals[0].slice()];
    for (let i = 1; i < intervals.length; i++) {
        const last = merged[merged.length - 1];
        if (intervals[i][0] <= last[1]) {
            last[1] = Math.max(last[1], intervals[i][1]);
        } else {
            merged.push(intervals[i].slice());
        }
    }

    let months = 0;
    for (let i = 0; i < merged.length; i++) months += merged[i][1] - merged[i][0];
    return Math.round(months / 12);
}

// Highest degree found, as a string that stays compatible with applyFilters()
// -- which tests education.toLowerCase().includes('bachelor'|'master'|'phd'|
// 'diploma'), so the canonical keyword must appear in the returned text.
function extractEducation(text, sections) {
    const scope = sections.education || text;
    const lines = nonEmptyLines(scope);

    let best = null;
    for (let i = 0; i < DEGREE_LEVELS.length; i++) {
        const level = DEGREE_LEVELS[i];

        // Collect every line at this level, then pick the most degree-like one.
        // Taking the first match yields prose ("...I hold a master's degree in
        // social work from Banaras Hindu University...") in preference to the
        // tidy line ("Master of Social Work / BHU / 2009") further down.
        const matches = [];
        for (let j = 0; j < lines.length; j++) {
            const found = lines[j].match(level.re);
            if (found) {
                // Lower is better: reward the degree appearing early on a short line.
                const rank = lines[j].indexOf(found[0]) + lines[j].length * 0.3;
                matches.push({ line: lines[j], rank: rank });
            }
        }
        if (matches.length > 0) {
            matches.sort((a, b) => a.rank - b.rank);
            best = { level: level, line: matches[0].line };
            break; // DEGREE_LEVELS is ordered highest-first.
        }
    }

    if (!best) return 'Not specified';

    // Tidy the matched line for display. Real resumes prefix degrees with list
    // markers and append grades, which end up in the table and the Excel export.
    let detail = best.line
        .replace(/\s+/g, ' ')
        .replace(/^[\s•·●▪*\-–—]+/, '')   // leading bullets/dashes
        .replace(/^o\s+(?=[A-Z])/, '')                                  // Word's "o" sub-bullet
        .replace(/[,;|(\[]?\s*\b(?:C?GPA|Percentage|Marks)\b\s*[:=]?\s*[\d.]+\s*(?:\/\s*[\d.]+)?\s*%?\s*[)\]]?/gi, '')
        .replace(/\s*[,;|]\s*$/, '')
        .replace(/\s{2,}/g, ' ')
        .trim();

    if (!detail) detail = best.level.label;
    if (detail.length > 90) detail = detail.slice(0, 87) + '...';

    // Guarantee the filter keyword is present.
    if (detail.toLowerCase().indexOf(best.level.keyword) !== -1) return detail;
    return best.level.label + ' - ' + detail;
}

// Skills from an explicit skills section, unioned with vocabulary hits found
// anywhere in the resume.
function extractSkills(text, sections) {
    const collected = [];

    if (sections.skills) {
        const lines = sections.skills.split('\n');
        for (let i = 0; i < lines.length; i++) {
            // Drop a leading category label: "Languages: JavaScript, Python"
            const body = lines[i].replace(/^[^:]{0,30}:\s*/, '');
            const parts = body.split(/[,;|·•\/]+/);
            for (let j = 0; j < parts.length; j++) {
                const skill = parts[j].replace(/^[\s\-\*•]+/, '').trim();
                if (skill.length < 2 || skill.length > 40) continue;
                if (skill.split(/\s+/).length > 4) continue;
                if (/^\d+$/.test(skill)) continue;
                collected.push(skill);
            }
        }
    }

    // Vocabulary hits carry canonical casing, so add them last and let them win.
    const vocabHits = (typeof findSkillsInText === 'function') ? findSkillsInText(text) : [];

    const seen = {};
    const out = [];
    // Vocabulary first so "JavaScript" beats a resume's "javascript".
    const ordered = vocabHits.concat(collected);
    for (let i = 0; i < ordered.length; i++) {
        const key = ordered[i].toLowerCase();
        if (seen[key]) continue;
        seen[key] = true;
        out.push(ordered[i]);
    }

    return out.slice(0, 30);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

// pageTexts: string[] from extractPdfPages()
// Returns Candidate[] in document order.
function parseCandidates(pageTexts) {
    const joined = pageTexts.join('\n');
    let blocks = splitIntoResumeBlocks(pageTexts);

    // Page heuristics can under-split when several resumes share a page.
    if (blocks.length === 1 && countDistinctEmails(joined) > 1) {
        blocks = splitByEmailAnchors(joined);
    }

    const candidates = [];
    let skipped = 0;
    for (let i = 0; i < blocks.length; i++) {
        const text = blocks[i];
        if (text.replace(/\s/g, '').length < 40) { skipped++; continue; } // too thin
        if (!looksLikeResume(text)) { skipped++; continue; }

        const sections = splitSections(text);
        const emailMatch = text.match(EMAIL_RE);
        const email = emailMatch ? emailMatch[0] : '';
        const phoneMatch = text.match(PHONE_RE);
        const experience = extractExperience(text, sections);

        candidates.push({
            id: candidates.length + 1,
            name: extractName(text, email, candidates.length + 1),
            email: email,
            phone: phoneMatch ? phoneMatch[0] : '',
            experience: experience.years,
            experienceSource: experience.source, // kept for debugging
            education: extractEducation(text, sections),
            skills: extractSkills(text, sections),
            resumeText: text,
            status: 'pending'
        });
    }

    // Say what was discarded rather than letting the count quietly disagree
    // with the page count.
    if (skipped > 0) {
        console.info('resume-parser: skipped ' + skipped + ' of ' + blocks.length +
            ' text block(s) that did not look like resumes.');
    }

    return candidates;
}
