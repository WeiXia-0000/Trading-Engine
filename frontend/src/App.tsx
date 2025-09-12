/**
 * Main Trading Engine Application Component
 * 
 * This component serves as the root of the trading engine interface,
 * managing state for order book data, trade history, and order submission.
 * It fetches data from the backend API and handles real-time WebSocket connections.
 */

import { useState, useEffect } from 'react';
import { Layout, Typography, Space, message, Spin, Alert, Button, Slider, Modal, Row, Col } from 'antd';
import './App.css';
import { OrderBookTable } from './components/OrderBook/OrderBookTable';
import { OrderBookTradeSummary } from './components/OrderBook/OrderBookTradeSummary';
import { OrderForm } from './components/OrderForm/OrderForm';
import { TradeHistory } from './components/TradeHistory/TradeHistory';
import { useWebSocket } from './hooks/useWebSocket';
import { OrderBook as OrderBookType } from './types/order';
import { Trade } from './types/trade';
import { apiService } from './services/api';

const { Header, Content } = Layout;
const { Title } = Typography;

function App() {
  // Core data state
  const [orderBook, setOrderBook] = useState<OrderBookType>({ buy_orders: [], sell_orders: [] });
  const [trades, setTrades] = useState<Trade[]>([]);
  
  // UI state management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showErrorAlert, setShowErrorAlert] = useState(true);
  
  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationInterval, setSimulationInterval] = useState<NodeJS.Timeout | null>(null);
  const [showSimulationConfig, setShowSimulationConfig] = useState(false);
  
  // Simulation configuration
  const [simulationConfig, setSimulationConfig] = useState({
    interval: 2000, // milliseconds
    smallOrderProbability: 70, // percentage
    smallOrderMin: 10,
    smallOrderMax: 210,
    largeOrderMin: 200,
    largeOrderMax: 1000,
    priceBase: 100,
    priceVariation: 5
  });

  // WebSocket connection for real-time updates
  const { isConnected, lastMessage, sendMessage } = useWebSocket('ws://localhost:8080/ws');

  // Fetch initial data from backend API on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        setApiError(null);
        
        // Fetch order book and trades data in parallel
        const [orderBookData, tradesData] = await Promise.all([
          apiService.getOrderBook(),
          apiService.getTrades()
        ]);
        
        setOrderBook(orderBookData);
        setTrades(tradesData);
        setApiError(null);
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
        setApiError(error instanceof Error ? error.message : 'Failed to load data');
        setShowErrorAlert(true);
        message.error('Failed to connect to trading engine. Please check if the backend is running.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Handle real-time WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'order_book_update':
          setOrderBook(lastMessage.data);
          break;
        case 'trade_update':
          setTrades(prev => [lastMessage.data, ...prev].slice(0, 100));
          break;
        case 'order_submitted':
          setIsSubmitting(false);
          message.success('Order submitted successfully!');
          break;
        case 'order_error':
          setIsSubmitting(false);
          message.error('Failed to submit order');
          break;
        default:
          console.log('Unknown message type:', lastMessage.type);
      }
    }
  }, [lastMessage]);

  // Handle order submission with fallback to HTTP API if WebSocket is disconnected
  const handleOrderSubmit = async (order: any) => {
    setIsSubmitting(true);
    try {
      if (isConnected) {
        // Use WebSocket for real-time order submission
        sendMessage({
          type: 'submit_order',
          data: order
        });
      } else {
        // Fallback to HTTP API when WebSocket is disconnected
        const response = await apiService.submitOrder(order);
        message.success(`Order submitted successfully! Order ID: ${response.order_id}`);
        
        // Refresh data after successful submission
        const [updatedOrderBook, updatedTrades] = await Promise.all([
          apiService.getOrderBook(),
          apiService.getTrades()
        ]);
        
        setOrderBook(updatedOrderBook);
        setTrades(updatedTrades);
      }
    } catch (error) {
      console.error('Failed to submit order:', error);
      message.error('Failed to submit order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate random order for simulation using current configuration
  const generateRandomOrder = () => {
    const types = ['BUY', 'SELL'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    // Use configured probability for small vs large orders
    const isSmallOrder = Math.random() < (simulationConfig.smallOrderProbability / 100);
    const quantity = isSmallOrder
      ? Math.floor(Math.random() * (simulationConfig.smallOrderMax - simulationConfig.smallOrderMin)) + simulationConfig.smallOrderMin
      : Math.floor(Math.random() * (simulationConfig.largeOrderMax - simulationConfig.largeOrderMin)) + simulationConfig.largeOrderMin;
    
    // Price range based on configuration
    const priceVariation = (Math.random() - 0.5) * simulationConfig.priceVariation * 2; // -variation to +variation
    const price = simulationConfig.priceBase + priceVariation;
    
    return {
      type,
      quantity,
      price: Math.round(price * 100) / 100, // Round to 2 decimal places
      client_id: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
    };
  };

  // Submit simulated order
  const submitSimulatedOrder = async () => {
    try {
      const order = generateRandomOrder();
      await apiService.submitOrder(order);
      
      // Refresh data after submission
      const [updatedOrderBook, updatedTrades] = await Promise.all([
        apiService.getOrderBook(),
        apiService.getTrades()
      ]);
      
      setOrderBook(updatedOrderBook);
      setTrades(updatedTrades);
    } catch (error) {
      console.error('Failed to submit simulated order:', error);
    }
  };

  // Start/stop simulation
  const toggleSimulation = () => {
    if (isSimulating) {
      // Stop simulation
      if (simulationInterval) {
        clearInterval(simulationInterval);
        setSimulationInterval(null);
      }
      setIsSimulating(false);
      message.info('Simulation stopped');
    } else {
      // Start simulation with configured interval
      const interval = setInterval(submitSimulatedOrder, simulationConfig.interval);
      setSimulationInterval(interval);
      setIsSimulating(true);
      message.success(`Simulation started - generating orders every ${simulationConfig.interval / 1000}s`);
    }
  };

  // Reset order book and trades
  const resetData = async () => {
    try {
      // Clear current data
      setOrderBook({ buy_orders: [], sell_orders: [] });
      setTrades([]);
      message.success('Data reset successfully');
    } catch (error) {
      console.error('Failed to reset data:', error);
      message.error('Failed to reset data');
    }
  };

  // Cleanup simulation on unmount
  useEffect(() => {
    return () => {
      if (simulationInterval) {
        clearInterval(simulationInterval);
      }
    };
  }, [simulationInterval]);


  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Application Header */}
      <Header style={{ 
        background: '#001529', 
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Title level={3} style={{ color: 'white', margin: 0 }}>
          Trading Engine
        </Title>
        <Space>
          {isSimulating && (
            <span style={{ color: '#52c41a', fontSize: '12px' }}>
              🔄 Generating orders every {simulationConfig.interval / 1000}s
            </span>
          )}
          <Button 
            size="small"
            onClick={() => setShowSimulationConfig(!showSimulationConfig)}
            disabled={isSimulating}
          >
            ⚙️ Config
          </Button>
          <Button 
            size="small"
            onClick={resetData}
            disabled={isSimulating}
          >
            🔄 Reset
          </Button>
          <Button 
            type={isSimulating ? "default" : "primary"}
            danger={isSimulating}
            onClick={toggleSimulation}
            disabled={!!apiError}
          >
            {isSimulating ? 'Stop Simulation' : 'Start Simulation'}
          </Button>
        </Space>
      </Header>
      
      <Layout>
        {/* Main Content Area with dynamic height based on error alert visibility */}
        <Content style={{ 
          padding: '16px', 
          background: '#f0f2f5', 
          height: (apiError && showErrorAlert) ? 'calc(100vh - 64px + 120px)' : 'calc(100vh - 64px)'
        }}>
          {isLoading ? (
            // Loading state with centered spinner
            <div style={{ 
              height: '100%', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center' 
            }}>
              <Spin size="large" tip="Loading trading data..." />
            </div>
          ) : (
            <div style={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {/* Backend connection error alert (dismissible) */}
              {apiError && showErrorAlert && (
                <Alert
                  message="Backend Connection Issue"
                  description={`${apiError}. The interface is running in offline mode with sample data.`}
                  type="warning"
                  showIcon
                  closable
                  onClose={() => setShowErrorAlert(false)}
                  style={{ marginBottom: '8px' }}
                />
              )}

              
              {/* Top section: Trading Activity & Market Overview (fixed height) */}
              <div style={{ flex: '0 0 240px', width: '100%' }}>
                <OrderBookTradeSummary orderBook={orderBook} trades={trades} hasData={!apiError} />
              </div>
              
              {/* Bottom section: Three-column layout (flexible height) */}
              <div style={{ 
                flex: '1 1 auto',
                display: 'flex',
                gap: '8px',
                minHeight: 0,
                width: '100%',
                alignItems: 'stretch'
              }}>
                {/* Left column: Trade History (3/10 width) */}
                <div style={{ 
                  flex: 3,
                  minWidth: 0,
                  height: '100%'
                }}>
                  <TradeHistory trades={trades} hasData={!apiError} />
                </div>
                
                {/* Center column: Order Book (5/10 width) */}
                <div style={{ 
                  flex: 5,
                  minWidth: 0,
                  height: '100%'
                }}>
                  <OrderBookTable orderBook={orderBook} hasData={!apiError} />
                </div>
                
                {/* Right column: Place Order Form (2/10 width) */}
                <div style={{ 
                  flex: 2,
                  minWidth: 0,
                  height: '100%'
                }}>
                  <OrderForm onSubmit={handleOrderSubmit} loading={isSubmitting} hasData={!apiError} />
                </div>
              </div>
            </div>
          )}
        </Content>
      </Layout>

      {/* Simulation Configuration Modal */}
      <Modal
        title="⚙️ Simulation Configuration"
        open={showSimulationConfig}
        onCancel={() => setShowSimulationConfig(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowSimulationConfig(false)}>
            Cancel
          </Button>,
          <Button key="ok" type="primary" onClick={() => setShowSimulationConfig(false)}>
            OK
          </Button>
        ]}
        width={800}
        style={{ top: 20 }}
      >
        <Row gutter={[24, 24]}>
          <Col span={12}>
            <div>
              <Typography.Text strong>Generation Speed:</Typography.Text>
              <div style={{ marginTop: 8 }}>
                <Slider
                  min={500}
                  max={10000}
                  step={500}
                  value={simulationConfig.interval}
                  onChange={(value) => setSimulationConfig(prev => ({ ...prev, interval: value }))}
                  marks={{
                    500: '0.5s',
                    2000: '2s',
                    5000: '5s',
                    10000: '10s'
                  }}
                />
                <div style={{ textAlign: 'center', marginTop: 4, fontSize: '12px', color: '#666' }}>
                  Current: {simulationConfig.interval / 1000}s
                </div>
              </div>
            </div>
          </Col>
          <Col span={12}>
            <div>
              <Typography.Text strong>Small Order Probability:</Typography.Text>
              <div style={{ marginTop: 8 }}>
                <Slider
                  min={0}
                  max={100}
                  value={simulationConfig.smallOrderProbability}
                  onChange={(value) => setSimulationConfig(prev => ({ ...prev, smallOrderProbability: value }))}
                  marks={{
                    0: '0%',
                    50: '50%',
                    100: '100%'
                  }}
                />
                <div style={{ textAlign: 'center', marginTop: 4, fontSize: '12px', color: '#666' }}>
                  Current: {simulationConfig.smallOrderProbability}%
                </div>
              </div>
            </div>
          </Col>
          <Col span={12}>
            <div>
              <Typography.Text strong>Small Orders Range:</Typography.Text>
              <div style={{ marginTop: 8 }}>
                <div style={{ marginBottom: 8 }}>
                  <Typography.Text type="secondary" style={{ fontSize: '12px' }}>Min: {simulationConfig.smallOrderMin}</Typography.Text>
                  <Slider
                    min={1}
                    max={500}
                    value={simulationConfig.smallOrderMin}
                    onChange={(value) => setSimulationConfig(prev => ({ ...prev, smallOrderMin: value }))}
                    style={{ marginTop: 4 }}
                  />
                </div>
                <div>
                  <Typography.Text type="secondary" style={{ fontSize: '12px' }}>Max: {simulationConfig.smallOrderMax}</Typography.Text>
                  <Slider
                    min={1}
                    max={500}
                    value={simulationConfig.smallOrderMax}
                    onChange={(value) => setSimulationConfig(prev => ({ ...prev, smallOrderMax: value }))}
                    style={{ marginTop: 4 }}
                  />
                </div>
              </div>
            </div>
          </Col>
          <Col span={12}>
            <div>
              <Typography.Text strong>Large Orders Range:</Typography.Text>
              <div style={{ marginTop: 8 }}>
                <div style={{ marginBottom: 8 }}>
                  <Typography.Text type="secondary" style={{ fontSize: '12px' }}>Min: {simulationConfig.largeOrderMin}</Typography.Text>
                  <Slider
                    min={100}
                    max={2000}
                    value={simulationConfig.largeOrderMin}
                    onChange={(value) => setSimulationConfig(prev => ({ ...prev, largeOrderMin: value }))}
                    style={{ marginTop: 4 }}
                  />
                </div>
                <div>
                  <Typography.Text type="secondary" style={{ fontSize: '12px' }}>Max: {simulationConfig.largeOrderMax}</Typography.Text>
                  <Slider
                    min={100}
                    max={2000}
                    value={simulationConfig.largeOrderMax}
                    onChange={(value) => setSimulationConfig(prev => ({ ...prev, largeOrderMax: value }))}
                    style={{ marginTop: 4 }}
                  />
                </div>
              </div>
            </div>
          </Col>
          <Col span={12}>
            <div>
              <Typography.Text strong>Base Price:</Typography.Text>
              <div style={{ marginTop: 8 }}>
                <Slider
                  min={50}
                  max={150}
                  value={simulationConfig.priceBase}
                  onChange={(value) => setSimulationConfig(prev => ({ ...prev, priceBase: value }))}
                  marks={{
                    50: '$50',
                    100: '$100',
                    150: '$150'
                  }}
                />
                <div style={{ textAlign: 'center', marginTop: 4, fontSize: '12px', color: '#666' }}>
                  Current: ${simulationConfig.priceBase}
                </div>
              </div>
            </div>
          </Col>
          <Col span={12}>
            <div>
              <Typography.Text strong>Price Variation:</Typography.Text>
              <div style={{ marginTop: 8 }}>
                <Slider
                  min={0.5}
                  max={20}
                  step={0.5}
                  value={simulationConfig.priceVariation}
                  onChange={(value) => setSimulationConfig(prev => ({ ...prev, priceVariation: value }))}
                  marks={{
                    0.5: '±0.5',
                    5: '±5',
                    10: '±10',
                    20: '±20'
                  }}
                />
                <div style={{ textAlign: 'center', marginTop: 4, fontSize: '12px', color: '#666' }}>
                  Current: ±{simulationConfig.priceVariation}
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Modal>
    </Layout>
  );
}

export default App;