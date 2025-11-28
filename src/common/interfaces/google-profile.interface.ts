export interface GoogleProfile {
  id: string;
  displayName: string;
  name: {
    familyName: string;
    givenName: string;
  };
  emails: Array<{
    value: string;
    verified?: boolean;
  }>;
  photos: Array<{
    value: string;
  }>;
  provider: string;
}
