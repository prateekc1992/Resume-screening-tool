// Job-requirement extraction and candidate scoring.
//
// SKILL_VOCABULARY below is the SINGLE place to add recognised technologies.
// It is consumed by both extractJobRequirements() (to read a job description)
// and resume-parser.js (to pull skills out of resume text), so adding a term
// here improves both sides at once.

// Each entry: canonical display name + the lowercase aliases to look for.
// Aliases are matched with word-ish boundaries, so 'java' does not match
// 'javascript' and 'go' does not match 'google'.
const SKILL_VOCABULARY = [
    // Languages
    { name: 'JavaScript',    aliases: ['javascript', 'ecmascript'] },
    { name: 'TypeScript',    aliases: ['typescript'] },
    { name: 'Python',        aliases: ['python'] },
    { name: 'Java',          aliases: ['java'] },
    { name: 'C#',            aliases: ['c#', 'csharp'] },
    { name: 'C++',           aliases: ['c++', 'cpp'] },
    { name: 'Go',            aliases: ['go', 'golang'] },
    { name: 'Rust',          aliases: ['rust'] },
    { name: 'PHP',           aliases: ['php'] },
    { name: 'Ruby',          aliases: ['ruby'] },
    { name: 'Swift',         aliases: ['swift'] },
    { name: 'Kotlin',        aliases: ['kotlin'] },
    { name: 'Scala',         aliases: ['scala'] },
    { name: 'SQL',           aliases: ['sql'] },
    { name: 'HTML',          aliases: ['html', 'html5'] },
    { name: 'CSS',           aliases: ['css', 'css3'] },
    { name: 'SASS',          aliases: ['sass', 'scss'] },

    // Frontend
    { name: 'React',         aliases: ['react', 'react.js', 'reactjs'] },
    { name: 'React Native',  aliases: ['react native', 'react-native'] },
    { name: 'Angular',       aliases: ['angular', 'angular.js', 'angularjs'] },
    { name: 'Vue.js',        aliases: ['vue', 'vue.js', 'vuejs'] },
    { name: 'Next.js',       aliases: ['next.js', 'nextjs'] },
    { name: 'Svelte',        aliases: ['svelte'] },
    { name: 'jQuery',        aliases: ['jquery'] },
    { name: 'Redux',         aliases: ['redux'] },
    { name: 'Tailwind CSS',  aliases: ['tailwind', 'tailwindcss'] },
    { name: 'Bootstrap',     aliases: ['bootstrap'] },
    { name: 'Webpack',       aliases: ['webpack'] },
    { name: 'Vite',          aliases: ['vite'] },

    // Backend / frameworks
    { name: 'Node.js',       aliases: ['node.js', 'nodejs', 'node'] },
    { name: 'Express.js',    aliases: ['express', 'express.js', 'expressjs'] },
    { name: 'Django',        aliases: ['django'] },
    { name: 'Flask',         aliases: ['flask'] },
    { name: 'FastAPI',       aliases: ['fastapi'] },
    { name: 'Spring Boot',   aliases: ['spring boot', 'springboot', 'spring'] },
    { name: '.NET',          aliases: ['.net', 'dotnet', 'asp.net'] },
    { name: 'Rails',         aliases: ['rails', 'ruby on rails'] },
    { name: 'Laravel',       aliases: ['laravel'] },
    { name: 'GraphQL',       aliases: ['graphql'] },
    { name: 'REST',          aliases: ['rest', 'restful', 'rest api'] },
    { name: 'gRPC',          aliases: ['grpc'] },

    // Data stores
    { name: 'PostgreSQL',    aliases: ['postgresql', 'postgres'] },
    { name: 'MySQL',         aliases: ['mysql'] },
    { name: 'MongoDB',       aliases: ['mongodb', 'mongo'] },
    { name: 'SQL Server',    aliases: ['sql server', 'mssql'] },
    { name: 'Oracle',        aliases: ['oracle'] },
    { name: 'Redis',         aliases: ['redis'] },
    { name: 'Elasticsearch', aliases: ['elasticsearch', 'elastic search'] },
    { name: 'Cassandra',     aliases: ['cassandra'] },
    { name: 'DynamoDB',      aliases: ['dynamodb'] },
    { name: 'Snowflake',     aliases: ['snowflake'] },

    // Cloud / infra
    { name: 'AWS',           aliases: ['aws', 'amazon web services'] },
    { name: 'Azure',         aliases: ['azure'] },
    { name: 'GCP',           aliases: ['gcp', 'google cloud'] },
    { name: 'Docker',        aliases: ['docker'] },
    { name: 'Kubernetes',    aliases: ['kubernetes', 'k8s'] },
    { name: 'Terraform',     aliases: ['terraform'] },
    { name: 'Ansible',       aliases: ['ansible'] },
    { name: 'Jenkins',       aliases: ['jenkins'] },
    { name: 'CI/CD',         aliases: ['ci/cd', 'cicd', 'continuous integration'] },
    { name: 'Git',           aliases: ['git'] },
    { name: 'Linux',         aliases: ['linux', 'unix'] },
    { name: 'Nginx',         aliases: ['nginx'] },
    { name: 'Kafka',         aliases: ['kafka'] },
    { name: 'RabbitMQ',      aliases: ['rabbitmq'] },
    { name: 'Microservices', aliases: ['microservices', 'microservice'] },
    { name: 'Serverless',    aliases: ['serverless', 'lambda'] },

    // Testing / practice / tooling
    { name: 'Jest',          aliases: ['jest'] },
    { name: 'pytest',        aliases: ['pytest'] },
    { name: 'Cypress',       aliases: ['cypress'] },
    { name: 'Selenium',      aliases: ['selenium'] },
    { name: 'JUnit',         aliases: ['junit'] },
    { name: 'Agile',         aliases: ['agile'] },
    { name: 'Scrum',         aliases: ['scrum'] },
    { name: 'DevOps',        aliases: ['devops'] },
    { name: 'Jira',          aliases: ['jira'] },
    { name: 'Figma',         aliases: ['figma'] },

    // Data / ML
    { name: 'Machine Learning', aliases: ['machine learning'] },
    { name: 'TensorFlow',    aliases: ['tensorflow'] },
    { name: 'PyTorch',       aliases: ['pytorch'] },
    { name: 'Pandas',        aliases: ['pandas'] },
    { name: 'NumPy',         aliases: ['numpy'] },
    { name: 'Spark',         aliases: ['spark', 'pyspark'] },
    { name: 'Airflow',       aliases: ['airflow'] },
    { name: 'scikit-learn',  aliases: ['scikit-learn', 'scikit learn', 'sklearn'] },
    { name: 'XGBoost',       aliases: ['xgboost'] },
    { name: 'LightGBM',      aliases: ['lightgbm'] },
    { name: 'CatBoost',      aliases: ['catboost'] },
    { name: 'Deep Learning', aliases: ['deep learning'] },
    { name: 'NLP',           aliases: ['nlp', 'natural language processing'] },
    { name: 'Computer Vision', aliases: ['computer vision', 'opencv'] },
    { name: 'OCR',           aliases: ['ocr', 'optical character recognition', 'tesseract'] },
    { name: 'Time Series',   aliases: ['time series', 'forecasting'] },
    { name: 'Matplotlib',    aliases: ['matplotlib', 'seaborn'] },
    { name: 'Keras',         aliases: ['keras'] },

    // Generative AI / LLM stack. Central to modern AI roles and absent from the
    // original 38-term list, which scored such job descriptions on almost nothing.
    { name: 'LLM',           aliases: ['llm', 'llms', 'large language model', 'large language models'] },
    { name: 'RAG',           aliases: ['rag', 'retrieval-augmented generation', 'retrieval augmented generation'] },
    { name: 'Embeddings',    aliases: ['embeddings', 'embedding model', 'embedding models'] },
    { name: 'Vector Database', aliases: ['vector databases', 'vector database', 'vector stores', 'vector store', 'vector db', 'pinecone', 'faiss', 'chroma', 'chromadb', 'weaviate', 'qdrant', 'pgvector', 'milvus'] },
    { name: 'LangChain',     aliases: ['langchain', 'langgraph'] },
    { name: 'LlamaIndex',    aliases: ['llamaindex', 'llama index'] },
    { name: 'Hugging Face',  aliases: ['hugging face', 'huggingface'] },
    { name: 'Transformers',  aliases: ['transformers', 'transformer architecture', 'bert', 'gpt', 'llama', 'mistral'] },
    { name: 'OpenAI',        aliases: ['openai', 'gpt-4', 'gpt-3.5'] },
    { name: 'Prompt Engineering', aliases: ['prompt engineering', 'prompting'] },
    { name: 'Fine-tuning',   aliases: ['fine-tuning', 'fine tuning', 'finetuning', 'lora', 'peft', 'rlhf'] },
    { name: 'Agentic AI',    aliases: ['agentic ai', 'multi-agent', 'multi agent', 'ai agents'] },
    { name: 'LLM Evaluation', aliases: ['llm evaluation', 'eval harness', 'evaluation harness', 'benchmarking', 'golden dataset', 'regression testing'] },
    { name: 'Guardrails',    aliases: ['guardrails', 'guardrail', 'hallucination', 'output validation'] },

    // MLOps / productionisation
    { name: 'MLOps',         aliases: ['mlops', 'ml ops'] },
    { name: 'MLflow',        aliases: ['mlflow'] },
    { name: 'Weights & Biases', aliases: ['weights and biases', 'weights & biases', 'wandb'] },
    { name: 'Model Monitoring', aliases: ['model monitoring', 'drift detection', 'data drift', 'model drift'] },
    { name: 'Feature Store', aliases: ['feature store', 'feast'] },
    { name: 'Model Serving', aliases: ['model serving', 'triton', 'torchserve', 'bentoml'] },
    { name: 'A/B Testing',   aliases: ['a/b testing', 'a-b testing', 'ab testing', 'split testing'] },
    { name: 'SageMaker',     aliases: ['sagemaker'] },
    { name: 'Vertex AI',     aliases: ['vertex ai'] },
    { name: 'Azure ML',      aliases: ['azure ml', 'azure machine learning'] },

    // Data engineering
    { name: 'ETL',           aliases: ['etl', 'elt'] },
    { name: 'Reverse ETL',   aliases: ['reverse-etl', 'reverse etl'] },
    { name: 'dbt',           aliases: ['dbt'] },
    { name: 'Databricks',    aliases: ['databricks'] },
    { name: 'BigQuery',      aliases: ['bigquery'] },
    { name: 'Redshift',      aliases: ['redshift'] },
    { name: 'Data Warehouse', aliases: ['data warehouse', 'data warehousing', 'columnar'] },
    { name: 'Parquet',       aliases: ['parquet', 'delta lake', 'iceberg'] },

    // Privacy, governance and responsible AI
    { name: 'Anonymisation', aliases: ['anonymisation', 'anonymization', 'de-identification', 'deidentification', 'pseudonymisation'] },
    { name: 'Synthetic Data', aliases: ['synthetic data', 'data augmentation'] },
    { name: 'Differential Privacy', aliases: ['differential privacy'] },
    { name: 'Explainability', aliases: ['explainability', 'interpretability', 'shap', 'lime'] },
    { name: 'Responsible AI', aliases: ['responsible ai', 'fairness', 'bias assessment', 'ai ethics', 'human-in-the-loop', 'human in the loop'] },
    { name: 'Data Privacy',  aliases: ['pii', 'gdpr', 'hipaa', 'dpdp', 'data protection'] },

    // Public health / health systems domain. Without these, a candidate with
    // deep programmatic expertise and no coding stack shows zero skills, even
    // where the role explicitly asks for domain understanding.
    { name: 'Public Health', aliases: ['public health'] },
    { name: 'Epidemiology',  aliases: ['epidemiology', 'epidemiological', 'epidemiologist'] },
    { name: 'Biostatistics', aliases: ['biostatistics', 'biostatistician'] },
    { name: 'Health Informatics', aliases: ['health informatics', 'digital health', 'health information systems'] },
    { name: 'Health Economics', aliases: ['health economics', 'health financing', 'cost-effectiveness'] },
    { name: 'Disease Surveillance', aliases: ['disease surveillance', 'surveillance system', 'outbreak'] },
    { name: 'Monitoring & Evaluation', aliases: ['monitoring and evaluation', 'monitoring & evaluation'] },
    { name: 'Health Systems', aliases: ['health systems', 'health system strengthening', 'health policy'] },
    { name: 'Claims & Insurance', aliases: ['claims', 'insurance', 'health insurance', 'reimbursement', 'pre-authorisation', 'preauthorization'] },
    { name: 'EHR/EMR',       aliases: ['ehr', 'emr', 'electronic health record', 'electronic medical record'] },
    { name: 'FHIR',          aliases: ['fhir', 'hl7'] },
    { name: 'Clinical Research', aliases: ['clinical research', 'clinical trial', 'clinical trials'] },
    { name: 'Immunisation',  aliases: ['immunisation', 'immunization', 'vaccination'] },

    // Analytics tooling common in health and policy work
    { name: 'STATA',         aliases: ['stata'] },
    { name: 'SPSS',          aliases: ['spss'] },
    { name: 'SAS',           aliases: ['sas'] },
    { name: 'R',             aliases: ['rstudio', 'r programming', 'r language'] },
    { name: 'Power BI',      aliases: ['power bi', 'powerbi'] },
    { name: 'Tableau',       aliases: ['tableau'] },
    { name: 'Excel',         aliases: ['excel', 'advanced excel'] }
];

