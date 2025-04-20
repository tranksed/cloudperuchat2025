import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
  AutoIncrement,
  DataType
} from "sequelize-typescript";

import User from "./User";
import Company from "./Company";

@Table({ tableName: "Plantao" })
class Plantao extends Model<Plantao> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  phone: string;

  @Column({ type: DataType.JSONB })
  days: [];

  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @Column
  interval: number;

}

export default Plantao;
