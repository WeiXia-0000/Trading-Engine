cmake_minimum_required(VERSION 3.16)

# Project name and version
project(OrderBook VERSION 1.0.0 LANGUAGES CXX)

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

# Include directories
include_directories(${CMAKE_SOURCE_DIR})

# Source files
set(SOURCES
    main.cpp
    order_book.cpp
)

# Header files
set(HEADERS
    order_book.h
    order.h
    trade.h
)

# Create main executable
add_executable(${PROJECT_NAME} ${SOURCES} ${HEADERS})

# Create benchmark executable
add_executable(benchmark benchmark.cpp order_book.cpp ${HEADERS})

# Optional: Add install target
install(TARGETS ${PROJECT_NAME}
    RUNTIME DESTINATION bin
)

# Add custom clean target
add_custom_target(clear
    COMMAND ${CMAKE_COMMAND} -E remove_directory ${CMAKE_BINARY_DIR}/CMakeFiles
    COMMAND ${CMAKE_COMMAND} -E remove -f ${CMAKE_BINARY_DIR}/CMakeCache.txt
    COMMAND ${CMAKE_COMMAND} -E remove -f ${CMAKE_BINARY_DIR}/cmake_install.cmake
    COMMAND ${CMAKE_COMMAND} -E remove -f ${CMAKE_BINARY_DIR}/Makefile
    COMMAND ${CMAKE_COMMAND} -E remove -f ${CMAKE_BINARY_DIR}/${PROJECT_NAME}
    COMMAND ${CMAKE_COMMAND} -E remove -f ${CMAKE_SOURCE_DIR}/test
    COMMAND ${CMAKE_COMMAND} -E remove -f ${CMAKE_SOURCE_DIR}/test_orderbook
    COMMENT "Cleaning build files and executables"
)

# Optional: Enable testing (uncomment if you add tests later)
# enable_testing()
# add_subdirectory(tests)

# Print build information
message(STATUS "Build type: ${CMAKE_BUILD_TYPE}")
message(STATUS "C++ standard: ${CMAKE_CXX_STANDARD}")
message(STATUS "Compiler: ${CMAKE_CXX_COMPILER_ID}")
message(STATUS "Release flags: ${CMAKE_CXX_FLAGS_RELEASE}")
if(supported)
    message(STATUS "IPO/LTO enabled")
endif()
