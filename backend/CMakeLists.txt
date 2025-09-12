cmake_minimum_required(VERSION 3.16)

# Project name and version
project(TradingEngine VERSION 1.0.0 LANGUAGES CXX)

# Force Release build type and optimization settings
set(CMAKE_BUILD_TYPE Release CACHE STRING "Build type" FORCE)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)
set(CMAKE_CXX_FLAGS_RELEASE "-O3 -march=native -DNDEBUG -flto" CACHE STRING "Release flags" FORCE)

# Enable interprocedural optimization (LTO/IPO)
include(CheckIPOSupported)
check_ipo_supported(RESULT supported OUTPUT error)
if(supported)
    set(CMAKE_INTERPROCEDURAL_OPTIMIZATION TRUE)
endif()

# Find required packages
find_package(Threads REQUIRED)

# Include directories
include_directories(${CMAKE_SOURCE_DIR}/src)

# Order Book Library
set(ORDER_BOOK_SOURCES
    src/order_book/order_book.cpp
    src/order_book/order.h
    src/order_book/trade.h
)

add_library(order_book_lib ${ORDER_BOOK_SOURCES})

# Main Trading Engine Server
add_executable(trading_engine
    src/main.cpp
    ${ORDER_BOOK_SOURCES}
)

target_link_libraries(trading_engine 
    order_book_lib 
    Threads::Threads
)

# Benchmark executable
add_executable(benchmark
    tests/benchmark.cpp
    ${ORDER_BOOK_SOURCES}
)

target_link_libraries(benchmark order_book_lib)

# Optional: Add install target
install(TARGETS trading_engine benchmark
    RUNTIME DESTINATION bin
)

# Add custom clean target
add_custom_target(clear
    COMMAND ${CMAKE_COMMAND} -E remove_directory ${CMAKE_BINARY_DIR}/CMakeFiles
    COMMAND ${CMAKE_COMMAND} -E remove -f ${CMAKE_BINARY_DIR}/CMakeCache.txt
    COMMAND ${CMAKE_COMMAND} -E remove -f ${CMAKE_BINARY_DIR}/cmake_install.cmake
    COMMAND ${CMAKE_COMMAND} -E remove -f ${CMAKE_BINARY_DIR}/Makefile
    COMMAND ${CMAKE_COMMAND} -E remove -f ${CMAKE_BINARY_DIR}/trading_engine
    COMMAND ${CMAKE_COMMAND} -E remove -f ${CMAKE_BINARY_DIR}/benchmark
    COMMENT "Cleaning build files and executables"
)

# Print build information
message(STATUS "Build type: ${CMAKE_BUILD_TYPE}")
message(STATUS "C++ standard: ${CMAKE_CXX_STANDARD}")
message(STATUS "Compiler: ${CMAKE_CXX_COMPILER_ID}")
message(STATUS "Release flags: ${CMAKE_CXX_FLAGS_RELEASE}")
if(supported)
    message(STATUS "IPO/LTO enabled")
endif()
