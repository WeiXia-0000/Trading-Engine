/**
 * Order Book Table Component
 * 
 * Displays buy and sell orders in a side-by-side layout with price, size, and total columns.
 * Features load more/show less functionality and real-time order book visualization.
 */

import React, { useState } from 'react';
import { Table, Typography, Space, Tag, Card, Button, Row, Col } from 'antd';
import { OrderBook as OrderBookType, OrderBookLevel } from '../../types/order';

const { Text } = Typography;

interface OrderBookTableProps {
  orderBook: OrderBookType;
  maxLevels?: number;
  hasData?: boolean;
}

export const OrderBookTable: React.FC<OrderBookTableProps> = ({ 
  orderBook, 
  maxLevels = 50,
  hasData = true
}) => {
  const [visibleLevels, setVisibleLevels] = useState(6);
  const buyColumns = [
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => (
        <Text style={{ color: '#52c41a', fontWeight: 'bold', fontSize: '14px' }}>
          ${price.toFixed(2)}
        </Text>
      ),
      sorter: (a: OrderBookLevel, b: OrderBookLevel) => b.price - a.price,
    },
    {
      title: 'Size',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity: number) => (
        <Text style={{ fontSize: '14px' }}>
          {quantity.toLocaleString()}
        </Text>
      ),
      sorter: (a: OrderBookLevel, b: OrderBookLevel) => b.quantity - a.quantity,
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (total: number) => (
        <Text style={{ fontSize: '14px', color: '#666' }}>
          {total.toLocaleString()}
        </Text>
      ),
    },
  ];

  const sellColumns = [
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => (
        <Text style={{ color: '#ff4d4f', fontWeight: 'bold', fontSize: '14px' }}>
          ${price.toFixed(2)}
        </Text>
      ),
      sorter: (a: OrderBookLevel, b: OrderBookLevel) => a.price - b.price,
    },
    {
      title: 'Size',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity: number) => (
        <Text style={{ fontSize: '14px' }}>
          {quantity.toLocaleString()}
        </Text>
      ),
      sorter: (a: OrderBookLevel, b: OrderBookLevel) => b.quantity - a.quantity,
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (total: number) => (
        <Text style={{ fontSize: '14px', color: '#666' }}>
          {total.toLocaleString()}
        </Text>
      ),
    },
  ];

  const calculateTotals = (levels: OrderBookLevel[]) => {
    let runningTotal = 0;
    return levels.map(level => {
      runningTotal += level.quantity;
      return { ...level, total: runningTotal };
    });
  };

  const buyLevels = calculateTotals(orderBook.buy_orders.slice(0, Math.min(visibleLevels, maxLevels)));
  const sellLevels = calculateTotals(orderBook.sell_orders.slice(0, Math.min(visibleLevels, maxLevels)));

  return (
    <Card 
      style={{ height: '100%' }} 
      bodyStyle={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 16 }}
    >
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text strong style={{ fontSize: '18px' }}>
          Order Book
          {!hasData && <Text type="secondary" style={{ fontSize: '12px', marginLeft: 8 }}>(No Data)</Text>}
        </Text>
        <Space>
          {hasData && visibleLevels < maxLevels && (
            <Button 
              size="small" 
              onClick={() => setVisibleLevels(Math.min(visibleLevels + 5, maxLevels))}
              type="primary"
            >
              Load More
            </Button>
          )}
          {hasData && visibleLevels > 6 && (
            <Button 
              size="small" 
              onClick={() => setVisibleLevels(6)}
            >
              Show Less
            </Button>
          )}
          <Tag color={hasData ? "blue" : "default"}>{hasData ? "Live" : "Offline"}</Tag>
        </Space>
      </Space>
      
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        <Row gutter={16}>
          <Col span={12}>
            <div style={{ marginBottom: '8px' }}>
              <Text strong style={{ color: '#ff4d4f', fontSize: '12px' }}>
                SELL ORDERS
              </Text>
              <Table
                columns={sellColumns}
                dataSource={sellLevels}
                pagination={false}
                size="small"
                rowKey="price"
                style={{ marginTop: 4 }}
                showHeader
                rowClassName={(_, index) => 
                  index === 0 ? 'best-ask-row' : ''
                }
              />
            </div>
          </Col>
          
          <Col span={12}>
            <div>
              <Text strong style={{ color: '#52c41a', fontSize: '12px' }}>
                BUY ORDERS
              </Text>
              <Table
                columns={buyColumns}
                dataSource={buyLevels}
                pagination={false}
                size="small"
                rowKey="price"
                style={{ marginTop: 4 }}
                showHeader
                rowClassName={(_, index) => 
                  index === 0 ? 'best-bid-row' : ''
                }
              />
            </div>
          </Col>
        </Row>
      </div>
    </Card>
  );
};