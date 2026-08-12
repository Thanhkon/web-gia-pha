import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Family } from './family.entity';
import { Marriage } from './marriage.entity';
import { ParentChildRelation } from './parent-child-relation.entity';
import { User } from '../../users/entities/user.entity';

@Entity('members')
export class Member {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', name: 'userId', nullable: true })
  userId?: number | null;

  @Column({ name: 'familyId' })
  familyId?: number;

  @ManyToOne(() => Family, (family) => family.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'familyId' })
  family!: Family;

  @Column({ name: 'fullName' })
  fullName?: string;

  @Column({ name: 'otherName', type: 'varchar', nullable: true })
  otherName?: string | null;

  @Column({ default: 'unknown' })
  gender?: string;

  @Column({ type: 'int', nullable: true })
  generation?: number | null;

  @Column({ type: 'varchar', nullable: true })
  role?: string | null;

  @Column({ name: 'dateOfBirth', type: 'timestamp', nullable: true })
  dateOfBirth?: Date | null;

  @Column({ default: false })
  isDeceased!: boolean;

  @Column({ default: false })
  isInLaw!: boolean;

  @Column({ name: 'dateOfDeath', type: 'timestamp', nullable: true })
  dateOfDeath?: Date | null;

  @Column({ name: 'placeOfBirth', type: 'varchar', nullable: true })
  placeOfBirth?: string | null;

  @Column({ name: 'currentAddress', type: 'varchar', nullable: true })
  currentAddress?: string | null;

  @Column({ name: 'avatarUrl', type: 'varchar', nullable: true })
  avatarUrl?: string | null;

  @Column({ name: 'avatarPublicId', type: 'varchar', nullable: true })
  avatarPublicId?: string | null;

  @Column({ type: 'varchar', nullable: true })
  education?: string | null;

  @Column({ type: 'varchar', nullable: true })
  occupation?: string | null;

  @Column({ type: 'text', nullable: true })
  biography?: string | null;

  @Column({ type: 'text', nullable: true })
  note?: string | null;

  @CreateDateColumn({ name: 'createdAt', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'timestamp' })
  updatedAt!: Date;

  @OneToMany(() => ParentChildRelation, (relation) => relation.parent)
  childRelations!: ParentChildRelation[];

  @OneToMany(() => ParentChildRelation, (relation) => relation.child)
  parentRelations!: ParentChildRelation[];

  @OneToMany(() => Marriage, (marriage) => marriage.memberA)
  marriagesAsA!: Marriage[];

  @OneToMany(() => Marriage, (marriage) => marriage.memberB)
  marriagesAsB!: Marriage[];

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user?: User;
}