// Escape a string for literal use inside a RegExp.
function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Build one boundary-aware regex per vocabulary entry, once, at load time.
//
// Boundaries use lookarounds rather than \b because \b behaves badly next to
// '#', '+' and '.' -- e.g. /\bc#\b/ never matches "C#".
//
// Within an alias, runs of spaces and hyphens are treated as equivalent, so a
// single entry covers "model monitoring", "model-monitoring" and
// "model  monitoring". Job descriptions and resumes disagree constantly about
// hyphenation ("synthetic-data generation" vs "synthetic data"), and without
// this the space-separated form silently fails to match the hyphenated one.
//
// The trailing boundary rejects letters but ALLOWS digits, so the version
// suffixes resumes actually write -- Python3, Java8, Node18, Angular2, CSS3 --
// still match. Letters must stay blocked or 'java' would match 'javascript'.
function compileAlias(alias) {
    return escapeRegExp(alias).replace(/[\s-]+/g, '[\\s-]+');
}

const SKILL_MATCHERS = SKILL_VOCABULARY.map(entry => ({
    name: entry.name,
    regex: new RegExp(
        '(?<![a-z0-9_])(?:' +
        entry.aliases.map(compileAlias).join('|') +
        ')(?![a-zA-Z_])',
        'i'
    )
}));

