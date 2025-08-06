// Test Data and Testing Scenarios for Resume Screening App

// Sample Job Descriptions for Testing
const testJobDescriptions = {
    frontend: `
Frontend Developer - React/JavaScript
We are seeking a skilled Frontend Developer to join our team.

Requirements:
- 3+ years of experience in JavaScript development
- Proficiency in React, HTML5, CSS3
- Experience with TypeScript and modern build tools
- Knowledge of responsive design and cross-browser compatibility
- Familiarity with Git version control
- Bachelor's degree in Computer Science or related field
- Experience with REST APIs and GraphQL is a plus
- Knowledge of testing frameworks like Jest

Responsibilities:
- Develop user-facing features using React
- Collaborate with designers and backend developers
- Optimize applications for maximum speed and scalability
- Participate in code reviews and maintain coding standards
    `,
    
    backend: `
Senior Backend Developer - Python/Django
Join our engineering team as a Senior Backend Developer.

Requirements:
- 5+ years of backend development experience
- Strong proficiency in Python and Django framework
- Experience with PostgreSQL and database optimization
- Knowledge of Docker and containerization
- Familiarity with AWS cloud services
- Experience with microservices architecture
- Master's degree preferred
- Knowledge of Redis, Elasticsearch
- Experience with CI/CD pipelines and DevOps practices

Responsibilities:
- Design and implement scalable backend systems
- Optimize database queries and system performance
- Collaborate with frontend teams on API development
- Mentor junior developers
    `,
    
    fullstack: `
Full Stack Developer - MEAN/MERN Stack
We need a versatile Full Stack Developer for our growing team.

Requirements:
- 4+ years of full-stack development experience
- Proficiency in JavaScript, Node.js, React/Angular
- Experience with MongoDB and SQL databases
- Knowledge of Express.js framework
- Familiarity with cloud platforms (AWS/Azure)
- Experience with agile development methodologies
- Bachelor's or Master's degree in relevant field
- Knowledge of Docker, Kubernetes
- Understanding of microservices and API design

Responsibilities:
- Develop both frontend and backend components
- Design and implement RESTful APIs
- Collaborate in agile development environment
- Ensure application security and performance
    `
};

