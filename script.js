document.addEventListener('DOMContentLoaded', () => {
    const GRID_CELL_COUNT = 2000; // density
    const FRAGMENTATION_PERCENT = 0.3; // 30% of cells will be fragmented
    const DEFRAG_SPEED_MS = 2; // speed of the defrag animation (ms)
    const loader = document.getElementById('loader');
    const loaderStatus = document.getElementById('loader-status');
    const gridContainer = document.getElementById('disk-grid-container');
    const mainContent = document.getElementById('main-content');
    const contentTitle = document.getElementById('content-title');
    const contentBody = document.getElementById('content-body');
    const nav = document.getElementById('fat-nav');
    const closeButton = document.getElementById('close-content');

    // portfolio
    const portfolioContent = {
        'about': {
            title: 'identity.log',
            content: `
                <h2>[ System Analysis: Core Identity ]</h2>
                <p>Authentication successful. Accessing primary log...</p>
                <p>I am a software engineer driven by a passion for solving complex problems and building robust, scalable systems. My expertise lies in database architecture, query optimization, and backend development.</p>
            
            `
        },
        'projects': {
            title: 'recovered_data/',
            content: `
                <h2>[ Directory: /recovered_data/ ]</h2>
                <p>Listing all recovered project archives...</p>
                <div class="project-list">
                    <div class="project-item">
                        <h3>Project ???: Multi-dimensional Learned Index</h3>
                        <p>Coming soon.</p>
                        <div class="tech-stack"><span>C++</span><span>Python</span><span>Docker</span></div>
                    </div>
        
                </div>
            `
        },
        'skills': {
            title: 'core_attributes.sys',
            content: `
                <h2>[ System File: core_attributes.sys ]</h2>
                <p>Parsing core competencies and skill mappings...</p>
                <h3>Languages:</h3>
                <p><span class="tech-stack"><span>Go</span><span>Python</span><span>SQL</span><span>TypeScript</span><span>C++</span></span></p>
                <h3>Databases:</h3>
                <p><span class="tech-stack"><span>PostgreSQL</span><span>ClickHouse</span><span>Redis</span><span>MongoDB</span><span>BigQuery</span></span></p>
                <h3>Tools & Technologies:</h3>
                <p><span class="tech-stack"><span>Docker</span><span>Kubernetes</span><span>Kafka</span><span>Terraform</span><span>Airflow</span><span>AWS/GCP</span></span></p>
            `
        },
        'contact': {
            title: 'connection.cfg',
            content: `
                <h2>[ Config: connection.cfg ]</h2>
                <p>Establishing secure connection protocols...</p>
                <p>Open to discussing new challenges, complex data problems, and opportunities to build impactful systems. You can establish a connection via the following protocols:</p>
                <ul>
                    <li><a href="mailto:tejas.t.singh@gmail.com">Email Protocol: tejas.t.singh@gmail.com</a></li>
                    <li><a href="https://linkedin.com/in/tejas-singh-48375b368" target="_blank">LinkedIn Protocol: /in/tejas-singh-48375b368/</a></li>
                    <li><a href="https://github.com/tssng" target="_blank">GitHub Protocol: /tssng</a></li>
                </ul>
            `
        }
    };

    // init
    function init() {
        // run loader animation
        setTimeout(() => { loaderStatus.textContent = 'Verifying disk integrity...'; }, 1000);
        setTimeout(() => { loaderStatus.textContent = 'Boot sequence initiated.'; }, 2000);
        setTimeout(() => {
            loader.style.opacity = '0';
            loader.style.pointerEvents = 'none';
        }, 2800);


        generateGrid();
    }

    // grid
    let allCells = [];
    function generateGrid() {
        for (let i = 0; i < GRID_CELL_COUNT; i++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            gridContainer.appendChild(cell);
            allCells.push(cell);
        }
        fragmentDisk();
    }

    function fragmentDisk() {
        allCells.forEach(cell => {
            cell.style.backgroundColor = 'transparent';
            cell.classList.remove('fragmented');
        });

        const fragmentCount = Math.floor(GRID_CELL_COUNT * FRAGMENTATION_PERCENT);
        for (let i = 0; i < fragmentCount; i++) {
            const randomIndex = Math.floor(Math.random() * GRID_CELL_COUNT);
            const cell = allCells[randomIndex];
            cell.classList.add('fragmented');
            cell.style.backgroundColor = Math.random() > 0.5 ? 'var(--fragment-color-1)' : 'var(--fragment-color-2)';
        }
    }

    // nav/content logic
    nav.addEventListener('click', (e) => {
        e.preventDefault();
        if (e.target.tagName === 'A') {
            const contentId = e.target.dataset.contentId;
            if (portfolioContent[contentId]) {
                defragmentAndShowContent(contentId);
            }
        }
    });

    function defragmentAndShowContent(contentId) {
        nav.classList.add('hidden'); // hide nav during animation
        const fragmentedCells = document.querySelectorAll('.grid-cell.fragmented');
        let delay = 0;

        fragmentedCells.forEach(cell => {
            setTimeout(() => {
                cell.style.backgroundColor = 'var(--defrag-color)';
            }, delay);
            delay += DEFRAG_SPEED_MS;
        });

        // after animation, show content
        setTimeout(() => {
            const data = portfolioContent[contentId];
            contentTitle.textContent = data.title;
            contentBody.innerHTML = data.content;
            mainContent.classList.remove('hidden');
            gridContainer.classList.add('hidden');
        }, delay + 500);
    }

    closeButton.addEventListener('click', () => {
        mainContent.classList.add('hidden');
        gridContainer.classList.remove('hidden');
        nav.classList.remove('hidden');
        fragmentDisk(); // Re-fragment the disk for the next view
    });

    init();
});