// Canonical name -> compiled matcher, so scoring can reuse the same
// boundary-aware regexes instead of re-deriving a weaker test.
const SKILL_MATCHER_BY_NAME = {};
SKILL_MATCHERS.forEach(m => { SKILL_MATCHER_BY_NAME[m.name] = m.regex; });

// Does this text demonstrate the named skill?
//
// Must go through the compiled regex, never indexOf. Plain substring matching
// makes short entries match inside ordinary words -- 'RAG' hits "leverage",
// "coverage", "storage" and "paragraph", which handed a retrieval-augmented-
// generation credit to most of a candidate pool.
function textDemonstratesSkill(text, skillName) {
    if (!text) return false;
    const regex = SKILL_MATCHER_BY_NAME[skillName];
    if (regex) return regex.test(text);
    // Not a vocabulary term (e.g. a skill parsed out of a resume's own skills
    // section). Fall back to a word-boundary comparison, still not a substring.
    return new RegExp('(?<![a-z0-9_])' + escapeRegExp(skillName).replace(/[\s-]+/g, '[\\s-]+') + '(?![a-zA-Z_])', 'i')
        .test(text);
}

// Find every vocabulary skill mentioned in a block of text.
// Returns canonical names, deduped, in vocabulary order.
function findSkillsInText(text) {
    if (!text) return [];
    const haystack = text.toLowerCase();
    return SKILL_MATCHERS
        .filter(matcher => matcher.regex.test(haystack))
        .map(matcher => matcher.name);
}

