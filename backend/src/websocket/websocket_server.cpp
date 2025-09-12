/**
 * WebSocket Server Implementation
 * 
 * Implements a lightweight WebSocket server for real-time trading data updates.
 * Supports WebSocket handshake, frame encoding/decoding, and client management.
 */

#include "websocket_server.h"
#include <iostream>
#include <sstream>
#include <algorithm>
#include <cstring>
#include <unistd.h>
#include <fcntl.h>
#include <openssl/sha.h>
#include <openssl/bio.h>
#include <openssl/evp.h>
#include <openssl/buffer.h>

namespace websocket {

WebSocketServer::WebSocketServer(int port) 
    : port_(port), server_fd_(-1), running_(false) {
}

WebSocketServer::~WebSocketServer() {
    stop();
}

bool WebSocketServer::start() {
    if (running_) {
        return true;
    }
    
    // Create socket
    server_fd_ = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd_ < 0) {
        std::cerr << "Failed to create socket" << std::endl;
        return false;
    }
    
    // Set socket options
    int opt = 1;
    if (setsockopt(server_fd_, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt)) < 0) {
        std::cerr << "Failed to set socket options" << std::endl;
        close(server_fd_);
        return false;
    }
    
    // Bind socket
    struct sockaddr_in address;
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(port_);
    
    if (bind(server_fd_, (struct sockaddr*)&address, sizeof(address)) < 0) {
        std::cerr << "Failed to bind socket to port " << port_ << std::endl;
        close(server_fd_);
        return false;
    }
    
    // Listen for connections
    if (listen(server_fd_, 10) < 0) {
        std::cerr << "Failed to listen on socket" << std::endl;
        close(server_fd_);
        return false;
    }
    
    running_ = true;
    server_thread_ = std::thread(&WebSocketServer::server_loop, this);
    
    std::cout << "WebSocket server started on port " << port_ << std::endl;
    return true;
}

void WebSocketServer::stop() {
    if (!running_) {
        return;
    }
    
    running_ = false;
    
    // Close all client connections
    {
        std::lock_guard<std::mutex> lock(clients_mutex_);
        for (int client_fd : clients_) {
            close(client_fd);
        }
        clients_.clear();
    }
    
    // Close server socket
    if (server_fd_ >= 0) {
        close(server_fd_);
        server_fd_ = -1;
    }
    
    // Wait for server thread to finish
    if (server_thread_.joinable()) {
        server_thread_.join();
    }
    
    std::cout << "WebSocket server stopped" << std::endl;
}

void WebSocketServer::server_loop() {
    while (running_) {
        struct sockaddr_in client_address;
        socklen_t client_len = sizeof(client_address);
        
        int client_fd = accept(server_fd_, (struct sockaddr*)&client_address, &client_len);
        if (client_fd < 0) {
            if (running_) {
                std::cerr << "Failed to accept client connection" << std::endl;
            }
            continue;
        }
        
        // Set client socket to non-blocking
        int flags = fcntl(client_fd, F_GETFL, 0);
        fcntl(client_fd, F_SETFL, flags | O_NONBLOCK);
        
        // Handle WebSocket handshake
        char buffer[4096];
        int bytes_read = recv(client_fd, buffer, sizeof(buffer) - 1, 0);
        if (bytes_read > 0) {
            buffer[bytes_read] = '\0';
            std::string request(buffer);
            
            if (handle_handshake(client_fd, request)) {
                add_client(client_fd);
                if (on_connect_) {
                    on_connect_(client_fd);
                }
            } else {
                close(client_fd);
            }
        } else {
            close(client_fd);
        }
    }
}

bool WebSocketServer::handle_handshake(int client_fd, const std::string& request) {
    // Extract WebSocket key from request
    std::istringstream stream(request);
    std::string line;
    std::string websocket_key;
    
    while (std::getline(stream, line)) {
        if (line.find("Sec-WebSocket-Key:") != std::string::npos) {
            websocket_key = line.substr(line.find(":") + 1);
            // Remove leading/trailing whitespace
            websocket_key.erase(0, websocket_key.find_first_not_of(" \t\r\n"));
            websocket_key.erase(websocket_key.find_last_not_of(" \t\r\n") + 1);
            break;
        }
    }
    
    if (websocket_key.empty()) {
        return false;
    }
    
    // Create handshake response
    std::string response = create_handshake_response(websocket_key);
    
    // Send response
    if (send(client_fd, response.c_str(), response.length(), 0) < 0) {
        return false;
    }
    
    return true;
}

