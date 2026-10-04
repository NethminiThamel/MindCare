import type { User } from '../types';

export const ANONYMOUS_STUDENT_NAME = 'Anonymous Student';

export function isStudentAnonymous(
  student: Pick<User, 'isAnonymous'> | null | undefined,
  appointmentIsAnonymous = false
) {
  return appointmentIsAnonymous || Boolean(student?.isAnonymous);
}

export function studentDisplayName(
  student: Pick<User, 'id' | 'name' | 'isAnonymous'> | null | undefined,
  appointmentIsAnonymous = false
) {
  return isStudentAnonymous(student, appointmentIsAnonymous)
    ? student?.id
      ? `${ANONYMOUS_STUDENT_NAME} #${student.id.slice(-4).toUpperCase()}`
      : ANONYMOUS_STUDENT_NAME
    : student?.name ?? 'Student';
}