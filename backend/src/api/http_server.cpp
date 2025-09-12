#include "http_server.h"
#include <algorithm>
#include <regex>

namespace api {

HttpServer::HttpServer(int port) : port_(port), running_(false) {
    server_fd_ = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd_ < 0) {
        throw std::runtime_error("Failed to create socket");
    }
    
    int opt = 1;
    if (setsockopt(server_fd_, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt)) < 0) {
        throw std::runtime_error("Failed to set socket options");
    }
}

HttpServer::~HttpServer() {
    stop();
    if (server_fd_ >= 0) {
        close(server_fd_);
    }
}

void HttpServer::start() {
    if (running_) return;
    
    struct sockaddr_in address;
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(port_);
    
    if (bind(server_fd_, (struct sockaddr*)&address, sizeof(address)) < 0) {
        throw std::runtime_error("Failed to bind socket");
    }
    
    if (listen(server_fd_, 10) < 0) {
        throw std::runtime_error("Failed to listen on socket");
    }
    
    running_ = true;
    server_thread_ = std::thread(&HttpServer::server_loop, this);
    
    std::cout << "HTTP Server started on port " << port_ << std::endl;
}

void HttpServer::stop() {
    if (!running_) return;
    
    running_ = false;
    if (server_thread_.joinable()) {
        server_thread_.join();
    }
    
    std::cout << "HTTP Server stopped" << std::endl;
}

void HttpServer::add_route(const std::string& method, const std::string& path,
                          std::function<HttpResponse(const HttpRequest&)> handler) {
    std::string key = method + " " + path;
    routes_[key] = handler;
}

void HttpServer::server_loop() {
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
        
        // Handle client in a separate thread
        std::thread client_thread(&HttpServer::handle_client, this, client_fd);
        client_thread.detach();
    }
}

void HttpServer::handle_client(int client_fd) {
    std::string raw_request;
    std::string line;
    
    // Read request line
    line = read_line(client_fd);
    if (line.empty()) {
        close(client_fd);
        return;
    }
    raw_request += line + "\r\n";
    
    // Read headers
    while (true) {
        line = read_line(client_fd);
        if (line.empty()) break;
        raw_request += line + "\r\n";
    }
    raw_request += "\r\n";
    
    HttpRequest request = parse_request(raw_request);
    
    // Read body if present
    auto content_length_it = request.headers.find("content-length");
    if (content_length_it != request.headers.end()) {
        size_t content_length = std::stoul(content_length_it->second);
        if (content_length > 0) {
            request.body = read_body(client_fd, content_length);
        }
    }
    
    // Handle request
    HttpResponse response;
    std::string route_key = request.method + " " + request.path;
    
    if (request.method == "OPTIONS") {
        // Handle CORS preflight
        response.status_code = 200;
    } else if (routes_.find(route_key) != routes_.end()) {
        response = routes_[route_key](request);
    } else {
        response.status_code = 404;
        response.body = "{\"error\": \"Not Found\"}";
    }
    
    // Send response
    std::string response_str = serialize_response(response);
    send(client_fd, response_str.c_str(), response_str.length(), 0);
    
    close(client_fd);
}

HttpRequest HttpServer::parse_request(const std::string& raw_request) {
    HttpRequest request;
    std::istringstream stream(raw_request);
    std::string line;
    
    // Parse request line
    if (std::getline(stream, line)) {
        std::istringstream line_stream(line);
        line_stream >> request.method >> request.path;
    }
    
    // Parse headers
    while (std::getline(stream, line) && line != "\r" && !line.empty()) {
        size_t colon_pos = line.find(':');
        if (colon_pos != std::string::npos) {
            std::string key = line.substr(0, colon_pos);
            std::string value = line.substr(colon_pos + 1);
            
            // Trim whitespace
            key.erase(0, key.find_first_not_of(" \t"));
            key.erase(key.find_last_not_of(" \t\r") + 1);
            value.erase(0, value.find_first_not_of(" \t"));
            value.erase(value.find_last_not_of(" \t\r") + 1);
            
            // Convert to lowercase
            std::transform(key.begin(), key.end(), key.begin(), ::tolower);
            request.headers[key] = value;
        }
    }
    
    return request;
}

std::string HttpServer::serialize_response(const HttpResponse& response) {
    std::ostringstream oss;
    
    // Status line
    oss << "HTTP/1.1 " << response.status_code << " ";
    switch (response.status_code) {
        case 200: oss << "OK"; break;
        case 404: oss << "Not Found"; break;
        case 500: oss << "Internal Server Error"; break;
        default: oss << "Unknown"; break;
    }
    oss << "\r\n";
    
    // Headers
    for (const auto& header : response.headers) {
        oss << header.first << ": " << header.second << "\r\n";
    }
    
    // Content-Length
    oss << "Content-Length: " << response.body.length() << "\r\n";
    
    // End of headers
    oss << "\r\n";
    
    // Body
    oss << response.body;
    
    return oss.str();
}

std::string HttpServer::read_line(int fd) {
    std::string line;
    char c;
    
    while (recv(fd, &c, 1, 0) > 0) {
        if (c == '\n') {
            break;
        }
        if (c != '\r') {
            line += c;
        }
    }
    
    return line;
}

std::string HttpServer::read_body(int fd, size_t content_length) {
    std::string body;
    body.resize(content_length);
    
    size_t total_read = 0;
    while (total_read < content_length) {
        ssize_t bytes_read = recv(fd, &body[total_read], content_length - total_read, 0);
        if (bytes_read <= 0) break;
        total_read += bytes_read;
    }
    
    return body;
}

} // namespace api
