import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import JarCount from './JarCount';
import InputInventory from './InputInventory';
import Admin from './Admin';
import Navbar from './Navbar';
import './App.css';

function App() {
    return (
        <Router>
            <Navbar />
            <div className="content">
                <Routes>
                    <Route path="/" element={<JarCount />} />
                    <Route path="/input" element={<InputInventory />} />
                    <Route path="/admin" element={<Admin />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
