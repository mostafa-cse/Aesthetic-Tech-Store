require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');

const User = require('./models/User');
const Product = require('./models/Product');
const Settings = require('./models/Settings');
const Coupon = require('./models/Coupon');

const seedData = async () => {
  await connectDB();
  console.log('🌱 Seeding database...\n');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    Coupon.deleteMany({}),
    Settings.deleteMany({}),
  ]);
  console.log('🗑️  Cleared existing data');

  // ── Create Admin ──────────────────────────────────────────────────
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@aesthetictech.com',
    password: 'admin123',
    role: 'admin',
    megaCoinBalance: 0,
  });
  console.log('✅ Admin created: admin@aesthetictech.com / admin123');

  // ── Create Test User ──────────────────────────────────────────────
  const testUser = await User.create({
    name: 'Test Customer',
    email: 'user@aesthetictech.com',
    password: 'user123',
    role: 'user',
    megaCoinBalance: 250,
    phone: '01700000000',
    addresses: [{
      label: 'Home',
      fullName: 'Test Customer',
      phone: '01700000000',
      address: '123 Main Street',
      city: 'Dhaka',
      district: 'Dhaka',
      postalCode: '1200',
      isDefault: true,
    }],
  });
  console.log('✅ Test user created: user@aesthetictech.com / user123');

  // ── Create Settings ───────────────────────────────────────────────
  await Settings.create({
    storeName: 'Aesthetic Tech Store',
    megaCoin: { earnRate: 10, redeemRate: 10, maxRedeemPerOrder: 500, isEnabled: true },
    returnPolicy: { windowDays: 7, globalConditions: 'Item must be unused, in original packaging with all accessories.' },
    shippingPolicy: 'Free shipping on orders above ৳1000. Standard delivery 3-5 business days across Bangladesh.',
    warrantyPolicy: 'All warranty claims require proof of purchase. Carry product to nearest service center.',
  });
  console.log('✅ Settings created');

  // ── Create Coupons ────────────────────────────────────────────────
  const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await Coupon.insertMany([
    { code: 'WELCOME10', type: 'percentage', value: 10, minPurchase: 500, maxDiscount: 500, expiry, usageLimit: 100, description: '10% off for new customers', createdBy: admin._id },
    { code: 'FLAT200', type: 'flat', value: 200, minPurchase: 1000, expiry, usageLimit: 50, description: '৳200 off on orders above ৳1000', createdBy: admin._id },
    { code: 'TECH500', type: 'flat', value: 500, minPurchase: 5000, expiry, usageLimit: 20, description: '৳500 off on orders above ৳5000', createdBy: admin._id },
  ]);
  console.log('✅ Coupons created: WELCOME10, FLAT200, TECH500');

  // ── Create Products ───────────────────────────────────────────────
  const products = [
    {
      name: 'AMD Ryzen 5 5600X Processor',
      category: 'pc-components',
      brand: 'AMD',
      model: '5600X',
      description: 'The AMD Ryzen 5 5600X delivers outstanding gaming and streaming performance with 6 cores and 12 threads. Built on the revolutionary Zen 3 architecture.',
      images: [{ url: 'https://placehold.co/800x800/1A2235/6C63FF?text=Ryzen+5600X', publicId: 'placeholder' }],
      configuration: [
        { key: 'Cores', value: '6 Cores / 12 Threads' },
        { key: 'Base Clock', value: '3.7 GHz' },
        { key: 'Boost Clock', value: 'Up to 4.6 GHz' },
        { key: 'Cache', value: '35MB Total Cache' },
        { key: 'TDP', value: '65W' },
        { key: 'Socket', value: 'AM4' },
      ],
      guarantee: { duration: 0, unit: 'months', terms: 'No guarantee on processors' },
      warranty: { duration: 3, unit: 'years', terms: 'AMD official warranty. Must register on AMD website within 30 days.' },
      regularPrice: 22000,
      discountPrice: 18500,
      stock: 15,
      sku: 'AMD-5600X-001',
      megaCoinRewardRate: null,
      returnPolicy: { eligible: true, windowDays: 7, conditions: 'Must be unopened and in original packaging.' },
      tags: ['processor', 'cpu', 'amd', 'ryzen', 'gaming'],
      isFeatured: true,
    },
    {
      name: 'ASUS ROG Strix B550-F Gaming Motherboard',
      category: 'pc-components',
      brand: 'ASUS',
      model: 'ROG Strix B550-F',
      description: 'Feature-packed AMD B550 ATX gaming motherboard with PCIe 4.0, dual M.2 slots, and robust power delivery.',
      images: [{ url: 'https://placehold.co/800x800/1A2235/00D4AA?text=B550-F+ROG', publicId: 'placeholder' }],
      configuration: [
        { key: 'Form Factor', value: 'ATX' },
        { key: 'Socket', value: 'AM4' },
        { key: 'Chipset', value: 'AMD B550' },
        { key: 'Memory Slots', value: '4x DDR4 (up to 128GB)' },
        { key: 'PCIe', value: 'PCIe 4.0 x16' },
        { key: 'Storage', value: '2x M.2, 6x SATA' },
      ],
      guarantee: { duration: 6, unit: 'months', terms: 'Manufacturing defects covered.' },
      warranty: { duration: 3, unit: 'years', terms: 'ASUS official warranty service.' },
      regularPrice: 18000,
      discountPrice: 15500,
      stock: 8,
      sku: 'ASUS-B550F-001',
      tags: ['motherboard', 'asus', 'rog', 'gaming', 'b550'],
      isFeatured: true,
    },
    {
      name: 'Corsair Vengeance RGB Pro 16GB DDR4 3200MHz',
      category: 'pc-components',
      brand: 'Corsair',
      model: 'CMW16GX4M2C3200C16',
      description: 'Stunning dynamic multi-zone RGB lighting, high-speed DDR4 performance, and rock-solid stability.',
      images: [{ url: 'https://placehold.co/800x800/1A2235/F59E0B?text=Corsair+RAM', publicId: 'placeholder' }],
      configuration: [
        { key: 'Capacity', value: '16GB (2x8GB)' },
        { key: 'Speed', value: 'DDR4-3200MHz' },
        { key: 'Latency', value: 'CL16' },
        { key: 'Voltage', value: '1.35V' },
        { key: 'RGB', value: 'Yes (iCUE Compatible)' },
      ],
      guarantee: { duration: 0, unit: 'months', terms: '' },
      warranty: { duration: 0, unit: 'months', terms: 'Limited Lifetime Warranty by Corsair' },
      regularPrice: 7500,
      discountPrice: 6200,
      stock: 30,
      sku: 'COR-VEN-16G-001',
      tags: ['ram', 'ddr4', 'corsair', 'rgb', 'memory'],
      isFeatured: false,
    },
    {
      name: 'Samsung 970 EVO Plus 1TB NVMe SSD',
      category: 'storage',
      brand: 'Samsung',
      model: '970 EVO Plus',
      description: 'Blazing fast NVMe SSD with sequential read speeds up to 3,500 MB/s. Perfect for gaming, creative work, and high-performance computing.',
      images: [{ url: 'https://placehold.co/800x800/1A2235/6C63FF?text=Samsung+SSD', publicId: 'placeholder' }],
      configuration: [
        { key: 'Capacity', value: '1TB' },
        { key: 'Interface', value: 'NVMe M.2 PCIe 3.0 x4' },
        { key: 'Read Speed', value: '3,500 MB/s' },
        { key: 'Write Speed', value: '3,300 MB/s' },
        { key: 'Form Factor', value: 'M.2 2280' },
      ],
      guarantee: { duration: 0, unit: 'months', terms: '' },
      warranty: { duration: 5, unit: 'years', terms: 'Samsung 5-year limited warranty.' },
      regularPrice: 12000,
      discountPrice: 9800,
      stock: 20,
      sku: 'SAM-970EP-1T-001',
      tags: ['ssd', 'nvme', 'samsung', 'storage', 'm2'],
      isFeatured: true,
    },
    {
      name: 'ASUS TUF Gaming GeForce RTX 3060 12GB',
      category: 'pc-components',
      brand: 'ASUS',
      model: 'TUF-RTX3060-12G',
      description: 'The RTX 3060 with 12GB GDDR6 memory delivers excellent 1080p and 1440p gaming performance with DLSS support.',
      images: [{ url: 'https://placehold.co/800x800/1A2235/00D4AA?text=RTX+3060', publicId: 'placeholder' }],
      configuration: [
        { key: 'GPU', value: 'NVIDIA RTX 3060' },
        { key: 'VRAM', value: '12GB GDDR6' },
        { key: 'Memory Bus', value: '192-bit' },
        { key: 'Boost Clock', value: '1837 MHz' },
        { key: 'CUDA Cores', value: '3584' },
        { key: 'Outputs', value: '2x HDMI 2.1, 3x DP 1.4a' },
        { key: 'Power', value: '170W TDP' },
      ],
      guarantee: { duration: 6, unit: 'months', terms: 'Physical damage not covered.' },
      warranty: { duration: 3, unit: 'years', terms: 'ASUS TUF warranty. Covers manufacturing defects.' },
      regularPrice: 55000,
      discountPrice: 48000,
      stock: 5,
      sku: 'ASUS-3060-12G-001',
      megaCoinRewardRate: 5,
      tags: ['gpu', 'graphics card', 'rtx3060', 'gaming', 'nvidia'],
      isFeatured: true,
    },
    {
      name: 'TP-Link Archer AX73 WiFi 6 Router',
      category: 'networking',
      brand: 'TP-Link',
      model: 'Archer AX73',
      description: 'Next-gen WiFi 6 router with 5400Mbps speeds, 6 antennas, and BSS Color for reduced interference.',
      images: [{ url: 'https://placehold.co/800x800/1A2235/10B981?text=AX73+Router', publicId: 'placeholder' }],
      configuration: [
        { key: 'WiFi Standard', value: 'WiFi 6 (802.11ax)' },
        { key: 'Speed', value: 'AX5400 (574+4804 Mbps)' },
        { key: 'Antennas', value: '6 External' },
        { key: 'Ports', value: '1x 2.5G WAN, 4x Gigabit LAN' },
        { key: 'Coverage', value: 'Up to 2500 sq ft' },
      ],
      guarantee: { duration: 0, unit: 'months', terms: '' },
      warranty: { duration: 3, unit: 'years', terms: 'TP-Link official warranty.' },
      regularPrice: 8500,
      discountPrice: null,
      stock: 25,
      sku: 'TPL-AX73-001',
      tags: ['router', 'wifi6', 'networking', 'tp-link'],
      isFeatured: false,
    },
    {
      name: 'Logitech MX Master 3S Wireless Mouse',
      category: 'peripherals',
      brand: 'Logitech',
      model: 'MX Master 3S',
      description: 'Advanced wireless mouse with 8K DPI sensor, MagSpeed scrolling, and 70-day battery life. Perfect for productivity.',
      images: [{ url: 'https://placehold.co/800x800/1A2235/6C63FF?text=MX+Master+3S', publicId: 'placeholder' }],
      configuration: [
        { key: 'Sensor', value: 'Darkfield High Precision (8000 DPI)' },
        { key: 'Connection', value: 'Bluetooth / USB Receiver' },
        { key: 'Battery', value: '70 days on full charge' },
        { key: 'Scroll', value: 'MagSpeed Electromagnetic' },
        { key: 'Compatibility', value: 'Windows, macOS, Linux, iPadOS' },
      ],
      guarantee: { duration: 0, unit: 'months', terms: '' },
      warranty: { duration: 2, unit: 'years', terms: 'Logitech hardware warranty.' },
      regularPrice: 9500,
      discountPrice: 8200,
      stock: 18,
      sku: 'LOG-MX3S-001',
      tags: ['mouse', 'logitech', 'wireless', 'productivity'],
      isFeatured: false,
    },
    {
      name: 'Sony WH-1000XM5 Noise Cancelling Headphones',
      category: 'audio',
      brand: 'Sony',
      model: 'WH-1000XM5',
      description: 'Industry-leading noise cancelling with 8 mics, 30-hour battery, and Multi-point Bluetooth for crystal-clear calls.',
      images: [{ url: 'https://placehold.co/800x800/1A2235/F59E0B?text=Sony+XM5', publicId: 'placeholder' }],
      configuration: [
        { key: 'Noise Cancelling', value: 'Industry-leading ANC' },
        { key: 'Driver', value: '30mm' },
        { key: 'Battery', value: '30 hours (NC on)' },
        { key: 'Quick Charge', value: '3 min = 3 hours' },
        { key: 'Bluetooth', value: 'v5.2 Multipoint' },
        { key: 'Codec', value: 'SBC, AAC, LDAC' },
      ],
      guarantee: { duration: 0, unit: 'months', terms: '' },
      warranty: { duration: 1, unit: 'years', terms: 'Sony manufacturer warranty.' },
      regularPrice: 35000,
      discountPrice: 30000,
      stock: 10,
      sku: 'SONY-XM5-001',
      tags: ['headphones', 'sony', 'anc', 'wireless', 'audio'],
      isFeatured: false,
    },
  ];

  for (const productData of products) {
    const product = new Product(productData);
    await product.save(); // Use save() to trigger the slug pre-hook
  }
  console.log(`✅ ${products.length} products created`);

  console.log('\n🎉 Database seeded successfully!\n');
  console.log('📋 Login Credentials:');
  console.log('   Admin: admin@aesthetictech.com / admin123');
  console.log('   User:  user@aesthetictech.com / user123');
  console.log('\n🏷️  Coupon Codes:');
  console.log('   WELCOME10 — 10% off (min ৳500)');
  console.log('   FLAT200   — ৳200 off (min ৳1000)');
  console.log('   TECH500   — ৳500 off (min ৳5000)');

  process.exit(0);
};

seedData().catch((err) => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
