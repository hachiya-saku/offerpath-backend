export class UserProfileDto {
  id!: string;
  email!: string;
  displayName!: string;
  bio!: string | null;
  location!: string | null;
  avatarUrl!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}
