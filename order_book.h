#ifndef ORDER_BOOK_H
#define ORDER_BOOK_H

#include <unordered_map>
#include <map>
#include <vector>
#include <deque>
#include <cstdint>
#include "order.h"
#include "trade.h"

using namespace std;
using namespace order;
using namespace trade;

namespace order_book {
    class OrderBook {
        public:
        OrderBook() noexcept;
        void add_order(const Order& order);
        void cancel_order(int order_id);
        void match_orders();
        void print_order_book() const;
        

        private:
        int trade_id = 0;
        map<double, deque<Order>, greater<double>> buy_orders;
        map<double, deque<Order>> sell_orders;
        unordered_map<int, pair<double, deque<Order>::iterator>> orders;
        vector<Trade> trades;

    };
}
#endif