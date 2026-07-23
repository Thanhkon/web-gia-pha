export const MOCK_PERSONS = [
  { id: '1', fullName: 'Nguyễn Văn A', gender: 'male', birthYear: 1940, isDeceased: true, generation: 1, role: 'Trưởng tộc' },
  { id: '2', fullName: 'Lê Thị B', gender: 'female', birthYear: 1945, isDeceased: false, isInLaw: true, generation: 1 },
  { id: '3', fullName: 'Nguyễn Văn C', gender: 'male', birthYear: 1968, isDeceased: false, generation: 2, role: 'Trưởng chi' },
  { id: '4', fullName: 'Trần Thị D', gender: 'female', birthYear: 1970, isInLaw: true, generation: 2 },
  { id: '5', fullName: 'Nguyễn Thị E', gender: 'female', birthYear: 1972, isDeceased: false, generation: 2 },
  { id: '7', fullName: 'Nguyễn Văn G', gender: 'male', birthYear: 1995, generation: 3 },
  { id: '8', fullName: 'Nguyễn Thị H', gender: 'female', birthYear: 1998, generation: 3 },
  { id: '9', fullName: 'Hoàng Văn K', gender: 'male', birthYear: 2000, generation: 3 },
  { id: '10', fullName: 'Lê Văn Phụ', gender: 'male', birthYear: 1969, isInLaw: true, generation: 2 },
  { id: '11', fullName: 'Phạm Thị M (Vợ 2)', gender: 'female', birthYear: 1975, isInLaw: true, generation: 2 },
  { id: '12', fullName: 'Nguyễn Văn N', gender: 'male', birthYear: 2005, generation: 3 }
];

export const MOCK_RELATIONSHIPS = [
  { type: 'marriage', person_a: '1', person_b: '2' },
  { type: 'biological_child', person_a: '1', person_b: '3' },
  { type: 'biological_child', person_a: '1', person_b: '5' },
  { type: 'marriage', person_a: '3', person_b: '4' },
  { type: 'marriage', person_a: '5', person_b: '10' },
  { type: 'biological_child', person_a: '3', person_b: '7' },
  { type: 'biological_child', person_a: '4', person_b: '7' },
  { type: 'biological_child', person_a: '3', person_b: '8' },
  { type: 'biological_child', person_a: '4', person_b: '8' },
  { type: 'biological_child', person_a: '5', person_b: '9' },
  { type: 'marriage', person_a: '3', person_b: '11' },
  { type: 'biological_child', person_a: '3', person_b: '12' },
  { type: 'biological_child', person_a: '11', person_b: '12' }
];
