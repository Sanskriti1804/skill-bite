import { createRemoteJWKSet, jwtVerify } from "jose";

export type GoogleIdentity = {
  subject: string;
  email: string;
  emailVerified: boolean;
};

export interface GoogleVerifier {
  verify(identityToken: string): Promise<GoogleIdentity>;
}

const googleKeys = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export function googleJwksVerifier(audience: string): GoogleVerifier {
  return {
    async verify(identityToken: string): Promise<GoogleIdentity> {
      const { payload } = await jwtVerify(identityToken, googleKeys, {
        issuer: ["https://accounts.google.com", "accounts.google.com"],
        audience,
      });
      const email = typeof payload.email === "string" ? payload.email : "";
      return {
        subject: String(payload.sub),
        email,
        emailVerified: payload.email_verified === true,
      };
    },
  };
}
