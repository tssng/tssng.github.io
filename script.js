document.addEventListener('DOMContentLoaded', () => {
    // --- YOUR PORTFOLIO DATA ---
    // This is the main object you will edit to customize your portfolio.
    // 'id' must be unique. 'parentId' links a node to its parent.
    const portfolioData = {
        // The Root Node (Level 0)
        'root': { id: 'root', parentId: null, title: 'Home', keys: ['About', 'Projects', 'Skills', 'Contact'] },

        // Internal Nodes (Level 1)
        'about': { id: 'about', parentId: 'root', title: 'About Me', isLeaf: true, content: `<h2>About Me</h2><p>I'm a passionate software engineer with a love for building efficient and scalable solutions. My background in computer science, particularly in data structures and algorithms, inspires me to create clean, logical, and performant applications.</p><p>This portfolio is a reflection of that passion, structured as an interactive B+ Tree. Feel free to traverse the nodes to learn more about my work and skills!</p>` },
        'projects': { id: 'projects', parentId: 'root', title: 'Projects', keys: ['Project A', 'Project B', 'Project C'] },
        'skills': { id: 'skills', parentId: 'root', title: 'Skills', keys: ['Languages', 'Frameworks', 'Databases'] },
        'contact': { id: 'contact', parentId: 'root', title: 'Contact', isLeaf: true, content: `<h2>Get In Touch</h2><p>I'm always open to discussing new projects, creative ideas, or opportunities to be part of an ambitious vision.</p><p>You can reach me via <a href="mailto:youremail@example.com">email</a>, or connect with me on <a href="https://linkedin.com/in/yourprofile" target="_blank">LinkedIn</a> and <a href="https://github.com/yourprofile" target="_blank">GitHub</a>.</p>` },

        // Leaf Nodes for Projects (Level 2)
        'project-a': { id: 'project-a', parentId: 'projects', title: 'Interactive Data Dashboard', isLeaf: true, content: `<h2>Interactive Data Dashboard</h2><p>A web-based platform for visualizing complex datasets in real-time. Users can upload data, choose from various chart types, and create shareable dashboards.</p><div class="tech-stack"><span>React</span><span>D3.js</span><span>Node.js</span><span>PostgreSQL</span></div><p><a href="#" target="_blank">View Live Demo</a> | <a href="#" target="_blank">View on GitHub</a></p>` },
        'project-b': { id: 'project-b', parentId: 'projects', title: 'E-Commerce Recommendation Engine', isLeaf: true, content: `<h2>E-Commerce Recommendation Engine</h2><p>A machine learning model that provides personalized product recommendations. Integrated into a mock e-commerce site, it increased user engagement by 25%.</p><div class="tech-stack"><span>Python</span><span>TensorFlow</span><span>Flask</span><span>MongoDB</span></div><p><a href="#" target="_blank">View on GitHub</a></p>` },
        'project-c': { id: 'project-c', parentId: 'projects', title: 'Mobile Task Manager', isLeaf: true, content: `<h2>Mobile Task Manager</h2><p>A cross-platform mobile app built with React Native to help users organize their daily tasks with a clean and intuitive interface.</p><div class="tech-stack"><span>React Native</span><span>Firebase</span><span>Redux</span></div><p><a href="#" target="_blank">View on GitHub</a></p>` },

        // Internal Nodes for Skills (Level 2)
        'languages': { id: 'languages', parentId: 'skills', title: 'Languages', keys: ['JavaScript', 'Python', 'C++'] },
        'frameworks': { id: 'frameworks', parentId: 'skills', title: 'Frameworks', keys: ['React', 'Node.js', 'Django'] },
        'databases': { id: 'databases', parentId: 'skills', title: 'Databases', keys: ['PostgreSQL', 'MongoDB', 'Redis'] },
        
        // You can add more leaf nodes for individual skills if you want!
    };

    const treeContainer = document.getElementById('b-tree');
    const contentDisplay = document.getElementById('content-display');
    const contentDetails = document.getElementById('content-details');
    const closeButton = document.getElementById('close-content');

    // Function to create a single node element
    function createNodeElement(nodeData) {
        const nodeEl = document.createElement('div');
        nodeEl.classList.add('node');
        nodeEl.dataset.nodeId = nodeData.id;
        
        const titleEl = document.createElement('h3');
        titleEl.textContent = nodeData.title;
        nodeEl.appendChild(titleEl);

        if (nodeData.keys) {
            const keysContainer = document.createElement('div');
            keysContainer.classList.add('keys');
            nodeData.keys.forEach(keyText => {
                const keyEl = document.createElement('button');
                keyEl.classList.add('key');
                keyEl.textContent = keyText;
                // Find the child node this key points to
                const childNode = Object.values(portfolioData).find(n => n.title === keyText && n.parentId === nodeData.id);
                if (childNode) {
                    keyEl.dataset.targetId = childNode.id;
                    if(childNode.isLeaf) keyEl.classList.add('leaf-key');
                } else {
                    keyEl.disabled = true; // Key leads nowhere
                }
                keysContainer.appendChild(keyEl);
            });
            nodeEl.appendChild(keysContainer);
        }
        
        if (nodeData.isLeaf) {
            nodeEl.classList.add('leaf-node');
        } else {
            nodeEl.classList.add('internal-node');
        }

        return nodeEl;
    }

    // Function to render the entire tree
    function renderTree() {
        treeContainer.innerHTML = '';
        const root = portfolioData['root'];
        
        // Create levels
        const level0 = document.createElement('div');
        level0.classList.add('tree-level');
        level0.appendChild(createNodeElement(root));
        treeContainer.appendChild(level0);

        // This simple renderer assumes a fixed 2-level structure for demonstration.
        // A more complex portfolio would need a recursive rendering function.
        const level1Children = Object.values(portfolioData).filter(n => n.parentId === 'root');
        const level1 = document.createElement('div');
        level1.classList.add('tree-level');
        
        level1Children.forEach(child => {
            if (!child.isLeaf) {
                level1.appendChild(createNodeElement(child));
            }
        });
        treeContainer.appendChild(level1);
    }
    
    // Event listener for clicks on keys
    treeContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('key')) {
            const targetId = e.target.dataset.targetId;
            if (targetId) {
                const targetNodeData = portfolioData[targetId.toLowerCase().replace(/ /g, '-')]; // Simple ID generation
                if (targetNodeData && targetNodeData.isLeaf) {
                    showContent(targetNodeData);
                } else if (targetNodeData) {
                    // In a more complex tree, this would handle traversal animation
                    console.log(`Traversing to internal node: ${targetNodeData.title}`);
                }
            }
        }
    });

    // Function to show the content panel
    function showContent(nodeData) {
        contentDetails.innerHTML = nodeData.content;
        contentDisplay.classList.remove('hidden');
    }

    // Function to hide the content panel
    function hideContent() {
        contentDisplay.classList.add('hidden');
    }

    closeButton.addEventListener('click', hideContent);
    contentDisplay.addEventListener('click', (e) => {
        if (e.target === contentDisplay) {
            hideContent();
        }
    });

    // Initial render
    renderTree();
});
