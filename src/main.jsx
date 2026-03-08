import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

console.log('--- main.jsx start ---');
const container = document.getElementById('root')
console.log('--- container:', container);

if (container) {
    const root = createRoot(container)
    console.log('--- root created ---');
    root.render(<App />)
    console.log('--- render called ---');
} else {
    console.error('--- root container not found! ---');
}
