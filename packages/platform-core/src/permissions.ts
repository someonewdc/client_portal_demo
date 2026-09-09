const PERMISSION_CODE_PATTERN = /^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9]*)*$/;
const MAX_PERMISSION_CODE_LENGTH = 100;

export class InvalidPermissionCodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = InvalidPermissionCodeError.name;
  }
}

export function isPermissionCode(value: string): boolean {
  return (
    value.length > 0 &&
    value.length <= MAX_PERMISSION_CODE_LENGTH &&
    PERMISSION_CODE_PATTERN.test(value)
  );
}

export function normalizePermissionCodes(values: Iterable<string>): readonly string[] {
  const unique = new Set<string>();

  for (const value of values) {
    if (!isPermissionCode(value)) {
      throw new InvalidPermissionCodeError(`Invalid permission code: ${value}`);
    }
    unique.add(value);
  }

  return Object.freeze([...unique].sort());
}

export function hasAllPermissions(
  available: Iterable<string>,
  required: Iterable<string>,
): boolean {
  const granted = new Set(normalizePermissionCodes(available));
  return normalizePermissionCodes(required).every((permission) => granted.has(permission));
}

export function hasAnyPermission(available: Iterable<string>, required: Iterable<string>): boolean {
  const granted = new Set(normalizePermissionCodes(available));
  return normalizePermissionCodes(required).some((permission) => granted.has(permission));
}
