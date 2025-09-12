import React from 'react';
import { Card, Table, Typography, Space } from 'antd';
import { OrderBook as OrderBookType } from '../../types/order';

const { Title } = Typography;

interface OrderBookProps {
  orderBook: OrderBookType;
}

export const OrderBook: React.FC<OrderBookProps> = ({ orderBook }) => {
  const buyColumns = [
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => (
        <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
          ${price.toFixed(2)}
        </span>
      ),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity: number) => quantity.toLocaleString(),
    },
    {
      title: 'Orders',
      dataIndex: 'orders',
      key: 'orders',
      render: (orders: any[]) => orders.length,
    },
  ];

  const sellColumns = [
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => (
        <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
          ${price.toFixed(2)}
        </span>
      ),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity: number) => quantity.toLocaleString(),
    },
    {
      title: 'Orders',
      dataIndex: 'orders',
      key: 'orders',
      render: (orders: any[]) => orders.length,
    },
  ];

  return (
    <Card>
      <Title level={3}>Order Book</Title>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Title level={4} style={{ color: '#ff4d4f' }}>Sell Orders</Title>
          <Table
            columns={sellColumns}
            dataSource={orderBook.sell_orders}
            pagination={false}
            size="small"
            rowKey="price"
            style={{ marginBottom: 16 }}
          />
        </div>
        
        <div>
          <Title level={4} style={{ color: '#52c41a' }}>Buy Orders</Title>
          <Table
            columns={buyColumns}
            dataSource={orderBook.buy_orders}
            pagination={false}
            size="small"
            rowKey="price"
          />
        </div>
      </Space>
    </Card>
  );
};
