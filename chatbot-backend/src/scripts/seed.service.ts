import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.seedAdmin();
  }

  async seedAdmin() {
    const existingAdmin = await this.userRepository.findOne({
      where: { email: 'admin@handtalk.com' },
    });

    if (existingAdmin) {
      console.log('Admin user already exists, updating role to admin...');
      existingAdmin.role = 'admin';
      await this.userRepository.save(existingAdmin);
      console.log('Admin user updated successfully!');
    } else {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash('admin123', saltRounds);

      const adminUser = this.userRepository.create({
        email: 'admin@handtalk.com',
        password: hashedPassword,
        name: 'Admin',
        role: 'admin',
      });

      await this.userRepository.save(adminUser);
      console.log('Admin user created successfully!');
    }

    console.log('Credentials: admin@handtalk.com / admin123');
  }
}