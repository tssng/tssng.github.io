document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENTS ---
    const bootScreen = document.getElementById('boot-screen');
    const bootText = document.getElementById('boot-text');
    const navLinks = document.querySelectorAll('#main-nav a');
    const contentPanel = document.getElementById('content-panel');
    const panelBody = document.getElementById('panel-body');
    const closePanelButton = document.getElementById('close-panel');
    const pulse = document.getElementById('energy-pulse');

    // --- PORTFOLIO CONTENT ---
    // This is the main object you will edit to customize your portfolio.
    const portfolioContent = {
        'about': {
            title: 'Ecological Niche',
            content: `
                <h2>[ Core Philosophy & Bio ]</h2>
                <p>My approach to software engineering is modeled on natural systems: build for resilience, efficiency, and scalability. I see performance not as a feature, but as a fundamental requirement for a system's survival in a competitive digital ecosystem.</p>
                <p>I specialize in memory optimization and high-performance computing, architecting systems that consume minimal resources while delivering maximum throughput—the digital equivalent of optimizing photosynthesis in a low-light environment.</p>
            `
        },
        'projects': {
            title: 'Leaf Metabolism Analysis',
            content: `
                <h2>[ Project Analysis ]</h2>
                <p>Each project is a 'leaf'—a self-contained system optimized for a specific function. The focus is always on analyzing and improving the core metabolic processes (algorithms and data structures).</p>
                
                <h3>Project: In-Memory Columnar Database</h3>
                <p>A custom data store designed for analytical queries. By organizing data in columns and leveraging SIMD instructions, it achieved a 50x performance increase over traditional row-based stores for aggregate functions. The <span class="hotspot">cache-friendly memory layout</span> was the critical performance hotspot I optimized.</p>
                <div class="tech-stack"><span>C++</span><span>SIMD Intrinsics</span><span>Memory Profiling</span></div>
                
                <h3>Project: Lock-Free Concurrent Queue</h3>
                <p>A high-throughput queue for a multi-threaded data processing pipeline. This structure eliminated lock contention, which was the primary bottleneck. The key challenge was ensuring thread safety and preventing race conditions using <span class="hotspot">atomic operations</span>.</p>
                <div class="tech-stack"><span>Rust</span><span>Concurrency</span><span>Data Structures</span></div>
            `
        },
        'skills': {
            title: 'Genetic Adaptations',
            content: `
                <h2>[ Skills & Technologies ]</h2>
                <p>These are the core genetic traits and symbiotic tools I use to build and optimize systems.</p>
                <h3>Primary Languages (Genetic Code):</h3>
                <p><span class="tech-stack">C++</span><span class="tech-stack">Rust</span><span class="tech-stack">Go</span></p>
                <h3>Specializations (Metabolic Pathways):</h3>
                <p><span class="tech-stack">Memory Management</span><span class="tech-stack">Performance Profiling</span><span class="tech-stack">Concurrency & Parallelism</span><span class="tech-stack">Data Structures</span><span class="tech-stack">System Architecture</span></p>
                <h3>Tools (Symbiotic Organisms):</h3>
                <p><span class="tech-stack">VTune</span><span class="tech-stack">Perf</span><span class="tech-stack">GDB</span><span class="tech-stack">Docker</span><span class="tech-stack">Kubernetes</span></p>
            `
        },
        'contact': {
            title: 'Mycorrhizal Network',
            content: `
                <h2>[ Contact & Links ]</h2>
                <p>Forming symbiotic connections is key to growth. I'm always open to discussing complex challenges in performance engineering and system design.</p>
                <ul>
                    <li><a href="https://github.com/yourprofile" target="_blank">GitHub (Code Repository)</a></li>
                    <li><a href="https://linkedin.com/in/yourprofile" target="_blank">LinkedIn (Professional Network)</a></li>
                    <li><a href="mailto:youremail@example.com">Email (Direct Comms Link)</a></li>
                </ul>
            `
        }
    };

    // --- INITIALIZATION ---
    function init() {
        // Simulate boot sequence
        setTimeout(() => {
            bootText.insertAdjacentHTML('afterend', '<p>> Loading kernel modules...</p>');
        }, 800);
        setTimeout(() => {
            bootText.insertAdjacentHTML('afterend', '<p>> System online. Welcome.</p>');
        }, 1600);
        setTimeout(() => {
            bootScreen.classList.add('hidden');
        }, 2500);
    }

    // --- INTERACTIVITY ---
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const contentId = link.dataset.contentId;
            const pathId = link.dataset.pathId;
            
            // Trigger energy pulse animation
            animatePulse(pathId);
            
            // Load content after a delay
            setTimeout(() => {
                const data = portfolioContent[contentId];
                panelBody.innerHTML = `<h2>${data.title}</h2>${data.content}`;
                contentPanel.classList.remove('hidden');
            }, 700); // Delay should be less than animation duration
        });
    });

    closePanelButton.addEventListener('click', () => {
        contentPanel.classList.add('hidden');
    });

    // --- ANIMATION LOGIC ---
    function animatePulse(pathId) {
        const path = document.getElementById(pathId);
        if (!path) return;

        pulse.classList.remove('hidden');
        const duration = 1200; // ms
        const length = path.getTotalLength();

        pulse.style.animation = 'none';
        // Force reflow
        pulse.getBoundingClientRect();

        // Create a dynamic animation for each path
        const animationName = `pulse-anim-${pathId}`;
        const styleSheet = document.styleSheets[0];
        
        const keyframes = `
            @keyframes ${animationName} {
                0% {
                    motion-offset: 0%;
                    opacity: 1;
                }
                90% {
                    opacity: 1;
                }
                100% {
                    motion-offset: 100%;
                    opacity: 0;
                }
            }`;
        
        // A simple way to add keyframes, might need more robust solution for many paths
        try {
            styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
        } catch(e) { console.warn("Animation rule might already exist.") }

        pulse.style.motionPath = `path('${path.getAttribute('d')}')`;
        pulse.style.animation = `${animationName} ${duration}ms ease-out forwards`;
    }

    init();
});
