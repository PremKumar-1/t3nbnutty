import React, { useEffect, useState, useCallback } from 'react';
import './JarCount.css';
import Speedometer from './Speedometer';
import ShiftSummary from './ShiftSummary';

const JarCount = () => {
    const getCurrentDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [date, setDate] = useState(getCurrentDate());
    const [jarCount, setJarCount] = useState({ shift1: 0, shift2: 0, total: 0 });
    const [labelerCount, setLabelerCount] = useState({ shift1: 0, shift2: 0, total: 0 });
    const [boxerCount, setBoxerCount] = useState({ shift1: 0, shift2: 0, total: 0 });
    const [inventory, setInventory] = useState([]);
    const [jarsPerMinute, setJarsPerMinute] = useState(0);
    const [shiftData, setShiftData] = useState([]);
    const [error, setError] = useState(null);
    const [shift1Start, setShift1Start] = useState('08:00');
    const [shift2Start, setShift2Start] = useState('20:00');

    const apiUrls = {
        shiftTimings: ['/api/shifttimings/1/', '/third/shift-timings/1/', '/service/shift-timings/1/']
    };

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
                throw error;
            }
        }

        return jarCounts;
    };

    const fetchLabelerCounts = async (selectedDate) => {
        const response = await fetch(`/service/jarcounts/?date=${selectedDate}`);
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data.results;
    };

    const fetchBoxerCounts = async (selectedDate) => {
        const response = await fetch(`/third/jarcounts/?date=${selectedDate}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data.results;
    };

    const fetchInventory = async () => {
        const response = await fetch('/api/inventories/');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data.results;
    };

    const fetchShiftTimings = async () => {
        try {
            const response = await fetch('/api/shifttimings/1/');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            setShift1Start(data.shift1_start.slice(0, 5));
            setShift2Start(data.shift2_start.slice(0, 5));
        } catch (error) {
            console.error('Error fetching shift timings:', error);
        }
    };

    const processJarCounts = useCallback((jarCounts, setJarCount, setJarsPerMinute, shift1Start, shift2Start) => {
        const shift1StartHour = parseInt(shift1Start.split(':')[0], 10);
        const shift2StartHour = parseInt(shift2Start.split(':')[0], 10);

        const shift1 = jarCounts.filter(count => new Date(count.timestamp).getHours() < shift1StartHour).reduce((acc, count) => acc + count.count, 0);
        const shift2 = jarCounts.filter(count => new Date(count.timestamp).getHours() >= shift2StartHour).reduce((acc, count) => acc + count.count, 0);
        const total = shift1 + shift2;
        setJarCount({ shift1, shift2, total });

        const now = new Date();
        const previousMinuteTimestamp = new Date(now.getTime() - 60000);

        const previousMinuteCount = jarCounts.filter(count => {
            const timestamp = new Date(count.timestamp);
            return timestamp >= previousMinuteTimestamp && timestamp < now;
        }).reduce((acc, count) => acc + count.count, 0);

        setJarsPerMinute(previousMinuteCount);
        setShiftData(jarCounts);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                await fetchShiftTimings(); // Fetch shift timings before fetching jar counts
                const [jarCounts, labelerCounts, boxerCounts, inventoryData] = await Promise.all([
                    fetchAllJarCounts(date),
                    fetchLabelerCounts(date),
                    fetchBoxerCounts(date),
                    fetchInventory()
                ]);

                processJarCounts(jarCounts, setJarCount, setJarsPerMinute, shift1Start, shift2Start);
                processJarCounts(labelerCounts, setLabelerCount, setJarsPerMinute, shift1Start, shift2Start);
                processJarCounts(boxerCounts, setBoxerCount, setJarsPerMinute, shift1Start, shift2Start);
                setInventory(inventoryData);
                setError(null); // Clear any previous errors
            } catch (error) {
                setError(error.message);
                console.error("Error fetching data:", error);
            }
        };

        fetchData();

        const intervalId = setInterval(fetchData, 5000);

        return () => clearInterval(intervalId);
    }, [date, processJarCounts]);

    const handleDateChange = (e) => {
        setDate(e.target.value);
    };

    const handleShiftTimingChange = async () => {
        try {
            await Promise.all(apiUrls.shiftTimings.map(url => 
                fetch(url, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ shift1_start: shift1Start, shift2_start: shift2Start })
                })
            ));
            alert("Shift timings updated successfully!");
        } catch (error) {
            alert("Failed to update shift timings: " + error.message);
        }
    };

    const calculateLoss = () => {
        return {
            Capper2Labeler: {
                shift1: labelerCount.shift1 - jarCount.shift1,
                shift2: labelerCount.shift2 - jarCount.shift2,
                total: labelerCount.total - jarCount.total
            },
            Labeler2Boxer: {
                shift1: boxerCount.shift1 - labelerCount.shift1,
                shift2: boxerCount.shift2 - labelerCount.shift2,
                total: boxerCount.total - labelerCount.total
            }
        };
    };

    const loss = calculateLoss();

    return (
        <div className="dashboard">
            <Speedometer jarsPerMinute={jarsPerMinute} />
            <label htmlFor="date-picker">Select Date:</label>
            <input 
                type="date" 
                id="date-picker" 
                value={date}
                onChange={handleDateChange} 
            />
            <div className="shift-timings">
                <label>
                    Shift 1 Start:
                    <input 
                        type="time" 
                        value={shift1Start} 
                        onChange={(e) => setShift1Start(e.target.value)} 
                    />
                </label>
                <label>
                    Shift 2 Start:
                    <input 
                        type="time" 
                        value={shift2Start} 
                        onChange={(e) => setShift2Start(e.target.value)} 
                    />
                </label>
                <button onClick={handleShiftTimingChange}>Update Shift Timings</button>
            </div>
            <div className="dashboard-content">
                <div className="tables">
                    <h1>Main Room Jar Count (RITA)</h1>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th><h2>Shift</h2></th>
                                <th><h2>Capper</h2></th>
                                <th><h2>Labeler</h2></th>
                                <th><h2>Boxer</h2></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="number-cell">Shift 1</td>
                                <td className="number-cell">{jarCount.shift1}</td>
                                <td className="number-cell">{labelerCount.shift1}</td>
                                <td className="number-cell">{boxerCount.shift1}</td>
                            </tr>
                            <tr>
                                <td className="number-cell">Shift 2</td>
                                <td className="number-cell">{jarCount.shift2}</td>
                                <td className="number-cell">{labelerCount.shift2}</td>
                                <td className="number-cell">{boxerCount.shift2}</td>
                            </tr>
                            <tr>
                                <td className="number-cell">Total</td>
                                <td className="number-cell">{jarCount.total}</td>
                                <td className="number-cell">{labelerCount.total}</td>
                                <td className="number-cell">{boxerCount.total}</td>
                            </tr>
                        </tbody>
                    </table>

                    <h1>Loss</h1>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th><h2>Shift</h2></th>
                                <th><h2>Capper2Labeler</h2></th>
                                <th><h2>Labeler2Boxer</h2></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="number-cell">Shift 1</td>
                                <td className="number-cell">{loss.Capper2Labeler.shift1}</td>
                                <td className="number-cell">{loss.Labeler2Boxer.shift1}</td>
                            </tr>
                            <tr>
                                <td className="number-cell">Shift 2</td>
                                <td className="number-cell">{loss.Capper2Labeler.shift2}</td>
                                <td className="number-cell">{loss.Labeler2Boxer.shift2}</td>
                            </tr>
                            <tr>
                                <td className="number-cell">Total</td>
                                <td className="number-cell">{loss.Capper2Labeler.total}</td>
                                <td className="number-cell">{loss.Labeler2Boxer.total}</td>
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
                <ShiftSummary selectedDate={date} shiftData={shiftData} />
            </div>
            {error && <p className="error-message">Error: {error}</p>}
        </div>
    );
};

export default JarCount;
