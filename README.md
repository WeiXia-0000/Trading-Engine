# Trading Engine

A high-performance C++ order book system with React frontend for real-time trading visualization.

## 🚀 Features

- **High-Performance Order Book**: C++ implementation with optimized data structures
- **Real-time Visualization**: React frontend with WebSocket integration
- **Order Matching**: Price-time priority matching algorithm
- **Live Updates**: Real-time order book and trade updates
- **Modern UI**: Clean, responsive interface built with Ant Design

## 🏗️ Architecture

```
┌─────────────────┐    WebSocket/HTTP    ┌─────────────────┐
│   React Frontend │ ◄─────────────────► │   C++ Backend   │
│                 │                      │                 │
│ • Order Book UI │                      │ • Order Matching│
│ • Trade History │                      │ • WebSocket API │
│ • Real-time     │                      │ • HTTP API      │
└─────────────────┘                      └─────────────────┘
```

## 🛠️ Tech Stack

### Backend
- **C++17** with CMake build system
- **Optimized Performance**: LTO, march=native, O3 optimization
- **WebSocket Support**: Real-time data streaming
- **HTTP API**: RESTful endpoints

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Ant Design** for UI components
- **WebSocket** for real-time updates

## 📦 Project Structure

```
Trading-Engine/
├── backend/                 # C++ Backend
│   ├── src/
│   │   ├── order_book/     # Core order book logic
│   │   └── main.cpp        # Server entry point
│   ├── tests/              # Tests and benchmarks
│   └── CMakeLists.txt      # Build configuration
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom hooks
│   │   └── types/          # TypeScript definitions
│   └── package.json        # Dependencies
└── scripts/                # Build and deployment
```

## 🚀 Quick Start

### Prerequisites
- C++17 compatible compiler (GCC 7+, Clang 5+, MSVC 2017+)
- CMake 3.16+
- Node.js 16+ and npm

### Build and Run

1. **Clone the repository**
```bash
git clone https://github.com/WeiXia-0000/Trading-Engine.git
cd Trading-Engine
```

2. **Build the project**
```bash
chmod +x scripts/build.sh
./scripts/build.sh
```

3. **Start the services**
```bash
chmod +x scripts/start.sh
./scripts/start.sh
```

4. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080

## 📊 Performance

- **Order Processing**: Sub-microsecond latency
- **Memory Efficient**: Optimized data structures
- **Scalable**: Handles thousands of orders per second
- **Real-time**: WebSocket updates with minimal delay

## 🔧 Development

### Backend Development
```bash
cd backend
mkdir build && cd build
cmake ..
make
./trading_engine
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Running Tests
```bash
cd backend/build
./benchmark
```

## 📈 Order Book Algorithm

The order book uses a price-time priority matching algorithm:

1. **Price Priority**: Orders are sorted by price (best price first)
2. **Time Priority**: Same price orders follow FIFO (First In, First Out)
3. **Automatic Matching**: Compatible orders are matched automatically
4. **Trade Recording**: All executed trades are recorded with full details

### Data Structures
- **Buy Orders**: `std::map<double, std::deque<Order>, std::greater<double>>`
- **Sell Orders**: `std::map<double, std::deque<Order>>`
- **Order Index**: `std::unordered_map<int, std::pair<double, iterator>>`

## 🌐 API Endpoints

### HTTP API
- `GET /api/orderbook` - Get current order book state
- `POST /api/orders` - Submit new order
- `DELETE /api/orders/:id` - Cancel order

### WebSocket
- `ws://localhost:8080/ws` - Real-time order book updates

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Contact

- GitHub: [@WeiXia-0000](https://github.com/WeiXia-0000)
- Project Link: [https://github.com/WeiXia-0000/Trading-Engine](https://github.com/WeiXia-0000/Trading-Engine)

---

⭐ Star this repository if you found it helpful!
