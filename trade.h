#ifndef TRADE_H
#define TRADE_H

#include <string>
#include <cstdint>

namespace trade {
    struct Trade {
        int trade_id;
        int buy_order_id;
        int sell_order_id;
        int quantity;
        double price;
        uint64_t timestamp;
    };
}
#endif