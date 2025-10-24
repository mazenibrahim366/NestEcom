import { Global, Module } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { TokenModel } from "src/DB/models/Token.model";
import { UserModel } from "src/DB/models/User.model";
import { TokenRepository, UserRepository } from "src/DB/repository";
import { TokenService } from "../utils/security/token.security";

@Global()
@Module({
  imports: [UserModel, TokenModel],
controllers: [],
  providers: [
    
    UserRepository,
    
  
    TokenService,
    TokenRepository,
    JwtService,
  ],exports:[

    
      UserRepository,
    
  
    TokenService,
    TokenRepository,
    JwtService,
    UserModel,
    TokenModel,



  ]
})
export class SharedAuthModule {}