std::string WebSocketServer::create_handshake_response(const std::string& key) {
    const std::string magic_string = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
    std::string accept_key = sha1_hash(key + magic_string);
    
    std::ostringstream response;
    response << "HTTP/1.1 101 Switching Protocols\r\n";
    response << "Upgrade: websocket\r\n";
    response << "Connection: Upgrade\r\n";
    response << "Sec-WebSocket-Accept: " << accept_key << "\r\n";
    response << "\r\n";
    
    return response.str();
}

void WebSocketServer::add_client(int client_fd) {
    std::lock_guard<std::mutex> lock(clients_mutex_);
    clients_.push_back(client_fd);
}

void WebSocketServer::remove_client(int client_fd) {
    std::lock_guard<std::mutex> lock(clients_mutex_);
    clients_.erase(std::remove(clients_.begin(), clients_.end(), client_fd), clients_.end());
    close(client_fd);
    
    if (on_disconnect_) {
        on_disconnect_(client_fd);
    }
}

void WebSocketServer::broadcast(const WebSocketMessage& message) {
    std::string frame = encode_frame(message.data);
    
    std::lock_guard<std::mutex> lock(clients_mutex_);
    auto it = clients_.begin();
    while (it != clients_.end()) {
        int client_fd = *it;
        if (send(client_fd, frame.c_str(), frame.length(), 0) < 0) {
            // Client disconnected, remove from list
            close(client_fd);
            it = clients_.erase(it);
        } else {
            ++it;
        }
    }
}

void WebSocketServer::send_to_client(int client_fd, const WebSocketMessage& message) {
    std::string frame = encode_frame(message.data);
    
    if (send(client_fd, frame.c_str(), frame.length(), 0) < 0) {
        remove_client(client_fd);
    }
}

std::string WebSocketServer::encode_frame(const std::string& data) {
    std::string frame;
    
    // First byte: FIN=1, opcode=1 (text frame)
    frame.push_back(0x81);
    
    // Payload length
    size_t payload_len = data.length();
    if (payload_len < 126) {
        frame.push_back(static_cast<char>(payload_len));
    } else if (payload_len < 65536) {
        frame.push_back(126);
        frame.push_back(static_cast<char>((payload_len >> 8) & 0xFF));
        frame.push_back(static_cast<char>(payload_len & 0xFF));
    } else {
        frame.push_back(127);
        for (int i = 7; i >= 0; --i) {
            frame.push_back(static_cast<char>((payload_len >> (i * 8)) & 0xFF));
        }
    }
    
    // Payload data
    frame += data;
    
    return frame;
}

std::string WebSocketServer::decode_frame(const std::string& frame) {
    if (frame.length() < 2) {
        return "";
    }
    
    // Check if this is a text frame
    if ((frame[0] & 0x0F) != 1) {
        return "";
    }
    
    // Get payload length
    size_t payload_len = frame[1] & 0x7F;
    size_t header_len = 2;
    
    if (payload_len == 126) {
        if (frame.length() < 4) return "";
        payload_len = (static_cast<unsigned char>(frame[2]) << 8) | static_cast<unsigned char>(frame[3]);
        header_len = 4;
    } else if (payload_len == 127) {
        if (frame.length() < 10) return "";
        payload_len = 0;
        for (int i = 2; i < 10; ++i) {
            payload_len = (payload_len << 8) | static_cast<unsigned char>(frame[i]);
        }
        header_len = 10;
    }
    
    // Extract payload
    if (frame.length() < header_len + payload_len) {
        return "";
    }
    
    return frame.substr(header_len, payload_len);
}

std::string WebSocketServer::base64_encode(const std::string& input) {
    BIO* bio = BIO_new(BIO_s_mem());
    BIO* b64 = BIO_new(BIO_f_base64());
    BIO_set_flags(b64, BIO_FLAGS_BASE64_NO_NL);
    bio = BIO_push(b64, bio);
    
    BIO_write(bio, input.c_str(), input.length());
    BIO_flush(bio);
    
    BUF_MEM* buffer_ptr;
    BIO_get_mem_ptr(bio, &buffer_ptr);
    
    std::string result(buffer_ptr->data, buffer_ptr->length);
    BIO_free_all(bio);
    
    return result;
}

std::string WebSocketServer::sha1_hash(const std::string& input) {
    unsigned char hash[SHA_DIGEST_LENGTH];
    SHA1(reinterpret_cast<const unsigned char*>(input.c_str()), input.length(), hash);
    
    std::string hash_str(reinterpret_cast<char*>(hash), SHA_DIGEST_LENGTH);
    return base64_encode(hash_str);
}

} // namespace websocket
