/**
 * Order Form Component
 * 
 * Provides a form interface for submitting buy/sell orders with quantity and price inputs.
 * Features order type selection, validation, and dynamic button styling based on order type.
 */

import React, { useState } from 'react';
import { Card, Form, Button, InputNumber, Typography, Space, Segmented } from 'antd';
import { OrderType } from '../../types/order';

const { Title, Text } = Typography;

interface OrderFormProps {
  onSubmit: (order: any) => void;
  loading?: boolean;
  hasData?: boolean;
}

export const OrderForm: React.FC<OrderFormProps> = ({ onSubmit, loading = false, hasData = true }) => {
  const [form] = Form.useForm();
  const [orderType, setOrderType] = useState<OrderType>(OrderType.BUY);

  const handleSubmit = (values: any) => {
    const order = {
      ...values,
      type: orderType,
      timestamp: Date.now(),
      client_id: `client_${Math.random().toString(36).substr(2, 9)}`,
    };
    
    onSubmit(order);
    form.resetFields();
    form.setFieldsValue({ type: orderType });
  };

  const handleReset = () => {
    form.resetFields();
    form.setFieldsValue({ type: orderType });
  };

  return (
    <Card 
      style={{ height: '100%' }}
      bodyStyle={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 16 }}
    >
      <Title level={4} style={{ marginBottom: 12, textAlign: 'center' }}>
        Place Order
        {!hasData && <Text type="secondary" style={{ fontSize: '12px', marginLeft: 8 }}>(Offline)</Text>}
      </Title>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            type: OrderType.BUY,
            quantity: 1,
            price: 100.00,
          }}
          size="middle"
          style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <Form.Item label="Order Type" style={{ marginBottom: 12 }}>
            <Segmented
              block
              value={orderType}
              onChange={(val) => setOrderType(val as OrderType)}
              options={[
                { label: 'BUY', value: OrderType.BUY },
                { label: 'SELL', value: OrderType.SELL },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[
              { required: true, message: 'Please input quantity!' },
              { type: 'number', min: 1, message: 'Quantity must be at least 1!' }
            ]}
            style={{ marginBottom: 12 }}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              precision={0}
              placeholder="Enter quantity"
            />
          </Form.Item>

          <Form.Item
            name="price"
            label="Price"
            rules={[
              { required: true, message: 'Please input price!' },
              { type: 'number', min: 0.01, message: 'Price must be greater than 0!' }
            ]}
            style={{ marginBottom: 12 }}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0.01}
              precision={2}
              placeholder="Enter price"
              prefix="$"
            />
          </Form.Item>

          <div style={{ marginTop: 'auto' }}>
            <Space direction="vertical" style={{ width: '100%' }} size={8}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                disabled={!hasData}
                style={{ 
                  width: '100%',
                  background: hasData ? (orderType === OrderType.BUY ? '#52c41a' : '#ff4d4f') : '#d9d9d9',
                  borderColor: hasData ? (orderType === OrderType.BUY ? '#52c41a' : '#ff4d4f') : '#d9d9d9'
                }}
              >
                {!hasData ? 'Backend Offline' : (orderType === OrderType.BUY ? 'Place Buy Order' : 'Place Sell Order')}
              </Button>
              <Button onClick={handleReset} style={{ width: '100%' }}>
                Reset
              </Button>
            </Space>
          </div>
        </Form>
      </div>
    </Card>
  );
};