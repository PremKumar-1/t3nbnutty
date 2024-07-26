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
                    counts: {
                        jar: 0,
                        labeler: 0,
                        boxer: 0
                    }
                }));

                console.log("Shift Data:", shiftData); // Debug log

                shiftData.forEach(item => {
                    const timestamp = new Date(item.timestamp);
                    const minuteOfDay = timestamp.getHours() * 60 + timestamp.getMinutes();
                    const count = item.count;

                    const index = Math.floor(minuteOfDay / interval);
                    if (index >= 0 && index < dataPoints.length) {
                        if (item.source === "jar") {
                            dataPoints[index].counts.jar += count;
                        } else if (item.source === "labeler") {
                            dataPoints[index].counts.labeler += count;
                        } else if (item.source === "boxer") {
                            dataPoints[index].counts.boxer += count;
                        }
                    }
                });

                const labels = dataPoints.map(item => {
                    const hour = Math.floor(item.minute / 60);
                    const minute = item.minute % 60;
                    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                });

                const jarCounts = dataPoints.map(item => item.counts.jar);
                const labelerCounts = dataPoints.map(item => item.counts.labeler);
                const boxerCounts = dataPoints.map(item => item.counts.boxer);

                setLineChartData({
                    labels: labels,
                    datasets: [
                        {
                            label: 'JarCounts',
                            data: jarCounts,
                            borderColor: 'rgba(75,192,192,1)',
                            backgroundColor: 'rgba(75,192,192,0.4)',
                            fill: false,
                            tension: 0.1,
                        },
                        {
                            label: 'Labeler',
                            data: labelerCounts,
                            borderColor: 'rgba(255,159,64,1)',
                            backgroundColor: 'rgba(255,159,64,0.4)',
                            fill: false,
                            tension: 0.1,
                        },
                        {
                            label: 'Boxer',
                            data: boxerCounts,
                            borderColor: 'rgba(153,102,255,1)',
                            backgroundColor: 'rgba(153,102,255,0.4)',
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

    const calculateMaxYValue = (interval) => {
        switch(interval) {
            case 30:
                return 2500;
            case 60:
                return 5000;
            case 120:
                return 10000;
            default:
                return 2500;
        }
    };

    const options = {
        scales: {
            y: {
                beginAtZero: true,
                min: 0,
                max: calculateMaxYValue(interval),
                ticks: {
                    stepSize: calculateMaxYValue(interval) / 10,
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
