import React, { useState, useEffect } from 'react';
import './Admin.css';

const Admin = () => {
    const [shift1Start, setShift1Start] = useState('08:00');
    const [shift2Start, setShift2Start] = useState('20:00');
    const [code, setCode] = useState('');

    useEffect(() => {
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

        fetchShiftTimings();
    }, []);

    const handleShiftTimingChange = async () => {
        if (code !== '052224') {
            alert("Invalid code");
            return;
        }

        try {
            await fetch('/api/shifttimings/1/', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shift1_start: shift1Start, shift2_start: shift2Start })
            });
            alert("Shift timings updated successfully!");
        } catch (error) {
            alert("Failed to update shift timings: " + error.message);
        }
    };

    return (
        <div className="admin">
            <h2>Admin Panel - Update Shift Timings</h2>
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
                <label>
                    Code:
                    <input 
                        type="text" 
                        value={code} 
                        onChange={(e) => setCode(e.target.value)} 
                    />
                </label>
                <button onClick={handleShiftTimingChange}>Update Shift Timings</button>
            </div>
        </div>
    );
};

export default Admin;