// Enhanced Mock Candidates with More Realistic Data
const enhancedTestCandidates = [
    {
        id: 1,
        name: 'Alex Rodriguez',
        experience: 6,
        education: 'Master\'s in Computer Science - Stanford University',
        skills: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS', 'Docker', 'TypeScript', 'GraphQL'],
        resumeText: `
ALEX RODRIGUEZ
Senior Full Stack Developer
Email: alex.rodriguez@email.com | Phone: (555) 123-4567

EXPERIENCE
Senior Software Engineer | TechCorp Inc. | 2019-2024
• Led development of React-based frontend applications serving 100K+ users
• Built scalable Node.js APIs with 99.9% uptime
• Implemented CI/CD pipelines using Docker and AWS
• Mentored 3 junior developers and conducted code reviews

Software Developer | StartupXYZ | 2018-2019
• Developed full-stack web applications using MEAN stack
• Optimized database queries reducing response time by 40%
• Collaborated with cross-functional teams in agile environment

EDUCATION
Master of Science in Computer Science
Stanford University | 2016-2018

TECHNICAL SKILLS
Languages: JavaScript, Python, TypeScript, Java
Frontend: React, Angular, Vue.js, HTML5, CSS3
Backend: Node.js, Express.js, Django, Flask
Databases: MongoDB, PostgreSQL, MySQL, Redis
Cloud: AWS, Azure, Docker, Kubernetes
        `,
        status: 'pending'
    },
    {
        id: 2,
        name: 'Sarah Chen',
        experience: 4,
        education: 'Bachelor\'s in Software Engineering - MIT',
        skills: ['Python', 'Django', 'PostgreSQL', 'React', 'AWS', 'Redis', 'Docker'],
        resumeText: `
SARAH CHEN
Backend Developer
Email: sarah.chen@email.com | Phone: (555) 234-5678

EXPERIENCE
Backend Developer | DataFlow Systems | 2020-2024
• Designed and implemented microservices architecture using Python and Django
• Optimized PostgreSQL databases handling 10M+ records
• Integrated third-party APIs and payment gateways
• Reduced system latency by 35% through performance optimization

Junior Developer | WebSolutions | 2019-2020
• Built RESTful APIs using Django REST Framework
• Implemented automated testing with 90% code coverage
• Collaborated with frontend team on API specifications

EDUCATION
Bachelor of Science in Software Engineering
Massachusetts Institute of Technology | 2015-2019

TECHNICAL SKILLS
Languages: Python, JavaScript, SQL
Frameworks: Django, Flask, React
Databases: PostgreSQL, MongoDB, Redis
Tools: Docker, Git, Jenkins, AWS
        `,
        status: 'pending'
    },
    {
        id: 3,
        name: 'Michael Thompson',
        experience: 8,
        education: 'Master\'s in Information Technology - Carnegie Mellon',
        skills: ['Java', 'Spring Boot', 'Angular', 'Docker', 'Kubernetes', 'AWS', 'Microservices'],
        resumeText: `
MICHAEL THOMPSON
Senior Software Architect
Email: m.thompson@email.com | Phone: (555) 345-6789

EXPERIENCE
Senior Software Architect | Enterprise Solutions | 2018-2024
• Architected enterprise-grade applications serving 500K+ users
• Led migration from monolith to microservices architecture
• Implemented DevOps practices reducing deployment time by 60%
• Managed team of 8 developers across multiple projects

Software Engineer | TechGiant Corp | 2016-2018
• Developed Spring Boot applications with high availability
• Implemented automated testing and continuous integration
• Optimized application performance and scalability

EDUCATION
Master of Science in Information Technology
Carnegie Mellon University | 2014-2016

CERTIFICATIONS
• AWS Solutions Architect Professional
• Certified Kubernetes Administrator

TECHNICAL SKILLS
Languages: Java, JavaScript, Python
Frameworks: Spring Boot, Angular, React
Cloud: AWS, Azure, Kubernetes, Docker
Databases: PostgreSQL, MongoDB, Cassandra
        `,
        status: 'pending'
    },
    {
        id: 4,
        name: 'Emily Davis',
        experience: 3,
        education: 'Bachelor\'s in Computer Science - UC Berkeley',
        skills: ['React', 'TypeScript', 'Node.js', 'GraphQL', 'MongoDB', 'Jest'],
        resumeText: `
EMILY DAVIS
Frontend Developer
Email: emily.davis@email.com | Phone: (555) 456-7890

EXPERIENCE
Frontend Developer | UIDesign Co | 2021-2024
• Developed responsive React applications with TypeScript
• Implemented complex UI components with 95% test coverage
• Collaborated with UX designers on user interface improvements
• Optimized application bundle size by 30%

Junior Web Developer | Creative Agency | 2020-2021
• Built interactive websites using modern JavaScript
• Implemented responsive designs for mobile and desktop
• Worked with REST APIs and GraphQL endpoints

EDUCATION
Bachelor of Science in Computer Science
University of California, Berkeley | 2016-2020

TECHNICAL SKILLS
Languages: JavaScript, TypeScript, HTML5, CSS3
Frameworks: React, Vue.js, Express.js
Tools: Webpack, Jest, Git, Figma
APIs: REST, GraphQL
Databases: MongoDB, Firebase
        `,
        status: 'pending'
    },
    {
        id: 5,
        name: 'David Kim',
        experience: 7,
        education: 'PhD in Computer Science - Georgia Tech',
        skills: ['Python', 'Machine Learning', 'TensorFlow', 'AWS', 'Docker', 'Kubernetes', 'PostgreSQL'],
        resumeText: `
DAVID KIM
Senior Data Engineer / ML Engineer
Email: david.kim@email.com | Phone: (555) 567-8901

EXPERIENCE
Senior Data Engineer | AI Innovations | 2019-2024
• Built machine learning pipelines processing 1TB+ daily data
• Implemented real-time data streaming with Apache Kafka
• Deployed ML models using Docker and Kubernetes
• Reduced model inference time by 50% through optimization

Data Scientist | Analytics Corp | 2017-2019
• Developed predictive models with 92% accuracy
• Built data visualization dashboards using Python and React
• Collaborated with product teams on feature development

EDUCATION
PhD in Computer Science (Machine Learning Focus)
Georgia Institute of Technology | 2013-2017

PUBLICATIONS
• "Scalable Machine Learning Systems" - IEEE Conference 2023
• "Optimizing Neural Networks for Production" - ACM Journal 2022

TECHNICAL SKILLS
Languages: Python, R, JavaScript, SQL
ML/AI: TensorFlow, PyTorch, Scikit-learn
Cloud: AWS, GCP, Docker, Kubernetes
Databases: PostgreSQL, MongoDB, Cassandra
        `,
        status: 'pending'
    },
    {
        id: 6,
        name: 'Lisa Wang',
        experience: 2,
        education: 'Bachelor\'s in Computer Engineering - UCLA',
        skills: ['JavaScript', 'React', 'HTML5', 'CSS3', 'Git'],
        resumeText: `
LISA WANG
Junior Frontend Developer
Email: lisa.wang@email.com | Phone: (555) 678-9012

EXPERIENCE
Frontend Developer | StartupHub | 2022-2024
• Developed React components for e-commerce platform
• Implemented responsive designs for mobile optimization
• Participated in agile development processes
• Maintained 90% code quality standards

Web Development Intern | TechStart | 2021-2022
• Built landing pages using HTML5, CSS3, and JavaScript
• Assisted in debugging and testing web applications
• Learned modern development practices and tools

EDUCATION
Bachelor of Science in Computer Engineering
University of California, Los Angeles | 2018-2022

PROJECTS
• Personal Portfolio Website - React, TypeScript
• E-commerce Mock App - React, Node.js, MongoDB

TECHNICAL SKILLS
Languages: JavaScript, HTML5, CSS3
Frameworks: React, Express.js
Tools: Git, VSCode, Chrome DevTools
Design: Responsive Design, CSS Grid, Flexbox
        `,
        status: 'pending'
    }
];

