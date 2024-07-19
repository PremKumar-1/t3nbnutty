import React, { useEffect, useState } from 'react';
import GaugeChart from 'react-gauge-chart';
import './Speedometer.css';

const Speedometer = () => {
    const [jarsPerMinute, setJarsPerMinute] = useState(0);

    const fetchTodaysJarCount = async () => {
        const today = new Date().toISOString().split('T')[0];
        let jarCounts = [];
        let nextPageUrl = `/api/jarcounts/?date=${today}`;
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

        const shift1 = jarCounts.filter(count => count.shift === 'day').reduce((acc, count) => acc + count.count, 0);
        const shift2 = jarCounts.filter(count => count.shift === 'night').reduce((acc, count) => acc + count.count, 0);
        const total = shift1 + shift2;

        const now = new Date();
        const startOfShift = now.getHours() >= 8 && now.getHours() < 20 ? new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0) : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0, 0);
        const elapsedMinutes = Math.floor((now - startOfShift) / (1000 * 60));

        const currentHour = now.getHours();
        let jarsPerMinute = currentHour >= 8 && currentHour < 20 ? shift1 / elapsedMinutes : shift2 / elapsedMinutes;

        setJarsPerMinute(isNaN(jarsPerMinute) ? 0 : jarsPerMinute);
    };

    useEffect(() => {
        fetchTodaysJarCount();
        const intervalId = setInterval(fetchTodaysJarCount, 5000);
        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className="speedometer">
            <GaugeChart 
                id="gauge-chart"
                nrOfLevels={30}
                percent={jarsPerMinute / 4000}
                textColor="#000"
                formatTextValue={(value) => `${value.toFixed(2)} Jars/hr`}
                colors={['#00FF00', '#FFDD00', '#FF0000']}
                animate={true}
                animDelay={0}
                needleColor="#464A4F"
                needleBaseColor="#464A4F"
                arcWidth={0.3}
                cornerRadius={2}
                needleTransitionDuration={500}
                needleTransition="easeQuadInOut"
            />
        </div>
    );
};

export default Speedometer;
