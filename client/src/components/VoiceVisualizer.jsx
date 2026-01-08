import React from 'react';

const VoiceVisualizer = () => {
    return (
        <div className="flex items-center justify-center space-x-1 h-12">
            {[...Array(5)].map((_, i) => (
                <div
                    key={i}
                    className="w-1 bg-blue-500 rounded-full animate-voice-pulse"
                    style={{
                        height: '20%',
                        animationDelay: `${i * 0.15}s`,
                        animationDuration: '1.2s'
                    }}
                ></div>
            ))}
        </div>
    );
};

export default VoiceVisualizer;
