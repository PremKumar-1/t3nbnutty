import React from 'react';
import GaugeChart from 'react-gauge-chart';
import './Speedometer.css';

const Speedometer = ({ jarsPerMinute, title }) => {
    return (
        <div className="speedometer">
            <h3>{title}</h3>
            <GaugeChart 
                id="gauge-chart"
                nrOfLevels={30}
                percent={jarsPerMinute / 100}  // Adjusted for larger scale
                textColor="#e5e5e5"
                formatTextValue={(value) => `${value.toFixed(2)} Jars/min`}
                colors={['#00FF00', '#FFDD00', '#FF0000']}
                animate={true}
                animDelay={0}
                needleColor="#f0f2f5"
                needleBaseColor="#f0f2f5"
                arcWidth={0.3}
                cornerRadius={2}
                needleTransitionDuration={500}
                needleTransition="easeQuadInOut"
            />
        </div>
    );
};

export default Speedometer;
