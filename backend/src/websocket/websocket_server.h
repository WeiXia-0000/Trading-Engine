/**
 * WebSocket Server Implementation
 * 
 * Provides real-time communication capabilities for the trading engine,
 * allowing clients to receive live updates for order book changes and trade executions.
 */

#pragma once

#include <string>
#include <vector>
#include <functional>
#include <thread>
#include <mutex>
#include <map>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

namespace websocket {

struct WebSocketMessage {
    std::string type;
    std::string data;
};

class WebSocketServer {
public:
    WebSocketServer(int port);
    ~WebSocketServer();
    
    // Server lifecycle
    bool start();
    void stop();
    bool is_running() const { return running_; }
    
    // Message handling
    void broadcast(const WebSocketMessage& message);
    void send_to_client(int client_fd, const WebSocketMessage& message);
    
    // Client management
    void add_client(int client_fd);
    void remove_client(int client_fd);
    
    // Event callbacks
    void set_on_connect(std::function<void(int)> callback) { on_connect_ = callback; }
    void set_on_disconnect(std::function<void(int)> callback) { on_disconnect_ = callback; }
    void set_on_message(std::function<void(int, const std::string&)> callback) { on_message_ = callback; }

private:
    int port_;
    int server_fd_;
    bool running_;
    std::thread server_thread_;
    std::vector<int> clients_;
    std::mutex clients_mutex_;
    
    // Event callbacks
    std::function<void(int)> on_connect_;
    std::function<void(int)> on_disconnect_;
    std::function<void(int, const std::string&)> on_message_;
    
    // Internal methods
    void server_loop();
    bool handle_handshake(int client_fd, const std::string& request);
    std::string create_handshake_response(const std::string& key);
    std::string encode_frame(const std::string& data);
    std::string decode_frame(const std::string& frame);
    std::string base64_encode(const std::string& input);
    std::string sha1_hash(const std::string& input);
};

} // namespace websocket
