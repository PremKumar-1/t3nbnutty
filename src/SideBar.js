import React from 'react';
import { Link } from 'react-router-dom';
import './SideBar.css';

const Sidebar = () => {
    return (
        <div className="sidebar">
            <h3>Menu</h3>
            <ul>
                <li><Link to="/">Dashboard</Link></li>
                <li><Link to="/input">Input Inventory</Link></li>
            </ul>
        </div>
    );
};

export default Sidebar;
