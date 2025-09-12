#pragma once

#include <string>
#include <map>
#include <functional>
#include <thread>
#include <atomic>
#include <vector>
#include <sstream>
#include <iostream>
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>
#include <cstring>

namespace api {

struct HttpRequest {
    std::string method;
    std::string path;
    std::map<std::string, std::string> headers;
    std::string body;
};

struct HttpResponse {
    int status_code = 200;
    std::map<std::string, std::string> headers;
    std::string body;
    
    HttpResponse() {
        headers["Content-Type"] = "application/json";
        headers["Access-Control-Allow-Origin"] = "*";
        headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS";
        headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization";
    }
};

class HttpServer {
private:
    int server_fd_;
    int port_;
    std::atomic<bool> running_;
    std::thread server_thread_;
    std::map<std::string, std::function<HttpResponse(const HttpRequest&)>> routes_;

public:
    HttpServer(int port = 8080);
    ~HttpServer();
    
    void start();
    void stop();
    
    void add_route(const std::string& method, const std::string& path, 
                   std::function<HttpResponse(const HttpRequest&)> handler);
    
private:
    void server_loop();
    HttpRequest parse_request(const std::string& raw_request);
    std::string serialize_response(const HttpResponse& response);
    void handle_client(int client_fd);
    std::string read_line(int fd);
    std::string read_body(int fd, size_t content_length);
};

} // namespace api
