#include "order_book.h"
#include <chrono>
using namespace std;
using namespace order;
using namespace order_book;

inline uint64_t NowNs() {
    return std::chrono::duration_cast<std::chrono::nanoseconds>(
        std::chrono::steady_clock::now().time_since_epoch()
    ).count();
}

int main() {
    OrderBook order_book;

    Order order1 = {1, OrderType::BUY, 20, 100.0, "client1", NowNs()};
    Order order2 = {2, OrderType::SELL, 15, 99.0, "client2", NowNs()};
    Order order3 = {3, OrderType::BUY, 100, 98.0, "client3", NowNs()};
    Order order4 = {4, OrderType::SELL, 50, 97.0, "client4", NowNs()};
    Order order5 = {5, OrderType::BUY, 30, 101.0, "client5", NowNs()};
    Order order6 = {6, OrderType::SELL, 60, 96.0, "client6", NowNs()};

    order_book.add_order(order1);
    order_book.match_orders();  
    order_book.add_order(order2);
    order_book.match_orders();
    order_book.add_order(order3);
    order_book.match_orders();
    order_book.add_order(order4);
    order_book.match_orders();
    order_book.add_order(order5);
    order_book.match_orders();
    order_book.add_order(order6);
    order_book.match_orders();

    order_book.print_order_book();

    return 0;
}