// ---------------------------------------------------------------------------
// Mining requirement terms out of the job description itself
// ---------------------------------------------------------------------------
//
// SKILL_VOCABULARY gives good aliases and canonical casing, but it must not be
// the LIMIT on what counts. A fixed list cannot know the terms that matter to a
// particular role -- an AI post turns on RAG, MLOps and de-identification; a
// health-systems post on FHIR, NHCX or PM-JAY. Anything off-list scored zero no
// matter how central it was to the job.
//
// So: mine candidate terms from the description too, and treat the vocabulary
// as a canonicalisation layer over the top.

// Headings that introduce the parts of a posting that actually state
// requirements. Mining only these keeps organisational boilerplate -- mission
// statements, funder lists, programme histories -- out of the skill list.
const JD_REQUIREMENT_HEADING_RE = /^(?:key\s+)?(?:responsibilities|accountabilities|qualifications?|requirements?|minimum\s+qualifications?|required\s+qualifications?|essential\s+(?:criteria|skills)|preferred(?:\s+qualifications?|\s+skills)?|desirable|nice\s+to\s+have|must\s+have|skills?(?:\s*(?:&|and)\s*traits)?|technical\s+skills|competencies|what\s+you.{0,3}ll\s+do|who\s+you\s+are|about\s+the\s+role|position\s+summary)\s*:?\s*$/i;

