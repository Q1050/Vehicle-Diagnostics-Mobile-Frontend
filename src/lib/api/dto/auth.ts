export interface UserDto {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}
export interface AuthResponseDto {
  user: UserDto;
  access_token: string;
  token_type: "bearer";
  expires_at: string;
}
