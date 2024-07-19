import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
    return (
        <div className="navbar">
            <h3>Menu</h3>
            <ul>
                <li><Link to="/">Dashboard</Link></li>
                <li><Link to="/input">Input Inventory</Link></li>
            </ul>
        </div>
    );
};

export default Navbar;
