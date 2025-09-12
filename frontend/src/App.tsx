/**
 * Main Trading Engine Application Component
 * 
 * This component serves as the root of the trading engine interface,
 * managing state for order book data, trade history, and order submission.
 * It fetches data from the backend API and handles real-time WebSocket connections.
 */

import { useState, useEffect } from 'react';
import { Layout, Typography, Space, message, Spin, Alert } from 'antd';
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
        <Space />
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
    </Layout>
  );
}

export default App;