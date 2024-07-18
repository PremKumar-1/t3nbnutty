import React, { useEffect, useState } from 'react';
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
    const [inventory, setInventory] = useState([]);
    const [jarsPerHour, setJarsPerHour] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [jarCounts, inventoryData] = await Promise.all([fetchAllJarCounts(), fetchInventory()]);

                processJarCounts(jarCounts);
                setInventory(inventoryData);

                setLoading(false);
            } catch (error) {
                console.error("Error fetching data:", error);
                setLoading(false);
            }
        };

        const fetchAllJarCounts = async () => {
            let jarCounts = [];
            let nextPageUrl = `/api/jarcounts/?date=${date}`;
            console.log("Starting pagination fetch");

            while (nextPageUrl) {
                try {
                    const response = await fetch(nextPageUrl);
                    if (!response.ok) {
                        throw new Error(`Network response was not ok for URL: ${nextPageUrl}`);
                    }
                    const data = await response.json();
                    jarCounts = jarCounts.concat(data.results);
                    nextPageUrl = data.next;
                    console.log(`Fetched page, nextPageUrl: ${nextPageUrl}`);
                } catch (error) {
                    console.error(`Error fetching page: ${nextPageUrl}`, error);
                    break; // Exit loop on error
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

        const processJarCounts = (jarCounts) => {
            const shift1 = jarCounts.filter(count => count.shift === 'day').length;
            const shift2 = jarCounts.filter(count => count.shift === 'night').length;
            const total = shift1 + shift2;
            setJarCount({ shift1, shift2, total });

            const hoursWorked = 12;
            const jarsPerHour = total / hoursWorked;
            setJarsPerHour(isNaN(jarsPerHour) ? 0 : jarsPerHour);
        };

        fetchData();
    }, [date]);

    const handleDateChange = (e) => {
        setDate(e.target.value);
    };

    return (
        <div className="dashboard">
            <h1>Jar Counter Dashboard</h1>
            <label htmlFor="date-picker">Select Date:</label>
            <input 
                type="date" 
                id="date-picker" 
                value={date}
                onChange={handleDateChange} 
            />
            {loading ? (
                <p>Loading...</p>
            ) : (
                <>
                    <Speedometer value={jarsPerHour} />
                    <h2>Main Room Jar Count (RITA)</h2>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Shift</th>
                                <th>Completed</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Shift 1</td>
                                <td>{jarCount.shift1}</td>
                            </tr>
                            <tr>
                                <td>Shift 2</td>
                                <td>{jarCount.shift2}</td>
                            </tr>
                            <tr>
                                <td>Total</td>
                                <td>{jarCount.total}</td>
                            </tr>
                        </tbody>
                    </table>
                    <h2>Inventory</h2>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Quantity</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.isArray(inventory) && inventory.length > 0 ? (
                                inventory.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.product_name ? item.product_name.trim() : 'Unknown'}</td>
                                        <td>{item.quantity.toFixed(2)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="2">No inventory data available</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </>
            )}
        </div>
    );
};

export default Dashboard;
