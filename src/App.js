import React, { useState, useRef, useMemo, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Stars } from '@react-three/drei';
import { useSpring, animated, config } from '@react-spring/web';
import * as THREE from 'three';

// --- Portfolio Data ---
// Customize this with your own information.
// Each item will be a floating node in the 3D space.
const portfolioData = [
    {
        category: 'Core Skills',
        items: [
            { name: 'Neural Networks', description: 'Designing and training deep learning models for various tasks, with a focus on efficiency and performance.' },
            { name: 'QuadTrees / B+ Trees', description: 'Deep understanding of hierarchical data structures for spatial partitioning and database indexing.' },
            { name: 'Low-Level Optimization', description: 'Profiling and optimizing code using C++/Rust for maximum performance on modern hardware.' },
            { name: 'Database Internals', description: 'Knowledge of how query planners, storage engines, and transaction managers work.' },
        ]
    },
    {
        category: 'Projects',
        items: [
            { name: 'Vector Database', description: 'A high-performance database for similarity search, built from scratch using custom B+ tree indexing.', url: 'https://github.com' },
            { name: '3D Generative Art Engine', description: 'A WebGL-based engine that uses neural networks to generate evolving 3D sculptures.', url: 'https://github.com' },
            { name: 'Real-time Analytics DB', description: 'An in-memory database optimized for fast aggregations and concurrent reads.', url: 'https://github.com' },
        ]
    },
    {
        category: 'Contact',
        items: [
            { name: 'GitHub', description: 'github.com/your-username', url: 'https://github.com/your-username' },
            { name: 'LinkedIn', description: 'linkedin.com/in/your-profile', url: 'https://linkedin.com/in/your-profile' },
            { name: 'Email', description: 'your.email@example.com', url: 'mailto:your.email@example.com' },
        ]
    }
];

// --- Helper function to position nodes in a sphere ---
function getSphericalPosition(index, total) {
    const phi = Math.acos(-1 + (2 * index) / total);
    const theta = Math.sqrt(total * Math.PI) * phi;
    const radius = 6; // Radius of the sphere
    const x = radius * Math.cos(theta) * Math.sin(phi);
    const y = radius * Math.sin(theta) * Math.sin(phi);
    const z = radius * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
}

// --- React Components ---

// A single floating node (skill, project, etc.)
function Node({ position, data, onClick }) {
    const ref = useRef();
    const [isHovered, setIsHovered] = useState(false);

    // Animate the node's scale and color on hover
    useFrame((state) => {
        if (ref.current) {
            ref.current.rotation.y += 0.001;
            ref.current.scale.setScalar(isHovered ? 1.3 : 1);
        }
    });

    return (
        <group position={position}>
            <mesh
                ref={ref}
                onClick={() => onClick(data)}
                onPointerOver={() => setIsHovered(true)}
                onPointerOut={() => setIsHovered(false)}
            >
                <icosahedronGeometry args={[0.3, 1]} />
                <meshStandardMaterial
                    color={isHovered ? '#38bdf8' : '#e5e7eb'}
                    emissive={isHovered ? '#38bdf8' : '#000000'}
                    emissiveIntensity={isHovered ? 0.5 : 0}
                    metalness={0.8}
                    roughness={0.2}
                />
            </mesh>
            <Text
                position={[0, 0.5, 0]}
                fontSize={0.3}
                color="#e5e7eb"
                anchorX="center"
                anchorY="middle"
                visible={isHovered}
            >
                {data.name}
            </Text>
        </group>
    );
}

// The main 3D scene
function Scene({ onNodeClick }) {
    const allNodes = useMemo(() => portfolioData.flatMap(cat => cat.items), []);

    return (
        <Canvas camera={{ position: [0, 0, 12], fov: 50 }}>
            <ambientLight intensity={0.2} />
            <pointLight position={[10, 10, 10]} intensity={1.5} />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#38bdf8" />

            <Suspense fallback={null}>
                {allNodes.map((node, index) => (
                    <Node
                        key={node.name}
                        position={getSphericalPosition(index, allNodes.length)}
                        data={node}
                        onClick={onNodeClick}
                    />
                ))}
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade />
            </Suspense>

            <OrbitControls
                enableZoom={true}
                enablePan={false}
                autoRotate
                autoRotateSpeed={0.3}
                minDistance={8}
                maxDistance={20}
            />
        </Canvas>
    );
}

// The 2D overlay panel for information
function InfoPanel({ node, onClose }) {
    const props = useSpring({
        opacity: node ? 1 : 0,
        transform: node ? 'translateY(0%)' : 'translateY(100%)',
        config: config.gentle,
    });

    if (!node) return null;

    return (
        <animated.div className="info-panel" style={props}>
            <button onClick={onClose} className="close-btn">&times;</button>
            <h3>{node.name}</h3>
            <p>{node.description}</p>
            {node.url && (
                <a href={node.url} target="_blank" rel="noopener noreferrer">
                    View Link
                </a>
            )}
        </animated.div>
    );
}


function App() {
    const [selectedNode, setSelectedNode] = useState(null);

    return (
        <div className="app-container">
            <div className="title-header">
                <h1>Your Name</h1>
                <h2>Latent Space Portfolio</h2>
            </div>
            <Scene onNodeClick={setSelectedNode} />
            <InfoPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
        </div>
    );
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);

export default App;