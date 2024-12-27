"use client"
import { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { firestoreDb } from '../../Database/firebaseConfig';
import { Table, Input, Space, Button } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import Highlighter from 'react-highlight-words';

const Statistic = () => {
    const [data, setData] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState('');
    const searchInput = useRef(null);

    useEffect(() => {
        const collectionRef = collection(firestoreDb, "SensorData");
        const q = query(collectionRef);
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newData = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    key: doc.id,
                    ...data,
                    fanState: Boolean(data.fanState),
                    ledState: Boolean(data.ledState),
                    mistState: Boolean(data.mistState),
                    servoEnabled: Boolean(data.servoEnabled),
                    timestamp: data.timestamp?.toDate().toLocaleString(),
                };
            });
            setData(newData);
        });
    
        return () => unsubscribe();
    }, []);

    const handleSearch = (selectedKeys, confirm, dataIndex) => {
        confirm();
        setSearchText(selectedKeys[0]);
        setSearchedColumn(dataIndex);
    };

    const handleReset = (clearFilters) => {
        clearFilters();
        setSearchText('');
    };

    const getColumnSearchProps = (dataIndex, title) => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
            <div style={{ padding: 8 }}>
                <Input
                    ref={searchInput}
                    placeholder={`Tìm ${title}`}
                    value={selectedKeys[0]}
                    onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
                    style={{ width: 188, marginBottom: 8, display: 'block' }}
                />
                <Space>
                    <Button
                        type="primary"
                        onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
                        icon={<SearchOutlined />}
                        size="small"
                        style={{ width: 90 }}
                    >
                        Tìm
                    </Button>
                    <Button
                        onClick={() => handleReset(clearFilters)}
                        size="small"
                        style={{ width: 90 }}
                    >
                        Reset
                    </Button>
                </Space>
            </div>
        ),
        filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
        onFilter: (value, record) => {
            if (record[dataIndex] === null || record[dataIndex] === undefined) {
                return false;
            }
            if (typeof record[dataIndex] === 'boolean') {
                const displayValue = record[dataIndex] ? 'Bật' : 'Tắt';
                return displayValue.toLowerCase().includes(value.toLowerCase());
            }
            return record[dataIndex].toString().toLowerCase().includes(value.toLowerCase());
        },
        onFilterDropdownVisibleChange: visible => {
            if (visible) {
                setTimeout(() => searchInput.current?.select(), 100);
            }
        },
        render: text => 
            searchedColumn === dataIndex ? (
                <Highlighter
                    highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
                    searchWords={[searchText]}
                    autoEscape
                    textToHighlight={text ? text.toString() : ''}
                />
            ) : (
                text
            ),
    });

    const getColumnSearchPropsForBoolean = (dataIndex, title) => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
            <div style={{ padding: 8 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Button
                        style={{ width: '100%' }}
                        onClick={() => {
                            setSelectedKeys(['true']);
                            confirm();
                        }}
                    >
                        Bật
                    </Button>
                    <Button
                        style={{ width: '100%' }}
                        onClick={() => {
                            setSelectedKeys(['false']);
                            confirm();
                        }}
                    >
                        Tắt
                    </Button>
                    <Button
                        onClick={() => {
                            clearFilters();
                            confirm();
                        }}
                        style={{ width: '100%' }}
                    >
                        Reset
                    </Button>
                </Space>
            </div>
        ),
        filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
        onFilter: (value, record) => {
            // Kiểm tra nếu giá trị không tồn tại
            if (record[dataIndex] === undefined || record[dataIndex] === null) {
                return false;
            }
            
            // Chuyển đổi value thành boolean
            const filterValue = value.toLowerCase() === 'true';
            const recordValue = Boolean(record[dataIndex]);
            
            // So sánh giá trị
            return recordValue === filterValue;
        }
    });


    const columns = [
        {
            title: 'Thời gian',
            dataIndex: 'timestamp',
            key: 'timestamp',
            ...getColumnSearchProps('timestamp', 'thời gian'),
        },
        {
            title: 'Quạt',
            dataIndex: 'fanState',
            key: 'fanState',
            render: (value) => (value === true ? 'Bật' : 'Tắt'),
            ...getColumnSearchPropsForBoolean('fanState', 'trạng thái quạt'),
        },
        {
            title: 'Đèn LED',
            dataIndex: 'ledState',
            key: 'ledState',
            render: (value) => (value === true ? 'Bật' : 'Tắt'),
            ...getColumnSearchPropsForBoolean('ledState', 'trạng thái đèn'),
        },
        {
            title: 'Phun sương',
            dataIndex: 'mistState',
            key: 'mistState',
            render: (value) => (value === true ? 'Bật' : 'Tắt'),
            ...getColumnSearchPropsForBoolean('mistState', 'trạng thái phun sương'),
        },
        {
            title: 'Servo',
            dataIndex: 'servoEnabled',
            key: 'servoEnabled',
            render: (value) => (value === true ? 'Bật' : 'Tắt'),
            ...getColumnSearchPropsForBoolean('servoEnabled', 'trạng thái servo'),
        },
        {
            title: 'Nhiệt độ (°C)',
            dataIndex: 'temperature',
            key: 'temperature',
            ...getColumnSearchProps('temperature', 'nhiệt độ'),
        },
        {
            title: 'Độ ẩm (%)',
            dataIndex: 'humidity',
            key: 'humidity',
            ...getColumnSearchProps('humidity', 'độ ẩm'),
        },
        {
            title: 'Ánh sáng (lux)',
            dataIndex: 'lux',
            key: 'lux',
            render: (value) => value?.toFixed(2),
            ...getColumnSearchProps('lux', 'ánh sáng'),
        },
    ];

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Thống kê dữ liệu</h1>
            <Table 
                columns={columns} 
                dataSource={data}
                pagination={{ pageSize: 10 }}
                scroll={{ x: true }}
            />
        </div>
    );
};

export default Statistic;