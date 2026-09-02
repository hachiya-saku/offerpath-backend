import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { hash, compare } from 'bcryptjs';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'node:crypto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import type { JwtPayload } from './types/jwt-payload.type';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private hashRefreshToken(refreshToken: string) {
    return createHash('sha256').update(refreshToken).digest('hex');
  }

  private async issueTokenPair(user: { id: string; email: string }) {
    const payload = { sub: user.id, email: user.email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        jwtid: randomUUID(),
        expiresIn: this.configService.getOrThrow<string>(
          'JWT_ACCESS_EXPIRES_IN',
        ) as JwtSignOptions['expiresIn'],
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        jwtid: randomUUID(),
        expiresIn: this.configService.getOrThrow<string>(
          'JWT_REFRESH_EXPIRES_IN',
        ) as JwtSignOptions['expiresIn'],
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async register(registerDto: RegisterDto) {
    const email = registerDto.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await hash(registerDto.password, SALT_ROUNDS);

    const newUser = await this.prisma.user.create({
      data: {
        email,
        displayName: registerDto.displayName.trim(),
        passwordCredential: {
          create: {
            passwordHash: hashedPassword,
          },
        },
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        createdAt: true,
      },
    });

    return newUser;
  }

  async login(loginDto: LoginDto) {
    const email = loginDto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        passwordCredential: true,
      },
    });

    if (!user || !user.passwordCredential) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await compare(
      loginDto.password,
      user.passwordCredential.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const { accessToken, refreshToken } = await this.issueTokenPair(user);

    const refreshTokenHash = this.hashRefreshToken(refreshToken);

    await this.prisma.passwordCredential.update({
      where: {
        userId: user.id,
      },
      data: {
        refreshTokenHash,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
    };
  }

  async refresh(dto: RefreshTokenDto) {
    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(
        dto.refreshToken,
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        },
      );
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const credential = await this.prisma.passwordCredential.findUnique({
      where: {
        userId: payload.sub,
      },
      include: {
        user: true,
      },
    });

    if (!credential?.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isRefreshTokenValid =
      this.hashRefreshToken(dto.refreshToken) === credential.refreshTokenHash;

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const { accessToken, refreshToken } = await this.issueTokenPair(
      credential.user,
    );

    const refreshTokenHash = this.hashRefreshToken(refreshToken);

    await this.prisma.passwordCredential.update({
      where: {
        userId: credential.user.id,
      },
      data: {
        refreshTokenHash,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async logout(userId: string) {
    await this.prisma.passwordCredential.updateMany({
      where: {
        userId,
      },
      data: {
        refreshTokenHash: null,
      },
    });

    return { message: 'Logged out successfully' };
  }
}
