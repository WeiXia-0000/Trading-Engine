/**
 * Trade History Component
 * 
 * Displays recent trade history in a table format with time, price, and size columns.
 * Shows total volume and average price statistics at the top.
 */

import React from 'react';
import { Card, Table, Typography, Space, Statistic } from 'antd';
import { Trade } from '../../types/trade';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface TradeHistoryProps {
  trades: Trade[];
  maxTrades?: number;
  hasData?: boolean;
}

export const TradeHistory: React.FC<TradeHistoryProps> = ({ 
  trades, 
  maxTrades = 20,
  hasData = true
}) => {
  const columns = [
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: number) => (
        <Text style={{ fontSize: '12px', color: '#666' }}>
          {dayjs(timestamp).format('HH:mm:ss')}
        </Text>
      ),
      width: 80,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => (
        <Text strong style={{ fontSize: '14px', color: '#1890ff' }}>
          ${price.toFixed(2)}
        </Text>
      ),
      sorter: (a: Trade, b: Trade) => a.price - b.price,
      width: 100,
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
      sorter: (a: Trade, b: Trade) => a.quantity - b.quantity,
      width: 100,
    },
  ];

  const recentTrades = trades.slice(0, maxTrades);
  const totalVolume = trades.reduce((sum, trade) => sum + trade.quantity, 0);
  const avgPrice = trades.length > 0 ? trades.reduce((sum, trade) => sum + trade.price, 0) / trades.length : 0;

  return (
    <Card 
      style={{ height: '100%' }}
      bodyStyle={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 16 }}
    >
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 8 }}>
        <Title level={4} style={{ margin: 0 }}>
          Recent Trades
          {!hasData && <Text type="secondary" style={{ fontSize: '12px', marginLeft: 8 }}>(No Data)</Text>}
        </Title>
        <Space>
          <Statistic
            title="Total Volume"
            value={totalVolume}
            valueStyle={{ fontSize: '12px', color: '#13c2c2' }}
          />
          <Statistic
            title="Avg Price"
            value={avgPrice}
            precision={2}
            prefix="$"
            valueStyle={{ fontSize: '12px', color: '#722ed1' }}
          />
        </Space>
      </Space>
      
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        <Table
          columns={columns}
          dataSource={recentTrades}
          pagination={false}
          size="small"
          rowKey="trade_id"
          style={{ fontSize: '12px' }}
          rowClassName={(_, index) => 
            index % 2 === 0 ? 'trade-row-even' : 'trade-row-odd'
          }
        />
      </div>
    </Card>
  );
};