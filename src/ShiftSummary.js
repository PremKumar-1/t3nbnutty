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
                const shift1Data = Array.from({ length: 12 }, (_, i) => ({ hour: 8 + i, count: 0 }));
                const shift2Data = Array.from({ length: 12 }, (_, i) => ({ hour: 20 + i, count: 0 }));

                shiftData.forEach(item => {
                    const timestamp = new Date(item.timestamp);
                    const hour = timestamp.getHours();
                    const count = item.count;

                    if (hour >= 8 && hour < 20) {
                        shift1Data[hour - 8].count += count;
                    } else {
                        shift2Data[(hour - 20 + 24) % 24].count += count;
                    }
                });

                const labels = Array.from({ length: 12 }, (_, i) => `Hour ${i + 1}`);
                const shift1Counts = shift1Data.map(item => item.count);
                const shift2Counts = shift2Data.map(item => item.count);

                setLineChartData({
                    labels: labels,
                    datasets: [
                        {
                            label: 'Shift 1 (8 AM - 8 PM)',
                            data: shift1Counts,
                            borderColor: 'rgba(75,192,192,1)',
                            backgroundColor: 'rgba(75,192,192,0.4)',
                            fill: false,
                            tension: 0.1,
                        },
                        {
                            label: 'Shift 2 (8 PM - 8 AM)',
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
                max: 5000,
                ticks: {
                    stepSize: 500,
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
