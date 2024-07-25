import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import './ShiftSummary.css';

const ShiftSummary = ({ selectedDate, shiftData }) => {
    const [lineChartData, setLineChartData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const processShiftData = () => {
            try {
                const shift1Data = Array.from({ length: 48 }, (_, i) => ({ minute: 480 + i * 15, count: 0 }));
                const shift2Data = Array.from({ length: 48 }, (_, i) => ({ minute: 1200 + i * 15, count: 0 }));

                shiftData.forEach(item => {
                    const timestamp = new Date(item.timestamp);
                    const minuteOfDay = timestamp.getHours() * 60 + timestamp.getMinutes();
                    const count = item.count;
                    const shift1Start = new Date(timestamp);
                    const shift2Start = new Date(timestamp);

                    const [shift1Hour, shift1Minute] = item.shift1_start.split(':').map(Number);
                    const [shift2Hour, shift2Minute] = item.shift2_start.split(':').map(Number);

                    shift1Start.setHours(shift1Hour, shift1Minute, 0, 0);
                    shift2Start.setHours(shift2Hour, shift2Minute, 0, 0);

                    if (timestamp >= shift1Start && timestamp < shift2Start) {
                        const index = Math.floor((minuteOfDay - shift1Start.getHours() * 60 - shift1Start.getMinutes()) / 15);
                        if (index >= 0 && index < shift1Data.length) {
                            shift1Data[index].count += count;
                        }
                    } else {
                        const adjustedMinuteOfDay = minuteOfDay >= shift2Start.getHours() * 60 + shift2Start.getMinutes()
                            ? minuteOfDay
                            : minuteOfDay + 1440;
                        const index = Math.floor((adjustedMinuteOfDay - shift2Start.getHours() * 60 - shift2Start.getMinutes()) / 15);
                        if (index >= 0 && index < shift2Data.length) {
                            shift2Data[index].count += count;
                        }
                    }
                });

                const labels = Array.from({ length: 48 }, (_, i) => {
                    const hour = Math.floor((480 + i * 15) / 60);
                    const minute = (480 + i * 15) % 60;
                    return `${hour}:${minute.toString().padStart(2, '0')}`;
                });

                const shift1Counts = shift1Data.map(item => item.count);
                const shift2Counts = shift2Data.map(item => item.count);

                setLineChartData({
                    labels: labels,
                    datasets: [
                        {
                            label: 'Shift 1',
                            data: shift1Counts,
                            borderColor: 'rgba(75,192,192,1)',
                            backgroundColor: 'rgba(75,192,192,0.4)',
                            fill: false,
                            tension: 0.1,
                        },
                        {
                            label: 'Shift 2',
                            data: shift2Counts,
                            borderColor: 'rgba(192,75,75,1)',
                            backgroundColor: 'rgba(192,75,75,0.4)',
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
    }, [shiftData]);

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
            <h1>Current Shift Productivity</h1>
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
