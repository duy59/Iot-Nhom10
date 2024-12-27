'use client'
import React, { useEffect, useState } from 'react';
import { database } from '../../../components/Database/firebaseConfig';
import { ref, onValue } from "firebase/database";
import { Container, Card, CardContent, Typography, Grid } from '@mui/material';
import OpacityIcon from '@mui/icons-material/Opacity';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [sensorData, setSensorData] = useState(null);
  const [dataHistory, setDataHistory] = useState({
    humidity: [],
    lux: [],
    temperature: [],
    timestamps: []
  });

  useEffect(() => {
    const sensorRef = ref(database, 'Sensor');
    onValue(sensorRef, (snapshot) => {
      const data = snapshot.val();
      setSensorData(data);
      
      setDataHistory(prev => {
        const maxDataPoints = 20;
        const newHumidity = [...prev.humidity, data.humidity].slice(-maxDataPoints);
        const newLux = [...prev.lux, data.lux].slice(-maxDataPoints);
        const newTemperature = [...prev.temperature, data.temperature].slice(-maxDataPoints);
        const newTimestamps = [...prev.timestamps, new Date().toLocaleTimeString()].slice(-maxDataPoints);

        return {
          humidity: newHumidity,
          lux: newLux,
          temperature: newTemperature,
          timestamps: newTimestamps
        };
      });
    });
  }, []);

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#333',
        bodyColor: '#666',
        borderColor: '#e1e1e1',
        borderWidth: 1,
        padding: 10,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            label += context.parsed.y.toFixed(1);
            return label;
          }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    },
    elements: {
      line: {
        tension: 0.4,
        borderWidth: 2
      },
      point: {
        radius: 0,
        hoverRadius: 6,
        hitRadius: 6
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 0,
          font: {
            size: 10
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(0,0,0,0.05)'
        }
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    }
  };
  
  const humidityChart = {
    labels: dataHistory.timestamps,
    datasets: [{
      label: 'Humidity (%)',
      data: dataHistory.humidity,
      borderColor: 'rgba(54, 162, 235, 1)',
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      fill: true,
    }]
  };

  const luxChart = {
    labels: dataHistory.timestamps,
    datasets: [{
      label: 'Light (lux)',
      data: dataHistory.lux,
      borderColor: 'rgba(255, 206, 86, 1)',
      backgroundColor: 'rgba(255, 206, 86, 0.2)',
      fill: true,
    }]
  };

  const temperatureChart = {
    labels: dataHistory.timestamps,
    datasets: [{
      label: 'Temperature (°C)',
      data: dataHistory.temperature,
      borderColor: 'rgba(255, 99, 132, 1)',
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      fill: true,
    }]
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Card 
        elevation={0}
        sx={{ 
          bgcolor: 'transparent',
          backgroundImage: 'linear-gradient(to right bottom, #ffffff, #f8f9ff)',
          borderRadius: 4,
          p: 3
        }}
      >
        <Typography 
          variant="h4" 
          gutterBottom 
          sx={{ 
            mb: 4,
            fontWeight: 600,
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textAlign: 'center'
          }}
        >
          Sensor Dashboard
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Card cho Humidity */}
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                height: '100%',
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 20px rgba(54, 162, 235, 0.2)'
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="h6"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 3,
                    color: 'rgb(54, 162, 235)'
                  }}
                >
                  <OpacityIcon />
                  Humidity
                </Typography>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 600,
                    color: 'rgb(54, 162, 235)',
                    textAlign: 'center'
                  }}
                >
                  {sensorData?.humidity}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Card cho Light */}
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                height: '100%',
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 20px rgba(255, 206, 86, 0.2)'
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="h6"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 3,
                    color: 'rgb(255, 206, 86)'
                  }}
                >
                  <WbSunnyIcon />
                  Light
                </Typography>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 600,
                    color: 'rgb(255, 206, 86)',
                    textAlign: 'center'
                  }}
                >
                  {sensorData?.lux.toFixed(2)} lx
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Card cho Temperature */}
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                height: '100%',
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 20px rgba(255, 99, 132, 0.2)'
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="h6"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 3,
                    color: 'rgb(255, 99, 132)'
                  }}
                >
                  <ThermostatIcon />
                  Temperature
                </Typography>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 600,
                    color: 'rgb(255, 99, 132)',
                    textAlign: 'center'
                  }}
                >
                  {sensorData?.temperature}°C
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Chart cho Humidity */}
          <Grid item xs={12}>
            <Card
              sx={{
                p: 3,
                height: '400px',
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 20px rgba(54, 162, 235, 0.2)'
                }
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: 'rgb(54, 162, 235)'
                }}
              >
                <OpacityIcon />
                Humidity History
              </Typography>
              <div style={{ height: 'calc(100% - 40px)' }}>
                <Line
                  options={commonOptions}
                  data={humidityChart}
                />
              </div>
            </Card>
          </Grid>

          {/* Chart cho Light */}
          <Grid item xs={12}>
            <Card
              sx={{
                p: 3,
                height: '400px',
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 20px rgba(255, 206, 86, 0.2)'
                }
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: 'rgb(255, 206, 86)'
                }}
              >
                <WbSunnyIcon />
                Light History
              </Typography>
              <div style={{ height: 'calc(100% - 40px)' }}>
                <Line
                  options={{
                    ...commonOptions,
                    scales: {
                      ...commonOptions.scales,
                      y: {
                        beginAtZero: true,
                        max: Math.max(...dataHistory.lux) * 1.2
                      }
                    }
                  }}
                  data={luxChart}
                />
              </div>
            </Card>
          </Grid>

          {/* Chart cho Temperature */}
          <Grid item xs={12}>
            <Card
              sx={{
                p: 3,
                height: '400px',
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 20px rgba(255, 99, 132, 0.2)'
                }
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: 'rgb(255, 99, 132)'
                }}
              >
                <ThermostatIcon />
                Temperature History
              </Typography>
              <div style={{ height: 'calc(100% - 40px)' }}>
                <Line
                  options={{
                    ...commonOptions,
                    scales: {
                      ...commonOptions.scales,
                      y: {
                        beginAtZero: false,
                        min: Math.min(...dataHistory.temperature) - 5,
                        max: Math.max(...dataHistory.temperature) + 5
                      }
                    }
                  }}
                  data={temperatureChart}
                />
              </div>
            </Card>
          </Grid>
        </Grid>
      </Card>
    </Container>
  );
};

export default Dashboard;
  