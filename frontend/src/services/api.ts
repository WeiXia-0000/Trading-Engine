/**
 * API Service Layer
 * 
 * Handles all HTTP communication with the backend trading engine API.
 * Provides methods for fetching order book data, trade history, market summary,
 * and submitting new orders.
 */

import { OrderBook } from '../types/order';
import { Trade } from '../types/trade';

const API_BASE_URL = 'http://localhost:8080/api';


class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getOrderBook(): Promise<OrderBook> {
    return this.request<OrderBook>('/orderbook');
  }

  async getTrades(): Promise<Trade[]> {
    return this.request<Trade[]>('/trades');
  }

  async getMarketSummary(): Promise<{
    total_trades: number;
    total_volume: number;
    avg_trade_size: number;
    avg_price: number;
    buy_depth: number;
    sell_depth: number;
  }> {
    return this.request('/market-summary');
  }

  async submitOrder(order: {
    type: string;
    quantity: number;
    price: number;
    client_id: string;
  }): Promise<{ status: string; order_id: number }> {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  }

  async healthCheck(): Promise<{ status: string }> {
    return this.request('/health');
  }
}

export const apiService = new ApiService();
