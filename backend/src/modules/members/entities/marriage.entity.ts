import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Member } from './member.entity';

@Entity('marriages')
export class Marriage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'memberAId' })
  memberAId: number;

  @ManyToOne(() => Member, (member) => member.marriagesAsA, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'memberAId' })
  memberA: Member;

  @Column({ name: 'memberBId' })
  memberBId: number;

  @ManyToOne(() => Member, (member) => member.marriagesAsB, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'memberBId' })
  memberB: Member;

  @Column({ type: 'varchar', default: 'ACTIVE' })
  status: string;

  @Column({ name: 'marriedAt', type: 'timestamp', nullable: true })
  marriedAt: Date | null;

  @Column({ name: 'endedAt', type: 'timestamp', nullable: true })
  endedAt: Date | null;

  @CreateDateColumn({ name: 'createdAt', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'timestamp' })
  updatedAt: Date;
}
