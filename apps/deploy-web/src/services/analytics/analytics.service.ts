export type AnalyticsUser = {
  id?: string;
  anonymous?: boolean;
  emailVerified?: boolean;
  custodialWallet?: boolean;
};

export type EventProperties = Record<string, unknown>;

export class AnalyticsService {
  identify(_user: AnalyticsUser): void {}
  trackSwitch(_eventName: string, _value: string, _target?: string): void {}
  track(eventName: string, target?: string): void;
  track(eventName: string, eventProperties: EventProperties, target?: string): void;
  track(_eventName: string, _propsOrTarget?: EventProperties | string, _target?: string): void {}
}
