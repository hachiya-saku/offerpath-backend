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

  private async issueTokenPair(
    user: { id: string; email: string },
    sessionId: string,
  ) {
    const payload = { sub: user.id, email: user.email, sessionId };

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

    const refreshPayload = this.jwtService.decode<{ exp: number }>(
      refreshToken,
    );

    return {
      accessToken,
      refreshToken,
      refreshTokenExpiresAt: new Date(refreshPayload.exp * 1000),
    };
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

    const sessionId = randomUUID();
    const { accessToken, refreshToken, refreshTokenExpiresAt } =
      await this.issueTokenPair(user, sessionId);

    const refreshTokenHash = this.hashRefreshToken(refreshToken);

    await this.prisma.refreshSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        refreshTokenHash,
        expiresAt: refreshTokenExpiresAt,
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

  async refresh(refreshToken: string) {
    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!payload.sub || !payload.sessionId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const session = await this.prisma.refreshSession.findUnique({
      where: {
        id: payload.sessionId,
      },
      include: {
        user: true,
      },
    });

    if (!session || session.userId !== payload.sub) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isRefreshTokenValid =
      this.hashRefreshToken(refreshToken) === session.refreshTokenHash;

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const {
      accessToken,
      refreshToken: newRefreshToken,
      refreshTokenExpiresAt,
    } = await this.issueTokenPair(session.user, session.id);

    const refreshTokenHash = this.hashRefreshToken(newRefreshToken);

    const updateResult = await this.prisma.refreshSession.updateMany({
      where: {
        id: session.id,
        refreshTokenHash: session.refreshTokenHash,
      },
      data: {
        refreshTokenHash,
        expiresAt: refreshTokenExpiresAt,
      },
    });

    if (updateResult.count !== 1) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(userId: string, sessionId: string) {
    await this.prisma.refreshSession.deleteMany({
      where: {
        userId,
        id: sessionId,
      },
    });

    return { message: 'Logged out successfully' };
  }
}
