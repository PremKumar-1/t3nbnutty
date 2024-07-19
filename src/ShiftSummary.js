import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import './ShiftSummary.css';

const ShiftSummary = ({ selectedDate }) => {
    const [shiftData, setShiftData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchShiftData = async () => {
            try {
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

                setShiftData(jarCounts);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching shift data:", error);
            }
        };

        fetchShiftData();
    }, [selectedDate]);

    const getCurrentShift = () => {
        const now = new Date();
        const hour = now.getHours();
        let shift = '';
        let shiftStartTime = '';

        if (hour >= 8 && hour < 20) {
            shift = 'day';
            shiftStartTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0);
        } else {
            shift = 'night';
            if (hour >= 20) {
                shiftStartTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0, 0);
            } else {
                shiftStartTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 20, 0, 0);
            }
        }

        const date = shiftStartTime.toISOString().split('T')[0];
        return { shift, shiftStartTime, date };
    };

    const calculateHourlyProductivity = () => {
        const currentShift = getCurrentShift();
        const hourlyProductivity = [];

        const currentTime = new Date();
        const elapsedTime = (currentTime - currentShift.shiftStartTime) / 1000 / 3600;

        for (let i = 0; i < Math.ceil(elapsedTime); i++) {
            const hourStart = new Date(currentShift.shiftStartTime);
            hourStart.setHours(hourStart.getHours() + i);
            const hourEnd = new Date(hourStart);
            hourEnd.setHours(hourEnd.getHours() + 1);

            const jarsThisHour = shiftData.reduce((acc, item) => {
                const itemTime = new Date(item.timestamp);
                if (itemTime >= hourStart && itemTime < hourEnd) {
                    return acc + item.count;
                }
                return acc;
            }, 0);

            hourlyProductivity.push(jarsThisHour);
        }

        return hourlyProductivity;
    };

    const hourlyProductivity = calculateHourlyProductivity();

    const lineChartData = {
        labels: hourlyProductivity.map((_, index) => `Hour ${index + 1}`),
        datasets: [
            {
                label: 'Jars per Hour',
                data: hourlyProductivity,
                fill: false,
                borderColor: 'rgba(75,192,192,1)',
                backgroundColor: 'rgba(75,192,192,0.4)',
                tension: 0.1,
            }
        ]
    };

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
            ) : (
                <Line data={lineChartData} options={options} />
            )}
        </div>
    );
};

export default ShiftSummary;
