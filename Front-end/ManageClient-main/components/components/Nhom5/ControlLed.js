"use client";

import React, { useState, useEffect } from 'react';
import { Container, Typography, Switch, FormControlLabel, Box, Grid, TextField, Button } from '@mui/material';
import { ref, onValue, set } from 'firebase/database';
import { database } from '../../Database/firebaseConfig';

const DeviceControl = () => {
  const [devices, setDevices] = useState({
    FAN: false,
    LED: false,
    Mist: false,
    servo: {
      enabled: false,
      term: 300000, // Thời gian mặc định (ms)
    },
  });
  const [termInput, setTermInput] = useState('');
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [config, setConfig] = useState({
    temperatureThreshold: 37.5,
    humidityThreshold: 60,
    luxThreshold: 200,
  });
  const [sensorData, setSensorData] = useState({
    temperature: null,
    humidity: null,
    lux: null,
  });

  // Lấy trạng thái isAutoMode từ Realtime Database
  useEffect(() => {
    const isAutoModeRef = ref(database, 'autoMode/isAutoMode');
    const unsubscribe = onValue(isAutoModeRef, (snapshot) => {
      const data = snapshot.val();
      if (data !== null) {
        setIsAutoMode(data);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Lấy cấu hình config từ Realtime Database
  useEffect(() => {
    const configRef = ref(database, 'autoMode/config');
    const unsubscribe = onValue(configRef, (snapshot) => {
      const data = snapshot.val();
      if (data !== null) {
        setConfig(data);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Lấy dữ liệu cảm biến từ Firebase
  useEffect(() => {
    const sensorRef = ref(database, 'Sensor');
    const unsubscribeSensor = onValue(sensorRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSensorData({
          temperature: data.temperature,
          humidity: data.humidity,
          lux: data.lux,
        });
      }
    }, (error) => {
      console.error('Error fetching sensor data:', error);
    });

    return () => {
      unsubscribeSensor();
    };
  }, []);

  // Lắng nghe thay đổi trạng thái thiết bị từ Firebase
  useEffect(() => {
    const deviceRefs = {
      FAN: ref(database, 'devices/FAN/state'),
      LED: ref(database, 'devices/LED/state'),
      Mist: ref(database, 'devices/Mist/state'),
    };
    const servoRef = ref(database, 'servo');

    const unsubscribes = Object.keys(deviceRefs).map((device) =>
      onValue(deviceRefs[device], (snapshot) => {
        const data = snapshot.val();
        if (data !== null) {
          setDevices((prevDevices) => ({ ...prevDevices, [device]: data }));
        }
      })
    );

    const unsubscribeServo = onValue(servoRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setDevices((prevDevices) => ({
          ...prevDevices,
          servo: {
            enabled: data.enabled,
            term: data.term,
          },
        }));
      }
    });

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
      unsubscribeServo();
    };
  }, []);

  // Tự động điều khiển thiết bị dựa trên dữ liệu cảm biến và cấu hình
  useEffect(() => {
    if (sensorData && isAutoMode) {
      const { temperature, humidity, lux } = sensorData;

      // Control FAN
      if (temperature > config.temperatureThreshold  && !devices.FAN) {
        toggleDevice('FAN');
      } else if (temperature <= config.temperatureThreshold && devices.FAN) {
        toggleDevice('FAN');
      }


      // Control Heater
      if (temperature < config.temperatureThreshold && !devices.LED) {
        toggleDevice('LED');
      } else if (temperature >= config.temperatureThreshold && devices.LED) {
        toggleDevice('LED');
      }

      // Điều khiển Phun sương
      if (humidity < config.humidityThreshold && !devices.Mist) {
        toggleDevice('Mist');
      } else if (humidity >= config.humidityThreshold && devices.Mist) {
        toggleDevice('Mist');
      }
    }
  }, [sensorData, devices, isAutoMode, config]);

  const toggleDevice = async (device) => {
    try {
      if (device === 'servo') {
        const newEnabledState = !devices.servo.enabled;
        setDevices((prevDevices) => ({
          ...prevDevices,
          servo: { ...prevDevices.servo, enabled: newEnabledState },
        }));
        await set(ref(database, 'servo/enabled'), newEnabledState);
      } else {
        const newState = !devices[device];
        setDevices((prevDevices) => ({ ...prevDevices, [device]: newState }));
        await set(ref(database, `devices/${device}/state`), newState);
      }
    } catch (error) {
      console.error(`Error updating ${device} state: `, error);
    }
  };

  // Cập nhật isAutoMode lên Realtime Database
  const handleAutoModeToggle = async () => {
    const newMode = !isAutoMode;
    setIsAutoMode(newMode);
    try {
      await set(ref(database, 'autoMode/isAutoMode'), newMode);
    } catch (error) {
      console.error('Error updating isAutoMode:', error);
    }
  };

  // Cập nhật config lên Realtime Database
  const saveConfig = async () => {
    try {
      await set(ref(database, 'autoMode/config'), config);
      alert('Cấu hình đã được lưu!');
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Có lỗi xảy ra khi lưu cấu hình!');
    }
  };

  const handleConfigChange = (key, value) => {
    setConfig((prevConfig) => ({
      ...prevConfig,
      [key]: value === '' ? '' : parseFloat(value),
    }));
  };

  const handleTermChange = async () => {
    try {
      const termValue = parseInt(termInput);
      if (isNaN(termValue) || termValue <= 0) {
        alert('Vui lòng nhập thời gian hợp lệ!');
        return;
      }
      const termInMilliseconds = termValue * 1000;
      await set(ref(database, 'servo/term'), termInMilliseconds);
      alert('Đã cập nhật thời gian servo!');
      setTermInput('');
    } catch (error) {
      console.error('Error updating servo term:', error);
      alert('Có lỗi xảy ra khi cập nhật thời gian!');
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom style={{ color: '#1976d2' }}>
        Điều khiển thiết bị
      </Typography>
      <Box mt={2} mb={2}>
        <FormControlLabel
          control={
            <Switch
              checked={isAutoMode}
              onChange={handleAutoModeToggle}
              color="primary"
            />
          }
          label="Chế độ tự động"
        />
      </Box>

      <Grid container spacing={3}>
        {/* Thiết bị */}
        {['FAN', 'LED', 'Mist'].map((device) => (
          <Grid item xs={12} sm={4} key={device}>
            <Box
              bgcolor={devices[device] ? '#e0f7fa' : '#ffebee'}
              p={2}
              borderRadius={2}
              textAlign="center"
              boxShadow={3}
            >
              <Typography variant="h6" gutterBottom>
                {device === 'FAN' ? 'Quạt' : device === 'LED' ? 'Đèn LED' : 'Phun sương'}
              </Typography>
              <Switch
                checked={devices[device]}
                onChange={() => toggleDevice(device)}
                color="primary"
                disabled={isAutoMode}
              />
            </Box>
          </Grid>
        ))}

        {/* Servo */}
        <Grid item xs={12} sm={4}>
          <Box
            bgcolor={devices.servo.enabled ? '#e0f7fa' : '#ffebee'}
            p={2}
            borderRadius={2}
            textAlign="center"
            boxShadow={3}
          >
            <Typography variant="h6" gutterBottom>
              Servo
            </Typography>
            <Switch
              checked={devices.servo.enabled}
              onChange={() => toggleDevice('servo')}
              color="primary"
            />
            <Box mt={2}>
              <TextField
                label="Thời gian (giây)"
                variant="outlined"
                fullWidth
                type="number"
                value={termInput}
                onChange={(e) => setTermInput(e.target.value)}
              />
              <Box mt={1} textAlign="center">
                <Button variant="contained" color="primary" onClick={handleTermChange}>
                  Cập nhật
                </Button>
              </Box>
              <Typography variant="body2" color="textSecondary" mt={1}>
                Thời gian hiện tại: {Math.round(devices.servo.term / 1000)} giây
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Cấu hình chế độ tự động */}
      <Box mt={4} p={2} bgcolor="#f5f5f5" borderRadius={2} boxShadow={1}>
        <Typography variant="h5" gutterBottom style={{ color: '#1976d2' }}>
          Cấu hình chế độ tự động
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Ngưỡng nhiệt độ (°C)"
              variant="outlined"
              fullWidth
              type="number"
              value={config.temperatureThreshold}
              onChange={(e) => handleConfigChange('temperatureThreshold', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Ngưỡng độ ẩm (%)"
              variant="outlined"
              fullWidth
              type="number"
              value={config.humidityThreshold}
              onChange={(e) => handleConfigChange('humidityThreshold', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Ngưỡng ánh sáng (lux)"
              variant="outlined"
              fullWidth
              type="number"
              value={config.luxThreshold}
              onChange={(e) => handleConfigChange('luxThreshold', e.target.value)}
            />
          </Grid>
        </Grid>
        <Box mt={2} textAlign="center">
          <Button variant="contained" color="primary" onClick={saveConfig}>
            Lưu cấu hình
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default DeviceControl;