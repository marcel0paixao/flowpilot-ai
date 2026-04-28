import { Body, Controller, Inject, Post } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";

import { AuthService } from "./auth.service.js";
import { LoginDto } from "./dto/login.dto.js";
import { RegisterDto } from "./dto/register.dto.js";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post("register")
  @ApiCreatedResponse({ description: "User registered or claimed with credentials." })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  @ApiOkResponse({ description: "JWT access token with optional workspace role claims." })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
