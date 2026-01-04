import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  private readonly SALT = 'bongho';

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }

    // 회원가입 시 password + SALT로 해시했으므로, 비교 시에도 동일하게 처리
    const isPasswordValid = await bcrypt.compare(
      password + this.SALT,
      user.password,
    );
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async login(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersService.findByEmail(
      createUserDto.email,
    );
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // bcrypt.hash()의 두 번째 인자는 salt rounds (숫자)입니다.
    // 사용자 요구사항에 따라 salt rounds를 10으로 설정하고,
    // 실제 salt 값 "bongho"는 추가 보안을 위해 사용할 수 있습니다.
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(
      createUserDto.password + this.SALT,
      saltRounds,
    );

    const user = await this.usersService.create({
      email: createUserDto.email,
      password: hashedPassword,
      name: createUserDto.name,
      role: createUserDto.role || UserRole.USER,
    });

    return user;
  }
}

