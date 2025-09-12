#pragma once

#include <string>
#include <map>
#include <vector>
#include <sstream>

namespace utils {

class JsonBuilder {
private:
    std::ostringstream oss_;
    bool first_ = true;
    
public:
    JsonBuilder& start_object();
    JsonBuilder& end_object();
    JsonBuilder& start_array(const std::string& key = "");
    JsonBuilder& end_array();
    JsonBuilder& add_string(const std::string& key, const std::string& value);
    JsonBuilder& add_number(const std::string& key, double value);
    JsonBuilder& add_number(const std::string& key, int64_t value);
    JsonBuilder& add_bool(const std::string& key, bool value);
    JsonBuilder& add_null(const std::string& key);
    
    std::string build();
};

class JsonParser {
private:
    std::string json_;
    size_t pos_ = 0;
    
    void skip_whitespace();
    std::string parse_string();
    double parse_number();
    bool parse_bool();
    void parse_null();
    
public:
    JsonParser(const std::string& json) : json_(json) {}
    
    std::map<std::string, std::string> parse_object();
    std::vector<std::string> parse_array();
    std::string get_string(const std::string& key);
    double get_number(const std::string& key);
    bool get_bool(const std::string& key);
};

} // namespace utils
