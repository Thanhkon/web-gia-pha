import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Member } from './member.entity';

@Entity('parent_child_relations')
export class ParentChildRelation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'parentId' })
  parentId: number;

  @ManyToOne(() => Member, (member) => member.childRelations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parentId' })
  parent: Member;

  @Column({ name: 'childId' })
  childId: number;

  @ManyToOne(() => Member, (member) => member.parentRelations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'childId' })
  child: Member;

  @Column({ name: 'relationType', default: 'parent' })
  relationType: string;

  @CreateDateColumn({ name: 'createdAt', type: 'timestamp' })
  createdAt: Date;
}
