import React, { useEffect, useState, useCallback } from 'react';
import './JarCount.css';
import Speedometer from './Speedometer';

const Dashboard = () => {
    const getCurrentDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [date, setDate] = useState(getCurrentDate());
    const [jarCount, setJarCount] = useState({ shift1: 0, shift2: 0, total: 0 });
    const [tempJarCount, setTempJarCount] = useState({ shift1: 0, shift2: 0, total: 0 });
    const [inventory, setInventory] = useState([]);
    const [tempInventory, setTempInventory] = useState([]);
    const [jarsPerMinute, setJarsPerMinute] = useState(0);

    const fetchAllJarCounts = async (selectedDate) => {
        let jarCounts = [];
        let nextPageUrl = `/api/jarcounts/?date=${selectedDate}`;
        const baseUrl = window.location.origin;

        while (nextPageUrl) {
            try {
                const response = await fetch(nextPageUrl.startsWith('http') ? nextPageUrl : baseUrl + nextPageUrl);
                if (!response.ok) {
                    throw new Error(`Network response was not ok for URL: ${nextPageUrl}`);
                }
                const data = await response.json();
                jarCounts = jarCounts.concat(data.results);
                nextPageUrl = data.next ? (data.next.startsWith('http') ? data.next : `${baseUrl}${data.next}`) : null;
            } catch (error) {
                console.error(`Error fetching page: ${nextPageUrl}`, error);
                break;
            }
        }

        return jarCounts;
    };

    const fetchInventory = async () => {
        const response = await fetch(`/api/inventories/`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data.results;
    };

    const calculateElapsedMinutes = () => {
        const now = new Date();
        const currentHour = now.getHours();
        let startOfShift;

        if (currentHour >= 8 && currentHour < 20) {
            // Day shift: 8 AM to 8 PM
            startOfShift = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0);
        } else {
            // Night shift: 8 PM to 8 AM next day
            if (currentHour >= 20) {
                startOfShift = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0, 0);
            } else {
                startOfShift = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 20, 0, 0);
            }
        }

        return Math.floor((now - startOfShift) / (1000 * 60)); // Convert milliseconds to minutes
    };

    const processJarCounts = useCallback((jarCounts, setJarCount, setJarsPerMinute) => {
        const shift1 = jarCounts.filter(count => count.shift === 'day').reduce((acc, count) => acc + count.count, 0);
        const shift2 = jarCounts.filter(count => count.shift === 'night').reduce((acc, count) => acc + count.count, 0);
        const total = shift1 + shift2;
        setJarCount({ shift1, shift2, total });

        const elapsedMinutes = calculateElapsedMinutes();
        const currentHour = new Date().getHours();
        let jarsPerMinute;

        if (currentHour >= 8 && currentHour < 20) {
            // Day shift: calculate jars per minute for shift1
            jarsPerMinute = shift1 / elapsedMinutes;
        } else {
            // Night shift: calculate jars per minute for shift2
            jarsPerMinute = shift2 / elapsedMinutes;
        }

        setJarsPerMinute(isNaN(jarsPerMinute) ? 0 : jarsPerMinute);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [jarCounts, inventoryData] = await Promise.all([
                    fetchAllJarCounts(date), 
                    fetchInventory()
                ]);

                processJarCounts(jarCounts, setTempJarCount, setJarsPerMinute);
                setTempInventory(inventoryData);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        // Initial fetch
        fetchData();

        // Set interval for continuous fetching
        const intervalId = setInterval(fetchData, 5000); // Fetch data every 5 seconds

        // Clear interval on component unmount
        return () => clearInterval(intervalId);
    }, [date, processJarCounts]);

    useEffect(() => {
        setJarCount(tempJarCount);
        setInventory(tempInventory);
    }, [tempJarCount, tempInventory]);

    const handleDateChange = (e) => {
        setDate(e.target.value);
    };

    return (
        <div className="dashboard">
            <label htmlFor="date-picker">Select Date:</label>
            <input 
                type="date" 
                id="date-picker" 
                value={date}
                onChange={handleDateChange} 
            />
            <Speedometer value={jarsPerMinute} />
            <h1>Main Room Jar Count (RITA)</h1>
            <table className="data-table">
                <thead>
                    <tr>
                        <th><h2>Shift</h2></th>
                        <th><h2>Completed</h2></th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="number-cell">Shift 1</td>
                        <td className="number-cell">{jarCount.shift1}</td>
                    </tr>
                    <tr>
                        <td className="number-cell">Shift 2</td>
                        <td className="number-cell">{jarCount.shift2}</td>
                    </tr>
                    <tr>
                        <td className="number-cell">Total</td>
                        <td className="number-cell">{jarCount.total}</td>
                    </tr>
                </tbody>
            </table>

            <h1>Inventory</h1>
            <table className="data-table">
                <thead>
                    <tr>
                        <th><h2>Item</h2></th>
                        <th><h2>Quantity</h2></th>
                    </tr>
                </thead>
                <tbody>
                    {Array.isArray(inventory) && inventory.length > 0 ? (
                        inventory.map((item, index) => (
                            <tr key={index}>
                                <td className="number-cell">{item.product_name ? item.product_name.trim() : 'Unknown'}</td>
                                <td className="number-cell">{item.quantity.toFixed(2)}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="2">No inventory data available</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default Dashboard;
