/**
 * Trading API Handler
 * 
 * Provides REST API endpoints for the trading engine, handling HTTP requests
 * for order book data, trade history, order submission, and market statistics.
 * Manages thread-safe access to the order book and JSON serialization.
 */

#pragma once

#include "http_server.h"
#include "../order_book/order_book.h"
#include "../utils/json_utils.h"
#include <memory>
#include <mutex>

namespace api {

class TradingApi {
private:
    // Core order book instance with thread-safe access
    std::unique_ptr<order_book::OrderBook> order_book_;
    std::mutex order_book_mutex_;
    
public:
    TradingApi();
    
    // REST API endpoint handlers
    api::HttpResponse get_order_book(const api::HttpRequest& request);
    api::HttpResponse get_trades(const api::HttpRequest& request);
    api::HttpResponse submit_order(const api::HttpRequest& request);
    api::HttpResponse get_market_summary(const api::HttpRequest& request);
    
    // WebSocket broadcasting methods (for real-time updates)
    void broadcast_order_book_update();
    void broadcast_trade_update(const trade::Trade& trade);
    
private:
    // JSON serialization methods
    std::string serialize_order_book();
    std::string serialize_trades();
    std::string serialize_market_summary();
    
    // JSON parsing and validation
    order::Order parse_order_from_json(const std::string& json_body);
};

} // namespace api
