import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '../../DB/repositories/user.repository';
import {
  ConfirmEmailDto,
  ForgotPasswordDto,
  LoginDto,
  ResetPasswordDto,
  SignUpDto,
} from './dto/auth.dto';
import { comparePassword, hashPassword } from '../../common/utils/hash.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private generateOtp(): { otp: string; otpExpires: Date } {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    return { otp, otpExpires };
  }

  async signUp(dto: SignUpDto) {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const { otp, otpExpires } = this.generateOtp();
    const hashedOtp = await hashPassword(otp);

    const user = await this.userRepository.create({
      ...dto,
      email: dto.email.toLowerCase().trim(),
      otp: hashedOtp,
      otpExpires,
    });

    const accessToken = await this.signToken(
      user._id.toString(),
      user.email,
      user.role,
    );

    return {
      message: 'User registered successfully',
      user,
      accessToken,
      verificationOtp: otp,
    };
  }

  async confirmEmail(dto: ConfirmEmailDto) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.isConfirmed) {
      throw new BadRequestException('Email is already confirmed');
    }
    if (!user.otp || !user.otpExpires || user.otpExpires < new Date()) {
      throw new BadRequestException('OTP has expired or is invalid');
    }

    const isValidOtp = await comparePassword(dto.otp, user.otp);
    if (!isValidOtp) {
      throw new BadRequestException('Invalid OTP code');
    }

    user.isConfirmed = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    return {
      message: 'Email confirmed successfully',
      user,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user || user.isDeleted) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await comparePassword(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = await this.signToken(
      user._id.toString(),
      user.email,
      user.role,
    );

    return {
      message: 'Logged in successfully',
      accessToken,
      user,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user || user.isDeleted) {
      throw new NotFoundException('User with this email was not found');
    }

    const { otp, otpExpires } = this.generateOtp();
    user.otp = await hashPassword(otp);
    user.otpExpires = otpExpires;
    await user.save();

    return {
      message: 'Password reset OTP generated',
      resetOtp: otp,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user || user.isDeleted) {
      throw new NotFoundException('User not found');
    }
    if (!user.otp || !user.otpExpires || user.otpExpires < new Date()) {
      throw new BadRequestException('OTP has expired or is invalid');
    }

    const isValidOtp = await comparePassword(dto.otp, user.otp);
    if (!isValidOtp) {
      throw new BadRequestException('Invalid OTP code');
    }

    user.password = dto.newPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    return {
      message: 'Password has been reset successfully',
    };
  }

  private async signToken(
    id: string,
    email: string,
    role: string,
  ): Promise<string> {
    return this.jwtService.signAsync(
      { id, email, role },
      {
        secret:
          this.configService.get<string>('JWT_SECRET') ||
          'super-secret-jwt-key-change-in-production',
        expiresIn: (this.configService.get<string>('JWT_EXPIRES_IN') ||
          '7d') as any,
      },
    );
  }
}
