import { Use } from "@lactose/milk-orm";
import { identifier, text, bool, timestamped } from "@lactose/milk-orm/core";

@Use()
export class Example {
  id = identifier();
  title = text(100);
  completed = bool({ default: false });
  createdAt = timestamped();
}
