#include "order_book.h"
#include <iostream>

using namespace std;
using namespace order;
using namespace trade;
using namespace order_book;

OrderBook::OrderBook() noexcept {}

void OrderBook::add_order(const Order& order) {
    if (order.type == OrderType::BUY) {
        buy_orders[order.price].push_back(order);
        orders[order.order_id] = {order.price, prev(buy_orders[order.price].end())};
    } else {
        sell_orders[order.price].push_back(order);
        orders[order.order_id] = {order.price, prev(sell_orders[order.price].end())};
    }
}

void OrderBook::cancel_order(int order_id) {
    auto it = orders.find(order_id);
    if (it == orders.end()) { 
        return;
    }

    double price = it->second.first;
    auto iter = it->second.second;

    if (buy_orders.count(price)) {
        buy_orders[price].erase(iter);
        if (buy_orders[price].empty()) {
            buy_orders.erase(price);
        }
    } else {
        sell_orders[price].erase(iter);
        if (sell_orders[price].empty()) {
            sell_orders.erase(price);
        }
    }

    orders.erase(it);
}

void OrderBook::match_orders() {
    while (!buy_orders.empty() && !sell_orders.empty()) {
        auto buy_it = buy_orders.begin();
        auto sell_it = sell_orders.begin();
        
        if (buy_it->first < sell_it->first) {
            break;
        }

        int quantity = min(buy_it->second.front().quantity, sell_it->second.front().quantity);
        
        int buy_order_id = buy_it->second.front().order_id;
        int sell_order_id = sell_it->second.front().order_id;
        double trade_price = sell_it->first; 
        uint64_t trade_timestamp = buy_it->second.front().timestamp;
        
        buy_it->second.front().quantity -= quantity;
        sell_it->second.front().quantity -= quantity;

        if (buy_it->second.front().quantity == 0) {
            buy_orders[buy_it->first].pop_front();
            if (buy_orders[buy_it->first].empty()) {
                buy_orders.erase(buy_it->first);
            }
        }   

        if (sell_it->second.front().quantity == 0) {
            sell_orders[sell_it->first].pop_front();
            if (sell_orders[sell_it->first].empty()) {
                sell_orders.erase(sell_it->first);
            }
        }

        trades.push_back({trade_id++, buy_order_id, sell_order_id, quantity, trade_price, trade_timestamp});
    }
}

void OrderBook::print_order_book() const {
    cout << "Buy Orders:" << endl;
    for (const auto& [price, orders] : buy_orders) {
        cout << "Price: " << price << ", Quantity: " << orders.front().quantity << endl;
    }

    cout << "Sell Orders:" << endl;
    for (const auto& [price, orders] : sell_orders) {
        cout << "Price: " << price << ", Quantity: " << orders.front().quantity << endl;
    }

    cout << "Trades:" << endl;
    for (const auto& trade : trades) {
        cout << "Trade ID: " << trade.trade_id << ", Buy Order ID: " << trade.buy_order_id << ", Sell Order ID: " << trade.sell_order_id << ", Quantity: " << trade.quantity << ", Price: " << trade.price << ", Timestamp: " << trade.timestamp << endl;
    }
}