// Test Scenarios
const testScenarios = {
    scenario1: {
        name: "Frontend Developer Screening",
        jobDescription: testJobDescriptions.frontend,
        expectedTopCandidates: ['Alex Rodriguez', 'Emily Davis'],
        filterTests: {
            minExperience: 3,
            requiredSkills: ['React', 'JavaScript'],
            minScore: 60
        }
    },
    
    scenario2: {
        name: "Backend Developer Screening", 
        jobDescription: testJobDescriptions.backend,
        expectedTopCandidates: ['Sarah Chen', 'David Kim'],
        filterTests: {
            minExperience: 5,
            education: ['master', 'phd'],
            requiredSkills: ['Python']
        }
    },
    
    scenario3: {
        name: "Full Stack Developer Screening",
        jobDescription: testJobDescriptions.fullstack,
        expectedTopCandidates: ['Alex Rodriguez', 'Michael Thompson'],
        filterTests: {
            minExperience: 4,
            requiredSkills: ['JavaScript', 'Node.js'],
            minScore: 70
        }
    }
};

// Performance Test Data
const performanceTestData = {
    largeCandidateSet: Array.from({ length: 100 }, (_, i) => ({
        id: i + 7,
        name: `Candidate ${i + 7}`,
        experience: Math.floor(Math.random() * 10) + 1,
        education: ['Bachelor\'s', 'Master\'s', 'PhD'][Math.floor(Math.random() * 3)] + ' in Computer Science',
        skills: ['JavaScript', 'Python', 'Java', 'React', 'Angular', 'Node.js', 'Docker', 'AWS']
            .sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 5) + 3),
        resumeText: `Sample resume text for Candidate ${i + 7}...`,
        status: 'pending'
    }))
};

// Export for use in testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        testJobDescriptions,
        enhancedTestCandidates,
        testScenarios,
        performanceTestData
    };
}