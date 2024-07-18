import React from 'react';
import GaugeChart from 'react-gauge-chart';

const Speedometer = ({ value }) => {
    return (
        <div className="speedometer">
            <GaugeChart 
                id="gauge-chart"
                nrOfLevels={30}  // This defines the number of segments
                percent={value / 4000}  // Value normalized between 0 and 1
                textColor="#000"
                formatTextValue={(value) => `${value.toFixed(2)} Jars/hr`}
                colors={['#00FF00', '#FFDD00', '#FF0000']}  // Colors for different ranges
                animate={true}
                animDelay={0}
                needleColor="#464A4F"
                needleBaseColor="#464A4F"
                arcWidth={0.3}  // Adjust the width of the gauge arc
                cornerRadius={2}  // Round corners of the arc
                needleTransitionDuration={500}  // Duration for needle transition
                needleTransition="easeQuadInOut"  // Smooth easing for needle transition
            />
        </div>
    );
};

export default Speedometer;
