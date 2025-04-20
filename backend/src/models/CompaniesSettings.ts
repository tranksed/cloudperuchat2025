/**
 * @TercioSantos-0 |
 * model/CompaniesSettings |
 * @descrição:modelo para tratar as configurações das empresas
 */
import {
    Table,
    Column,
    CreatedAt,
    UpdatedAt,
    Model,
    PrimaryKey,
    AutoIncrement,
    ForeignKey,
    BelongsTo
  } from "sequelize-typescript";
  import Company from "./Company";


  @Table({ tableName: "CompaniesSettings" })
  class CompaniesSettings extends Model<CompaniesSettings> {
    @PrimaryKey
    @AutoIncrement
    @Column
    id: number;

    @ForeignKey(() => Company)
    @Column
    companyId: number;

    @BelongsTo(() => Company)
    company: Company;

    @Column
    hoursCloseTicketsAuto: string;

    @Column
    chatBotType: string;

    @Column
    acceptCallWhatsapp: string;

    //inicio de opções: enabled ou disabled
    @Column
    userRandom: string;

    @Column
    sendGreetingMessageOneQueues: string;

    @Column
    sendSignMessage: string;

    @Column
    sendFarewellWaitingTicket: string;

    @Column
    userRating: string;

    @Column
    sendGreetingAccepted: string;

    @Column
    CheckMsgIsGroup: string;

    @Column
    sendQueuePosition: string;

    @Column
    scheduleType: string;

    @Column
    acceptAudioMessageContact: string;

    @Column
    sendMsgTransfTicket: string;

    @Column
    enableLGPD: string;

    @Column
    requiredTag: string;

    @Column
    lgpdDeleteMessage: string;

    @Column
    lgpdHideNumber: string;

    @Column
    lgpdConsent: string;

    @Column
    lgpdLink: string

    //fim de opções: enabled ou disabled
    @Column
    lgpdMessage: string

    @Column
    asaas: string;

    @Column
    tokenixc: string;

    @Column
    ipixc: string;

    @Column
    ipmkauth: string;

    @Column
    clientidmkauth: string;

    @Column
    clientsecretmkauth: string;

    @Column
    sendMessageOutExpedientTicketOpen: string;

    @CreatedAt
    createdAt: Date;

    @UpdatedAt
    updatedAt: Date;
  }

  export default CompaniesSettings;
