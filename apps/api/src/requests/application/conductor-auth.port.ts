export const CONDUCTOR_AUTH = Symbol('CONDUCTOR_AUTH');

export interface ConductorAuthPort {
  matches(conductorSecret: string): boolean;
}
