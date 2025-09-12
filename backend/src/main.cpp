/**
 * Trading Engine Main Application
 * 
 * Initializes and starts both HTTP API server and WebSocket server for the trading engine.
 * Handles graceful shutdown on SIGINT/SIGTERM signals.
 */

#include "api/http_server.h"
#include "api/trading_api.h"
#include "websocket/websocket_server.h"
#include <iostream>
#include <signal.h>
#include <memory>
#include <thread>

// Global server instances for signal handling
std::unique_ptr<api::HttpServer> server;
std::unique_ptr<api::TradingApi> trading_api;
std::unique_ptr<websocket::WebSocketServer> ws_server;

// Signal handler for graceful shutdown
void signal_handler(int signal) {
    std::cout << "\nReceived signal " << signal << ", shutting down..." << std::endl;
    if (server) {
        server->stop();
    }
    if (ws_server) {
        ws_server->stop();
    }
    exit(0);
}

int main() {
    // Set up signal handlers for graceful shutdown
    signal(SIGINT, signal_handler);
    signal(SIGTERM, signal_handler);
    
    try {
        // Initialize trading API with order book
        trading_api = std::make_unique<api::TradingApi>();
        
        // Create HTTP server for REST API
        server = std::make_unique<api::HttpServer>(8080);
        
        // Create WebSocket server for real-time updates
        ws_server = std::make_unique<websocket::WebSocketServer>(8081);
        
        // Register REST API routes
        server->add_route("GET", "/api/orderbook", 
                         [&](const api::HttpRequest& req) { 
                             return trading_api->get_order_book(req); 
                         });
        
        server->add_route("GET", "/api/trades", 
                         [&](const api::HttpRequest& req) { 
                             return trading_api->get_trades(req); 
                         });
        
        server->add_route("POST", "/api/orders", 
                         [&](const api::HttpRequest& req) { 
                             return trading_api->submit_order(req); 
                         });
        
        server->add_route("GET", "/api/market-summary", 
                         [&](const api::HttpRequest& req) { 
                             return trading_api->get_market_summary(req); 
                         });
        
        // Health check endpoint for monitoring
        server->add_route("GET", "/health", 
                         [](const api::HttpRequest& req) {
                             api::HttpResponse response;
                             response.body = "{\"status\": \"healthy\"}";
                             return response;
                         });
        
        // Start both servers
        server->start();
        ws_server->start();
        
        // Display server information
        std::cout << "Trading Engine API Server is running on port 8080" << std::endl;
        std::cout << "WebSocket Server is running on port 8081" << std::endl;
        std::cout << "Available endpoints:" << std::endl;
        std::cout << "  GET  /api/orderbook     - Get current order book" << std::endl;
        std::cout << "  GET  /api/trades        - Get trade history" << std::endl;
        std::cout << "  POST /api/orders        - Submit new order" << std::endl;
        std::cout << "  GET  /api/market-summary - Get market statistics" << std::endl;
        std::cout << "  GET  /health            - Health check" << std::endl;
        std::cout << "  WS   ws://localhost:8081/ws - WebSocket connection" << std::endl;
        std::cout << "\nPress Ctrl+C to stop the server" << std::endl;
        
        // Keep server running indefinitely
        while (true) {
            std::this_thread::sleep_for(std::chrono::seconds(1));
        }
        
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }
    
    return 0;
}
