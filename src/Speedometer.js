import React from 'react';
import GaugeChart from 'react-gauge-chart';
import './Speedometer.css';

const Speedometer = ({ jarsPerMinute }) => {
    return (
        <div className="speedometer">
            <GaugeChart 
                id="gauge-chart"
                nrOfLevels={100}
                percent={jarsPerMinute / 100}  // Adjusted for larger scale
                textColor="#000"
                formatTextValue={(value) => `${value.toFixed(2)} Jars/min`}
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
