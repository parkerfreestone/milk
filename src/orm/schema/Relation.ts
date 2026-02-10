export type RelationType = "belongsTo" | "hasMany" | "hasOne";

export class Relation {
  constructor(
    public type: RelationType,
    public getTarget: () => any,
    public foreignKey?: string,
    public localKey: string = "id",
  ) {}
}
