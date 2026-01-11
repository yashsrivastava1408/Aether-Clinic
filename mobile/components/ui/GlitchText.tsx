import React, { useEffect, useState } from 'react';
import { View, Text, TextStyle, StyleProp } from 'react-native';

interface GlitchTextProps {
    text: string;
    style?: StyleProp<TextStyle>;
    color: string;
}

export const GlitchText = ({ text, style, color }: GlitchTextProps) => {
    const [glitchFactor, setGlitchFactor] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            // 5% chance to glitch every 100ms
            if (Math.random() > 0.95) {
                setGlitchFactor(Math.random() * 5);
                setTimeout(() => setGlitchFactor(0), 100);
            }
        }, 100);
        return () => clearInterval(interval);
    }, []);

    return (
        <View>
            <Text style={[style, { color: color }]}>{text}</Text>
            {glitchFactor > 0 && (
                <Text
                    style={[
                        style,
                        {
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            color: 'red',
                            opacity: 0.5,
                            transform: [{ translateX: glitchFactor }, { translateY: -glitchFactor / 2 }],
                        },
                    ]}
                >
                    {text}
                </Text>
            )}
            {glitchFactor > 0 && (
                <Text
                    style={[
                        style,
                        {
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            color: 'cyan',
                            opacity: 0.5,
                            transform: [{ translateX: -glitchFactor }, { translateY: glitchFactor / 2 }],
                        },
                    ]}
                >
                    {text}
                </Text>
            )}
        </View>
    );
};
