#include "json_utils.h"
#include <iostream>

namespace utils {

JsonBuilder& JsonBuilder::start_object() {
    if (!first_) oss_ << ",";
    oss_ << "{";
    first_ = true;
    return *this;
}

JsonBuilder& JsonBuilder::end_object() {
    oss_ << "}";
    first_ = false;
    return *this;
}

JsonBuilder& JsonBuilder::start_array(const std::string& key) {
    if (!first_) oss_ << ",";
    if (!key.empty()) {
        oss_ << "\"" << key << "\":";
    }
    oss_ << "[";
    first_ = true;
    return *this;
}

JsonBuilder& JsonBuilder::end_array() {
    oss_ << "]";
    first_ = false;
    return *this;
}

JsonBuilder& JsonBuilder::add_string(const std::string& key, const std::string& value) {
    if (!first_) oss_ << ",";
    oss_ << "\"" << key << "\":\"" << value << "\"";
    first_ = false;
    return *this;
}

JsonBuilder& JsonBuilder::add_number(const std::string& key, double value) {
    if (!first_) oss_ << ",";
    oss_ << "\"" << key << "\":" << value;
    first_ = false;
    return *this;
}

JsonBuilder& JsonBuilder::add_number(const std::string& key, int64_t value) {
    if (!first_) oss_ << ",";
    oss_ << "\"" << key << "\":" << value;
    first_ = false;
    return *this;
}

JsonBuilder& JsonBuilder::add_bool(const std::string& key, bool value) {
    if (!first_) oss_ << ",";
    oss_ << "\"" << key << "\":" << (value ? "true" : "false");
    first_ = false;
    return *this;
}

JsonBuilder& JsonBuilder::add_null(const std::string& key) {
    if (!first_) oss_ << ",";
    oss_ << "\"" << key << "\":null";
    first_ = false;
    return *this;
}

std::string JsonBuilder::build() {
    return oss_.str();
}

void JsonParser::skip_whitespace() {
    while (pos_ < json_.length() && std::isspace(json_[pos_])) {
        pos_++;
    }
}

std::string JsonParser::parse_string() {
    skip_whitespace();
    if (pos_ >= json_.length() || json_[pos_] != '"') {
        return "";
    }
    pos_++; // skip opening quote
    
    std::string result;
    while (pos_ < json_.length() && json_[pos_] != '"') {
        if (json_[pos_] == '\\' && pos_ + 1 < json_.length()) {
            pos_++; // skip backslash
            switch (json_[pos_]) {
                case '"': result += '"'; break;
                case '\\': result += '\\'; break;
                case '/': result += '/'; break;
                case 'b': result += '\b'; break;
                case 'f': result += '\f'; break;
                case 'n': result += '\n'; break;
                case 'r': result += '\r'; break;
                case 't': result += '\t'; break;
                default: result += json_[pos_]; break;
            }
        } else {
            result += json_[pos_];
        }
        pos_++;
    }
    
    if (pos_ < json_.length()) pos_++; // skip closing quote
    return result;
}

double JsonParser::parse_number() {
    skip_whitespace();
    size_t start = pos_;
    
    if (pos_ < json_.length() && json_[pos_] == '-') pos_++;
    while (pos_ < json_.length() && std::isdigit(json_[pos_])) pos_++;
    if (pos_ < json_.length() && json_[pos_] == '.') {
        pos_++;
        while (pos_ < json_.length() && std::isdigit(json_[pos_])) pos_++;
    }
    if (pos_ < json_.length() && (json_[pos_] == 'e' || json_[pos_] == 'E')) {
        pos_++;
        if (pos_ < json_.length() && (json_[pos_] == '+' || json_[pos_] == '-')) pos_++;
        while (pos_ < json_.length() && std::isdigit(json_[pos_])) pos_++;
    }
    
    return std::stod(json_.substr(start, pos_ - start));
}

bool JsonParser::parse_bool() {
    skip_whitespace();
    if (json_.substr(pos_, 4) == "true") {
        pos_ += 4;
        return true;
    } else if (json_.substr(pos_, 5) == "false") {
        pos_ += 5;
        return false;
    }
    return false;
}

void JsonParser::parse_null() {
    skip_whitespace();
    if (json_.substr(pos_, 4) == "null") {
        pos_ += 4;
    }
}

std::map<std::string, std::string> JsonParser::parse_object() {
    std::map<std::string, std::string> result;
    skip_whitespace();
    
    if (pos_ >= json_.length() || json_[pos_] != '{') {
        return result;
    }
    pos_++; // skip opening brace
    
    while (pos_ < json_.length()) {
        skip_whitespace();
        if (json_[pos_] == '}') {
            pos_++;
            break;
        }
        
        std::string key = parse_string();
        skip_whitespace();
        if (pos_ < json_.length() && json_[pos_] == ':') {
            pos_++; // skip colon
        }
        
        skip_whitespace();
        if (pos_ < json_.length() && json_[pos_] == '"') {
            result[key] = parse_string();
        } else if (pos_ < json_.length() && (std::isdigit(json_[pos_]) || json_[pos_] == '-')) {
            result[key] = std::to_string(parse_number());
        } else if (pos_ < json_.length() && (json_[pos_] == 't' || json_[pos_] == 'f')) {
            result[key] = parse_bool() ? "true" : "false";
        } else if (pos_ < json_.length() && json_[pos_] == 'n') {
            parse_null();
            result[key] = "null";
        }
        
        skip_whitespace();
        if (pos_ < json_.length() && json_[pos_] == ',') {
            pos_++; // skip comma
        }
    }
    
    return result;
}

std::string JsonParser::get_string(const std::string& key) {
    // Reset position to start
    pos_ = 0;
    auto obj = parse_object();
    auto it = obj.find(key);
    return (it != obj.end()) ? it->second : "";
}

double JsonParser::get_number(const std::string& key) {
    // Reset position to start
    pos_ = 0;
    auto obj = parse_object();
    auto it = obj.find(key);
    return (it != obj.end()) ? std::stod(it->second) : 0.0;
}

bool JsonParser::get_bool(const std::string& key) {
    // Reset position to start
    pos_ = 0;
    auto obj = parse_object();
    auto it = obj.find(key);
    return (it != obj.end()) ? (it->second == "true") : false;
}

} // namespace utils
