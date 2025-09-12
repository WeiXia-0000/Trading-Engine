#include "order_book/order_book.h"
#include <chrono>
#include <iostream>
#include <vector>
#include <random>

using namespace std;
using namespace order;
using namespace trade;
using namespace order_book;

inline uint64_t NowNs() {
    return std::chrono::duration_cast<std::chrono::nanoseconds>(
        std::chrono::steady_clock::now().time_since_epoch()
    ).count();
}

void print_benchmark_config(
    const std::string& compile_flags,
    int total_orders,
    double mid_price,
    double half_spread,
    bool logging_enabled,
    double throughput
) {
    std::cout << "\n===== Benchmark Config =====\n";
    std::cout << "Compile Flags : " << compile_flags << "\n";
    std::cout << "Total Orders  : " << total_orders << "\n";
    std::cout << "Mid Price     : " << mid_price << "\n";
    std::cout << "Half Spread   : " << half_spread << "\n";
    std::cout << "Logging       : " << (logging_enabled ? "ON" : "OFF") << "\n";
    std::cout << "Throughput    : " << throughput << " orders/sec\n";
    std::cout << "============================\n\n";
}

int main() {
    OrderBook order_book;
    const int num_orders = 1000000;
    const double mid_price = 100.0;
    const double half_spread = 1.0;
    const int qty_scale = 10;

    vector<Order> orders;
    orders.reserve(num_orders);

    for (int i = 0; i < num_orders; ++i) {
        Order order;
        order.order_id = i;
        order.price = mid_price + half_spread * (i % 2 == 0 ? 1 : -1);
        order.quantity = qty_scale * (i % 10 + 1);
        order.timestamp = NowNs();
        order.type = i % 2 == 0 ? OrderType::BUY : OrderType::SELL;
        orders.push_back(order);
    }

    auto start_time = NowNs();
    for (const auto& order : orders) {
        order_book.add_order(order);
    }
    order_book.match_orders();
    auto end_time = NowNs();

    double duration = (end_time - start_time) / 1e9;
    double throughput = num_orders / (duration > 0 ? duration : 1e-9);
    bool logging_enabled = false;
    std::string compile_flags = "-std=c++17 -O3 -march=native -DNDEBUG -flto";
    
    print_benchmark_config(
        compile_flags,
        num_orders,
        mid_price,
        half_spread,
        logging_enabled,
        throughput
    );
    return 0;
}