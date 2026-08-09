import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Member } from './member.entity';

@Entity('families')
export class Family {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ name: 'originPlace', type: 'varchar', nullable: true })
  originPlace?: string | null;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'int', default: 1 })
  generations!: number;

  @Column({ name: 'membersCount', type: 'int', default: 0 })
  membersCount!: number;

  @Column({ name: 'coverImageUrl', type: 'varchar', nullable: true })
  coverImageUrl?: string | null;

  @Column({ name: 'coverImagePublicId', type: 'varchar', nullable: true })
  coverImagePublicId?: string | null;

  @CreateDateColumn({ name: 'createdAt', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'timestamp' })
  updatedAt!: Date;

  @OneToMany(() => Member, (member) => member.family)
  members!: Member[];
}
