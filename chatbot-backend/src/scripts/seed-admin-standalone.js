const bcrypt = require('bcrypt');
const { DataSource } = require('typeorm');
const { User } = require('../users/entities/user.entity');

async function seedAdmin() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'chatbot',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    entities: [User],
    synchronize: false,
  });

  await dataSource.initialize();
  console.log('Database connected');

  const userRepository = dataSource.getRepository(User);

  const existingAdmin = await userRepository.findOne({
    where: { email: 'admin@handtalk.com' },
  });

  if (existingAdmin) {
    console.log('Admin user already exists, updating role to admin...');
    existingAdmin.role = 'admin';
    await userRepository.save(existingAdmin);
    console.log('Admin user updated successfully!');
  } else {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('admin123', saltRounds);

    const adminUser = userRepository.create({
      email: 'admin@handtalk.com',
      password: hashedPassword,
      name: 'Admin',
      role: 'admin',
    });

    await userRepository.save(adminUser);
    console.log('Admin user created successfully!');
  }

  console.log('Credentials: admin@handtalk.com / admin123');
  await dataSource.destroy();
  process.exit(0);
}

seedAdmin().catch((error) => {
  console.error('Error seeding admin:', error);
  process.exit(1);
});