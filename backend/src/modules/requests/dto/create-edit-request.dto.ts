import { EditRequestChanges } from '../entities/edit-request.entity';

export class CreateEditRequestDto {
    targetMemberId: number;
    requestType?: string;
    changes: EditRequestChanges;
    reason: string;
    submittedByName: string;
    submittedByPhone?: string | null;
  }
