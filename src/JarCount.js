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
    const [labelerPerMinute, setLabelerPerMinute] = useState(0);
    const [boxerPerMinute, setBoxerPerMinute] = useState(0);
    const [shiftData, setShiftData] = useState([]);
    const [error, setError] = useState(null);
    const [shift1Start, setShift1Start] = useState('08:00');
    const [shift2Start, setShift2Start] = useState('20:00');

    const fetchAllPages = async (url) => {
        let results = [];
        let nextPageUrl = url;
        while (nextPageUrl) {
            const response = await fetch(nextPageUrl);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            results = results.concat(data.results);
            nextPageUrl = data.next;
        }
        return results;
    };

    const fetchAllJarCounts = useCallback(async (selectedDate) => {
        const data = await fetchAllPages(`/api/jarcounts/?date=${selectedDate}`);
        return data.map(item => ({ ...item, source: "jar" }));
    }, []);

    const fetchLabelerCounts = useCallback(async (selectedDate) => {
        const data = await fetchAllPages(`/service/jarcounts/?date=${selectedDate}`);
        return data.map(item => ({ ...item, source: "labeler" }));
    }, []);

    const fetchBoxerCounts = useCallback(async (selectedDate) => {
        const data = await fetchAllPages(`/third/jarcounts/?date=${selectedDate}`);
        return data.map(item => ({ ...item, source: "boxer" }));
    }, []);

    const fetchInventory = async () => {
        const response = await fetch('/api/inventories/');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data.results;
    };

    const fetchShiftTimings = useCallback(async () => {
        try {
            const response = await fetch('/api/shifttimings/1/');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            setShift1Start(data.shift1_start.slice(0, 5));
            setShift2Start(data.shift2_start.slice(0, 5));

            // Set initial state based on current shift
            const now = new Date();
            const shift1Time = new Date(now);
            const [shift1Hour, shift1Minute] = data.shift1_start.split(':').map(Number);
            shift1Time.setHours(shift1Hour, shift1Minute, 0, 0);

            const shift2Time = new Date(now);
            const [shift2Hour, shift2Minute] = data.shift2_start.split(':').map(Number);
            shift2Time.setHours(shift2Hour, shift2Minute, 0, 0);

            if (now >= shift1Time && now < shift2Time) {
                setDate(getCurrentDate());
            } else {
                const previousDate = new Date(now);
                previousDate.setDate(now.getDate() - 1);
                setDate(previousDate.toISOString().split('T')[0]);
            }
        } catch (error) {
            console.error('Error fetching shift timings:', error);
        }
    }, []);

    const processJarCounts = useCallback((jarCounts, setCount, setPerMinute) => {
        const shift1Counts = [];
        const shift2Counts = [];

        jarCounts.forEach(count => {
            const timestamp = new Date(count.timestamp);

            const shift1StartTime = count.shift1_start ? count.shift1_start.split(':') : ['00', '00'];
            const shift2StartTime = count.shift2_start ? count.shift2_start.split(':') : ['00', '00'];

            const shift1StartHour = parseInt(shift1StartTime[0], 10);
            const shift1StartMinute = parseInt(shift1StartTime[1], 10);
            const shift2StartHour = parseInt(shift2StartTime[0], 10);
            const shift2StartMinute = parseInt(shift2StartTime[1], 10);

            const shift1StartDate = new Date(timestamp);
            shift1StartDate.setHours(shift1StartHour, shift1StartMinute, 0, 0);

            const shift2StartDate = new Date(timestamp);
            shift2StartDate.setHours(shift2StartHour, shift2StartMinute, 0, 0);

            if (timestamp >= shift1StartDate && timestamp < shift2StartDate) {
                shift1Counts.push(count);
            } else {
                shift2Counts.push(count);
            }
        });

        const shift1 = shift1Counts.reduce((acc, count) => acc + count.count, 0);
        const shift2 = shift2Counts.reduce((acc, count) => acc + count.count, 0);
        const total = shift1 + shift2;

        setCount({ shift1, shift2, total });

        const now = new Date();
        const previousMinuteTimestamp = new Date(now.getTime() - 60000);

        const previousMinuteCount = jarCounts.filter(count => {
            const timestamp = new Date(count.timestamp);
            return timestamp >= previousMinuteTimestamp && timestamp < now;
        }).reduce((acc, count) => acc + count.count, 0);

        setPerMinute(previousMinuteCount);
        setShiftData(jarCounts);
    }, []);

    const fetchData = useCallback(async () => {
        try {
            const [jarCounts, labelerCounts, boxerCounts, inventoryData] = await Promise.all([
                fetchAllJarCounts(date),
                fetchLabelerCounts(date),
                fetchBoxerCounts(date),
                fetchInventory()
            ]);

            console.log('Jar Counts:', jarCounts); // Debug log
            console.log('Labeler Counts:', labelerCounts); // Debug log
            console.log('Boxer Counts:', boxerCounts); // Debug log
            console.log('Inventory:', inventoryData); // Debug log

            processJarCounts(jarCounts, setJarCount, setJarsPerMinute, shift1Start, shift2Start);
            processJarCounts(labelerCounts, setLabelerCount, setLabelerPerMinute, shift1Start, shift2Start);
            processJarCounts(boxerCounts, setBoxerCount, setBoxerPerMinute, shift1Start, shift2Start);
            setInventory(inventoryData);
            setError(null); // Clear any previous errors

            // Combine all counts into shiftData with source info
            const allShiftData = [
                ...jarCounts,
                ...labelerCounts,
                ...boxerCounts
            ];
            setShiftData(allShiftData);

        } catch (error) {
            setError(error.message);
            console.error("Error fetching data:", error);
        }
    }, [date, fetchAllJarCounts, fetchBoxerCounts, fetchLabelerCounts, processJarCounts, shift1Start, shift2Start]);

    useEffect(() => {
        fetchShiftTimings(); // Fetch shift timings on component mount
    }, [fetchShiftTimings]);

    useEffect(() => {
        fetchData();

        const intervalId = setInterval(fetchData, 5000);

        return () => clearInterval(intervalId);
    }, [date, fetchData]);

    const handleDateChange = (e) => {
        setDate(e.target.value);
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
            <div className="speedometers">
                <Speedometer jarsPerMinute={jarsPerMinute} title="Capper" />
                <Speedometer jarsPerMinute={labelerPerMinute} title="Labeler" />
                <Speedometer jarsPerMinute={boxerPerMinute} title="Boxer" />
            </div>
            <label htmlFor="date-picker">Select Date:</label>
            <input 
                type="date" 
                id="date-picker" 
                value={date}
                onChange={handleDateChange} 
            />
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
                                <th><h2>CtoL</h2></th>
                                <th><h2>LtoB</h2></th>
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