// Headings that end the requirement part of a posting.
const JD_CLOSING_HEADING_RE = /^(?:about\s+(?:us|the\s+(?:company|organisation|organization))|overview|company|benefits|compensation|salary|how\s+to\s+apply|application\s+process|equal\s+opportunity|diversity|last\s+date|note)\b/i;

// Uppercase tokens that are ordinary English or posting furniture, not skills.
const ACRONYM_STOPLIST = {};
('A AN AND ARE AS AT BE BUT BY CAN DO FOR FROM HAS HAVE HOW IF IN IS IT ITS KEY MAY NEW NO NOT OF ON OR OUR SO THE TO TWO ONE UP US USE WE WHO WILL WITH YOU YOUR ALL ANY EACH MORE MOST SUCH THAN THAT THIS THESE THOSE WHEN WHERE WHICH WHILE WHY OK PLUS PER VIA ETC EG IE VS JOB ROLE TEAM WORK FULL TIME PART YEARS YEAR CV HR CTC LPA IST AM PM MON TUE WED THU FRI SAT SUN JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC').split(' ')
    .forEach(w => { ACRONYM_STOPLIST[w] = true; });

// Multi-word phrases that look like proper nouns but are not skills.
const PHRASE_STOPWORDS = /\b(?:job|role|team|company|organisation|organization|department|division|office|salary|benefit|candidate|applicant|application|apply|deadline|date|city|country|state|india|delhi|mumbai|bangalore|full\s+time|part\s+time|equal\s+opportunity|last\s+date)\b/i;

// Compare terms with hyphens and spaces treated alike, so a posting's
// "model-monitoring" is recognised as the vocabulary's "model monitoring".
function normaliseTerm(term) {
    return term.toLowerCase().replace(/[\s-]+/g, ' ').trim();
}

// Is this term already covered by the vocabulary (as a canonical name, an
// alias, or the leading words of one)? The prefix test catches fragments such
// as "retrieval-augmented", which the RAG entry already handles better.
function inVocabulary(term) {
    const needle = normaliseTerm(term);
    for (let i = 0; i < SKILL_VOCABULARY.length; i++) {
        const entry = SKILL_VOCABULARY[i];
        if (normaliseTerm(entry.name) === needle) return true;
        for (let j = 0; j < entry.aliases.length; j++) {
            const alias = normaliseTerm(entry.aliases[j]);
            if (alias === needle) return true;
            // Prefix test only for substantial fragments. Applying it to short
            // acronyms wrongly folds "AI" into "ai agents" and "ML" into
            // "ml ops", which are narrower things than the acronym itself.
            if (needle.length >= 6 && alias.indexOf(needle + ' ') === 0) return true;
        }
    }
    return false;
}

// Narrow a posting to the sections that state requirements.
// Returns '' when no such section is recognised, so callers can fall back.
function requirementText(text) {
    const lines = (text || '').split('\n');
    const kept = [];
    let inside = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        // Headings can carry a trailing colon and nothing else on the line.
        const bare = line.replace(/[:\s]+$/, '');
        if (JD_REQUIREMENT_HEADING_RE.test(bare)) { inside = true; continue; }
        if (JD_CLOSING_HEADING_RE.test(bare)) { inside = false; continue; }
        if (inside) kept.push(line);
    }
    return kept.join('\n');
}

