"use client";

import React, { useEffect, useState } from 'react';
import { database } from '../../../components/Database/firebaseConfig';
import { ref, onValue } from "firebase/database";
import { Container, Typography, Box } from '@mui/material';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import axios from 'axios';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

const categorizeData = (temperature, humidity, lux) => {
    console.log('Temperature:', temperature, 'Humidity:', humidity, 'Lux:', lux); // Debugging log
    let status = 'Unknown';

    // Categorize temperature and humidity
    if ((temperature >= 37.0 && temperature <= 38.0) && ((humidity >= 50 && humidity <= 55) || (humidity >= 65 && humidity <= 75))) {
        status = 'Good';
    } else if ((temperature >= 36.5 && temperature < 37.0) || (temperature > 38.0 && temperature <= 38.5) || (humidity >= 45 && humidity < 50) || (humidity > 55 && humidity < 60) || (humidity >= 60 && humidity < 65) || (humidity > 75 && humidity <= 80)) {
        status = 'Alert';
    } else if (temperature < 36.5 || temperature > 38.5 || humidity < 45 || humidity > 80) {
        status = 'Bad';
    }

    // Categorize light intensity (lux)
    if (lux >= 200 && lux <= 500) {
        status = status === 'Unknown' ? 'Good' : status;
    } else if (lux >= 100 && lux < 200 || lux > 500 && lux <= 700) {
        status = status === 'Unknown' ? 'Alert' : status;
    } else if (lux < 100 || lux > 700) {
        status = 'Bad';
    }

    return status;
};

const controlDevices = (temperature, humidity, lux) => {
    let message = '';

    // Control logic based on sensor data
    if (temperature < 37.0) {
        axios.put('https://iotnhom5-8942c-default-rtdb.asia-southeast1.firebasedatabase.app/LED/LED1.json', { state: true });
        message += 'Increase temperature. ';
    } else {
        axios.put('https://iotnhom5-8942c-default-rtdb.asia-southeast1.firebasedatabase.app/LED/LED1.json', { state: false });
    }

    if (humidity < 50) {
        axios.put('https://iotnhom5-8942c-default-rtdb.asia-southeast1.firebasedatabase.app/LED/LED2.json', { state: true });
        message += 'Increase humidity. ';
    } else {
        axios.put('https://iotnhom5-8942c-default-rtdb.asia-southeast1.firebasedatabase.app/LED/LED2.json', { state: false });
    }

    if (lux < 200) {
        axios.put('https://iotnhom5-8942c-default-rtdb.asia-southeast1.firebasedatabase.app/LED/LED3.json', { state: true });
        message += 'Increase light intensity. ';
    } else {
        axios.put('https://iotnhom5-8942c-default-rtdb.asia-southeast1.firebasedatabase.app/LED/LED3.json', { state: false });
    }

    return message || 'All conditions are optimal.';
};

const Bieudo = () => {
    const [data, setData] = useState({
        temperature: 'N/A',
        humidity: 'N/A',
        lux: 'N/A',
        status: 'Unknown'
    });
    const [dataHistory, setDataHistory] = useState({
        temperature: [],
        humidity: [],
        lux: [],
        timestamps: []
    });
    const [statusCounts, setStatusCounts] = useState({
        Good: 0,
        Alert: 0,
        Bad: 0,
        Unknown: 0
    });
    const [controlMessage, setControlMessage] = useState('');

    useEffect(() => {
        const sensorRef = ref(database, 'Sensor');
        onValue(sensorRef, (snapshot) => {
            const fetchedData = snapshot.val();
            console.log('Fetched Data:', fetchedData); // Debugging log
            if (fetchedData) {
                const latestData = fetchedData[Object.keys(fetchedData).pop()];
                const status = categorizeData(fetchedData.temperature, fetchedData.humidity, fetchedData.lux);
                setData({
                    temperature: fetchedData.temperature,
                    humidity: fetchedData.humidity,
                    lux: fetchedData.lux,
                    status: status
                });
                setDataHistory(prevHistory => ({
                    temperature: [...prevHistory.temperature, fetchedData.temperature],
                    humidity: [...prevHistory.humidity, fetchedData.humidity],
                    lux: [...prevHistory.lux, fetchedData.lux],
                    timestamps: [...prevHistory.timestamps, new Date().toLocaleTimeString()]
                }));
                setStatusCounts(prevCounts => ({
                    ...prevCounts,
                    [status]: prevCounts[status] + 1
                }));

                // Control devices based on the latest data and get the control message
                const message = controlDevices(fetchedData.temperature, fetchedData.humidity, fetchedData.lux);
                setControlMessage(message);
            } else {
                console.log('No data available');
            }
        }, (error) => {
            console.error('Error fetching data:', error);
        });
    }, []);

    const pieData = {
        labels: ['Good', 'Alert', 'Bad', 'Unknown'],
        datasets: [
            {
                label: 'Status',
                data: [statusCounts.Good, statusCounts.Alert, statusCounts.Bad, statusCounts.Unknown],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(201, 203, 207, 0.6)'
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(201, 203, 207, 1)'
                ],
                borderWidth: 1,
            },
        ],
    };

    return (
        <Container>
            <Typography variant="h4" gutterBottom>
                Sensor Data
            </Typography>
            <div style={{ width: '500px', height: 'auto', margin: 'auto' }}>
                <Pie data={pieData} />
            </div>
            <Box mt={2}>
                <Typography variant="h6" color="textSecondary">
                    {controlMessage}
                </Typography>
            </Box>
        </Container>
    );
};

export default Bieudo;