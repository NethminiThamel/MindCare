import type { User } from '../types';

export const ANONYMOUS_STUDENT_NAME = 'Anonymous Student';

export function isStudentAnonymous(
  student: Pick<User, 'isAnonymous'> | null | undefined,
  appointmentIsAnonymous = false
) {
  return appointmentIsAnonymous || Boolean(student?.isAnonymous);
}

export function studentAnonymousTag(
  student: Pick<User, 'id'> | null | undefined
) {
  return student?.id ? `#${student.id.slice(-4).toUpperCase()}` : undefined;
}

export function studentDisplayName(
  student: Pick<User, 'id' | 'name' | 'isAnonymous'> | null | undefined,
  appointmentIsAnonymous = false
) {
  if (!isStudentAnonymous(student, appointmentIsAnonymous)) {
    return student?.name ?? 'Student';
  }

  const anonymousTag = studentAnonymousTag(student);
  return `${ANONYMOUS_STUDENT_NAME}${anonymousTag ? ` ${anonymousTag}` : ''}`;
}