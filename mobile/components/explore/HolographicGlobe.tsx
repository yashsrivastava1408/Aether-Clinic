import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Text } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

const GLOBE_SIZE = 200;
const RADIUS = 90;
const DOT_COUNT = 80;

interface Point3D {
    x: number;
    y: number;
    z: number;
    lat: number;
    lon: number;
}

export const HolographicGlobe = () => {
    const [points, setPoints] = useState<Point3D[]>([]);
    const rotation = useRef(new Animated.Value(0)).current;
    const [isScanning, setIsScanning] = useState(false);
    const [status, setStatus] = useState("SYSTEM IDLE");

    // Initialize sphere points
    useEffect(() => {
        const pts: Point3D[] = [];
        const goldenRatio = (1 + Math.sqrt(5)) / 2;

        for (let i = 0; i < DOT_COUNT; i++) {
            const theta = 2 * Math.PI * i / goldenRatio;
            const phi = Math.acos(1 - 2 * (i + 0.5) / DOT_COUNT);

            pts.push({
                x: RADIUS * Math.sin(phi) * Math.cos(theta),
                y: RADIUS * Math.sin(phi) * Math.sin(theta),
                z: RADIUS * Math.cos(phi),
                lat: theta,
                lon: phi
            });
        }
        setPoints(pts);
    }, []);

    // Animation Loop
    const [frame, setFrame] = useState(0);
    useEffect(() => {
        let angle = 0;
        const interval = setInterval(() => {
            angle += isScanning ? 0.15 : 0.01;
            setFrame(angle);
        }, 16);
        return () => clearInterval(interval);
    }, [isScanning]);

    const handleScan = () => {
        setIsScanning(true);
        setStatus("SCANNING REGION...");
        setTimeout(() => {
            setIsScanning(false);
            setStatus("SECTOR SECURE");
        }, 2000);
    };

    // Projection Logic
    const renderPoints = () => {
        return points.map((pt, i) => {
            // Rotate around Y axis
            const rotatedX = pt.x * Math.cos(frame) - pt.z * Math.sin(frame);
            const rotatedZ = pt.x * Math.sin(frame) + pt.z * Math.cos(frame);

            // Simple perspective projection
            const scale = (300 + rotatedZ) / 300;
            const alpha = (rotatedZ + RADIUS) / (2 * RADIUS); // Opacity based on depth

            return (
                <Circle
                    key={i}
                    cx={rotatedX + GLOBE_SIZE / 2}
                    cy={pt.y + GLOBE_SIZE / 2}
                    r={isScanning ? 2.5 * scale : 2 * scale}
                    fill={isScanning ? '#ef4444' : '#10b981'}
                    opacity={alpha}
                />
            );
        });
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity activeOpacity={1} onPress={handleScan} style={styles.globeWrapper}>
                <Svg height={GLOBE_SIZE} width={GLOBE_SIZE}>
                    {/* Center Axis */}
                    <Line
                        x1={GLOBE_SIZE / 2} y1={20}
                        x2={GLOBE_SIZE / 2} y2={GLOBE_SIZE - 20}
                        stroke={isScanning ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.2)'}
                        strokeWidth="1"
                    />
                    {renderPoints()}
                </Svg>

                {/* Holograph Ring */}
                <View style={[styles.ring, isScanning && styles.ringAlert]} pointerEvents="none" />
            </TouchableOpacity>

            <Text style={[styles.statusText, isScanning && { color: '#ef4444' }]}>{status}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 20,
    },
    globeWrapper: {
        width: GLOBE_SIZE,
        height: GLOBE_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ring: {
        position: 'absolute',
        width: GLOBE_SIZE + 40,
        height: 40,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
        bottom: -10,
        zIndex: -1,
        transform: [{ rotateX: '70deg' }]
    },
    ringAlert: {
        borderColor: 'rgba(239, 68, 68, 0.5)',
        shadowColor: '#ef4444',
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    statusText: {
        marginTop: 20,
        color: '#10b981',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
});
