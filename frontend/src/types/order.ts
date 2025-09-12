/**
 * Order Type Definitions
 * 
 * Defines the data structures for orders, order book levels, and the complete order book.
 * Used throughout the application for type safety and data consistency.
 */

export enum OrderType {
  BUY = 'BUY',
  SELL = 'SELL'
}

export interface Order {
  order_id: number;
  type: OrderType;
  quantity: number;
  price: number;
  client_id: string;
  timestamp: number;
}

export interface OrderBookLevel {
  price: number;
  quantity: number;
  orders: Order[];
}

export interface OrderBook {
  buy_orders: OrderBookLevel[];
  sell_orders: OrderBookLevel[];
}
