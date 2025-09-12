/**
 * Trading API Implementation
 * 
 * Implements REST API endpoints for the trading engine, providing thread-safe
 * access to order book operations and JSON serialization for client communication.
 */

#include "trading_api.h"
#include <chrono>
#include <algorithm>

namespace api {

TradingApi::TradingApi() : order_book_(std::make_unique<order_book::OrderBook>()) {
    // Initialize order book with sample data for demonstration
    auto now = std::chrono::duration_cast<std::chrono::nanoseconds>(
        std::chrono::steady_clock::now().time_since_epoch()
    ).count();
    
    std::lock_guard<std::mutex> lock(order_book_mutex_);
    
    // Add some sample orders
    order::Order order1 = {1, order::OrderType::BUY, 100, 99.50, "client1", static_cast<uint64_t>(now)};
    order::Order order2 = {2, order::OrderType::BUY, 200, 99.00, "client2", static_cast<uint64_t>(now)};
    order::Order order3 = {3, order::OrderType::SELL, 150, 100.50, "client3", static_cast<uint64_t>(now)};
    order::Order order4 = {4, order::OrderType::SELL, 300, 101.00, "client4", static_cast<uint64_t>(now)};
    
    order_book_->add_order(order1);
    order_book_->add_order(order2);
    order_book_->add_order(order3);
    order_book_->add_order(order4);
    
    order_book_->match_orders();
}

// GET /api/orderbook - Retrieve current order book state
api::HttpResponse TradingApi::get_order_book(const api::HttpRequest& request) {
    std::lock_guard<std::mutex> lock(order_book_mutex_);
    
    api::HttpResponse response;
    response.body = serialize_order_book();
    return response;
}

// GET /api/trades - Retrieve trade history
api::HttpResponse TradingApi::get_trades(const api::HttpRequest& request) {
    std::lock_guard<std::mutex> lock(order_book_mutex_);
    
    api::HttpResponse response;
    response.body = serialize_trades();
    return response;
}

// POST /api/orders - Submit new order and attempt matching
api::HttpResponse TradingApi::submit_order(const api::HttpRequest& request) {
    try {
        // Parse and validate order from JSON request body
        order::Order new_order = parse_order_from_json(request.body);
        
        // Thread-safe order book operations
        std::lock_guard<std::mutex> lock(order_book_mutex_);
        order_book_->add_order(new_order);
        order_book_->match_orders();
        
        // Return success response with order ID
        api::HttpResponse response;
        response.body = "{\"status\": \"success\", \"order_id\": " + std::to_string(new_order.order_id) + "}";
        return response;
    } catch (const std::exception& e) {
        // Return error response for invalid orders
        api::HttpResponse response;
        response.status_code = 400;
        response.body = "{\"error\": \"" + std::string(e.what()) + "\"}";
        return response;
    }
}

// GET /api/market-summary - Retrieve market statistics and summary
api::HttpResponse TradingApi::get_market_summary(const api::HttpRequest& request) {
    std::lock_guard<std::mutex> lock(order_book_mutex_);
    
    api::HttpResponse response;
    response.body = serialize_market_summary();
    return response;
}

// WebSocket broadcasting methods (to be implemented with WebSocket server)
void TradingApi::broadcast_order_book_update() {
    // TODO: Implement WebSocket broadcasting for real-time order book updates
}

void TradingApi::broadcast_trade_update(const trade::Trade& trade) {
    // TODO: Implement WebSocket broadcasting for real-time trade notifications
}

// Serialize order book data to JSON format for API response
std::string TradingApi::serialize_order_book() {
    utils::JsonBuilder json;
    json.start_object();
    
    // Serialize buy orders (aggregated by price level)
    json.start_array("buy_orders");
    const auto& buy_orders = order_book_->get_buy_orders();
    for (const auto& level : buy_orders) {
        double total_quantity = 0;
        for (const auto& order : level.second) {
            total_quantity += order.quantity;
        }
        json.start_object()
            .add_number("price", level.first)
            .add_number("quantity", total_quantity)
            .end_object();
    }
    json.end_array();
    
    // Serialize sell orders (aggregated by price level)
    json.start_array("sell_orders");
    const auto& sell_orders = order_book_->get_sell_orders();
    for (const auto& level : sell_orders) {
        double total_quantity = 0;
        for (const auto& order : level.second) {
            total_quantity += order.quantity;
        }
        json.start_object()
            .add_number("price", level.first)
            .add_number("quantity", total_quantity)
            .end_object();
    }
    json.end_array();
    
    json.end_object();
    return json.build();
}

// Serialize trade history to JSON format for API response
std::string TradingApi::serialize_trades() {
    utils::JsonBuilder json;
    json.start_array();
    
    const auto& trades = order_book_->get_trades();
    for (const auto& trade : trades) {
        json.start_object()
            .add_number("trade_id", static_cast<int64_t>(trade.trade_id))
            .add_number("buy_order_id", static_cast<int64_t>(trade.buy_order_id))
            .add_number("sell_order_id", static_cast<int64_t>(trade.sell_order_id))
            .add_number("quantity", static_cast<int64_t>(trade.quantity))
            .add_number("price", trade.price)
            .add_number("timestamp", static_cast<int64_t>(trade.timestamp))
            .end_object();
    }
    
    json.end_array();
    return json.build();
}

std::string TradingApi::serialize_market_summary() {
    std::lock_guard<std::mutex> lock(order_book_mutex_);
    
    const auto& buy_orders = order_book_->get_buy_orders();
    const auto& sell_orders = order_book_->get_sell_orders();
    const auto& trades = order_book_->get_trades();
    
    // Calculate statistics
    int total_trades = trades.size();
    double total_volume = 0;
    double total_value = 0;
    
    for (const auto& trade : trades) {
        total_volume += trade.quantity;
        total_value += trade.price * trade.quantity;
    }
    
    double avg_trade_size = total_trades > 0 ? total_volume / total_trades : 0;
    double avg_price = total_volume > 0 ? total_value / total_volume : 0;
    
    double buy_depth = 0;
    double sell_depth = 0;
    
    for (const auto& level : buy_orders) {
        for (const auto& order : level.second) {
            buy_depth += order.quantity;
        }
    }
    
    for (const auto& level : sell_orders) {
        for (const auto& order : level.second) {
            sell_depth += order.quantity;
        }
    }
    
    utils::JsonBuilder json;
    json.start_object()
        .add_number("total_trades", static_cast<int64_t>(total_trades))
        .add_number("total_volume", total_volume)
        .add_number("avg_trade_size", avg_trade_size)
        .add_number("avg_price", avg_price)
        .add_number("buy_depth", buy_depth)
        .add_number("sell_depth", sell_depth)
        .end_object();
    
    return json.build();
}

// Parse and validate order from JSON request body
order::Order TradingApi::parse_order_from_json(const std::string& json_body) {
    utils::JsonParser parser(json_body);
    
    order::Order order;
    // Generate unique order ID using current timestamp
    order.order_id = static_cast<uint64_t>(std::chrono::duration_cast<std::chrono::nanoseconds>(
        std::chrono::steady_clock::now().time_since_epoch()
    ).count());
    
    // Parse and validate order type
    std::string type_str = parser.get_string("type");
    if (type_str == "BUY") {
        order.type = order::OrderType::BUY;
    } else if (type_str == "SELL") {
        order.type = order::OrderType::SELL;
    } else {
        throw std::invalid_argument("Invalid order type: " + type_str);
    }
    
    // Parse order parameters
    double quantity = parser.get_number("quantity");
    order.price = parser.get_number("price");
    order.client_id = parser.get_string("client_id");
    order.timestamp = static_cast<uint64_t>(std::chrono::duration_cast<std::chrono::nanoseconds>(
        std::chrono::steady_clock::now().time_since_epoch()
    ).count());
    
    // Validate order parameters
    if (quantity <= 0 || order.price <= 0) {
        throw std::invalid_argument("Invalid quantity or price: quantity=" + std::to_string(quantity) + ", price=" + std::to_string(order.price));
    }
    
    // Convert quantity to uint64_t (round to nearest integer)
    order.quantity = static_cast<uint64_t>(quantity + 0.5);
    
    return order;
}

} // namespace api
