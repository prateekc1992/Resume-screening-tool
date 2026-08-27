// PDF text extraction via PDF.js.
//
// Exposes extractPdfPages(file, onProgress) -> Promise<string[]>, one string
// per page with line structure preserved.
//
// Requires the PDF.js UMD build to be loaded first (see index.html). The worker
// needs a real HTTP origin, so the app must be served over http://, not opened
// as a file:// URL.

// Configure the worker as soon as the library is available.
(function configureWorker() {
    if (typeof pdfjsLib === 'undefined') {
        console.error('PDF.js failed to load; PDF extraction is unavailable.');
        return;
    }
    pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
})();

// Typed error so callers can show a message that means something.
// codes: NO_LIBRARY | ENCRYPTED | CORRUPT | NO_TEXT | UNKNOWN
function PdfExtractError(code, message) {
    this.name = 'PdfExtractError';
    this.code = code;
    this.message = message;
}
PdfExtractError.prototype = Object.create(Error.prototype);

// A document with essentially no extractable text is almost always a scan.
const MIN_DOCUMENT_CHARS = 50;

// Yield to the event loop every few pages so a large PDF does not lock the tab.
const PAGES_PER_YIELD = 5;

// Rebuild lines from positioned text fragments.
//
// This is the load-bearing function of the whole parser. PDF.js hands back
// fragments, NOT lines. Naively doing items.map(i => i.str).join(' ') flattens
// the page into one long line and every downstream heuristic -- name detection,
// section headings, date ranges -- silently degrades.
//
// Two signals PDF.js already provides do most of the work, and both must be
// used rather than re-derived from geometry:
//
//   hasEOL          -- the generator's own line break. Emitted as a zero-length
//                      item at each end of line.
//   whitespace runs -- an item whose str is " ". Discarding these and inferring
//                      spaces from x-gaps merges words whose kerning is tighter
//                      than the threshold ("SHUBHANK GAUR" -> "SHUBHANKGAUR").
//
// Items are walked in content-stream order, which is the generator's reading
// order. An earlier version sorted every fragment by y, which reads a
// two-column header in the wrong order: a resume with the name at x=34/y=776
// and a contact block at x=401/y=800 emitted the contact details first and
// merged the name with whatever shared its row.
//
// y is still consulted, as a fallback line break for generators that omit
// hasEOL.
function itemsToLines(items) {
    if (!items || items.length === 0) return [];

    // Line-break tolerance scales with the page's text size.
    const heights = items.map(i => i.height).filter(h => h > 0).sort((a, b) => a - b);
    const medianHeight = heights.length ? heights[Math.floor(heights.length / 2)] : 10;
    const yTolerance = Math.max(2, medianHeight * 0.6);

    const lines = [];
    let current = [];
    let currentY = null;
    let pendingSpace = false;

    function flush() {
        if (current.length > 0) {
            const text = joinFragments(current);
            if (text) lines.push(text);
            current = [];
        }
        currentY = null;
        pendingSpace = false;
    }

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const str = item.str || '';

        // Whitespace-only item: an explicit separator, not content.
        if (str.length > 0 && str.trim().length === 0) {
            pendingSpace = true;
            if (item.hasEOL) flush();
            continue;
        }

        // Zero-length item: only its line-break flag matters.
        if (str.length === 0) {
            if (item.hasEOL) flush();
            continue;
        }

        const y = item.transform[5];
        if (currentY !== null && Math.abs(y - currentY) > yTolerance) flush();

        if (current.length > 0 && pendingSpace) current.push({ spacer: true });
        pendingSpace = false;

        current.push({
            str: str,
            x: item.transform[4],
            width: item.width || 0,
            height: item.height || medianHeight
        });
        currentY = y;

        if (item.hasEOL) flush();
    }
    flush();

    return lines;
}

// Concatenate one line's fragments. Explicit spacers win; otherwise fall back
// to an x-gap test for generators that do not emit whitespace items.
function joinFragments(fragments) {
    let text = '';
    let prev = null;

    for (let i = 0; i < fragments.length; i++) {
        const frag = fragments[i];

        if (frag.spacer) {
            if (text.length > 0 && !/\s$/.test(text)) text += ' ';
            prev = null;
            continue;
        }

        if (prev) {
            const gap = frag.x - (prev.x + prev.width);
            if (gap > Math.max(1, prev.height * 0.2) &&
                !/\s$/.test(text) && !/^\s/.test(frag.str)) {
                text += ' ';
            }
        }

        text += frag.str;
        prev = frag;
    }

    return text.replace(/\s+/g, ' ').trim();
}

// Extract text from every page of a PDF File/Blob.
//
// onProgress(pagesDone, totalPages) is called after each page.
// Resolves to an array of page strings (lines joined with '\n').
async function extractPdfPages(file, onProgress) {
    if (typeof pdfjsLib === 'undefined') {
        throw new PdfExtractError('NO_LIBRARY',
            'The PDF library failed to load. Check your network connection and reload.');
    }

    let pdf;
    try {
        const data = await file.arrayBuffer();
        pdf = await pdfjsLib.getDocument({ data: data }).promise;
    } catch (err) {
        if (err && err.name === 'PasswordException') {
            throw new PdfExtractError('ENCRYPTED',
                'This PDF is password protected. Please supply an unlocked copy.');
        }
        throw new PdfExtractError('CORRUPT',
            'This file could not be read as a PDF. It may be corrupt or not really a PDF.');
    }

    const pageTexts = [];
    let totalChars = 0;

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        let text = '';
        try {
            const page = await pdf.getPage(pageNum);
            const content = await page.getTextContent();
            text = itemsToLines(content.items).join('\n');
            // Release page resources; bulk PDFs can be hundreds of pages.
            if (page.cleanup) page.cleanup();
        } catch (err) {
            // One unreadable page should not abort a 200-page document.
            console.warn('Could not extract page ' + pageNum + ':', err);
        }

        pageTexts.push(text);
        totalChars += text.replace(/\s/g, '').length;

        if (typeof onProgress === 'function') onProgress(pageNum, pdf.numPages);

        if (pageNum % PAGES_PER_YIELD === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }

    if (totalChars < MIN_DOCUMENT_CHARS) {
        throw new PdfExtractError('NO_TEXT',
            'No text could be extracted. This PDF appears to be scanned images; ' +
            'OCR is not supported. Please supply a text-based PDF.');
    }

    return pageTexts;
}
