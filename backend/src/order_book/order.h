#ifndef ORDER_H
#define ORDER_H

#include <string>
#include <cstdint>

namespace order {
    enum class OrderType {
        BUY,
        SELL
    };

    struct Order {
        int order_id;
        OrderType type;
        int quantity;
        double price;
        std::string client_id;
        uint64_t timestamp;
    };
}
#endif