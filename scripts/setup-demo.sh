#!/bin/bash

echo "🎯 Setting up PRP Demo Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the project root
if [[ ! -f "package.json" ]] && [[ ! -d "backend" ]] && [[ ! -d "frontend" ]]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Setting up backend environment..."

# Navigate to backend
cd backend

# Check if node_modules exists
if [[ ! -d "node_modules" ]]; then
    print_status "Installing backend dependencies..."
    npm install
fi

# Check if .env exists
if [[ ! -f ".env" ]]; then
    print_warning ".env file not found in backend"
    if [[ -f ".env.example" ]]; then
        print_status "Copying .env.example to .env"
        cp .env.example .env
        print_warning "Please update the .env file with your MongoDB connection string and API keys"
    fi
fi

# Create demo users
print_status "Creating demo users and data..."
if node scripts/create-demo-users.js; then
    print_success "Demo data created successfully!"
else
    print_error "Failed to create demo data. Please check your database connection."
    exit 1
fi

# Navigate to frontend
cd ../frontend

print_status "Setting up frontend environment..."

# Check if node_modules exists
if [[ ! -d "node_modules" ]]; then
    print_status "Installing frontend dependencies..."
    npm install
fi

# Check if .env.local exists
if [[ ! -f ".env.local" ]]; then
    print_warning ".env.local file not found in frontend"
    if [[ -f ".env.local.example" ]]; then
        print_status "Copying .env.local.example to .env.local"
        cp .env.local.example .env.local
    else
        print_status "Creating .env.local with demo configuration"
        cat > .env.local << EOF
NEXT_PUBLIC_API_URL=https://prp-emxw.vercel.app
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
    fi
fi

# Update API URL to use deployed backend
print_status "Updating frontend to use deployed backend..."
if grep -q "NEXT_PUBLIC_API_URL" .env.local; then
    sed -i.bak 's|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=https://prp-emxw.vercel.app|' .env.local
    rm -f .env.local.bak
else
    echo "NEXT_PUBLIC_API_URL=https://prp-emxw.vercel.app" >> .env.local
fi

print_success "Demo environment setup complete!"

echo ""
echo "🎉 Demo Ready!"
echo ""
echo "=== DEMO CREDENTIALS ==="
echo "🔑 Admin:    admin@demotech.com / Demo123!"
echo "👨‍💼 Manager:  john.manager@demotech.com / Demo123!"
echo "👩‍💻 Employee: sarah.employee@demotech.com / Demo123!"
echo "👥 HR:       lisa.hr@demotech.com / Demo123!"
echo ""
echo "=== NEXT STEPS ==="
echo "1. Start the frontend: cd frontend && npm run dev"
echo "2. Open http://localhost:3000 in your browser"
echo "3. Login with any of the demo credentials above"
echo "4. Follow the demo flow in docs/DEMO_FLOW.md"
echo ""
echo "🌐 Backend API: https://prp-emxw.vercel.app"
echo "📚 Demo Guide: docs/DEMO_FLOW.md"
echo ""
print_success "Happy demoing! 🚀" 