// Pull skill-like terms out of a job description.
// Returns display strings; the caller dedupes against the vocabulary.
function mineJobDescriptionTerms(text) {
    if (!text) return [];
    const seen = {};
    const out = [];

    function add(term) {
        let clean = term.replace(/\s+/g, ' ').trim().replace(/[.,;:)('"]+$/, '').replace(/^[.,;:('"]+/, '');
        if (clean.length < 2 || clean.length > 40) return;
        const key = clean.toLowerCase();
        if (seen[key]) return;
        if (PHRASE_STOPWORDS.test(clean)) return;
        if (inVocabulary(clean)) return;   // vocabulary supplies a better form
        seen[key] = true;
        out.push(clean);
    }

    // 1. Parenthesised abbreviations: "retrieval-augmented generation (RAG)".
    //    The abbreviation is the better matcher -- resumes use the short form.
    const paren = /\(([A-Za-z][A-Za-z0-9\-\/&.+]{1,14})\)/g;
    let m;
    while ((m = paren.exec(text)) !== null) {
        const abbr = m[1];
        if (/[A-Z]/.test(abbr) && !ACRONYM_STOPLIST[abbr.toUpperCase()]) add(abbr);
    }

    // 2. Standalone acronyms: LLM, ETL, FHIR, DPDP, SAHI, NHCX, PM-JAY.
    const acronym = /\b([A-Z][A-Z0-9]{1,7}(?:[-\/][A-Z0-9]{2,7})?)\b/g;
    while ((m = acronym.exec(text)) !== null) {
        const token = m[1];
        if (ACRONYM_STOPLIST[token]) continue;
        if (/^\d+$/.test(token)) continue;
        add(token);
    }

    // 3. CamelCase product names the vocabulary has not caught: MLOps,
    //    LangChain, PyTorch, LlamaIndex.
    const camel = /\b([A-Z][a-z]+(?:[A-Z][a-z0-9]+)+)\b/g;
    while ((m = camel.exec(text)) !== null) add(m[1]);

    // 4. Hyphenated lowercase compounds, which is how postings write practices:
    //    model-monitoring, drift-detection, de-identification, reverse-etl.
    //    Up to four segments, so "clinician-in-the-loop" is not truncated to
    //    "clinician-in-the".
    const hyphenated = /\b([a-z]{3,}(?:-[a-z]{2,}){1,3})\b/g;
    while ((m = hyphenated.exec(text)) !== null) {
        const term = m[1];
        // Skip ordinary prose compounds, which carry no skill signal.
        if (/^(?:e-mail|day-to-day|well-being|long-term|short-term|full-time|part-time|end-to-end|on-going|up-to-date|state-of-the-art|cross-functional|cross-sector|self-starter|problem-solving|decision-making|high-quality|high-level|low-level|in-house|hands-on|world-class|data-driven|open-minded|fast-paced|multi-stakeholder|risk-proportionate|large-scale|small-scale|public-sector|private-sector|on-the-ground|in-country|sub-district|well-established|long-standing|closely-related|task-specific|user-facing)$/.test(term)) continue;
        add(term);
    }

    return out;
}

// Read a job description and return the requirements we can actually assess.
//
// Returns { skills: string[], requiredYears: number }.
// requiredYears is 0 when the description never states a year requirement.
//
// Note: years are deliberately NOT mixed into `skills`. The previous version
// pushed a synthetic "3+ years experience" string into the keyword list, which
// could never match a candidate skill and so silently inflated the scoring
// denominator, depressing every candidate's score.
function extractJobRequirements(text) {
    // Mine and match within the requirement sections when the posting has them.
    // A long "About us" section is full of proper nouns that are context, not
    // competencies, and would otherwise dominate the requirement list.
    const scoped = requirementText(text || '');
    const forSkills = scoped || (text || '');

    const vocabularySkills = findSkillsInText(forSkills);

    // Terms the description states that the vocabulary has no entry for.
    const minedSkills = mineJobDescriptionTerms(forSkills);

    const skills = vocabularySkills.concat(minedSkills);

    // Record provenance so the UI can show where each requirement came from and
    // the reviewer can drop mined terms that are not really skills.
    const skillSources = {};
    vocabularySkills.forEach(s => { skillSources[s] = 'vocabulary'; });
    minedSkills.forEach(s => { skillSources[s] = 'jd'; });

    // Pick the highest stated year requirement -- that is the role's real bar.
    // Matches "3+ years", "5 years of experience", "minimum 4 yrs".
    let requiredYears = 0;
    const yearPattern = /(\d{1,2})\s*\+?\s*(?:years?|yrs?)\b/gi;
    let match;
    while ((match = yearPattern.exec(text || '')) !== null) {
        const years = parseInt(match[1], 10);
        // Ignore implausible values (graduation years, incidental prose).
        if (years > 0 && years <= 30 && years > requiredYears) {
            requiredYears = years;
        }
    }

    return {
        skills: skills,
        skillSources: skillSources,
        requiredYears: requiredYears,
        scopedToRequirements: scoped.length > 0
    };
}

// Score one candidate against the job requirements. Returns 0-100.
//
// This is keyword-and-rules matching, not a model. The UI calls it a keyword
// score for that reason.
//
// Breakdown:
//   skill match  -- 10 points per required skill the candidate demonstrates
//   experience   -- up to 20 bonus points
//   education    -- up to 15 bonus points
const EXPERIENCE_BONUS_MAX = 20;
const EDUCATION_BONUS_MAX = 15;
const BONUS_POOL = EXPERIENCE_BONUS_MAX + EDUCATION_BONUS_MAX;

function calculateKeywordScore(candidate, requirements) {
    // Tolerate the old array-shaped argument so a stale caller degrades
    // predictably instead of throwing.
    const req = Array.isArray(requirements)
        ? { skills: requirements, requiredYears: 0 }
        : (requirements || { skills: [], requiredYears: 0 });

    const requiredSkills = req.skills || [];
    let score = 0;

    // --- Skill match ---
    // An exact hit in the candidate's parsed skill list, or a boundary-aware
    // mention anywhere in their resume text.
    const ownSkills = {};
    (candidate.skills || []).forEach(s => { ownSkills[s.toLowerCase()] = true; });
    const candidateText = candidate.resumeText || '';

    const matchedSkills = [];
    requiredSkills.forEach(skill => {
        if (ownSkills[skill.toLowerCase()] || textDemonstratesSkill(candidateText, skill)) {
            score += 10;
            matchedSkills.push(skill);
        }
    });
    // Expose the evidence so a reviewer can see why a score is what it is.
    candidate.matchedSkills = matchedSkills;

    // --- Experience bonus ---
    const years = candidate.experience || 0;
    if (req.requiredYears > 0) {
        // Judge against what the job actually asked for.
        const ratio = years / req.requiredYears;
        if (ratio >= 1) score += EXPERIENCE_BONUS_MAX;
        else if (ratio >= 0.75) score += 12;
        else if (ratio >= 0.5) score += 6;
    } else {
        // No stated requirement -- fall back to a graduated scale.
        if (years >= 5) score += EXPERIENCE_BONUS_MAX;
        else if (years >= 3) score += 12;
        else if (years >= 1) score += 6;
    }

    // --- Education bonus ---
    const education = (candidate.education || '').toLowerCase();
    if (education.indexOf('phd') !== -1 || education.indexOf('doctor') !== -1) {
        score += EDUCATION_BONUS_MAX;
    } else if (education.indexOf('master') !== -1) {
        score += 13;
    } else if (education.indexOf('bachelor') !== -1) {
        score += 10;
    } else if (education.indexOf('diploma') !== -1 || education.indexOf('associate') !== -1) {
        score += 5;
    }

    const maxScore = requiredSkills.length * 10 + BONUS_POOL;
    const percent = Math.round((score / maxScore) * 100);

    // If we recognised no skills in the job description, the score is bonus-only
    // and says nothing about fit. Cap it so it cannot masquerade as a 100% match;
    // the UI warns separately when this happens.
    if (requiredSkills.length === 0) {
        return Math.min(percent, 50);
    }

    return Math.min(percent, 100);
}
