import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

// Generate secret key (64 karakter hex)
export const generateSecretKey = () => crypto.randomBytes(32).toString('hex');

// Generate anonymousId unik
export const generateAnonymousId = () => `MESH-${uuidv4().split('-')[0].toUpperCase()}`;