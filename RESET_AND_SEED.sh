#!/bin/bash

echo "🔄 Starting database reset and re-seed process..."
echo ""

# Navigate to backend directory
cd "$(dirname "$0")/backend" || exit 1

echo "📍 Current directory: $(pwd)"
echo ""

# Step 1: Reset database (this will drop all tables and re-run migrations)
echo "⚠️  WARNING: This will DELETE ALL DATA and reset the database!"
echo "Press Ctrl+C to cancel, or press Enter to continue..."
read -r

echo ""
echo "🗑️  Resetting database..."
npx prisma migrate reset --force --skip-seed

if [ $? -ne 0 ]; then
    echo "❌ Database reset failed!"
    exit 1
fi

echo ""
echo "✅ Database reset complete!"
echo ""

# Step 2: Run the corrected seed script
echo "🌱 Running Supabase-compatible seed script..."
npm run seed

if [ $? -ne 0 ]; then
    echo "❌ Seed failed!"
    exit 1
fi

echo ""
echo "🎉 All done!"
echo ""
echo "📋 Next steps:"
echo "   1. Go to http://localhost:3000"
echo "   2. Sign up again with your admin credentials"
echo "   3. Then test users will be available for reviewer assignments"
echo ""
echo "🔑 Test user credentials:"
echo "   Email: sarah.johnson@company.com"
echo "   Password: password123"
echo ""
