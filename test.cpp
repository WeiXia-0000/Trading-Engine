#include "order.h"
#include <iostream>

int main() {
    order::Order test_order;
    test_order.order_id = 1;
    test_order.type = order::OrderType::BUY;
    std::cout << "Test order ID: " << test_order.order_id << std::endl;
    return 0;
} 