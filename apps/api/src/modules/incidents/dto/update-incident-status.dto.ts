import { IsIn } from "class-validator";

export class UpdateIncidentStatusDto {
  @IsIn(["open", "investigating", "monitoring", "resolved", "closed"])
  status!: "open" | "investigating" | "monitoring" | "resolved" | "closed";
}
