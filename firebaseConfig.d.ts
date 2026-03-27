import { Auth } from 'firebase/auth';
import { FirebaseDatabase } from 'firebase/database';

declare const auth: Auth;
declare const db: FirebaseDatabase;
export { auth, db };
