import React, { useState, useEffect } from 'react';
import { Layout, Typography, Spin, Alert } from 'antd';
import { OrderBook } from './components/OrderBook/OrderBook';
import { useWebSocket } from './hooks/useWebSocket';
import { OrderBook as OrderBookType } from './types/order';

const { Header, Content } = Layout;
const { Title } = Typography;

function App() {
  const [orderBook, setOrderBook] = useState<OrderBookType>({
    buy_orders: [],
    sell_orders: []
  });

  const { isConnected, lastMessage } = useWebSocket('ws://localhost:8080/ws');

  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'order_book_update':
          setOrderBook(lastMessage.data);
          break;
        default:
          console.log('Unknown message type:', lastMessage.type);
      }
    }
  }, [lastMessage]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#001529', padding: '0 24px' }}>
        <Title level={3} style={{ color: 'white', margin: 0, lineHeight: '64px' }}>
          Trading Engine
        </Title>
      </Header>
      
      <Content style={{ padding: '24px' }}>
        {!isConnected && (
          <Alert
            message="WebSocket Disconnected"
            description="Trying to reconnect..."
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        
        <Spin spinning={!isConnected} tip="Connecting to server...">
          <OrderBook orderBook={orderBook} />
        </Spin>
      </Content>
    </Layout>
  );
}

export default App;
