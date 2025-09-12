/**
 * Trading Activity & Market Overview Component
 * 
 * Displays key trading metrics including total trades, volume, average trade size,
 * and price in circular progress indicators. Also shows market depth and trade speed.
 */

import React from 'react';
import { Card, Typography, Row, Col, Progress } from 'antd';
import { OrderBook as OrderBookType } from '../../types/order';
import { Trade } from '../../types/trade';
import { FireOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface OrderBookTradeSummaryProps {
  orderBook: OrderBookType;
  trades: Trade[];
  hasData?: boolean;
}

export const OrderBookTradeSummary: React.FC<OrderBookTradeSummaryProps> = ({ 
  orderBook, 
  trades,
  hasData = true
}) => {
  const totalTrades = trades.length;
  const totalVolume = trades.reduce((sum, trade) => sum + trade.quantity, 0);
  const totalValue = trades.reduce((sum, trade) => sum + (trade.price * trade.quantity), 0);
  const avgTradeSize = totalTrades > 0 ? totalVolume / totalTrades : 0;
  const avgTradePrice = totalTrades > 0 ? totalValue / totalVolume : 0;
  
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  const recentTrades = trades.filter(trade => trade.timestamp > fiveMinutesAgo);
  const recentVolume = recentTrades.reduce((sum, trade) => sum + trade.quantity, 0);
  
  const totalBuyOrders = orderBook.buy_orders.length;
  const totalSellOrders = orderBook.sell_orders.length;
  const totalOrders = totalBuyOrders + totalSellOrders;
  
  const buyDepth = orderBook.buy_orders.reduce((sum, level) => sum + level.quantity, 0);
  const sellDepth = orderBook.sell_orders.reduce((sum, level) => sum + level.quantity, 0);
  const totalDepth = buyDepth + sellDepth;
  
  const bestBid = orderBook.buy_orders[0]?.price || 0;
  const bestAsk = orderBook.sell_orders[0]?.price || 0;
  const spread = Math.abs(bestBid - bestAsk);
  
  const oneMinuteAgo = Date.now() - 60 * 1000;
  const tradesLastMinute = trades.filter(trade => trade.timestamp > oneMinuteAgo).length;
  
  const volumeLastMinute = trades.filter(trade => trade.timestamp > oneMinuteAgo)
    .reduce((sum, trade) => sum + trade.quantity, 0);

  return (
    <Card>
      <Title level={4} style={{ textAlign: 'center', marginBottom: 20 }}>
        <FireOutlined style={{ color: hasData ? '#ff4d4f' : '#d9d9d9', marginRight: 8 }} />
        Trading Activity & Market Overview
        {!hasData && <Text type="secondary" style={{ fontSize: '12px', marginLeft: 8 }}>(No Data)</Text>}
      </Title>
      
      <Row gutter={[20, 20]} align="middle">
        <Col span={6}>
          <div style={{ textAlign: 'center' }}>
            <Progress
              type="circle"
              percent={Math.min((totalTrades / 1000) * 100, 100)}
              format={() => (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#52c41a' }}>
                    {totalTrades}
                  </div>
                  <div style={{ fontSize: '10px', color: '#666' }}>TRADES</div>
                </div>
              )}
              strokeColor="#52c41a"
              size={80}
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: 8 }}>Total Trades</div>
          </div>
        </Col>
        
        <Col span={6}>
          <div style={{ textAlign: 'center' }}>
            <Progress
              type="circle"
              percent={Math.min((totalVolume / 50000) * 100, 100)}
              format={() => (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
                    {(totalVolume / 1000).toFixed(0)}K
                  </div>
                  <div style={{ fontSize: '10px', color: '#666' }}>VOLUME</div>
                </div>
              )}
              strokeColor="#1890ff"
              size={80}
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: 8 }}>Total Volume</div>
          </div>
        </Col>
        
        <Col span={6}>
          <div style={{ textAlign: 'center' }}>
            <Progress
              type="circle"
              percent={Math.min((avgTradeSize / 500) * 100, 100)}
              format={() => (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#722ed1' }}>
                    {Math.floor(avgTradeSize)}
                  </div>
                  <div style={{ fontSize: '10px', color: '#666' }}>AVG SIZE</div>
                </div>
              )}
              strokeColor="#722ed1"
              size={80}
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: 8 }}>Avg Trade Size</div>
          </div>
        </Col>
        
        <Col span={6}>
          <div style={{ textAlign: 'center' }}>
            <Progress
              type="circle"
              percent={Math.min(((avgTradePrice - 95) / 10) * 100, 100)}
              format={() => (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fa8c16' }}>
                    ${avgTradePrice.toFixed(0)}
                  </div>
                  <div style={{ fontSize: '10px', color: '#666' }}>AVG PRICE</div>
                </div>
              )}
              strokeColor="#fa8c16"
              size={80}
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: 8 }}>Avg Price</div>
          </div>
        </Col>

        <Col span={12}>
          <div style={{ textAlign: 'center', padding: '12px', background: '#f6ffed', borderRadius: '8px' }}>
            <Text style={{ fontSize: '14px', color: '#666', marginBottom: 8 }}>Market Depth</Text>
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#52c41a' }}>
                  {buyDepth.toLocaleString()}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>Buy Depth</div>
              </Col>
              <Col span={12}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ff4d4f' }}>
                  {sellDepth.toLocaleString()}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>Sell Depth</div>
              </Col>
            </Row>
          </div>
        </Col>
        
        <Col span={12}>
          <div style={{ textAlign: 'center', padding: '12px', background: '#e6f7ff', borderRadius: '8px' }}>
            <Text style={{ fontSize: '14px', color: '#666', marginBottom: 8 }}>Trade Speed</Text>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
              {tradesLastMinute} trades/min
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Last Minute Activity</div>
          </div>
        </Col>
      </Row>
    </Card>
  );
};
