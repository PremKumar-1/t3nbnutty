import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import './ShiftSummary.css';

const ShiftSummary = ({ selectedDate, shiftData }) => {
    const [lineChartData, setLineChartData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [interval, setInterval] = useState(30); // Default interval in minutes

    useEffect(() => {
        const processShiftData = () => {
            try {
                const dataPoints = Array.from({ length: 24 * (60 / interval) }, (_, i) => ({
                    minute: i * interval,
                    count: 0
                }));

                shiftData.forEach(item => {
                    const timestamp = new Date(item.timestamp);
                    const minuteOfDay = timestamp.getHours() * 60 + timestamp.getMinutes();
                    const count = item.count;

                    const index = Math.floor(minuteOfDay / interval);
                    if (index >= 0 && index < dataPoints.length) {
                        dataPoints[index].count += count;
                    }
                });

                const labels = dataPoints.map(item => {
                    const hour = Math.floor(item.minute / 60);
                    const minute = item.minute % 60;
                    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                });

                const counts = dataPoints.map(item => item.count);

                setLineChartData({
                    labels: labels,
                    datasets: [
                        {
                            label: 'Daily Data',
                            data: counts,
                            borderColor: 'rgba(75,192,192,1)',
                            backgroundColor: 'rgba(75,192,192,0.4)',
                            fill: false,
                            tension: 0.1,
                        }
                    ]
                });

                setLoading(false);
                setError(null);
            } catch (error) {
                setError("Error processing shift data");
                setLoading(false);
                console.error("Error processing shift data:", error);
            }
        };

        processShiftData();
    }, [shiftData, interval]);

    const options = {
        scales: {
            y: {
                beginAtZero: true,
                min: 0,
                max: 1500,
                ticks: {
                    stepSize: 150,
                    callback: function(value) {
                        return value.toFixed(0);
                    }
                }
            }
        }
    };

    return (
        <div className="shift-summary">
            <h1>Daily Data Productivity</h1>
            <div className="interval-selector">
                <label htmlFor="interval">Select Interval:</label>
                <select id="interval" value={interval} onChange={e => setInterval(Number(e.target.value))}>
                    <option value={30}>30 Minutes</option>
                    <option value={60}>1 Hour</option>
                    <option value={120}>2 Hours</option>
                </select>
            </div>
            {loading ? (
                <p>Loading...</p>
            ) : error ? (
                <p className="error-message">{error}</p>
            ) : (
                <Line data={lineChartData} options={options} />
            )}
        </div>
    );
};

export default ShiftSummary;
