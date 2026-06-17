import { IsBoolean, IsIn, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class NotificationChannelPreferenceDto {
  @IsBoolean()
  emailEnabled!: boolean;

  @IsBoolean()
  inAppEnabled!: boolean;
}

export class UpdateNotificationPreferencesDto {
  @IsIn(["off", "instant", "daily"])
  emailFrequency!: "off" | "instant" | "daily";

  @ValidateNested()
  @Type(() => NotificationChannelPreferenceDto)
  ai!: NotificationChannelPreferenceDto;

  @ValidateNested()
  @Type(() => NotificationChannelPreferenceDto)
  documents!: NotificationChannelPreferenceDto;

  @ValidateNested()
  @Type(() => NotificationChannelPreferenceDto)
  drivers!: NotificationChannelPreferenceDto;

  @ValidateNested()
  @Type(() => NotificationChannelPreferenceDto)
  incidents!: NotificationChannelPreferenceDto;

  @ValidateNested()
  @Type(() => NotificationChannelPreferenceDto)
  loads!: NotificationChannelPreferenceDto;

  @ValidateNested()
  @Type(() => NotificationChannelPreferenceDto)
  system!: NotificationChannelPreferenceDto;
}
